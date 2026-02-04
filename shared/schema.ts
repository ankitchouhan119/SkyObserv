import { pgTable, text, serial, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

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

// === EXPLICIT API CONTRACT TYPES ===
export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = z.infer<typeof insertUserPreferenceSchema>;

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
