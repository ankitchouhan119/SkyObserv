"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { useLocation } from "wouter";
import { GET_ALL_DATABASES } from "@/apollo/queries/database";
import { GET_GLOBAL_TOPOLOGY } from "@/apollo/queries/topology";
import { useDurationStore } from "@/store/useDurationStore";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddStorageBackendDialog } from "@/components/storage/AddStorageBackendDialog";
import { Database, Search, AlertCircle, ExternalLink, HardDrive, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDatabaseTraceScan } from "@/hooks/use-database-trace-scan";
import {
  buildSlowSqlLeaderboard,
  computeDbMetrics,
  filterSpansForStorage,
  getFailedDbQueries,
} from "@/lib/dbTraceAnalysis";
import { storageEndpointKey } from "@/lib/storageKeys";
import { SlowSqlLeaderboard } from "@/components/databases/SlowSqlLeaderboard";
import { FailedDbQueriesPanel } from "@/components/databases/FailedDbQueriesPanel";

const STORAGE_TYPES = new Set([
  "Redis",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Mariadb",
  "ElasticSearch",
  "Memcached",
  "H2",
  "Oracle",
]);

type StorageItem = {
  id: string;
  name: string;
  kind: string;
  source: "oap" | "topology" | "configured";
  traced: boolean;
};

type ConfiguredBackend = {
  id: string;
  name: string;
  kind: string;
  endpoint: string;
  source: "configured";
  traced: false;
};

