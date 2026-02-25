"use client";
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useApolloClient } from '@apollo/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Box, ArrowLeft, Activity, Server, Search, LayoutGrid, Network, ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react';
import { GET_K8S_DASHBOARD, GET_SERVICE_INSTANCES, GET_MQE_METRICS, GET_K8S_NODES } from '@/apollo/queries/kubernetes';
import { useDurationStore } from '@/store/useDurationStore';
import { cn } from '@/lib/utils';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getNamespace(fullName: string): string {
  const after = fullName.split('::')[1] || '';
  const parts = after.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : 'default';
}

function getMQEValue(data: any, label: string): number {
  try {
    const results = data?.result?.results;
    if (!results || results.length === 0) return 0;
    const values = results[0]?.values;
    if (!values || values.length === 0) return 0;
    const val = values.slice(-1)[0]?.value;
    return val ? parseFloat(val) : 0;
  } catch (e) { return 0; }
}

function formatBytes(bytes: number) {
    if (bytes === 0) return '0 KB/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function K8sNodeExplorerPage() {
  const { name: urlNamespace } = useParams(); 
  const [, setLocation] = useLocation();
  const client = useApolloClient();
  const { durationObj } = useDurationStore();

  const [allPods, setAllPods] = useState<any[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string>("All");
  const [selectedNamespace, setSelectedNamespace] = useState<string>(urlNamespace || "All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [nodeMetrics, setNodeMetrics] = useState({ 
    cpu: 0, mem: 0, totalCores: "0", usedCores: "0", netIn: 0, netOut: 0 
  });
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [loadingNetwork, setLoadingNetwork] = useState(false);

  // Queries
  const { data: dashData } = useQuery(GET_K8S_DASHBOARD, { fetchPolicy: 'network-only' });
  const { data: nodesData } = useQuery(GET_K8S_NODES, { variables: { duration: durationObj } });

  const services = dashData?.services ?? [];
  const clusterServices = nodesData?.allServices ?? [];
  
  const clusterName = useMemo(() => {
     const k8sSvc = clusterServices.find((s: any) => s.layers?.includes('K8S')) || services.find((s: any) => s.layers?.includes('K8S'));
     return k8sSvc?.name || "k8s-cluster::k8s-cluster";
  }, [clusterServices, services]);

  // WORKLOAD SYNC
  useEffect(() => {
    async function fetchAllWorkloads() {
      if (services.length === 0) return;
      setLoadingAll(true);
      try {
        const clusterService = clusterServices.find((s: any) => s.layers?.includes('K8S')) || services.find((s: any) => s.layers?.includes('K8S'));
        let defaultNodeName = "N/A";
        if (clusterService) {
          const nodeRes = await client.query({ query: GET_SERVICE_INSTANCES, variables: { serviceId: clusterService.id, duration: durationObj } });
          const actualNodes = nodeRes.data.getServiceInstances ?? nodeRes.data.instances ?? [];
          if (actualNodes.length > 0) defaultNodeName = actualNodes[0].name; 
        }
        const podServices = services.filter((s: any) => s.layers?.includes('K8S_SERVICE'));
        const podResults = await Promise.all(
          podServices.map((svc: any) => client.query({ query: GET_SERVICE_INSTANCES, variables: { serviceId: svc.id, duration: durationObj } }))
        );
        const mergedPods = podResults.flatMap((res: any, i: number) => {
          const instances = res.data.getServiceInstances ?? res.data.instances ?? [];
          return instances.map((inst: any) => {
            const attrs = inst.attributes || [];
            return {
              ...inst,
              serviceName: podServices[i].name,
              nodeName: attrs.find((a: any) => a.name === 'node_name' || a.name === 'host_name')?.value || defaultNodeName,
              namespace: attrs.find((a: any) => a.name === 'namespace')?.value || getNamespace(podServices[i].name),
            };
          });
        });
        setAllPods(mergedPods);
      } catch (err: any) { console.error(err); } finally { setLoadingAll(false); }
    }
    fetchAllWorkloads();
  }, [services, clusterServices, durationObj, client]);

  // NETWORK FETCH LOGIC
  const fetchNetworkOnly = useCallback(async () => {
    if (selectedNode === "All" || selectedNode === "N/A") return;
    setLoadingNetwork(true);
    try {
      const nodeEntity = { scope: 'ServiceInstance', serviceName: clusterName, serviceInstanceName: selectedNode, normal: true };
      const [netInRes, netOutRes] = await Promise.all([
        client.query({ query: GET_MQE_METRICS, variables: { expression: "k8s_node_network_receive", entity: nodeEntity, duration: durationObj }, fetchPolicy: 'no-cache' }),
        client.query({ query: GET_MQE_METRICS, variables: { expression: "k8s_node_network_transmit", entity: nodeEntity, duration: durationObj }, fetchPolicy: 'no-cache' })
      ]);
      setNodeMetrics(prev => ({ ...prev, netIn: getMQEValue(netInRes.data, "Net In"), netOut: getMQEValue(netOutRes.data, "Net Out") }));
    } catch (e) { console.error(e); } finally { setLoadingNetwork(false); }
  }, [selectedNode, clusterName, client, durationObj]);

  // STATIC CPU/MEM FETCHING
  useEffect(() => {
    if (selectedNode === "All" || selectedNode === "N/A") return;
    async function fetchStaticMetrics() {
      setLoadingMetrics(true);
      try {
        const nodeEntity = { scope: 'ServiceInstance', serviceName: clusterName, serviceInstanceName: selectedNode, normal: true };
        const [cpuU, cpuT, memU, memT] = await Promise.all([
          client.query({ query: GET_MQE_METRICS, variables: { expression: "k8s_node_cpu_usage", entity: nodeEntity, duration: durationObj } }),
          client.query({ query: GET_MQE_METRICS, variables: { expression: "k8s_node_cpu_cores", entity: nodeEntity, duration: durationObj } }),
          client.query({ query: GET_MQE_METRICS, variables: { expression: "k8s_node_memory_usage", entity: nodeEntity, duration: durationObj } }),
          client.query({ query: GET_MQE_METRICS, variables: { expression: "k8s_node_memory_total", entity: nodeEntity, duration: durationObj } })
        ]);
        setNodeMetrics(prev => ({
          ...prev,
          cpu: Math.round((getMQEValue(cpuU.data, "CPU") / (getMQEValue(cpuT.data, "CPUT") || 1)) * 100),
          mem: Math.round((getMQEValue(memU.data, "Mem") / (getMQEValue(memT.data, "MemT") || 1)) * 100)
        }));
      } catch (e) { console.error(e); } finally { setLoadingMetrics(false); }
    }
    fetchStaticMetrics();
    fetchNetworkOnly();
    const interval = setInterval(fetchNetworkOnly, 15000);
    return () => clearInterval(interval);
  }, [selectedNode, fetchNetworkOnly, clusterName, durationObj, client]);

  // BREAKDOWN TABLE DATA
  const tableData = useMemo(() => {
    const nodeSpecificPods = allPods.filter(p => selectedNode === "All" || p.nodeName === selectedNode);
    const breakdown = nodeSpecificPods.reduce((acc: any, pod: any) => {
      if (!acc[pod.namespace]) acc[pod.namespace] = { name: pod.namespace, pods: 0, deps: 0, sts: 0, ds: 0 };
      acc[pod.namespace].pods += 1;
      const lowerName = pod.serviceName.toLowerCase();
      if (lowerName.includes('sts') || lowerName.includes('statefulset')) acc[pod.namespace].sts += 1;
      else if (lowerName.includes('ds') || lowerName.includes('daemonset')) acc[pod.namespace].ds += 1;
      else acc[pod.namespace].deps += 1;
      return acc;
    }, {});
    return Object.values(breakdown);
  }, [allPods, selectedNode]);

  const availableNodes = useMemo(() => Array.from(new Set(allPods.map(p => p.nodeName))).filter(n => n !== "N/A"), [allPods]);
  const availableNamespaces = useMemo(() => Array.from(new Set(allPods.map(p => p.namespace))), [allPods]);
  const filteredPods = useMemo(() => allPods.filter(p => (selectedNode === "All" || p.nodeName === selectedNode) && (selectedNamespace === "All" || p.namespace === selectedNamespace) && p.name.toLowerCase().includes(searchQuery.toLowerCase())), [allPods, selectedNode, selectedNamespace, searchQuery]);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6 px-4 py-8 text-slate-200">
        
        {/* HEADER */}
        <header className="flex justify-between items-center pb-2">
          <div className="space-y-1">
            <button onClick={() => setLocation('/kubernetes')} className="text-[10px] font-black text-muted-foreground flex items-center gap-1 uppercase hover:text-blue-400">
              <ArrowLeft size={10} /> CLUSTER
            </button>
            <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Workload <span className="text-blue-500">Explorer</span></h1>
          </div>
        </header>

        {/* 1. NODE SELECTOR */}
        <Card className="p-4 border-white/5 bg-slate-900/40 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-blue-400"><Server size={18} /><span className="text-xs font-black uppercase text-white">Target Node:</span></div>
            <div className="flex-1 max-w-[400px]">
              <Select value={selectedNode} onValueChange={setSelectedNode}>
                <SelectTrigger className="bg-black/40 border-white/10 text-white font-bold uppercase text-[11px]"><SelectValue placeholder="Select Node" /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  <SelectItem value="All">Show All Nodes</SelectItem>
                  {availableNodes.map(node => (<SelectItem key={node} value={node}>{node}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* 2. METRICS ROW (Compute + Network Side-by-Side) */}
        {selectedNode !== "All" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-8 p-6 bg-blue-500/5 border-blue-500/20 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20"><Activity size={80} className="text-blue-400" /></div>
                <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-white/10 pb-6 md:pb-0 md:pr-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Compute Environment</p>
                  <h2 className="text-2xl font-black text-white italic truncate uppercase">{selectedNode}</h2>
                </div>
                <div className="w-full md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-8 z-10">
                   <MetricProgress label="Node CPU Usage" value={nodeMetrics.cpu} loading={loadingMetrics} color="bg-blue-500" />
                   <MetricProgress label="Node Memory Usage" value={nodeMetrics.mem} loading={loadingMetrics} color="bg-cyan-500" />
                </div>
            </Card>

            <Card className="lg:col-span-4 p-6 bg-emerald-500/5 border-emerald-500/20 relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2"><Network className="text-emerald-400" size={18} /><span className="text-[10px] font-black uppercase text-white">Live Network I/O</span></div>
                    <button onClick={fetchNetworkOnly} disabled={loadingNetwork} className="p-1 hover:bg-emerald-500/20 rounded-md border border-emerald-500/10 transition-all">
                      <RefreshCw size={12} className={cn("text-emerald-400", loadingNetwork && "animate-spin")} />
                    </button>
                </div>
                <div className="space-y-6 relative z-10">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2"><ArrowDownCircle className="text-emerald-400" size={16} /><span className="text-[10px] font-bold text-slate-400 uppercase">Incoming</span></div>
                        <span className="text-sm font-black text-white italic">{formatBytes(nodeMetrics.netIn)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2"><ArrowUpCircle className="text-blue-400" size={16} /><span className="text-[10px] font-bold text-slate-400 uppercase">Outgoing</span></div>
                        <span className="text-sm font-black text-white italic">{formatBytes(nodeMetrics.netOut)}</span>
                    </div>
                </div>
            </Card>
          </div>
        )}

        {/* 3. BREAKDOWN TABLE (Wapas add kar diya) */}
        {selectedNode !== "All" && (
          <Card className="border-white/5 bg-slate-900/40 overflow-hidden">
            <div className="p-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 uppercase font-black text-[10px] italic text-blue-400">
                <LayoutGrid size={12} /> Resource Mapping
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-black/30 text-[9px] font-black uppercase text-slate-500 border-b border-white/5">
                    <th className="px-6 py-4">Namespace</th>
                    <th className="px-6 py-4 text-center">Pods</th>
                    <th className="px-6 py-4 text-center">Deployments</th>
                    <th className="px-6 py-4 text-center">StatefulSets</th>
                    <th className="px-6 py-4 text-center">DaemonSets</th>
                    <th className="px-6 py-4 text-right">Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tableData.map((ns: any) => (
                    <tr key={ns.name} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4 font-black text-white italic text-xs uppercase group-hover:text-blue-400">{ns.name}</td>
                      <td className="px-6 py-4 text-center"><span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-md border border-blue-500/20 font-black text-[10px]">{ns.pods}</span></td>
                      <td className="px-6 py-4 text-center text-xs font-bold text-slate-400">{ns.deps}</td>
                      <td className="px-6 py-4 text-center text-xs font-bold text-slate-400">{ns.sts}</td>
                      <td className="px-6 py-4 text-center text-xs font-bold text-slate-400">{ns.ds}</td>
                      <td className="px-6 py-4 text-right text-[9px] font-black text-emerald-500 uppercase italic">Live</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* 4. FILTERS & PODS */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[300px] relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400" />
              <Input placeholder="Search Pods..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-11 bg-slate-900/60 border-white/10 text-white font-black uppercase text-xs focus-visible:ring-blue-500/50" />
            </div>
            <Select value={selectedNamespace} onValueChange={setSelectedNamespace}>
              <SelectTrigger className="w-[200px] h-11 bg-slate-900/60 border-white/10 text-white font-black uppercase text-[10px]"><SelectValue placeholder="Namespace" /></SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 text-white">
                <SelectItem value="All">All Namespaces</SelectItem>
                {availableNamespaces.map(ns => (<SelectItem key={ns} value={ns}>{ns}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPods.map((pod: any) => (
              <Card key={pod.id} onClick={() => setLocation(`/kubernetes/namespace/${pod.namespace}/pod/${encodeURIComponent(pod.id)}`)} className="p-5 bg-slate-900/40 border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group relative overflow-hidden">
                <div className="flex items-start gap-4 relative z-10">
                  <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 group-hover:scale-110 transition-transform"><Box className="text-blue-400" size={22} /></div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-white italic truncate uppercase">{pod.name}</h4>
                    <span className="text-[8px] font-black text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/10 uppercase">{pod.namespace}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  <span>{pod.nodeName}</span>
                  <span className="flex items-center gap-1 text-emerald-500 italic"><Activity size={10} /> POD</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function MetricProgress({ label, value, loading, color }: any) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        <span className="text-lg font-black text-white italic tracking-tighter">{loading ? '...' : `${value}%`}</span>
      </div>
      <div className="h-2 bg-black/40 rounded-full border border-white/5 overflow-hidden">
        <div className={cn("h-full transition-all duration-1000", color)} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}