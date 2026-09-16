import type { Request } from "express";
import { prisma } from "./db";
import type { SkyobservUser } from "@shared/schema";
import { getAccountOwnerId } from "./teamAccess";

async function upsertServiceRegistration(
  user: Pick<SkyobservUser, "id" | "email" | "invitedByUserId">,
  serviceName: string,
  serviceInstance?: string,
): Promise<{ userId: number; email: string } | null> {
  if (user.invitedByUserId) return null;

  const existing = await prisma.serviceRegistration.findFirst({
    where: { userId: user.id, serviceName },
  });

  if (existing) {
    await prisma.serviceRegistration.update({
      where: { id: existing.id },
      data: {
        serviceInstance: serviceInstance ?? existing.serviceInstance,
        lastSeenAt: new Date(),
      },
    });
  } else {
    await prisma.serviceRegistration.create({
      data: { userId: user.id, serviceName, serviceInstance },
    });
  }

  return { userId: user.id, email: user.email };
}

export async function getAllowedServicesForUser(user: SkyobservUser): Promise<string[]> {
  if (user.isAdmin || (user.allowedServices as string[]).includes("*")) {
    return ["*"];
  }

  const ownerId = getAccountOwnerId(user);
  const rows = await prisma.serviceRegistration.findMany({
    where: { userId: ownerId },
    select: { serviceName: true },
  });

  return rows.map((r) => r.serviceName);
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
  const user = await prisma.skyobservUser.findUnique({ where: { apiToken } });
  if (!user) return null;
  return upsertServiceRegistration(user, serviceName, serviceInstance);
}

export async function unregisterServiceForUser(
  user: SkyobservUser,
  serviceName: string,
): Promise<{ ok: true } | { error: string }> {
  if (user.invitedByUserId) {
    return { error: "Only the account owner can remove linked services" };
  }

  const ownerId = getAccountOwnerId(user);
  const normalized = serviceName.trim();
  if (!normalized) return { error: "Service name is required" };

  const deleted = await prisma.serviceRegistration.deleteMany({
    where: { userId: ownerId, serviceName: normalized },
  });

  if (deleted.count === 0) return { error: "Service not found" };
  return { ok: true };
}

export async function unregisterServiceByIdForUser(
  user: SkyobservUser,
  registrationId: number,
): Promise<{ ok: true } | { error: string }> {
  if (user.invitedByUserId) {
    return { error: "Only the account owner can remove linked services" };
  }

  const ownerId = getAccountOwnerId(user);
  const deleted = await prisma.serviceRegistration.deleteMany({
    where: { userId: ownerId, id: registrationId },
  });

  if (deleted.count === 0) return { error: "Service not found" };
  return { ok: true };
}
