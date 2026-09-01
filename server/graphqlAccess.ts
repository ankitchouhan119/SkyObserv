type GraphQLBody = {
  query?: string;
  variables?: Record<string, unknown>;
};

export type { GraphQLBody };

export function decodeSkyWalkingServiceId(id: string): string | null {
  try {
    const encoded = id.split(".")[0];
    return Buffer.from(encoded, "base64").toString("utf8");
  } catch {
    return null;
  }
}

export function encodeSkyWalkingServiceId(name: string): string {
  return `${Buffer.from(name, "utf8").toString("base64")}.1`;
}

export function canAccessService(name: string, allowedServices: string[]): boolean {
  if (allowedServices.includes("*")) return true;
  return allowedServices.includes(name);
}

const K8S_LAYER_PREFIX = "K8S";

export function hasWildcardServiceAccess(allowedServices: string[]): boolean {
  return allowedServices.includes("*");
}

export function isK8sServiceName(name: string): boolean {
  if (name.includes("::")) return true;
  return /^k8s[-_]/i.test(name);
}

function isK8sServiceRecord(item: { name?: string; layers?: unknown }): boolean {
  if (item.name && isK8sServiceName(item.name)) return true;
  if (!Array.isArray(item.layers)) return false;
  return item.layers.some(
    (layer) => typeof layer === "string" && layer.startsWith(K8S_LAYER_PREFIX),
  );
}

export function isK8sMetricEntity(entity: unknown): boolean {
  if (!entity || typeof entity !== "object") return false;
  const record = entity as { scope?: string; serviceName?: string };
  if (record.scope?.startsWith(K8S_LAYER_PREFIX)) return true;
  if (record.serviceName && isK8sServiceName(record.serviceName)) return true;
  return false;
}

function emptyK8sListServiceFields(next: Record<string, unknown>): void {
  for (const key of Object.keys(next)) {
    const value = next[key];
    if (Array.isArray(value) && value.some((item) => isK8sServiceRecord(item))) {
      next[key] = [];
    }
  }
}

function collectServiceNamesFromVariables(variables: Record<string, unknown>): string[] {
  const names: string[] = [];

  const pushId = (value: unknown) => {
    if (typeof value !== "string") return;
    const name = decodeSkyWalkingServiceId(value);
    if (name) names.push(name);
  };

  pushId(variables.serviceId);

  if (Array.isArray(variables.serviceIds)) {
    for (const id of variables.serviceIds) pushId(id);
  }

  const condition = variables.condition;
  if (condition && typeof condition === "object") {
    pushId((condition as Record<string, unknown>).serviceId);
  }

  return names;
}

function getTraceQueryServiceId(variables: Record<string, unknown>): string | undefined {
  const condition = variables.condition;
  if (condition && typeof condition === "object") {
    const serviceId = (condition as Record<string, unknown>).serviceId;
    if (typeof serviceId === "string" && serviceId.length > 0) return serviceId;
  }
  return undefined;
}

export function isUnscopedTraceListQuery(body: GraphQLBody): boolean {
  return Boolean(body.query?.includes("queryBasicTraces") && !getTraceQueryServiceId(body.variables ?? {}));
}

export function assertGraphQLAccess(
  body: GraphQLBody,
  allowedServices: string[],
): string | null {
  if (allowedServices.includes("*")) return null;

  const names = collectServiceNamesFromVariables(body.variables ?? {});
  for (const name of names) {
    if (!hasWildcardServiceAccess(allowedServices) && isK8sServiceName(name)) {
      return "Access denied for Kubernetes resources";
    }
    if (!canAccessService(name, allowedServices)) {
      return `Access denied for service: ${name}`;
    }
  }

  return null;
}

function filterByServiceName<T extends { name?: string }>(
  items: T[],
  allowedServices: string[],
): T[] {
  if (allowedServices.includes("*")) return items;
  return items.filter((item) => item.name && canAccessService(item.name, allowedServices));
}

function filterTopology(
  topology: { nodes?: Array<{ id?: string; name?: string }>; calls?: Array<{ source?: string; target?: string }> },
  allowedServices: string[],
) {
  if (allowedServices.includes("*")) return topology;

  const nodes = topology.nodes ?? [];
  const calls = topology.calls ?? [];

  const allowedServiceNodeIds = new Set(
    nodes
      .filter((node) => node.name && canAccessService(node.name, allowedServices))
      .map((node) => node.id),
  );

  // Include storage backends (Redis, Postgres, etc.) called by the user's services
  const peerNodeIds = new Set<string>();
  for (const call of calls) {
    if (call.source && call.target && allowedServiceNodeIds.has(call.source)) {
      peerNodeIds.add(call.target);
    }
  }

  const allowedNodeIds = new Set([...allowedServiceNodeIds, ...peerNodeIds]);

  return {
    ...topology,
    nodes: nodes.filter((node) => node.id && allowedNodeIds.has(node.id)),
    calls: calls.filter(
      (call) => allowedNodeIds.has(call.source) && allowedNodeIds.has(call.target),
    ),
  };
}

