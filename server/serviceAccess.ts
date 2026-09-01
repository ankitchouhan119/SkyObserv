import { eq } from "drizzle-orm";
import type { Request } from "express";
import { db } from "./db";
import { serviceRegistrations, skyobservUsers, type SkyobservUser } from "@shared/schema";
import { getAccountOwnerId } from "./teamAccess";

export async function getAllowedServicesForUser(user: SkyobservUser): Promise<string[]> {
  if (user.isAdmin || user.allowedServices.includes("*")) {
    return ["*"];
  }

  const ownerId = getAccountOwnerId(user);

  const rows = await db
    .select({ serviceName: serviceRegistrations.serviceName })
    .from(serviceRegistrations)
    .where(eq(serviceRegistrations.userId, ownerId));

  return rows.map((row) => row.serviceName);
}

export async function getAllowedServices(req: Request): Promise<string[]> {
  const user = req.user;
  if (!user) return ["*"];
  return getAllowedServicesForUser(user);
}

export async function registerServiceForToken(
  apiToken: string,
  serviceName: string,
  serviceInstance?: string,
): Promise<{ userId: number; email: string } | null> {
  const rows = await db
    .select()
    .from(skyobservUsers)
    .where(eq(skyobservUsers.apiToken, apiToken))
    .limit(1);

  const user = rows[0];
  if (!user) return null;
  if (user.invitedByUserId) return null;

  const existing = await db
    .select()
    .from(serviceRegistrations)
    .where(eq(serviceRegistrations.userId, user.id));

  const duplicate = existing.find((row) => row.serviceName === serviceName);
  if (duplicate) {
    await db
      .update(serviceRegistrations)
      .set({
        serviceInstance: serviceInstance ?? duplicate.serviceInstance,
        lastSeenAt: new Date(),
      })
      .where(eq(serviceRegistrations.id, duplicate.id));
  } else {
    await db.insert(serviceRegistrations).values({
      userId: user.id,
      serviceName,
      serviceInstance,
    });
  }

  return { userId: user.id, email: user.email };
}
