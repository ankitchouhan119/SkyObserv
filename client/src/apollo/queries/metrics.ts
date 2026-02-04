import { gql } from '@apollo/client';

export const GET_LINEAR_INT_VALUES = gql`
  query getLinearIntValues($metric: MetricCondition!, $duration: Duration!) {
    getLinearIntValues(metric: $metric, duration: $duration) {
      values {
        id
        value
      }
    }
  }
`;

// Commonly used metric names in SkyWalking
export const METRICS = {
  SERVICE_RESP_TIME: 'service_resp_time',
  SERVICE_SLA: 'service_sla',
  SERVICE_CPM: 'service_cpm',
  SERVICE_APDEX: 'service_apdex'
};
