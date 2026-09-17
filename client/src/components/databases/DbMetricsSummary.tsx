"use client";

import { Activity, Gauge, ShieldCheck, Zap } from "lucide-react";
import type { DbStorageMetrics } from "@/lib/dbTraceAnalysis";
import { cn } from "@/lib/utils";

type DbMetricsSummaryProps = {
  metrics: DbStorageMetrics;
  loading?: boolean;
  compact?: boolean;
};

export function DbMetricsSummary({ metrics, loading, compact = false }: DbMetricsSummaryProps) {
  const items = [
    {
      label: "Avg latency",
      value: metrics.hasData ? `${metrics.avgLatency}ms` : "—",
      icon: Zap,
      wrap: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    },
    {
      label: "P95",
      value: metrics.hasData ? `${metrics.p95Latency}ms` : "—",
      icon: Gauge,
      wrap: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    },
    {
      label: "P99",
      value: metrics.hasData ? `${metrics.p99Latency}ms` : "—",
      icon: Gauge,
      wrap: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
    },
    {
      label: compact ? "Ops" : "Throughput",
      value: metrics.hasData ? metrics.ops : "—",
      icon: Activity,
      wrap: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
    },
    {
      label: "Success rate",
      value: metrics.hasData ? `${metrics.successRate}%` : "—",
      icon: ShieldCheck,
      wrap: metrics.errorRate > 1
        ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
        : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    },
  ];

  const gridClass = compact
    ? "grid grid-cols-2 gap-2"
    : "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3";

  return (
    <div className={gridClass}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className={cn("so-kpi", compact && "p-3")}>
            <div className={cn("so-icon-wrap", item.wrap, compact && "h-8 w-8")}>
              <Icon className={cn("w-4 h-4", compact && "w-3.5 h-3.5")} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
              {loading ? (
                <div className="mt-1 h-6 w-14 rounded bg-muted animate-pulse" />
              ) : (
                <p className={cn("font-semibold tabular-nums text-foreground", compact ? "text-lg" : "text-2xl")}>
                  {item.value}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
