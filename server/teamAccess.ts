import { randomBytes } from "crypto";
import { prisma } from "./db";
import type { SkyobservUser } from "@shared/schema";
import { hashPassword } from "./password";
import { generateApiToken } from "./tokens";
import { isValidEmail, normalizeEmail } from "./passwordReset";

export function getAccountOwnerId(user: SkyobservUser): number {
  return user.invitedByUserId ?? user.id;
}

export function canManageTeam(user: SkyobservUser): boolean {
  return !user.invitedByUserId;
}

export function generateTempPassword(): string {
  const chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(12);
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

export async function listTeamMembers(ownerId: number) {
  return prisma.skyobservUser.findMany({
    where: { invitedByUserId: ownerId },
    select: { id: true, email: true, fullName: true, contactNumber: true, createdAt: true },
  });
}

export async function inviteTeamMember(
  owner: SkyobservUser,
  email: string,
  fullName: string,
): Promise<{ member: { id: number; email: string; fullName: string }; tempPassword: string } | { error: string }> {
  if (!canManageTeam(owner)) {
    return { error: "Only the account owner can invite team members" };
  }

  const normalized = normalizeEmail(email);
  const trimmedName = fullName.trim();

  if (!isValidEmail(normalized)) return { error: "Enter a valid email address" };
  if (!trimmedName || trimmedName.length < 2) return { error: "Full name is required" };
  if (normalized === owner.email) return { error: "You cannot invite yourself" };

  const existingUser = await prisma.skyobservUser.findUnique({ where: { email: normalized } });
  if (existingUser) {
    if (existingUser.invitedByUserId === owner.id) {
      return resetTeamMemberPassword(owner, existingUser.id);
    }
    return { error: "An account with this email already exists" };
  }

  const tempPassword = generateTempPassword();
  const member = await prisma.skyobservUser.create({
    data: {
      email: normalized,
      fullName: trimmedName,
      passwordHash: hashPassword(tempPassword),
      apiToken: generateApiToken(),
      invitedByUserId: owner.id,
      isAdmin: false,
      allowedServices: [],
    },
    select: { id: true, email: true, fullName: true },
  });

  return { member, tempPassword };
}

export async function resetTeamMemberPassword(
  owner: SkyobservUser,
  memberId: number,
): Promise<{ member: { id: number; email: string; fullName: string }; tempPassword: string } | { error: string }> {
  if (!canManageTeam(owner)) {
    return { error: "Only the account owner can reset team passwords" };
  }

  const member = await prisma.skyobservUser.findFirst({
    where: { id: memberId, invitedByUserId: owner.id },
  });

  if (!member) return { error: "Team member not found" };

  const tempPassword = generateTempPassword();
  await prisma.skyobservUser.update({
    where: { id: member.id },
    data: { passwordHash: hashPassword(tempPassword), updatedAt: new Date() },
  });

  return {
    member: { id: member.id, email: member.email, fullName: member.fullName },
    tempPassword,
  };
}

export async function removeTeamMember(
  owner: SkyobservUser,
  memberId: number,
): Promise<{ ok: true } | { error: string }> {
  if (!canManageTeam(owner)) {
    return { error: "Only the account owner can remove team members" };
  }

  const member = await prisma.skyobservUser.findFirst({
    where: { id: memberId, invitedByUserId: owner.id },
    select: { id: true },
  });

  if (!member) return { error: "Team member not found" };

  await prisma.skyobservUser.delete({ where: { id: memberId } });
  return { ok: true };
}
