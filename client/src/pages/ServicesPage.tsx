"use client";

import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ALL_SERVICES } from '@/apollo/queries/services';
import { GET_GLOBAL_TOPOLOGY } from '@/apollo/queries/topology';
import { GET_ALL_DATABASES } from '@/apollo/queries/database';
import { useDurationStore } from '@/store/useDurationStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Search, Server, Activity, Database, AlertTriangle } from 'lucide-react';
import { ServiceOverviewCard } from '@/components/services/ServiceOverviewCard';
import { FailedTracesPanel } from '@/components/services/FailedTracesPanel';
import { SlowEndpointsLeaderboard } from '@/components/services/SlowEndpointsLeaderboard';

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
  });

  const { data: topologyData } = useQuery(GET_GLOBAL_TOPOLOGY, {
    variables: { duration: durationObj },
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
  const healthyCount = realServices.filter((s: ServiceRow) => s.normal === true).length;
  const unhealthyCount = realServices.filter((s: ServiceRow) => s.normal === false).length;

  const stats: Record<string, number | string> = {
    services: servicesLoading ? '—' : realServices.length,
    databases: databases.length,
    healthy: servicesLoading ? '—' : healthyCount,
    unhealthy: servicesLoading ? '—' : unhealthyCount,
  };

  const filteredServices = realServices.filter((s: ServiceRow) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.group?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AppLayout>
      <div className="so-page">
        <h2 className="text-lg font-semibold font-[family-name:var(--font-outfit)]">Overview</h2>

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

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <FailedTracesPanel />
          <SlowEndpointsLeaderboard
            services={realServices.map((s: ServiceRow) => ({ id: s.id, name: s.name }))}
          />
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
          {filteredServices.map((service: ServiceRow) => (
            <ServiceOverviewCard
              key={service.id}
              id={service.id}
              name={service.name}
              shortName={service.shortName}
              group={service.group}
              layers={service.layers}
              normal={service.normal}
            />
          ))}
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
