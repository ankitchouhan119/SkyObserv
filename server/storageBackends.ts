import { and, eq } from "drizzle-orm";
import type { SkyobservUser } from "@shared/schema";
import { storageBackends } from "@shared/schema";
import { configuredStorageId, parseStorageEndpointInput, STORAGE_KINDS } from "@shared/storageEndpoint";
import { db } from "./db";
import { getAccountOwnerId } from "./teamAccess";

export type StorageBackendView = {
  id: string;
  name: string;
  kind: string;
  endpoint: string;
  serviceName?: string | null;
  label?: string | null;
  source: "configured";
  traced: false;
};

function toView(row: typeof storageBackends.$inferSelect): StorageBackendView {
  return {
    id: configuredStorageId(row.id),
    name: row.label || row.endpoint,
    kind: row.kind,
    endpoint: row.endpoint,
    serviceName: row.serviceName,
    label: row.label,
    source: "configured",
    traced: false,
  };
}

export async function listStorageBackendsForUser(user: SkyobservUser): Promise<StorageBackendView[]> {
  const ownerId = getAccountOwnerId(user);
  const rows = await db
    .select()
    .from(storageBackends)
    .where(eq(storageBackends.userId, ownerId));

  return rows.map(toView);
}

export async function getStorageBackendForUser(
  user: SkyobservUser,
  backendId: number,
): Promise<StorageBackendView | null> {
  const ownerId = getAccountOwnerId(user);
  const rows = await db
    .select()
    .from(storageBackends)
    .where(and(eq(storageBackends.userId, ownerId), eq(storageBackends.id, backendId)))
    .limit(1);

  return rows[0] ? toView(rows[0]) : null;
}

export async function createStorageBackendForUser(
  user: SkyobservUser,
  input: { endpoint: string; kind?: string; serviceName?: string; label?: string },
): Promise<StorageBackendView | { error: string }> {
  if (user.invitedByUserId) {
    return { error: "Only the account owner can manage storage backends" };
  }

  let parsed: { endpoint: string; kind: string };
  try {
    parsed = parseStorageEndpointInput(input.endpoint, input.kind);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Invalid endpoint" };
  }

  if (input.kind && !STORAGE_KINDS.includes(parsed.kind as (typeof STORAGE_KINDS)[number])) {
    return { error: "Unsupported storage type" };
  }

  const ownerId = getAccountOwnerId(user);
  const [row] = await db
    .insert(storageBackends)
    .values({
      userId: ownerId,
      kind: parsed.kind,
      endpoint: parsed.endpoint,
      serviceName: input.serviceName?.trim() || null,
      label: input.label?.trim() || null,
    })
    .returning();

  return toView(row);
}

export async function deleteStorageBackendForUser(
  user: SkyobservUser,
  backendId: number,
): Promise<{ ok: true } | { error: string }> {
  if (user.invitedByUserId) {
    return { error: "Only the account owner can manage storage backends" };
  }

  const ownerId = getAccountOwnerId(user);
  const rows = await db
    .delete(storageBackends)
    .where(and(eq(storageBackends.userId, ownerId), eq(storageBackends.id, backendId)))
    .returning({ id: storageBackends.id });

  if (rows.length === 0) {
    return { error: "Storage backend not found" };
  }

  return { ok: true };
}
