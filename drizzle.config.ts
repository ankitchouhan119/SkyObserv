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
  dbCredentials: {
    url: databaseUrl.replace("&channel_binding=require", ""),
  },
});
