"use client";
import React, { useMemo, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@apollo/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Box, Layers, Waypoints, Copy, Activity, Zap } from 'lucide-react';
import { GET_INSTANCE_DETAIL, GET_MQE_METRICS } from '@/apollo/queries/kubernetes';
import { useDurationStore } from '@/store/useDurationStore';
import { cn } from '@/lib/utils';

// Components
import { K8sPodTopologyPanel } from '@/components/k8s/K8sPodTopologyPanel';
import { K8sPodEventsPanel } from '@/components/k8s/K8sPodEventsPanel';
import { K8sPodPropertiesPanel } from '@/components/k8s/K8sPodPropertiesPanel';

type Tab = 'overview' | 'Connectivity' | 'events';

export default function K8sPodDetailPage() {
  const { name, podName } = useParams();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { durationObj } = useDurationStore();

  const decodedPodName = decodeURIComponent(podName || '');

  const { data, loading, error } = useQuery(GET_INSTANCE_DETAIL, {
    variables: { instanceId: decodedPodName },
    skip: !decodedPodName,
  });

  const pod = data?.instance;
  const attrs = pod?.attributes ?? [];
  const instanceId = pod?.id || 'N/A';
  const shortInstanceId = instanceId !== 'N/A' ? instanceId.split('_').slice(1).join('_').slice(0, 14) + '...' : 'N/A';

  const getAttr = (keys: string[]) => {
    for (const key of keys) {
      const found = attrs.find((a: any) => a.name === key);
      if (found && found.value) return found.value;
    }
    return 'N/A';
  };

  const namespace = getAttr(['namespace', 'k8s.namespace.name']) !== 'N/A' ? getAttr(['namespace', 'k8s.namespace.name']) : name;
  const podDisplayName = getAttr(['pod', 'k8s.pod.name']) !== 'N/A' ? getAttr(['pod', 'k8s.pod.name']) : decodedPodName;
  const nodeName = getAttr(['node_name', 'host_name', 'k8s.node.name']);
  const podIp = getAttr(['pod_ip', 'k8s.pod.ip', 'ipv4', 'ip']);

  let deploymentName = 'N/A';
  let replicaSetName = 'N/A';
  if (podDisplayName !== 'N/A') {
    const parts = podDisplayName.split('-');
    if (parts.length >= 3) {
      replicaSetName = parts.slice(0, -1).join('-'); 
      deploymentName = parts.slice(0, -2).join('-');
    }
  }

  let serviceName = 'Unknown Service';
  try {
    const b64Part = decodedPodName.split('_')[0].split('.')[0]; 
    const fullSwName = atob(b64Part);
    serviceName = fullSwName.split('::')[1]?.split('.')[0] || fullSwName;
  } catch (e) { 
    serviceName = deploymentName !== 'N/A' ? deploymentName : 'Unknown Service'; 
  }

  const formattedServiceName = useMemo(() => {
    let base = serviceName;
    if (!serviceName || serviceName === 'Unknown Service') base = `${deploymentName}.${namespace}`;
    else if (!serviceName.includes('.')) base = `${serviceName}.${namespace}`;
    return base.includes('::') ? base : `k8s-cluster::${base}`;
  }, [serviceName, deploymentName, namespace]);

  const { data: mqeData, loading: mqeLoading } = useQuery(GET_MQE_METRICS, {
    variables: {
      expression: "k8s_service_pod_status", 
      entity: { scope: "ServiceInstance", serviceName: formattedServiceName, serviceInstanceName: decodedPodName, normal: true },
      duration: durationObj
    },
    skip: !decodedPodName,
    fetchPolicy: 'network-only',
  });

  const theme = useMemo(() => {
    if (mqeLoading) return { label: 'SYNCING...', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', glow: 'bg-slate-400' };
    const results = mqeData?.result?.results || [];
    const activeResult = results.find((res: any) => (res.values?.[res.values.length - 1]?.value === "1" || res.values?.[res.values.length - 1]?.value === 1));

    if (activeResult) {
      const phase = activeResult.metric?.labels?.find((l: any) => l.key === 'phase')?.value || 'Running';
      if (phase === 'Running') return { label: 'RUNNING', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'bg-emerald-400' };
      if (phase === 'Pending') return { label: 'PENDING', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', glow: 'bg-amber-400' };
      return { label: phase.toUpperCase(), color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', glow: 'bg-cyan-400' };
    }
    return { label: 'STOPPED', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', glow: 'bg-rose-500' };
  }, [mqeData, mqeLoading]);

  const servicePort = getAttr(['k8s.service.port', 'container_port', 'port']);
  const portDisplay = servicePort !== 'N/A' ? `${servicePort}/TCP` : 'OTel Hidden';

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 text-slate-200">
        {/* Header */}
        <div className="border-b border-white/10 pb-6 space-y-4">
          <button onClick={() => setLocation(`/kubernetes/namespace/${name}`)} className="text-[10px] font-black text-muted-foreground flex items-center gap-1 uppercase hover:text-blue-400 transition-colors">
            <ArrowLeft size={10} /> BACK TO {name}
          </button>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-lg">
                <Box className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white italic tracking-tighter truncate max-w-xl">{podDisplayName}</h1>
                <div className="flex items-center gap-2 mt-1 font-black text-[10px]  tracking-widest text-muted-foreground">
                  {/* <span className="text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded uppercase border border-blue-500/20">NS: {namespace}</span> */}
                  <span>ID: {instanceId}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <div className={cn("px-4 py-1.5 rounded-full text-[10px] font-black italic uppercase tracking-widest border flex items-center gap-2 transition-all duration-500", theme.bg, theme.color, theme.border)}>
                <span className="relative flex h-2 w-2">
                  <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", theme.glow)}></span>
                  <span className={cn("relative inline-flex rounded-full h-2 w-2", theme.glow)}></span>
                </span>
                {theme.label}
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            {(['overview', 'Connectivity', 'events'] as Tab[]).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={cn('px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all', activeTab === tab ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-lg' : 'text-muted-foreground border border-transparent hover:bg-white/5')}>
                {tab === 'Connectivity' ? '⚡ Connectivity' : tab === 'events' ? '🔔 Events' : '📊 Overview'}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-5 bg-slate-900/40 border-white/5 group transition-all">
                <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-3"><Layers className="w-3.5 h-3.5 text-blue-400" /> Controller</div>
                <p className="text-lg font-black text-white italic truncate group-hover:text-blue-400 transition-colors">{deploymentName}</p>
                <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Deployment</p>
              </Card>
              <Card className="p-5 bg-slate-900/40 border-white/5 group transition-all">
                <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-3"><Copy className="w-3.5 h-3.5 text-blue-400" /> ReplicaSet</div>
                <p className="text-sm font-black text-white italic truncate group-hover:text-blue-400 transition-colors">{replicaSetName}</p>
                <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Pod Manager</p>
              </Card>
              <Card className="p-5 bg-slate-900/40 border-white/5 group transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest"><Waypoints className="w-3.5 h-3.5 text-blue-400" /> Service</div>
                </div>
                <p className="text-lg font-black text-white italic truncate group-hover:text-blue-400 transition-colors">{serviceName}</p>
                <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Network Binding</p>
              </Card>
              <Card className={cn("p-5 border-white/5 relative overflow-hidden transition-all duration-500", theme.bg)}>
                <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-3"><Zap className={cn("w-3.5 h-3.5", theme.color)} /> Lifecycle</div>
                <p className={cn("text-2xl font-black italic", theme.color)}>{theme.label}</p>
                <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Health Check</p>
              </Card>
            </div>

            {/* 🚀 Diagnostic Panel: DHYAN SE DEKHO YAHAN rawInstanceId pass ho raha hai */}
            {!loading && !error && (
              <K8sPodPropertiesPanel 
                attrs={attrs}
                podDisplayName={podDisplayName}
                namespace={namespace}
                podIp={podIp}
                nodeName={nodeName}
                serviceName={serviceName}
                deploymentName={deploymentName}
                replicaSetName={replicaSetName}
                instanceId={instanceId}
                rawInstanceId={decodedPodName} 
              />
            )}
          </div>
        )}

        {activeTab === 'Connectivity' && (
          <Card className="border-white/5 overflow-hidden rounded-xl bg-slate-950 h-[calc(100vh-280px)]">
            <K8sPodTopologyPanel pod={pod || { name: decodedPodName, attributes: attrs }} namespace={namespace} isOpen={true} />
          </Card>
        )}
        {activeTab === 'events' && <K8sPodEventsPanel instanceId={decodedPodName} serviceName={formattedServiceName} />}
      </div>
    </AppLayout>
  );
}