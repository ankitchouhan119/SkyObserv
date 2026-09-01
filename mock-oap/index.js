const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function timeSeriesValues(count = 60, min, max) {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i),
    value: randomBetween(min, max),
  }));
}

function makeTraceId() {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

function makeSegmentId() {
  return `${Date.now()}.${randomBetween(100, 999)}.${randomBetween(10000, 99999)}`;
}

// ─── Static Data (travobuds ecosystem) ────────────────────────────────────────

const SERVICES = [
  { id: 'travobuds-frontend', name: 'travobuds-frontend', group: 'travobuds', shortName: 'frontend', layers: ['GENERAL'], normal: true },
  { id: 'travobuds-api',      name: 'travobuds-api',      group: 'travobuds', shortName: 'api',      layers: ['GENERAL'], normal: true },
  { id: 'travobuds-auth',     name: 'travobuds-auth',     group: 'travobuds', shortName: 'auth',     layers: ['GENERAL'], normal: true },
  { id: 'travobuds-booking',  name: 'travobuds-booking',  group: 'travobuds', shortName: 'booking',  layers: ['GENERAL'], normal: true },
  { id: 'travobuds-payment',  name: 'travobuds-payment',  group: 'travobuds', shortName: 'payment',  layers: ['GENERAL'], normal: true },
  { id: 'travobuds-notify',   name: 'travobuds-notify',   group: 'travobuds', shortName: 'notify',   layers: ['GENERAL'], normal: true },
  { id: 'postgresql',         name: 'postgresql',         group: '',          shortName: 'pg',        layers: ['VIRTUAL_DATABASE'], normal: false },
  { id: 'redis-cache',        name: 'redis-cache',        group: '',          shortName: 'redis',     layers: ['VIRTUAL_CACHE'],    normal: false },
];

const DATABASES = [
  { id: 'postgresql', name: 'postgresql' },
  { id: 'redis-cache', name: 'redis-cache' },
];

const SERVICE_INSTANCES = {
  'travobuds-frontend': [
    { id: 'frontend-1', name: 'frontend-pod-1@10.0.0.1', instanceUUID: 'uuid-fe-1', language: 'NodeJS', attributes: [{ name: 'pod', value: 'frontend-pod-1' }] },
    { id: 'frontend-2', name: 'frontend-pod-2@10.0.0.2', instanceUUID: 'uuid-fe-2', language: 'NodeJS', attributes: [{ name: 'pod', value: 'frontend-pod-2' }] },
  ],
  'travobuds-api': [
    { id: 'api-1', name: 'api-pod-1@10.0.1.1', instanceUUID: 'uuid-api-1', language: 'Java', attributes: [{ name: 'pod', value: 'api-pod-1' }] },
    { id: 'api-2', name: 'api-pod-2@10.0.1.2', instanceUUID: 'uuid-api-2', language: 'Java', attributes: [{ name: 'pod', value: 'api-pod-2' }] },
  ],
  'travobuds-auth': [
    { id: 'auth-1', name: 'auth-pod-1@10.0.2.1', instanceUUID: 'uuid-auth-1', language: 'NodeJS', attributes: [{ name: 'pod', value: 'auth-pod-1' }] },
  ],
  'travobuds-booking': [
    { id: 'booking-1', name: 'booking-pod-1@10.0.3.1', instanceUUID: 'uuid-bk-1', language: 'Java', attributes: [{ name: 'pod', value: 'booking-pod-1' }] },
    { id: 'booking-2', name: 'booking-pod-2@10.0.3.2', instanceUUID: 'uuid-bk-2', language: 'Java', attributes: [{ name: 'pod', value: 'booking-pod-2' }] },
  ],
  'travobuds-payment': [
    { id: 'payment-1', name: 'payment-pod-1@10.0.4.1', instanceUUID: 'uuid-pay-1', language: 'Java', attributes: [{ name: 'pod', value: 'payment-pod-1' }] },
  ],
  'travobuds-notify': [
    { id: 'notify-1', name: 'notify-pod-1@10.0.5.1', instanceUUID: 'uuid-nt-1', language: 'NodeJS', attributes: [{ name: 'pod', value: 'notify-pod-1' }] },
  ],
};

const ENDPOINTS = {
  'travobuds-frontend': [
    { id: 'ep-fe-1', name: 'GET:/search' },
    { id: 'ep-fe-2', name: 'GET:/hotel/{id}' },
    { id: 'ep-fe-3', name: 'POST:/checkout' },
  ],
  'travobuds-api': [
    { id: 'ep-api-1', name: 'GET:/api/v1/hotels' },
    { id: 'ep-api-2', name: 'GET:/api/v1/hotels/{id}' },
    { id: 'ep-api-3', name: 'POST:/api/v1/bookings' },
    { id: 'ep-api-4', name: 'GET:/api/v1/bookings/{id}' },
    { id: 'ep-api-5', name: 'POST:/api/v1/auth/login' },
  ],
  'travobuds-auth': [
    { id: 'ep-auth-1', name: 'POST:/auth/login' },
    { id: 'ep-auth-2', name: 'POST:/auth/refresh' },
    { id: 'ep-auth-3', name: 'POST:/auth/logout' },
  ],
  'travobuds-booking': [
    { id: 'ep-bk-1', name: 'POST:/booking/create' },
    { id: 'ep-bk-2', name: 'GET:/booking/{id}' },
    { id: 'ep-bk-3', name: 'PUT:/booking/{id}/cancel' },
  ],
  'travobuds-payment': [
    { id: 'ep-pay-1', name: 'POST:/payment/initiate' },
    { id: 'ep-pay-2', name: 'POST:/payment/confirm' },
    { id: 'ep-pay-3', name: 'GET:/payment/status/{id}' },
  ],
  'travobuds-notify': [
    { id: 'ep-nt-1', name: 'POST:/notify/email' },
    { id: 'ep-nt-2', name: 'POST:/notify/sms' },
  ],
};

// ─── GraphQL Schema ───────────────────────────────────────────────────────────

const schema = buildSchema(`
  type KeyValue {
    key: String
    value: String
  }

  type Attribute {
    name: String
    value: String
  }

  type Service {
    id: ID
    name: String
    group: String
    shortName: String
    layers: [String]
    normal: Boolean
  }

  type Database {
    id: ID
    name: String
  }

  type ServiceInstance {
    id: ID
    name: String
    instanceUUID: String
    language: String
    attributes: [Attribute]
  }

  type Endpoint {
    id: ID
    name: String
  }

  type MetricValue {
    id: String
    value: Int
  }

  type MetricValues {
    values: [MetricValue]
  }

  type TopologyNode {
    id: ID
    name: String
    type: String
    isReal: Boolean
    layers: [String]
  }

  type TopologyCall {
    id: ID
    source: String
    target: String
    detectPoints: [String]
  }

  type Topology {
    nodes: [TopologyNode]
    calls: [TopologyCall]
  }

  type Trace {
    segmentId: String
    key: String
    endpointNames: [String]
    duration: Int
    start: String
    isError: Boolean
    traceIds: [String]
  }

  type TraceList {
    traces: [Trace]
  }

  type SpanRef {
    traceId: String
    parentSegmentId: String
    parentSpanId: Int
    type: String
  }

  type Span {
    traceId: String
    segmentId: String
    spanId: Int
    parentSpanId: Int
    refs: [SpanRef]
    serviceCode: String
    serviceInstanceName: String
    startTime: Float
    endTime: Float
    endpointName: String
    type: String
    peer: String
    component: String
    isError: Boolean
    layer: String
    tags: [KeyValue]
    logs: [SpanLog]
  }

  type SpanLog {
    time: Float
    data: [KeyValue]
  }

  type TraceDetail {
    spans: [Span]
  }

  input Duration {
    start: String
    end: String
    step: String
  }

  input MetricCondition {
    name: String
    id: String
  }

  input MetricEntity {
    scope: String
    serviceName: String
  }

  input MetricValueCondition {
    name: String
    entity: MetricEntity
  }

  input TraceQueryCondition {
    serviceId: String
    traceId: String
    endpointId: String
    minTraceDuration: Int
    maxTraceDuration: Int
    queryDuration: Duration
    pageNum: Int
    pageSize: Int
    queryOrder: String
  }

  type Query {
    getAllServices(duration: Duration!): [Service]
    getAllDatabases(duration: Duration!): [Database]
    getServiceInstances(serviceId: ID!, duration: Duration!): [ServiceInstance]
    findEndpoint(serviceId: ID!, keyword: String!, limit: Int): [Endpoint]
    getLinearIntValues(metric: MetricCondition!, duration: Duration!): MetricValues
    getServiceMetrics(serviceId: ID!, duration: Duration!): MetricValues
    getGlobalTopology(duration: Duration!): Topology
    getServicesTopology(serviceIds: [ID!]!, duration: Duration!): Topology
    getServiceTopology(serviceId: ID!, duration: Duration!): Topology
    queryBasicTraces(condition: TraceQueryCondition!): TraceList
    queryTrace(traceId: ID!): TraceDetail
    readMetricsValue(condition: MetricValueCondition!, duration: Duration!): Int
  }
`);

// ─── Resolvers ────────────────────────────────────────────────────────────────

const GLOBAL_TOPO = {
  nodes: [
    { id: 'travobuds-frontend', name: 'travobuds-frontend', type: 'USER', isReal: true, layers: ['GENERAL'] },
    { id: 'travobuds-api',      name: 'travobuds-api',      type: 'HTTP', isReal: true, layers: ['GENERAL'] },
    { id: 'travobuds-auth',     name: 'travobuds-auth',     type: 'HTTP', isReal: true, layers: ['GENERAL'] },
    { id: 'travobuds-booking',  name: 'travobuds-booking',  type: 'HTTP', isReal: true, layers: ['GENERAL'] },
    { id: 'travobuds-payment',  name: 'travobuds-payment',  type: 'HTTP', isReal: true, layers: ['GENERAL'] },
    { id: 'travobuds-notify',   name: 'travobuds-notify',   type: 'HTTP', isReal: true, layers: ['GENERAL'] },
    { id: 'postgresql',         name: 'postgresql',         type: 'PostgreSQL', isReal: false, layers: ['VIRTUAL_DATABASE'] },
    { id: 'redis-cache',        name: 'redis-cache',        type: 'Redis',      isReal: false, layers: ['VIRTUAL_CACHE'] },
  ],
  calls: [
    { id: 'c1', source: 'travobuds-frontend', target: 'travobuds-api',     detectPoints: ['CLIENT', 'SERVER'] },
    { id: 'c2', source: 'travobuds-api',      target: 'travobuds-auth',    detectPoints: ['CLIENT', 'SERVER'] },
    { id: 'c3', source: 'travobuds-api',      target: 'travobuds-booking', detectPoints: ['CLIENT', 'SERVER'] },
    { id: 'c4', source: 'travobuds-booking',  target: 'travobuds-payment', detectPoints: ['CLIENT', 'SERVER'] },
    { id: 'c5', source: 'travobuds-booking',  target: 'travobuds-notify',  detectPoints: ['CLIENT', 'SERVER'] },
    { id: 'c6', source: 'travobuds-api',      target: 'postgresql',        detectPoints: ['CLIENT'] },
    { id: 'c7', source: 'travobuds-api',      target: 'redis-cache',       detectPoints: ['CLIENT'] },
  ],
};

function generateTraces(count = 20) {
  const endpoints = [
    'GET:/api/v1/hotels', 'POST:/api/v1/bookings',
    'POST:/auth/login', 'POST:/payment/initiate',
    'GET:/api/v1/hotels/{id}', 'POST:/notify/email',
  ];
  return Array.from({ length: count }, (_, i) => {
    const traceId = makeTraceId();
    const segId = makeSegmentId();
    const isError = Math.random() < 0.08;
    return {
      segmentId: segId,
      key: segId,
      endpointNames: [endpoints[i % endpoints.length]],
      duration: randomBetween(50, isError ? 3000 : 800),
      start: String(Date.now() - randomBetween(0, 3600000)),
      isError,
      traceIds: [traceId],
    };
  });
}

function generateSpans(traceId) {
  const now = Date.now();
  const apiStart = now - 400;

  return [
    {
      traceId,
      segmentId: makeSegmentId(),
      spanId: 0, parentSpanId: -1,
      refs: [],
      serviceCode: 'travobuds-api',
      serviceInstanceName: 'api-pod-1@10.0.1.1',
      startTime: apiStart, endTime: apiStart + 380,
      endpointName: 'POST:/api/v1/bookings',
      type: 'Entry', peer: '', component: 'SpringMVC',
      isError: false, layer: 'Http',
      tags: [{ key: 'http.method', value: 'POST' }, { key: 'http.status_code', value: '200' }],
      logs: [],
    },
    {
      traceId,
      segmentId: makeSegmentId(),
      spanId: 1, parentSpanId: 0,
      refs: [],
      serviceCode: 'travobuds-auth',
      serviceInstanceName: 'auth-pod-1@10.0.2.1',
      startTime: apiStart + 10, endTime: apiStart + 60,
      endpointName: 'POST:/auth/verify',
      type: 'Exit', peer: 'travobuds-auth:3001', component: 'HttpClient',
      isError: false, layer: 'Http',
      tags: [{ key: 'http.method', value: 'POST' }],
      logs: [],
    },
    {
      traceId,
      segmentId: makeSegmentId(),
      spanId: 2, parentSpanId: 0,
      refs: [],
      serviceCode: 'travobuds-booking',
      serviceInstanceName: 'booking-pod-1@10.0.3.1',
      startTime: apiStart + 65, endTime: apiStart + 200,
      endpointName: 'POST:/booking/create',
      type: 'Exit', peer: 'travobuds-booking:4001', component: 'HttpClient',
      isError: false, layer: 'Http',
      tags: [{ key: 'http.method', value: 'POST' }],
      logs: [],
    },
    {
      traceId,
      segmentId: makeSegmentId(),
      spanId: 3, parentSpanId: 2,
      refs: [],
      serviceCode: 'travobuds-booking',
      serviceInstanceName: 'booking-pod-1@10.0.3.1',
      startTime: apiStart + 70, endTime: apiStart + 120,
      endpointName: 'INSERT travobuds.bookings',
      type: 'Exit', peer: 'postgresql:5432', component: 'PostgreSQL',
      isError: false, layer: 'Database',
      tags: [{ key: 'db.type', value: 'sql' }, { key: 'db.statement', value: 'INSERT INTO bookings ...' }],
      logs: [],
    },
    {
      traceId,
      segmentId: makeSegmentId(),
      spanId: 4, parentSpanId: 2,
      refs: [],
      serviceCode: 'travobuds-booking',
      serviceInstanceName: 'booking-pod-1@10.0.3.1',
      startTime: apiStart + 200, endTime: apiStart + 260,
      endpointName: 'POST:/payment/initiate',
      type: 'Exit', peer: 'travobuds-payment:5001', component: 'HttpClient',
      isError: false, layer: 'Http',
      tags: [{ key: 'http.method', value: 'POST' }],
      logs: [],
    },
    {
      traceId,
      segmentId: makeSegmentId(),
      spanId: 5, parentSpanId: 2,
      refs: [],
      serviceCode: 'travobuds-notify',
      serviceInstanceName: 'notify-pod-1@10.0.5.1',
      startTime: apiStart + 265, endTime: apiStart + 320,
      endpointName: 'POST:/notify/email',
      type: 'Exit', peer: 'travobuds-notify:6001', component: 'HttpClient',
      isError: false, layer: 'Http',
      tags: [{ key: 'http.method', value: 'POST' }],
      logs: [],
    },
  ];
}

const root = {
  getAllServices: () => SERVICES,
  getAllDatabases: () => DATABASES,

  getServiceInstances: ({ serviceId }) =>
    SERVICE_INSTANCES[serviceId] || SERVICE_INSTANCES['travobuds-api'],

  findEndpoint: ({ serviceId, keyword }) => {
    const eps = ENDPOINTS[serviceId] || ENDPOINTS['travobuds-api'];
    return keyword ? eps.filter(e => e.name.toLowerCase().includes(keyword.toLowerCase())) : eps;
  },

  getLinearIntValues: ({ metric }) => {
    const ranges = {
      service_resp_time: [80, 950],
      service_cpm:       [20, 200],
      service_sla:       [9200, 10000],
      service_apdex:     [7000, 10000],
    };
    const [min, max] = ranges[metric.name] || [50, 500];
    return { values: timeSeriesValues(60, min, max) };
  },

  getGlobalTopology: () => GLOBAL_TOPO,
  getServicesTopology: () => GLOBAL_TOPO,
  getServiceTopology: ({ serviceId }) => {
    const svcNode = GLOBAL_TOPO.nodes.find(n => n.id === serviceId) || GLOBAL_TOPO.nodes[1];
    const calls = GLOBAL_TOPO.calls.filter(c => c.source === serviceId || c.target === serviceId);
    const nodeIds = new Set([serviceId, ...calls.map(c => c.source), ...calls.map(c => c.target)]);
    return {
      nodes: GLOBAL_TOPO.nodes.filter(n => nodeIds.has(n.id)),
      calls,
    };
  },

  queryBasicTraces: ({ condition }) => ({
    traces: generateTraces(condition?.pageSize || 20),
  }),

  queryTrace: ({ traceId }) => ({
    spans: generateSpans(traceId || makeTraceId()),
  }),

  readMetricsValue: ({ condition }) => {
    const ranges = {
      database_access_resp_time: [30, 200],
      database_access_cpm:       [10, 100],
      database_access_sla:       [9500, 10000],
    };
    const [min, max] = ranges[condition?.name] || [50, 500];
    return randomBetween(min, max);
  },
};

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/graphql', graphqlHTTP({
  schema,
  rootValue: root,
  graphiql: true,
}));

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'skywalking-mock-oap' }));
app.get('/', (_, res) => res.json({ name: 'SkyWalking Mock OAP', version: '10.0.0-mock' }));

const PORT = process.env.PORT || 12800;
app.listen(PORT, () => {
  console.log(`[mock-oap] SkyWalking Mock OAP running on port ${PORT}`);
  console.log(`[mock-oap] GraphiQL available at http://localhost:${PORT}/graphql`);
});
