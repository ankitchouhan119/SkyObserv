"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'wouter';
import { useQuery, useApolloClient } from '@apollo/client';
import { GET_ALL_DATABASES, GET_TRACES_FOR_DB, GET_TRACE_DETAILS } from '@/apollo/queries/database';
import { AppLayout } from '@/components/layout/AppLayout';
import { useDurationStore } from '@/store/useDurationStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Database, Activity, ShieldCheck, Zap,
  Clock, Terminal, ArrowLeft,
  Server,
  Cpu,
  RefreshCw,
  Search,
} from 'lucide-react';
import { GET_GLOBAL_TOPOLOGY } from '@/apollo/queries/topology';
import { parseConfiguredStorageId } from '@shared/storageEndpoint';

type ConfiguredBackend = {
  id: string;
  name: string;
  kind: string;
  endpoint: string;
  serviceName?: string | null;
  source: 'configured';
  traced: false;
};

function decodeStorageNodeId(id: string): string {
  const encoded = id.split('.')[0];
  try {
    const decoded = atob(encoded);
    if (decoded && /^[\x20-\x7E]+$/.test(decoded)) return decoded;
  } catch {
    // not base64
  }
  return id;
}

function parseStorageEndpoint(nameOrId: string) {
  const displayName = decodeStorageNodeId(nameOrId);
  const colon = displayName.lastIndexOf(':');
  if (colon > 0) {
    return {
      displayName,
      host: displayName.slice(0, colon),
      port: displayName.slice(colon + 1),
    };
  }
  return { displayName, host: displayName, port: '—' };
}

