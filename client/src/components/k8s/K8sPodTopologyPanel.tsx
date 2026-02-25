"use client";
import React, { useMemo } from 'react';
import { 
  Layers, Waypoints, Box, Copy, 
  ShieldCheck, Cpu, Database, Zap 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  pod: any;
  namespace: string;
  isOpen: boolean;
}

export function K8sPodTopologyPanel({ pod, namespace, isOpen }: Props) {
  if (!isOpen || !pod) return null;

  const attrs = pod.attributes || [];
  const getAttr = (keys: string[]) => {
    for (const key of keys) {
      const found = attrs.find((a: any) => a.name === key);
      if (found && found.value) return found.value;
    }
    return 'N/A';
  };

  const podName = getAttr(['pod', 'k8s.pod.name']) || pod.name || 'Unknown Pod';
  
  const hierarchy = useMemo(() => {
    const parts = podName.split('-');
    if (parts.length >= 3) {
      return {
        deployment: parts.slice(0, -2).join('-'),
        replicaSet: parts.slice(0, -1).join('-'),
        pod: podName,
        service: parts.slice(0, -2).join('-'),
        hasHierarchy: true
      };
    }
    return { 
        deployment: 'Standalone Pod', 
        replicaSet: 'Direct Managed', 
        pod: podName, 
        service: podName,
        hasHierarchy: false 
    };
  }, [podName]);

  return (
    <div className="flex flex-col h-full bg-[#030711] overflow-hidden relative font-sans">
      {/* 🌌 Cyber Grid Background */}
      <div className="absolute inset-0 opacity-[0.05]" 
           style={{ backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      {/* Header */}
      <div className="z-10 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </div>
          <h3 className="text-[11px] font-black text-white uppercase italic tracking-[0.2em]">Infrastructure Topology</h3>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-bold text-slate-500">
            <span className="flex items-center gap-1"><Zap size={10} className="text-blue-400"/> Logical Map</span>
        </div>
      </div>

      {/* 🚀 Visual Graph Container */}
      <div className="flex-1 overflow-y-auto p-12 flex flex-col items-center gap-4">
        
        {/* 1. DEPLOYMENT NODE */}
        {hierarchy.hasHierarchy && (
          <>
            <TopologyNode 
                title="Logical Controller" 
                name={hierarchy.deployment} 
                type="Deployment" 
                icon={<Layers className="text-purple-400"/>} 
                status="DEPLOYMENT"
            />
            <ConnectionLine label="manages" />
          </>
        )}

        {/* 2. REPLICASET NODE */}
        <TopologyNode 
            title="Scalability Group" 
            name={hierarchy.replicaSet} 
            type="ReplicaSet" 
            icon={<Copy className="text-blue-400"/>} 
            status="REPLICASET"
        />

        <ConnectionLine label="spawns" />

        {/* 3. POD NODE (No more running/pending, just POD) */}
        <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <TopologyNode 
                title="Compute Unit" 
                name={hierarchy.pod} 
                type="Pod Instance" 
                icon={<Box className="text-emerald-400"/>} 
                status="POD"
                active
            />
        </div>

        <ConnectionLine label="exposed by" />

        {/* 4. SERVICE NODE */}
        <TopologyNode 
            title="Network Entrance" 
            name={`${hierarchy.service}.${namespace}.svc`} 
            type="Service" 
            icon={<Waypoints className="text-amber-400"/>} 
            status="SERVICE"
        />

      </div>

      {/* Footer */}
      <div className="p-4 bg-slate-950 border-t border-white/5 flex justify-between items-center z-10">
         <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase">
            <Cpu size={12} className="text-blue-500" />
            <span>ID: {pod.id?.split('_')[1]?.slice(0,12)}</span>
         </div>
         <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
            <Database size={12} className="text-purple-500" />
            <span>Namespace: {namespace}</span>
         </div>
      </div>
    </div>
  );
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function TopologyNode({ title, name, type, icon, status, active }: any) {
  return (
    <div className={cn(
      "relative z-10 w-80 p-[1px] rounded-2xl transition-all duration-300",
      active ? "bg-white/10" : "bg-white/5 hover:bg-white/10"
    )}>
      <div className="bg-[#0b0f1a] rounded-[15px] p-4 flex items-center gap-4 border border-white/5">
        <div className={cn("p-3 rounded-xl bg-slate-900 border border-white/5")}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">{title}</span>
            <span className="text-[7px] px-1.5 py-0.5 rounded font-black uppercase bg-blue-500/10 text-blue-400">
                {status}
            </span>
          </div>
          <h4 className="text-xs font-black text-white truncate uppercase italic tracking-tight">{name}</h4>
          <p className="text-[9px] font-bold text-slate-600 mt-0.5">{type}</p>
        </div>
      </div>
    </div>
  );
}

function ConnectionLine({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center -my-2">
      <div className="h-8 w-px bg-gradient-to-b from-blue-500/50 via-blue-400 to-transparent relative">
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-24 text-center">
          <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest bg-[#030711] px-2 py-0.5 border border-white/5 rounded-full">
            {label}
          </span>
        </div>
        <div className="absolute bottom-0 -left-[3px]">
           <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-bounce" />
        </div>
      </div>
    </div>
  );
}