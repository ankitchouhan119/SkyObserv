import { averageMetric } from "@/lib/serviceHealth";

type MetricPoint = { value?: number };

export function slaBasisPointsToPercent(raw: number): number {
  return Math.round((raw / 100) * 10) / 10;
}

export function slaBasisPointsToErrorRate(raw: number): number {
  const slaPercent = raw / 100;
  return Math.round(Math.max(0, 100 - slaPercent) * 10) / 10;
}

export function formatApdexScore(raw: number): number {
  if (raw <= 0) return 0;
  return Math.round((raw / 10000) * 100) / 100;
}

export function apdexLabel(score: number): string {
  if (score >= 0.94) return "Excellent";
  if (score >= 0.85) return "Good";
  if (score >= 0.7) return "Fair";
  if (score > 0) return "Poor";
  return "—";
}

export function extractPercentileMs(
  lines: Array<{ values?: MetricPoint[] }> | null | undefined,
  index: number,
): number {
  const line = lines?.[index]?.values ?? [];
  return Math.round(averageMetric(line));
}

export function parseExtendedMetrics(data: {
  getServiceLatency?: { values?: MetricPoint[] };
  getServiceThroughput?: { values?: MetricPoint[] };
  getServiceSLA?: { values?: MetricPoint[] };
  getServiceApdex?: { values?: MetricPoint[] };
  getServicePercentiles?: Array<{ values?: MetricPoint[] }>;
} | null | undefined) {
  const latencyValues = data?.getServiceLatency?.values ?? [];
  const throughputValues = data?.getServiceThroughput?.values ?? [];
  const slaValues = data?.getServiceSLA?.values ?? [];
  const apdexValues = data?.getServiceApdex?.values ?? [];
  const percentileLines = data?.getServicePercentiles ?? [];

  const slaRaw = averageMetric(slaValues);
  const sla = slaBasisPointsToPercent(slaRaw);

  return {
    latency: Math.round(averageMetric(latencyValues)),
    throughput: Math.round(averageMetric(throughputValues)),
    sla,
    errorRate: slaRaw > 0 ? slaBasisPointsToErrorRate(slaRaw) : 0,
    apdex: formatApdexScore(averageMetric(apdexValues)),
    p50: extractPercentileMs(percentileLines, 0),
    p75: extractPercentileMs(percentileLines, 1),
    p90: extractPercentileMs(percentileLines, 2),
    p95: extractPercentileMs(percentileLines, 3),
    p99: extractPercentileMs(percentileLines, 4),
  };
}
