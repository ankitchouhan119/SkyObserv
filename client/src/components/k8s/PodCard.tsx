import { Card } from "@/components/ui/card";
import { Box, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

export function PodCard({ pod, onClick }: any) {
  return (
    <Card 
      onClick={() => onClick(pod)}
      className="p-4 bg-card/40 border-white/10 hover:border-blue-500/40 hover:bg-white/[0.02] transition-all cursor-pointer group"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={cn("p-2.5 rounded-xl border", pod.status === "RUNNING" ? "bg-green-500/10 border-green-500/20" : "bg-yellow-500/10 border-yellow-500/20")}>
            <Box className={cn("w-5 h-5", pod.status === "RUNNING" ? "text-green-400" : "text-yellow-400")} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white italic group-hover:text-blue-400 transition-colors">{pod.name}</h4>
            <p className="text-[10px] text-muted-foreground font-mono italic">Image: {pod.image}</p>
          </div>
        </div>
        <div className="flex items-center gap-8">
           <div className="text-right">
              <p className="text-[9px] font-black text-muted-foreground uppercase">Status</p>
              <span className={pod.status === "RUNNING" ? "text-green-400 text-xs font-bold" : "text-yellow-400 text-xs font-bold"}>● {pod.status}</span>
           </div>
           <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[9px] font-black text-blue-400 uppercase flex items-center gap-1"><Terminal className="w-3 h-3" /> Logs</span>
           </div>
        </div>
      </div>
    </Card>
  );
}