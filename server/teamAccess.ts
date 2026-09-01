import { randomBytes } from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { skyobservUsers, type SkyobservUser } from "@shared/schema";
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
  const rows = await db
    .select({
      id: skyobservUsers.id,
      email: skyobservUsers.email,
      fullName: skyobservUsers.fullName,
      contactNumber: skyobservUsers.contactNumber,
      createdAt: skyobservUsers.createdAt,
    })
    .from(skyobservUsers)
    .where(eq(skyobservUsers.invitedByUserId, ownerId));

  return rows;
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

  if (!isValidEmail(normalized)) {
    return { error: "Enter a valid email address" };
  }
  if (!trimmedName || trimmedName.length < 2) {
    return { error: "Full name is required" };
  }
  if (normalized === owner.email) {
    return { error: "You cannot invite yourself" };
  }

  const existing = await db
    .select()
    .from(skyobservUsers)
    .where(eq(skyobservUsers.email, normalized))
    .limit(1);

  const existingUser = existing[0];
  if (existingUser) {
    if (existingUser.invitedByUserId === owner.id) {
      return resetTeamMemberPassword(owner, existingUser.id);
    }
    return { error: "An account with this email already exists" };
  }

  const tempPassword = generateTempPassword();
  const [member] = await db
    .insert(skyobservUsers)
    .values({
      email: normalized,
      fullName: trimmedName,
      passwordHash: hashPassword(tempPassword),
      apiToken: generateApiToken(),
      invitedByUserId: owner.id,
      isAdmin: false,
      allowedServices: [],
    })
    .returning({
      id: skyobservUsers.id,
      email: skyobservUsers.email,
      fullName: skyobservUsers.fullName,
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

  const rows = await db
    .select()
    .from(skyobservUsers)
    .where(
      and(eq(skyobservUsers.id, memberId), eq(skyobservUsers.invitedByUserId, owner.id)),
    )
    .limit(1);

  const member = rows[0];
  if (!member) {
    return { error: "Team member not found" };
  }

  const tempPassword = generateTempPassword();
  await db
    .update(skyobservUsers)
    .set({ passwordHash: hashPassword(tempPassword), updatedAt: new Date() })
    .where(eq(skyobservUsers.id, member.id));

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

  const rows = await db
    .select({ id: skyobservUsers.id })
    .from(skyobservUsers)
    .where(
      and(eq(skyobservUsers.id, memberId), eq(skyobservUsers.invitedByUserId, owner.id)),
    )
    .limit(1);

  if (!rows[0]) {
    return { error: "Team member not found" };
  }

  await db.delete(skyobservUsers).where(eq(skyobservUsers.id, memberId));
  return { ok: true };
}
