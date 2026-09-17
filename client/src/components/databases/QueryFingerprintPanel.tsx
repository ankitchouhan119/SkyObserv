"use client";

import { Link } from "wouter";
import { Fingerprint, ArrowRight } from "lucide-react";
import type { QueryFingerprintGroup } from "@/lib/dbTraceAnalysis";

export function QueryFingerprintPanel({
  groups,
  loading,
}: {
  groups: QueryFingerprintGroup[];
  loading?: boolean;
}) {
  return (
    <section className="so-insight-panel h-full flex flex-col border-violet-500/15 bg-gradient-to-br from-violet-500/[0.03] via-card to-card">
      <header className="p-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500 ring-1 ring-violet-500/20">
            <Fingerprint className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Query fingerprints</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Normalized patterns grouped from traced SQL</p>
          </div>
        </div>
      </header>

      <div className="flex-1 p-3 space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted/40 animate-pulse" />)
        ) : groups.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No query patterns detected yet.</div>
        ) : (
          groups.map((group) => (
            <div key={group.fingerprint} className="rounded-xl border border-border/70 bg-card/70 px-3 py-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-mono text-foreground truncate">{group.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {group.count} hits · avg {group.avgLatency}ms · max {group.maxLatency}ms
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold tabular-nums text-violet-600 dark:text-violet-400">{group.count}</p>
                </div>
              </div>
              <Link href={`/traces/${group.sampleTraceId}`}>
                <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline cursor-pointer">
                  Sample trace
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
