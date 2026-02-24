"use client";
import { GET_EVENTS } from "@/apollo/queries/kubernetes";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@apollo/client";
import { Network, Share2 } from "lucide-react";
import { useDurationStore } from "@/store/useDurationStore";
// import { K8sLiveLogsPanel } from './K8sPodTopologyPanel';


// ─── Inner component — pod guaranteed non-null here ──────────────────────────
function DrawerContent({ pod, onClose }: { pod: any; onClose: () => void }) {
  const { durationObj } = useDurationStore();

  const { data: eventData } = useQuery(GET_EVENTS, {
    variables: {
      condition: {
        time: durationObj,
        paging: { pageNum: 1, pageSize: 10 },
        source: {
          service: pod.serviceName,
          serviceInstance: pod.name,
        },
      },
    },
  });

  const podIP = pod.attributes?.find((a: any) => a.name === 'pod_ip')?.value || "N/A";
  const nodeName = pod.attributes?.find((a: any) => a.name === 'node_name')?.value || "N/A";
  const namespace = pod.attributes?.find((a: any) => a.name === 'namespace')?.value || "N/A";
  const events = eventData?.events?.events ?? [];

  return (
    <>
      <SheetHeader className="p-5 border-b border-white/5 bg-white/[0.02]">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <Share2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <SheetTitle className="text-sm font-black text-white italic uppercase tracking-tight">
                {pod.name}
              </SheetTitle>
              <p className="text-[10px] font-mono text-muted-foreground uppercase">
                Node: {nodeName} · NS: {namespace}
              </p>
            </div>
          </div>
          <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-black italic">
            Running
          </div>
        </div>
      </SheetHeader>

      <Tabs defaultValue="infra" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="bg-transparent border-b border-white/5 px-6 gap-8 flex-shrink-0">
          <TabsTrigger value="infra" className="py-4 text-[10px] font-black uppercase">
            Infrastructure
          </TabsTrigger>
          <TabsTrigger value="events" className="py-4 text-[10px] font-black uppercase">
            Events {events.length > 0 && `(${events.length})`}
          </TabsTrigger>
          <TabsTrigger value="logs" className="py-4 text-[10px] font-black uppercase">
            Live Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="infra" className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Network className="w-3 h-3" /> Network
            </h4>
            <div className="space-y-2">
              {[
                { label: 'Pod IP', value: podIP },
                { label: 'Node', value: nodeName },
                { label: 'Namespace', value: namespace },
                { label: 'Instance ID', value: pod.id },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-[10px] text-muted-foreground italic">{row.label}</span>
                  <span className="text-[10px] font-mono text-white">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">
              All Attributes
            </h4>
            <div className="space-y-1">
              {(pod.attributes ?? []).map((attr: any) => (
                <div key={attr.name} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-[9px] text-muted-foreground font-mono">{attr.name}</span>
                  <span className="text-[9px] font-mono text-white max-w-[60%] truncate text-right">{attr.value}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="events" className="p-6 space-y-3 overflow-y-auto flex-1">
          {events.length === 0 ? (
            <p className="text-[10px] text-muted-foreground italic text-center py-20">No events found</p>
          ) : events.map((ev: any, i: number) => (
            <div key={i} className="border-l-2 border-orange-500 pl-3 py-2 bg-orange-500/5 rounded-r-lg">
              <div className="flex justify-between">
                <p className="text-[10px] font-black text-white uppercase italic">{ev.name}</p>
                <span className="text-[8px] font-black text-orange-400 uppercase">{ev.type}</span>
              </div>
              <p className="text-[9px] text-muted-foreground mt-1">{ev.message}</p>
              <p className="text-[8px] text-muted-foreground/50 mt-1 font-mono">{ev.startTime}</p>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="logs" className="flex-1 overflow-hidden p-0 data-[state=active]:flex data-[state=active]:flex-col">
          <K8sLiveLogsPanel
            pod={pod}
            namespace={namespace}
            isOpen={true}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}

// ─── Outer wrapper — handles null pod safely, no hooks here ──────────────────
export function K8sResourceDrawer({ pod, isOpen, onClose }: any) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full md:w-[750px] bg-[#0c0d10] border-l border-white/10 p-0 flex flex-col">
        {pod ? (
          <DrawerContent pod={pod} onClose={onClose} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs italic">
            Select a pod to inspect
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}