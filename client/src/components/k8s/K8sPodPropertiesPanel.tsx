"use client";
import React, { useMemo, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { Card } from '@/components/ui/card';
import { Network, Box, Layers, Waypoints, Fingerprint, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GET_MQE_METRICS } from '@/apollo/queries/kubernetes'; 
import { useDurationStore } from '@/store/useDurationStore';

interface K8sPodPropertiesPanelProps {
  attrs?: any[];
  podDisplayName: string;
  namespace: string;
  podIp?: string;
  nodeName?: string;
  serviceName: string;
  deploymentName: string;
  instanceId: string;
  rawInstanceId: string;
}

export function K8sPodPropertiesPanel({
  podDisplayName,
  namespace,
  serviceName,
  deploymentName,
  rawInstanceId,
}: K8sPodPropertiesPanelProps) {
  
  const { durationObj } = useDurationStore();

  // 1. Service Name Formatting (Keep the fix)
  const formattedServiceName = useMemo(() => {
    let base = serviceName;
    if (!base || base === 'Unknown Service' || base === 'N/A') {
      base = `${deploymentName}.${namespace}`;
    } else if (!base.includes('.')) {
      base = `${base}.${namespace}`;
    }
    // Remove forced prefix
    if (base.startsWith('k8s-cluster::')) {
      base = base.replace('k8s-cluster::', '');
    }
    return base; 
  }, [serviceName, deploymentName, namespace]);

  // 2. Entity Definition
  const entity = useMemo(() => ({
    scope: 'ServiceInstance',
    serviceName: formattedServiceName,
    serviceInstanceName: podDisplayName,
    normal: true
  }), [formattedServiceName, podDisplayName]);

  // 3. QUERY: Fetch Only Restarts Live
  const { data: restartData, loading: restartLoading } = useQuery(GET_MQE_METRICS, {
    variables: { 
      expression: "k8s_service_pod_status_restarts_total", 
      entity, 
      duration: durationObj 
    },
    pollInterval: 10000,
    fetchPolicy: 'no-cache',
    onError: (err) => console.error("❌ Restarts Query Failed:", err.message)
  });

  // Helper to extract restart count
  const restartCount = useMemo(() => {
    try {
      const val = restartData?.result?.results[0]?.values.slice(-1)[0]?.value;
      return val !== undefined ? Number(val) : null;
    } catch { return null; }
  }, [restartData]);

  // 4. ID Split Logic
  const decodedParts = useMemo(() => {
    if (!rawInstanceId || typeof rawInstanceId !== 'string') {
      return { servicePart: 'Loading...', podPart: 'Loading...' };
    }
    const parts = rawInstanceId.split('_');
    if (parts.length >= 2) {
      return { servicePart: parts[0], podPart: parts.slice(1).join('_') };
    }
    return { servicePart: 'N/A', podPart: rawInstanceId };
  }, [rawInstanceId]);

  const properties = [
    { label: 'Pod Name', value: podDisplayName, icon: <Box className="w-4 h-4 text-blue-400" />, fullWidth: false },
    { label: 'Namespace', value: namespace, icon: <Layers className="w-4 h-4 text-blue-400" />, fullWidth: false },
    { label: 'Service Context ID', value: decodedParts.servicePart, icon: <Waypoints className="w-4 h-4 text-emerald-400" />, fullWidth: true },
    { label: 'Pod Identity ID', value: decodedParts.podPart, icon: <Fingerprint className="w-4 h-4 text-cyan-400" />, fullWidth: true },
    { label: 'Target Service', value: formattedServiceName, icon: <Network className="w-4 h-4 text-blue-400" />, fullWidth: false },
  ];

  return (
    <Card className="p-6 bg-slate-900/40 border-white/5 rounded-xl">
      

      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
        <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
          <Network className="w-4 h-4" /> K8s Diagnostic Info
        </h3>

        <div className="flex items-center gap-3 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
            <div className="flex items-center gap-1.5">
                <RefreshCcw className={cn("w-3.5 h-3.5", (restartCount || 0) > 0 ? "text-red-400" : "text-emerald-500")} />
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Restarts</span>
            </div>
            <span className={cn("text-sm font-mono font-black", 
                restartLoading ? "text-slate-600" : 
                (restartCount || 0) > 0 ? "text-red-400" : "text-emerald-400"
            )}>
                {restartLoading ? "..." : restartCount ?? 0}
            </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
        {properties.map((prop, idx) => (
          <div key={idx} className={cn("flex flex-col gap-2 pb-2 border-b border-white/[0.02] last:border-0", prop.fullWidth && "md:col-span-2")}>
            <div className="flex items-center gap-2">
              {prop.icon}
              <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">{prop.label}</span>
            </div>
            <span className="text-[11px] font-mono px-3 py-2 rounded bg-blue-950/20 border border-blue-900/10 text-cyan-50 break-all leading-relaxed">
              {prop.value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}