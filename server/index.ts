import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { api } from "@shared/routes";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "./db";
import { userPreferences } from "@shared/schema";
import { eq } from "drizzle-orm";
import {
  createUser,
  ensureBootstrapAdmin,
  isAuthEnabled,
  publicUser,
  requireAuth,
  setupAuth,
  verifyUserCredentials,
} from "./auth";
import {
  assertGraphQLAccess,
  fetchGlobalTopology,
  filterDatabasesForUser,
  filterGraphQLResponse,
  isUnscopedTraceListQuery,
} from "./graphqlAccess";
import { getAllowedServices, registerServiceForToken, unregisterServiceByIdForUser, unregisterServiceForUser } from "./serviceAccess";
import { fetchTracesForAllowedServices } from "./traceQuery";
import { generateApiToken } from "./tokens";
import {
  isValidEmail,
  normalizeEmail,
  requestPasswordResetOtp,
  resetPasswordWithOtp,
} from "./passwordReset";
import {
  buildAgentEnvSnippet,
  getPublicRegisterUrl,
  getSkyWalkingCollectorAddress,
  getSkyWalkingHttpCollectorAddress,
} from "./skywalkingConfig";
import { updateUserProfile } from "./profileUpdate";
import {
  createStorageBackendForUser,
  deleteStorageBackendForUser,
  listStorageBackendsForUser,
} from "./storageBackends";
import {
  canManageTeam,
  getAccountOwnerId,
  inviteTeamMember,
  listTeamMembers,
  removeTeamMember,
  resetTeamMemberPassword,
} from "./teamAccess";
import { serviceRegistrations, skyobservUsers } from "@shared/schema";
import { isNull } from "drizzle-orm";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

const PORT = parseInt(process.env.PORT || "5000", 10);
const isDev = process.env.NODE_ENV !== "production";

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

setupAuth(app);

function log(message: string) {
  const time = new Date().toLocaleTimeString("en-US", { hour12: true });
  console.log(`${time} [server] ${message}`);
}

/* ---------------- AUTH ---------------- */

app.get("/api/auth/status", (_req, res) => {
  res.json({ authEnabled: isAuthEnabled() });
});

app.post("/api/auth/signup", async (req, res) => {
  if (!isAuthEnabled()) {
    return res.status(400).json({ message: "Authentication is disabled" });
  }

  const email = normalizeEmail(String(req.body?.email ?? ""));
  const password = String(req.body?.password ?? "");
  const confirmPassword = String(req.body?.confirmPassword ?? "");
  const fullName = String(req.body?.fullName ?? "").trim();
  const contactNumber = String(req.body?.contactNumber ?? "").trim();
  const organisation = String(req.body?.organisation ?? "").trim();

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Enter a valid email address" });
  }
  if (!fullName || fullName.length < 2) {
    return res.status(400).json({ message: "Full name is required" });
  }
  if (!contactNumber || contactNumber.length < 8) {
    return res.status(400).json({ message: "Enter a valid contact number" });
  }
  if (organisation && organisation.length < 2) {
    return res.status(400).json({ message: "Organisation must be at least 2 characters" });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const existing = await db
      .select({ id: skyobservUsers.id })
      .from(skyobservUsers)
      .where(eq(skyobservUsers.email, email))
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const user = await createUser({
      email,
      password,
      fullName,
      contactNumber,
      organisation,
    });

    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return res.status(201).json({ user: publicUser(user), loginRequired: true });
      }
      return res.status(201).json({ user: publicUser(user) });
    });
  } catch (err) {
    log(`Signup error: ${err}`);
    return res.status(500).json({ message: "Signup failed" });
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  if (!isAuthEnabled()) {
    return res.status(400).json({ message: "Authentication is disabled" });
  }

  const result = await requestPasswordResetOtp(String(req.body?.email ?? ""));
  return res.json(result);
});

app.post("/api/auth/reset-password", async (req, res) => {
  if (!isAuthEnabled()) {
    return res.status(400).json({ message: "Authentication is disabled" });
  }

  const error = await resetPasswordWithOtp(
    String(req.body?.email ?? ""),
    String(req.body?.otp ?? ""),
    String(req.body?.password ?? ""),
  );

  if (error) {
    return res.status(400).json({ message: error });
  }

  return res.json({ ok: true, message: "Password updated. You can sign in now." });
});

