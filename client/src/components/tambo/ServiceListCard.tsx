"use client";

import { Card } from "@/components/ui/card";
import { Server, Activity, AlertCircle } from "lucide-react";

export function ServiceListCard(props: any) {
  const data = props.args || props;
  const services = data.services || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Server className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Services Detected ({services.length})
        </h3>
      </div>
      
      <div className="grid gap-3">
        {services.map((service: any, idx: number) => {
          
          const displayStatus = service.normalStatus || "UNKNOWN"; 
          
          let dotColor = "bg-gray-500";
          let textColor = "text-gray-500";

          if (displayStatus === "NORMAL") {
            dotColor = "bg-green-400 shadow-[0_0_8px_#4ade80]";
            textColor = "text-green-400";
          } else if (displayStatus === "ABNORMAL") {
            dotColor = "bg-red-400 shadow-[0_0_8px_#f87171]";
            textColor = "text-red-400";
          }
          

          return (
            <Card key={service.id || idx} className="p-4 bg-card/40 border-white/5 hover:bg-card/60 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-primary" />
                    <h4 className="font-semibold text-slate-100 truncate">
                      {service.shortName || service.name}
                    </h4>
                  </div>
                  <p className="text-[10px] text-muted-foreground opacity-50 italic">ID: {service.id}</p>
                </div>
                
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded border border-white/5">
                    <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                    <span className={`text-[10px] font-bold ${textColor}`}>
                      {displayStatus}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}