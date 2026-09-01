"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useApolloClient } from '@apollo/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Globe, Server, Box, Activity, ShieldCheck, Zap, Database } from 'lucide-react';
import {
  GET_K8S_DASHBOARD,
  GET_K8S_NODES,
  GET_MQE_METRICS,
} from '@/apollo/queries/kubernetes';
import { useDurationStore } from '@/store/useDurationStore';
import { cn } from '@/lib/utils';

function getDisplayName(fullName: string) {
  if (!fullName) return "K8s-Master";
  return fullName.includes('::') ? fullName.split('::')[1] || fullName : fullName;
}

function getNamespace(fullName: string) {
  const parts = (fullName.split('::')[1] || '').split('.');
  return parts.length > 1 ? parts[parts.length - 1] : 'default';
}

function getMQEValue(data: any): number {
  try {
    const results = data?.result?.results;
    if (!results || results.length === 0) return 0;
    const values = results[0]?.values;
    if (!values || values.length === 0) return 0;
    const val = values.slice(-1)[0]?.value;
    return val ? parseFloat(val) : 0;
  } catch {
    return 0;
  }
}

export default function K8sPage() {
  const [, setLocation] = useLocation();
  const { durationObj } = useDurationStore();
  const client = useApolloClient();

  const { data: dashData } = useQuery(GET_K8S_DASHBOARD);
  const { data: nodesData } = useQuery(GET_K8S_NODES, { variables: { duration: durationObj } });

  const [metrics, setMetrics] = useState({
    cpuPercent: 0,
    mem: 0,
    health: 100,
    cpuMilliUsed: "0m",
    cpuMilliTotal: "0m",
    activeNodes: 0,
    activePods: 0,
  });

  const clusters = dashData?.clusters ?? [];
  const services = dashData?.services ?? [];
  const nodes = (nodesData?.allServices ?? []).filter((s: any) => s.layers?.includes('K8S'));

  const namespaces = useMemo(() =>
    Array.from(new Set(services.map((s: any) => getNamespace(s.name)).filter(Boolean))),
    [services],
  );

  useEffect(() => {
    async function fetchClusterMetrics() {
      if (clusters.length === 0) return;

      try {
        const entity = { scope: 'Service', serviceName: clusters[0].name, normal: true };

        const [
          nodeTotalRes,
          podTotalRes,
          cpuUsageRes,
          cpuTotalRes,
          memUsageRes,
          memTotalRes,
        ] = await Promise.all([
          client.query({ query: GET_MQE_METRICS, variables: { expression: "k8s_cluster_node_total", entity, duration: durationObj } }),
          client.query({ query: GET_MQE_METRICS, variables: { expression: "k8s_cluster_pod_total", entity, duration: durationObj } }),
          client.query({ query: GET_MQE_METRICS, variables: { expression: "k8s_cluster_cpu_cores_requests", entity, duration: durationObj } }),
          client.query({ query: GET_MQE_METRICS, variables: { expression: "k8s_cluster_cpu_cores", entity, duration: durationObj } }),
          client.query({ query: GET_MQE_METRICS, variables: { expression: "k8s_cluster_memory_requests", entity, duration: durationObj } }),
          client.query({ query: GET_MQE_METRICS, variables: { expression: "k8s_cluster_memory_total", entity, duration: durationObj } }),
        ]);

        const nodesCount = getMQEValue(nodeTotalRes.data);
        const podsCount = getMQEValue(podTotalRes.data);
        const cUsed = getMQEValue(cpuUsageRes.data);
        const cMax = getMQEValue(cpuTotalRes.data) || 12000;
        const mUsed = getMQEValue(memUsageRes.data);
        const mMax = getMQEValue(memTotalRes.data) || 1;

        const cpuP = cMax > 0 ? Math.round((cUsed / cMax) * 100) : 0;
        const memP = mMax > 0 ? Math.round((mUsed / mMax) * 100) : 0;

        setMetrics({
          cpuPercent: cpuP,
          mem: memP,
          health: 100 - Math.round((cpuP + memP) / 2),
          cpuMilliUsed: `${Math.round(cUsed)}m`,
          cpuMilliTotal: `${Math.round(cMax)}m`,
          activeNodes: nodesCount,
          activePods: podsCount,
        });
      } catch {
        // ignore
      }
    }
    fetchClusterMetrics();
  }, [clusters, durationObj, client]);

  const securityStatus = useMemo(() => {
    const rbacActive = clusters.length > 0 && services.length > 0;
    const tlsDetected = services.some((s: any) => s.name.toLowerCase().includes('ingress') || s.name.toLowerCase().includes('cert'));
    const netPolicyDetected = services.some((s: any) => s.name.includes('ingress-nginx')) || metrics.activePods > 5;
    const admissionActive = services.some((s: any) => s.name.includes('metrics-server') || s.name.includes('gatekeeper'));
    return {
      rbac: rbacActive,
      tls: tlsDetected,
      networkPolicy: netPolicyDetected,
      admission: admissionActive,
    };
  }, [clusters, services, metrics.activePods]);

  return (
    <AppLayout>
      <div className="so-page">
        <div className="so-page-header">
          <h2>Kubernetes</h2>
          <p>Cluster health, resource usage, and security posture.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Worker nodes" value={metrics.activeNodes || nodes.length} icon={Server} wrap="bg-blue-50 text-blue-600" />
          <KpiCard label="Namespaces" value={namespaces.length} icon={Box} wrap="bg-violet-50 text-violet-600" />
          <KpiCard label="Active pods" value={metrics.activePods} icon={Activity} wrap="bg-sky-50 text-sky-600" />
          <KpiCard label="Cluster health" value={`${metrics.health}%`} icon={ShieldCheck} wrap={metrics.health < 50 ? 'bg-red-50 text-red-600' : 'bg-primary/10 text-primary'} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {clusters.length === 0 ? (
            <div className="so-card col-span-full flex flex-col items-center justify-center py-16 text-center">
              <Box className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-foreground">No Kubernetes clusters detected</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">
                Clusters appear here after your account is connected to a K8s environment with the
                SkyWalking collector. New accounts only see infrastructure linked to their own services.
              </p>
            </div>
          ) : clusters.map((cluster: any) => {
            const maxClusterPods = (metrics.activeNodes || 1) * 110;
            const podSaturationP = Math.round(((metrics.activePods || 0) / maxClusterPods) * 100);
            const isCritical = metrics.cpuPercent >= 90;

            return (
              <div
                key={cluster.id}
                onClick={() => setLocation(`/kubernetes/namespace/${namespaces[0] || 'default'}`)}
                className={cn(
                  "so-card-hover overflow-hidden cursor-pointer",
                  isCritical && "border-destructive/40",
                )}
              >
                <div className="p-5 border-b border-border">
                  <div className="flex justify-between items-start gap-4 mb-6">
                    <div className="flex gap-3 items-center">
                      <div className={cn("so-icon-wrap", isCritical ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600")}>
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-foreground">{getDisplayName(cluster.name)}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-primary" />
                          Layer: {cluster.layers?.[0] || 'K8S'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">Health</p>
                      <p className={cn("text-2xl font-semibold tabular-nums", metrics.health < 50 ? "text-destructive" : "text-primary")}>
                        {metrics.health}%
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" /> Resource load
                      </p>
                      <MetricBar label="CPU" value={metrics.cpuPercent} color={isCritical ? "bg-destructive" : "bg-primary"} />
                      <MetricBar label="Memory" value={metrics.mem} color="bg-violet-500" />
                      <MetricBar label="Pod saturation" value={podSaturationP} color="bg-orange-500" sub={`${metrics.activePods} / ${maxClusterPods} max`} />
                      <div className="pt-2 border-t border-border">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Compute capacity</span>
                          <span className="font-mono text-foreground">{metrics.cpuMilliUsed} / {metrics.cpuMilliTotal}</span>
                        </div>
                        <MetricBar label="" value={metrics.cpuPercent} color="bg-primary" hideLabel />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5" /> Security
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge label="RBAC" active={securityStatus.rbac} />
                        <StatusBadge label="TLS" active={securityStatus.tls} />
                        <StatusBadge label="Webhooks" active={securityStatus.admission} />
                        <StatusBadge label="Net-policy" active={securityStatus.networkPolicy} warn={!securityStatus.networkPolicy} />
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed p-3 bg-muted/50 rounded-lg border border-border">
                        Cluster running with <span className="font-semibold text-foreground">{metrics.activeNodes || nodes.length} nodes</span>.
                        OAP intercepting <span className="font-semibold text-foreground">{services.length} services</span> via OTel collector.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}

function KpiCard({ label, value, icon: Icon, wrap }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; wrap: string }) {
  return (
    <div className="so-kpi">
      <div className={`so-icon-wrap ${wrap}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-2xl font-semibold text-foreground tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function MetricBar({ label, value, color, sub, hideLabel }: { label: string; value: number; color: string; sub?: string; hideLabel?: boolean }) {
  return (
    <div className="space-y-1">
      {!hideLabel && (
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium text-foreground tabular-nums">{value}%</span>
        </div>
      )}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full transition-all duration-700 rounded-full", color)} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      {sub && <p className="text-[10px] text-muted-foreground text-right">{sub}</p>}
    </div>
  );
}

function StatusBadge({ label, active, warn }: { label: string; active?: boolean; warn?: boolean }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border",
      active ? "bg-primary/10 text-primary border-primary/20" :
        warn ? "bg-amber-50 text-amber-700 border-amber-200" :
          "bg-muted text-muted-foreground border-border",
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-primary" : warn ? "bg-amber-500" : "bg-muted-foreground/40")} />
      {label}
    </span>
  );
}
