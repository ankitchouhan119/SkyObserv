"use client";

import { useMemo, useState } from "react";
import type { Span } from "@/types/skywalking";
import {
  buildSpanTree,
  findCriticalPathSpanKeys,
  getTraceTiming,
  serviceColor,
  spanDuration,
  spanKey,
  type SpanNode,
} from "@/lib/traceAnalysis";
import { cn } from "@/lib/utils";

type FlameGraphProps = {
  spans: Span[];
};

function FlameNode({
  node,
  timing,
  criticalKeys,
  widthPct,
  leftPct,
  onHover,
  hoveredKey,
}: {
  node: SpanNode;
  timing: ReturnType<typeof getTraceTiming>;
  criticalKeys: Set<string>;
  widthPct: number;
  leftPct: number;
  onHover: (key: string | null) => void;
  hoveredKey: string | null;
}) {
  const { span, children, key } = node;
  const duration = spanDuration(span);
  const isCritical = criticalKeys.has(key);
  const isHovered = hoveredKey === key;
  const color = span.isError ? "#EF4444" : serviceColor(span.serviceCode);

  const childTimingStart = span.startTime;
  const childTimingDuration = duration;

  return (
    <div className="flex flex-col gap-0.5 min-w-0" style={{ width: `${widthPct}%`, marginLeft: `${leftPct}%` }}>
      <button
        type="button"
        title={`${span.endpointName} · ${duration}ms · ${span.serviceCode}`}
        onMouseEnter={() => onHover(key)}
        onMouseLeave={() => onHover(null)}
        className={cn(
          "h-7 rounded-md border text-left px-2 overflow-hidden transition-all",
          isCritical ? "ring-2 ring-amber-400/80 border-amber-400/50" : "border-white/10",
          isHovered && "brightness-110 scale-[1.01] z-10 shadow-md",
        )}
        style={{
          background: `linear-gradient(135deg, ${color}ee, ${color}aa)`,
          minWidth: "2%",
        }}
      >
        <span className="text-[10px] font-medium text-white truncate block">
          {span.endpointName}
        </span>
      </button>

      {children.length > 0 && (
        <div className="flex w-full min-w-0">
          {children.map((child) => {
            const childDuration = spanDuration(child.span);
            const childLeft = ((child.span.startTime - childTimingStart) / childTimingDuration) * 100;
            const childWidth = (childDuration / childTimingDuration) * 100;

            return (
              <FlameNode
                key={child.key}
                node={child}
                timing={timing}
                criticalKeys={criticalKeys}
                widthPct={childWidth}
                leftPct={childLeft}
                onHover={onHover}
                hoveredKey={hoveredKey}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function FlameGraph({ spans }: FlameGraphProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const timing = useMemo(() => getTraceTiming(spans), [spans]);
  const tree = useMemo(() => buildSpanTree(spans), [spans]);
  const criticalKeys = useMemo(() => findCriticalPathSpanKeys(spans), [spans]);
  const hoveredSpan = useMemo(() => {
    if (!hoveredKey) return null;
    return spans.find((span) => spanKey(span) === hoveredKey) ?? null;
  }, [hoveredKey, spans]);

  if (tree.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No spans to render.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-1">
          <span className="h-2 w-2 rounded-sm bg-primary" />
          Width = span duration
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-amber-600 dark:text-amber-400">
          <span className="h-2 w-2 rounded-sm ring-2 ring-amber-400" />
          Critical path
        </span>
      </div>

      <div className="rounded-xl border border-border bg-muted/20 p-3 overflow-x-auto">
        <div className="min-w-[720px] space-y-1">
          {tree.map((root) => {
            const rootDuration = spanDuration(root.span);
            const leftPct = ((root.span.startTime - timing.startTime) / timing.totalDuration) * 100;
            const widthPct = (rootDuration / timing.totalDuration) * 100;

            return (
              <FlameNode
                key={root.key}
                node={root}
                timing={timing}
                criticalKeys={criticalKeys}
                widthPct={widthPct}
                leftPct={leftPct}
                onHover={setHoveredKey}
                hoveredKey={hoveredKey}
              />
            );
          })}
        </div>
      </div>

      {hoveredSpan && (
        <div className="rounded-lg border border-border bg-card/80 px-3 py-2 text-xs">
          <p className="font-semibold text-foreground">{hoveredSpan.endpointName}</p>
          <p className="text-muted-foreground mt-0.5">
            {hoveredSpan.serviceCode} · {spanDuration(hoveredSpan)}ms · {hoveredSpan.component}
          </p>
        </div>
      )}
    </div>
  );
}
