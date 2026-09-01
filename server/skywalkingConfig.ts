import type { Request } from "express";

/** gRPC collector for SkyWalking agents (port 11800). Server-side only — never shown in user profile. */
export function getSkyWalkingCollectorAddress(): string {
  const explicit = process.env.SKYWALKING_GRPC_COLLECTOR?.trim();
  if (explicit) return explicit;

  const endpoint = process.env.SKYWALKING_ENDPOINT?.trim() || "http://127.0.0.1:12800";
  try {
    const url = new URL(endpoint.includes("://") ? endpoint : `http://${endpoint}`);
    return `${url.hostname}:11800`;
  } catch {
    return "127.0.0.1:11800";
  }
}

/** HTTP collector for browser agents (port 12800). Derived from SKYWALKING_ENDPOINT. */
export function getSkyWalkingHttpCollectorAddress(): string {
  const explicit = process.env.SKYWALKING_HTTP_COLLECTOR?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const endpoint = process.env.SKYWALKING_ENDPOINT?.trim() || "http://127.0.0.1:12800";
  try {
    const url = new URL(endpoint.includes("://") ? endpoint : `http://${endpoint}`);
    const port = url.port || "12800";
    return `${url.protocol}//${url.hostname}:${port}`;
  } catch {
    return "http://127.0.0.1:12800";
  }
}

/** Public SkyObserv URL shown to users in Profile (for SKYOBSERV_REGISTER_URL). */
export function getPublicRegisterUrl(req?: Request): string {
  const configured = process.env.SKYOBSERV_PUBLIC_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  if (req) {
    const host = req.get("host");
    if (host) return `${req.protocol}://${host}`;
  }

  const port = process.env.PORT || "5000";
  return `http://localhost:${port}`;
}

export function buildAgentEnvSnippet(apiToken: string, registerUrl: string, serviceName = "your-service"): string {
  return [
    "SW_AGENT_ENABLED=true",
    `SW_AGENT_NAME=${serviceName}`,
    "SW_AGENT_INSTANCE=your-service-local",
    `SKYOBSERV_USER_TOKEN=${apiToken}`,
    `SKYOBSERV_REGISTER_URL=${registerUrl}`,
  ].join("\n");
}
