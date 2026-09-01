export const STORAGE_KINDS = [
  "PostgreSQL",
  "MySQL",
  "Redis",
  "MongoDB",
  "MariaDB",
  "ElasticSearch",
  "Oracle",
] as const;

export type StorageKind = (typeof STORAGE_KINDS)[number];

function defaultPortForKind(kind?: string): string {
  if (kind === "Redis") return "6379";
  if (kind === "MySQL" || kind === "MariaDB") return "3306";
  if (kind === "MongoDB") return "27017";
  if (kind === "ElasticSearch") return "9200";
  if (kind === "Oracle") return "1521";
  return "5432";
}

function inferKindFromProtocol(protocol: string): StorageKind {
  if (protocol.startsWith("redis")) return "Redis";
  if (protocol.startsWith("mysql")) return "MySQL";
  if (protocol.startsWith("mongodb")) return "MongoDB";
  return "PostgreSQL";
}

export function parseStorageEndpointInput(
  input: string,
  kind?: string,
): { endpoint: string; kind: StorageKind } {
  const raw = input.trim();
  if (!raw) {
    throw new Error("Endpoint is required");
  }

  if (/^(postgres(ql)?|mysql|mongodb(\+srv)?|rediss?):\/\//i.test(raw)) {
    const normalized = raw.replace(/^postgres:\/\//i, "postgresql://");
    const url = new URL(normalized);
    const host = url.hostname;
    const port = url.port || defaultPortForKind(inferKindFromProtocol(url.protocol));
    const resolvedKind = (kind as StorageKind) || inferKindFromProtocol(url.protocol);
    return { endpoint: `${host}:${port}`, kind: resolvedKind };
  }

  if (/^[^:]+:\d+$/.test(raw)) {
    return {
      endpoint: raw,
      kind: (kind as StorageKind) || "PostgreSQL",
    };
  }

  const resolvedKind = (kind as StorageKind) || "PostgreSQL";
  return {
    endpoint: `${raw}:${defaultPortForKind(resolvedKind)}`,
    kind: resolvedKind,
  };
}

export function configuredStorageId(id: number): string {
  return `cfg:${id}`;
}

export function parseConfiguredStorageId(id: string): number | null {
  if (!id.startsWith("cfg:")) return null;
  const parsed = Number(id.slice(4));
  return Number.isFinite(parsed) ? parsed : null;
}