export default function DatabasesPage() {
  const [, setLocation] = useLocation();
  const { durationObj } = useDurationStore();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [configuredBackends, setConfiguredBackends] = useState<ConfiguredBackend[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [serviceNames, setServiceNames] = useState<string[]>([]);

  const { spans, loading: scanLoading, error: scanError, refresh } = useDatabaseTraceScan();

  const { data, loading, error, refetch } = useQuery(GET_ALL_DATABASES, {
    variables: { duration: durationObj },
    fetchPolicy: "network-only",
  });

  const { data: topoData, loading: topoLoading } = useQuery(GET_GLOBAL_TOPOLOGY, {
    variables: { duration: durationObj },
    fetchPolicy: "network-only",
  });

  function loadConfiguredBackends() {
    if (!user) {
      setConfiguredBackends([]);
      return;
    }

    fetch("/api/storage-backends", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { backends: [] }))
      .then((payload) => setConfiguredBackends(payload.backends ?? []))
      .catch(() => setConfiguredBackends([]));
  }

  useEffect(() => {
    loadConfiguredBackends();
  }, [user?.apiToken]);

  useEffect(() => {
    if (!user?.canManageTeam) return;
    fetch("/api/profile/services", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { services: [] }))
      .then((payload) => setServiceNames((payload.services ?? []).map((s: { serviceName: string }) => s.serviceName)));
  }, [user?.canManageTeam]);

  const storageItems = useMemo(() => {
    const byKey = new Map<string, StorageItem>();

    for (const db of data?.getAllDatabases ?? []) {
      byKey.set(storageEndpointKey(db.name), {
        id: db.id,
        name: db.name,
        kind: "Database",
        source: "oap",
        traced: true,
      });
    }

    for (const node of topoData?.getGlobalTopology?.nodes ?? []) {
      if (node.isReal) continue;
      if (!node.type || !STORAGE_TYPES.has(node.type)) continue;
      const key = storageEndpointKey(node.name || node.id);
      if (!key || byKey.has(key)) continue;
      byKey.set(key, {
        id: node.id || node.name,
        name: node.name,
        kind: node.type,
        source: "topology",
        traced: true,
      });
    }

    for (const backend of configuredBackends) {
      const key = storageEndpointKey(backend.endpoint);
      if (byKey.has(key)) continue;
      byKey.set(key, {
        id: backend.id,
        name: backend.name,
        kind: backend.kind,
        source: "configured",
        traced: false,
      });
    }

    return Array.from(byKey.values());
  }, [data, topoData, configuredBackends]);

  const metricsByItem = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeDbMetrics>>();
    for (const item of storageItems) {
      const itemSpans = filterSpansForStorage(spans, item.name);
      map.set(item.id, computeDbMetrics(itemSpans));
    }
    return map;
  }, [storageItems, spans]);

  const globalSlowSql = useMemo(() => buildSlowSqlLeaderboard(spans, 5), [spans]);
  const globalFailed = useMemo(() => getFailedDbQueries(spans, 5), [spans]);

  const filtered = storageItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.kind.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const isLoading = loading || topoLoading;
  const canConfigure = user?.canManageTeam !== false;

  return (
    <AppLayout>
      <div className="so-page">
        <div className="so-page-header">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2>Storage</h2>
              <p>
                Databases and cache backends from traces and your profile configuration.
                {" "}
                <span className="text-primary font-semibold">{filtered.length}</span> found.
              </p>
            </div>
            {canConfigure && (
              <Button onClick={() => setAddOpen(true)} className="shrink-0">
                <Plus className="w-4 h-4 mr-2" />
                Add PostgreSQL / DB
              </Button>
            )}
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Filter by name or type..."
            className="pl-9 h-10 bg-card"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {!isLoading && spans.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <SlowSqlLeaderboard rows={globalSlowSql} loading={scanLoading} />
            <FailedDbQueriesPanel spans={globalFailed} loading={scanLoading} />
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-52 so-card animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="py-16 flex flex-col items-center justify-center so-card gap-4">
            <AlertCircle className="w-10 h-10 text-destructive opacity-50" />
            <div className="text-center">
              <h3 className="text-base font-semibold text-foreground">Telemetry offline</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">Unable to reach the OAP telemetry server.</p>
            </div>
            <button
              onClick={() => refetch()}
              className="px-5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Retry connection
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="so-card p-8 text-center space-y-3">
            <HardDrive className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
            <h3 className="font-semibold text-foreground">No storage backends detected yet</h3>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Redis appears automatically from traces. PostgreSQL via Prisma is not auto-instrumented —
              add it manually with your DATABASE_URL.
            </p>
            {canConfigure && (
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add PostgreSQL
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((item) => {
              const metrics = metricsByItem.get(item.id) ?? computeDbMetrics([]);
              const hasTraceData = metrics.hasData;

              return (
                <div key={item.id} className="so-card-hover flex flex-col overflow-hidden">
                  <div className="p-5 space-y-4 flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <div className={`so-icon-wrap ${item.kind === "Redis" ? "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400" : "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"}`}>
                        <Database className="w-4 h-4" />
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${
                        item.source === "configured"
                          ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                          : hasTraceData
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                            : "bg-primary/10 text-primary border-primary/20"
                      }`}>
                        {item.source === "configured" ? "Configured" : hasTraceData ? "Active" : item.source === "topology" ? "Detected" : "Database"}
                      </span>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1">{item.kind}</p>
                      <h3 className="text-[15px] font-semibold text-foreground break-all">{item.name}</h3>
                    </div>

                    {scanLoading ? (
                      <div className="grid grid-cols-2 gap-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
                        ))}
                      </div>
                    ) : hasTraceData ? (
                      <div className="grid grid-cols-2 gap-2">
                        <MetricPill label="Avg" value={`${metrics.avgLatency}ms`} />
                        <MetricPill label="P95" value={`${metrics.p95Latency}ms`} />
                        <MetricPill label="Ops" value={String(metrics.ops)} />
                        <MetricPill
                          label="Success"
                          value={`${metrics.successRate}%`}
                          warn={metrics.errorRate > 0}
                        />
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">
                        {item.source === "configured"
                          ? "Linked in profile — waiting for traced queries."
                          : "No traced activity in the selected window."}
                      </p>
                    )}
                  </div>

                  <div className="p-3 border-t border-border bg-muted/30">
                    <button
                      onClick={() => setLocation(`/databases/${encodeURIComponent(item.id)}`)}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                    >
                      View details
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {scanError && (
          <p className="text-xs text-muted-foreground">
            Trace scan warning: {scanError}.{" "}
            <button type="button" className="text-primary hover:underline" onClick={() => refresh()}>
              Retry scan
            </button>
          </p>
        )}
      </div>

      <AddStorageBackendDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdded={loadConfiguredBackends}
        serviceNames={serviceNames}
        defaultKind="PostgreSQL"
      />
    </AppLayout>
  );
}

function MetricPill({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className={`rounded-lg border px-2.5 py-2 ${warn ? "border-red-500/15 bg-red-500/[0.04]" : "border-border/60 bg-muted/20"}`}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold tabular-nums ${warn ? "text-red-500" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
