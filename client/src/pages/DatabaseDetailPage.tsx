"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@apollo/client";
import { GET_ALL_DATABASES } from "@/apollo/queries/database";
import { AppLayout } from "@/components/layout/AppLayout";
import { useDurationStore } from "@/store/useDurationStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Database,
  ArrowLeft,
  Server,
  RefreshCw,
  Search,
} from "lucide-react";
import { GET_GLOBAL_TOPOLOGY } from "@/apollo/queries/topology";
import { parseConfiguredStorageId } from "@shared/storageEndpoint";
import { useDatabaseTraceScan } from "@/hooks/use-database-trace-scan";
import {
  buildLatencyTrend,
  buildQueryFingerprints,
  buildSlowSqlLeaderboard,
  computeDbMetrics,
  detectN1Queries,
  filterSpansForStorage,
  getCallingServices,
  getFailedDbQueries,
} from "@/lib/dbTraceAnalysis";
import { DbMetricsSummary } from "@/components/databases/DbMetricsSummary";
import { SlowSqlLeaderboard } from "@/components/databases/SlowSqlLeaderboard";
import { FailedDbQueriesPanel } from "@/components/databases/FailedDbQueriesPanel";
import { QueryFingerprintPanel } from "@/components/databases/QueryFingerprintPanel";
import { CallingServicesPanel } from "@/components/databases/CallingServicesPanel";
import { N1DetectorBanner } from "@/components/databases/N1DetectorBanner";
import { DbLatencyTrendChart } from "@/components/databases/DbLatencyTrendChart";
import { DbQueryRow } from "@/components/databases/DbQueryRow";

type ConfiguredBackend = {
  id: string;
  name: string;
  kind: string;
  endpoint: string;
  serviceName?: string | null;
  source: "configured";
  traced: false;
};

function decodeStorageNodeId(id: string): string {
  const encoded = id.split(".")[0];
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
  const colon = displayName.lastIndexOf(":");
  if (colon > 0) {
    return {
      displayName,
      host: displayName.slice(0, colon),
      port: displayName.slice(colon + 1),
    };
  }
  return { displayName, host: displayName, port: "—" };
}

