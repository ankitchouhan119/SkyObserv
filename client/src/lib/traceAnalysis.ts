import type { Span, Trace } from "@/types/skywalking";

export type SpanRef = {
  traceId?: string;
  parentSegmentId?: string;
  parentSpanId?: number;
  type?: string;
};

export type SpanNode = {
  span: Span;
  children: SpanNode[];
  depth: number;
  key: string;
};

export type TraceTiming = {
  startTime: number;
  endTime: number;
  totalDuration: number;
};

export type ErrorFingerprintGroup = {
  fingerprint: string;
  label: string;
  count: number;
  traceIds: string[];
  lastSeen: number;
  sampleEndpoint: string;
};

export function spanKey(span: Span): string {
  return `${span.segmentId}:${span.spanId}`;
}

export function spanDuration(span: Span): number {
  return Math.max(1, span.endTime - span.startTime);
}

function resolveParentKey(span: Span, spans: Span[]): string | null {
  if (span.parentSpanId >= 0) {
    const parent = spans.find(
      (candidate) =>
        candidate.segmentId === span.segmentId && candidate.spanId === span.parentSpanId,
    );
    if (parent) return spanKey(parent);
  }

  const refs = (span as Span & { refs?: SpanRef[] }).refs ?? [];
  for (const ref of refs) {
    const parent = spans.find(
      (candidate) =>
        candidate.segmentId === ref.parentSegmentId && candidate.spanId === ref.parentSpanId,
    );
    if (parent) return spanKey(parent);
  }

  return null;
}

export function getTraceTiming(spans: Span[]): TraceTiming {
  if (spans.length === 0) {
    return { startTime: 0, endTime: 0, totalDuration: 1 };
  }

  const startTime = Math.min(...spans.map((span) => span.startTime));
  const endTime = Math.max(...spans.map((span) => span.endTime));

  return {
    startTime,
    endTime,
    totalDuration: Math.max(1, endTime - startTime),
  };
}

export function buildSpanTree(spans: Span[]): SpanNode[] {
  const childrenMap = new Map<string, Span[]>();
  const roots: Span[] = [];

  for (const span of spans) {
    const parentKey = resolveParentKey(span, spans);
    if (!parentKey) {
      roots.push(span);
      continue;
    }
    const siblings = childrenMap.get(parentKey) ?? [];
    siblings.push(span);
    childrenMap.set(parentKey, siblings);
  }

  const toNode = (span: Span, depth: number): SpanNode => {
    const key = spanKey(span);
    const children = (childrenMap.get(key) ?? [])
      .sort((a, b) => a.startTime - b.startTime)
      .map((child) => toNode(child, depth + 1));

    return { span, children, depth, key };
  };

  return roots
    .sort((a, b) => a.startTime - b.startTime)
    .map((root) => toNode(root, 0));
}

export function findCriticalPathSpanKeys(spans: Span[]): Set<string> {
  if (spans.length === 0) return new Set();

  const parentByKey = new Map<string, string | null>();
  for (const span of spans) {
    parentByKey.set(spanKey(span), resolveParentKey(span, spans));
  }

  let latest = spans[0];
  for (const span of spans) {
    if (span.endTime > latest.endTime) latest = span;
  }

  const critical = new Set<string>();
  let current: string | null = spanKey(latest);
  while (current) {
    critical.add(current);
    current = parentByKey.get(current) ?? null;
  }

  return critical;
}

export function buildSpanErrorFingerprint(span: Span): string {
  const status = span.tags?.find((tag) => tag.key === "http.status_code")?.value;
  const logMessage = span.logs
    ?.flatMap((entry) => entry.data)
    .find((item) => /error|exception|message|stack/i.test(item.key))?.value;
  const errorTag = span.tags?.find((tag) => /error|exception/i.test(tag.key))?.value;

  return [
    span.serviceCode,
    span.endpointName,
    span.component,
    status && status !== "200" ? `status:${status}` : "",
    logMessage || errorTag || (span.isError ? "error" : ""),
  ]
    .filter(Boolean)
    .join(" | ");
}

