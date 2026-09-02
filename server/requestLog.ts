import type { NextFunction, Request, Response } from "express";
import fs from "fs";

const accessLogPath = process.env.ACCESS_LOG_PATH?.trim() ?? "";

export function requestLogMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    const entry = {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration_ms: Date.now() - start,
      ip: req.ip,
    };
    const line = `${JSON.stringify(entry)}\n`;

    if (accessLogPath) {
      try {
        fs.appendFileSync(accessLogPath, line);
        return;
      } catch {
        // fall through to stdout if the log file is not writable
      }
    }

    process.stdout.write(line);
  });

  next();
}
