"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { TraceList } from '@/components/traces/TraceList';
import { useQuery } from '@apollo/client';
import { GET_TRACES } from '@/apollo/queries/traces';
import { GET_ALL_SERVICES } from '@/apollo/queries/services';
import { useDurationStore } from '@/store/useDurationStore';
import { useAuth } from '@/hooks/useAuth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, AlertCircle, Server, GitCompare } from 'lucide-react';
import { useLocation } from 'wouter';
import { ErrorFingerprintPanel } from '@/components/traces/ErrorFingerprintPanel';
import { TraceCompareView } from '@/components/traces/TraceCompareView';
import { aggregateTraceListFingerprints } from '@/lib/traceAnalysis';

export default function TracesPage() {
  const [, setLocation] = useLocation();
  const { durationObj, setCustomRange } = useDurationStore();
  const { user } = useAuth();

  const [status, setStatus] = useState<'ALL' | 'SUCCESS' | 'ERROR'>('ALL');
  const [minDuration, setMinDuration] = useState('');
  const [serviceId, setServiceId] = useState('ALL');
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<string[]>([]);
  const [showCompareView, setShowCompareView] = useState(false);

  const { data: servicesData } = useQuery(GET_ALL_SERVICES, {
    variables: { duration: durationObj },
  });

  const services = servicesData?.getAllServices ?? [];
  const isAdmin = user?.isAdmin === true;

  useEffect(() => {
    if (serviceId !== 'ALL' || services.length === 0) return;
    if (!isAdmin) {
      setServiceId(services[0].id);
    }
  }, [services, serviceId, isAdmin]);

  const { data, loading, error, refetch } = useQuery(GET_TRACES, {
    variables: {
      condition: {
        serviceId: serviceId !== 'ALL' ? serviceId : undefined,
        queryDuration: durationObj,
        traceState: status,
        queryOrder: 'BY_START_TIME',
        minTraceDuration: minDuration ? Number(minDuration) : undefined,
        paging: { pageNum: 1, pageSize: 100 },
      },
    },
    fetchPolicy: 'network-only',
  });

  const traces = data?.queryBasicTraces?.traces ?? [];
  const errorFingerprints = useMemo(
    () => aggregateTraceListFingerprints(traces),
    [traces],
  );

  const handleTraceSelect = (traceId: string) => {
    if (compareMode) return;
    setLocation(`/traces/${traceId}`);
  };

  const handleCompareToggle = (traceId: string, checked: boolean) => {
    setCompareSelection((current) => {
      if (checked) {
        if (current.includes(traceId) || current.length >= 2) return current;
        return [...current, traceId];
      }
      return current.filter((id) => id !== traceId);
    });
  };

  useEffect(() => {
    const handleAutoUpdate = (e: any) => {
      const { filters } = e.detail;

      if (filters) {
        if (filters.traceState) setStatus(filters.traceState);
        if (filters.serviceId) setServiceId(filters.serviceId);
        if (filters.minDuration) setMinDuration(filters.minDuration);

        if (filters.startDate && filters.endDate) {
          setCustomRange(filters.startDate, filters.endDate);
        }

        setTimeout(() => {
          refetch({
            condition: {
              serviceId: filters.serviceId !== 'ALL' ? filters.serviceId : (serviceId !== 'ALL' ? serviceId : undefined),
              queryDuration: durationObj,
              traceState: filters.traceState || status,
              minTraceDuration: filters.minDuration ? Number(filters.minDuration) : (minDuration ? Number(minDuration) : undefined),
              queryOrder: 'BY_START_TIME',
              paging: { pageNum: 1, pageSize: 100 },
            },
          });
        }, 500);
      }
    };

    window.addEventListener("skyobserv:query-update", handleAutoUpdate);
    return () => window.removeEventListener("skyobserv:query-update", handleAutoUpdate);
  }, [refetch, setCustomRange, serviceId, status, minDuration, durationObj]);

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100dvh-var(--header-height)-2.5rem)] min-h-0 w-full gap-4">
        <div className="so-filter-bar shrink-0">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-primary" />
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger className="w-[200px] h-9 bg-card">
                  <SelectValue placeholder="Select Service" />
                </SelectTrigger>
                <SelectContent>
                  {isAdmin && <SelectItem value="ALL">All Services</SelectItem>}
                  {services.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="h-6 w-px bg-border hidden sm:block" />

            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search trace ID..."
                className="bg-transparent border-none focus-visible:ring-0 px-0 h-9"
              />
            </div>

            <div className="h-6 w-px bg-border hidden sm:block" />

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Status</span>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                  <SelectTrigger className="w-[110px] h-9 bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="SUCCESS">Success</SelectItem>
                    <SelectItem value="ERROR">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Min (ms)</span>
                <Input
                  type="number"
                  value={minDuration}
                  onChange={(e) => setMinDuration(e.target.value)}
                  className="w-[85px] h-9 bg-card font-mono"
                  placeholder="0"
                />
              </div>

              <Button
                variant={compareMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setCompareMode((value) => !value);
                  setCompareSelection([]);
                  setShowCompareView(false);
                }}
              >
                <GitCompare className="w-4 h-4 mr-2" />
                Compare
              </Button>

              {compareMode && compareSelection.length === 2 && (
                <Button size="sm" onClick={() => setShowCompareView(true)}>
                  Compare selected
                </Button>
              )}
            </div>
          </div>
        </div>

        {showCompareView && compareSelection.length === 2 ? (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <TraceCompareView
              traceIdA={compareSelection[0]}
              traceIdB={compareSelection[1]}
              onClose={() => setShowCompareView(false)}
            />
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-destructive gap-2 so-card">
            <AlertCircle className="w-10 h-10 opacity-50" />
            <p className="font-medium text-sm">Failed to load traces: {error.message}</p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[1fr_22rem] gap-4 overflow-hidden items-stretch">
            <div className="so-card min-h-0 h-full overflow-hidden flex flex-col p-3">
            <TraceList
              traces={traces}
              loading={loading}
              onSelectTrace={handleTraceSelect}
              compareMode={compareMode}
              compareSelection={compareSelection}
              onCompareToggle={handleCompareToggle}
            />
            </div>
            <div className="min-h-0 h-full overflow-hidden flex flex-col">
            <ErrorFingerprintPanel
              groups={errorFingerprints}
              loading={loading}
              title="Error fingerprints"
              subtitle="Grouped from visible traces in this list"
            />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
