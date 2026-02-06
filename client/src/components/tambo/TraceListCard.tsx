import { Card } from "@/components/ui/card";
import { Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";

export function TracesListCard(props: any) {
  const data = props.args || props;
  const traces = data.traces || [];

  // Date Fix
  const formatDate = (dateValue: any) => {
    if (!dateValue) return "N/A";
    try {
      // 13-digit string timestamp convert to number
      const ts = typeof dateValue === "string" ? parseInt(dateValue, 10) : dateValue;
      const date = new Date(ts);
      
      // Check if Date is valid
      if (isNaN(date.getTime())) return "N/A";

      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch (e) {
      return "N/A";
    }
  };

  return (
    <div className="space-y-4 w-full overflow-hidden px-1">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-bold tracking-tight text-slate-200">
          Traces ({traces.length})
        </h3>
      </div>

      <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1 custom-scrollbar">
        {traces.map((trace: any, idx: number) => (
          <Card
            key={trace.key || trace.segmentId || idx}
            className={`p-3 border-l-4 border-t-0 border-r-0 border-b-0 transition-all ${
              trace.isError
                ? "border-l-red-500 bg-red-500/10 hover:bg-red-500/15"
                : "border-l-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10"
            } border-white/5 shadow-md`}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {trace.isError ? (
                    <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  )}
                  <span className="font-semibold text-[13px] text-slate-100 truncate">
                    {trace.endpointNames?.[0] || "Unknown Endpoint"}
                  </span>
                </div>
                
                {trace.isError && (
                  <span className="flex-shrink-0 px-1.5 py-0.5 bg-red-500/20 border border-red-500/40 rounded text-[9px] uppercase font-black text-red-400">
                    Error
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 ml-5">
                <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 rounded">
                  <Clock className="w-3 h-3" />
                  {trace.duration}ms
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  {formatDate(trace.start)}
                </div>
              </div>

              {trace.traceIds?.[0] && (
                <div className="text-[10px] font-mono text-slate-500 ml-5 truncate opacity-70">
                  ID: {trace.traceIds[0].substring(0, 24)}...
                </div>
              )}
            </div>
          </Card>
        ))}

        {traces.length === 0 && (
          <div className="py-10 text-center border-2 border-dashed border-white/5 rounded-xl">
            <AlertCircle className="w-6 h-6 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No data found in this window.</p>
          </div>
        )}
      </div>
    </div>
  );
}