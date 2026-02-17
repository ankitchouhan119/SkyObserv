import express from "express";
import { createServer } from "http";
import { api } from "@shared/routes";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

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

const memoryStorage: Record<string, any> = {};

app.get(api.preferences.get.path, (req, res) => {
  const key = req.params.key;
  res.json(memoryStorage[key] || { key, value: {} });
});

app.post(api.preferences.save.path, (req, res) => {
  const { key, value } = req.body;
  memoryStorage[key] = { key, value, updatedAt: new Date() };
  res.json(memoryStorage[key]);
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


/* ---------------- DEV vs PROD ---------------- */

(async () => {
  try {
    if (isDev) {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
      log("Running in DEV mode with Vite");
    } else {
      const distPath = path.join(__dirname, "../dist/public");

      // 1️⃣ Serve static assets
      app.use(express.static(distPath));

      // 2️⃣ SPA fallback (ONLY for browser navigation)
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