export function filterGraphQLResponse(
  body: GraphQLBody,
  data: Record<string, unknown>,
  allowedServices: string[],
): Record<string, unknown> {
  if (allowedServices.includes("*") || !data) return data;

  const query = body.query ?? "";
  const next = { ...data };

  if (query.includes("getAllServices") && Array.isArray(next.getAllServices)) {
    next.getAllServices = filterByServiceName(
      next.getAllServices as Array<{ name?: string; layers?: unknown }>,
      allowedServices,
    ).filter((item) => !isK8sServiceRecord(item));
  }

  if (query.includes("listServices")) {
    emptyK8sListServiceFields(next);
  }

  if (query.includes("execExpression") && isK8sMetricEntity(body.variables?.entity)) {
    next.result = { results: [], error: null };
  }

  if (query.includes("readMetricsValues")) {
    const condition = body.variables?.condition as { entity?: unknown } | undefined;
    if (isK8sMetricEntity(condition?.entity)) {
      for (const key of Object.keys(next)) {
        const value = next[key];
        if (value && typeof value === "object" && "values" in (value as object)) {
          next[key] = { values: [] };
        }
      }
    }
  }

  if (query.includes("queryEvents")) {
    const eventSource = (body.variables?.condition as { source?: { service?: string } } | undefined)
      ?.source;
    if (eventSource?.service && isK8sServiceName(eventSource.service)) {
      if (next.events && typeof next.events === "object") {
        next.events = { ...(next.events as object), events: [] };
      }
    }
  }

  if (query.includes("getInstance")) {
    next.instance = null;
  }

  if (query.includes("getGlobalTopology") && next.getGlobalTopology) {
    next.getGlobalTopology = filterTopology(
      next.getGlobalTopology as { nodes?: Array<{ id?: string; name?: string }>; calls?: Array<{ source?: string; target?: string }> },
      allowedServices,
    );
  }

  if (query.includes("getServicesTopology") && next.getServicesTopology) {
    next.getServicesTopology = filterTopology(
      next.getServicesTopology as { nodes?: Array<{ id?: string; name?: string }>; calls?: Array<{ source?: string; target?: string }> },
      allowedServices,
    );
  }

  if (query.includes("queryTrace") && next.queryTrace) {
    const trace = next.queryTrace as { spans?: Array<{ serviceCode?: string }> };
    const spans = trace.spans ?? [];
    const denied = spans.some(
      (span) => span.serviceCode && !canAccessService(span.serviceCode, allowedServices),
    );
    if (denied) {
      return { queryTrace: { spans: [] } };
    }
  }

  return next;
}

const TOPOLOGY_FOR_FILTER_QUERY = `
  query TopologyForDatabaseFilter($duration: Duration!) {
    getGlobalTopology(duration: $duration) {
      nodes { id name isReal type }
      calls { source target }
    }
  }
`;

export function normalizeStorageEndpoint(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/^rediss?:\/\//, "")
      .split("@")
      .pop()
      ?.split("/")[0] ?? name.toLowerCase()
  );
}

export async function fetchGlobalTopology(
  oapUrl: string,
  duration: unknown,
): Promise<{
  nodes?: Array<{ id?: string; name?: string; isReal?: boolean; type?: string }>;
  calls?: Array<{ source?: string; target?: string }>;
}> {
  const response = await fetch(`${oapUrl}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: TOPOLOGY_FOR_FILTER_QUERY,
      variables: { duration },
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    return { nodes: [], calls: [] };
  }

  const parsed = (await response.json()) as {
    data?: {
      getGlobalTopology?: {
        nodes?: Array<{ id?: string; name?: string; isReal?: boolean; type?: string }>;
        calls?: Array<{ source?: string; target?: string }>;
      };
    };
  };

  return parsed.data?.getGlobalTopology ?? { nodes: [], calls: [] };
}

/** Scope OAP database peers to storage nodes reachable from the user's own services. */
export function filterDatabasesForUser(
  databases: Array<{ id?: string; name?: string }>,
  allowedServices: string[],
  topology: {
    nodes?: Array<{ id?: string; name?: string; isReal?: boolean; type?: string }>;
    calls?: Array<{ source?: string; target?: string }>;
  },
): Array<{ id?: string; name?: string }> {
  if (allowedServices.includes("*")) return databases;
  if (allowedServices.length === 0) return [];

  const filteredTopology = filterTopology(topology, allowedServices);
  const serviceNodeIds = new Set(
    (filteredTopology.nodes ?? [])
      .filter((node) => node.name && canAccessService(node.name, allowedServices))
      .map((node) => node.id),
  );

  const peerEndpoints = new Set<string>();
  for (const node of filteredTopology.nodes ?? []) {
    if (!node.name || !node.id) continue;
    if (serviceNodeIds.has(node.id)) continue;
    peerEndpoints.add(normalizeStorageEndpoint(node.name));
  }

  return databases.filter(
    (db) => db.name && peerEndpoints.has(normalizeStorageEndpoint(db.name)),
  );
}