export function getTraceErrorFingerprints(spans: Span[]): ErrorFingerprintGroup[] {
  const errorSpans = spans.filter((span) => span.isError);
  const groups = new Map<string, ErrorFingerprintGroup>();

  for (const span of errorSpans) {
    const fingerprint = buildSpanErrorFingerprint(span);
    const existing = groups.get(fingerprint);
    if (existing) {
      existing.count += 1;
      continue;
    }
    groups.set(fingerprint, {
      fingerprint,
      label: fingerprint.split(" | ").slice(0, 2).join(" · "),
      count: 1,
      traceIds: [span.traceId],
      lastSeen: span.endTime,
      sampleEndpoint: span.endpointName,
    });
  }

  return Array.from(groups.values()).sort((a, b) => b.count - a.count);
}

export function aggregateTraceListFingerprints(traces: Trace[]): ErrorFingerprintGroup[] {
  const groups = new Map<string, ErrorFingerprintGroup>();

  for (const trace of traces) {
    if (!trace.isError) continue;

    const endpoint = trace.endpointNames?.[0] ?? "unknown-endpoint";
    const fingerprint = `${endpoint} | error-trace`;
    const traceId = trace.traceIds?.[0] ?? trace.key;
    const lastSeen = Number(trace.start) || 0;

    const existing = groups.get(fingerprint);
    if (existing) {
      existing.count += 1;
      if (traceId) existing.traceIds.push(traceId);
      existing.lastSeen = Math.max(existing.lastSeen, lastSeen);
      continue;
    }

    groups.set(fingerprint, {
      fingerprint,
      label: endpoint,
      count: 1,
      traceIds: traceId ? [traceId] : [],
      lastSeen,
      sampleEndpoint: endpoint,
    });
  }

  return Array.from(groups.values()).sort((a, b) => b.count - a.count);
}

export function serviceColor(serviceCode: string): string {
  const palette = [
    "#3B82F6",
    "#8B5CF6",
    "#06B6D4",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#EC4899",
    "#6366F1",
  ];
  let hash = 0;
  for (let i = 0; i < serviceCode.length; i += 1) {
    hash = serviceCode.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

export function flattenSpanTree(nodes: SpanNode[]): SpanNode[] {
  const result: SpanNode[] = [];
  const walk = (node: SpanNode) => {
    result.push(node);
    node.children.forEach(walk);
  };
  nodes.forEach(walk);
  return result;
}

export type CompareSpanRow = {
  endpoint: string;
  service: string;
  durationA: number;
  durationB: number;
  delta: number;
};

export function buildCompareRows(spansA: Span[], spansB: Span[]): CompareSpanRow[] {
  const mapA = new Map<string, number>();
  const mapB = new Map<string, number>();
  const meta = new Map<string, { service: string }>();

  for (const span of spansA) {
    const key = `${span.serviceCode}::${span.endpointName}`;
    mapA.set(key, Math.max(mapA.get(key) ?? 0, spanDuration(span)));
    meta.set(key, { service: span.serviceCode });
  }
  for (const span of spansB) {
    const key = `${span.serviceCode}::${span.endpointName}`;
    mapB.set(key, Math.max(mapB.get(key) ?? 0, spanDuration(span)));
    meta.set(key, { service: span.serviceCode });
  }

  const keys = new Set([...mapA.keys(), ...mapB.keys()]);

  return Array.from(keys)
    .map((key) => {
      const durationA = mapA.get(key) ?? 0;
      const durationB = mapB.get(key) ?? 0;
      const [service, endpoint] = key.split("::");
      return {
        endpoint,
        service: meta.get(key)?.service ?? service,
        durationA,
        durationB,
        delta: durationB - durationA,
      };
    })
    .sort((a, b) => Math.max(b.durationA, b.durationB) - Math.max(a.durationA, b.durationB));
}
