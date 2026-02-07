"use client";

import { Card } from "@/components/ui/card";
import { Route, ExternalLink, ChevronRight } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import React from 'react';

export function EndpointsListCard({ endpoints = [] }: { endpoints?: any[] }) {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/services/:id');
  const serviceId = params?.id || '';

  // Log for verification
  console.log("Card Rendering with Data:", endpoints);

  const safeEndpoints = Array.isArray(endpoints) ? endpoints : [];

  const displayName = React.useMemo(() => {
    if (!serviceId) return 'online-bookstore';
    try {
      return serviceId.includes('.') ? atob(serviceId.split('.')[0]) : serviceId;
    } catch { return serviceId; }
  }, [serviceId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Endpoints Detected
          </h3>
          <p className="text-[10px] text-muted-foreground font-mono italic">
            {displayName}
          </p>
        </div>
        <div className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded border border-emerald-500/20">
          {safeEndpoints.length} TOTAL
        </div>
      </div>

      <div className="grid gap-2">
        {safeEndpoints.length > 0 ? (
          safeEndpoints.map((ep: any, idx: number) => {
            const pathName = typeof ep === 'string' ? ep : (ep.name || ep.endpointPath || "Unknown Path");
            const endpointId = typeof ep === 'object' ? ep.id : `ep-${idx}`;

            return (
              <Card 
                key={endpointId} 
                className="group relative overflow-hidden bg-[#0f172a]/40 border-white/5 hover:border-emerald-500/30 transition-all duration-300"
              >
                <div className="relative p-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                      <Route className="w-4 h-4 text-emerald-400" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm text-slate-100 truncate">
                        {pathName}
                      </p>
                      <p className="text-[9px] text-muted-foreground font-mono mt-0.5 opacity-40">
                        {typeof ep === 'object' ? `ID: ${ep.id?.split('_').pop()?.substring(0, 8)}` : 'Live API Endpoint'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {serviceId && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10"
                        onClick={() => setLocation(`/services/${serviceId}/endpoints/${endpointId}?name=${encodeURIComponent(pathName)}`)}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </div>
              </Card>
            )
          })
        ) : (
          <div className="p-8 text-center border border-dashed border-white/10 rounded-xl text-muted-foreground text-sm">
            No endpoints found.
          </div>
        )}
      </div>
    </div>
  );
}