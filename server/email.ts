import { BrevoClient } from "@getbrevo/brevo";

const OTP_EXPIRY_MINUTES = 10;

let brevoClient: BrevoClient | null = null;

function getConfig() {
  return {
    apiKey: process.env.BREVO_API_KEY?.trim() ?? "",
    fromEmail: process.env.EMAIL_FROM_ADDRESS?.trim() ?? "",
    fromName: process.env.EMAIL_FROM_NAME?.trim() || "SkyObserv",
  };
}

export function isEmailConfigured(): boolean {
  const { apiKey, fromEmail } = getConfig();
  return Boolean(apiKey && fromEmail && apiKey.startsWith("xkeysib-"));
}

function getClient(): BrevoClient {
  const { apiKey } = getConfig();
  if (!apiKey) throw new Error("BREVO_API_KEY is not configured");
  if (!apiKey.startsWith("xkeysib-")) {
    throw new Error("Use a Brevo REST API key (xkeysib-...) in BREVO_API_KEY");
  }
  if (!brevoClient) {
    brevoClient = new BrevoClient({ apiKey });
  }
  return brevoClient;
}

export async function sendPasswordResetOtp(email: string, code: string): Promise<void> {
  const { fromEmail, fromName } = getConfig();
  if (!fromEmail) throw new Error("EMAIL_FROM_ADDRESS is not configured");

  const subject = `${code} is your SkyObserv password reset code`;
  const text = [
    `Your SkyObserv password reset code is ${code}.`,
    `It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    "If you didn't request this, you can ignore this email.",
  ].join("\n");
  const html = [
    `<p>Your SkyObserv password reset code is <strong style="font-size:20px;letter-spacing:2px">${code}</strong>.</p>`,
    `<p>It expires in ${OTP_EXPIRY_MINUTES} minutes.</p>`,
    "<p>If you didn't request this, you can ignore this email.</p>",
  ].join("");

  await getClient().transactionalEmails.sendTransacEmail({
    sender: { email: fromEmail, name: fromName },
    to: [{ email }],
    subject,
    textContent: text,
    htmlContent: html,
  });
}

export { OTP_EXPIRY_MINUTES };
