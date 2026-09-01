import { randomBytes } from "crypto";

export function generateApiToken(): string {
  return `so_${randomBytes(24).toString("hex")}`;
}
