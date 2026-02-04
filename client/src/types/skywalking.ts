export interface Duration {
  start: string;
  end: string;
  step: "MINUTE" | "HOUR" | "DAY";
}

export interface MetricValue {
  id: string; // Time bucket string
  value: number;
}

export interface MetricResponse {
  values: MetricValue[];
}

export interface Trace {
  key: string;
  endpointNames: string[];
  duration: number;
  start: string;
  isError: boolean;
  traceIds: string[];
}

export interface Span {
  traceId: string;
  segmentId: string;
  spanId: number;
  parentSpanId: number;
  serviceCode: string;
  serviceInstanceName: string;
  startTime: number;
  endTime: number;
  endpointName: string;
  type: string;
  peer: string;
  component: string;
  isError: boolean;
  layer: string;
  tags: Array<{ key: string; value: string }>;
  logs: Array<{ time: number; data: Array<{ key: string; value: string }> }>;
}
