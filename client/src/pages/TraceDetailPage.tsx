import React from 'react';
import { useRoute, Link } from 'wouter';
import { useQuery } from '@apollo/client';
import { GET_TRACE_DETAILS } from '@/apollo/queries/traces';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Database, Box } from 'lucide-react';
import { format } from 'date-fns';
import type { Span } from '@/types/skywalking';

export default function TraceDetailPage() {
  const [, params] = useRoute('/traces/:id');
  const traceId = params?.id || '';

  const { data, loading, error } = useQuery(GET_TRACE_DETAILS, {
    variables: { traceId },
    skip: !traceId,
  });

  const spans: Span[] = data?.queryTrace?.spans || [];
  const sortedSpans = [...spans].sort((a, b) => a.startTime - b.startTime);
  const rootSpan = sortedSpans[0];
  const startTime = rootSpan?.startTime || 0;
  const totalDuration = rootSpan ? (rootSpan.endTime - rootSpan.startTime) : 0;

  return (
    <AppLayout>
      <div className="so-page">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <Link href="/traces">
              <Button variant="ghost" size="sm" className="pl-0 hover:bg-transparent hover:text-primary">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Traces
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-base font-mono font-semibold text-foreground">{traceId}</h1>
              {rootSpan?.isError && (
                <Badge variant="destructive">Error</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground text-xs">Start time</span>
              <span className="font-mono font-medium">
                {startTime ? format(new Date(startTime), 'yyyy-MM-dd HH:mm:ss.SSS') : '-'}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground text-xs">Total duration</span>
              <span className="font-mono font-semibold text-lg text-primary">
                {totalDuration} ms
              </span>
            </div>
          </div>
        </div>

        <div className="so-card p-5 overflow-hidden">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-8 bg-muted rounded animate-pulse" />)}
            </div>
          ) : error ? (
            <div className="text-destructive p-4">Error loading trace details</div>
          ) : sortedSpans.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p className="font-medium text-foreground mb-1">No trace details available</p>
              <p className="text-sm max-w-md mx-auto">
                This trace may be from another service (e.g. old redis traces before your account was set up),
                or it has expired from storage. Only traces from your linked services are accessible.
              </p>
            </div>
          ) : (
            <div className="space-y-1 relative">
              {sortedSpans.map((span, index) => {
                const offset = span.startTime - startTime;
                const duration = Math.max(1, span.endTime - span.startTime);
                const leftPct = (offset / totalDuration) * 100;
                const widthPct = Math.max(0.5, (duration / totalDuration) * 100);
                const isDb = span.type === 'Exit' && (span.component === 'PostgreSQL' || span.component === 'MongoDB');

                return (
                  <div key={`${span.spanId}-${index}`} className="relative h-9 flex items-center group hover:bg-muted/40 rounded px-2 -mx-2 transition-colors">
                    <div className="w-1/4 min-w-[200px] pr-4 flex items-center gap-2 truncate border-r border-border mr-4">
                      {isDb ? <Database className="w-3.5 h-3.5 text-orange-500" /> : <Box className="w-3.5 h-3.5 text-primary" />}
                      <span className="text-xs font-mono truncate text-muted-foreground group-hover:text-foreground">
                        {span.endpointName}
                      </span>
                    </div>

                    <div className="flex-1 relative h-full flex items-center">
                      <div
                        className={`
                          absolute h-5 rounded text-[10px] flex items-center px-2 text-white whitespace-nowrap overflow-visible shadow-sm
                          ${span.isError ? 'bg-red-500' : isDb ? 'bg-orange-500' : 'bg-primary'}
                        `}
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      >
                        <span className={widthPct < 5 ? 'absolute left-full ml-2 text-muted-foreground' : ''}>
                          {duration}ms {span.component && `(${span.component})`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
