"use client";
import React, { useMemo, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@apollo/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { ArrowLeft, Box, Layers, Waypoints, Copy, Activity, Zap } from 'lucide-react';
import { GET_INSTANCE_DETAIL, GET_MQE_METRICS } from '@/apollo/queries/kubernetes';
import { useDurationStore } from '@/store/useDurationStore';
import { cn } from '@/lib/utils';
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
      if (phase === 'Running') return { label: 'RUNNING', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', glow: 'bg-primary' };
      if (phase === 'Pending') return { label: 'PENDING', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', glow: 'bg-amber-400' };
      return { label: phase.toUpperCase(), color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', glow: 'bg-cyan-400' };
    }
    return { label: 'STOPPED', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', glow: 'bg-rose-500' };
  }, [mqeData, mqeLoading]);

  const servicePort = getAttr(['k8s.service.port', 'container_port', 'port']);
  const portDisplay = servicePort !== 'N/A' ? `${servicePort}/TCP` : 'OTel Hidden';

  return (
    <AppLayout>
      <div className="so-page">
        <div className="border-b border-border pb-5 space-y-4">
          <button onClick={() => setLocation(`/kubernetes/namespace/${name}`)} className="text-sm text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors">
            <ArrowLeft size={14} /> Back to {name}
          </button>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="so-icon-wrap bg-primary/10 text-primary w-12 h-12">
                <Box className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground truncate max-w-xl" style={{ fontFamily: 'Outfit, sans-serif' }}>{podDisplayName}</h1>
                <p className="text-xs text-muted-foreground mt-1">ID: {instanceId}</p>
              </div>
            </div>
            <div className={cn("px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-2", theme.bg, theme.color, theme.border)}>
              <span className={cn("w-2 h-2 rounded-full", theme.glow)} />
              {theme.label}
            </div>
          </div>
          <div className="flex gap-2">
            {(['overview', 'Connectivity', 'events'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-2 text-xs font-medium rounded-lg transition-colors',
                  activeTab === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {tab === 'Connectivity' ? 'Connectivity' : tab === 'events' ? 'Events' : 'Overview'}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <InfoCard icon={<Layers className="w-3.5 h-3.5 text-primary" />} label="Deployment" value={deploymentName} />
              <InfoCard icon={<Copy className="w-3.5 h-3.5 text-primary" />} label="ReplicaSet" value={replicaSetName} small />
              <InfoCard icon={<Waypoints className="w-3.5 h-3.5 text-primary" />} label="Service" value={serviceName} />
              <div className={cn("so-card p-4", theme.bg, theme.border)}>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2"><Zap className={cn("w-3.5 h-3.5", theme.color)} /> Lifecycle</div>
                <p className={cn("text-xl font-semibold", theme.color)}>{theme.label}</p>
              </div>
            </div>

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
          <div className="so-card overflow-hidden h-[calc(100vh-280px)]">
            <K8sPodTopologyPanel pod={pod || { name: decodedPodName, attributes: attrs }} namespace={namespace} isOpen={true} />
          </div>
        )}
        {activeTab === 'events' && <K8sPodEventsPanel instanceId={decodedPodName} serviceName={formattedServiceName} />}
      </div>
    </AppLayout>
  );
}

function InfoCard({ icon, label, value, small }: { icon: React.ReactNode; label: string; value: string; small?: boolean }) {
  return (
    <div className="so-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">{icon} {label}</div>
      <p className={cn("font-semibold text-foreground truncate", small ? "text-sm" : "text-base")}>{value}</p>
    </div>
  );
}
























