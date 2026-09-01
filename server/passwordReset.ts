import { randomInt } from "crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "./db";
import { passwordResetOtps, skyobservUsers } from "@shared/schema";
import { hashPassword, verifyPassword } from "./password";
import { isEmailConfigured, OTP_EXPIRY_MINUTES, sendPasswordResetOtp } from "./email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

function generateOtpCode(): string {
  return String(randomInt(100000, 1000000));
}

function otpExpiryDate(): Date {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
}

export async function requestPasswordResetOtp(email: string): Promise<{ message: string }> {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    return { message: "Enter a valid email address" };
  }
  if (!isEmailConfigured()) {
    return { message: "Email service is not configured on the server" };
  }

  const users = await db
    .select({ id: skyobservUsers.id })
    .from(skyobservUsers)
    .where(eq(skyobservUsers.email, normalized))
    .limit(1);

  // Don't reveal whether the email exists
  if (users.length === 0) {
    return { message: "If that email is registered, we sent a reset code." };
  }

  const code = generateOtpCode();
  const otpHash = hashPassword(code);

  await db.delete(passwordResetOtps).where(eq(passwordResetOtps.email, normalized));
  await db.insert(passwordResetOtps).values({
    email: normalized,
    otpHash,
    expiresAt: otpExpiryDate(),
  });

  try {
    await sendPasswordResetOtp(normalized, code);
  } catch (err) {
    await db.delete(passwordResetOtps).where(eq(passwordResetOtps.email, normalized));
    console.error("[auth] Failed to send reset OTP:", err);
    return { message: "Could not send reset email. Check Brevo configuration." };
  }

  return { message: "If that email is registered, we sent a reset code." };
}

export async function resetPasswordWithOtp(
  email: string,
  otp: string,
  newPassword: string,
): Promise<string | null> {
  const normalized = normalizeEmail(email);
  const code = otp.trim();

  if (!isValidEmail(normalized)) return "Enter a valid email address";
  if (!/^\d{6}$/.test(code)) return "Enter the 6-digit code from your email";
  if (newPassword.length < 8) return "Password must be at least 8 characters";

  const rows = await db
    .select()
    .from(passwordResetOtps)
    .where(
      and(eq(passwordResetOtps.email, normalized), gt(passwordResetOtps.expiresAt, new Date())),
    )
    .limit(1);

  const record = rows[0];
  if (!record || !verifyPassword(code, record.otpHash)) {
    return "Invalid or expired reset code";
  }

  const users = await db
    .select()
    .from(skyobservUsers)
    .where(eq(skyobservUsers.email, normalized))
    .limit(1);

  const user = users[0];
  if (!user) return "No account found for this email";

  await db
    .update(skyobservUsers)
    .set({ passwordHash: hashPassword(newPassword), updatedAt: new Date() })
    .where(eq(skyobservUsers.id, user.id));

  await db.delete(passwordResetOtps).where(eq(passwordResetOtps.email, normalized));

  // Clean up expired OTPs occasionally
  await db.delete(passwordResetOtps).where(lt(passwordResetOtps.expiresAt, new Date()));

  return null;
}
