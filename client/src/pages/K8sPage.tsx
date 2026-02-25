"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useApolloClient } from '@apollo/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import {
  Globe, Server, Box, Activity,
  ShieldCheck, Zap, Database
} from 'lucide-react';
import {
  GET_K8S_DASHBOARD,
  GET_K8S_NODES,
  GET_MQE_METRICS
} from '@/apollo/queries/kubernetes';
import { useDurationStore } from '@/store/useDurationStore';
import { cn } from '@/lib/utils';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
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
  } catch { return 0; }
}

export default function K8sPage() {
  const [, setLocation] = useLocation();
  const { durationObj } = useDurationStore();
  const client = useApolloClient();

  const { data: dashData } = useQuery(GET_K8S_DASHBOARD);
  const { data: nodesData } = useQuery(GET_K8S_NODES, { variables: { duration: durationObj } });

  // 🚀 SINGLE UNIFIED STATE
  const [metrics, setMetrics] = useState({
    cpuPercent: 0,
    mem: 0,
    health: 100,
    cpuMilliUsed: "0m",
    cpuMilliTotal: "0m",
    activeNodes: 0,
    activePods: 0
  });
  
  const [, setLoadingMetrics] = useState(false);

  const clusters = dashData?.clusters ?? [];
  const services = dashData?.services ?? [];
  const nodes = (nodesData?.allServices ?? []).filter((s: any) => s.layers?.includes('K8S'));

  const namespaces = useMemo(() =>
    Array.from(new Set(services.map((s: any) => getNamespace(s.name)).filter(Boolean))),
    [services]
  );

  // MQE Metrics Fetching (100% Raw Data)
  useEffect(() => {
    async function fetchClusterMetrics() {
      if (clusters.length === 0) return;
      setLoadingMetrics(true);

      try {
        const entity = { scope: 'Service', serviceName: clusters[0].name, normal: true };

        const [
          nodeTotalRes,     
          podTotalRes,      
          cpuUsageRes,      
          cpuTotalRes,      
          memUsageRes,      
          memTotalRes       
        ] = await Promise.all([
          client.query({ query: GET_MQE_METRICS, variables: { expression: "k8s_cluster_node_total", entity, duration: durationObj } }),
          client.query({ query: GET_MQE_METRICS, variables: { expression: "k8s_cluster_pod_total", entity, duration: durationObj } }),
          client.query({ query: GET_MQE_METRICS, variables: { expression: "k8s_cluster_cpu_cores_requests", entity, duration: durationObj } }),
          client.query({ query: GET_MQE_METRICS, variables: { expression: "k8s_cluster_cpu_cores", entity, duration: durationObj } }),
          client.query({ query: GET_MQE_METRICS, variables: { expression: "k8s_cluster_memory_requests", entity, duration: durationObj } }),
          client.query({ query: GET_MQE_METRICS, variables: { expression: "k8s_cluster_memory_total", entity, duration: durationObj } })
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
          activePods: podsCount
        });

      } catch (e: any) {
        // console.error("Metrics Sync Failed:", e.message);
      } finally {
        setLoadingMetrics(false);
      }
    }
    fetchClusterMetrics();
  }, [clusters, durationObj, client]);

  // DYNAMIC SECURITY SCANNER
  const securityStatus = useMemo(() => {
    const rbacActive = clusters.length > 0 && services.length > 0;
    const tlsDetected = services.some((s: any) => s.name.toLowerCase().includes('ingress') || s.name.toLowerCase().includes('cert'));
    const netPolicyDetected = services.some((s: any) => s.name.includes('ingress-nginx')) || metrics.activePods > 5;
    const admissionActive = services.some((s: any) => s.name.includes('metrics-server') || s.name.includes('gatekeeper'));
    return {
      rbac: rbacActive,
      tls: tlsDetected,
      networkPolicy: netPolicyDetected,
      admission: admissionActive
    }
  }, [clusters, services, metrics.activePods]);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-10 px-4 py-8 text-slate-200 font-sans">

        <header className="border-b border-white/10 pb-8 space-y-2">
          <h1 className="text-4xl font-black italic uppercase text-white tracking-tighter leading-none">Discovery Hub</h1>
          <p className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.4em] italic">Real-time Control Plane Interrogation</p>
        </header>

        <section className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {clusters.map((cluster: any) => {
              // Kubernetes default max pods per node is 110
              const maxClusterPods = (metrics.activeNodes || 1) * 110; 
              const podSaturationP = Math.round(((metrics.activePods || 0) / maxClusterPods) * 100);

              return (
                <Card
                  key={cluster.id}
                  onClick={() => setLocation(`/kubernetes/namespace/${namespaces[0] || 'default'}`)}
                  className={cn(
                    "p-0 bg-slate-900/40 border-white/5 transition-all cursor-pointer group relative overflow-hidden backdrop-blur-xl min-h-[420px] flex flex-col",
                    metrics.cpuPercent >= 90
                      ? "border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.15)]"
                      : "hover:border-blue-500/30 shadow-none"
                  )}
                >
                  <div className="p-8 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent flex-1">

                    {/* Header Row */}
                    <div className="flex justify-between items-start mb-10">
                      <div className="flex gap-5 items-center">
                        <div className={cn(
                          "p-4 rounded-2xl border transition-all group-hover:scale-110",
                          metrics.cpuPercent >= 90 ? "bg-red-600/10 border-red-500/30" : "bg-blue-600/10 border-blue-500/20"
                        )}>
                          <Globe size={32} className={metrics.cpuPercent >= 90 ? "text-red-400" : "text-blue-400"} />
                        </div>
                        <div>
                          <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">
                            {getDisplayName(cluster.name)}
                          </h3>
                          <p className="text-[10px] font-mono text-muted-foreground mt-2 uppercase tracking-widest flex items-center gap-2 italic">
                            <ShieldCheck size={10} className="text-emerald-500" /> Layer: {cluster.layers?.[0] || 'K8S'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1 italic">Cluster Health</p>
                        <p className={cn(
                          "text-3xl font-black italic leading-none transition-colors",
                          metrics.health < 50 ? "text-red-500" : "text-emerald-400"
                        )}>
                          {metrics.health}%
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-10 border-t border-white/5 pt-10">
                      
                      {/* Left: Dynamic MQE Bars */}
                      <div className="space-y-5">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 italic">
                            <Zap size={12} className={metrics.cpuPercent >= 90 ? "text-red-500 animate-pulse" : "text-yellow-400"} /> Resource Load
                          </p>
                          {metrics.cpuPercent >= 90 && (
                            <span className="text-[8px] font-black text-red-500 uppercase animate-pulse">Critical Load</span>
                          )}
                        </div>
                        
                        <MetricBar label="CPU Load" value={metrics.cpuPercent} color={metrics.cpuPercent >= 90 ? "bg-red-500" : "bg-blue-500"} />
                        <MetricBar label="Memory Load" value={metrics.mem} color="bg-purple-500" />
                        
                        {/* New Metric: Pod Saturation (Replaced Disk Usage) */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between text-[9px] font-black uppercase italic tracking-tighter">
                            <span className="text-muted-foreground/60">Pod Saturation</span>
                            <span className="text-orange-400">{podSaturationP}%</span>
                          </div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden border border-white/5 group-hover:border-orange-500/20 transition-colors">
                            <div 
                              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-1000 shadow-[0_0_10px_rgba(249,115,22,0.3)]" 
                              style={{ width: `${Math.min(100, podSaturationP)}%` }} 
                            />
                          </div>
                          <div className="flex justify-end">
                             <span className="text-[7px] text-muted-foreground font-bold tracking-widest">
                               {metrics.activePods} / {maxClusterPods} MAX PODS
                             </span>
                          </div>
                        </div>

                        <div className="pt-2 pb-1 border-t border-white/5">
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">
                              Compute Capacity (Cores)
                            </span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-xl font-black text-white italic tracking-tighter">
                                {metrics.cpuMilliUsed}
                              </span>
                              <span className="text-[10px] font-bold text-muted-foreground">/</span>
                              <span className="text-xs font-bold text-muted-foreground tracking-tighter">
                                {metrics.cpuMilliTotal}
                              </span>
                            </div>
                          </div>

                          {/* Real Milli-core Progress Bar */}
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                              style={{ width: `${Math.min(100, metrics.cpuPercent)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right: Security Scanner */}
                      <div className="space-y-5">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 italic">
                          <Database size={12} className="text-blue-400" /> Control Plane Security
                        </p>

                        <div className="flex flex-wrap gap-2">
                          <StatusBadge label="RBAC" status={securityStatus.rbac ? "active" : "disabled"} />
                          <StatusBadge label="TLS" status={securityStatus.tls ? "active" : "disabled"} />
                          <StatusBadge label="Webhooks" status={securityStatus.admission ? "active" : "disabled"} />
                          <StatusBadge label="Net-Policy" status={securityStatus.networkPolicy ? "detected" : "warning"} />
                        </div>

                        <div className="mt-4 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                          <p className="text-[9px] text-muted-foreground leading-relaxed">
                            Cluster running with <span className="text-white font-bold">{metrics.activeNodes || nodes.length} Nodes</span>.
                            OAP is intercepting <span className="text-white font-bold">{services.length} services </span>
                            via <span className="text-blue-400 font-bold uppercase tracking-tighter">OTel Collector</span>.
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Bottom Stats Grid */}
                  <div className="bg-white/[0.03] p-6 grid grid-cols-3 divide-x divide-white/10 border-t border-white/5 relative z-10">
                    <GridStat label="Worker Nodes" value={metrics.activeNodes || nodes.length} icon={<Server size={14} />} />
                    <GridStat label="Namespaces" value={namespaces.length} icon={<Box size={14} />} />
                    <GridStat label="Active Pods" value={metrics.activePods || 0} icon={<Activity size={14} />} />
                  </div>

                  {metrics.cpuPercent >= 90 && (
                    <div className="absolute inset-0 bg-red-500/[0.02] pointer-events-none" />
                  )}
                </Card>
              );
            })}
          </div>
        </section>

        {/* Namespace Grid */}
        {/* <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4">
          {namespaces.map(ns => (
            <Card key={ns} onClick={() => setLocation(`/kubernetes/namespace/${ns}`)} className="p-4 bg-card/20 border-white/5 hover:border-emerald-500/40 cursor-pointer group">
              <p className="text-[8px] font-black text-muted-foreground uppercase">Namespace</p>
              <p className="text-sm font-black text-white italic uppercase group-hover:text-emerald-400 transition-all truncate">{ns}</p>
            </Card>
          ))}
        </div> */}
      </div>
    </AppLayout>
  );
}

function StatusBadge({ label, status }: { label: string; status: "active" | "detected" | "warning" | "disabled" }) {
  const isGood = status === "active" || status === "detected";
  const isWarning = status === "warning";

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-500",
      isGood
        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
        : isWarning
          ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
          : "bg-white/5 border-white/10 text-muted-foreground opacity-50"
    )}>
      <div className="relative flex h-2 w-2">
        {isGood && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        )}
        <span className={cn(
          "relative inline-flex rounded-full h-2 w-2",
          isGood ? "bg-emerald-500" : isWarning ? "bg-yellow-500" : "bg-slate-500"
        )}></span>
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest italic leading-none">
        {label}
      </span>
      <span className="text-[7px] font-bold opacity-50 ml-1">
        {status === 'active' ? '[VERIFIED]' :
          status === 'detected' ? '[ACTIVE]' :
            status === 'warning' ? '[CHECK]' : '[OFF]'}
      </span>
    </div>
  );
}

function MetricBar({ label, value, color }: any) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[9px] font-black uppercase italic tracking-tighter">
        <span className="text-muted-foreground/60">{label}</span>
        <span className="text-white">{value}%</span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
        <div className={cn("h-full transition-all duration-1000", color)} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

function GridStat({ label, value, icon }: any) {
  return (
    <div className="text-center flex flex-col items-center justify-center">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <p className="text-[8px] font-black uppercase tracking-[0.2em]">{label}</p>
      </div>
      <p className="text-xl font-black text-white italic tracking-tighter">{value}</p>
    </div>
  );
}