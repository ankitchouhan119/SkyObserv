import React, { useMemo, useState } from 'react';
import { useRoute, Link } from 'wouter';
import { useQuery } from '@apollo/client';
import { GET_TRACE_DETAILS, GET_TRACES } from '@/apollo/queries/traces';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Flame, GitCompare, Layers } from 'lucide-react';
import { format } from 'date-fns';
import type { Span } from '@/types/skywalking';
import { TraceWaterfall } from '@/components/traces/TraceWaterfall';
import { FlameGraph } from '@/components/traces/FlameGraph';
import { CriticalPathBanner } from '@/components/traces/CriticalPathBanner';
import { ErrorFingerprintPanel } from '@/components/traces/ErrorFingerprintPanel';
import { TraceCompareView } from '@/components/traces/TraceCompareView';
import { getTraceErrorFingerprints } from '@/lib/traceAnalysis';
import { useDurationStore } from '@/store/useDurationStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function TraceDetailPage() {
  const [, params] = useRoute('/traces/:id');
  const traceId = params?.id || '';
  const { durationObj } = useDurationStore();
  const [compareTraceId, setCompareTraceId] = useState<string>('');
  const [view, setView] = useState<'analysis' | 'compare'>('analysis');

  const { data, loading, error } = useQuery(GET_TRACE_DETAILS, {
    variables: { traceId },
    skip: !traceId,
  });

  const { data: recentTracesData } = useQuery(GET_TRACES, {
    variables: {
      condition: {
        queryDuration: durationObj,
        traceState: 'ALL',
        queryOrder: 'BY_START_TIME',
        paging: { pageNum: 1, pageSize: 30 },
      },
    },
    skip: !traceId,
  });

  const spans: Span[] = data?.queryTrace?.spans || [];
  const sortedSpans = [...spans].sort((a, b) => a.startTime - b.startTime);
  const rootSpan = sortedSpans[0];
  const startTime = rootSpan?.startTime || 0;
  const totalDuration = rootSpan ? (rootSpan.endTime - rootSpan.startTime) : 0;
  const fingerprints = useMemo(() => getTraceErrorFingerprints(spans), [spans]);

  const compareOptions = (recentTracesData?.queryBasicTraces?.traces ?? [])
    .map((trace: { traceIds?: string[]; key: string; endpointNames?: string[]; duration: number }) => {
      const id = trace.traceIds?.[0] || trace.key;
      return {
        id,
        label: `${trace.endpointNames?.[0] ?? 'trace'} · ${trace.duration}ms`,
      };
    })
    .filter((option: { id: string }) => option.id !== traceId);

  return (
    <AppLayout>
      <div className="so-page-fluid">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <Link href="/traces">
              <Button variant="ghost" size="sm" className="pl-0 hover:bg-transparent hover:text-primary">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Traces
              </Button>
            </Link>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-base font-mono font-semibold text-foreground">{traceId}</h1>
              {rootSpan?.isError && <Badge variant="destructive">Error</Badge>}
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm flex-wrap">
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground text-xs">Start time</span>
              <span className="font-mono font-medium">
                {startTime ? format(new Date(startTime), 'yyyy-MM-dd HH:mm:ss.SSS') : '-'}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground text-xs">Total duration</span>
              <span className="font-mono font-semibold text-lg text-primary">{totalDuration} ms</span>
            </div>
          </div>
        </div>

        {!loading && spans.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Select value={compareTraceId} onValueChange={setCompareTraceId}>
              <SelectTrigger className="w-[min(100%,280px)] h-9 bg-card">
                <SelectValue placeholder="Pick trace to compare…" />
              </SelectTrigger>
              <SelectContent>
                {compareOptions.map((option: { id: string; label: string }) => (
                  <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={view === 'compare' ? 'default' : 'outline'}
              size="sm"
              disabled={!compareTraceId}
              onClick={() => setView(compareTraceId ? 'compare' : 'analysis')}
            >
              <GitCompare className="w-4 h-4 mr-2" />
              Compare traces
            </Button>
            {view === 'compare' && (
              <Button variant="ghost" size="sm" onClick={() => setView('analysis')}>
                Back to analysis
              </Button>
            )}
          </div>
        )}

        {view === 'compare' && compareTraceId ? (
          <TraceCompareView
            traceIdA={traceId}
            traceIdB={compareTraceId}
            onClose={() => setView('analysis')}
          />
        ) : (
          <>
            {!loading && spans.length > 0 && <CriticalPathBanner spans={spans} />}

            {!loading && fingerprints.length > 0 && (
              <ErrorFingerprintPanel
                groups={fingerprints}
                title="Error fingerprints in this trace"
                subtitle="Grouped by service, endpoint, and failure signature"
                compact
              />
            )}

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
                    This trace may be from another service or has expired from storage.
                  </p>
                </div>
              ) : (
                <Tabs defaultValue="waterfall" className="space-y-4">
                  <TabsList className="so-tabs">
                    <TabsTrigger value="waterfall" className="gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      Waterfall
                    </TabsTrigger>
                    <TabsTrigger value="flame" className="gap-1.5">
                      <Flame className="w-3.5 h-3.5" />
                      Flame graph
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="waterfall">
                    <TraceWaterfall spans={spans} />
                  </TabsContent>
                  <TabsContent value="flame">
                    <FlameGraph spans={spans} />
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
