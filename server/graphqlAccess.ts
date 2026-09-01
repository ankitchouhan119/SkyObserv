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
      next.getAllServices as Array<{ name?: string }>,
      allowedServices,
    );
  }

  // Database names are peer hosts (e.g. redis.upstash.io), not app service names — do not filter here.

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
