import { z } from "zod";
import { client } from "@/apollo/client";
import {
  GET_ALL_SERVICES,
  GET_SERVICE_INSTANCES,
  GET_SERVICE_ENDPOINTS,
} from "@/apollo/queries/services";
import { GET_DATABASE_METRICS, GET_TRACES_FOR_DB } from "@/apollo/queries/database";
import { GET_ALL_DATABASES } from "@/apollo/queries/database";
import { GET_SERVICE_METRICS } from "@/apollo/queries/metrics";
import { GET_TRACES } from "@/apollo/queries/traces";
import { toJsonSchema } from "./json-schema";
import { defineTool } from "@tambo-ai/react";
import { GET_GLOBAL_TOPOLOGY } from "@/apollo/queries/topology";



const parseToSkywalkingFormat = (dateStr: string) => {
  if (!dateStr) return dateStr;

  // Remove any non-numeric characters except space and keep only the core parts
  // Handles: "2026-02-07 1430", "07-02-2026 14:30", etc.
  let cleaned = dateStr.replace(/[:/-]/g, '-');

  if (cleaned.includes("-") && cleaned.split("-")[0].length === 2) {
    const parts = cleaned.split(" ");
    const [d, m, y] = parts[0].split("-");
    const time = parts[1] ? parts[1].replace(/-/g, "") : "0000";
    return `${y}-${m}-${d} ${time}`;
  }
  return dateStr.replace(/-/g, '-'); // Ensure YYYY-MM-DD format
};

