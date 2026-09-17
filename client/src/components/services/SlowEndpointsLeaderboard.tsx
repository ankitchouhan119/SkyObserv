"use client";

import { Link } from "wouter";
import { Gauge, Trophy, Zap } from "lucide-react";
import { useSlowEndpoints } from "@/hooks/use-slow-endpoints";
import { cn } from "@/lib/utils";

type ServiceRef = { id: string; name: string };

const rankStyles: Record<number, string> = {
  1: "from-amber-400/25 to-yellow-500/10 text-amber-500 ring-amber-400/30",
  2: "from-slate-300/25 to-slate-400/10 text-slate-500 ring-slate-400/30",
  3: "from-orange-400/20 to-orange-500/10 text-orange-500 ring-orange-400/25",
};

function RankBadge({ rank }: { rank: number }) {
  const style = rankStyles[rank] ?? "from-primary/15 to-primary/5 text-primary ring-primary/20";

  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ring-1 text-xs font-bold tabular-nums",
        style,
      )}
    >
      {rank <= 3 ? <Trophy className="h-3.5 w-3.5" /> : rank}
    </div>
  );
}

export function SlowEndpointsLeaderboard({ services }: { services: ServiceRef[] }) {
  const { items, loading } = useSlowEndpoints(services, 5);
  const maxLatency = items[0]?.latencyMs ?? 1;

  return (
    <section className="so-insight-panel so-insight-panel--accent h-full flex flex-col">
      <header className="flex items-start justify-between gap-3 p-4 border-b border-sky-500/15">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-violet-500/10 text-sky-500 ring-1 ring-sky-500/20">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Slow endpoints leaderboard</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Highest avg latency across services</p>
          </div>
        </div>
      </header>

      <div className="flex-1 p-3 space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted/40 animate-pulse" />
          ))
        ) : items.length === 0 ? (
          <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
              <Zap className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-foreground">No endpoint latency yet</p>
            <p className="text-xs text-muted-foreground mt-1">Send traffic to populate the leaderboard</p>
          </div>
        ) : (
          items.map((row) => {
            const widthPct = Math.max(12, Math.round((row.latencyMs / maxLatency) * 100));

            return (
              <Link
                key={`${row.serviceId}-${row.endpointId}`}
                href={`/services/${row.serviceId}/endpoints/${row.endpointId}?name=${encodeURIComponent(row.endpointName)}`}
              >
                <div className="group rounded-xl border border-border/70 bg-card/60 px-3 py-2.5 hover:border-sky-500/30 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-start gap-3">
                    <RankBadge rank={row.rank} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-sky-500 transition-colors">
                          {row.endpointName}
                        </p>
                        <span className="text-sm font-bold tabular-nums text-sky-600 dark:text-sky-400 shrink-0">
                          {row.latencyMs}
                          <span className="text-[10px] font-medium text-muted-foreground ml-0.5">ms</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mb-2">{row.serviceName}</p>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-violet-500 transition-all duration-500"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
