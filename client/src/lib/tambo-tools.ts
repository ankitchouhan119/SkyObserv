import { z } from "zod";
import { client } from "@/apollo/client";
import { 
  GET_ALL_SERVICES, 
  GET_ALL_DATABASES,
  GET_SERVICE_INSTANCES,
  GET_SERVICE_ENDPOINTS,
} from "@/apollo/queries/services";
import { GET_SERVICE_METRICS } from "@/apollo/queries/metrics";
import { GET_TRACES } from "@/apollo/queries/traces";
import { GET_TOPOLOGY } from "@/apollo/queries/topology";
import { toJsonSchema } from "./json-schema";
import { defineTool } from "@tambo-ai/react";


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


/**
 * 1. Tool: getServices
 */
export const getServicesTool = defineTool({
  name: "getServices",
  description: "INTERNAL: Fetch services for ServiceListCard.",
  inputSchema: toJsonSchema(z.object({})),
  outputSchema: toJsonSchema(z.object({ services: z.array(z.any()) })),
  tool: async () => {
    try {
      const { data } = await client.query({
        query: GET_ALL_SERVICES,
        variables: { duration: getDynamicDuration() },
        fetchPolicy: "network-only",
      });
      return { services: data?.getAllServices || [] };
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

/**
 * 4. Tool: getTopology
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
      return { databases: data?.getAllDatabases || [] };
    } catch (error) {
      return { databases: [] };
    }
  },
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

/** 5. Fetch Service Endpoints */
export const getEndpointsTool = defineTool({
  name: "getEndpoints",
  description: "INTERNAL: Fetch API endpoints for a specific service.",
  inputSchema: toJsonSchema(z.object({
    serviceId: z.string().describe("The ID of the service"),
  })),
  outputSchema: toJsonSchema(z.object({ endpoints: z.array(z.any()) })),
  tool: async ({ serviceId }) => {
    try {
      const { data } = await client.query({
        query: GET_SERVICE_ENDPOINTS,
        variables: { serviceId, keyword: '' },
        fetchPolicy: "network-only",
      });

      const rawData = data?.endpoints || [];

      const formattedEndpoints = rawData.map((e: any) => ({
        id: e.id,
        name: e.name || "Unknown Path" 
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
  navigateTool,
  getInstancesTool,
  getEndpointsTool
];