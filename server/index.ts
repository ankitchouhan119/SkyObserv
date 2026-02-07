import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { api } from "@shared/routes";
import "dotenv/config"

const app = express();
const SKYWALKING_ENDPOINT = process.env.SKYWALKING_ENDPOINT || "http://127.0.0.1:12800";
const PORT = parseInt(process.env.PORT || "5001", 10);

// Parse incoming JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Temporary storage to keep UI settings while the server is running
const memoryStorage: Record<string, any> = {};

// Helper to log messages with timestamps
function log(message: string) {
  const time = new Date().toLocaleTimeString("en-US", { hour12: true });
  console.log(`${time} [server] ${message}`);
}

/** * API ROUTES 
 */

// Fetch user preferences from memory
app.get(api.preferences.get.path, (req, res) => {
  const key = req.params.key;
  res.json(memoryStorage[key] || { key, value: {} });
});

// Save user preferences to memory
app.post(api.preferences.save.path, (req, res) => {
  const { key, value } = req.body;
  memoryStorage[key] = { key, value, updatedAt: new Date() };
  res.json(memoryStorage[key]);
});

// Proxy requests to SkyWalking to avoid CORS issues
app.post(api.graphql.proxy.path, async (req, res) => {
  const graphqlUrl = `${SKYWALKING_ENDPOINT}/graphql`;
  try {
    const response = await fetch(graphqlUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Proxy Error:", error);
    res.status(502).json({ message: "SkyWalking Connection Failed" });
  }
});

/** * SERVER STARTUP 
 */
const httpServer = createServer(app);

(async () => {
  const { setupVite } = await import("./vite");
  await setupVite(httpServer, app);

  
  httpServer.listen(PORT, "0.0.0.0", () => {
    log(`SkyObserv running on port ${PORT}`);
  });
})();