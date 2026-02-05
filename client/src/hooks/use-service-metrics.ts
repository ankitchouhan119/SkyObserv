import { useQuery } from '@apollo/client';
import { GET_LINEAR_INT_VALUES, METRICS } from '@/apollo/queries/metrics';
import { useDurationStore } from '@/store/useDurationStore';

// Scope parameter add kiya taaki Endpoint page par bhi kaam kare
export function useServiceMetrics(entityId: string, scope: 'Service' | 'Endpoint' = 'Service') {
  const { durationObj } = useDurationStore();

  // Metrics name select karne ka logic
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

  const respTimeQuery = useQuery(GET_LINEAR_INT_VALUES, queryOptions(metricNames.latency));
  const cpmQuery = useQuery(GET_LINEAR_INT_VALUES, queryOptions(metricNames.cpm));
  const slaQuery = useQuery(GET_LINEAR_INT_VALUES, queryOptions(metricNames.sla));

  const extractValues = (data: any) => data?.getLinearIntValues?.values || [];

  return {
    latency: {
      data: extractValues(respTimeQuery.data),
      loading: respTimeQuery.loading,
    },
    throughput: {
      data: extractValues(cpmQuery.data),
      loading: cpmQuery.loading,
    },
    sla: {
      data: extractValues(slaQuery.data).map((v: any) => ({ ...v, value: v.value / 100 })),
      loading: slaQuery.loading,
    }
  };
}