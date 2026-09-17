"use client";

import { Flame } from "lucide-react";
import type { DbSpanRow } from "@/lib/dbTraceAnalysis";
import { DbQueryRow } from "./DbQueryRow";

export function FailedDbQueriesPanel({
  spans,
  loading,
}: {
  spans: DbSpanRow[];
  loading?: boolean;
}) {
  return (
    <section className="so-insight-panel so-insight-panel--danger h-full flex flex-col">
      <header className="p-4 border-b border-red-500/15">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/10 text-red-500 ring-1 ring-red-500/20">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Failed DB queries</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Storage spans marked as errors in traces</p>
          </div>
        </div>
      </header>

      <div className="flex-1 p-3 space-y-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted/40 animate-pulse" />)
        ) : spans.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No failed database queries in this window.</div>
        ) : (
          spans.map((span) => <DbQueryRow key={span.key} span={span} accent="danger" />)
        )}
      </div>
    </section>
  );
}
