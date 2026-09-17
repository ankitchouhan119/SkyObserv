import { useEffect, useState } from "react";
import { useApolloClient } from "@apollo/client";
import { GET_LINEAR_INT_VALUES } from "@/apollo/queries/metrics";
import { GET_SERVICE_ENDPOINTS } from "@/apollo/queries/services";
import { useDurationStore } from "@/store/useDurationStore";
import { averageMetric } from "@/lib/serviceHealth";

export type SlowEndpointRow = {
  rank: number;
  serviceId: string;
  serviceName: string;
  endpointId: string;
  endpointName: string;
  latencyMs: number;
};

type ServiceRef = { id: string; name: string };

export function useSlowEndpoints(services: ServiceRef[], limit = 5) {
  const client = useApolloClient();
  const { durationObj } = useDurationStore();
  const [items, setItems] = useState<SlowEndpointRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (services.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const candidates: Omit<SlowEndpointRow, "rank">[] = [];

      try {
        for (const service of services.slice(0, 8)) {
          const { data } = await client.query({
            query: GET_SERVICE_ENDPOINTS,
            variables: { serviceId: service.id, keyword: "" },
          });

          const endpoints = data?.endpoints ?? [];
          await Promise.all(
            endpoints.slice(0, 10).map(async (endpoint: { id: string; name: string }) => {
              try {
                const metricRes = await client.query({
                  query: GET_LINEAR_INT_VALUES,
                  variables: {
                    metric: { name: "endpoint_resp_time", id: endpoint.id },
                    duration: durationObj,
                  },
                });
                const values = metricRes.data?.getLinearIntValues?.values ?? [];
                const latencyMs = Math.round(averageMetric(values));
                if (latencyMs <= 0) return;

                candidates.push({
                  serviceId: service.id,
                  serviceName: service.name,
                  endpointId: endpoint.id,
                  endpointName: endpoint.name,
                  latencyMs,
                });
              } catch {
                // skip endpoints that fail to load
              }
            }),
          );
        }

        if (!cancelled) {
          setItems(
            candidates
              .sort((a, b) => b.latencyMs - a.latencyMs)
              .slice(0, limit)
              .map((row, index) => ({ ...row, rank: index + 1 })),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [client, services, durationObj, limit]);

  return { items, loading };
}
