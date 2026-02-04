import { useQuery } from '@apollo/client';
import { GET_LINEAR_INT_VALUES, METRICS } from '@/apollo/queries/metrics';
import { useDurationStore } from '@/store/useDurationStore';
import type { MetricResponse } from '@/types/skywalking';

export function useServiceMetrics(serviceId: string) {
  const { durationObj } = useDurationStore();
  const duration = durationObj;

  // 1. Response Time (Latency)
  const respTimeQuery = useQuery(GET_LINEAR_INT_VALUES, {
    variables: {
      metric: {
        name: METRICS.SERVICE_RESP_TIME,
        id: serviceId,
      },
      duration,
    },
    pollInterval: 30000,
  });

  // 2. Throughput (CPM)
  const cpmQuery = useQuery(GET_LINEAR_INT_VALUES, {
    variables: {
      metric: {
        name: METRICS.SERVICE_CPM,
        id: serviceId,
      },
      duration,
    },
    pollInterval: 30000,
  });

  // 3. SLA (Success Rate)
  const slaQuery = useQuery(GET_LINEAR_INT_VALUES, {
    variables: {
      metric: {
        name: METRICS.SERVICE_SLA,
        id: serviceId,
      },
      duration,
    },
    pollInterval: 30000,
  });

  const extractValues = (data: any): { id: string; value: number }[] => {
    return data?.getLinearIntValues?.values || [];
  };

  return {
    latency: {
      data: extractValues(respTimeQuery.data),
      loading: respTimeQuery.loading,
      error: respTimeQuery.error,
    },
    throughput: {
      data: extractValues(cpmQuery.data),
      loading: cpmQuery.loading,
      error: cpmQuery.error,
    },
    sla: {
      data: extractValues(slaQuery.data).map(v => ({ ...v, value: v.value / 100 })), // Convert to percentage if needed
      loading: slaQuery.loading,
      error: slaQuery.error,
    }
  };
}