export default function DatabaseDetailPage() {
  const { id } = useParams();
  const client = useApolloClient();
  const { durationObj } = useDurationStore();
  const decodedId = decodeURIComponent(id || "");
  const configuredBackendId = parseConfiguredStorageId(decodedId);

  const [dbSpans, setDbSpans] = useState<any[]>([]);
  const [configuredBackend, setConfiguredBackend] = useState<ConfiguredBackend | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  const formatDisplayTime = (timeStr: string) => {
    if (!timeStr) return "";
    try {
      const parts = timeStr.split(' ');
      const [year, month, day] = parts[0].split('-').map(Number);
      const timePart = parts[1] || "0000";
      const hour = parseInt(timePart.slice(0, 2));
      const min = timePart.length >= 4 ? parseInt(timePart.slice(2, 4)) : 0;
      const utcDate = new Date(Date.UTC(year, month - 1, day, hour, min));
      return utcDate.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return timeStr;
    }
  };

  const { data: dbListData } = useQuery(GET_ALL_DATABASES, { variables: { duration: durationObj } });
  const { data: topoData } = useQuery(GET_GLOBAL_TOPOLOGY, { variables: { duration: durationObj } });

  const storageNode = useMemo(
    () => topoData?.getGlobalTopology?.nodes?.find((n: any) => n.id === decodedId),
    [topoData, decodedId],
  );

  const db = dbListData?.getAllDatabases?.find((d: any) => d.id === decodedId);
  const endpoint = useMemo(
    () => parseStorageEndpoint(
      configuredBackend?.endpoint || storageNode?.name || db?.name || decodedId,
    ),
    [configuredBackend, storageNode, db, decodedId],
  );
  const storageKind = configuredBackend?.kind || storageNode?.type || dbSpans[0]?.component || 'Storage';
  const isConfiguredOnly = Boolean(configuredBackend);

  useEffect(() => {
    if (!configuredBackendId) {
      setConfiguredBackend(null);
      return;
    }

    fetch("/api/storage-backends", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { backends: [] }))
      .then((payload) => {
        const match = (payload.backends ?? []).find((b: ConfiguredBackend) => b.id === decodedId);
        setConfiguredBackend(match ?? null);
      })
      .catch(() => setConfiguredBackend(null));
  }, [configuredBackendId, decodedId]);

  const relevantSpans = useMemo(() => {
    if (!endpoint.displayName) return dbSpans;
    return dbSpans.filter(
      (s) =>
        s.peer === endpoint.displayName ||
        s.peer?.includes(endpoint.host) ||
        endpoint.displayName.includes(s.peer || ''),
    );
  }, [dbSpans, endpoint]);

  useEffect(() => {
    async function performUniversalScan() {
      setIsScanning(true);
      try {
        const { data: listData } = await client.query({
          query: GET_TRACES_FOR_DB,
          variables: {
            condition: { queryDuration: durationObj, traceState: 'ALL', queryOrder: 'BY_START_TIME', paging: { pageNum: 1, pageSize: 60 } },
          },
          fetchPolicy: 'network-only',
        });

        const basicTraces = listData?.queryBasicTraces?.traces || [];
        const foundSpans: any[] = [];

        const detailResults = await Promise.all(basicTraces.map((t: any) =>
          client.query({ query: GET_TRACE_DETAILS, variables: { traceId: t.traceIds[0] } }),
        ));

        detailResults.forEach((res) => {
          const spans = res.data?.queryTrace?.spans || [];
          spans.forEach((span: any) => {
            const isStorage = span.layer?.toLowerCase() === 'database' ||
              span.layer?.toLowerCase() === 'cache' ||
              /mysql|postgres|mongodb|redis/i.test(span.component || "");

            if (span.type === 'Exit' && isStorage) {
              const statementTag = span.tags?.find((t: any) => ['db.statement', 'redis.command', 'mongodb.command'].includes(t.key));
              foundSpans.push({
                key: span.spanId + span.startTime,
                statement: statementTag ? statementTag.value : span.endpointName,
                latency: span.endTime - span.startTime,
                time: span.startTime,
                component: span.component || "Storage",
                peer: span.peer,
                isError: span.isError,
              });
            }
          });
        });

        setDbSpans(foundSpans.sort((a, b) => b.time - a.time));
      } catch (err) {
        console.error(err);
      } finally {
        setIsScanning(false);
      }
    }
    performUniversalScan();
  }, [durationObj, client, decodedId]);

  const liveMetrics = useMemo(() => {
    const spans = relevantSpans;
    const hasData = spans.length > 0;
    return {
      latency: hasData ? Math.round(spans.reduce((acc, s) => acc + s.latency, 0) / spans.length) : 0,
      ops: spans.length,
      health: hasData ? "ONLINE" : isConfiguredOnly ? "CONFIGURED" : "IDLE",
    };
  }, [relevantSpans, isConfiguredOnly]);

  const filteredSpans = useMemo(() => {
    return relevantSpans.filter((s) =>
      s.statement.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.component.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [relevantSpans, searchQuery]);

  return (
    <AppLayout>
      <div className="so-page">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link href="/databases">
              <span className="text-sm text-muted-foreground hover:text-primary cursor-pointer flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Back
              </span>
            </Link>
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-lg font-semibold text-foreground truncate" style={{ fontFamily: 'Outfit, sans-serif' }} title={endpoint.displayName}>
                {endpoint.displayName}
              </h1>
              <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 shrink-0">
                <Database className="w-3 h-3 mr-1" /> {storageKind}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block px-4 border-r border-border text-xs font-mono text-muted-foreground">
              <p className="text-[10px] uppercase font-medium mb-0.5">Observation window</p>
              {formatDisplayTime(durationObj.start)} — {formatDisplayTime(durationObj.end)}
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isScanning ? 'animate-spin' : ''}`} /> Sync
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
          <TabsList className="so-tabs">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="queries">Queries ({relevantSpans.length})</TabsTrigger>
            <TabsTrigger value="topology">Infrastructure</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <MetricCard label="Avg latency" value={`${liveMetrics.latency}ms`} icon={<Zap className="w-4 h-4" />} wrap="bg-amber-50 text-amber-600" />
              <MetricCard label="Throughput" value={liveMetrics.ops} icon={<Activity className="w-4 h-4" />} wrap="bg-sky-50 text-sky-600" />
              <MetricCard label="Success rate" value={relevantSpans.length > 0 ? "100%" : "0%"} icon={<ShieldCheck className="w-4 h-4" />} wrap="bg-primary/10 text-primary" />
            </div>

            <div className="so-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-primary" /> Latest executions
                </h3>
                <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => setActiveTab("queries")}>
                  View all
                </Button>
              </div>
              <div className="space-y-2">
                {relevantSpans.length > 0 ? relevantSpans.slice(0, 3).map((span) => (
                  <div key={span.key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border text-sm">
                    <span className="font-mono text-muted-foreground truncate max-w-xl">{span.statement}</span>
                    <span className="font-semibold text-primary shrink-0">{span.latency}ms</span>
                  </div>
                )) : (
                  <p className="text-xs text-muted-foreground p-2">
                    {isConfiguredOnly
                      ? "No traced queries yet. Prisma and other ORMs are not auto-instrumented by the SkyWalking Node agent."
                      : "Waiting for database activity..."}
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="queries" className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search SQL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card border border-border rounded-lg py-2.5 pl-10 text-sm focus:border-primary/50 outline-none"
              />
            </div>
            <div className="grid gap-3">
              {filteredSpans.map((span) => (
                <div key={span.key} className="so-card p-5 hover:border-primary/25 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="bg-muted p-3 rounded-lg border border-border font-mono text-[13px] text-foreground leading-relaxed mb-3">
                        {span.statement}
                      </div>
                      <div className="flex items-center gap-4 text-[11px] font-medium text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(span.time).toLocaleTimeString()}</span>
                        <span className="px-2 py-0.5 bg-primary/10 rounded text-primary border border-primary/10">{span.component}</span>
                        <span className="opacity-70">{span.peer}</span>
                      </div>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <span className="text-xl font-semibold text-foreground">{span.latency}ms</span>
                      <p className="text-[10px] text-muted-foreground uppercase">Latency</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="topology" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="so-card p-5 min-w-0">
                <div className="flex items-center justify-between border-b border-border pb-4 mb-5 gap-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2 shrink-0">
                    <Server className="w-4 h-4 text-primary" /> Node specifications
                  </h3>
                  <Badge variant="outline" className={`shrink-0 ${
                    liveMetrics.health === 'ONLINE'
                      ? 'border-primary/30 text-primary bg-primary/5'
                      : liveMetrics.health === 'CONFIGURED'
                        ? 'border-amber-200 text-amber-700 bg-amber-50'
                        : 'border-amber-200 text-amber-700 bg-amber-50'
                  }`}>
                    {liveMetrics.health}
                  </Badge>
                </div>
                <div className="space-y-4">
                  <InfoItem label="Endpoint" value={endpoint.displayName} fullWidth />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoItem label="Host" value={endpoint.host} />
                    <InfoItem label="Port" value={endpoint.port} />
                    <InfoItem label="Client driver" value={relevantSpans[0]?.component || storageKind} highlight />
                    <InfoItem
                      label="Uptime"
                      value={liveMetrics.health === 'ONLINE' ? 'Active' : liveMetrics.health === 'CONFIGURED' ? 'Linked (not traced)' : 'Standby'}
                      dot={liveMetrics.health === 'ONLINE' ? 'primary' : 'warn'}
                    />
                    {configuredBackend?.serviceName && (
                      <InfoItem label="Linked service" value={configuredBackend.serviceName} />
                    )}
                  </div>
                </div>
              </div>

              <div className="so-card p-5 flex flex-col justify-center min-w-0">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-8">
                  <Activity className="w-4 h-4 text-primary" /> Service dependency
                </h3>
                <div className="flex items-center gap-2 sm:gap-4 px-1">
                  <NodeIcon icon={<Cpu className="w-6 h-6 text-primary" />} label="App backend" />
                  <div className="flex-1 min-w-0 flex items-center justify-center px-1 sm:px-3">
                    <div className={`h-px w-full relative ${liveMetrics.health === 'ONLINE' ? 'bg-primary/40' : 'bg-border'}`}>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 py-0.5 border border-border rounded text-[10px] font-medium text-primary whitespace-nowrap">
                        {liveMetrics.latency}ms latency
                      </div>
                    </div>
                  </div>
                  <NodeIcon
                    icon={<Database className="w-6 h-6 text-primary" />}
                    label={endpoint.host.split('.')[0] || 'Target'}
                    title={endpoint.displayName}
                    primary
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function MetricCard({ label, value, icon, wrap }: { label: string; value: string | number; icon: React.ReactNode; wrap: string }) {
  return (
    <div className="so-kpi">
      <div className={`so-icon-wrap ${wrap}`}>{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-2xl font-semibold text-foreground tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function InfoItem({ label, value, highlight, dot, fullWidth }: { label: string; value: string; highlight?: boolean; dot?: 'primary' | 'warn'; fullWidth?: boolean }) {
  return (
    <div className={`space-y-1 min-w-0 ${fullWidth ? 'col-span-full' : ''}`}>
      <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wide">{label}</p>
      <p
        className={`text-sm font-mono flex items-center gap-2 min-w-0 ${fullWidth ? 'break-all' : 'truncate'} ${highlight ? 'text-primary font-semibold' : 'text-foreground'}`}
        title={value}
      >
        {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot === 'primary' ? 'bg-primary' : 'bg-amber-500'}`} />}
        {value}
      </p>
    </div>
  );
}

function NodeIcon({ icon, label, primary, title }: { icon: React.ReactNode; label: string; primary?: boolean; title?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 min-w-0 max-w-[7rem] shrink-0">
      <div className={`p-3 rounded-xl border ${primary ? 'bg-primary/10 border-primary/20' : 'bg-muted border-border'}`}>
        {icon}
      </div>
      <span
        className={`text-[10px] font-medium uppercase tracking-wide text-center truncate w-full ${primary ? 'text-primary' : 'text-muted-foreground'}`}
        title={title || label}
      >
        {label}
      </span>
    </div>
  );
}
