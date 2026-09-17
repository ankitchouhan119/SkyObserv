import { storageEndpointKey } from "@/lib/storageKeys";

export type DbSpanRow = {
  key: string;
  traceId: string;
  spanId: number;
  segmentId: string;
  statement: string;
  latency: number;
  time: number;
  component: string;
  peer: string;
  serviceCode: string;
  isError: boolean;
};

export type DbStorageMetrics = {
  ops: number;
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
  errorCount: number;
  errorRate: number;
  successRate: number;
  hasData: boolean;
};

export type QueryFingerprintGroup = {
  fingerprint: string;
  label: string;
  count: number;
  avgLatency: number;
  maxLatency: number;
  lastSeen: number;
  sampleTraceId: string;
};

export type SlowSqlRow = {
  rank: number;
  fingerprint: string;
  statement: string;
  maxLatency: number;
  avgLatency: number;
  count: number;
  sampleTraceId: string;
};

export type CallingServiceRow = {
  service: string;
  count: number;
  avgLatency: number;
  errorCount: number;
};

export type N1Alert = {
  fingerprint: string;
  label: string;
  count: number;
  traceId: string;
  serviceCode: string;
  maxLatency: number;
};

const STATEMENT_TAG_KEYS = ["db.statement", "redis.command", "mongodb.command", "sql", "db.query"];

export function isStorageSpan(span: {
  layer?: string;
  component?: string;
  type?: string;
}): boolean {
  const layer = span.layer?.toLowerCase() ?? "";
  const component = span.component ?? "";
  return (
    span.type === "Exit" &&
    (layer === "database" ||
      layer === "cache" ||
      /mysql|postgres|mongodb|redis|mariadb|elastic|memcached|h2|oracle|prisma|pg/i.test(component))
  );
}

export function extractStatement(span: {
  endpointName?: string;
  tags?: Array<{ key: string; value: string }>;
}): string {
  const tag = span.tags?.find((item) => STATEMENT_TAG_KEYS.includes(item.key));
  return tag?.value || span.endpointName || "unknown query";
}

