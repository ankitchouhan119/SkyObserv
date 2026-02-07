import React from 'react';
import { useLocation, useRoute, Link } from 'wouter';
import { useQuery } from '@apollo/client';
import { GET_SERVICE_INSTANCES, GET_SERVICE_ENDPOINTS } from '@/apollo/queries/services';
import { useServiceMetrics } from '@/hooks/use-service-metrics';
import { useDurationStore } from '@/store/useDurationStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetricChart } from '@/components/charts/MetricChart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Cpu, Server, Clock, Database, ArrowLeft, RefreshCw } from 'lucide-react';
import { useTamboContextHelpers } from "@tambo-ai/react";

export default function ServiceDetailPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/services/:id');
  const serviceId = params?.id || '';
  const { durationObj } = useDurationStore();

  const { data: endpointsData } = useQuery(GET_SERVICE_ENDPOINTS, {
    variables: { serviceId, keyword: '' },
    skip: !serviceId,
  });

  const { data: instancesData, loading: instancesLoading } = useQuery(GET_SERVICE_INSTANCES, {
    variables: { serviceId, duration: durationObj },
    skip: !serviceId,
  });

  const { latency, throughput, sla } = useServiceMetrics(serviceId, 'Service', durationObj);
  
  const endpoints = endpointsData?.endpoints || [];
  const instances = instancesData?.getServiceInstances || [];
  const serviceName = serviceId ? atob(serviceId.split('.')[0]) : [];

  const { addContextHelper, removeContextHelper } = useTamboContextHelpers();

  const [activeTab, setActiveTab] = React.useState("overview");

  React.useEffect(() => {
    const handleUpdate = (e: any) => {
      const { filters } = e.detail;
      if (filters?.tab) {
        setActiveTab(filters.tab); // AI will switch tabs
      }
    };
    window.addEventListener("skyobserv:query-update", handleUpdate);
    return () => window.removeEventListener("skyobserv:query-update", handleUpdate);
  }, []);

  React.useEffect(() => {
    // AI Context update logic
    if (!latency.loading && serviceId) {
      const curLat = Math.round(latency.data.at(-1)?.value || 0);
      const curThr = Math.round(throughput.data.at(-1)?.value || 0);
      const curSLA = Math.round(sla.data.at(-1)?.value || 0);

      addContextHelper("current_service", () => ({
        serviceName,
        metrics: { latency: curLat, throughput: curThr, sla: curSLA },
        status: curSLA < 95 ? "critical" : "healthy",
        viewing: "Service Detail Page",
        instruction: "Use ServiceMetricsCard to show these values in English."
      }));
    }
    return () => removeContextHelper("current_service");
  }, [latency.data, throughput.data, sla.data, serviceName, addContextHelper, removeContextHelper]);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link href="/"><span className="text-sm text-muted-foreground hover:text-primary cursor-pointer flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Back</span></Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{serviceName}</h1>
              <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5"><Server className="w-3 h-3 mr-1" /> Service</Badge>
            </div>
          </div>
          {/* <Button variant="outline" size="sm" className="bg-card/50 border-white/10 text-white"><RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh</Button> */}
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card/50 border border-white/10 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="instances">Instances ({instances.length})</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints ({endpoints.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricChart title="Latency (ms)" data={latency.data} loading={latency.loading} unit="ms" color="hsl(var(--chart-1))" />
              <MetricChart title="Throughput" data={throughput.data} loading={throughput.loading} unit="cpm" color="hsl(var(--chart-2))" />
              <MetricChart title="SLA (%)" data={sla.data} loading={sla.loading} unit="%" color="hsl(var(--chart-4))" />
            </div>
          </TabsContent>

          <TabsContent value="instances">
            <div className="grid grid-cols-1 gap-4">
              {instancesLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading instances...</div>
              ) : instances.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No instances found for this service.</div>
              ) : (
                instances.map((instance: any) => (
                  <Card key={instance.id} className="p-6 bg-card/40 border-white/10 hover:border-primary/50 transition-colors">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <Cpu className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">{instance.name}</h4>
                          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="w-4 h-4 mr-2" />
                              UUID: {instance.instanceUUID.substring(0, 8)}...
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Database className="w-4 h-4 mr-2" />
                              Language: {instance.language}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {instance.attributes.map((attr: any) => (
                          <div key={attr.name} className="px-2 py-1 bg-white/5 rounded text-[10px] font-mono uppercase text-muted-foreground">
                            {attr.name}: {attr.value}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="endpoints">
            <div className="bg-card/40 border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-xs text-muted-foreground"><tr><th className="p-4">Endpoint</th><th className="p-4 text-right">Action</th></tr></thead>
                <tbody className="divide-y divide-white/5">
                  {endpoints.map((ep: any) => (
                    <tr key={ep.id} className="hover:bg-white/5">
                      <td className="p-4 text-sm text-gray-300">{ep.name}</td>
                      <td className="p-4 text-right"><Button variant="ghost" size="sm" className="text-primary" onClick={() => setLocation(`/services/${serviceId}/endpoints/${ep.id}?name=${encodeURIComponent(ep.name)}`)}>View</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
