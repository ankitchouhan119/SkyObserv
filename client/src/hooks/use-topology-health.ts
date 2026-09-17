import { useEffect, useState } from "react";
import { useApolloClient } from "@apollo/client";
import { GET_SERVICE_METRICS } from "@/apollo/queries/metrics";
import { useDurationStore } from "@/store/useDurationStore";
import { parseExtendedMetrics } from "@/lib/metricsFormat";
import { resolveServiceHealth, type ServiceHealthStatus } from "@/lib/serviceHealth";

export type TopologyHealthEntry = {
  status: ServiceHealthStatus | "external";
  label: string;
};

type ServiceRef = {
  id: string;
  name: string;
  normal?: boolean;
};

export function useTopologyHealth(services: ServiceRef[]) {
  const client = useApolloClient();
  const { durationObj } = useDurationStore();
  const [healthMap, setHealthMap] = useState<Map<string, TopologyHealthEntry>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (services.length === 0) {
        setHealthMap(new Map());
        setLoading(false);
        return;
      }

      setLoading(true);
      const next = new Map<string, TopologyHealthEntry>();

      await Promise.all(
        services.map(async (service) => {
          try {
            const { data } = await client.query({
              query: GET_SERVICE_METRICS,
              variables: { serviceId: service.id, duration: durationObj },
            });
            const metrics = parseExtendedMetrics(data);
            const health = resolveServiceHealth(
              service.normal,
              metrics.latency,
              metrics.throughput,
              metrics.sla,
            );

            const entry: TopologyHealthEntry = {
              status: health.status,
              label: health.label,
            };
            next.set(service.id, entry);
            next.set(service.name, entry);
          } catch {
            next.set(service.id, { status: "degraded", label: "Unknown" });
            next.set(service.name, { status: "degraded", label: "Unknown" });
          }
        }),
      );

      if (!cancelled) {
        setHealthMap(next);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [client, services, durationObj]);

  return { healthMap, loading };
}

export function getTopologyNodeColors(
  health: TopologyHealthEntry | undefined,
  isReal: boolean,
) {
  if (!isReal) {
    return {
      color: "#64748B",
      glow: "rgba(100, 116, 139, 0.35)",
      ring: "rgba(148, 163, 184, 0.4)",
      label: "External",
    };
  }

  switch (health?.status) {
    case "critical":
      return {
        color: "#EF4444",
        glow: "rgba(239, 68, 68, 0.5)",
        ring: "rgba(248, 113, 113, 0.55)",
        label: health.label,
      };
    case "degraded":
      return {
        color: "#F59E0B",
        glow: "rgba(245, 158, 11, 0.48)",
        ring: "rgba(251, 191, 36, 0.5)",
        label: health.label,
      };
    case "healthy":
    default:
      return {
        color: "#10B981",
        glow: "rgba(16, 185, 129, 0.45)",
        ring: "rgba(52, 211, 153, 0.5)",
        label: health?.label ?? "Healthy",
      };
  }
}
