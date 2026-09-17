"use client";

import { useMemo } from "react";
import { Database, Box, Zap } from "lucide-react";
import type { Span } from "@/types/skywalking";
import {
  findCriticalPathSpanKeys,
  getTraceTiming,
  spanDuration,
  spanKey,
} from "@/lib/traceAnalysis";
import { cn } from "@/lib/utils";

type TraceWaterfallProps = {
  spans: Span[];
};

export function TraceWaterfall({ spans }: TraceWaterfallProps) {
  const timing = useMemo(() => getTraceTiming(spans), [spans]);
  const criticalKeys = useMemo(() => findCriticalPathSpanKeys(spans), [spans]);
  const sortedSpans = useMemo(
    () => [...spans].sort((a, b) => a.startTime - b.startTime),
    [spans],
  );

  const { startTime, totalDuration } = timing;

  return (
    <div className="space-y-1 relative">
      {sortedSpans.map((span, index) => {
        const key = spanKey(span);
        const offset = span.startTime - startTime;
        const duration = spanDuration(span);
        const leftPct = (offset / totalDuration) * 100;
        const widthPct = Math.max(0.5, (duration / totalDuration) * 100);
        const isDb =
          span.type === "Exit" &&
          (span.component === "PostgreSQL" || span.component === "MongoDB");
        const isCritical = criticalKeys.has(key);

        return (
          <div
            key={`${key}-${index}`}
            className={cn(
              "relative h-9 flex items-center group rounded px-2 -mx-2 transition-colors",
              isCritical
                ? "bg-amber-500/10 ring-1 ring-amber-400/25"
                : "hover:bg-muted/40",
            )}
          >
            <div className="w-1/4 min-w-[200px] pr-4 flex items-center gap-2 truncate border-r border-border mr-4">
              {isCritical ? (
                <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              ) : isDb ? (
                <Database className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              ) : (
                <Box className="w-3.5 h-3.5 text-primary shrink-0" />
              )}
              <span
                className={cn(
                  "text-xs font-mono truncate",
                  isCritical ? "text-amber-700 dark:text-amber-300 font-medium" : "text-muted-foreground group-hover:text-foreground",
                )}
              >
                {span.endpointName}
              </span>
            </div>

            <div className="flex-1 relative h-full flex items-center">
              <div
                className={cn(
                  "absolute h-5 rounded text-[10px] flex items-center px-2 text-white whitespace-nowrap overflow-visible shadow-sm",
                  span.isError
                    ? "bg-red-500"
                    : isCritical
                      ? "bg-gradient-to-r from-amber-500 to-orange-500"
                      : isDb
                        ? "bg-orange-500"
                        : "bg-primary",
                )}
                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
              >
                <span className={widthPct < 5 ? "absolute left-full ml-2 text-muted-foreground" : ""}>
                  {duration}ms {span.component && `(${span.component})`}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
