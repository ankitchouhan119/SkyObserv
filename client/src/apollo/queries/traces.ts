import { gql } from '@apollo/client';

export const GET_TRACES = gql`
  query queryBasicTraces($condition: TraceQueryCondition!) {
    queryBasicTraces(condition: $condition) {
      traces {
        key
        endpointNames
        duration
        start
        isError
        traceIds
      }
      total
    }
  }
`;

export const GET_TRACE_DETAILS = gql`
  query queryTrace($traceId: ID!) {
    queryTrace(traceId: $traceId) {
      spans {
        traceId
        segmentId
        spanId
        parentSpanId
        refs {
          traceId
          parentSegmentId
          parentSpanId
          type
        }
        serviceCode
        serviceInstanceName
        startTime
        endTime
        endpointName
        type
        peer
        component
        isError
        layer
        tags {
          key
          value
        }
        logs {
          time
          data {
            key
            value
          }
        }
      }
    }
  }
`;
