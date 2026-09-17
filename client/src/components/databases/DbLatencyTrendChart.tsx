"use client";

import { MetricChart } from "@/components/charts/MetricChart";

export function DbLatencyTrendChart({
  data,
  loading,
}: {
  data: Array<{ id: string; value: number }>;
  loading?: boolean;
}) {
  return (
    <MetricChart
      title="DB latency trend"
      data={data}
      unit="ms"
      color="#7C3AED"
      loading={loading}
    />
  );
}
