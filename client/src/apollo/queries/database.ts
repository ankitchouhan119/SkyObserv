import { gql } from '@apollo/client';

export const GET_ALL_DATABASES = gql`
  query getAllDatabases($duration: Duration!) {
    getAllDatabases(duration: $duration) {
      id
      name
    }
  }
`;

export const GET_DATABASE_METRICS = gql`
  query getDatabaseMetrics($id: String!, $duration: Duration!) {
    latency: readMetricsValue(condition: {name: "database_access_resp_time", entity: {scope: Service, serviceName: $id}}, duration: $duration)
    cpm: readMetricsValue(condition: {name: "database_access_cpm", entity: {scope: Service, serviceName: $id}}, duration: $duration)
    sla: readMetricsValue(condition: {name: "database_access_sla", entity: {scope: Service, serviceName: $id}}, duration: $duration)
  }
`;

export const GET_TRACES_FOR_DB = gql`
  query queryBasicTraces($condition: TraceQueryCondition!) {
    queryBasicTraces(condition: $condition) {
      traces {
        key: segmentId
        endpointNames
        duration
        start
        isError
        traceIds
      }
    }
  }
`;

export const GET_TRACE_DETAILS = gql`
  query queryTrace($traceId: ID!) {
    queryTrace(traceId: $traceId) {
      spans {
        spanId
        startTime
        endTime
        endpointName
        type
        peer
        component
        layer
        isError
        tags {
          key
          value
        }
      }
    }
  }
`;