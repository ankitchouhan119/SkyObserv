export type DocCategory = "start" | "platform" | "languages" | "data" | "frameworks";

export type CalloutKind = "note" | "warning" | "info";

export type DocBlock = {
  title: string;
  body?: string;
  bullets?: string[];
  ordered?: string[];
  code?: { language: string; content: string; caption?: string }[];
  callout?: { kind: CalloutKind; text: string };
};

export type DocTopic = {
  slug: string;
  title: string;
  description: string;
  category: DocCategory;
  blocks: DocBlock[];
};

export const DOC_CATEGORIES: { id: DocCategory; label: string }[] = [
  { id: "start", label: "Getting started" },
  { id: "platform", label: "Platform" },
  { id: "languages", label: "Languages" },
  { id: "data", label: "Data stores" },
  { id: "frameworks", label: "ORMs & frameworks" },
];

export const DOC_TOPICS: DocTopic[] = [
  {
    slug: "overview",
    title: "Introduction",
    description: "Architecture, terminology, and the minimum configuration required to send traces to SkyObserv.",
    category: "start",
    blocks: [
      {
        title: "What is SkyObserv",
        body: "SkyObserv is a multi-tenant observability console built on Apache SkyWalking OAP. Your applications run the SkyWalking language agent, which reports trace segments to OAP over gRPC. SkyObserv authenticates users, registers services, and scopes the UI to the services linked to your account.",
      },
      {
        title: "Components",
        bullets: [
          "Application agent — runs inside your process (Node, Java, Python, etc.) and creates spans.",
          "OAP (Observability Analysis Platform) — receives, aggregates, and stores traces and topology.",
          "SkyObserv — provides registration, access control, and the web UI you are using now.",
        ],
      },
      {
        title: "Registration flow",
        ordered: [
          "Create a SkyObserv account and open Profile.",
          "Copy SKYOBSERV_USER_TOKEN and SKYOBSERV_REGISTER_URL.",
          "Set the environment variables in your application (see below).",
          "Start the application. On boot it POSTs to /api/agent/register and receives the OAP collector address.",
          "Generate traffic. Within one to two minutes, the service appears under Dashboard → Services.",
        ],
        callout: {
          kind: "info",
          text: "You do not configure the OAP collector address manually. On registration, SkyObserv returns collectorAddress (gRPC, port 11800) for your backend agent.",
        },
      },
      {
        title: "Registration API",
        body: "Every backend service uses the same endpoint. Send your API token and service name; SkyObserv returns the gRPC collector address for your deployment.",
        code: [
          {
            language: "bash",
            content: `curl -s -X POST "$SKYOBSERV_REGISTER_URL/api/agent/register" \\
  -H "Authorization: Bearer $SKYOBSERV_USER_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"serviceName":"my-service","serviceInstance":"local"}'`,
            caption: "Example request",
          },
          {
            language: "json",
            content: `{
  "ok": true,
  "serviceName": "my-service",
  "email": "you@example.com",
  "collectorAddress": "oap.example.com:11800"
}`,
            caption: "Example response — returned by SkyObserv; do not add these fields to your .env",
          },
        ],
      },
      {
        title: "What to instrument",
        body: "Instrument your API or backend process only — Node, Java, Python, and similar server-side runtimes. A React, Next.js, or mobile frontend does not need a SkyWalking agent. User requests are traced when they hit your backend; topology will still show dependencies to databases and caches from API calls.",
        callout: {
          kind: "note",
          text: "Do not add skywalking-client-js to browser bundles. It exposes limited value in SkyObserv compared to backend agents and complicates token handling.",
        },
      },
      {
        title: "Required environment variables",
        body: "These four variables are sufficient for every backend language. Values for the token and register URL are shown on your Profile page. The OAP collector is never configured manually.",
        code: [
          {
            language: "env",
            content: `SW_AGENT_ENABLED=true
SW_AGENT_NAME=my-service
SW_AGENT_INSTANCE=my-service-local
SKYOBSERV_USER_TOKEN=so_xxxxxxxx
SKYOBSERV_REGISTER_URL=https://your-skyobserv-host`,
            caption: "Minimum configuration for agent registration",
          },
        ],
      },
      {
        title: "Service naming",
        body: "SW_AGENT_NAME must match the logical service name you expect to see in the UI. SW_AGENT_INSTANCE distinguishes replicas (hostname, pod name, or environment). Use one service name per deployable application, not per endpoint.",
      },
      {
        title: "Next steps",
        bullets: [
          "Kubernetes cluster monitoring — see Kubernetes monitoring guide",
          "Node.js / Express — see Node.js agent guide",
          "PostgreSQL via Prisma — see Prisma guide (extra setup required)",
          "Redis — see Redis guide (automatic with ioredis on Node)",
          "Java or Python — see the language-specific guide",
        ],
      },
    ],
  },
  {
    slug: "kubernetes",
    title: "Kubernetes monitoring",
    description: "Enable cluster, node, and pod metrics in SkyObserv through SkyWalking OAP and the Kubernetes API.",
    category: "platform",
    blocks: [
      {
        title: "What SkyObserv shows",
        body: "The Kubernetes section reads infrastructure metadata and MQE metrics that SkyWalking OAP collects from your cluster — cluster health, nodes, namespaces, pods, CPU/memory, and pod phase. Application traces from workloads still require the SkyWalking language agent (see Node.js / Java / Python guides).",
        bullets: [
          "Cluster overview — nodes, namespaces, pod counts, resource pressure",
          "Workload explorer — filter pods by node and namespace",
          "Pod detail — status, attributes, events, and resource usage",
        ],
      },
      {
        title: "Who can see Kubernetes data",
        callout: {
          kind: "warning",
          text: "Kubernetes views are available only to the account owner (admin). Team members invited under your account cannot access K8s layers, even if their services run inside the cluster.",
        },
        body: "Sign in with the primary SkyObserv account that owns the API token. After OAP is wired to a cluster, open Dashboard → Kubernetes.",
      },
      {
        title: "Architecture (two pieces)",
        ordered: [
          "Metrics path — kube-state-metrics (and cAdvisor via kubelet) expose cluster metrics. OpenTelemetry Collector scrapes them and forwards OTLP metrics to OAP. OAP also calls the Kubernetes API for pod/service metadata.",
          "Traces path — each workload runs a SkyWalking agent registered with SKYOBSERV_REGISTER_URL (same as a VM deployment). Pod names become SW_AGENT_INSTANCE values.",
        ],
      },
      {
        title: "OAP environment variables",
        body: "Enable the OpenTelemetry receiver and K8s metric rules on the OAP container. These match SkyWalking 10.x defaults used by SkyObserv.",
        code: [
          {
            language: "env",
            content: `SW_OTEL_RECEIVER=default
SW_OTEL_RECEIVER_ENABLED_HANDLERS=otlp-metrics
SW_OTEL_RECEIVER_ENABLED_OTEL_METRICS_RULES=k8s/k8s-cluster,k8s/k8s-node,k8s/k8s-service,k8s/k8s-instance
SW_K8S_MONITORING_ENABLED=default`,
            caption: "Required on OAP for Kubernetes layers",
          },
        ],
      },
      {
        title: "RBAC (required)",
        body: "OAP needs read-only access to pods, services, nodes, namespaces, deployments, and replicasets. Apply the manifest shipped with SkyObserv (oap-deploy/k8s-rbac.yaml) or grant equivalent permissions to the OAP ServiceAccount / kubeconfig user.",
        code: [
          {
            language: "bash",
            content: `kubectl create namespace skywalking --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f oap-deploy/k8s-rbac.yaml`,
          },
        ],
      },
      {
        title: "Production setup (recommended)",
        ordered: [
          "Install kube-state-metrics in the cluster (Helm chart or your platform bundle).",
          "Deploy OpenTelemetry Collector to scrape kube-state-metrics and export OTLP to OAP (:11800). See oap-deploy/k8s-otel-collector.yaml for a minimal example — adjust the kube-state-metrics target namespace if yours differs.",
          "Run OAP with the environment variables above and a ServiceAccount that has the RBAC from k8s-rbac.yaml.",
          "Wait 2–3 minutes after OAP restart, then open SkyObserv → Kubernetes.",
        ],
        callout: {
          kind: "info",
          text: "On AWS EKS / managed Kubernetes, prefer in-cluster OAP (or Satellite) with a ServiceAccount. Mounting a developer kubeconfig onto a remote EC2 OAP instance only works for lab setups.",
        },
      },
      {
        title: "Local development (Minikube / kind)",
        body: "For a single-node lab cluster you can run OAP on the host with your kubeconfig mounted. Replace the minikube path with your actual MINIKUBE_HOME if you use Minikube.",
        code: [
          {
            language: "bash",
            content: `docker run -d --name skywalking-oap-local \\
  --network host \\
  -e SW_STORAGE=elasticsearch \\
  -e SW_STORAGE_ES_CLUSTER_NODES=127.0.0.1:9200 \\
  -e SW_OTEL_RECEIVER=default \\
  -e SW_K8S_MONITORING_ENABLED=default \\
  -e SW_OTEL_RECEIVER_ENABLED_HANDLERS=otlp-metrics \\
  -e SW_OTEL_RECEIVER_ENABLED_OTEL_METRICS_RULES=k8s/k8s-cluster,k8s/k8s-node,k8s/k8s-service,k8s/k8s-instance \\
  -e JAVA_OPTS="-Xms1g -Xmx1g" \\
  -v "$HOME/.kube/config:/root/.kube/config:ro" \\
  -v "$HOME/.minikube:$HOME/.minikube:ro" \\
  apache/skywalking-oap-server:10.0.0`,
            caption: "Host-network OAP with kubeconfig — lab only",
          },
        ],
      },
      {
        title: "Instrument workloads in Kubernetes",
        body: "Add the SkyWalking agent to your Deployment manifest using the same registration flow as bare-metal. Use the pod name for the instance id when possible.",
        code: [
          {
            language: "yaml",
            content: `env:
  - name: SW_AGENT_ENABLED
    value: "true"
  - name: SW_AGENT_NAME
    value: "my-api"
  - name: SW_AGENT_INSTANCE
    valueFrom:
      fieldRef:
        fieldPath: metadata.name
  - name: SKYOBSERV_USER_TOKEN
    valueFrom:
      secretKeyRef:
        name: skyobserv-agent
        key: token
  - name: SKYOBSERV_REGISTER_URL
    value: "https://your-skyobserv-host"`,
          },
        ],
      },
      {
        title: "Verify",
        ordered: [
          "curl OAP GraphQL: curl -s http://localhost:12800/graphql -H 'Content-Type: application/json' -d '{\"query\":\"{ version }\"}'",
          "Query layers: listServices(layer: \"K8S\") should return k8s-cluster::…",
          "SkyObserv → Kubernetes shows worker nodes and namespaces (admin account).",
          "SkyObserv → Services shows your instrumented workloads with traces.",
        ],
      },
      {
        title: "Troubleshooting",
        bullets: [
          "Empty Kubernetes page — confirm you are on the admin account, OAP env vars are set, RBAC is applied, and OAP can reach the API server (check docker logs skywalking-oap).",
          "Metrics but no pods — kube-state-metrics or OTel Collector not scraping; confirm OTel pipeline reaches OAP :11800.",
          "Pods but no application traces — agent not registered in the pod; verify SKYOBSERV_* env vars and that instrumentation loads before Express/Prisma.",
          "Wrong minikube path — update the -v mount to your MINIKUBE_HOME; kubeconfig server URL must be reachable from inside the OAP container.",
        ],
      },
    ],
  },
  {
    slug: "node",
    title: "Node.js agent",
    description: "Install and configure skywalking-backend-js with SkyObserv service registration.",
    category: "languages",
    blocks: [
      {
        title: "Prerequisites",
        bullets: [
          "Node.js 18 or later",
          "A SkyObserv account with API token (Profile page)",
          "Application uses Express, or another framework built on Node HTTP",
        ],
      },
      {
        title: "Environment variables",
        body: "Copy these from SkyObserv Profile. The collector address is resolved at startup via registration — do not set SW_AGENT_COLLECTOR_BACKEND_SERVICES or any OAP hostname manually.",
        code: [
          {
            language: "env",
            content: `SW_AGENT_ENABLED=true
SW_AGENT_NAME=my-service
SW_AGENT_INSTANCE=my-service-local
SKYOBSERV_USER_TOKEN=so_xxxxxxxx
SKYOBSERV_REGISTER_URL=https://your-skyobserv-host`,
          },
        ],
      },
      {
        title: "Install",
        code: [{ language: "bash", content: "npm install skywalking-backend-js" }],
      },
      {
        title: "Load order",
        body: "The agent patches modules at require-time. instrumentation.ts (or equivalent) must be imported before Express, database clients, Redis, and Prisma.",
        code: [
          {
            language: "typescript",
            content: `// src/index.ts
import "./instrumentation"; // must be the first import
import express from "express";`,
          },
        ],
        callout: {
          kind: "warning",
          text: "If instrumentation loads after express or pg, those libraries will not be traced.",
        },
      },
      {
        title: "instrumentation.ts",
        body: "The snippet below registers the service with SkyObserv and starts the agent. Place this file alongside your entry point.",
        code: [
          {
            language: "typescript",
            content: `import dotenv from "dotenv";
dotenv.config();

import agent from "skywalking-backend-js";

const enabled = process.env.SW_AGENT_ENABLED === "true";

async function resolveCollector(serviceName: string, serviceInstance: string) {
  const token = process.env.SKYOBSERV_USER_TOKEN?.trim();
  const baseUrl = (process.env.SKYOBSERV_REGISTER_URL ?? "http://localhost:5000").replace(/\\/$/, "");
  if (!token) return null;

  const res = await fetch(\`\${baseUrl}/api/agent/register\`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: \`Bearer \${token}\`,
    },
    body: JSON.stringify({ serviceName, serviceInstance }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { collectorAddress?: string };
  return data.collectorAddress ?? null;
}

if (enabled) {
  void (async () => {
    const serviceName = process.env.SW_AGENT_NAME ?? "my-service";
    const serviceInstance = process.env.SW_AGENT_INSTANCE ?? "local";
    const collector = await resolveCollector(serviceName, serviceInstance);
    if (!collector) return;

    agent.start({ serviceName, serviceInstance, collectorAddress: collector });
  })();
}`,
          },
        ],
      },
      {
        title: "Automatically instrumented libraries",
        body: "No additional code is required for these packages when the agent starts first:",
        bullets: [
          "http, https — Node built-in",
          "express",
          "axios",
          "pg, pg-cursor — PostgreSQL",
          "mysql, mysql2",
          "mongodb, mongoose",
          "ioredis — Redis",
          "amqplib — RabbitMQ",
        ],
      },
      {
        title: "Not automatically instrumented",
        bullets: [
          "Prisma — uses a separate query engine; see Prisma guide",
          "redis (node-redis v4+) — use ioredis for automatic tracing",
        ],
      },
      {
        title: "Verify installation",
        ordered: [
          "Set SW_AGENT_ENABLED=true and restart the process.",
          "Confirm the agent log line appears at startup.",
          "Send an HTTP request to any instrumented route.",
          "Open Dashboard → Services and select the time range Last 15 minutes.",
        ],
      },
      {
        title: "Troubleshooting",
        bullets: [
          "Service not visible — confirm SKYOBSERV_USER_TOKEN is valid and registration returns collectorAddress.",
          "Using SW_AGENT_COLLECTOR_BACKEND_SERVICES — remove it; use SKYOBSERV_REGISTER_URL instead.",
          "HTTP traced but not Redis — ensure ioredis is imported after instrumentation.",
          "HTTP traced but not PostgreSQL with Prisma — Prisma requires a client extension; see Prisma guide.",
        ],
      },
    ],
  },
  {
    slug: "java",
    title: "Java agent",
    description: "Attach the SkyWalking Java agent using SkyObserv service registration.",
    category: "languages",
    blocks: [
      {
        title: "Prerequisites",
        bullets: [
          "JDK 8 or later",
          "apache-skywalking-java-agent distribution",
          "SkyObserv API token and register URL (Profile page)",
        ],
      },
      {
        title: "Environment variables",
        code: [
          {
            language: "env",
            content: `SW_AGENT_NAME=orders-api
SW_AGENT_INSTANCE=orders-api-local
SKYOBSERV_USER_TOKEN=so_xxxxxxxx
SKYOBSERV_REGISTER_URL=https://your-skyobserv-host`,
          },
        ],
      },
      {
        title: "Startup script",
        body: "Resolve the gRPC collector from SkyObserv before starting the JVM. No manual OAP hostname is required.",
        code: [
          {
            language: "bash",
            content: `#!/usr/bin/env bash
set -euo pipefail

RESPONSE=$(curl -sf -X POST "\${SKYOBSERV_REGISTER_URL%/}/api/agent/register" \\
  -H "Authorization: Bearer \${SKYOBSERV_USER_TOKEN}" \\
  -H "Content-Type: application/json" \\
  -d "{\\"serviceName\\":\\"\${SW_AGENT_NAME}\\",\\"serviceInstance\\":\\"\${SW_AGENT_INSTANCE:-local}\\"}") 

COLLECTOR=$(echo "$RESPONSE" | jq -r .collectorAddress)

exec java -javaagent:/opt/skywalking/agent/skywalking-agent.jar \\
  -Dskywalking.agent.service_name="\${SW_AGENT_NAME}" \\
  -Dskywalking.collector.backend_service="\${COLLECTOR}" \\
  -jar orders-api.jar`,
            caption: "collectorAddress is returned by SkyObserv — do not hardcode it",
          },
        ],
      },
      {
        title: "Instrumented components",
        bullets: [
          "Spring MVC, Spring WebFlux",
          "JDBC (MySQL, PostgreSQL, H2, and others)",
          "Lettuce, Jedis (Redis)",
          "Apache HttpClient, OkHttp",
          "Kafka, RabbitMQ clients",
          "MongoDB Java driver",
        ],
      },
      {
        title: "Service naming",
        body: "skywalking.agent.service_name must match SW_AGENT_NAME sent to the register endpoint. This is the name that appears in SkyObserv and is used for access control.",
      },
    ],
  },
  {
    slug: "python",
    title: "Python agent",
    description: "Run Flask, Django, or FastAPI with SkyObserv service registration.",
    category: "languages",
    blocks: [
      {
        title: "Install",
        code: [{ language: "bash", content: "pip install apache-skywalking" }],
      },
      {
        title: "Environment variables",
        code: [
          {
            language: "env",
            content: `SW_AGENT_NAME=my-python-api
SW_AGENT_INSTANCE=my-python-api-local
SKYOBSERV_USER_TOKEN=so_xxxxxxxx
SKYOBSERV_REGISTER_URL=https://your-skyobserv-host`,
          },
        ],
      },
      {
        title: "Startup script",
        body: "Register with SkyObserv, export the collector address, then start your app with sw-python. The OAP hostname is not configured manually.",
        code: [
          {
            language: "bash",
            content: `#!/usr/bin/env bash
set -euo pipefail

RESPONSE=$(curl -sf -X POST "\${SKYOBSERV_REGISTER_URL%/}/api/agent/register" \\
  -H "Authorization: Bearer \${SKYOBSERV_USER_TOKEN}" \\
  -H "Content-Type: application/json" \\
  -d "{\\"serviceName\\":\\"\${SW_AGENT_NAME}\\",\\"serviceInstance\\":\\"\${SW_AGENT_INSTANCE:-local}\\"}") 

export SW_AGENT_COLLECTOR_BACKEND_SERVICES=$(echo "$RESPONSE" | jq -r .collectorAddress)

exec sw-python run -p uvicorn main:app --host 0.0.0.0 --port 8000`,
            caption: "FastAPI example; same pattern for Flask and Django",
          },
        ],
      },
      {
        title: "Instrumented libraries",
        bullets: [
          "Flask, Django, FastAPI",
          "requests, urllib3",
          "psycopg2, PyMySQL",
          "redis-py",
          "Kafka, Celery",
        ],
      },
      {
        title: "ORM note",
        body: "Django ORM and SQLAlchemy queries are traced when the underlying driver plugin is active. If spans are missing, confirm the database driver is on the supported list above.",
        callout: {
          kind: "note",
          text: "See ORMs & frameworks for language-specific ORM behaviour.",
        },
      },
    ],
  },
  {
    slug: "redis",
    title: "Redis",
    description: "How Redis backends are discovered and displayed in traces and topology.",
    category: "data",
    blocks: [
      {
        title: "Prerequisite",
        body: "Complete Node.js agent setup with SKYOBSERV_USER_TOKEN and SKYOBSERV_REGISTER_URL first (see Node.js agent guide). Redis tracing depends on the agent being registered and started before the Redis client is created.",
      },
      {
        title: "Node.js",
        body: "skywalking-backend-js instruments ioredis automatically. Import instrumentation before creating the client.",
        code: [
          {
            language: "typescript",
            content: `import "./instrumentation";
import Redis from "ioredis";

export const redis = new Redis(process.env.REDIS_URL);`,
          },
        ],
      },
      {
        title: "node-redis package",
        body: "The redis npm package (v4 and later) is not on the default instrumentation list. Use ioredis, or accept that Redis calls will not appear as exit spans.",
      },
      {
        title: "UI behaviour",
        bullets: [
          "Topology — an edge from your service to the Redis peer (host:port).",
          "Storage — a Redis card when calls occur in the selected time range.",
          "Traces — exit spans on the Cache layer with command details.",
        ],
      },
      {
        title: "Java and Python",
        bullets: [
          "Java — Lettuce and Jedis are instrumented by the Java agent.",
          "Python — redis-py is instrumented by apache-skywalking.",
        ],
      },
    ],
  },
  {
    slug: "databases",
    title: "Relational and document databases",
    description: "Driver-level instrumentation, Storage page behaviour, and ORM limitations.",
    category: "data",
    blocks: [
      {
        title: "Prerequisite",
        body: "Instrument your service with a SkyWalking agent registered via SKYOBSERV_REGISTER_URL (see Introduction and your language guide). Database spans appear only after the agent is running — no separate collector configuration is required.",
      },
      {
        title: "How database spans are created",
        body: "SkyWalking agents create exit spans at the database driver boundary. The span includes database type, peer address (host:port), statement or operation name, and duration. Topology derives storage nodes from these peer addresses.",
      },
      {
        title: "Node.js — supported drivers",
        bullets: [
          "PostgreSQL — pg",
          "MySQL — mysql, mysql2",
          "MongoDB — mongodb, mongoose",
        ],
        code: [
          {
            language: "typescript",
            content: `import "./instrumentation";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });`,
          },
        ],
      },
      {
        title: "UI behaviour",
        bullets: [
          "Storage lists detected backends (from traces or manual configuration).",
          "Topology shows a dependency edge to the database peer.",
          "Trace detail shows Database-layer exit spans with latency.",
        ],
      },
      {
        title: "ORMs",
        body: "ORMs such as Prisma, TypeORM, and Sequelize do not always invoke instrumented drivers in a way the agent can intercept. When no spans appear, follow the framework-specific guide. As a fallback, you may register a storage backend manually under Profile → Storage backends; it will appear as Configured until tracing is enabled.",
        callout: {
          kind: "note",
          text: "Manual registration does not produce query spans. It only documents the dependency in the Storage view.",
        },
      },
      {
        title: "Environment variables",
        body: "No additional environment variables are required for database tracing. Query spans include the operation or statement text by default. Bind-parameter values are not captured unless you explicitly enable them in the upstream SkyWalking agent — that setting is off by default and is not part of the standard SkyObserv setup.",
        callout: {
          kind: "info",
          text: "Do not add SW_SQL_TRACE_PARAMETERS to your .env for normal use. Traces, topology, and the Storage page work without it.",
        },
      },
    ],
  },
  {
    slug: "prisma",
    title: "Prisma",
    description: "Add database exit spans for Prisma Client on Node.js.",
    category: "frameworks",
    blocks: [
      {
        title: "Prerequisite",
        body: "The SkyWalking Node agent must be running with SKYOBSERV_USER_TOKEN and SKYOBSERV_REGISTER_URL (see Node.js agent guide). Prisma tracing is an extension on top of that agent — it does not replace registration.",
      },
      {
        title: "Background",
        body: "Prisma Client communicates with a Rust query engine. Calls do not pass through the pg driver that skywalking-backend-js instruments. Without additional setup, HTTP and Redis may be traced while PostgreSQL is not.",
      },
      {
        title: "Approach",
        body: "Use a Prisma Client extension ($extends) to wrap each query in a SkyWalking exit span. Prisma 6 removed the older $use middleware API; extensions are the supported method.",
      },
      {
        title: "Extension module",
        code: [
          {
            language: "typescript",
            content: `// lib/skywalkingPrisma.ts
import type { PrismaClient } from "@prisma/client";
import { ContextManager } from "skywalking-backend-js";
import AgentConfig from "skywalking-backend-js/lib/config/AgentConfig";
import { wrapPromise } from "skywalking-backend-js/lib/core/SwPlugin";
import { SpanLayer } from "skywalking-backend-js/lib/proto/language-agent/Tracing_pb";
import Tag from "skywalking-backend-js/lib/Tag";
import { Component } from "skywalking-backend-js/lib/trace/Component";

export function withSkyWalkingTracing<T extends PrismaClient>(
  client: T,
  info: { dbType: string; peer: string; dbName: string },
): T {
  const component = Component.POSTGRESQL;
  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const span = ContextManager.current.newExitSpan(
            \`\${info.dbType}/\${model}/\${operation}\`,
            component,
          );
          span.start();
          span.component = component;
          span.layer = SpanLayer.DATABASE;
          span.peer = info.peer;
          span.tag(Tag.dbType(info.dbType));
          span.tag(Tag.dbInstance(info.dbName));
          span.tag(Tag.dbStatement(\`\${model} \${operation}\`));
          if (AgentConfig.sqlTraceParameters && args) {
            span.tag(Tag.dbSqlParameters(JSON.stringify(args)));
          }
          const result = wrapPromise(span, query(args));
          span.async();
          return result;
        },
      },
    },
  }) as unknown as T;
}`,
          },
        ],
      },
      {
        title: "Apply in prisma.ts",
        code: [
          {
            language: "typescript",
            content: `import { PrismaClient } from "@prisma/client";
import { withSkyWalkingTracing } from "./skywalkingPrisma";

function createPrismaClient() {
  const base = new PrismaClient();
  if (process.env.SW_AGENT_ENABLED !== "true" || !process.env.DATABASE_URL) {
    return base;
  }
  const url = new URL(process.env.DATABASE_URL.replace(/^postgres:/, "postgresql:"));
  return withSkyWalkingTracing(base, {
    dbType: "PostgreSQL",
    peer: \`\${url.hostname}:\${url.port || "5432"}\`,
    dbName: url.pathname.replace(/^\\//, "") || "postgres",
  });
}

export const prisma = createPrismaClient();`,
          },
        ],
      },
      {
        title: "Verification",
        ordered: [
          "Confirm instrumentation.ts loads before prisma.ts.",
          "Restart the application and send requests that execute Prisma queries.",
          "Open Storage — PostgreSQL should show Active, not only Configured.",
          "Open a trace — expect exit spans named PostgreSQL/ModelName/operation.",
        ],
      },
    ],
  },
  {
    slug: "orm-frameworks",
    title: "ORMs and frameworks",
    description: "Tracing behaviour for common ORMs across Node.js, Java, and Python.",
    category: "frameworks",
    blocks: [
      {
        title: "Summary",
        body: "Agents instrument drivers and, in some runtimes, framework integrations. When an ORM bypasses those hooks, spans will not appear until you add framework-specific instrumentation or switch to a supported driver path.",
      },
      {
        title: "Node.js",
        bullets: [
          "Prisma — requires Client extension; see Prisma guide",
          "TypeORM — uses pg/mysql2; often traced if the agent starts before DataSource initialization",
          "Sequelize — partial tracing via underlying driver plugins",
          "Mongoose — instrumented by the mongoose plugin when the agent is active",
        ],
      },
      {
        title: "Python",
        bullets: [
          "Django ORM — traced via sw-python when using psycopg2 or mysqlclient underneath",
          "SQLAlchemy — traced when the DBAPI driver is instrumented",
        ],
      },
      {
        title: "Java",
        bullets: [
          "Hibernate / JPA — JDBC calls are traced by the Java agent; no extension required",
          "Spring Data JPA — inherits JDBC instrumentation",
        ],
      },
      {
        title: "OpenTelemetry",
        body: "For frameworks without a SkyWalking plugin, you may export OpenTelemetry traces to OAP through the OTLP receiver. This requires separate SDK configuration and is outside the scope of the standard SkyObserv agent setup.",
      },
    ],
  },
];

export function getDocTopic(slug: string): DocTopic | undefined {
  return DOC_TOPICS.find((t) => t.slug === slug);
}

export function getDocsByCategory(category: DocCategory): DocTopic[] {
  return DOC_TOPICS.filter((t) => t.category === category);
}
