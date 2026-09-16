import type { SkyobservUser as PrismaSkyobservUser } from "@prisma/client";
import { z } from "zod";

// Re-export Prisma types as the canonical user type used across the app.
export type SkyobservUser = PrismaSkyobservUser;
export type StorageBackend = {
  id: number;
  userId: number;
  serviceName: string | null;
  kind: string;
  endpoint: string;
  label: string | null;
  createdAt: Date | null;
};
export type UserPreference = {
  id: number;
  key: string;
  value: unknown;
  updatedAt: Date | null;
};
export type InsertSkyobservUser = Omit<SkyobservUser, "id" | "createdAt" | "updatedAt">;

// Zod schemas for API validation
export const insertUserPreferenceSchema = z.object({
  key: z.string(),
  value: z.unknown(),
});

export const insertSkyobservUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().default(""),
  contactNumber: z.string().nullable().optional(),
  organisation: z.string().nullable().optional(),
  passwordHash: z.string(),
  apiToken: z.string(),
  isAdmin: z.boolean().default(false),
  allowedServices: z.array(z.string()).default([]),
});

export type SavePreferenceRequest = z.infer<typeof insertUserPreferenceSchema>;

// SkyWalking GraphQL Types (Mirrored for Frontend/BFF type safety)
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
