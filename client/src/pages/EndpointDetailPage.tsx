import React, { useMemo } from 'react';
import { useRoute, Link } from 'wouter';
import { useServiceMetrics } from '@/hooks/use-service-metrics';
import { AppLayout } from '@/components/layout/AppLayout';
import { MetricChart } from '@/components/charts/MetricChart';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Zap } from 'lucide-react';

export default function EndpointDetailPage() {
  const [, params] = useRoute('/services/:serviceId/endpoints/:endpointId');
  const serviceId = params?.serviceId || '';
  const endpointId = params?.endpointId || '';

  // 🔥 URL Query se name nikalne ka logic (atob crash se bachne ke liye)
  const displayName = useMemo(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const nameParam = searchParams.get('name');
    
    if (nameParam) return decodeURIComponent(nameParam);
    
    // Fallback: Agar name na mile tabhi decode try karein
    try {
      return endpointId.includes('.') ? atob(endpointId.split('.')[1]) : endpointId;
    } catch {
      return 'Endpoint Detail';
    }
  }, [endpointId]);

  // Hook call (Scope: Endpoint)
  const { latency, throughput, sla } = useServiceMetrics(endpointId, 'Endpoint');

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <div className="space-y-1">
          <Link href={`/services/${serviceId}`}>
            <span className="text-sm text-muted-foreground hover:text-primary cursor-pointer flex items-center gap-1 transition-colors mb-2">
              <ArrowLeft className="w-3 h-3" /> Back to Service
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight truncate max-w-2xl">{displayName}</h1>
            <Badge variant="outline" className="border-blue-500/20 bg-blue-500/5 text-blue-500">
              <Zap className="w-3 h-3 mr-1" /> Endpoint
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricChart title="Latency" data={latency.data} loading={latency.loading} unit="ms" color="hsl(var(--chart-1))" />
          <MetricChart title="Throughput" data={throughput.data} loading={throughput.loading} unit="cpm" color="hsl(var(--chart-2))" />
          <MetricChart title="Success Rate" data={sla.data} loading={sla.loading} unit="%" color="hsl(var(--chart-4))" />
        </div>
      </div>
    </AppLayout>
  );
}