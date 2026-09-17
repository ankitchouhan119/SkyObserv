"use client";

import { Link } from "wouter";
import { ArrowRight, Clock } from "lucide-react";
import type { DbSpanRow } from "@/lib/dbTraceAnalysis";
import { cn } from "@/lib/utils";

type DbQueryRowProps = {
  span: DbSpanRow;
  showStatement?: boolean;
  accent?: "default" | "danger";
};

export function DbQueryRow({ span, showStatement = true, accent = "default" }: DbQueryRowProps) {
  return (
    <Link href={`/traces/${span.traceId}`}>
      <div
        className={cn(
          "group rounded-xl border px-3 py-2.5 transition-all cursor-pointer",
          accent === "danger"
            ? "border-red-500/15 bg-gradient-to-r from-red-500/[0.05] to-transparent hover:border-red-500/30"
            : "border-border/70 bg-card/60 hover:border-primary/25 hover:shadow-sm",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {showStatement && (
              <p className="text-sm font-mono text-foreground truncate group-hover:text-primary transition-colors">
                {span.statement}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
              <span className="px-1.5 py-0.5 rounded bg-muted text-foreground/80">{span.component}</span>
              <span>{span.serviceCode}</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(span.time).toLocaleTimeString()}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className={cn(
              "text-sm font-bold tabular-nums",
              accent === "danger" ? "text-red-500" : "text-foreground",
            )}>
              {span.latency}ms
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              View trace
              <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