export default function DatabaseDetailPage() {
  const { id } = useParams();
  const { durationObj } = useDurationStore();
  const decodedId = decodeURIComponent(id || "");
  const configuredBackendId = parseConfiguredStorageId(decodedId);

  const { spans: allSpans, loading: scanLoading, refresh } = useDatabaseTraceScan();
  const [configuredBackend, setConfiguredBackend] = useState<ConfiguredBackend | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  const formatDisplayTime = (timeStr: string) => {
    if (!timeStr) return "";
    try {
      const parts = timeStr.split(" ");
      const [year, month, day] = parts[0].split("-").map(Number);
      const timePart = parts[1] || "0000";
      const hour = parseInt(timePart.slice(0, 2));
      const min = timePart.length >= 4 ? parseInt(timePart.slice(2, 4)) : 0;
      const utcDate = new Date(Date.UTC(year, month - 1, day, hour, min));
      return utcDate.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return timeStr;
    }
  };

  const { data: dbListData } = useQuery(GET_ALL_DATABASES, { variables: { duration: durationObj } });
  const { data: topoData } = useQuery(GET_GLOBAL_TOPOLOGY, { variables: { duration: durationObj } });

  const storageNode = useMemo(
    () => topoData?.getGlobalTopology?.nodes?.find((n: { id: string }) => n.id === decodedId),
    [topoData, decodedId],
  );

  const db = dbListData?.getAllDatabases?.find((d: { id: string }) => d.id === decodedId);
  const endpoint = useMemo(
    () => parseStorageEndpoint(
      configuredBackend?.endpoint || storageNode?.name || db?.name || decodedId,
    ),
    [configuredBackend, storageNode, db, decodedId],
  );
  const storageKind = configuredBackend?.kind || storageNode?.type || "Storage";

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

  const relevantSpans = useMemo(
    () => filterSpansForStorage(allSpans, endpoint.displayName, endpoint.host),
    [allSpans, endpoint],
  );

  const metrics = useMemo(() => computeDbMetrics(relevantSpans), [relevantSpans]);
  const isConfiguredOnly = Boolean(configuredBackend) && !metrics.hasData;
  const slowSql = useMemo(() => buildSlowSqlLeaderboard(relevantSpans), [relevantSpans]);
  const failedQueries = useMemo(() => getFailedDbQueries(relevantSpans), [relevantSpans]);
  const fingerprints = useMemo(() => buildQueryFingerprints(relevantSpans), [relevantSpans]);
  const callingServices = useMemo(() => getCallingServices(relevantSpans), [relevantSpans]);
  const n1Alerts = useMemo(() => detectN1Queries(relevantSpans), [relevantSpans]);
  const latencyTrend = useMemo(() => buildLatencyTrend(relevantSpans), [relevantSpans]);

  const health = metrics.hasData
    ? "ONLINE"
    : configuredBackend
      ? "CONFIGURED"
      : "IDLE";

  const filteredSpans = useMemo(
    () => relevantSpans.filter((span) =>
      span.statement.toLowerCase().includes(searchQuery.toLowerCase()) ||
      span.component.toLowerCase().includes(searchQuery.toLowerCase()) ||
      span.serviceCode.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
    [relevantSpans, searchQuery],
  );

  const primaryCaller = callingServices[0]?.service;

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
              <h1 className="text-lg font-semibold text-foreground truncate" style={{ fontFamily: "Outfit, sans-serif" }} title={endpoint.displayName}>
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
            <Button variant="outline" size="sm" onClick={() => refresh()}>
              <RefreshCw className={`w-3.5 h-3.5 mr-2 ${scanLoading ? "animate-spin" : ""}`} /> Sync
            </Button>
          </div>
        </div>

        <DbMetricsSummary metrics={metrics} loading={scanLoading} />
        <N1DetectorBanner alerts={n1Alerts} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
          <TabsList className="so-tabs">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="queries">Queries ({relevantSpans.length})</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="topology">Infrastructure</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <SlowSqlLeaderboard rows={slowSql} loading={scanLoading} />
              <FailedDbQueriesPanel spans={failedQueries} loading={scanLoading} />
            </div>

            <DbLatencyTrendChart data={latencyTrend} loading={scanLoading} />

            <div className="so-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Latest executions</h3>
                <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => setActiveTab("queries")}>
                  View all
                </Button>
              </div>
              <div className="space-y-2">
                {scanLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)
                ) : relevantSpans.length > 0 ? (
                  relevantSpans.slice(0, 3).map((span) => <DbQueryRow key={span.key} span={span} />)
                ) : (
                  <p className="text-xs text-muted-foreground p-2">
                    {isConfiguredOnly
                      ? "No traced queries yet for this configured backend."
                      : "Waiting for database activity in the selected time range."}
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
                placeholder="Search SQL, service, driver..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card border border-border rounded-lg py-2.5 pl-10 text-sm focus:border-primary/50 outline-none"
              />
            </div>
            <div className="grid gap-2">
              {filteredSpans.map((span) => (
                <DbQueryRow key={span.key} span={span} />
              ))}
              {!scanLoading && filteredSpans.length === 0 && (
                <div className="so-card p-8 text-center text-sm text-muted-foreground">
                  No queries match your filter.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <QueryFingerprintPanel groups={fingerprints} loading={scanLoading} />
              <CallingServicesPanel services={callingServices} loading={scanLoading} />
            </div>
          </TabsContent>

          <TabsContent value="topology" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="so-card p-5 min-w-0">
                <div className="flex items-center justify-between border-b border-border pb-4 mb-5 gap-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2 shrink-0">
                    <Server className="w-4 h-4 text-primary" /> Node specifications
                  </h3>
                  <Badge variant="outline" className="shrink-0 border-primary/30 text-primary bg-primary/5">
                    {health}
                  </Badge>
                </div>
                <div className="space-y-4 text-sm">
                  <InfoItem label="Endpoint" value={endpoint.displayName} fullWidth />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoItem label="Host" value={endpoint.host} />
                    <InfoItem label="Port" value={endpoint.port} />
                    <InfoItem label="Client driver" value={relevantSpans[0]?.component || storageKind} highlight />
                    <InfoItem
                      label="Success rate"
                      value={metrics.hasData ? `${metrics.successRate}%` : "—"}
                      dot={metrics.errorRate > 1 ? "warn" : "primary"}
                    />
                    {configuredBackend?.serviceName && (
                      <InfoItem label="Linked service" value={configuredBackend.serviceName} />
                    )}
                  </div>
                </div>
              </div>

              <CallingServicesPanel services={callingServices} loading={scanLoading} />
            </div>

            {primaryCaller && (
              <div className="so-card p-5">
                <h3 className="text-sm font-semibold mb-4">Primary caller in this window</h3>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{primaryCaller}</span>
                  {" "}issued {callingServices[0]?.count} storage calls with {callingServices[0]?.avgLatency}ms average latency.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function InfoItem({
  label,
  value,
  highlight,
  dot,
  fullWidth,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  dot?: "primary" | "warn";
  fullWidth?: boolean;
}) {
  return (
    <div className={`space-y-1 min-w-0 ${fullWidth ? "col-span-full" : ""}`}>
      <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wide">{label}</p>
      <p
        className={`text-sm font-mono flex items-center gap-2 min-w-0 ${fullWidth ? "break-all" : "truncate"} ${highlight ? "text-primary font-semibold" : "text-foreground"}`}
        title={value}
      >
        {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot === "primary" ? "bg-primary" : "bg-amber-500"}`} />}
        {value}
      </p>
    </div>
  );
}
