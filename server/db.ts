import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

function buildPoolConfig(): pg.PoolConfig {
  const raw = process.env.DATABASE_URL!;
  const url = new URL(raw.replace(/^postgres:\/\//, "postgresql://"));
  const sslMode = url.searchParams.get("sslmode")?.toLowerCase();
  const needsSsl =
    sslMode === "require" ||
    sslMode === "verify-ca" ||
    sslMode === "verify-full" ||
    sslMode === "prefer" ||
    url.hostname.includes("aivencloud.com");

  // Avoid pg applying strict TLS from sslmode=verify-full in the connection string.
  url.searchParams.delete("sslmode");

  return {
    connectionString: url.toString().replace(/^postgresql:\/\//, "postgres://"),
    ...(needsSsl
      ? {
          ssl: {
            rejectUnauthorized: false,
          },
        }
      : {}),
  };
}

const pool = new Pool(buildPoolConfig());

pool.on("error", (err) => {
  console.error("[db] Unexpected pool error:", err.message);
});

export const db = drizzle(pool, { schema });
export { pool };
