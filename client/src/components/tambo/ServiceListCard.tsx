import { Card } from "@/components/ui/card";
import { Server, Activity, Layers, AlertCircle } from "lucide-react";


export function ServiceListCard(props: any) {

  const data = props.args || props;
  

  const services = data.services || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Server className="w-5 h-5 text-primary" />

        <h3 className="text-lg font-semibold">Services ({services.length})</h3>
      </div>
      
      <div className="grid gap-3">
        {services.map((service: any) => (
          <Card
            key={service.id}
            className="p-4 bg-card/40 border-white/10 hover:bg-card/60 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-primary" />
                  <h4 className="font-medium">{service.shortName || service.name}</h4>
                </div>
                
                {service.group && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Group: {service.group}
                  </p>
                )}
                

                {service.layers && service.layers.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <Layers className="w-3 h-3" />
                    <span className="text-muted-foreground">
                      {service.layers.join(", ")}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-2 h-2 rounded-full ${
                    service.normal ? "bg-green-400 shadow-[0_0_8px_#4ade80]" : "bg-red-400 shadow-[0_0_8px_#f87171]"
                  }`}
                />
                <span className="text-xs text-muted-foreground">
                  {service.normal ? "Normal" : "Abnormal"}
                </span>
              </div>
            </div>
          </Card>
        ))}

         {/* Empty state handles no data gracefully  */}
        {services.length === 0 && (
          <Card className="p-8 text-center border-dashed bg-card/10 border-white/10">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No services detected in the current view.</p>
          </Card>
        )}
      </div>
    </div>
  );
}