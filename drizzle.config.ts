import { defineConfig } from "drizzle-kit";
import "dotenv/config";
import { getDatabaseConnectionOptions } from "./shared/database-url";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const db = getDatabaseConnectionOptions(databaseUrl);

export default defineConfig({
  out: "./drizzle",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: db.ssl
    ? {
        host: db.host,
        port: db.port,
        user: db.user,
        password: db.password,
        database: db.database,
        ssl: db.ssl,
      }
    : {
        url: db.connectionString,
      },
});
