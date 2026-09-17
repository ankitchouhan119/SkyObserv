"use client";

import { useMemo } from "react";
import { Route, Zap } from "lucide-react";
import type { Span } from "@/types/skywalking";
import {
  findCriticalPathSpanKeys,
  getTraceTiming,
  spanDuration,
  spanKey,
} from "@/lib/traceAnalysis";

type CriticalPathBannerProps = {
  spans: Span[];
};

export function CriticalPathBanner({ spans }: CriticalPathBannerProps) {
  const criticalKeys = useMemo(() => findCriticalPathSpanKeys(spans), [spans]);
  const timing = useMemo(() => getTraceTiming(spans), [spans]);

  const pathSpans = useMemo(() => {
    const keyed = spans.filter((span) => criticalKeys.has(spanKey(span)));
    return keyed.sort((a, b) => a.startTime - b.startTime);
  }, [spans, criticalKeys]);

  const pathDuration = pathSpans.reduce((sum, span) => sum + spanDuration(span), 0);
  const pathShare = Math.round((pathDuration / timing.totalDuration) * 100);

  if (pathSpans.length === 0) return null;

  return (
    <section className="rounded-xl border border-amber-400/25 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500 ring-1 ring-amber-400/30 shrink-0">
          <Route className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-foreground">Critical path</h3>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
              ~{pathShare}% of trace time
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Longest dependency chain from entry to the span that finished last.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {pathSpans.map((span, index) => (
              <div key={spanKey(span)} className="flex items-center gap-1.5 min-w-0">
                <span
                  className="inline-flex items-center gap-1 max-w-[220px] truncate rounded-lg border border-amber-400/30 bg-card/80 px-2 py-1 text-[11px] font-medium text-foreground"
                  title={`${span.endpointName} (${spanDuration(span)}ms)`}
                >
                  <Zap className="h-3 w-3 text-amber-500 shrink-0" />
                  <span className="truncate">{span.endpointName}</span>
                  <span className="text-muted-foreground tabular-nums shrink-0">{spanDuration(span)}ms</span>
                </span>
                {index < pathSpans.length - 1 && (
                  <span className="text-amber-500/70 text-xs">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
