import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // === PREFERENCES ===
  app.get(api.preferences.get.path, async (req, res) => {
    const pref = await storage.getPreference(req.params.key);
    if (!pref) {
      return res.status(404).json({ message: "Preference not found" });
    }
    res.json(pref);
  });

  app.post(api.preferences.save.path, async (req, res) => {
    try {
      const input = api.preferences.save.input.parse(req.body);
      const saved = await storage.savePreference(input);
      res.json(saved);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.message });
      }
      throw err;
    }
  });

  // === PROXY TO SKYWALKING ===
  // This allows the frontend to talk to SkyWalking without CORS issues
  // and allows us to configure the endpoint server-side.
  app.post(api.graphql.proxy.path, async (req, res) => {
    const SKYWALKING_ENDPOINT =
      process.env.SKYWALKING_ENDPOINT || "http://localhost:12800/graphql";

    try {
      const response = await fetch(SKYWALKING_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Forward auth headers if needed in the future
          ...(req.headers.authorization
            ? { Authorization: req.headers.authorization }
            : {}),
        },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        console.error(
          `SkyWalking Proxy Error: ${response.status} ${response.statusText}`
        );
        // Try to read error body
        const text = await response.text();
        return res.status(response.status).send(text);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("SkyWalking Proxy Connection Failed:", error);
      res.status(502).json({
        message: "Failed to connect to SkyWalking OAP server",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return httpServer;
}
