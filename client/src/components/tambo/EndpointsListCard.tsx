"use client";

import { Card } from "@/components/ui/card";
import { Route } from "lucide-react";

export function EndpointsListCard({ endpoints = [], serviceName }: any) {
  const safeEndpoints = endpoints ?? [];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">
        API Endpoints ({safeEndpoints.length})
      </h3>
      
      <div className="grid gap-2">
        {safeEndpoints.map((ep: any, idx: number) => {
          
          const endpointPath = ep.name || ep.endpointName || ep.path || `Endpoint ${idx + 1}`;
          
          return (
            <Card key={ep.id || idx} className="p-3 bg-[#0f172a]/80 border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-green-500/10 rounded">
                  <Route className="w-4 h-4 text-green-400" />
                </div>
                <span className="font-mono text-sm text-slate-100 break-all">
                  {endpointPath}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}