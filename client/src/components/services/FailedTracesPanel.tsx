"use client";

import { useQuery } from "@apollo/client";
import { Link } from "wouter";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Flame } from "lucide-react";
import { GET_TRACES } from "@/apollo/queries/traces";
import { useDurationStore } from "@/store/useDurationStore";
import { cn } from "@/lib/utils";

function formatTraceTime(start: string) {
  const ts = Number(start);
  if (!Number.isFinite(ts)) return "—";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function FailedTracesPanel() {
  const { durationObj } = useDurationStore();

  const { data, loading } = useQuery(GET_TRACES, {
    variables: {
      condition: {
        queryDuration: durationObj,
        traceState: "ERROR",
        queryOrder: "BY_START_TIME",
        paging: { pageNum: 1, pageSize: 5 },
      },
    },
    fetchPolicy: "network-only",
  });

  const traces = data?.queryBasicTraces?.traces ?? [];

  return (
    <section className="so-insight-panel so-insight-panel--danger h-full flex flex-col">
      <header className="flex items-start justify-between gap-3 p-4 border-b border-red-500/15">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/10 text-red-500 ring-1 ring-red-500/20">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Last 5 failed traces</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Recent errors in the selected window</p>
          </div>
        </div>
        <Link
          href="/traces"
          className="text-[11px] font-medium text-red-500 hover:text-red-400 inline-flex items-center gap-1 shrink-0"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </header>

      <div className="flex-1 p-3 space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-muted/40 animate-pulse" />
          ))
        ) : traces.length === 0 ? (
          <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-3">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-foreground">No errors detected</p>
            <p className="text-xs text-muted-foreground mt-1">All traces succeeded in this time range</p>
          </div>
        ) : (
          traces.map((trace: {
            key: string;
            traceIds: string[];
            endpointNames: string[];
            duration: number;
            start: string;
          }) => {
            const traceId = trace.traceIds?.[0] || trace.key;
            const endpoint = trace.endpointNames?.[0] || "Unknown endpoint";

            return (
              <Link key={trace.key} href={`/traces/${traceId}`}>
                <div className="group rounded-xl border border-red-500/10 bg-gradient-to-r from-red-500/[0.06] to-transparent px-3 py-2.5 hover:border-red-500/25 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-500">
                          <AlertTriangle className="h-3 w-3" />
                          Error
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground truncate">
                          {traceId.slice(0, 8)}…{traceId.slice(-6)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-red-500 transition-colors">
                        {endpoint}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold tabular-nums text-red-500">{trace.duration}ms</p>
                      <p className="text-[10px] text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {formatTraceTime(trace.start)}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {!loading && traces.length > 0 && (
        <footer className="px-4 py-2.5 border-t border-red-500/10 text-[11px] text-muted-foreground">
          <span className={cn("font-medium", traces.length > 0 ? "text-red-500" : "text-emerald-500")}>
            {traces.length} recent failure{traces.length === 1 ? "" : "s"}
          </span>
          {" "}captured from SkyWalking
        </footer>
      )}
    </section>
  );
}