app.post("/api/auth/login", (req, res, next) => {
  if (!isAuthEnabled()) {
    return res.status(400).json({ message: "Authentication is disabled" });
  }

  void (async () => {
    try {
      const email = String(req.body?.email ?? "");
      const password = String(req.body?.password ?? "");
      const { user, message } = await verifyUserCredentials(email, password);

      if (!user) {
        return res.status(401).json({ message: message || "Invalid email or password" });
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        return res.json({ user: publicUser(user) });
      });
    } catch (err) {
      next(err);
    }
  })();
});

app.post("/api/auth/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ ok: true });
    });
  });
});

app.get("/api/auth/me", (req, res) => {
  if (!isAuthEnabled()) {
    return res.json({
      authEnabled: false,
      user: { email: "guest", fullName: "Guest", apiToken: "", isAdmin: true },
    });
  }

  if (!req.isAuthenticated?.() || !req.user) {
    return res.status(401).json({ authEnabled: true, message: "Not authenticated" });
  }

  return res.json({
    authEnabled: true,
    user: publicUser(req.user),
  });
});

app.get("/api/profile/services", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });

  const ownerId = getAccountOwnerId(req.user);

  const rows = await db
    .select()
    .from(serviceRegistrations)
    .where(eq(serviceRegistrations.userId, ownerId));

  return res.json({
    services: rows.map((row) => ({
      id: row.id,
      serviceName: row.serviceName,
      serviceInstance: row.serviceInstance,
      lastSeenAt: row.lastSeenAt,
    })),
  });
});

app.delete("/api/profile/services/:serviceName", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });

  const serviceName = decodeURIComponent(req.params.serviceName ?? "");
  const result = await unregisterServiceForUser(req.user, serviceName);
  if ("error" in result) {
    return res.status(400).json({ message: result.error });
  }

  return res.json({ ok: true });
});

app.post("/api/profile/services/unlink", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });

  const serviceName = String(req.body?.serviceName ?? "").trim();
  const registrationId = Number(req.body?.id);

  let result;
  if (Number.isFinite(registrationId) && registrationId > 0) {
    result = await unregisterServiceByIdForUser(req.user, registrationId);
  } else {
    result = await unregisterServiceForUser(req.user, serviceName);
  }

  if ("error" in result) {
    return res.status(400).json({ message: result.error });
  }

  return res.json({ ok: true });
});

app.get("/api/storage-backends", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });

  const backends = await listStorageBackendsForUser(req.user);
  return res.json({ backends });
});

app.post("/api/storage-backends", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });

  const result = await createStorageBackendForUser(req.user, {
    endpoint: String(req.body?.endpoint ?? ""),
    kind: req.body?.kind ? String(req.body.kind) : undefined,
    serviceName: req.body?.serviceName ? String(req.body.serviceName) : undefined,
    label: req.body?.label ? String(req.body.label) : undefined,
  });

  if ("error" in result) {
    return res.status(400).json({ message: result.error });
  }

  return res.status(201).json({ backend: result });
});

app.delete("/api/storage-backends/:id", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });

  const backendId = Number(req.params.id);
  if (!Number.isFinite(backendId)) {
    return res.status(400).json({ message: "Invalid storage backend id" });
  }

  const result = await deleteStorageBackendForUser(req.user, backendId);
  if ("error" in result) {
    return res.status(400).json({ message: result.error });
  }

  return res.json({ ok: true });
});

app.patch("/api/profile", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });

  const result = await updateUserProfile(req.user, {
    fullName: req.body?.fullName,
    contactNumber: req.body?.contactNumber,
    organisation: req.body?.organisation,
    currentPassword: req.body?.currentPassword,
    newPassword: req.body?.newPassword,
  });

  if ("error" in result) {
    return res.status(400).json({ message: result.error });
  }

  return res.json({ user: publicUser(result.user) });
});

app.get("/api/profile/team", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  if (!canManageTeam(req.user)) {
    return res.status(403).json({ message: "Only the account owner can manage team members" });
  }

  const members = await listTeamMembers(req.user.id);
  return res.json({ members });
});

app.post("/api/profile/team/invite", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });

  const result = await inviteTeamMember(
    req.user,
    String(req.body?.email ?? ""),
    String(req.body?.fullName ?? ""),
  );

  if ("error" in result) {
    return res.status(400).json({ message: result.error });
  }

  return res.status(201).json({
    member: result.member,
    tempPassword: result.tempPassword,
    message: "Copy this temporary password now. It will not be shown again.",
  });
});

app.post("/api/profile/team/:memberId/reset-password", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });

  const memberId = Number(req.params.memberId);
  if (!Number.isFinite(memberId)) {
    return res.status(400).json({ message: "Invalid team member" });
  }

  const result = await resetTeamMemberPassword(req.user, memberId);
  if ("error" in result) {
    return res.status(400).json({ message: result.error });
  }

  return res.json({
    member: result.member,
    tempPassword: result.tempPassword,
    message: "Copy this temporary password now. It will not be shown again.",
  });
});

