import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { getDatabaseConnectionOptions } from "@shared/database-url";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

function buildPoolConfig(): pg.PoolConfig {
  const { connectionString, ssl } = getDatabaseConnectionOptions(
    process.env.DATABASE_URL!,
  );

  return {
    connectionString,
    ...(ssl ? { ssl } : {}),
  };
}

const pool = new Pool(buildPoolConfig());

pool.on("error", (err) => {
  console.error("[db] Unexpected pool error:", err.message);
});

export const db = drizzle(pool, { schema });
export { pool };
