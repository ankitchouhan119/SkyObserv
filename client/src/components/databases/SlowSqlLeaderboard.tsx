"use client";

import { Link } from "wouter";
import { Gauge, Trophy } from "lucide-react";
import type { SlowSqlRow } from "@/lib/dbTraceAnalysis";
import { cn } from "@/lib/utils";

const rankStyles: Record<number, string> = {
  1: "from-amber-400/25 to-yellow-500/10 text-amber-500 ring-amber-400/30",
  2: "from-slate-300/25 to-slate-400/10 text-slate-500 ring-slate-400/30",
  3: "from-orange-400/20 to-orange-500/10 text-orange-500 ring-orange-400/25",
};

export function SlowSqlLeaderboard({
  rows,
  loading,
}: {
  rows: SlowSqlRow[];
  loading?: boolean;
}) {
  const maxLatency = rows[0]?.maxLatency ?? 1;

  return (
    <section className="so-insight-panel so-insight-panel--accent h-full flex flex-col">
      <header className="p-4 border-b border-violet-500/15">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 text-violet-500 ring-1 ring-violet-500/20">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Slow SQL leaderboard</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Ranked by max execution time</p>
          </div>
        </div>
      </header>

      <div className="flex-1 p-3 space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted/40 animate-pulse" />)
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No query latency data in this window.</div>
        ) : (
          rows.map((row) => {
            const widthPct = Math.max(10, Math.round((row.maxLatency / maxLatency) * 100));
            const rankStyle = rankStyles[row.rank] ?? "from-primary/15 to-primary/5 text-primary ring-primary/20";

            return (
              <Link key={row.fingerprint} href={`/traces/${row.sampleTraceId}`}>
                <div className="group rounded-xl border border-border/70 bg-card/60 px-3 py-2.5 hover:border-violet-500/30 transition-all cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ring-1", rankStyle)}>
                      {row.rank <= 3 ? <Trophy className="h-3.5 w-3.5" /> : row.rank}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-mono text-foreground truncate group-hover:text-violet-500 transition-colors">
                        {row.statement}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {row.count} execution{row.count === 1 ? "" : "s"} · avg {row.avgLatency}ms
                      </p>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-2">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold tabular-nums text-violet-600 dark:text-violet-400">
                        {row.maxLatency}<span className="text-[10px] font-medium text-muted-foreground ml-0.5">ms</span>
                      </p>
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
