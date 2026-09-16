# Graph Report - SkyObserv  (2026-09-15)

## Corpus Check
- 271 files · ~313,099 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2160 nodes · 4036 edges · 209 communities (114 shown, 95 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 85 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `596e56af`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- message-thread-full.tsx
- card.tsx
- tambo-tools.ts
- devDependencies
- cn
- SkyObserv - Observability
- compilerOptions
- use-toast.ts
- AppLayout.tsx
- utils.ts
- index.ts
- K8sNamespaceDetailPage.tsx
- useDurationStore
- dependencies
- index.js
- package.json
- chart.tsx
- command.tsx
- menubar.tsx
- mock-oap/package.json
- QUERIES.md
- button.tsx
- form.tsx
- SkyWalking OAP on Oracle Cloud (Always Free)
- carousel.tsx
- dropdown-menu.tsx
- TracesPage.tsx
- context-menu.tsx
- useDurationStore.ts
- alert-dialog.tsx
- table.tsx
- breadcrumb.tsx
- drawer.tsx
- navigation-menu.tsx
- sheet.tsx
- toggle-group.tsx
- queryClient.ts
- vite.ts
- alert.tsx
- accordion.tsx
- avatar.tsx
- ai-context.ts
- message-suggestions.tsx
- resizable.tsx
- @apollo/client
- class-variance-authority
- clsx
- cmdk
- connect-pg-simple
- date-fns
- dotenv
- embla-carousel-react
- express-session
- framer-motion
- highlight.js
- @hookform/resolvers
- input-otp
- @jridgewell/trace-mapping
- json-stringify-pretty-compact
- lucide-react
- memorystore
- next-themes
- thread-container.tsx
- useSidebar
- express
- graphql
- passport-local
- pg
- radix-ui
- @radix-ui/react-accordion
- @radix-ui/react-alert-dialog
- @radix-ui/react-aspect-ratio
- @radix-ui/react-avatar
- @radix-ui/react-checkbox
- @radix-ui/react-collapsible
- @radix-ui/react-context-menu
- @radix-ui/react-dialog
- @radix-ui/react-dropdown-menu
- @radix-ui/react-label
- @radix-ui/react-menubar
- @radix-ui/react-navigation-menu
- @radix-ui/react-popover
- @radix-ui/react-progress
- @radix-ui/react-radio-group
- @radix-ui/react-scroll-area
- @radix-ui/react-select
- @radix-ui/react-separator
- @radix-ui/react-slider
- @radix-ui/react-switch
- @radix-ui/react-tabs
- @radix-ui/react-toast
- @radix-ui/react-toggle
- @radix-ui/react-tooltip
- react-day-picker
- react-dom
- react-force-graph-2d
- react-resizable-panels
- react-xarrows
- recharts
- tailwind-merge
- tailwindcss-animate
- @tambo-ai/react
- @tambo-ai/typescript-sdk
- @tanstack/react-query
- tw-animate-css
- vaul
- wouter
- ws
- zod
- zod-validation-error
- zustand
- alert.tsx
- input-otp.tsx
- accordion.tsx
- resizable.tsx
- drizzle-orm
- @radix-ui/react-slot
- @radix-ui/react-toggle-group
- react-icons
- react-markdown
- class-variance-authority
- @types/connect-pg-simple
- @types/express
- @types/express-session
- @types/node
- @types/passport
- @types/react-dom
- typescript
- vite
- @vitejs/plugin-react
- thread-container.tsx
- class-variance-authority
- date-fns
- class-variance-authority
- Typography Specifications
- scripts/core.py
- DesignSystemGenerator
- Logo Usage Rules
- Component Specifications
- shadcn/ui Accessibility Patterns
- TestTailwindConfigGenerator
- html-token-validator.py
- search
- Asset Approval Checklist
- Logo AI Prompt Engineering
- Color Palette Management
- CIP Deliverable Guide
- BM25
- States and Variants
- UI Styling Skill
- Workflow
- Design System
- Tailwind CSS Customization
- spacing
- generate-slide.py
- shadcn/ui Theming & Customization
- TailwindConfigGenerator
- test_design_system_mode.py
- Asset Organization Guide
- Primary Color Meanings
- Core Logo Types
- color
- Brand Consistency Checklist
- CIP Mockup Prompt Engineering
- fetch-background.py
- test_data_contracts.py
- TestThresholdGate
- Design Principles
- Design Principles
- icon/generate.py
- fontSize
- .add_components
- TestShadcnInstaller
- CatalogRefreshTest
- CIP Design Reference
- Icon Design Reference
- Copywriting Formulas
- Copywriting Formulas
- main
- _palette_is_dark
- _select_palette_for_mode
- input
- button
- K8sPodTopologyPanel.tsx
- 12
- 4
- destructive
- tailwindcss
- K8sResourceDrawer.tsx
- TestStyleTaxonomy
- date-fns
- alert.tsx
- react-icons
- @tailwindcss/vite
- class-variance-authority
- @tanstack/react-query

## God Nodes (most connected - your core abstractions)
1. `cn()` - 148 edges
2. `useDurationStore` - 35 edges
3. `IncidentRecord` - 31 edges
4. `_api()` - 26 edges
5. `useAuth()` - 20 edges
6. `service_detail()` - 20 edges
7. `Button` - 18 edges
8. `discover_istio_topology()` - 18 edges
9. `Card` - 17 edges
10. `IncidentState` - 17 edges

## Surprising Connections (you probably didn't know these)
- `createMarkdownComponents()` --references--> `dompurify`  [EXTRACTED]
  client/src/components/tambo/markdownComponents.tsx → package.json
- `test_coalesce_fragmented_legacy_steps()` --calls--> `coalesce_remediation_steps()`  [INFERRED]
  cluster-monitoring/backend/tests/test_remediation_parser.py → cluster-monitoring/backend/src/incident_commander/services/remediation_parser.py
- `User` --inherits--> `SkyobservUser`  [EXTRACTED]
  server/types.d.ts → shared/schema.ts
- `MetricItem()` --calls--> `cn()`  [EXTRACTED]
  client/src/components/k8s/K8sPodResourceCard.tsx → client/src/lib/utils.ts
- `TopologyNode()` --calls--> `cn()`  [EXTRACTED]
  client/src/components/k8s/K8sPodTopologyPanel.tsx → client/src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (209 total, 95 thin omitted)

### Community 0 - "message-thread-full.tsx"
Cohesion: 0.08
Nodes (52): _extract_pod_scheduling(), find_scheduling_reference(), get_deployment_info(), list_healthy_deployment_scheduling(), Any, V1Toleration, Expose both literal values and valueFrom refs so agents can spot broken ConfigMa, Return scheduling config from healthy deployments in the same namespace. (+44 more)

### Community 1 - "card.tsx"
Cohesion: 0.06
Nodes (35): client, httpLink, GET_ALL_DATABASES, GET_DATABASE_METRICS, GET_TRACE_DETAILS, GET_TRACES_FOR_DB, GET_ALL_SERVICES, GET_SERVICE_ENDPOINTS (+27 more)

### Community 2 - "tambo-tools.ts"
Cohesion: 0.18
Nodes (12): GET_LINEAR_INT_VALUES, GET_SERVICE_METRICS, METRICS, MetricChart(), MetricChartProps, DrawerContent(), TabsContent, TabsList (+4 more)

### Community 3 - "devDependencies"
Cohesion: 0.13
Nodes (15): autoprefixer, drizzle-kit, devDependencies, autoprefixer, drizzle-kit, postcss, @tailwindcss/typography, tsx (+7 more)

### Community 4 - "cn"
Cohesion: 0.08
Nodes (42): ResizableHandle(), ResizablePanelGroup(), Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader() (+34 more)

### Community 5 - "SkyObserv - Observability"
Cohesion: 0.14
Nodes (14): Access the Application, Adding New AI Tools, Adding New TamboAI Components, Architecture, AWS infrastructure (Terraform), Core APM Features, Development, Development Mode (+6 more)

### Community 6 - "compilerOptions"
Cohesion: 0.07
Nodes (30): build, client/src/**/*, dist, node, server/**/*, shared/**/*, **/*.test.ts, vite/client (+22 more)

### Community 7 - "use-toast.ts"
Cohesion: 0.12
Nodes (24): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+16 more)

### Community 8 - "AppLayout.tsx"
Cohesion: 0.07
Nodes (36): GenerationStageProps, MessageGenerationStage(), MessageInput, MessageInputError(), MessageInputProps, MessageInputSubmitButton(), MessageInputTextarea(), MessageInputToolbar() (+28 more)

### Community 9 - "utils.ts"
Cohesion: 0.05
Nodes (27): ThreadDropdown, ThreadDropdownProps, TooltipContent, TooltipProps, Alert, AlertDescription, AlertTitle, alertVariants (+19 more)

### Community 10 - "index.ts"
Cohesion: 0.17
Nodes (17): createUser(), CreateUserInput, ensureAuthSchema(), ensureBootstrapAdmin(), isAuthEnabled(), PgSession, publicUser(), requireAuth() (+9 more)

### Community 11 - "K8sNamespaceDetailPage.tsx"
Cohesion: 0.11
Nodes (37): BaseChatModel, build_git_agent(), build_kubernetes_agent(), build_logs_agent(), build_observability_agent(), build_remediation_agent(), build_root_cause_agent(), Factory for specialist LangChain agents. (+29 more)

### Community 12 - "useDurationStore"
Cohesion: 0.12
Nodes (21): CustomRangePicker(), AddStorageBackendDialog(), Props, DialogContent, DialogDescription, DialogFooter(), DialogHeader(), DialogOverlay (+13 more)

### Community 13 - "dependencies"
Cohesion: 0.11
Nodes (19): class-variance-authority, @hookform/resolvers, next-themes, dependencies, class-variance-authority, @hookform/resolvers, next-themes, @radix-ui/react-tooltip (+11 more)

### Community 14 - "index.js"
Cohesion: 0.14
Nodes (18): app, { buildSchema }, cors, DATABASES, ENDPOINTS, express, generateSpans(), generateTraces() (+10 more)

### Community 15 - "package.json"
Cohesion: 0.18
Nodes (10): bufferutil, @esbuild-kit/esm-loader, license, name, optionalDependencies, bufferutil, overrides, drizzle-kit (+2 more)

### Community 16 - "chart.tsx"
Cohesion: 0.08
Nodes (42): _api(), Return (CoreV1Api, AppsV1Api) for `context`, the active investigation     contex, _coerce_exec_output(), _deployment_match_labels(), format_probe_result(), _guess_container_port(), probe_http_url(), probe_service_in_cluster() (+34 more)

### Community 17 - "command.tsx"
Cohesion: 0.06
Nodes (27): buildFlowSteps(), FlowStep, HEALTH_COLOR, Props, ServiceTopologyGraph(), AuditEvent, AuthorizationPolicyDetail, ContainerInfo (+19 more)

### Community 18 - "menubar.tsx"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 19 - "mock-oap/package.json"
Cohesion: 0.12
Nodes (16): cors, express-graphql, dependencies, cors, express, express-graphql, graphql, description (+8 more)

### Community 20 - "QUERIES.md"
Cohesion: 0.12
Nodes (15): 🔥 11️⃣ Pod Memory Usage, 🔥 12️⃣ Total Pods in Cluster, 🔥 13️⃣ Node Status, 🧠 1️⃣ List Clusters (K8S Layer), 🧠 2️⃣ List K8S Services (Namespace level services), 🧠 3️⃣ List Pods (Instances of Service), 🧠 4️⃣ Get Single Pod Detail, 🧠 5️⃣ List ALL Available Metrics (+7 more)

### Community 21 - "button.tsx"
Cohesion: 0.09
Nodes (20): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+12 more)

### Community 22 - "form.tsx"
Cohesion: 0.22
Nodes (9): scripts, build, check, db:push, dev, graphify:update, graphify:watch, start (+1 more)

### Community 23 - "SkyWalking OAP on Oracle Cloud (Always Free)"
Cohesion: 0.17
Nodes (9): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+1 more)

### Community 24 - "carousel.tsx"
Cohesion: 0.09
Nodes (26): PodCard(), DatabaseListCard(), DBInsightsCard(), DetailedMetricsCard(), Props, EndpointsListCard(), Props, ServiceInstancesCard() (+18 more)

### Community 25 - "dropdown-menu.tsx"
Cohesion: 0.09
Nodes (29): DurationSelector(), ranges, OPTIONS, ThemeToggle(), AppLayoutProps, TAMBO_SYSTEM_PROMPT, Button, DropdownMenuCheckboxItem (+21 more)

### Community 26 - "TracesPage.tsx"
Cohesion: 0.10
Nodes (35): _build_env_inventory(), _build_topology_graph(), cluster_connectivity(), cluster_overview(), _container_state(), _enrich_env_from_inventory(), _fetch_config_map_env_keys(), _fetch_secret_env_keys() (+27 more)

### Community 27 - "context-menu.tsx"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 28 - "useDurationStore.ts"
Cohesion: 0.10
Nodes (25): FIX_ACTION_ICON, IncidentDetailPage(), PageProps, STATUS_COLOR, IncidentsPage(), paginationBtn, presetToSince(), presetToUntil() (+17 more)

### Community 29 - "alert-dialog.tsx"
Cohesion: 0.12
Nodes (32): approve_incident(), create_incident(), CreateIncidentRequest, _fix_progress_page(), fix_status(), get_incident(), get_incident_detail(), _html_page() (+24 more)

### Community 30 - "table.tsx"
Cohesion: 0.12
Nodes (27): formatRelativeTime(), GuideChat(), Props, StreamingAssistant, SUGGESTED, BLOCKED, Props, RetryInvestigationButton() (+19 more)

### Community 31 - "breadcrumb.tsx"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 32 - "drawer.tsx"
Cohesion: 0.13
Nodes (29): initial_state(), active_context(), Make `context` the default cluster for `_api()` calls inside the block., append_log(), finish_job(), approve_and_fix(), _attach_fix_plan(), auto_resolve_open_incidents_in_namespace() (+21 more)

### Community 33 - "navigation-menu.tsx"
Cohesion: 0.13
Nodes (28): AppsV1Api, _api_clients(), _app_containers(), call_with_auth_retry(), ensure_credentials(), fetch_pod_logs(), invalidate_api_clients(), _k8s_call() (+20 more)

### Community 34 - "sheet.tsx"
Cohesion: 0.15
Nodes (27): build_istio_topology_graph(), _custom_api(), discover_istio_topology(), _empty_topology(), _extract_route_destinations(), _host_matches_services(), _labels_match(), _list_crd() (+19 more)

### Community 35 - "toggle-group.tsx"
Cohesion: 0.07
Nodes (27): dependencies, next, react, react-dom, react-markdown, remark-gfm, devDependencies, @types/node (+19 more)

### Community 36 - "queryClient.ts"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 37 - "vite.ts"
Cohesion: 0.33
Nodes (3): viteLogger, __dirname, __filename

### Community 38 - "alert.tsx"
Cohesion: 0.18
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 40 - "avatar.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 44 - "@apollo/client"
Cohesion: 0.10
Nodes (19): A single cluster+namespace to watch., Short human-readable label for logs and status display., WatcherTarget, auto_resolve_recovered_service(), Auto-resolve open incidents only for a service that just recovered., _CooldownEntry, K8sWatcher, Main watcher loop — runs indefinitely as a daemon thread.         Updates this t (+11 more)

### Community 45 - "class-variance-authority"
Cohesion: 0.14
Nodes (14): GET_TRACE_DETAILS, GET_TRACES, TraceList(), TraceListProps, Badge(), BadgeProps, badgeVariants, ScrollArea (+6 more)

### Community 47 - "clsx"
Cohesion: 0.09
Nodes (28): GET_EVENTS, GET_INSTANCE_DETAIL, GET_K8S_DASHBOARD, GET_K8S_NODES, GET_MQE_METRICS, GET_NODE_INSTANCES, GET_NODE_METRICS, GET_SERVICE_INSTANCES (+20 more)

### Community 50 - "date-fns"
Cohesion: 0.14
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 51 - "dotenv"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 56 - "@hookform/resolvers"
Cohesion: 0.07
Nodes (26): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+18 more)

### Community 57 - "input-otp"
Cohesion: 0.06
Nodes (39): AppShell(), AuthenticatedApp(), isPublicPath(), FOOTER_LINKS, PublicLayout(), PublicLayoutProps, AccordionContent, AccordionItem (+31 more)

### Community 60 - "lucide-react"
Cohesion: 0.11
Nodes (23): create_app(), lifespan(), Thread, FastAPI Application Entry Point --------------------------------- Creates the Fa, Start uvicorn server — called by `python main.py` or the `incident-api` script., Launch one background daemon thread per WATCHER_TARGETS entry.      Skips silent, FastAPI lifespan: runs setup before serving, cleanup after shutdown., Build and configure the FastAPI application.     Registers all routers and middl (+15 more)

### Community 62 - "next-themes"
Cohesion: 0.18
Nodes (8): GuideMessage, GuideSession, GuideStore, Any, Connection, Path, Row, SQLite persistence for AI Guide chat sessions.

### Community 63 - "thread-container.tsx"
Cohesion: 0.21
Nodes (8): IncidentRecord, IncidentStore, Any, Connection, Path, Row, SQLite-backed incident store shared across API and watcher processes., Returns (records, total_count) with optional filters.         Used by the /incid

### Community 64 - "useSidebar"
Cohesion: 0.08
Nodes (23): git_deployment_history(), git_pipeline_status(), git_recent_commits(), k8s_get_deployment(), k8s_get_events(), k8s_get_healthy_scheduling(), k8s_get_pod_logs(), k8s_get_pods() (+15 more)

### Community 65 - "express"
Cohesion: 0.12
Nodes (21): GuidePage(), PageProps, HEALTH_BG, HEALTH_BORDER, HEALTH_COLOR, HEALTH_ICON, HomePage(), POD_COLOR (+13 more)

### Community 70 - "@radix-ui/react-accordion"
Cohesion: 0.17
Nodes (16): metadata, ServiceCard(), HEALTH_COLOR, Props, ServiceDetailPage(), BrandLogo(), NavBrandLink(), NavLinks() (+8 more)

### Community 72 - "@radix-ui/react-aspect-ratio"
Cohesion: 0.16
Nodes (18): ApiRole, api_auth_enabled(), api_key_middleware(), extract_api_key(), Optional API-key authentication for production deployments., Signed approval links work without the global API key., token_action_authorized(), ApiIdentity (+10 more)

### Community 76 - "@radix-ui/react-context-menu"
Cohesion: 0.18
Nodes (21): create_guide_session(), create_guide_session_from_incident(), CreateGuideSessionRequest, delete_guide_session(), get_guide_session(), GuideMessageResponse, GuideSessionListResponse, GuideSessionResponse (+13 more)

### Community 93 - "@radix-ui/react-tooltip"
Cohesion: 0.15
Nodes (18): _is_unschedulable(), _issue_signature(), _pod_age_seconds(), PodIssue, V1Deployment, V1Pod, K8s Watcher Service ------------------- Runs as a background daemon thread insid, Inspect a single pod and return a PodIssue if it's unhealthy.         Detection (+10 more)

### Community 96 - "react-force-graph-2d"
Cohesion: 0.20
Nodes (20): _alert_summary(), _build_action_block(), _build_compact_summary_block(), build_message_card(), _describe_action(), _format_planned_actions(), _open_uri_action(), _planned_fix_summary() (+12 more)

### Community 103 - "@tambo-ai/typescript-sdk"
Cohesion: 0.17
Nodes (19): _apply_action_to_deployment(), apply_fix_plan(), _build_tolerations(), _find_container(), get_deployment_revision(), _kubectl_env(), Any, Exception (+11 more)

### Community 104 - "@tanstack/react-query"
Cohesion: 0.19
Nodes (12): AppLayout(), SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger (+4 more)

### Community 105 - "tw-animate-css"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 117 - "alert.tsx"
Cohesion: 0.18
Nodes (16): extract_service_name(), is_listing_intent(), is_ops_related(), Ops-only gate for AI Guide — rejects off-topic questions., Return (allowed, reason)., True when the user wants a resource list/count, not a specific deployment fix., Pick the most likely deployment/service name from user text., test_extract_service_name_from_message() (+8 more)

### Community 118 - "input-otp.tsx"
Cohesion: 0.19
Nodes (15): classify_guide_intent(), _extract_resource_name(), GuideIntent, Deterministic routing for AI Guide — skip LLM when intent is unambiguous., Classify a guide message into a deterministic or LLM path., Run tools directly for listing/get intents.     Returns (intent, markdown_respon, run_deterministic_guide(), Tests for deterministic AI Guide intent routing. (+7 more)

### Community 119 - "accordion.tsx"
Cohesion: 0.23
Nodes (15): build_guide_agent(), _build_prompt(), _extract_urls(), _iter_agent_events(), iter_message_stream(), _last_ai_content(), _message_response(), _normalize_content() (+7 more)

### Community 121 - "drizzle-orm"
Cohesion: 0.23
Nodes (7): AuditEvent, AuditStore, Any, Connection, Path, Row, Persistent audit trail for incident lifecycle events.

### Community 123 - "@radix-ui/react-toggle-group"
Cohesion: 0.38
Nodes (10): getClient(), getConfig(), isEmailConfigured(), sendPasswordResetOtp(), generateOtpCode(), isValidEmail(), normalizeEmail(), otpExpiryDate() (+2 more)

### Community 124 - "react-icons"
Cohesion: 0.40
Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 128 - "@types/express"
Cohesion: 0.22
Nodes (12): get_deployment(), get_events(), get_healthy_scheduling_references(), get_pod_logs(), get_pods(), Kubernetes MCP server logic — mock or real dev cluster., Return nodeSelector/tolerations from healthy deployments in the namespace., Return pod status for a service in a namespace. (+4 more)

### Community 130 - "@types/node"
Cohesion: 0.31
Nodes (10): BaseModel, Teams webhook test and status routes., teams_status(), teams_test(), TeamsStatusResponse, TeamsTestResponse, is_teams_configured(), Exception (+2 more)

### Community 136 - "thread-container.tsx"
Cohesion: 0.19
Nodes (14): createMarkdownComponents(), looksLikeCode(), Message(), MessageContent(), MessageRenderedComponentArea(), ThreadContainer, ThreadContainerProps, useThreadContainerContext() (+6 more)

### Community 137 - "class-variance-authority"
Cohesion: 0.18
Nodes (10): API auth, Backend, Cluster Monitoring, Config, Folder structure, Frontend, Getting started, Tests (+2 more)

### Community 138 - "date-fns"
Cohesion: 0.11
Nodes (18): Express, User, api, Duration, InsertSkyobservUser, insertSkyobservUserSchema, InsertUserPreference, insertUserPreferenceSchema (+10 more)

### Community 139 - "class-variance-authority"
Cohesion: 0.27
Nodes (7): create_session(), create_session_from_incident(), get_session(), _prepare_message(), Tests for AI Guide session lifecycle (dedup, empty cleanup)., test_create_session_from_incident_reuses_existing(), GuideSession

### Community 140 - "Typography Specifications"
Cohesion: 0.20
Nodes (10): 1. Provision infra, 2. Remote state (optional but recommended), 3. GitHub secrets, 4. Env file on EC2, 5. Deploy, 6. Production approval gate, 7. CloudWatch (manual — AWS console), 8. Destroy (+2 more)

### Community 141 - "scripts/core.py"
Cohesion: 0.47
Nodes (8): _action_links(), build_approve_url(), build_manual_resolve_url(), build_reject_url(), build_retry_investigation_url(), build_rollback_url(), make_approval_token(), Signed approval tokens for remediation links.

### Community 142 - "DesignSystemGenerator"
Cohesion: 0.39
Nodes (8): AlertmanagerAlert, AlertmanagerWebhook, AlertWebhookRequest, BaseModel, Webhook endpoints for external alert sources., receive_alert(), receive_alertmanager(), run_investigation()

### Community 143 - "Logo Usage Rules"
Cohesion: 0.36
Nodes (7): incident_matches_scope(), Match incidents to the active cluster context + namespace., True when an incident belongs to the cluster/namespace being viewed., _inc(), test_incident_matches_selected_cluster_only(), test_incident_requires_matching_namespace(), test_legacy_untagged_incident_shows_in_scoped_namespace_view()

### Community 144 - "Component Specifications"
Cohesion: 0.22
Nodes (9): Complex Queries, Database Queries, Endpoint Queries, Instance Queries, Metrics Queries, Service Queries, TamboAI Natural Language Queries, Topology Queries (+1 more)

### Community 145 - "shadcn/ui Accessibility Patterns"
Cohesion: 0.22
Nodes (9): CD — build-push job, CD — deploy-production job, CD — deploy-staging job, CD Pipeline — Waiting for Production Approval, CI Checks on Pull Request, CI Pipeline — All Checks Passed, CI — scan job steps, CI — test job steps (+1 more)

### Community 146 - "TestTailwindConfigGenerator"
Cohesion: 0.25
Nodes (8): 1. GHCR rejects image names with uppercase letters, 2. Docker login fails in the SSH deploy step, 3. RDS refusing connections after deploy, 4. EBS disk filled up, container stopped starting, 5. CloudWatch memory and disk widgets showing no data, 6. CloudWatch agent wasn't installed on the existing EC2, 7. /var/log/messages missing on Amazon Linux 2023, Challenges & Resolutions

### Community 147 - "html-token-validator.py"
Cohesion: 0.25
Nodes (7): get_deployment_history(), get_pipeline_status(), get_recent_commits(), Git / CI MCP server logic (mock implementation)., Return recent commits related to a service., Return latest CI/CD pipeline status for a service., Return recent deployment history.

### Community 148 - "search"
Cohesion: 0.25
Nodes (7): get_alerts(), get_service_health(), query_metrics(), Prometheus / monitoring MCP server logic (mock implementation)., Query latency, error rate and request metrics for a service., Return active monitoring alerts., Return overall service health summary.

### Community 149 - "Asset Approval Checklist"
Cohesion: 0.39
Nodes (4): Any, T, Short-lived in-memory cache for expensive cluster read endpoints., TTLCache

### Community 150 - "Logo AI Prompt Engineering"
Cohesion: 0.25
Nodes (8): Architecture, Architecture decisions, Backup strategy, Cost optimization, Security considerations, SkyObserv — DevOps Setup, Troubleshooting, What Terraform creates

### Community 151 - "Color Palette Management"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 152 - "CIP Deliverable Guide"
Cohesion: 0.33
Nodes (6): EnvFromPanel(), EnvKeyTable(), EnvTablePanel(), isSensitive(), EnvEntry, EnvFromSource

### Community 153 - "BM25"
Cohesion: 0.29
Nodes (7): Access Log Events, CloudWatch Dashboards List, CloudWatch Log Groups, Part 3 — Monitoring & Logging, skyobserv-app Dashboard, skyobserv-infra Dashboard, skyobserv-rds Dashboard

### Community 154 - "States and Variants"
Cohesion: 0.29
Nodes (7): App Running on EC2, EC2 Instance — Running, Part 1 — Infrastructure (Terraform), Part 4 — Application, RDS — Available, Screenshots, Terraform State — Provisioned Resources

### Community 155 - "UI Styling Skill"
Cohesion: 0.57
Nodes (6): canManageTeam(), generateTempPassword(), inviteTeamMember(), listTeamMembers(), removeTeamMember(), resetTeamMemberPassword()

### Community 156 - "Workflow"
Cohesion: 0.40
Nodes (4): createMarkdownComponents(), looksLikeCode(), dompurify, dompurify

### Community 157 - "Design System"
Cohesion: 0.47
Nodes (5): FixJobState, get_job(), In-memory tracker for async approve/fix jobs and their live logs., Create a running job, or return None if one is already active., start_job()

### Community 158 - "Tailwind CSS Customization"
Cohesion: 0.47
Nodes (5): fetch_service_istio_summary(), fetch_service_istio_topology(), Fetch Istio topology for a deployment — shared by cluster API and AI Guide., Return Istio resources linked to a deployment name in a namespace., _service_matches_pods()

### Community 159 - "spacing"
Cohesion: 0.33
Nodes (4): DATE_PRESETS, Props, SOURCE_OPTIONS, STATUS_OPTIONS

### Community 161 - "generate-slide.py"
Cohesion: 0.40
Nodes (3): K8sPodTopologyPanel(), Props, TopologyNode()

### Community 162 - "shadcn/ui Theming & Customization"
Cohesion: 0.60
Nodes (4): ManualResolveToggle(), Props, RESOLVED_LIKE, TERMINAL

### Community 163 - "TailwindConfigGenerator"
Cohesion: 0.40
Nodes (5): 1. Clone the Repository, 2. Install Dependencies, 3. Docker Build, 3. Environment Configuration, Installation

### Community 165 - "Asset Organization Guide"
Cohesion: 0.50
Nodes (4): APM & Monitoring, Backend, Frontend, Tech Stack

### Community 166 - "Primary Color Meanings"
Cohesion: 0.50
Nodes (4): Prerequisites, Setting Demo App to test Observability, Setting up Elastic Search and Kibana, Setting up SkyWalking

### Community 205 - "_select_palette_for_mode"
Cohesion: 0.13
Nodes (19): app, __dirname, distPath, __filename, hasProductionBuild, httpServer, PORT, requestLogMiddleware() (+11 more)

### Community 207 - "input"
Cohesion: 0.18
Nodes (21): assertGraphQLAccess(), canAccessService(), collectServiceNamesFromVariables(), decodeSkyWalkingServiceId(), emptyK8sListServiceFields(), encodeSkyWalkingServiceId(), fetchGlobalTopology(), filterByServiceName() (+13 more)

### Community 222 - "button"
Cohesion: 0.28
Nodes (13): createStorageBackendForUser(), deleteStorageBackendForUser(), getStorageBackendForUser(), listStorageBackendsForUser(), StorageBackendView, toView(), getAccountOwnerId(), configuredStorageId() (+5 more)

### Community 245 - "12"
Cohesion: 0.29
Nodes (6): _parse_watcher_targets(), Application Configuration -------------------------- Loaded once from backend/.e, Parse WATCHER_TARGETS env var into a list of WatcherTarget.      Format: "contex, Settings, dotenv, dotenv

## Knowledge Gaps
- **605 isolated node(s):** `httpLink`, `GET_NODE_METRICS`, `GET_NODE_INSTANCES`, `GET_TOPOLOGY`, `GET_SERVICE_TOPOLOGY` (+600 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **95 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `K8sResourceDrawer.tsx`, `TestStyleTaxonomy`, `package.json`, `alert.tsx`, `react-icons`, `Workflow`, `class-variance-authority`, `@tanstack/react-query`, `accordion.tsx`, `color`, `cmdk`, `connect-pg-simple`, `Design Principles`, `icon/generate.py`, `embla-carousel-react`, `express-session`, `framer-motion`, `highlight.js`, `fontSize`, `.add_components`, `@jridgewell/trace-mapping`, `json-stringify-pretty-compact`, `TestShadcnInstaller`, `memorystore`, `CatalogRefreshTest`, `graphql`, `passport-local`, `pg`, `radix-ui`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-popover`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `@radix-ui/react-scroll-area`, `@radix-ui/react-select`, `@radix-ui/react-separator`, `@radix-ui/react-slider`, `@radix-ui/react-switch`, `@radix-ui/react-tabs`, `@radix-ui/react-toast`, `resizable.tsx`, `@radix-ui/react-toggle`, `react-day-picker`, `react-dom`, `react-resizable-panels`, `react-xarrows`, `recharts`, `tailwind-merge`, `tailwindcss-animate`, `@tambo-ai/react`, `vaul`, `wouter`, `ws`, `zod`, `zod-validation-error`, `zustand`, `12`, `destructive`, `@radix-ui/react-slot`, `react-markdown`, `class-variance-authority`?**
  _High betweenness centrality (0.351) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `tambo-tools.ts`, `use-toast.ts`, `thread-container.tsx`, `AppLayout.tsx`, `utils.ts`, `useDurationStore`, `menubar.tsx`, `button.tsx`, `SkyWalking OAP on Oracle Cloud (Always Free)`, `carousel.tsx`, `dropdown-menu.tsx`, `Color Palette Management`, `context-menu.tsx`, `Workflow`, `breadcrumb.tsx`, `generate-slide.py`, `alert.tsx`, `avatar.tsx`, `class-variance-authority`, `clsx`, `date-fns`, `dotenv`, `input-otp`, `@tanstack/react-query`, `tw-animate-css`, `react-icons`?**
  _High betweenness centrality (0.331) - this node is a cross-community bridge._
- **Why does `dompurify` connect `Workflow` to `thread-container.tsx`, `dependencies`?**
  _High betweenness centrality (0.289) - this node is a cross-community bridge._
- **What connects `httpLink`, `GET_NODE_METRICS`, `GET_NODE_INSTANCES` to the rest of the system?**
  _605 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `message-thread-full.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07896575821104122 - nodes in this community are weakly interconnected._
- **Should `card.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06382978723404255 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._