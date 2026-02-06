import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Zap, CheckCircle } from "lucide-react";

export const ServiceMetricsCard = (props: any) => {
  // AI props handle
  const data = props.args || props;
  const { serviceName, latency, throughput, sla, status = "healthy", insight } = data;

  const statusStyle = status === "critical" ? "text-red-500 bg-red-500/10 border-red-500/20" : 
                      status === "degraded" ? "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" : 
                      "text-green-500 bg-green-500/10 border-green-500/20";

  return (
    <Card className="p-5 bg-[#111] border-white/10 shadow-2xl my-3 border-l-4 border-l-primary">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">{serviceName}</h3>
          {insight && <p className="text-xs text-muted-foreground mt-2 italic leading-relaxed">"{insight}"</p>}
        </div>
        <Badge className={`${statusStyle} font-bold text-[10px]`}>{status.toUpperCase()}</Badge>
      </div>
      <div className="grid grid-cols-3 gap-2 py-3 border-t border-white/5">
        <div className="flex flex-col gap-1 text-center">
          <span className="text-[9px] text-muted-foreground uppercase flex items-center justify-center gap-1"><Activity className="w-3 h-3" /> Latency</span>
          <span className="text-sm font-mono text-white font-bold">{latency}ms</span>
        </div>
        <div className="flex flex-col gap-1 text-center">
          <span className="text-[9px] text-muted-foreground uppercase flex items-center justify-center gap-1"><Zap className="w-3 h-3" /> Traffic</span>
          <span className="text-sm font-mono text-white font-bold">{throughput}</span>
        </div>
        <div className="flex flex-col gap-1 text-center">
          <span className="text-[9px] text-muted-foreground uppercase flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3" /> SLA</span>
          <span className="text-sm font-mono text-white font-bold">{sla}%</span>
        </div>
      </div>
    </Card>
  );
};
