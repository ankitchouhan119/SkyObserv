import React from 'react';
import { useRoute } from 'wouter';
import { AppLayout } from '@/components/layout/AppLayout';
import { useServiceMetrics } from '@/hooks/use-service-metrics';
import { MetricChart } from '@/components/charts/MetricChart';
import { useQuery } from '@apollo/client';
import { GET_SERVICE } from '@/apollo/queries/services';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Layers } from 'lucide-react';
import { Link } from 'wouter';

export default function ServiceDetailPage() {
  const [match, params] = useRoute('/services/:id');
  const serviceId = params?.id || '';
  
  const { data: serviceData } = useQuery(GET_SERVICE, {
    variables: { serviceId },
    skip: !serviceId
  });

  const { latency, throughput, sla } = useServiceMetrics(serviceId);

  const serviceName = serviceData?.getService?.name || 'Unknown Service';

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/">
                <span className="hover:text-primary cursor-pointer flex items-center gap-1 transition-colors">
                  <ArrowLeft className="w-3 h-3" /> Back to Services
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{serviceName}</h1>
              <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                <Layers className="w-3 h-3 mr-1" /> Service
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="bg-card/50 border-white/10">
              <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricChart 
            title="Avg Response Time" 
            data={latency.data} 
            loading={latency.loading} 
            unit="ms"
            color="hsl(var(--chart-1))"
          />
          <MetricChart 
            title="Throughput" 
            data={throughput.data} 
            loading={throughput.loading} 
            unit="cpm"
            color="hsl(var(--chart-2))"
          />
          <MetricChart 
            title="Success Rate (SLA)" 
            data={sla.data} 
            loading={sla.loading} 
            unit="%"
            color="hsl(var(--chart-4))"
          />
        </div>

        {/* Recent Traces Preview (Placeholder) */}
        <div className="pt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Slow Traces</h2>
            <Link href={`/traces?service=${serviceId}`}>
              <Button variant="link" className="text-primary p-0 h-auto">View All Traces</Button>
            </Link>
          </div>
          
          <div className="rounded-xl border border-white/10 bg-card/50 overflow-hidden">
             <div className="p-8 text-center text-muted-foreground">
               <p>Navigate to Traces page to analyze detailed transactions for {serviceName}.</p>
             </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
