/**
 * @file tambo.ts
 * @description Central configuration file for Tambo AI components and tools.
 */

import type { TamboComponent } from "@tambo-ai/react";
import { z } from "zod";
import { toJsonSchema } from "@/lib/json-schema";

// Import components
import { ServiceMetricsCard } from "@/components/tambo/ServiceMetricsCard";
import { ServiceListCard } from "@/components/tambo/ServiceListCard";
import { DetailedMetricsCard } from "@/components/tambo/DetailedMetricsCard";
import { TracesListCard } from "@/components/tambo/TraceListCard";
import { TopologyGraphCard } from "@/components/tambo/TopologyGraphCard";
import { DatabaseListCard } from "@/components/tambo/DatabaseListCard";
import { ServiceInstancesCard } from "@/components/tambo/ServiceInstancesCard";
import { EndpointsListCard } from "@/components/tambo/EndpointsListCard";

// Import tools
import { allTools } from "./tambo-tools";

/**
 * 1. COMPONENT SCHEMAS
 * These guide the AI on how to generate props for each component.
 */

const serviceMetricsSchema = z.object({
  serviceName: z.string().describe("Name of the microservice (e.g., 'new4')"),
  latency: z.number().describe("Latency in milliseconds"),
  throughput: z.number().describe("Throughput in calls per minute"),
  sla: z.number().describe("SLA/Success rate percentage (0-100)"),
  status: z.enum(["healthy", "degraded", "critical"]).optional().describe("Current health status"),
  insight: z.string().optional().describe("A short  analysis of the service health"),
});

const serviceListSchema = z.object({
  services: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      shortName: z.string().optional(),
      group: z.string().optional(),
      status: z.string().optional(),
      normalStatus: z.string(), 
    })
  ).describe("Array of all discovered services"),
});

const detailedMetricsSchema = z.object({
  serviceName: z.string(),
  latency: z.number(),
  throughput: z.number(),
  sla: z.number(),
  latencyValues: z.array(z.object({ id: z.string(), value: z.number() })).optional(),
  throughputValues: z.array(z.object({ id: z.string(), value: z.number() })).optional(),
  slaValues: z.array(z.object({ id: z.string(), value: z.number() })).optional(),
});

const tracesListSchema = z.object({
  traces: z.array(
    z.object({
      key: z.string(),
      endpointNames: z.array(z.string()),
      duration: z.number().describe("Duration in ms"),
      start: z.string(),
      isError: z.boolean(),
    })
  ).describe("List of distributed traces"),
});















// const topologyGraphSchema = z.object({
//   nodes: z.array(z.object({ id: z.string(), name: z.string(), type: z.string() })),
//   calls: z.array(z.object({ id: z.string(), source: z.string(), target: z.string() })),
// });



// tambo.ts ke andar topologyGraphSchema ko isse replace karo:

const topologyGraphSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string(),
      name: z.string().optional().nullable(),
      type: z.string().optional().nullable(),
      isReal: z.boolean().optional().nullable(),
    })
  ).optional().describe("List of topology nodes"),
  calls: z.array(
    z.object({
      id: z.string().optional().nullable(),
      source: z.string().optional().nullable(),
      target: z.string().optional().nullable(),
    })
  ).optional().describe("List of service calls/edges"),
});















const serviceInstancesSchema = z.object({
  serviceName: z.string().optional(),
  instances: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      instanceUUID: z.string(),
      language: z.string(),
    })
  ),
});

/**
 * 2. COMPONENTS REGISTRY
 * These are the Generative Components Tambo can render in the chat.
 */
export const components: TamboComponent[] = [
  {
    name: "ServiceMetricsCard",
    description: "Displays a quick summary of service health (Latency, Traffic, SLA). Use when the user asks for service status.",
    component: ServiceMetricsCard,
    propsSchema: toJsonSchema(serviceMetricsSchema),
  },
  {
    name: "ServiceListCard",
    description: "Lists all services. Use when the user asks 'what services are running?' or 'show me all services'.",
    component: ServiceListCard,
    propsSchema: toJsonSchema(serviceListSchema),
  },
  {
    name: "DetailedMetricsCard",
    description: "Shows in-depth metrics with charts. Use for detailed performance analysis requests.",
    component: DetailedMetricsCard,
    propsSchema: toJsonSchema(detailedMetricsSchema),
  },
  {
    name: "TracesListCard",
    description: "Displays request traces. Use when the user asks about slow requests or error traces.",
    component: TracesListCard,
    propsSchema: toJsonSchema(tracesListSchema),
  },
  {
    name: "TopologyGraphCard",
    description: "Visualizes service dependencies. Use for architecture or topology questions.",
    component: TopologyGraphCard,
    propsSchema: toJsonSchema(topologyGraphSchema),
  },
  {
    name: "ServiceInstancesCard",
    description: "Lists instances/replicas of a service. Use when asking about pods or deployment details.",
    component: ServiceInstancesCard,
    propsSchema: toJsonSchema(serviceInstancesSchema),
  },
  {
    name: "DatabaseListCard",
    description: "Lists detected databases. Use when the user asks about storage or DB health.",
    component: DatabaseListCard,
    propsSchema: toJsonSchema(z.object({ databases: z.array(z.any()) })),
  },
  {
    name: "EndpointsListCard",
    description: "Lists API routes/endpoints for a service.",
    component: EndpointsListCard,
    propsSchema: toJsonSchema(z.object({ endpoints: z.array(z.any()) })),
  },
];

/**
 * 3. TOOLS EXPORT
 */
export const tools = allTools;