import { Card } from "@/components/ui/card";
import { Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";

type Props = {
  // 🔥 Default empty array taaki 'undefined' na aaye
  traces?: Array<{
    key: string;
    endpointNames: string[];
    duration: number;
    start: string;
    isError: boolean;
    traceIds: string[];
  }>;
};

// 🔥 Props ko default empty object aur traces ko default empty array diya hai
export function TracesListCard(props: any) {
  // Tambo AI props ko 'args' ya direct bhej sakta hai, isliye ye safe extraction hai
  const data = props.args || props;
  const traces = data.traces || []; 

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" />
        {/* 🔥 Yahan ab length kabhi undefined nahi hogi */}
        <h3 className="text-lg font-semibold">Traces ({traces.length})</h3>
      </div>

      <div className="space-y-3">
        {traces.map((trace: any) => (
          <Card
            key={trace.key}
            className={`p-4 border-l-4 ${
              trace.isError
                ? "border-l-red-500 bg-red-950/10"
                : "border-l-green-500 bg-card/40"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  {trace.isError ? (
                    <XCircle className="w-4 h-4 text-red-400" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                  <span className="font-medium text-sm">
                    {trace.endpointNames?.[0] || "Unknown Endpoint"}
                  </span>
                </div>

                {trace.endpointNames?.length > 1 && (
                  <div className="text-xs text-muted-foreground pl-6">
                    + {trace.endpointNames.length - 1} more endpoint(s)
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground pl-6">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {trace.duration}ms
                  </span>
                  <span>
                    {trace.start ? new Date(trace.start).toLocaleString("en-US", {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                    }) : "N/A"}
                  </span>
                </div>

                {trace.traceIds && trace.traceIds.length > 0 && (
                  <div className="text-xs font-mono text-muted-foreground pl-6">
                    ID: {trace.traceIds[0].substring(0, 20)}...
                  </div>
                )}
              </div>

              {trace.isError && (
                <div className="px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
                  Error
                </div>
              )}
            </div>
          </Card>
        ))}

        {traces.length === 0 && (
          <Card className="p-8 text-center border-dashed bg-card/20 border-white/10">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No traces found for this period.</p>
          </Card>
        )}
      </div>
    </div>
  );
}