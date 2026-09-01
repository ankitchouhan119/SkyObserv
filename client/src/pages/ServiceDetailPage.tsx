import React from 'react';
import { useLocation, useRoute, Link } from 'wouter';
import { useQuery } from '@apollo/client';
import { GET_SERVICE_INSTANCES, GET_SERVICE_ENDPOINTS } from '@/apollo/queries/services';
import { useServiceMetrics } from '@/hooks/use-service-metrics';
import { useDurationStore } from '@/store/useDurationStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetricChart } from '@/components/charts/MetricChart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Cpu, Server, Clock, Database, ArrowLeft } from 'lucide-react';
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
      if (filters?.tab) setActiveTab(filters.tab);
    };
    window.addEventListener("skyobserv:query-update", handleUpdate);
    return () => window.removeEventListener("skyobserv:query-update", handleUpdate);
  }, []);

  React.useEffect(() => {
    if (!latency.loading && serviceId) {
      const curLat = Math.round(latency.data.at(-1)?.value || 0);
      const curThr = Math.round(throughput.data.at(-1)?.value || 0);
      const curSLA = Math.round(sla.data.at(-1)?.value || 0);

      addContextHelper("current_service", () => ({
        serviceName,
        metrics: { latency: curLat, throughput: curThr, sla: curSLA },
        status: curSLA < 95 ? "critical" : "healthy",
        viewing: "Service Detail Page",
        instruction: "Use ServiceMetricsCard to show these values in English.",
      }));
    }
    return () => removeContextHelper("current_service");
  }, [latency.data, throughput.data, sla.data, serviceName, addContextHelper, removeContextHelper, latency.loading, serviceId]);

  return (
    <AppLayout>
      <div className="so-page">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link href="/dashboard">
              <span className="text-sm text-muted-foreground hover:text-primary cursor-pointer flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Back
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {serviceName}
              </h1>
              <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
                <Server className="w-3 h-3 mr-1" /> Service
              </Badge>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
          <TabsList className="so-tabs">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="instances">Instances ({instances.length})</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints ({endpoints.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <MetricChart title="Latency (ms)" data={latency.data} loading={latency.loading} unit="ms" color="#2563EB" />
              <MetricChart title="Throughput" data={throughput.data} loading={throughput.loading} unit="cpm" color="#0EA5E9" />
              <MetricChart title="SLA (%)" data={sla.data} loading={sla.loading} unit="%" color="#8B5CF6" />
            </div>
          </TabsContent>

          <TabsContent value="instances">
            <div className="grid grid-cols-1 gap-3">
              {instancesLoading ? (
                <div className="p-8 text-center text-muted-foreground so-card">Loading instances...</div>
              ) : instances.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground so-card">No instances found for this service.</div>
              ) : (
                instances.map((instance: any) => (
                  <div key={instance.id} className="so-card p-5 hover:border-primary/25 transition-colors">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="so-icon-wrap bg-primary/10 text-primary">
                          <Cpu className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{instance.name}</h4>
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
                          <div key={attr.name} className="px-2 py-1 bg-muted rounded text-[10px] font-mono uppercase text-muted-foreground">
                            {attr.name}: {attr.value}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="endpoints">
            <div className="so-table-wrap">
              <table className="w-full text-left">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    <th className="p-4 font-medium">Endpoint</th>
                    <th className="p-4 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {endpoints.map((ep: any) => (
                    <tr key={ep.id} className="hover:bg-muted/30">
                      <td className="p-4 text-sm text-foreground">{ep.name}</td>
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary"
                          onClick={() => setLocation(`/services/${serviceId}/endpoints/${ep.id}?name=${encodeURIComponent(ep.name)}`)}
                        >
                          View
                        </Button>
                      </td>
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
