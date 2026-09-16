import { prisma } from "./db";
import type { SkyobservUser } from "@shared/schema";
import { hashPassword, verifyPassword } from "./password";

export type ProfileUpdateInput = {
  fullName?: string;
  contactNumber?: string;
  organisation?: string;
  currentPassword?: string;
  newPassword?: string;
};

export async function updateUserProfile(
  user: SkyobservUser,
  input: ProfileUpdateInput,
): Promise<{ user: SkyobservUser } | { error: string }> {
  const data: Partial<SkyobservUser> & { updatedAt: Date } = { updatedAt: new Date() };

  if (input.fullName !== undefined) {
    const fullName = input.fullName.trim();
    if (!fullName || fullName.length < 2) {
      return { error: "Full name must be at least 2 characters" };
    }
    data.fullName = fullName;
  }

  if (input.contactNumber !== undefined) {
    const contactNumber = input.contactNumber.trim();
    if (!contactNumber || contactNumber.length < 8) {
      return { error: "Enter a valid contact number" };
    }
    data.contactNumber = contactNumber;
  }

  if (input.organisation !== undefined) {
    data.organisation = input.organisation.trim() || null;
  }

  if (input.newPassword) {
    if (!input.currentPassword) {
      return { error: "Current password is required to set a new password" };
    }
    if (!verifyPassword(input.currentPassword, user.passwordHash)) {
      return { error: "Current password is incorrect" };
    }
    if (input.newPassword.length < 8) {
      return { error: "New password must be at least 8 characters" };
    }
    data.passwordHash = hashPassword(input.newPassword);
  }

  if (Object.keys(data).length === 1) {
    return { error: "No changes to save" };
  }

  const updated = await prisma.skyobservUser.update({
    where: { id: user.id },
    data,
  });

  return { user: updated };
}
