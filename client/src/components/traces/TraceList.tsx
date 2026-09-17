import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import type { Trace } from '@/types/skywalking';
import { cn } from '@/lib/utils';

interface TraceListProps {
  traces: Trace[];
  selectedTraceId?: string;
  onSelectTrace: (traceId: string) => void;
  loading?: boolean;
  compareMode?: boolean;
  compareSelection?: string[];
  onCompareToggle?: (traceId: string, checked: boolean) => void;
}

export function TraceList({
  traces,
  selectedTraceId,
  onSelectTrace,
  loading,
  compareMode = false,
  compareSelection = [],
  onCompareToggle,
}: TraceListProps) {
  if (loading && traces.length === 0) {
    return (
      <div className="h-full min-h-0 space-y-3 overflow-y-auto pr-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 so-card animate-pulse" />
        ))}
      </div>
    );
  }

  if (traces.length === 0) {
    return (
      <div className="h-full min-h-[12rem] flex items-center justify-center text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl so-card">
        No traces found for the selected time range.
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col">
    <ScrollArea className="h-full min-h-0 flex-1 pr-2">
      <div className="space-y-2 pb-1">
        {traces.map((trace) => {
          const id = trace.traceIds[0] || trace.key;
          const isSelected = selectedTraceId === id;
          const isCompared = compareSelection.includes(id);

          return (
            <div
              key={trace.key}
              onClick={() => onSelectTrace(id)}
              className={cn(
                'group relative p-4 rounded-xl border cursor-pointer transition-all duration-200',
                isSelected
                  ? 'bg-primary/5 border-primary shadow-sm'
                  : isCompared
                    ? 'bg-violet-500/5 border-violet-500/30 shadow-sm'
                    : 'so-card hover:border-primary/20 hover:shadow-md',
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {compareMode && onCompareToggle && (
                    <div
                      className="pt-0.5"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Checkbox
                        checked={isCompared}
                        disabled={!isCompared && compareSelection.length >= 2}
                        onCheckedChange={(checked) => onCompareToggle(id, Boolean(checked))}
                        aria-label={`Compare trace ${id}`}
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {trace.isError ? (
                        <Badge variant="destructive" className="h-5 px-1.5 rounded-sm">
                          <AlertCircle className="w-3 h-3 mr-1" /> Error
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="h-5 px-1.5 rounded-sm border-primary/30 text-primary bg-primary/5">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Success
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                        {id.slice(0, 8)}...{id.slice(-8)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {trace.endpointNames.map((ep, idx) => (
                        <div key={idx} className="text-sm font-medium truncate text-foreground group-hover:text-primary transition-colors">
                          {ep}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 text-right shrink-0">
                  <div className="flex items-center text-xs text-muted-foreground font-mono">
                    <Clock className="w-3 h-3 mr-1.5" />
                    {new Date(Number(trace.start)).toLocaleTimeString()}
                  </div>
                  <div className={cn(
                    'text-sm font-semibold font-mono px-2 py-0.5 rounded',
                    trace.duration > 500 ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400' : 'bg-muted text-foreground',
                  )}>
                    {trace.duration}ms
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
    </div>
  );
}