const formatSkywalkingTime = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}${mm}`;
};

const getDynamicDuration = (startDate?: string, endDate?: string) => {
  if (startDate && endDate) {
    return {
      start: parseToSkywalkingFormat(startDate),
      end: parseToSkywalkingFormat(endDate),
      step: "MINUTE" as const
    };
  }
  const end = new Date();
  const start = new Date(end.getTime() - 60 * 60 * 1000);
  return {
    start: formatSkywalkingTime(start),
    end: formatSkywalkingTime(end),
    step: "MINUTE" as const,
  };
};


export const getServicesTool = defineTool({
  name: "getServices",
  description: "INTERNAL: Fetch services for ServiceListCard.",
  inputSchema: toJsonSchema(z.object({})),
  outputSchema: toJsonSchema(z.object({ 
    services: z.array(z.object({
      id: z.string(),
      name: z.string(),
      shortName: z.string().optional().nullable(),
      group: z.string().optional().nullable(),
      layers: z.array(z.string()).optional().nullable(),
      normalStatus: z.string(), // ← CHANGED: boolean to string
      status: z.any().optional().nullable(),
    })) 
  })),
  tool: async () => {
    try {
      const duration = getDynamicDuration();
      const { data } = await client.query({
        query: GET_ALL_SERVICES,
        variables: { duration },
        fetchPolicy: "network-only",
      });

      const raw = data?.getAllServices || [];
      
      
      const mappedServices = raw.map((s: any) => {

        const item = {
          id: String(s.id),
          name: String(s.name),
          shortName: s.shortName || s.name,
          group: s.group || "",
          layers: s.layers || [],
          normalStatus: s.normal === true ? "NORMAL" : s.normal === false ? "ABNORMAL" : "UNKNOWN", // ← CHANGED
          status: s.status || null
        };
        
        
        return item;
      });

      return { services: mappedServices };
    } catch (error) {
      return { services: [] };
    }
  },
});



/**
 * 2. Tool: getServiceMetrics
 */
export const getServiceMetricsTool = defineTool({
  name: "getServiceMetrics",
  description: "INTERNAL: Fetch metrics for ServiceMetricsCard. Supports custom date range.",
  inputSchema: toJsonSchema(z.object({
    serviceId: z.string().describe("The ID of the service"),
    startDate: z.string().optional().describe("Start date: 'YYYY-MM-DD HHmm' or 'DD-MM-YYYY'"),
    endDate: z.string().optional().describe("End date: 'YYYY-MM-DD HHmm' or 'DD-MM-YYYY'"),
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

      const getAvg = (arr: any[]) => arr.length > 0 ? arr.reduce((s, v) => s + (v.value || 0), 0) / arr.length : 0;

      return {
        serviceName: serviceId,
        latency: Math.round(getAvg(latency)),
        throughput: Math.round(getAvg(throughput)),
        sla: Math.round(getAvg(sla) * 100) / 100,
      };
    } catch (error) {
      return { serviceName: serviceId, latency: 0, throughput: 0, sla: 0 };
    }
  },
});

/**
 * 3. Tool: getTraces (Fixed Date & Status filtering)
 */
export const getTracesTool = defineTool({
  name: "getTraces",
  description: "INTERNAL: Fetch traces for TraceListCard. Use traceState='SUCCESS' for healthy ones, 'ERROR' for failures.",
  inputSchema: toJsonSchema(z.object({
    serviceId: z.string().optional(),
    startDate: z.string().optional().describe("Format: 'YYYY-MM-DD HHmm' or 'DD-MM-YYYY'"),
    endDate: z.string().optional().describe("Format: 'YYYY-MM-DD HHmm' or 'DD-MM-YYYY'"),
    traceState: z.enum(["ALL", "SUCCESS", "ERROR"]).default("ALL")
  })),
  outputSchema: toJsonSchema(z.object({ traces: z.array(z.any()) })),
  tool: async ({ serviceId, startDate, endDate, traceState }) => {
    try {
      const duration = getDynamicDuration(startDate, endDate);
      const { data } = await client.query({
        query: GET_TRACES,
        variables: {
          condition: {
            serviceId,
            queryDuration: duration,
            paging: { pageNum: 1, pageSize: 15 },
            traceState: traceState || "ALL",
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



export const getTopologyTool = defineTool({
  name: "getTopology",
  description: "INTERNAL: Fetch global topology nodes and calls.",
  inputSchema: toJsonSchema(z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })),
  outputSchema: toJsonSchema(z.object({ 
    nodes: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.string().optional(),
      isReal: z.boolean().optional(),
      layers: z.array(z.string()).optional(),
    })), 
    calls: z.array(z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
      detectPoints: z.array(z.string()).optional(),
    }))
  })),
  tool: async ({ startDate, endDate }) => {
    try {
      const duration = getDynamicDuration(startDate, endDate);

      const { data } = await client.query({
        query: GET_GLOBAL_TOPOLOGY, 
        variables: { duration },
        fetchPolicy: "network-only",
      });

      const rawData = data?.getGlobalTopology;

      const nodes = (rawData?.nodes || []).map((n: any) => ({
        id: String(n.id),
        name: String(n.name),
        type: n.type || "service",
        isReal: n.isReal ?? true,
        layers: n.layers || [],
      }));

      const calls = (rawData?.calls || []).map((c: any) => ({
        id: String(c.id),
        source: String(c.source),
        target: String(c.target),
        detectPoints: c.detectPoints || [],
      }));

      return { nodes, calls };
    } catch (error) {
      console.error("TOPOLOGY TOOL ERROR:", error);
      return { nodes: [], calls: [] };
    }
  },
});





/**
 * 5. Tool: getDatabases
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

      // console.log("Tool Data Fetched:", data);

      return { databases: data?.getAllDatabases || [] };
    } catch (error) {
      return { databases: [] };
    }
  },
});


export const getDatabaseInsightsTool = defineTool({
  name: "getDatabaseInsights",
  description: "Get database health using trace-based analytics including throughput, latency, and latest queries.",
  inputSchema: toJsonSchema(z.object({
    serviceId: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })),
  outputSchema: toJsonSchema(z.object({
    dbName: z.string(),
    avgLatency: z.number(),
    throughput: z.number(),
    successRate: z.string(),
    latestQueries: z.array(z.object({
      sql: z.string(),
      latency: z.number()
    }))
  })),
  tool: async ({ serviceId, startDate, endDate }) => {
    try {
      const duration = getDynamicDuration(startDate, endDate);
      
      const { data } = await client.query({
        query: GET_TRACES_FOR_DB,
        variables: { 
          condition: { 
            queryDuration: duration, 
            traceState: 'ALL', 
            queryOrder: 'BY_START_TIME', 
            paging: { pageNum: 1, pageSize: 20 } 
          } 
        },
        fetchPolicy: 'network-only'
      });

      const traces = data?.queryBasicTraces?.traces || [];
      
      const totalLatency = traces.reduce((acc, t) => acc + t.duration, 0);
      const avgLat = traces.length > 0 ? Math.round(totalLatency / traces.length) : 0;

      return {
        dbName: serviceId,
        avgLatency: avgLat,
        throughput: traces.length,
        successRate: traces.length > 0 ? "100%" : "0%",
        latestQueries: traces.slice(0, 3).map(t => ({
          sql: t.endpointNames?.[0] || "Database Operation",
          latency: t.duration
        }))
      };
    } catch (error) {
      console.error("TOOL ERROR:", error);
      return {
        dbName: serviceId,
        avgLatency: 0,
        throughput: 0,
        successRate: "0%",
        latestQueries: []
      };
    }
  }
});

export const navigateTool = defineTool({
  name: "navigate_to_page",
  description: "Navigate to pages and sync filters like service, status, and duration and For service details, use path '/services/[serviceId]'. You can also specify a 'tab' like 'instances' or 'endpoints'.",
  inputSchema: toJsonSchema(z.object({
    path: z.string(),
    filters: z.object({
      tab: z.enum(["overview", "instances", "endpoints"]).optional(),
      traceState: z.enum(["ALL", "SUCCESS", "ERROR"]).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      minDuration: z.string().optional(),
      serviceId: z.string().optional(),
    }).optional()
  })),
  outputSchema: toJsonSchema(z.object({ success: z.boolean() })),
  tool: async ({ path, filters }) => {
    // 1. First trigger Navigation 
    window.dispatchEvent(new CustomEvent("tambo:navigate", { detail: { path, filters } }));

    if (filters) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("skyobserv:query-update", { detail: { filters } }));
      }, 500);
    }

    return { success: true };
  },
});

// /** 5. Fetch Service Endpoints */
export const getEndpointsTool = defineTool({
  name: "getEndpoints",
  description: "INTERNAL: Fetch API endpoints for a specific service.",
  inputSchema: toJsonSchema(z.object({
    serviceId: z.string().describe("The ID of the service"),
  })),
  outputSchema: toJsonSchema(z.object({ endpoints: z.array(z.any()) })),
  tool: async ({ serviceId }) => {
    try {
      console.log(`AI fetching endpoints for ServiceID: ${serviceId}`);
      const { data } = await client.query({
        query: GET_SERVICE_ENDPOINTS,
        variables: { serviceId, keyword: '' },
        fetchPolicy: "network-only",
      });

      const rawData = data?.endpoints || [];

      const formattedEndpoints = rawData.map((e: any) => ({
        id: e.id,
        name: e.name,             // Primary (Matches your UI table)
        endpointPath: e.name,     // Backup 1
        label: e.name             // Backup 2
      }));

      return { endpoints: formattedEndpoints };
    } catch (error) {
      console.error("Fetch Error:", error);
      return { endpoints: [] };
    }
  },
});



/** 6. Fetch Service Instances */
export const getInstancesTool = defineTool({
  name: "getInstances",
  description: "INTERNAL: Fetch active instances/nodes for a specific service.",
  inputSchema: toJsonSchema(z.object({
    serviceId: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })),
  outputSchema: toJsonSchema(z.object({ instances: z.array(z.any()) })),
  tool: async ({ serviceId, startDate, endDate }) => {
    const duration = getDynamicDuration(startDate, endDate);
    const { data } = await client.query({
      query: GET_SERVICE_INSTANCES,
      variables: { serviceId, duration },
      fetchPolicy: "network-only",
    });
    return { instances: data?.getServiceInstances || [] };
  },
});





export const allTools = [
  getServicesTool,
  getServiceMetricsTool,
  getTracesTool,
  getTopologyTool,
  getDatabasesTool,
  getDatabaseInsightsTool,
  navigateTool,
  getInstancesTool,
  getEndpointsTool
];