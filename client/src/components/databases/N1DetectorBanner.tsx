"use client";

import { Link } from "wouter";
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { N1Alert } from "@/lib/dbTraceAnalysis";

export function N1DetectorBanner({ alerts }: { alerts: N1Alert[] }) {
  if (alerts.length === 0) return null;

  const top = alerts[0];

  return (
    <section className="rounded-xl border border-amber-400/30 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-400/30 shrink-0">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-foreground">Possible N+1 query pattern</h3>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
              {alerts.length} trace{alerts.length === 1 ? "" : "s"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Same query repeated many times inside a single trace — common with ORM loops.
          </p>
          <p className="text-sm font-mono text-foreground mt-2 truncate" title={top.label}>
            {top.label}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {top.count} repeats in one trace · {top.serviceCode} · max {top.maxLatency}ms
          </p>
          <Link href={`/traces/${top.traceId}`}>
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 hover:underline cursor-pointer">
              Inspect trace
              <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