app.delete("/api/profile/team/:memberId", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });

  const memberId = Number(req.params.memberId);
  if (!Number.isFinite(memberId)) {
    return res.status(400).json({ message: "Invalid team member" });
  }

  const result = await removeTeamMember(req.user, memberId);
  if ("error" in result) {
    return res.status(400).json({ message: result.error });
  }

  return res.json({ ok: true });
});

app.post("/api/profile/regenerate-token", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  if (req.user.invitedByUserId) {
    return res.status(403).json({ message: "Only the account owner can manage the API token" });
  }

  const [updated] = await db
    .update(skyobservUsers)
    .set({ apiToken: generateApiToken(), updatedAt: new Date() })
    .where(eq(skyobservUsers.id, req.user.id))
    .returning();

  return res.json({ user: publicUser(updated) });
});

app.get("/api/profile/setup", requireAuth, (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  if (req.user.invitedByUserId) {
    return res.status(403).json({
      message: "Agent registration is only available for the account owner",
    });
  }

  const registerUrl = getPublicRegisterUrl(req);

  return res.json({
    registerUrl,
    envSnippet: buildAgentEnvSnippet(req.user.apiToken, registerUrl),
  });
});

app.post("/api/agent/register", async (req, res) => {
  const header = req.headers.authorization ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const token = bearer || String(req.body?.token ?? "").trim();
  const serviceName = String(req.body?.serviceName ?? "").trim();
  const serviceInstance = String(req.body?.serviceInstance ?? "").trim() || undefined;

  if (!token) {
    return res.status(401).json({ message: "Missing SKYOBSERV user token" });
  }
  if (!serviceName) {
    return res.status(400).json({ message: "serviceName is required" });
  }

  const result = await registerServiceForToken(token, serviceName, serviceInstance);
  if (!result) {
    return res.status(401).json({ message: "Invalid user token" });
  }

  log(`Service registered: ${serviceName} → ${result.email}`);
  return res.json({
    ok: true,
    serviceName,
    email: result.email,
    collectorAddress: getSkyWalkingCollectorAddress(),
    httpCollectorAddress: getSkyWalkingHttpCollectorAddress(),
  });
});

/* ---------------- RUNTIME CONFIG ENDPOINT ---------------- */

app.get("/config", requireAuth, (_, res) => {
  res.json({
    tamboApiKey: process.env.TAMBO_API_KEY || "",
  });
});

/* ---------------- API ROUTES ---------------- */

app.get(api.preferences.get.path, requireAuth, async (req, res) => {
  try {
    const key = String(req.params.key);
    const rows = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.key, key))
      .limit(1);
    res.json(rows[0] ?? { key, value: {} });
  } catch (err) {
    log(`DB read error: ${err}`);
    res.status(500).json({ error: "Failed to fetch preference" });
  }
});

app.post(api.preferences.save.path, requireAuth, async (req, res) => {
  try {
    const { key, value } = req.body;
    const [row] = await db
      .insert(userPreferences)
      .values({ key, value })
      .onConflictDoUpdate({
        target: userPreferences.key,
        set: { value, updatedAt: new Date() },
      })
      .returning();
    res.json(row);
  } catch (err) {
    log(`DB write error: ${err}`);
    res.status(500).json({ error: "Failed to save preference" });
  }
});

const SKYWALKING_ENDPOINT =
  process.env.SKYWALKING_ENDPOINT || "http://127.0.0.1:12800";

