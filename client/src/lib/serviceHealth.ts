export type ServiceHealthStatus = "healthy" | "degraded" | "critical";
export type ServiceNormalStatus = "NORMAL" | "ABNORMAL" | "UNKNOWN";

export function averageMetric(values: Array<{ value?: number }>): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, point) => acc + (point.value ?? 0), 0);
  return sum / values.length;
}

export function resolveServiceHealth(
  normal: boolean | null | undefined,
  latency: number,
  throughput: number,
  slaPercent: number,
): {
  status: ServiceHealthStatus;
  normalStatus: ServiceNormalStatus;
  label: string;
  detail?: string;
} {
  const normalStatus: ServiceNormalStatus =
    normal === true ? "NORMAL" : normal === false ? "ABNORMAL" : "UNKNOWN";

  if (normalStatus === "ABNORMAL") {
    return {
      status: "critical",
      normalStatus,
      label: "Abnormal",
      detail: "SkyWalking flagged this service as unhealthy.",
    };
  }

  if (normalStatus === "NORMAL") {
    if (latency === 0 && throughput === 0 && slaPercent === 0) {
      return {
        status: "healthy",
        normalStatus,
        label: "Idle",
        detail: "Agent is connected but no requests in this time window.",
      };
    }

    if (slaPercent > 0 && slaPercent < 95) {
      return {
        status: "degraded",
        normalStatus,
        label: "Degraded",
        detail: "Success rate is below 95% in the selected window.",
      };
    }

    return {
      status: "healthy",
      normalStatus,
      label: "Healthy",
      detail: "Agent is reporting and traffic looks normal.",
    };
  }

  return {
    status: "degraded",
    normalStatus,
    label: "Unknown",
    detail: "Health could not be determined from SkyWalking.",
  };
}
