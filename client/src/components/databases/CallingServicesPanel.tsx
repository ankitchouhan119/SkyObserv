"use client";

import { Server } from "lucide-react";
import type { CallingServiceRow } from "@/lib/dbTraceAnalysis";
import { cn } from "@/lib/utils";

export function CallingServicesPanel({
  services,
  loading,
}: {
  services: CallingServiceRow[];
  loading?: boolean;
}) {
  const maxCount = services[0]?.count ?? 1;

  return (
    <section className="so-card overflow-hidden">
      <header className="p-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="so-icon-wrap bg-primary/10 text-primary">
            <Server className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Calling services</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Which apps hit this storage in the selected window</p>
          </div>
        </div>
      </header>

      <div className="p-3 space-y-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 rounded-lg bg-muted/40 animate-pulse" />)
        ) : services.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No calling services found in traces.</p>
        ) : (
          services.map((service) => {
            const widthPct = Math.max(8, Math.round((service.count / maxCount) * 100));
            return (
              <div key={service.service} className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <p className="text-sm font-medium text-foreground truncate">{service.service}</p>
                  <p className="text-xs text-muted-foreground tabular-nums shrink-0">
                    {service.count} calls · {service.avgLatency}ms avg
                  </p>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary/80" style={{ width: `${widthPct}%` }} />
                </div>
                {service.errorCount > 0 && (
                  <p className={cn("text-[10px] mt-1.5 font-medium text-red-500")}>
                    {service.errorCount} failed query{service.errorCount === 1 ? "" : "ies"}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
