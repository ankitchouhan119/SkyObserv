import { useQuery } from "@apollo/client";
import { GET_SERVICE_METRICS } from "@/apollo/queries/metrics";
import { GET_SERVICE_ENDPOINTS, GET_SERVICE_INSTANCES } from "@/apollo/queries/services";
import { resolveServiceHealth } from "@/lib/serviceHealth";
import { parseExtendedMetrics } from "@/lib/metricsFormat";
import { useDurationStore } from "@/store/useDurationStore";

export function useServiceOverview(serviceId: string, normal?: boolean) {
  const { durationObj } = useDurationStore();

  const metricsQuery = useQuery(GET_SERVICE_METRICS, {
    variables: { serviceId, duration: durationObj },
    skip: !serviceId,
  });

  const instancesQuery = useQuery(GET_SERVICE_INSTANCES, {
    variables: { serviceId, duration: durationObj },
    skip: !serviceId,
  });

  const endpointsQuery = useQuery(GET_SERVICE_ENDPOINTS, {
    variables: { serviceId, keyword: "" },
    skip: !serviceId,
  });

  const metrics = parseExtendedMetrics(metricsQuery.data);
  const { latency, throughput, sla, apdex, errorRate, p95, p99 } = metrics;

  const instances = instancesQuery.data?.getServiceInstances ?? [];
  const endpoints = endpointsQuery.data?.endpoints ?? [];

  const health = resolveServiceHealth(normal, latency, throughput, sla);

  const loading =
    metricsQuery.loading || instancesQuery.loading || endpointsQuery.loading;

  return {
    latency,
    throughput,
    sla,
    apdex,
    errorRate,
    p95,
    p99,
    instanceCount: instances.length,
    endpointCount: endpoints.length,
    health,
    loading,
  };
}
