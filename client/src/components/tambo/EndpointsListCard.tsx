import { Card } from "@/components/ui/card";
import { Route, Link2 } from "lucide-react";

type Props = {
  endpoints: Array<{
    id: string;
    name: string;
  }>;
  serviceName?: string;
};

export function EndpointsListCard({ endpoints, serviceName }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">API Endpoints ({endpoints.length})</h3>
        {serviceName && (
          <p className="text-sm text-muted-foreground">for {serviceName}</p>
        )}
      </div>

      <div className="grid gap-2">
        {endpoints.map((endpoint) => (
          <Card
            key={endpoint.id}
            className="p-3 bg-card/40 border-white/10 hover:bg-card/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-green-500/10 rounded">
                <Route className="w-3.5 h-3.5 text-green-400" />
              </div>
              <span className="font-mono text-sm flex-1 break-all">
                {endpoint.name}
              </span>
            </div>
          </Card>
        ))}

        {endpoints.length === 0 && (
          <Card className="p-8 text-center border-dashed bg-card/20">
            <Link2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No endpoints found</p>
          </Card>
        )}
      </div>
    </div>
  );
}
