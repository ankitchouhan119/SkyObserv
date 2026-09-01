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
        <h3 className="text-sm font-semibold text-foreground">
          Services Detected ({services.length})
        </h3>
      </div>
      
      <div className="grid gap-3">
        {services.map((service: any, idx: number) => {
          
          const displayStatus = service.normalStatus || "UNKNOWN"; 
          
          let dotColor = "bg-gray-500";
          let textColor = "text-gray-500";

          if (displayStatus === "NORMAL") {
            dotColor = "bg-primary";
            textColor = "text-primary";
          } else if (displayStatus === "ABNORMAL") {
            dotColor = "bg-rose-400";
            textColor = "text-rose-400";
          }
          

          return (
            <Card key={service.id || idx} className="p-3 border-border bg-card hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-3.5 h-3.5 text-primary" />
                    <h4 className="text-sm font-medium text-foreground truncate">
                      {service.shortName || service.name}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-border/60 bg-secondary/40">
                  <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                  <span className={`text-[10px] font-medium ${textColor}`}>
                    {displayStatus}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}