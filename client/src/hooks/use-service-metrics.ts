import { useQuery } from '@apollo/client';
import { GET_LINEAR_INT_VALUES, GET_SERVICE_METRICS, METRICS } from '@/apollo/queries/metrics';
import { parseExtendedMetrics } from '@/lib/metricsFormat';
import { useDurationStore } from '@/store/useDurationStore';


export function useServiceMetrics(entityId: string, scope: 'Service' | 'Endpoint' = 'Service') {
  const { durationObj } = useDurationStore();

  const extendedQuery = useQuery(GET_SERVICE_METRICS, {
    variables: { serviceId: entityId, duration: durationObj },
    skip: !entityId || scope !== 'Service',
    pollInterval: 30000,
  });

  const extended = parseExtendedMetrics(extendedQuery.data);

  // Metrics name select logic
  const getMetricNames = () => {
    if (scope === 'Endpoint') {
      return {
        latency: 'endpoint_resp_time',
        cpm: 'endpoint_cpm',
        sla: 'endpoint_sla'
      };
    }
    return {
      latency: METRICS.SERVICE_RESP_TIME,
      cpm: METRICS.SERVICE_CPM,
      sla: METRICS.SERVICE_SLA
    };
  };

  const metricNames = getMetricNames();

  const queryOptions = (metricName: string) => ({
    variables: {
      metric: {
        name: metricName,
        id: entityId,
      },
      duration: durationObj,
    },
    skip: !entityId,
    pollInterval: 30000,
  });

  const skipLegacy = !entityId || scope === 'Service';
  const respTimeQuery = useQuery(GET_LINEAR_INT_VALUES, { ...queryOptions(metricNames.latency), skip: skipLegacy });
  const cpmQuery = useQuery(GET_LINEAR_INT_VALUES, { ...queryOptions(metricNames.cpm), skip: skipLegacy });
  const slaQuery = useQuery(GET_LINEAR_INT_VALUES, { ...queryOptions(metricNames.sla), skip: skipLegacy });

  const extractValues = (data: any) => data?.getLinearIntValues?.values || [];

  const latencyData = scope === 'Service'
    ? (extendedQuery.data?.getServiceLatency?.values ?? [])
    : extractValues(respTimeQuery.data);
  const throughputData = scope === 'Service'
    ? (extendedQuery.data?.getServiceThroughput?.values ?? [])
    : extractValues(cpmQuery.data);
  const slaData = scope === 'Service'
    ? (extendedQuery.data?.getServiceSLA?.values ?? []).map((v: { value: number }) => ({
        ...v,
        value: v.value / 100,
      }))
    : extractValues(slaQuery.data).map((v: { value: number }) => ({ ...v, value: v.value / 100 }));

  const loading = scope === 'Service'
    ? extendedQuery.loading
    : respTimeQuery.loading || cpmQuery.loading || slaQuery.loading;

  return {
    latency: { data: latencyData, loading },
    throughput: { data: throughputData, loading },
    sla: { data: slaData, loading },
    apdex: extended.apdex,
    errorRate: extended.errorRate,
    p50: extended.p50,
    p95: extended.p95,
    p99: extended.p99,
    extendedLoading: scope === 'Service' ? extendedQuery.loading : loading,
  };
}