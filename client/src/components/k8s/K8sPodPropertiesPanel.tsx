"use client";
import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Network, Box, Layers, Waypoints, Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils';

interface K8sPodPropertiesPanelProps {
  attrs: any[];
  podDisplayName: string;
  namespace: string;
  podIp: string;
  nodeName: string;
  serviceName: string;
  deploymentName: string;
  replicaSetName: string;
  instanceId: string;
  rawInstanceId: string;
}

export function K8sPodPropertiesPanel({
  podDisplayName,
  namespace,
  serviceName,
  deploymentName,
  instanceId,
  rawInstanceId,
}: K8sPodPropertiesPanelProps) {

  // 🚀 Split Logic: Long ID ko todna
  const decodedParts = useMemo(() => {
    if (!rawInstanceId || typeof rawInstanceId !== 'string') {
      return { servicePart: 'Loading...', podPart: 'Loading...' };
    }
    const parts = rawInstanceId.split('_');
    if (parts.length >= 2) {
      return { 
        servicePart: parts[0], 
        podPart: parts.slice(1).join('_') 
      };
    }
    return { servicePart: 'N/A', podPart: rawInstanceId };
  }, [rawInstanceId]);

  const formattedServiceName = useMemo(() => {
    let base = serviceName;
    if (!serviceName || serviceName === 'Unknown Service') base = `${deploymentName}.${namespace}`;
    else if (!serviceName.includes('.')) base = `${serviceName}.${namespace}`;
    return base.includes('::') ? base : `k8s-cluster::${base}`;
  }, [serviceName, deploymentName, namespace]);

  const properties = [
    { label: 'Pod Name', value: podDisplayName, icon: <Box className="w-4 h-4 text-blue-400" />, fullWidth: false },
    { label: 'Namespace', value: namespace, icon: <Layers className="w-4 h-4 text-blue-400" />, fullWidth: false },
    { label: 'Service Context ID', value: decodedParts.servicePart, icon: <Waypoints className="w-4 h-4 text-emerald-400" />, fullWidth: true },
    { label: 'Pod Identity ID', value: decodedParts.podPart, icon: <Fingerprint className="w-4 h-4 text-cyan-400" />, fullWidth: true },
    { label: 'Target Service', value: formattedServiceName, icon: <Network className="w-4 h-4 text-blue-400" />, fullWidth: false },
  ];

  return (
    <Card className="p-6 bg-slate-900/40 border-white/5 rounded-xl">
      <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
        <Network className="w-4 h-4" /> K8s Diagnostic Info
      </h3>
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