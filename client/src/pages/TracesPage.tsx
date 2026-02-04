import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { TraceList } from '@/components/traces/TraceList';
import { useQuery } from '@apollo/client';
import { GET_TRACES } from '@/apollo/queries/traces';
import { useDurationStore } from '@/store/useDurationStore';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Filter, AlertCircle } from 'lucide-react';
import { useLocation } from 'wouter';

export default function TracesPage() {
  const [location, setLocation] = useLocation();
  const { durationObj } = useDurationStore();
  const [status, setStatus] = useState<string>('ALL');
  const [minDuration, setMinDuration] = useState<string>('');

  const { data, loading, error } = useQuery(GET_TRACES, {
    variables: {
      condition: {
        queryDuration: durationObj,
        traceState: status,
        minTraceDuration: minDuration ? parseInt(minDuration) : undefined,
        paging: { pageNum: 1, pageSize: 20, needTotal: true }
      }
    },
    fetchPolicy: 'network-only', // Ensure we get fresh traces
  });

  const handleTraceSelect = (traceId: string) => {
    setLocation(`/traces/${traceId}`);
  };

  const traces = data?.queryBasicTraces?.traces || [];

  return (
    <AppLayout>
      <div className="h-[calc(100vh-140px)] flex flex-col max-w-7xl mx-auto">
        
        {/* Filters */}
        <Card className="p-4 mb-6 border-white/5 bg-card/50 shadow-sm sticky top-0 z-10 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search trace ID..." 
                className="bg-transparent border-none focus-visible:ring-0 px-0 h-9" 
              />
            </div>
            
            <div className="h-6 w-px bg-white/10" />

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Status</span>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-[120px] h-9 bg-background/50 border-white/10">
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
                <span className="text-xs font-medium text-muted-foreground">Min Duration (ms)</span>
                <Input 
                  type="number" 
                  value={minDuration} 
                  onChange={(e) => setMinDuration(e.target.value)}
                  className="w-[100px] h-9 bg-background/50 border-white/10"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Content */}
        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-red-400 gap-2">
            <AlertCircle className="w-8 h-8" />
            <p>Failed to load traces. {error.message}</p>
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
