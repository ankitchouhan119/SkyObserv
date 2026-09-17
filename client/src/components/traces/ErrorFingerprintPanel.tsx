"use client";

import { Link } from "wouter";
import { Fingerprint, ArrowRight } from "lucide-react";
import type { ErrorFingerprintGroup } from "@/lib/traceAnalysis";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type ErrorFingerprintPanelProps = {
  groups: ErrorFingerprintGroup[];
  loading?: boolean;
  title?: string;
  subtitle?: string;
  compact?: boolean;
};

export function ErrorFingerprintPanel({
  groups,
  loading,
  title = "Error fingerprints",
  subtitle = "Grouped by endpoint + failure signature",
  compact = false,
}: ErrorFingerprintPanelProps) {
  return (
    <section
      className={cn(
        "so-insight-panel so-insight-panel--danger min-h-0",
        compact ? "flex flex-col" : "h-full flex flex-col overflow-hidden",
      )}
    >
      <header className="shrink-0 flex items-start justify-between gap-3 p-4 border-b border-red-500/15">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/20 to-violet-500/10 text-red-500 ring-1 ring-red-500/20">
            <Fingerprint className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </div>
      </header>

      <div className={cn("p-3 space-y-2 overflow-y-auto min-h-0", compact ? "max-h-64" : "flex-1")}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-muted/40 animate-pulse" />
          ))
        ) : groups.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No error fingerprints in this view.
          </div>
        ) : (
          groups.map((group) => (
            <div
              key={group.fingerprint}
              className="rounded-xl border border-red-500/10 bg-gradient-to-r from-red-500/[0.05] to-transparent px-3 py-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{group.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-mono truncate">
                    {group.fingerprint}
                  </p>
                  {group.lastSeen > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Last seen {format(new Date(group.lastSeen), "HH:mm:ss")}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold tabular-nums text-red-500">{group.count}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">hits</p>
                </div>
              </div>

              {group.traceIds[0] && (
                <Link href={`/traces/${group.traceIds[0]}`}>
                  <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-red-500 hover:underline cursor-pointer">
                    Open sample trace
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
