import React from 'react';
import { useRoute, Link } from 'wouter';
import { useQuery } from '@apollo/client';
import { GET_TRACE_DETAILS } from '@/apollo/queries/traces';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, AlertTriangle, Database, Box } from 'lucide-react';
import { format } from 'date-fns';
import type { Span } from '@/types/skywalking';

export default function TraceDetailPage() {
  const [match, params] = useRoute('/traces/:id');
  const traceId = params?.id || '';

  const { data, loading, error } = useQuery(GET_TRACE_DETAILS, {
    variables: { traceId },
    skip: !traceId
  });

  const spans: Span[] = data?.queryTrace?.spans || [];
  
  // Sort spans by start time for waterfall
  const sortedSpans = [...spans].sort((a, b) => a.startTime - b.startTime);
  const rootSpan = sortedSpans[0];
  const startTime = rootSpan?.startTime || 0;
  const totalDuration = rootSpan ? (rootSpan.endTime - rootSpan.startTime) : 0;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Link href="/traces">
              <Button variant="ghost" size="sm" className="pl-0 hover:bg-transparent hover:text-primary">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Traces
              </Button>
            </Link>
            <div className="flex items-center gap-3">
               <h1 className="text-xl font-mono font-bold">{traceId}</h1>
               {rootSpan?.isError && (
                 <Badge variant="destructive" className="animate-pulse">Error</Badge>
               )}
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground">Start Time</span>
              <span className="font-mono font-medium">
                {startTime ? format(new Date(startTime), 'yyyy-MM-dd HH:mm:ss.SSS') : '-'}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground">Total Duration</span>
              <span className="font-mono font-bold text-lg text-primary">
                {totalDuration} ms
              </span>
            </div>
          </div>
        </div>

        {/* Gantt / Waterfall Chart */}
        <Card className="p-6 border-white/5 bg-card/50 overflow-hidden">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-8 bg-white/5 rounded animate-pulse" />)}
            </div>
          ) : error ? (
            <div className="text-red-400 p-4">Error loading trace details</div>
          ) : (
            <div className="space-y-1 relative">
              {/* Scale/Grid lines could go here */}
              
              {sortedSpans.map((span, index) => {
                const offset = span.startTime - startTime;
                const duration = Math.max(1, span.endTime - span.startTime); 
                
                const leftPct = (offset / totalDuration) * 100;
                const widthPct = Math.max(0.5, (duration / totalDuration) * 100); 
                
                const isDb = span.type === 'Exit' && (span.component === 'PostgreSQL' || span.component === 'MongoDB');

                return (
                  <div key={`${span.spanId}-${index}`} className="relative h-9 flex items-center group hover:bg-white/5 rounded px-2 -mx-2 transition-colors">
                    {/* Label Column */}
                    <div className="w-1/4 min-w-[200px] pr-4 flex items-center gap-2 truncate border-r border-white/5 mr-4">
                      {isDb ? <Database className="w-3.5 h-3.5 text-orange-400" /> : <Box className="w-3.5 h-3.5 text-blue-400" />}
                      <span className="text-xs font-mono truncate text-muted-foreground group-hover:text-foreground">
                         {span.endpointName}
                      </span>
                    </div>

                    {/* Bar Column */}
                    <div className="flex-1 relative h-full flex items-center">
                      <div 
                        className={`
                          absolute h-5 rounded-md text-[10px] flex items-center px-2 text-white/90 whitespace-nowrap overflow-visible shadow-sm
                          ${span.isError ? 'bg-red-500/80' : isDb ? 'bg-orange-500/70' : 'bg-primary/70'}
                        `}
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      >
                         <span className={`
                           ${widthPct < 5 ? 'absolute left-full ml-2 text-muted-foreground' : ''}
                         `}>
                           {duration}ms {span.component && `(${span.component})`}
                         </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