export function normalizeQueryFingerprint(statement: string): string {
  return statement
    .replace(/'(?:\\'|[^'])*'/g, "?")
    .replace(/"(?:\\"|[^"])*"/g, "?")
    .replace(/\b\d+\b/g, "?")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function fingerprintLabel(fingerprint: string, maxLen = 72): string {
  if (fingerprint.length <= maxLen) return fingerprint;
  return `${fingerprint.slice(0, maxLen - 1)}…`;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return Math.round(sorted[Math.max(0, Math.min(sorted.length - 1, index))]);
}

export function computeDbMetrics(spans: DbSpanRow[]): DbStorageMetrics {
  if (spans.length === 0) {
    return {
      ops: 0,
      avgLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
      errorCount: 0,
      errorRate: 0,
      successRate: 0,
      hasData: false,
    };
  }

  const latencies = spans.map((span) => span.latency);
  const errorCount = spans.filter((span) => span.isError).length;
  const errorRate = Math.round((errorCount / spans.length) * 1000) / 10;
  const successRate = Math.round((100 - errorRate) * 10) / 10;

  return {
    ops: spans.length,
    avgLatency: Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length),
    p95Latency: percentile(latencies, 95),
    p99Latency: percentile(latencies, 99),
    errorCount,
    errorRate,
    successRate,
    hasData: true,
  };
}

export function spanMatchesStorage(
  span: DbSpanRow,
  targetName: string,
  targetHost?: string,
): boolean {
  const peer = span.peer || "";
  const host = targetHost || targetName.split(":")[0];
  const targetKey = storageEndpointKey(targetName);
  const peerKey = storageEndpointKey(peer);

  return (
    peer === targetName ||
    peer.includes(host) ||
    targetName.includes(peer) ||
    (peerKey.length > 0 && peerKey === targetKey)
  );
}

export function filterSpansForStorage(
  spans: DbSpanRow[],
  targetName: string,
  targetHost?: string,
): DbSpanRow[] {
  return spans.filter((span) => spanMatchesStorage(span, targetName, targetHost));
}

export function groupSpansByStorageName(
  spans: DbSpanRow[],
  storageNames: string[],
): Map<string, DbSpanRow[]> {
  const grouped = new Map<string, DbSpanRow[]>();

  for (const name of storageNames) {
    grouped.set(storageEndpointKey(name), []);
  }

  for (const span of spans) {
    for (const name of storageNames) {
      if (spanMatchesStorage(span, name)) {
        const key = storageEndpointKey(name);
        grouped.get(key)?.push(span);
      }
    }
  }

  return grouped;
}

export function buildQueryFingerprints(spans: DbSpanRow[], limit = 8): QueryFingerprintGroup[] {
  const groups = new Map<string, QueryFingerprintGroup>();

  for (const span of spans) {
    const fingerprint = normalizeQueryFingerprint(span.statement);
    const existing = groups.get(fingerprint);

    if (!existing) {
      groups.set(fingerprint, {
        fingerprint,
        label: fingerprintLabel(fingerprint),
        count: 1,
        avgLatency: span.latency,
        maxLatency: span.latency,
        lastSeen: span.time,
        sampleTraceId: span.traceId,
      });
      continue;
    }

    existing.count += 1;
    existing.maxLatency = Math.max(existing.maxLatency, span.latency);
    existing.avgLatency = Math.round(
      (existing.avgLatency * (existing.count - 1) + span.latency) / existing.count,
    );
    existing.lastSeen = Math.max(existing.lastSeen, span.time);
  }

  return Array.from(groups.values()).sort((a, b) => b.count - a.count).slice(0, limit);
}

export function buildSlowSqlLeaderboard(spans: DbSpanRow[], limit = 5): SlowSqlRow[] {
  const byFingerprint = new Map<string, { statement: string; latencies: number[]; traceId: string }>();

  for (const span of spans) {
    const fingerprint = normalizeQueryFingerprint(span.statement);
    const existing = byFingerprint.get(fingerprint);
    if (!existing) {
      byFingerprint.set(fingerprint, {
        statement: span.statement,
        latencies: [span.latency],
        traceId: span.traceId,
      });
      continue;
    }
    existing.latencies.push(span.latency);
    if (span.latency > Math.max(...existing.latencies)) {
      existing.traceId = span.traceId;
      existing.statement = span.statement;
    }
  }

  return Array.from(byFingerprint.entries())
    .map(([fingerprint, value]) => {
      const maxLatency = Math.max(...value.latencies);
      const avgLatency = Math.round(
        value.latencies.reduce((sum, latency) => sum + latency, 0) / value.latencies.length,
      );
      return {
        rank: 0,
        fingerprint,
        statement: value.statement,
        maxLatency,
        avgLatency,
        count: value.latencies.length,
        sampleTraceId: value.traceId,
      };
    })
    .sort((a, b) => b.maxLatency - a.maxLatency)
    .slice(0, limit)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export function getFailedDbQueries(spans: DbSpanRow[], limit = 5): DbSpanRow[] {
  return spans
    .filter((span) => span.isError)
    .sort((a, b) => b.time - a.time)
    .slice(0, limit);
}

export function getCallingServices(spans: DbSpanRow[]): CallingServiceRow[] {
  const map = new Map<string, { count: number; latencySum: number; errors: number }>();

  for (const span of spans) {
    const service = span.serviceCode || "unknown";
    const existing = map.get(service) ?? { count: 0, latencySum: 0, errors: 0 };
    existing.count += 1;
    existing.latencySum += span.latency;
    if (span.isError) existing.errors += 1;
    map.set(service, existing);
  }

  return Array.from(map.entries())
    .map(([service, stats]) => ({
      service,
      count: stats.count,
      avgLatency: Math.round(stats.latencySum / stats.count),
      errorCount: stats.errors,
    }))
    .sort((a, b) => b.count - a.count);
}

export function detectN1Queries(spans: DbSpanRow[], threshold = 5): N1Alert[] {
  const byTrace = new Map<string, DbSpanRow[]>();

  for (const span of spans) {
    const bucket = byTrace.get(span.traceId) ?? [];
    bucket.push(span);
    byTrace.set(span.traceId, bucket);
  }

  const alerts: N1Alert[] = [];

  for (const [traceId, traceSpans] of byTrace) {
    const byFingerprint = new Map<string, DbSpanRow[]>();
    for (const span of traceSpans) {
      const fingerprint = normalizeQueryFingerprint(span.statement);
      const bucket = byFingerprint.get(fingerprint) ?? [];
      bucket.push(span);
      byFingerprint.set(fingerprint, bucket);
    }

    for (const [fingerprint, fpSpans] of byFingerprint) {
      if (fpSpans.length < threshold) continue;
      alerts.push({
        fingerprint,
        label: fingerprintLabel(fingerprint, 56),
        count: fpSpans.length,
        traceId,
        serviceCode: fpSpans[0].serviceCode,
        maxLatency: Math.max(...fpSpans.map((span) => span.latency)),
      });
    }
  }

  return alerts.sort((a, b) => b.count - a.count);
}

export function buildLatencyTrend(
  spans: DbSpanRow[],
  bucketCount = 12,
): Array<{ id: string; value: number }> {
  if (spans.length === 0) return [];

  const times = spans.map((span) => span.time);
  const min = Math.min(...times);
  const max = Math.max(...times);
  const range = Math.max(max - min, 1);
  const bucketSize = range / bucketCount;

  const buckets = Array.from({ length: bucketCount }, (_, index) => ({
    id: String(Math.round(min + index * bucketSize)),
    latencies: [] as number[],
  }));

  for (const span of spans) {
    const index = Math.min(bucketCount - 1, Math.floor((span.time - min) / bucketSize));
    buckets[index].latencies.push(span.latency);
  }

  return buckets
    .map((bucket) => ({
      id: bucket.id,
      value: bucket.latencies.length
        ? Math.round(bucket.latencies.reduce((sum, latency) => sum + latency, 0) / bucket.latencies.length)
        : 0,
    }))
    .filter((bucket) => bucket.value > 0);
}