app.post(api.graphql.proxy.path, requireAuth, async (req, res) => {
  const allowedServices = await getAllowedServices(req);
  const accessError = assertGraphQLAccess(req.body, allowedServices);
  if (accessError) {
    return res.status(403).json({ message: accessError });
  }

  try {
    if (
      !allowedServices.includes("*") &&
      isUnscopedTraceListQuery(req.body)
    ) {
      const scoped = await fetchTracesForAllowedServices(
        req.body,
        allowedServices,
        SKYWALKING_ENDPOINT,
      );
      return res.json(scoped);
    }

    const response = await fetch(`${SKYWALKING_ENDPOINT}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
      signal: AbortSignal.timeout(90_000),
    });

    const text = await response.text();

    if (!response.ok) {
      log(`OAP GraphQL HTTP ${response.status}: ${text.slice(0, 200)}`);
      return res.status(response.status).json({
        message: `SkyWalking OAP error (${response.status})`,
        details: text.slice(0, 500),
      });
    }

    try {
      const parsed = JSON.parse(text) as { data?: Record<string, unknown>; errors?: unknown[] };
      if (parsed.data) {
        parsed.data = filterGraphQLResponse(req.body, parsed.data, allowedServices);

        if (
          req.body.query?.includes("getAllDatabases") &&
          Array.isArray(parsed.data.getAllDatabases) &&
          !allowedServices.includes("*")
        ) {
          const topology = req.body.variables?.duration
            ? await fetchGlobalTopology(SKYWALKING_ENDPOINT, req.body.variables.duration)
            : { nodes: [], calls: [] };
          parsed.data.getAllDatabases = filterDatabasesForUser(
            parsed.data.getAllDatabases as Array<{ id?: string; name?: string }>,
            allowedServices,
            topology,
          );
        }
      }
      res.json(parsed);
    } catch {
      log(`OAP returned non-JSON: ${text.slice(0, 200)}`);
      res.status(502).json({
        message: "SkyWalking OAP returned invalid JSON",
        details: text.slice(0, 500),
      });
    }
  } catch (err) {
    console.error("GraphQL Proxy Error:", err);
    res.status(500).json({
      message: "GraphQL proxy failed — OAP may be overloaded or still starting",
    });
  }
});



/* ---------------- K8S POD LIVE LOGS ---------------- */

// app.get("/api/pod-logs/:namespace/:podName", async (req, res) => {
//   const { namespace, podName } = req.params;
//   const tail = (req.query.tail as string) || "100";

//   res.setHeader("Content-Type", "text/event-stream");
//   res.setHeader("Cache-Control", "no-cache");
//   res.setHeader("Connection", "keep-alive");
//   res.flushHeaders();

//   const { spawn } = await import("child_process");

//   const kubectl = spawn(
//     "/snap/bin/kubectl",
//     [
//       "logs",
//       podName,
//       "-n",
//       namespace,
//       "--tail=50",
//     ],
//     {
//       env: {
//         HOME: "/home/ankit119",
//         KUBECONFIG: "/home/ankit119/.kube/config",
//       },
//       stdio: ["ignore", "pipe", "pipe"],
//     }
//   );

//   kubectl.stdout.on("data", (chunk: Buffer) => {
//     const lines = chunk.toString().split("\n").filter(Boolean);
//     for (const line of lines) {
//       res.write(`data: ${line}\n\n`);
//     }
//   });

// kubectl.stderr.on("data", (err: Buffer) => {
//   const msg = err.toString().trim();
//   console.error("kubectl stderr:", msg);
//   res.write(`data: [KUBECTL ERROR] ${msg}\n\n`);
// });

//   kubectl.on("error", (err) => {
//     console.error("Spawn error:", err);
//     res.write(`data: [ERROR spawning kubectl]\n\n`);
//   });

//   kubectl.on("close", (code) => {
//     console.log(`kubectl exited with code ${code}`);
//     if (code !== 0) {
//       res.write(`data: [Stream ended unexpectedly]\n\n`);
//     }
//     res.end();
//   });

//   req.on("close", () => {
//     kubectl.kill("SIGINT");
//   });
// });



/* ---------------- DEV vs PROD ---------------- */

(async () => {
  try {
    await ensureBootstrapAdmin().catch((err) => {
      log(`Auth bootstrap failed: ${err}`);
      if (isAuthEnabled()) {
        log("WARNING: Authentication is enabled but admin bootstrap failed.");
      }
    });

    if (isAuthEnabled()) {
      try {
        const missingTokens = await db
          .select()
          .from(skyobservUsers)
          .where(isNull(skyobservUsers.apiToken));
        for (const user of missingTokens) {
          await db
            .update(skyobservUsers)
            .set({ apiToken: generateApiToken(), updatedAt: new Date() })
            .where(eq(skyobservUsers.id, user.id));
        }
      } catch (err) {
        log(`Auth token backfill skipped: ${err}`);
      }
    }

    if (isDev) {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
      log("Running in DEV mode with Vite");
    } else {
      const distPath = path.join(__dirname, "../dist/public");

      app.use(express.static(distPath));

      app.use((req, res, next) => {
        if (req.method !== "GET") return next();
        if (!req.headers.accept?.includes("text/html")) return next();

        res.sendFile(path.join(distPath, "index.html"));
      });

      log("Running in PRODUCTION mode");
    }

    httpServer.listen(PORT, "0.0.0.0", () => {
      log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    log(`Startup Error: ${err}`);
  }
})();
