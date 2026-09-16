import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import pg from "pg";
import { getDatabaseConnectionOptions } from "@shared/database-url";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// pg.Pool is kept only for connect-pg-simple (session store in production).
const { Pool } = pg;
const opts = getDatabaseConnectionOptions(process.env.DATABASE_URL);
export const pool = new Pool({
  host: opts.host,
  port: opts.port,
  user: opts.user,
  password: opts.password,
  database: opts.database,
  ...(opts.ssl ? { ssl: opts.ssl } : {}),
  connectionTimeoutMillis: 120_000,
});

pool.on("error", (err) => {
  console.error("[db] Unexpected pool error:", err.message);
});
