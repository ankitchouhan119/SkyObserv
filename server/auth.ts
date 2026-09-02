import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { eq } from "drizzle-orm";
import { db, pool } from "./db";
import { skyobservUsers } from "@shared/schema";
import { hashPassword, verifyPassword } from "./password";
import { generateApiToken } from "./tokens";
import { isValidEmail, normalizeEmail } from "./passwordReset";

const PgSession = connectPgSimple(session);

export function isAuthEnabled(): boolean {
  return process.env.SKYOBSERV_AUTH_ENABLED === "true";
}

export async function ensureAuthSchema(): Promise<void> {
  if (!isAuthEnabled()) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS skyobserv_users (
      id serial PRIMARY KEY,
      email text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      api_token text UNIQUE,
      is_admin boolean NOT NULL DEFAULT false,
      allowed_services jsonb NOT NULL DEFAULT '[]'::jsonb,
      created_at timestamp DEFAULT now(),
      updated_at timestamp DEFAULT now()
    );
  `);

  await pool.query(`
    ALTER TABLE skyobserv_users
      ADD COLUMN IF NOT EXISTS email text,
      ADD COLUMN IF NOT EXISTS full_name text DEFAULT '',
      ADD COLUMN IF NOT EXISTS contact_number text,
      ADD COLUMN IF NOT EXISTS organisation text,
      ADD COLUMN IF NOT EXISTS invited_by_user_id integer,
      ADD COLUMN IF NOT EXISTS api_token text UNIQUE,
      ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'skyobserv_users' AND column_name = 'username'
      ) THEN
        ALTER TABLE skyobserv_users ALTER COLUMN username DROP NOT NULL;
        UPDATE skyobserv_users
        SET email = username
        WHERE email IS NULL AND username LIKE '%@%';
      END IF;
    END $$;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_otps (
      id serial PRIMARY KEY,
      email text NOT NULL,
      otp_hash text NOT NULL,
      expires_at timestamp NOT NULL,
      created_at timestamp DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS service_registrations (
      id serial PRIMARY KEY,
      user_id integer NOT NULL REFERENCES skyobserv_users(id) ON DELETE CASCADE,
      service_name text NOT NULL,
      service_instance text,
      last_seen_at timestamp DEFAULT now(),
      created_at timestamp DEFAULT now(),
      UNIQUE (user_id, service_name)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS storage_backends (
      id serial PRIMARY KEY,
      user_id integer NOT NULL REFERENCES skyobserv_users(id) ON DELETE CASCADE,
      service_name text,
      kind text NOT NULL,
      endpoint text NOT NULL,
      label text,
      created_at timestamp DEFAULT now()
    );
  `);
}

export async function ensureBootstrapAdmin(): Promise<void> {
  if (!isAuthEnabled()) return;

  await ensureAuthSchema();

  const adminEmail = normalizeEmail(
    process.env.SKYOBSERV_ADMIN_EMAIL?.trim() ||
      process.env.SKYOBSERV_ADMIN_USERNAME?.trim() ||
      "",
  );
  const adminPassword = process.env.SKYOBSERV_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword || !isValidEmail(adminEmail)) return;

  const passwordHash = hashPassword(adminPassword);
  const existing = await db
    .select()
    .from(skyobservUsers)
    .where(eq(skyobservUsers.email, adminEmail))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(skyobservUsers).values({
      email: adminEmail,
      fullName: "SkyObserv Admin",
      passwordHash,
      apiToken: generateApiToken(),
      isAdmin: true,
      allowedServices: ["*"],
    });
    console.log(`[auth] Created admin user: ${adminEmail}`);
    return;
  }

  const user = existing[0];
  await db
    .update(skyobservUsers)
    .set({
      fullName: user.fullName || "SkyObserv Admin",
      passwordHash,
      isAdmin: true,
      allowedServices: ["*"],
      apiToken: user.apiToken || generateApiToken(),
      updatedAt: new Date(),
    })
    .where(eq(skyobservUsers.id, user.id));
}

export type CreateUserInput = {
  email: string;
  password: string;
  fullName: string;
  contactNumber?: string;
  organisation?: string;
};

export async function createUser(input: CreateUserInput) {
  const normalized = normalizeEmail(input.email);
  const passwordHash = hashPassword(input.password);
  const [user] = await db
    .insert(skyobservUsers)
    .values({
      email: normalized,
      fullName: input.fullName.trim(),
      contactNumber: input.contactNumber?.trim() || null,
      organisation: input.organisation?.trim() || null,
      passwordHash,
      apiToken: generateApiToken(),
      isAdmin: false,
      allowedServices: [],
    })
    .returning();

  return user;
}

export async function verifyUserCredentials(email: string, password: string) {
  const normalized = normalizeEmail(email);
  if (!normalized || !password) {
    return { user: null, message: "Email and password are required" };
  }

  const rows = await db
    .select()
    .from(skyobservUsers)
    .where(eq(skyobservUsers.email, normalized))
    .limit(1);

  const user = rows[0];
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { user: null, message: "Invalid email or password" };
  }

  return { user, message: null };
}

export function setupAuth(app: Express): void {
  if (!isAuthEnabled()) return;

  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is required when SKYOBSERV_AUTH_ENABLED=true");
  }

  app.set("trust proxy", 1);

  app.use(
    session({
      store: new PgSession({
        pool,
        tableName: "skyobserv_sessions",
        createTableIfMissing: true,
      }),
      secret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure:
          process.env.SESSION_COOKIE_SECURE !== undefined
            ? process.env.SESSION_COOKIE_SECURE === "true"
            : process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, password, done) => {
        try {
          const normalized = normalizeEmail(email);
          const rows = await db
            .select()
            .from(skyobservUsers)
            .where(eq(skyobservUsers.email, normalized))
            .limit(1);

          const user = rows[0];
          if (!user || !verifyPassword(password, user.passwordHash)) {
            return done(null, false, { message: "Invalid email or password" });
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      },
    ),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const rows = await db
        .select()
        .from(skyobservUsers)
        .where(eq(skyobservUsers.id, id))
        .limit(1);
      done(null, rows[0] ?? false);
    } catch (err) {
      done(err);
    }
  });
}

export const requireAuth: RequestHandler = (req, res, next) => {
  if (!isAuthEnabled()) return next();
  if (req.isAuthenticated?.()) return next();
  return res.status(401).json({ message: "Authentication required", authEnabled: true });
};

export function publicUser(user: typeof skyobservUsers.$inferSelect) {
  return {
    email: user.email,
    fullName: user.fullName,
    contactNumber: user.contactNumber,
    organisation: user.organisation,
    apiToken: user.apiToken,
    isAdmin: user.isAdmin,
    isInvitedMember: Boolean(user.invitedByUserId),
    canManageTeam: !user.invitedByUserId,
  };
}
