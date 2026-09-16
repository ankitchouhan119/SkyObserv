import { randomInt } from "crypto";
import { prisma } from "./db";
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

  const user = await prisma.skyobservUser.findUnique({
    where: { email: normalized },
    select: { id: true },
  });

  if (!user) {
    return { message: "If that email is registered, we sent a reset code." };
  }

  const code = generateOtpCode();
  const otpHash = hashPassword(code);

  await prisma.passwordResetOtp.deleteMany({ where: { email: normalized } });
  await prisma.passwordResetOtp.create({
    data: { email: normalized, otpHash, expiresAt: otpExpiryDate() },
  });

  try {
    await sendPasswordResetOtp(normalized, code);
  } catch (err) {
    await prisma.passwordResetOtp.deleteMany({ where: { email: normalized } });
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

  const record = await prisma.passwordResetOtp.findFirst({
    where: { email: normalized, expiresAt: { gt: new Date() } },
  });

  if (!record || !verifyPassword(code, record.otpHash)) {
    return "Invalid or expired reset code";
  }

  const user = await prisma.skyobservUser.findUnique({ where: { email: normalized } });
  if (!user) return "No account found for this email";

  await prisma.skyobservUser.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(newPassword), updatedAt: new Date() },
  });

  await prisma.passwordResetOtp.deleteMany({ where: { email: normalized } });
  await prisma.passwordResetOtp.deleteMany({ where: { expiresAt: { lt: new Date() } } });

  return null;
}
