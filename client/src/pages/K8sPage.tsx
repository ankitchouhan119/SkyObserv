"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery, useApolloClient } from '@apollo/client';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Globe,
  Server,
  Box,
  Activity,
  ShieldCheck,
  Zap,
  ChevronRight,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import {
  GET_K8S_DASHBOARD,
  GET_K8S_NODES,
  GET_MQE_METRICS,
} from '@/apollo/queries/kubernetes';
import { useDurationStore } from '@/store/useDurationStore';
import { useAuth } from '@/hooks/useAuth';
import { K8sSetupPanel } from '@/components/k8s/K8sSetupPanel';
import { cn } from '@/lib/utils';

function getDisplayName(fullName: string) {
  if (!fullName) return "K8s cluster";
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
  const { user } = useAuth();
  const isAdmin = user?.isAdmin === true;

  const { data: dashData, loading: dashLoading } = useQuery(GET_K8S_DASHBOARD, {
    skip: !isAdmin,
  });
  const { data: nodesData } = useQuery(GET_K8S_NODES, {
    variables: { duration: durationObj },
    skip: !isAdmin,
  });

  const [metricsLoading, setMetricsLoading] = useState(false);
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

  const namespaces = useMemo(() => {
    const counts = new Map<string, number>();
    for (const svc of services) {
      const ns = getNamespace(svc.name);
      counts.set(ns, (counts.get(ns) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, workloadCount]) => ({ name, workloadCount }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [services]);

  useEffect(() => {
    async function fetchClusterMetrics() {
      if (clusters.length === 0 || !isAdmin) return;
      setMetricsLoading(true);
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
          health: Math.max(0, 100 - Math.round((cpuP + memP) / 2)),
          cpuMilliUsed: `${Math.round(cUsed)}m`,
          cpuMilliTotal: `${Math.round(cMax)}m`,
          activeNodes: nodesCount,
          activePods: podsCount,
        });
      } catch {
        // ignore
      } finally {
        setMetricsLoading(false);
      }
    }
    fetchClusterMetrics();
  }, [clusters, durationObj, client, isAdmin]);

  const hasCluster = clusters.length > 0;

  return (
    <AppLayout>
      <div className="so-page">
        <div className="so-page-header flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2>Kubernetes</h2>
            <p>Cluster health, namespaces, and workload inventory from SkyWalking OAP.</p>
          </div>
          {hasCluster && (
            <Link href={`/kubernetes/namespace/${namespaces[0]?.name ?? 'default'}`}>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline cursor-pointer">
                <Layers className="w-4 h-4" />
                Open workload explorer
                <ChevronRight className="w-4 h-4" />
              </span>
            </Link>
          )}
        </div>

        {!isAdmin && (
          <div className="so-card p-5 flex items-start gap-3 border-amber-500/30 bg-amber-500/5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Admin access required</p>
              <p className="text-sm text-muted-foreground mt-1">
                Kubernetes monitoring is only available to the account owner. Team members can still
                view their own services, traces, and databases.
              </p>
              <Link href="/docs/kubernetes">
                <span className="text-sm text-primary hover:underline mt-2 inline-block cursor-pointer">
                  Read how K8s monitoring is set up
                </span>
              </Link>
            </div>
          </div>
        )}

        {isAdmin && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiCard label="Worker nodes" value={metrics.activeNodes || nodes.length} loading={dashLoading || metricsLoading} icon={Server} wrap="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" />
              <KpiCard label="Namespaces" value={namespaces.length} loading={dashLoading} icon={Box} wrap="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400" />
              <KpiCard label="Active pods" value={metrics.activePods} loading={metricsLoading} icon={Activity} wrap="bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400" />
              <KpiCard label="Cluster health" value={`${metrics.health}%`} loading={metricsLoading} icon={ShieldCheck} wrap={metrics.health < 50 ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'bg-primary/10 text-primary'} />
            </div>

            {!dashLoading && !hasCluster && <K8sSetupPanel />}

            {hasCluster && (
              <>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  {clusters.map((cluster: any) => {
                    const maxClusterPods = (metrics.activeNodes || 1) * 110;
                    const podSaturationP = Math.min(100, Math.round(((metrics.activePods || 0) / maxClusterPods) * 100));
                    const isCritical = metrics.cpuPercent >= 90;

                    return (
                      <div
                        key={cluster.id}
                        onClick={() => setLocation(`/kubernetes/namespace/${namespaces[0]?.name ?? 'default'}`)}
                        className={cn(
                          "so-card-hover overflow-hidden cursor-pointer",
                          isCritical && "border-destructive/40",
                        )}
                      >
                        <div className="p-5 border-b border-border">
                          <div className="flex justify-between items-start gap-4 mb-6">
                            <div className="flex gap-3 items-center">
                              <div className={cn("so-icon-wrap", isCritical ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400")}>
                                <Globe className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="text-base font-semibold text-foreground">{getDisplayName(cluster.name)}</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Layer {cluster.layers?.[0] || 'K8S'} · {services.length} workloads tracked
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-muted-foreground uppercase font-medium">Health</p>
                              <p className={cn("text-2xl font-semibold tabular-nums", metrics.health < 50 ? "text-destructive" : "text-primary")}>
                                {metricsLoading ? '—' : `${metrics.health}%`}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5" /> Resource load
                              </p>
                              <MetricBar label="CPU requests" value={metrics.cpuPercent} color={isCritical ? "bg-destructive" : "bg-primary"} loading={metricsLoading} />
                              <MetricBar label="Memory requests" value={metrics.mem} color="bg-violet-500" loading={metricsLoading} />
                              <MetricBar label="Pod saturation" value={podSaturationP} color="bg-orange-500" sub={`${metrics.activePods} pods · est. cap ${maxClusterPods}`} loading={metricsLoading} />
                            </div>

                            <div className="space-y-3">
                              <p className="text-xs font-medium text-muted-foreground">Quick stats</p>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <StatTile label="Nodes" value={String(metrics.activeNodes || nodes.length)} />
                                <StatTile label="Namespaces" value={String(namespaces.length)} />
                                <StatTile label="Workloads" value={String(services.length)} />
                                <StatTile label="CPU cap" value={`${metrics.cpuMilliUsed} / ${metrics.cpuMilliTotal}`} mono />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-foreground">Namespaces</h3>
                    <span className="text-xs text-muted-foreground">{namespaces.length} detected</span>
                  </div>
                  {namespaces.length === 0 ? (
                    <div className="so-card p-6 text-sm text-muted-foreground text-center">
                      Cluster is connected but no K8S_SERVICE workloads were found in this time range.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {namespaces.map((ns) => (
                        <div
                          key={ns.name}
                          onClick={() => setLocation(`/kubernetes/namespace/${ns.name}`)}
                          className="so-card-hover p-4 cursor-pointer"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="so-icon-wrap bg-violet-500/10 text-violet-600 dark:text-violet-400 shrink-0">
                                <Box className="w-4 h-4" />
                              </div>
                              <span className="font-medium text-foreground truncate">{ns.name}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-3">
                            {ns.workloadCount} workload{ns.workloadCount === 1 ? '' : 's'} in range
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <K8sSetupPanel compact showAdminNote={false} />
              </>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  wrap,
  loading,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  wrap: string;
  loading?: boolean;
}) {
  return (
    <div className="so-kpi">
      <div className={`so-icon-wrap ${wrap}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-2xl font-semibold text-foreground tabular-nums">
          {loading ? '—' : value}
        </p>
      </div>
    </div>
  );
}

function MetricBar({
  label,
  value,
  color,
  sub,
  loading,
}: {
  label: string;
  value: number;
  color: string;
  sub?: string;
  loading?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground tabular-nums">{loading ? '—' : `${value}%`}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full transition-all duration-700 rounded-full", color)} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      {sub && <p className="text-[10px] text-muted-foreground text-right">{sub}</p>}
    </div>
  );
}

function StatTile({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-semibold text-foreground mt-0.5", mono && "font-mono text-xs")}>{value}</p>
    </div>
  );
}
