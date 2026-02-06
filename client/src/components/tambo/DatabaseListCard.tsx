"use client";

import { Card } from "@/components/ui/card";
import { Database, Server } from "lucide-react";

export function DatabaseListCard({ databases = [] }: { databases?: any[] }) {
  const safeDbs = databases ?? [];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
        Detected Databases ({safeDbs.length})
      </h3>
      <div className="grid gap-2">
        {safeDbs.length > 0 ? (
          safeDbs.map((db) => (
            <Card key={db.id} className="p-3 bg-[#0f172a]/80 border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-white">{db.name}</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground bg-white/5 px-2 py-0.5 rounded">
                {db.type}
              </span>
            </Card>
          ))
        ) : (
          <p className="text-xs text-muted-foreground p-4 text-center border border-dashed border-white/10 rounded">
            No databases discovered in this window.
          </p>
        )}
      </div>
    </div>
  );
}