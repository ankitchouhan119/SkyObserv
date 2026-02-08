import express from "express";
import { createServer } from "http";
import { api } from "@shared/routes";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const SKYWALKING_ENDPOINT = process.env.SKYWALKING_ENDPOINT || "http://127.0.0.1:12800";
const PORT = parseInt(process.env.PORT || "5000", 10);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const memoryStorage: Record<string, any> = {};

function log(message: string) {
  const time = new Date().toLocaleTimeString("en-US", { hour12: true });
  console.log(`${time} [server] ${message}`);
}

// Preferences API
app.get(api.preferences.get.path, (req, res) => {
  const key = req.params.key;
  res.json(memoryStorage[key] || { key, value: {} });
});

app.post(api.preferences.save.path, (req, res) => {
  const { key, value } = req.body;
  memoryStorage[key] = { key, value, updatedAt: new Date() };
  res.json(memoryStorage[key]);
});

// SkyWalking Proxy
app.post(api.graphql.proxy.path, async (req, res) => {
  const graphqlUrl = `${SKYWALKING_ENDPOINT}/graphql`;
  try {
    const response = await fetch(graphqlUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(502).json({ message: "SkyWalking Connection Failed" });
  }
});


const publicPath = path.resolve(__dirname, "..", "dist", "public");
app.use(express.static(publicPath));


app.get(/.*/, (req, res) => {
  res.sendFile(path.resolve(publicPath, "index.html"));
});
const httpServer = createServer(app);
httpServer.listen(PORT, "0.0.0.0", () => {
  log(`SkyObserv running on port ${PORT}`);
});