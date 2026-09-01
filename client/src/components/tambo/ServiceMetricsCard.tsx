import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Zap, CheckCircle } from "lucide-react";

function resolveDisplayStatus(
  status?: string,
  normalStatus?: string,
): { key: string; label: string; style: string } {
  if (normalStatus === "NORMAL" || status === "healthy") {
    return {
      key: "healthy",
      label: "Normal",
      style: "text-primary bg-primary/10 border-primary/20",
    };
  }
  if (normalStatus === "ABNORMAL" || status === "critical") {
    return {
      key: "critical",
      label: "Abnormal",
      style: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    };
  }
  if (status === "degraded") {
    return {
      key: "degraded",
      label: "Unknown",
      style: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    };
  }
  return {
    key: "healthy",
    label: "Normal",
    style: "text-primary bg-primary/10 border-primary/20",
  };
}

export const ServiceMetricsCard = (props: Record<string, unknown> & { args?: Record<string, unknown> }) => {
  const data = (props.args || props) as {
    serviceName?: string;
    latency?: number | string;
    throughput?: number | string;
    sla?: number | string;
    status?: string;
    normalStatus?: string;
    insight?: string;
  };
  const { serviceName, latency, throughput, sla, status, normalStatus, insight } = data;
  const display = resolveDisplayStatus(status, normalStatus);

  return (
    <Card className="p-3.5 border-border/60 bg-card/90 my-2">
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">{serviceName}</h3>
          {insight && (
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{insight}</p>
          )}
        </div>
        <Badge variant="outline" className={`${display.style} font-medium text-[10px] shrink-0`}>
          {display.label}
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/50">
        <div className="text-center">
          <span className="text-[10px] text-muted-foreground uppercase flex items-center justify-center gap-1">
            <Activity className="w-3 h-3" /> Latency
          </span>
          <span className="text-xs font-mono font-semibold mt-0.5 block">{latency}ms</span>
        </div>
        <div className="text-center">
          <span className="text-[10px] text-muted-foreground uppercase flex items-center justify-center gap-1">
            <Zap className="w-3 h-3" /> Traffic
          </span>
          <span className="text-xs font-mono font-semibold mt-0.5 block">{throughput}</span>
        </div>
        <div className="text-center">
          <span className="text-[10px] text-muted-foreground uppercase flex items-center justify-center gap-1">
            <CheckCircle className="w-3 h-3" /> SLA
          </span>
          <span className="text-xs font-mono font-semibold mt-0.5 block">{sla}%</span>
        </div>
      </div>
    </Card>
  );
};
