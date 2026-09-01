import type { GraphQLBody } from "./graphqlAccess";
import { encodeSkyWalkingServiceId } from "./graphqlAccess";

type TraceRow = {
  segmentId?: string;
  traceIds?: string[];
  start?: string;
  duration?: number;
};

export async function fetchTracesForAllowedServices(
  body: GraphQLBody,
  allowedServices: string[],
  oapUrl: string,
): Promise<{ data: Record<string, unknown>; errors?: unknown[] }> {
  if (allowedServices.length === 0) {
    return { data: { queryBasicTraces: { traces: [] } } };
  }

  const baseCondition =
    body.variables?.condition && typeof body.variables.condition === "object"
      ? { ...(body.variables.condition as Record<string, unknown>) }
      : {};

  const merged: TraceRow[] = [];
  const seen = new Set<string>();
  const errors: unknown[] = [];

  for (const serviceName of allowedServices) {
    const requestBody = {
      ...body,
      variables: {
        ...body.variables,
        condition: {
          ...baseCondition,
          serviceId: encodeSkyWalkingServiceId(serviceName),
        },
      },
    };

    const response = await fetch(`${oapUrl}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(90_000),
    });

    const text = await response.text();
    if (!response.ok) {
      errors.push({ message: `OAP error for ${serviceName}: HTTP ${response.status}`, details: text.slice(0, 200) });
      continue;
    }

    try {
      const parsed = JSON.parse(text) as {
        data?: { queryBasicTraces?: { traces?: TraceRow[] } };
        errors?: unknown[];
      };
      if (parsed.errors?.length) errors.push(...parsed.errors);

      for (const trace of parsed.data?.queryBasicTraces?.traces ?? []) {
        const key = trace.traceIds?.[0] || trace.segmentId;
        if (!key || seen.has(key)) continue;
        seen.add(key);
        merged.push(trace);
      }
    } catch {
      errors.push({ message: `Invalid JSON from OAP for service ${serviceName}` });
    }
  }

  merged.sort((a, b) => String(b.start ?? "").localeCompare(String(a.start ?? "")));

  return {
    data: { queryBasicTraces: { traces: merged } },
    ...(errors.length ? { errors } : {}),
  };
}
