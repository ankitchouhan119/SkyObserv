import express from "express";
import { createServer } from "http";
import { api } from "@shared/routes";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import { db } from "./db";
import { userPreferences } from "@shared/schema";
import { eq } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

const PORT = parseInt(process.env.PORT || "5000", 10);
const isDev = process.env.NODE_ENV !== "production";

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

function log(message: string) {
  const time = new Date().toLocaleTimeString("en-US", { hour12: true });
  console.log(`${time} [server] ${message}`);
}

/* ---------------- RUNTIME CONFIG ENDPOINT ---------------- */

app.get("/config", (_, res) => {
  res.json({
    tamboApiKey: process.env.TAMBO_API_KEY || "",
  });
});

/* ---------------- API ROUTES ---------------- */

app.get(api.preferences.get.path, async (req, res) => {
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

app.post(api.preferences.save.path, async (req, res) => {
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

app.post(api.graphql.proxy.path, async (req, res) => {
  try {
    const response = await fetch(`${SKYWALKING_ENDPOINT}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("GraphQL Proxy Error:", err);
    res.status(500).json({ message: "GraphQL proxy failed" });
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
