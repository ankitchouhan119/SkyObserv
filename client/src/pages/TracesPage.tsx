"use client";

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { TraceList } from '@/components/traces/TraceList';
import { useQuery } from '@apollo/client';
import { GET_TRACES } from '@/apollo/queries/traces';
import { GET_ALL_SERVICES } from '@/apollo/queries/services';
import { useDurationStore } from '@/store/useDurationStore';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, AlertCircle, Server } from 'lucide-react';
import { useLocation } from 'wouter';

export default function TracesPage() {
  const [, setLocation] = useLocation();
  const { durationObj, setCustomRange } = useDurationStore();

  const [status, setStatus] = useState<'ALL' | 'SUCCESS' | 'ERROR'>('ALL');
  const [minDuration, setMinDuration] = useState('');
  const [serviceId, setServiceId] = useState('ALL');

  const { data: servicesData } = useQuery(GET_ALL_SERVICES, {
    variables: { duration: durationObj },
  });

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

  const handleTraceSelect = (traceId: string) => {
    setLocation(`/traces/${traceId}`);
  };

  const traces = data?.queryBasicTraces?.traces ?? [];
  const services = servicesData?.getAllServices ?? [];

useEffect(() => {
  const handleAutoUpdate = (e: any) => {
    const { filters } = e.detail;
    
    if (filters) {
      console.log("Trace Filters Received:", filters); 

      // 1. Local States Update
      if (filters.traceState) setStatus(filters.traceState);
      if (filters.serviceId) setServiceId(filters.serviceId);
      if (filters.minDuration) setMinDuration(filters.minDuration);
      
      // 2. Duration Store Update
      if (filters.startDate && filters.endDate) {
        setCustomRange(filters.startDate, filters.endDate);
      }

      // 3. Force Refresh
      setTimeout(() => {
        refetch({
          condition: {
            serviceId: filters.serviceId !== 'ALL' ? filters.serviceId : (serviceId !== 'ALL' ? serviceId : undefined),
            queryDuration: durationObj,
            traceState: filters.traceState || status,
            minTraceDuration: filters.minDuration ? Number(filters.minDuration) : (minDuration ? Number(minDuration) : undefined),
            queryOrder: 'BY_START_TIME',
            paging: { pageNum: 1, pageSize: 100 },
          }
        });
      }, 500);
    }
  };

  window.addEventListener("skyobserv:query-update", handleAutoUpdate);
  return () => window.removeEventListener("skyobserv:query-update", handleAutoUpdate);

}, [refetch, setCustomRange, serviceId, status, minDuration, durationObj]);

  return (
    <AppLayout>
      <div className="h-[calc(100vh-140px)] flex flex-col max-w-7xl mx-auto">
        <Card className="p-4 mb-6 border-white/5 bg-card/50 shadow-sm sticky top-0 z-10 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-4">
            
            {/* Service filter */}
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-primary" />
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger className="w-[200px] h-9 bg-background/50 border-white/10 text-white font-medium">
                  <SelectValue placeholder="Select Service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Services</SelectItem>
                  {services.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="h-6 w-px bg-white/10" />

            {/* Search box */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search trace ID..."
                className="bg-transparent border-none focus-visible:ring-0 px-0 h-9 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="h-6 w-px bg-white/10" />

            {/* Status + Min Duration */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Status</span>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                  <SelectTrigger className="w-[110px] h-9 bg-background/50 border-white/10 text-white">
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
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Min (ms)</span>
                <Input
                  type="number"
                  value={minDuration}
                  onChange={(e) => setMinDuration(e.target.value)}
                  className="w-[85px] h-9 bg-background/50 border-white/10 text-white font-mono"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </Card>

        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-red-400 gap-2 bg-red-500/5 rounded-xl border border-red-500/10">
            <AlertCircle className="w-10 h-10 opacity-50" />
            <p className="font-medium text-sm">Failed to load traces: {error.message}</p>
          </div>
        ) : (
          <div className="flex-1 min-h-0">
            <TraceList
              traces={traces}
              loading={loading}
              onSelectTrace={handleTraceSelect}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}