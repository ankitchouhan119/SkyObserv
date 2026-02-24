"use client";
import React from 'react';
import { useQuery } from '@apollo/client';
import { Card } from '@/components/ui/card';
import { AlertCircle, Activity, Clock } from 'lucide-react';
import { GET_EVENTS } from '@/apollo/queries/kubernetes';
import { useDurationStore } from '@/store/useDurationStore';
import { cn } from '@/lib/utils';

interface K8sPodEventsPanelProps {
  instanceId: string;
  serviceName: string;
}

export function K8sPodEventsPanel({ instanceId, serviceName }: K8sPodEventsPanelProps) {
  const { durationObj } = useDurationStore();

  const { data: eventsData, loading: eventsLoading } = useQuery(GET_EVENTS, {
    variables: {
      condition: {
        time: durationObj,
        paging: { pageNum: 1, pageSize: 50 },
        source: {
          serviceInstance: instanceId,
          service: serviceName,
        },
      },
    },
    fetchPolicy: 'network-only',
    skip: !instanceId,
  });

  const events = eventsData?.events?.events || [];

  return (
    <Card className="p-6 bg-slate-900/40 border-white/5 rounded-xl min-h-[400px]">
      <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-6">
        <AlertCircle className="w-4 h-4" /> Instance Events (OAP)
      </h3>

      {eventsLoading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white/5 rounded-lg" />)}
        </div>
      )}

      {!eventsLoading && events.length === 0 && (
        <div className="text-center py-20 text-muted-foreground flex flex-col items-center justify-center opacity-50">
          <Activity className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-xs uppercase font-bold tracking-wider">No events recorded for this instance.</p>
          <p className="text-[10px] mt-1">Try expanding the time range.</p>
        </div>
      )}

      <div className="space-y-3">
        {events.map((event: any, i: number) => {
          const isNormal = event.type === 'Normal';
          return (
            <div key={i} className="flex gap-4 p-4 bg-white/[0.02] rounded-xl border border-white/5 hover:border-blue-500/20 transition-colors group relative overflow-hidden">
              <div className={cn("absolute left-0 top-0 bottom-0 w-1", isNormal ? "bg-blue-500" : "bg-orange-500")} />
              <div className="pl-2 flex-1">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    {event.name}
                    {!isNormal && <span className="text-[9px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">Warning</span>}
                  </p>
                  <span className="text-muted-foreground text-[10px] font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(Number(event.startTime)).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground opacity-80 leading-relaxed font-mono">
                  {event.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}