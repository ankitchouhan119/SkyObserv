"use client";

import { useMemo } from "react";
import { Link } from "wouter";
import { ArrowLeftRight, TrendingDown, TrendingUp } from "lucide-react";
import { useQuery } from "@apollo/client";
import { GET_TRACE_DETAILS } from "@/apollo/queries/traces";
import { buildCompareRows, getTraceTiming } from "@/lib/traceAnalysis";
import type { Span } from "@/types/skywalking";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type TraceCompareViewProps = {
  traceIdA: string;
  traceIdB: string;
  onClose?: () => void;
};

function TraceSummary({
  label,
  traceId,
  spans,
  tone,
}: {
  label: string;
  traceId: string;
  spans: Span[];
  tone: "blue" | "violet";
}) {
  const timing = getTraceTiming(spans);
  const errors = spans.filter((span) => span.isError).length;
  const toneClass =
    tone === "blue"
      ? "border-sky-500/25 bg-sky-500/5"
      : "border-violet-500/25 bg-violet-500/5";

  return (
    <div className={cn("rounded-xl border p-4", toneClass)}>
      <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{label}</p>
      <p className="text-xs font-mono mt-1 truncate text-foreground" title={traceId}>
        {traceId.slice(0, 10)}…{traceId.slice(-8)}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-lg font-bold tabular-nums text-foreground">{timing.totalDuration}ms</p>
          <p className="text-[10px] text-muted-foreground">Duration</p>
        </div>
        <div>
          <p className="text-lg font-bold tabular-nums text-foreground">{spans.length}</p>
          <p className="text-[10px] text-muted-foreground">Spans</p>
        </div>
        <div>
          <p className="text-lg font-bold tabular-nums text-foreground">{errors}</p>
          <p className="text-[10px] text-muted-foreground">Errors</p>
        </div>
      </div>
      <Link href={`/traces/${traceId}`}>
        <Button variant="ghost" size="sm" className="mt-3 w-full text-xs">
          Open trace
        </Button>
      </Link>
    </div>
  );
}

export function TraceCompareView({ traceIdA, traceIdB, onClose }: TraceCompareViewProps) {
  const queryA = useQuery(GET_TRACE_DETAILS, { variables: { traceId: traceIdA }, skip: !traceIdA });
  const queryB = useQuery(GET_TRACE_DETAILS, { variables: { traceId: traceIdB }, skip: !traceIdB });

  const spansA: Span[] = queryA.data?.queryTrace?.spans ?? [];
  const spansB: Span[] = queryB.data?.queryTrace?.spans ?? [];
  const loading = queryA.loading || queryB.loading;

  const rows = useMemo(() => buildCompareRows(spansA, spansB), [spansA, spansB]);
  const maxDuration = useMemo(
    () => Math.max(...rows.map((row) => Math.max(row.durationA, row.durationB)), 1),
    [rows],
  );

  const durationDelta =
    getTraceTiming(spansB).totalDuration - getTraceTiming(spansA).totalDuration;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <ArrowLeftRight className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Trace compare</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Endpoint-level latency diff between two traces
            </p>
          </div>
        </div>
        {onClose && (
          <Button variant="outline" size="sm" onClick={onClose}>
            Close compare
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-36 rounded-xl bg-muted animate-pulse" />
          <div className="h-36 rounded-xl bg-muted animate-pulse" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TraceSummary label="Trace A (baseline)" traceId={traceIdA} spans={spansA} tone="blue" />
            <TraceSummary label="Trace B (compare)" traceId={traceIdB} spans={spansB} tone="violet" />
          </div>

          <div className="rounded-xl border border-border bg-card/60 px-4 py-3 flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Total duration delta (B − A)</span>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-sm font-bold tabular-nums",
                durationDelta > 0 ? "text-red-500" : durationDelta < 0 ? "text-emerald-500" : "text-foreground",
              )}
            >
              {durationDelta > 0 ? <TrendingUp className="h-4 w-4" /> : durationDelta < 0 ? <TrendingDown className="h-4 w-4" /> : null}
              {durationDelta > 0 ? "+" : ""}{durationDelta}ms
            </span>
          </div>

          <div className="so-card overflow-hidden">
            <div className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr] gap-2 px-4 py-3 border-b border-border bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Endpoint</span>
              <span className="text-sky-600 dark:text-sky-400">Trace A</span>
              <span className="text-violet-600 dark:text-violet-400">Trace B</span>
              <span className="text-right">Delta</span>
            </div>
            <div className="divide-y divide-border">
              {rows.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground text-center">No overlapping endpoints to compare.</p>
              ) : (
                rows.map((row) => {
                  const widthA = Math.max(4, (row.durationA / maxDuration) * 100);
                  const widthB = Math.max(4, (row.durationB / maxDuration) * 100);

                  return (
                    <div
                      key={`${row.service}-${row.endpoint}`}
                      className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr] gap-2 px-4 py-3 items-center"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{row.endpoint}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{row.service}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold tabular-nums text-sky-600 dark:text-sky-400 mb-1">
                          {row.durationA}ms
                        </p>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-sky-500 rounded-full" style={{ width: `${widthA}%` }} />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold tabular-nums text-violet-600 dark:text-violet-400 mb-1">
                          {row.durationB}ms
                        </p>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-violet-500 rounded-full" style={{ width: `${widthB}%` }} />
                        </div>
                      </div>
                      <p
                        className={cn(
                          "text-right text-sm font-bold tabular-nums",
                          row.delta > 0 ? "text-red-500" : row.delta < 0 ? "text-emerald-500" : "text-muted-foreground",
                        )}
                      >
                        {row.delta > 0 ? "+" : ""}{row.delta}ms
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
