"use client";

import { Card } from "@/components/ui/card";
import { Terminal, Server, Cpu, Globe } from "lucide-react";

type Props = {
  instances?: Array<{
    id: string;
    name: string;
    instanceUUID: string;
    language: string;
    attributes?: Array<{ name: string; value: string }>;
  }>;
  serviceName?: string;
};

export function ServiceInstancesCard({ instances = [], serviceName }: Props) {
  // Safety check to ensure instances is always an array
  const safeInstances = instances ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Service Instances</h3>
          {serviceName && (
            <p className="text-sm text-blue-400/80 font-medium">
              Active nodes for {serviceName}
            </p>
          )}
        </div>
        <div className="px-2 py-1 bg-white/5 rounded text-[10px] font-mono text-muted-foreground border border-white/10">
          COUNT: {safeInstances.length}
        </div>
      </div>

      <div className="grid gap-3">
        {safeInstances.length > 0 ? (
          safeInstances.map((instance) => (
            <Card
              key={instance.id}
              className="p-4 bg-card/40 border-white/5 hover:border-blue-500/30 hover:bg-card/60 transition-all duration-300 group"
            >
              <div className="space-y-4">
                {/* Header Section */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                      <Server className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-white group-hover:text-blue-300 transition-colors">
                        {instance.name || 'Unknown Instance'}
                      </h4>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        UUID: {instance.instanceUUID?.substring(0, 18) || 'N/A'}...
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {instance.language && (
                      <span className="flex items-center gap-1.5 px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                        <Cpu className="w-3 h-3" />
                        {instance.language}
                      </span>
                    )}
                  </div>
                </div>

                {/* Attributes Grid */}
                {instance.attributes && instance.attributes.length > 0 && (
                  <div className="grid grid-cols-1 gap-1.5 pl-1">
                    {instance.attributes.slice(0, 4).map((attr, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-[11px] bg-white/[0.02] p-1.5 rounded border border-white/5"
                      >
                        <Terminal className="w-3 h-3 text-blue-500/50" />
                        <span className="text-slate-400 min-w-[60px]">{attr.name}:</span>
                        <span className="font-mono text-slate-200 truncate">{attr.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-10 text-center border-dashed border-white/10 bg-white/[0.02] rounded-xl">
            <div className="relative inline-block">
              <Server className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full" />
            </div>
            <p className="text-sm text-muted-foreground">No active instances found for this service</p>
            <p className="text-[10px] text-muted-foreground/50 mt-1 uppercase tracking-tighter">Check agent connection</p>
          </Card>
        )}
      </div>
    </div>
  );
}