"use client";
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useApolloClient } from '@apollo/client';
import { AppLayout } from '@/components/layout/AppLayout';
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
      <div className="so-page">
        <header className="so-page-header">
          <button onClick={() => setLocation('/kubernetes')} className="text-sm text-muted-foreground flex items-center gap-1 hover:text-primary mb-2">
            <ArrowLeft size={14} /> Back to cluster
          </button>
          <h2>Workload Explorer</h2>
          <p>Browse pods, nodes, and namespace breakdown.</p>
        </header>

        <div className="so-card p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-primary">
              <Server size={18} />
              <span className="text-sm font-medium text-foreground">Target node</span>
            </div>
            <div className="flex-1 max-w-[400px]">
              <Select value={selectedNode} onValueChange={setSelectedNode}>
                <SelectTrigger className="bg-card"><SelectValue placeholder="Select Node" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">Show all nodes</SelectItem>
                  {availableNodes.map((node) => (<SelectItem key={node} value={node}>{node}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {selectedNode !== "All" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-8 so-card p-5 flex flex-col md:flex-row gap-6 items-center">
              <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-6">
                <p className="text-xs text-muted-foreground mb-1">Compute environment</p>
                <h3 className="text-lg font-semibold text-foreground truncate">{selectedNode}</h3>
              </div>
              <div className="w-full md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <MetricProgress label="Node CPU" value={nodeMetrics.cpu} loading={loadingMetrics} color="bg-primary" />
                <MetricProgress label="Node memory" value={nodeMetrics.mem} loading={loadingMetrics} color="bg-violet-500" />
              </div>
            </div>

            <div className="lg:col-span-4 so-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Network className="text-primary" size={18} /> Network I/O
                </div>
                <button onClick={fetchNetworkOnly} disabled={loadingNetwork} className="p-1.5 hover:bg-muted rounded-md border border-border">
                  <RefreshCw size={14} className={cn("text-primary", loadingNetwork && "animate-spin")} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><ArrowDownCircle className="text-primary" size={16} /> Incoming</div>
                  <span className="text-sm font-semibold text-foreground">{formatBytes(nodeMetrics.netIn)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><ArrowUpCircle className="text-sky-500" size={16} /> Outgoing</div>
                  <span className="text-sm font-semibold text-foreground">{formatBytes(nodeMetrics.netOut)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedNode !== "All" && (
          <div className="so-table-wrap">
            <div className="p-3 border-b border-border flex items-center gap-2 text-sm font-medium text-foreground">
              <LayoutGrid size={14} className="text-primary" /> Resource mapping
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-muted/50 text-xs text-muted-foreground border-b border-border">
                    <th className="px-4 py-3 font-medium">Namespace</th>
                    <th className="px-4 py-3 text-center font-medium">Pods</th>
                    <th className="px-4 py-3 text-center font-medium">Deployments</th>
                    <th className="px-4 py-3 text-center font-medium">StatefulSets</th>
                    <th className="px-4 py-3 text-center font-medium">DaemonSets</th>
                    <th className="px-4 py-3 text-right font-medium">Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tableData.map((ns: any) => (
                    <tr key={ns.name} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">{ns.name}</td>
                      <td className="px-4 py-3 text-center"><span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">{ns.pods}</span></td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{ns.deps}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{ns.sts}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{ns.ds}</td>
                      <td className="px-4 py-3 text-right text-xs text-primary font-medium">Live</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="space-y-4 pt-2 border-t border-border">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search pods..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-10 bg-card" />
            </div>
            <Select value={selectedNamespace} onValueChange={setSelectedNamespace}>
              <SelectTrigger className="w-[200px] h-10 bg-card"><SelectValue placeholder="Namespace" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All namespaces</SelectItem>
                {availableNamespaces.map((ns) => (<SelectItem key={ns} value={ns}>{ns}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPods.map((pod: any) => (
              <div
                key={pod.id}
                onClick={() => setLocation(`/kubernetes/namespace/${pod.namespace}/pod/${encodeURIComponent(pod.id)}`)}
                className="so-card-hover p-4 cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="so-icon-wrap bg-primary/10 text-primary"><Box size={18} /></div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground truncate">{pod.name}</h4>
                    <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded mt-1 inline-block">{pod.namespace}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
                  <span>{pod.nodeName}</span>
                  <span className="flex items-center gap-1 text-primary"><Activity size={12} /> Pod</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function MetricProgress({ label, value, loading, color }: { label: string; value: number; loading: boolean; color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-lg font-semibold text-foreground tabular-nums">{loading ? '—' : `${value}%`}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full transition-all duration-700 rounded-full", color)} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}