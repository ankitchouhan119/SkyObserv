export type DatabaseSslConfig = {
  rejectUnauthorized: false;
};

export type DatabaseConnectionOptions = {
  connectionString: string;
  ssl?: DatabaseSslConfig;
  needsSsl: boolean;
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

export function getDatabaseConnectionOptions(
  raw: string,
): DatabaseConnectionOptions {
  const url = new URL(raw.replace(/^postgres:\/\//, "postgresql://"));
  const sslMode = url.searchParams.get("sslmode")?.toLowerCase();
  const needsSsl =
    sslMode === "require" ||
    sslMode === "verify-ca" ||
    sslMode === "verify-full" ||
    sslMode === "prefer" ||
    url.hostname.includes("aivencloud.com") ||
    url.hostname.includes(".rds.amazonaws.com");

  url.searchParams.delete("sslmode");
  // node-postgres does not understand Neon's channel_binding query param.
  url.searchParams.delete("channel_binding");

  const connectionString = url
    .toString()
    .replace(/^postgresql:\/\//, "postgres://");

  const ssl: DatabaseSslConfig | undefined = needsSsl
    ? { rejectUnauthorized: false }
    : undefined;

  return {
    connectionString,
    ssl,
    needsSsl,
    host: url.hostname,
    port: Number(url.port) || 5432,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
  };
}
