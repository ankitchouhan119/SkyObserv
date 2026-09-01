import { pgTable, text, serial, jsonb, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const skyobservUsers = pgTable("skyobserv_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull().default(""),
  contactNumber: text("contact_number"),
  organisation: text("organisation"),
  invitedByUserId: integer("invited_by_user_id"),
  passwordHash: text("password_hash").notNull(),
  apiToken: text("api_token").notNull().unique(),
  isAdmin: boolean("is_admin").notNull().default(false),
  allowedServices: jsonb("allowed_services").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const passwordResetOtps = pgTable("password_reset_otps", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  otpHash: text("otp_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const serviceRegistrations = pgTable("service_registrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => skyobservUsers.id, { onDelete: "cascade" }),
  serviceName: text("service_name").notNull(),
  serviceInstance: text("service_instance"),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const storageBackends = pgTable("storage_backends", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => skyobservUsers.id, { onDelete: "cascade" }),
  serviceName: text("service_name"),
  kind: text("kind").notNull(),
  endpoint: text("endpoint").notNull(),
  label: text("label"),
  createdAt: timestamp("created_at").defaultNow(),
});

// We'll add a table for saved views/preferences to demonstrate persistence
// capable of extending the observability platform (e.g. for the AI features later)
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // e.g., "favorite_services", "theme"
  value: jsonb("value").notNull(),     // Flexible JSON storage
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === BASE SCHEMAS ===
export const insertUserPreferenceSchema = createInsertSchema(userPreferences).omit({ 
  id: true, 
  updatedAt: true 
});

export const insertSkyobservUserSchema = createInsertSchema(skyobservUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// === EXPLICIT API CONTRACT TYPES ===
export type SkyobservUser = typeof skyobservUsers.$inferSelect;
export type InsertSkyobservUser = z.infer<typeof insertSkyobservUserSchema>;
export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = z.infer<typeof insertUserPreferenceSchema>;
export type StorageBackend = typeof storageBackends.$inferSelect;

// Request types
export type SavePreferenceRequest = InsertUserPreference;

// SkyWalking GraphQL Types (Mirrored for Frontend/BFF type safety)
// These define the shape of data we expect from SkyWalking
export interface SkyWalkingService {
  id: string;
  name: string;
  group?: string;
}

export interface SkyWalkingMetric {
  id: string;
  value: number;
}

export interface SkyWalkingTrace {
  key: string;
  operationNames: string[];
  duration: number;
  start: string;
  isError: boolean;
  traceIds: string[];
}

export interface Duration {
  start: string;
  end: string;
  step: "MINUTE" | "HOUR" | "DAY";
}
