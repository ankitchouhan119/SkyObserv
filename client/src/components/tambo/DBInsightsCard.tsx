"use client";

import { Card } from "@/components/ui/card";
import { Zap, Activity, ShieldCheck, Terminal, Database } from "lucide-react";

export function DBInsightsCard({ dbName, avgLatency, throughput, successRate, latestQueries = [] }: any) {
  return (
    <Card className="p-5 bg-[#0f172a]/90 border-primary/20 space-y-5 shadow-2xl relative overflow-hidden">
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 blur-3xl rounded-full" />
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          <span className="text-sm font-black text-white italic truncate max-w-[180px] uppercase">{dbName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
          <span className="text-[10px] font-black text-green-400 tracking-tighter">HEALTHY</span>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-400" /> Latency
          </p>
          <p className="text-lg font-black text-white">{avgLatency}ms</p>
        </div>
        <div className="space-y-1 border-x border-white/10 px-3">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
            <Activity className="w-3 h-3 text-blue-400" /> Throughput
          </p>
          <p className="text-lg font-black text-white">{throughput}</p>
        </div>
        <div className="space-y-1 pl-1">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-green-400" /> Success
          </p>
          <p className="text-lg font-black text-white">{successRate}</p>
        </div>
      </div>

      {/* Latest Queries Section */}
      <div className="space-y-2">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-primary" /> Latest Executions
        </p>
        <div className="space-y-2">
          {latestQueries.map((q: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/5 text-[11px]">
              <span className="font-mono text-blue-300/80 truncate italic max-w-[180px]">{q.sql}</span>
              <span className="font-bold text-primary">{q.latency}ms</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}