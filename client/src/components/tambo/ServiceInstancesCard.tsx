import { Card } from "@/components/ui/card";
import { Terminal, Server } from "lucide-react";

type Props = {
  instances: Array<{
    id: string;
    name: string;
    instanceUUID: string;
    language: string;
    attributes?: Array<{ name: string; value: string }>;
  }>;
  serviceName?: string;
};

export function ServiceInstancesCard({ instances, serviceName }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Service Instances</h3>
        {serviceName && (
          <p className="text-sm text-muted-foreground">for {serviceName}</p>
        )}
      </div>

      <div className="grid gap-3">
        {instances.map((instance) => (
          <Card
            key={instance.id}
            className="p-4 bg-card/40 border-white/10 hover:bg-card/60 transition-colors"
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Server className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{instance.name}</h4>
                    <p className="text-xs text-muted-foreground font-mono">
                      {instance.instanceUUID.substring(0, 16)}...
                    </p>
                  </div>
                </div>

                {instance.language && (
                  <div className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded text-xs text-purple-400">
                    {instance.language}
                  </div>
                )}
              </div>

              {/* Attributes */}
              {instance.attributes && instance.attributes.length > 0 && (
                <div className="pl-11 space-y-1">
                  {instance.attributes.slice(0, 3).map((attr, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs"
                    >
                      <Terminal className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{attr.name}:</span>
                      <span className="font-mono">{attr.value}</span>
                    </div>
                  ))}
                  {instance.attributes.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{instance.attributes.length - 3} more attributes
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}

        {instances.length === 0 && (
          <Card className="p-8 text-center border-dashed bg-card/20">
            <Server className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No instances found</p>
          </Card>
        )}
      </div>
    </div>
  );
}
