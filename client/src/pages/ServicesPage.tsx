"use client";

import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ALL_SERVICES } from '@/apollo/queries/services';
import { GET_GLOBAL_TOPOLOGY } from '@/apollo/queries/topology';
import { GET_ALL_DATABASES } from '@/apollo/queries/database';
import { useDurationStore } from '@/store/useDurationStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Link } from 'wouter';
import { Search, Server, Activity, Zap, Database, AlertTriangle } from 'lucide-react';

const statCards = [
  { key: 'services', label: 'Services', icon: Server, wrap: 'bg-blue-50 text-blue-600' },
  { key: 'databases', label: 'Databases', icon: Database, wrap: 'bg-violet-50 text-violet-600' },
  { key: 'healthy', label: 'Healthy', icon: Activity, wrap: 'bg-sky-50 text-sky-600' },
  { key: 'unhealthy', label: 'Unhealthy', icon: AlertTriangle, wrap: 'bg-red-50 text-red-600' },
] as const;

type ServiceRow = {
  id: string;
  name: string;
  shortName?: string;
  group?: string;
  layers?: string[];
  normal?: boolean;
};

function mergeTopologyServices(
  services: ServiceRow[],
  topologyNodes: Array<{
    id?: string;
    name?: string;
    type?: string;
    isReal?: boolean;
    layers?: string[];
  }>,
): ServiceRow[] {
  const byName = new Map(services.map((service) => [service.name, service]));

  for (const node of topologyNodes) {
    if (!node.isReal || !node.name || !node.id) continue;
    if (byName.has(node.name)) continue;

    const isBrowser =
      node.type === "USER" ||
      /web|frontend|browser/i.test(node.name);

    byName.set(node.name, {
      id: node.id,
      name: node.name,
      shortName: node.name,
      group: isBrowser ? "Browser" : node.type || "General",
      layers: node.layers?.length ? node.layers : ["GENERAL"],
      normal: true,
    });
  }

  return Array.from(byName.values());
}

export default function ServicesPage() {
  const { durationObj } = useDurationStore();
  const [search, setSearch] = useState('');

  const { data: servicesData, loading: servicesLoading } = useQuery(GET_ALL_SERVICES, {
    variables: { duration: durationObj },
    pollInterval: 60000,
  });

  const { data: topologyData } = useQuery(GET_GLOBAL_TOPOLOGY, {
    variables: { duration: durationObj },
    pollInterval: 60000,
  });

  const { data: dbData } = useQuery(GET_ALL_DATABASES, {
    variables: { duration: durationObj },
  });

  const realServices = mergeTopologyServices(
    (servicesData?.getAllServices || []).filter((s: ServiceRow) => {
      const isDb = s.layers?.some((l: string) => l.includes('DATABASE') || l.includes('CACHE'));
      return !isDb;
    }),
    topologyData?.getGlobalTopology?.nodes ?? [],
  );

  const databases = dbData?.getAllDatabases || [];
  const healthyCount = realServices.filter((s: any) => s.normal === true).length;
  const unhealthyCount = realServices.length - healthyCount;

  const stats: Record<string, number | string> = {
    services: servicesLoading ? '—' : realServices.length,
    databases: databases.length,
    healthy: servicesLoading ? '—' : healthyCount,
    unhealthy: servicesLoading ? '—' : unhealthyCount,
  };

  const filteredServices = realServices.filter((s: any) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.group?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AppLayout>
      <div className="space-y-5 max-w-7xl mx-auto">
        <div>
          <h2 className="text-lg font-semibold font-[family-name:var(--font-outfit)]">Overview</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor service health and performance across your stack.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map(({ key, label, icon: Icon, wrap }) => (
            <div key={key} className="so-kpi">
              <div className={`so-icon-wrap ${wrap}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <p
                  className={`text-2xl font-semibold tabular-nums tracking-tight ${
                    key === 'unhealthy' && Number(stats[key]) > 0
                      ? 'text-destructive'
                      : key === 'healthy'
                        ? 'text-primary'
                        : 'text-foreground'
                  }`}
                >
                  {stats[key]}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 bg-card"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredServices.map((service: any) => {
            const isNormal = service.normal === true;

            return (
              <Link key={service.id} href={`/services/${service.id}`}>
                <div className="so-card-hover p-4 h-full">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="so-icon-wrap bg-primary/10 text-primary">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground">
                      {service.group || 'General'}
                    </span>
                  </div>

                  <h3 className="text-[15px] font-semibold mb-4 group-hover:text-primary transition-colors truncate">
                    {service.shortName || service.name}
                  </h3>

                  <div className="flex items-center justify-between pt-3 border-t border-border text-xs">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Layers</p>
                      <p className="font-medium truncate">{(service.layers || []).join(', ') || '—'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Status</p>
                      <div className={`inline-flex items-center gap-1.5 font-medium ${isNormal ? 'so-status-ok' : 'so-status-bad'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isNormal ? 'bg-primary' : 'bg-destructive'}`} />
                        {isNormal ? 'Normal' : 'Abnormal'}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {!servicesLoading && filteredServices.length === 0 && (
          <div className="so-card p-12 text-center text-muted-foreground text-sm">
            No services found. Adjust your search or register a service from Profile.
          </div>
        )}
      </div>
    </AppLayout>
  );
}
