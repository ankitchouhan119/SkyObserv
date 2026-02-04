import { db } from "./db";
import {
  userPreferences,
  type InsertUserPreference,
  type UserPreference,
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getPreference(key: string): Promise<UserPreference | undefined>;
  savePreference(pref: InsertUserPreference): Promise<UserPreference>;
}

export class DatabaseStorage implements IStorage {
  async getPreference(key: string): Promise<UserPreference | undefined> {
    const [pref] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.key, key));
    return pref;
  }

  async savePreference(pref: InsertUserPreference): Promise<UserPreference> {
    const [saved] = await db
      .insert(userPreferences)
      .values(pref)
      .onConflictDoUpdate({
        target: userPreferences.key,
        set: { value: pref.value, updatedAt: new Date() },
      })
      .returning();
    return saved;
  }
}

export const storage = new DatabaseStorage();
