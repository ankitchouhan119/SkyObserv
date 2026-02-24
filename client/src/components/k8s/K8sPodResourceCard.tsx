"use client";
import React, { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { Card } from '@/components/ui/card';
import { 
  Network, Server, Cpu, HardDrive, Package, Image as ImageIcon, Gauge
} from 'lucide-react';

import { GET_MQE_METRICS } from '@/apollo/queries/kubernetes';
import { useDurationStore } from '@/store/useDurationStore';
import { cn } from '@/lib/utils';

interface K8sPodResourceCardProps {
  attrs: any[];
  podDisplayName: string;
  namespace: string;
  podIp: string;
  nodeName: string;
  serviceName: string;
  deploymentName: string;
  instanceId: string;
}

export function K8sPodResourceCard({
  attrs,
  podDisplayName,
  namespace,
  podIp,
  nodeName,
  serviceName,
  deploymentName,
  instanceId,
}: K8sPodResourceCardProps) {

  const { durationObj } = useDurationStore();
  const activeInstanceId = useMemo(() => instanceId || podDisplayName, [instanceId, podDisplayName]);

  const formattedServiceName = useMemo(() => {
    let base = serviceName && serviceName !== 'Unknown Service' ? serviceName : `${deploymentName}.${namespace}`;
    return base.includes('::') ? base : `k8s-cluster::${base}`;
  }, [serviceName, deploymentName, namespace]);

  const getAttr = (keys: string[]) => {
    if (!attrs || !attrs.length) return null;
    for (const key of keys) {
      const found = attrs.find((a: any) => a.name.toLowerCase() === key.toLowerCase());
      if (found && found.value) return found.value;
    }
    return null;
  };

  // 📊 MQE Query for CPU & Memory only
  const { data: resourceData, loading: resourceLoading } = useQuery(GET_MQE_METRICS, {
    variables: {
      expression: "k8s_service_pod_cpu_usage,k8s_service_pod_memory_usage", 
      entity: { 
        scope: "ServiceInstance", 
        serviceName: formattedServiceName, 
        serviceInstanceName: activeInstanceId, 
        normal: true 
      },
      duration: durationObj
    },
    skip: !activeInstanceId,
    fetchPolicy: 'network-only'
  });

  // ✨ SMART DATA EXTRACTION LOGIC
  const panelData = useMemo(() => {
    const resResults = resourceData?.result?.results || [];
    
    let cpuUsage = 'No Data';
    let memUsage = 'No Data';

    // 🧠 Helper Function: Get the last NON-NULL value from the time-series array
    const getLastValidValue = (valuesArray: any[]) => {
      if (!valuesArray || valuesArray.length === 0) return null;
      // Reverse loop to find the most recent valid metric
      const validItem = [...valuesArray].reverse().find(v => v.value !== null && v.value !== undefined && v.value !== "null");
      return validItem ? validItem.value : null;
    };

    // Parse CPU
    if (resResults[0]?.values?.length > 0) {
      const validCpu = getLastValidValue(resResults[0].values);
      if (validCpu) cpuUsage = `${parseFloat(validCpu).toFixed(2)} m`;
    }

    // Parse Memory
    if (resResults[1]?.values?.length > 0) {
      const validMem = getLastValidValue(resResults[1].values);
      if (validMem) memUsage = `${(parseFloat(validMem) / 1024 / 1024).toFixed(2)} MB`;
    }

    // Identify details
    const finalIp = podIp !== 'N/A' ? podIp : (getAttr(['pod_ip', 'ipv4']) || 'N/A');
    const finalNode = nodeName !== 'N/A' ? nodeName : (getAttr(['node_name', 'host']) || 'N/A');
    const containers = getAttr(['container_count', 'containers', 'total_containers']) || '1';
    const images = getAttr(['image', 'images', 'k8s.container.image']) || 'N/A (Missing in OTel)';

    return { cpu: cpuUsage, mem: memUsage, ip: finalIp, node: finalNode, containers, images };
  }, [resourceData, attrs, podIp, nodeName]);

  return (
    <Card className="p-6 bg-slate-900/60 border-white/5 rounded-xl shadow-lg mt-4">
      <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
        <Gauge className="w-4 h-4" /> Resources & Environment
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5">
        <MetricItem label="Pod IP" value={panelData.ip} icon={<Network className="w-4 h-4 text-emerald-400" />} />
        <MetricItem label="Host Node" value={panelData.node} icon={<Server className="w-4 h-4 text-emerald-400" />} />
        
        <MetricItem 
          label="CPU Usage" 
          value={resourceLoading ? "Syncing..." : panelData.cpu} 
          icon={<Cpu className="w-4 h-4 text-orange-400" />} 
          color={panelData.cpu === 'No Data' ? 'text-slate-500' : 'text-orange-50'}
        />
        <MetricItem 
          label="Memory Usage" 
          value={resourceLoading ? "Syncing..." : panelData.mem} 
          icon={<HardDrive className="w-4 h-4 text-purple-400" />} 
          color={panelData.mem === 'No Data' ? 'text-slate-500' : 'text-purple-50'}
        />
        
        <MetricItem label="Containers" value={panelData.containers} icon={<Package className="w-4 h-4 text-cyan-400" />} />
        <MetricItem 
          label="Docker Images" 
          value={panelData.images} 
          icon={<ImageIcon className="w-4 h-4 text-pink-400" />} 
          isTruncated 
          color={panelData.images.includes('N/A') ? 'text-yellow-500/60' : 'text-cyan-50'}
        />
      </div>
    </Card>
  );
}

function MetricItem({ label, value, icon, color, isTruncated }: any) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.03] pb-2 group transition-all">
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-slate-950/50 group-hover:bg-blue-500/10 transition-colors">
          {icon}
        </div>
        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{label}</span>
      </div>
      <span className={cn(
        "text-[11px] font-mono px-2 py-1 rounded bg-slate-950/40 border border-white/5",
        color || "text-cyan-50/90",
        isTruncated ? "max-w-[160px] md:max-w-[200px] truncate" : ""
      )} title={String(value)}>
        {value}
      </span>
    </div>
  );
}