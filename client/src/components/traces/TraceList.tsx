import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import type { Trace } from '@/types/skywalking';
import { format } from 'date-fns';

interface TraceListProps {
  traces: Trace[];
  selectedTraceId?: string;
  onSelectTrace: (traceId: string) => void;
  loading?: boolean;
}

export function TraceList({ traces, selectedTraceId, onSelectTrace, loading }: TraceListProps) {
  if (loading && traces.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 bg-card/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (traces.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border border-dashed border-white/10 rounded-lg">
        No traces found for the selected time range.
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-280px)] pr-4">
      <div className="space-y-3">
        {traces.map((trace) => {
          // TraceId is usually the first one in list or the key
          const id = trace.traceIds[0] || trace.key;
          const isSelected = selectedTraceId === id;

          return (
            <div
              key={trace.key}
              onClick={() => onSelectTrace(id)}
              className={`
                group relative p-4 rounded-xl border cursor-pointer transition-all duration-200
                ${isSelected 
                  ? 'bg-primary/5 border-primary shadow-[0_0_15px_-5px_var(--primary)]' 
                  : 'bg-card/40 border-white/5 hover:border-white/20 hover:bg-card/60'}
              `}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {trace.isError ? (
                      <Badge variant="destructive" className="h-5 px-1.5 rounded-sm">
                        <AlertCircle className="w-3 h-3 mr-1" /> Error
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="h-5 px-1.5 rounded-sm border-green-500/30 text-green-500 bg-green-500/5">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Success
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                      {id.slice(0, 8)}...{id.slice(-8)}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    {trace.endpointNames.map((ep, idx) => (
                      <div key={idx} className="text-sm font-medium truncate text-foreground/90 group-hover:text-primary transition-colors">
                        {ep}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 text-right">
                  <div className="flex items-center text-xs text-muted-foreground font-mono">
                    <Clock className="w-3 h-3 mr-1.5" />
                    {new Date(Number(trace.start)).toLocaleTimeString()}
                  </div>
                  <div className={`
                    text-sm font-bold font-mono px-2 py-0.5 rounded
                    ${trace.duration > 500 ? 'bg-orange-500/10 text-orange-400' : 'bg-secondary text-secondary-foreground'}
                  `}>
                    {trace.duration}ms
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
