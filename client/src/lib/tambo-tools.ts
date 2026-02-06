import { z } from "zod";
import { client } from "@/apollo/client";
import { 
  GET_ALL_SERVICES, 
  GET_SERVICE_INSTANCES,
  GET_ALL_DATABASES,
  GET_SERVICE_ENDPOINTS 
} from "@/apollo/queries/services";
import { GET_SERVICE_METRICS } from "@/apollo/queries/metrics";
import { GET_TRACES } from "@/apollo/queries/traces";
import { GET_TOPOLOGY } from "@/apollo/queries/topology";
import { toJsonSchema } from "./json-schema";
import { defineTool } from "@tambo-ai/react";

/**
 * SkyWalking expects: "YYYY-MM-DD HHmm"
 */
const formatSkywalkingTime = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}${mm}`;
};

/**
 * Dynamic Duration Helper for Custom Ranges
 */
const getDynamicDuration = (startDate?: string, endDate?: string) => {
  if (startDate && endDate) {
    return { start: startDate, end: endDate, step: "MINUTE" as const };
  }
  const end = new Date();
  const start = new Date(end.getTime() - 60 * 60 * 1000); // Default 1 hour
  return {
    start: formatSkywalkingTime(start),
    end: formatSkywalkingTime(end),
    step: "MINUTE" as const,
  };
};

/**
 * 1. Tool: getServices (Silent Mode)
 */
export const getServicesTool = defineTool({
  name: "getServices",
  description: "INTERNAL: Fetch services for ServiceListCard. Do not echo JSON.",
  inputSchema: toJsonSchema(z.object({})),
  outputSchema: toJsonSchema(z.object({ services: z.array(z.any()) })),
  tool: async () => {
    try {
      const { data } = await client.query({
        query: GET_ALL_SERVICES,
        variables: { duration: getDynamicDuration() },
        fetchPolicy: "network-only",
      });
      // ✅ Sirf 'services' return karo, extra 'success' ya 'message' nahi
      return { services: data?.getAllServices || [] };
    } catch (error) {
      return { services: [] };
    }
  },
});

/**
 * 2. Tool: getServiceMetrics (Custom Date & Silent)
 */
export const getServiceMetricsTool = defineTool({
  name: "getServiceMetrics",
  description: "INTERNAL: Fetch metrics for ServiceMetricsCard. Supports startDate/endDate.",
  inputSchema: toJsonSchema(z.object({
    serviceId: z.string().describe("The ID of the service"),
    startDate: z.string().optional().describe("Start date: 'YYYY-MM-DD HHmm'"),
    endDate: z.string().optional().describe("End date: 'YYYY-MM-DD HHmm'"),
  })),
  outputSchema: toJsonSchema(z.object({ 
    serviceName: z.string(),
    latency: z.number(),
    throughput: z.number(),
    sla: z.number()
  })),
  tool: async ({ serviceId, startDate, endDate }) => {
    try {
      const duration = getDynamicDuration(startDate, endDate);
      const { data } = await client.query({
        query: GET_SERVICE_METRICS,
        variables: { serviceId, duration },
        fetchPolicy: "network-only",
      });

      const latency = data?.getServiceLatency?.values || [];
      const throughput = data?.getServiceThroughput?.values || [];
      const sla = data?.getServiceSLA?.values || [];

      const avgLat = latency.length > 0 ? latency.reduce((sum: number, v: any) => sum + (v.value || 0), 0) / latency.length : 0;
      const avgThr = throughput.length > 0 ? throughput.reduce((sum: number, v: any) => sum + (v.value || 0), 0) / throughput.length : 0;
      const avgSla = sla.length > 0 ? sla.reduce((sum: number, v: any) => sum + (v.value || 0), 0) / sla.length : 0;

      return {
        serviceName: serviceId,
        latency: Math.round(avgLat),
        throughput: Math.round(avgThr),
        sla: Math.round(avgSla * 100) / 100,
      };
    } catch (error) {
      return { serviceName: serviceId, latency: 0, throughput: 0, sla: 0 };
    }
  },
});

/**
 * 3. Tool: getTraces (Silent Mode)
 */
export const getTracesTool = defineTool({
  name: "getTraces",
  description: "INTERNAL: Fetch traces for TraceListCard.",
  inputSchema: toJsonSchema(z.object({
    serviceId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })),
  outputSchema: toJsonSchema(z.object({ traces: z.array(z.any()) })),
  tool: async ({ serviceId, startDate, endDate }) => {
    try {
      const duration = getDynamicDuration(startDate, endDate);
      const { data } = await client.query({
        query: GET_TRACES,
        variables: {
          condition: {
            serviceId,
            queryDuration: duration,
            paging: { pageNum: 1, pageSize: 10 },
            traceState: "ALL",
            queryOrder: "BY_START_TIME"
          }
        },
        fetchPolicy: "network-only",
      });
      return { traces: data?.queryBasicTraces?.traces || [] };
    } catch (error) {
      return { traces: [] };
    }
  },
});

/**
 * 4. Tool: getTopology (Silent)
 */
export const getTopologyTool = defineTool({
  name: "getTopology",
  description: "INTERNAL: Fetch topology nodes and calls.",
  inputSchema: toJsonSchema(z.object({})),
  outputSchema: toJsonSchema(z.object({ nodes: z.array(z.any()), calls: z.array(z.any()) })),
  tool: async () => {
    try {
      const { data } = await client.query({
        query: GET_TOPOLOGY,
        variables: { serviceIds: [], duration: getDynamicDuration() },
        fetchPolicy: "network-only",
      });
      const topo = data?.getServicesTopology || { nodes: [], calls: [] };
      return { nodes: topo.nodes || [], calls: topo.calls || [] };
    } catch (error) {
      return { nodes: [], calls: [] };
    }
  },
});

/**
 * 5. Tool: getDatabases (Silent)
 */
export const getDatabasesTool = defineTool({
  name: "getDatabases",
  description: "INTERNAL: Fetch databases for DatabaseListCard.",
  inputSchema: toJsonSchema(z.object({})),
  outputSchema: toJsonSchema(z.object({ databases: z.array(z.any()) })),
  tool: async () => {
    try {
      const { data } = await client.query({
        query: GET_ALL_DATABASES,
        variables: { duration: getDynamicDuration() },
        fetchPolicy: "network-only",
      });
      return { databases: data?.getAllDatabases || [] };
    } catch (error) {
      return { databases: [] };
    }
  },
});

export const navigateTool = defineTool({
  name: "navigate_to_page",
  description: "Navigate the UI to a specific page like services, traces, or topology.",
  inputSchema: toJsonSchema(z.object({
    path: z.string().describe("The URL path to navigate to, e.g., '/', '/traces', '/topology'")
  })),
  outputSchema: toJsonSchema(z.object({ success: z.boolean() })),
  tool: async ({ path }) => {
    // 🔥 Ye event frontend (AppLayout) listen karega
    window.dispatchEvent(new CustomEvent("tambo:navigate", { detail: { path } }));
    return { success: true };
  },
});

export const allTools = [
  getServicesTool,
  getServiceMetricsTool,
  getTracesTool,
  getTopologyTool,
  getDatabasesTool,
  navigateTool
];