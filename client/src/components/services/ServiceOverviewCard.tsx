import { Link } from "wouter";
import { Activity, Layers, Server, Zap } from "lucide-react";
import { useServiceOverview } from "@/hooks/use-service-overview";
import { apdexLabel } from "@/lib/metricsFormat";

type ServiceOverviewCardProps = {
  id: string;
  name: string;
  shortName?: string;
  group?: string;
  layers?: string[];
  normal?: boolean;
};

function MetricCell({
  label,
  value,
  unit,
  loading,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  loading?: boolean;
  accent?: "violet" | "sky" | "danger" | "emerald";
}) {
  const accentClass =
    accent === "danger"
      ? "border-red-500/15 bg-red-500/[0.04]"
      : accent === "violet"
        ? "border-violet-500/15 bg-violet-500/[0.04]"
        : accent === "sky"
          ? "border-sky-500/15 bg-sky-500/[0.04]"
          : accent === "emerald"
            ? "border-emerald-500/15 bg-emerald-500/[0.04]"
            : "border-border/60 bg-muted/20";

  return (
    <div className={`rounded-lg border px-2.5 py-2 ${accentClass}`}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      {loading ? (
        <div className="mt-1 h-4 w-12 rounded bg-muted animate-pulse" />
      ) : (
        <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
          {value}
          {unit ? (
            <span className="ml-0.5 text-[10px] font-normal text-muted-foreground block truncate">
              {unit}
            </span>
          ) : null}
        </p>
      )}
    </div>
  );
}

export function ServiceOverviewCard({
  id,
  name,
  shortName,
  group,
  layers,
  normal,
}: ServiceOverviewCardProps) {
  const {
    latency,
    throughput,
    sla,
    apdex,
    errorRate,
    p95,
    instanceCount,
    endpointCount,
    health,
    loading,
  } = useServiceOverview(id, normal);

  const statusClass =
    health.status === "critical"
      ? "so-status-bad"
      : health.status === "degraded"
        ? "text-amber-600 dark:text-amber-400"
        : "so-status-ok";

  const dotClass =
    health.status === "critical"
      ? "bg-destructive"
      : health.status === "degraded"
        ? "bg-amber-500"
        : "bg-primary";

  const layerLabel = (layers ?? []).filter(Boolean).join(", ") || "General";

  return (
    <Link href={`/services/${id}`}>
      <div className="so-card-hover p-4 h-full flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="so-icon-wrap bg-primary/10 text-primary">
            <Zap className="w-4 h-4" />
          </div>
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground">
            {group || "General"}
          </span>
        </div>

        <h3 className="text-[15px] font-semibold mb-1 truncate group-hover:text-primary transition-colors">
          {shortName || name}
        </h3>

        <p className="text-xs text-muted-foreground mb-4 min-h-[2rem] line-clamp-2">
          {health.detail}
        </p>

        <div className="grid grid-cols-3 gap-2 mb-2">
          <MetricCell
            label="Latency"
            value={loading ? "—" : String(latency)}
            unit="ms"
            loading={loading}
          />
          <MetricCell
            label="Traffic"
            value={loading ? "—" : String(throughput)}
            unit="cpm"
            loading={loading}
          />
          <MetricCell
            label="SLA"
            value={loading ? "—" : sla > 0 ? `${sla}%` : "—"}
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <MetricCell
            label="Apdex"
            value={loading ? "—" : apdex > 0 ? apdex.toFixed(2) : "—"}
            unit={apdex > 0 ? apdexLabel(apdex) : undefined}
            loading={loading}
            accent="violet"
          />
          <MetricCell
            label="Error rate"
            value={loading ? "—" : errorRate > 0 ? `${errorRate}%` : "0%"}
            loading={loading}
            accent={errorRate > 1 ? "danger" : "emerald"}
          />
          <MetricCell
            label="P95"
            value={loading ? "—" : p95 > 0 ? String(p95) : "—"}
            unit="ms"
            loading={loading}
            accent="sky"
          />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border text-xs mt-auto">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Server className="w-3.5 h-3.5" />
              <span className="font-medium text-foreground">{loading ? "—" : instanceCount}</span>
              <span>instances</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Activity className="w-3.5 h-3.5" />
              <span className="font-medium text-foreground">{loading ? "—" : endpointCount}</span>
              <span>endpoints</span>
            </div>
          </div>

          <div className="text-right shrink-0 pl-3">
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
              <Layers className="w-3 h-3" />
              <span className="truncate max-w-[72px]">{layerLabel}</span>
            </div>
            <div className={`inline-flex items-center gap-1.5 font-medium ${statusClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
              {health.label}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
