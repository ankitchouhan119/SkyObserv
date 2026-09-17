# Graph Report - SkyObserv  (2026-09-17)

## Corpus Check
- 206 files · ~275,032 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1404 nodes · 2579 edges · 181 communities (89 shown, 92 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3603611c`
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
- drizzle.config.ts
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
- CustomRangePicker.tsx
- autoprefixer
- Logo AI Prompt Engineering
- teamAccess.ts
- BM25
- States and Variants
- Workflow
- generate-slide.py
- Design Principles
- Design Principles
- icon/generate.py
- fontSize
- .add_components
- TestShadcnInstaller
- CatalogRefreshTest
- Copywriting Formulas
- main
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
- @tanstack/react-query

## God Nodes (most connected - your core abstractions)
1. `cn()` - 173 edges
2. `useDurationStore` - 49 edges
3. `Terraform Command Reference` - 27 edges
4. `react` - 25 edges
5. `Button` - 20 edges
6. `useAuth()` - 20 edges
7. `AppLayout()` - 18 edges
8. `Card` - 17 edges
9. `compilerOptions` - 15 edges
10. `DatabaseDetailPage()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `useCarousel()` --references--> `react`  [EXTRACTED]
  client/src/components/ui/carousel.tsx → package.json
- `useChart()` --references--> `react`  [EXTRACTED]
  client/src/components/ui/chart.tsx → package.json
- `useFormField()` --references--> `react`  [EXTRACTED]
  client/src/components/ui/form.tsx → package.json
- `AppLayout()` --references--> `react`  [EXTRACTED]
  client/src/components/layout/AppLayout.tsx → package.json
- `EndpointsListCard()` --references--> `react`  [EXTRACTED]
  client/src/components/tambo/EndpointsListCard.tsx → package.json

## Import Cycles
- None detected.

## Communities (181 total, 92 thin omitted)

### Community 0 - "message-thread-full.tsx"
Cohesion: 0.13
Nodes (19): MessageInput, MessageInputError(), MessageInputProps, MessageInputSubmitButton(), MessageInputTextarea(), MessageInputToolbar(), messageInputVariants, AskAiChatContext (+11 more)

### Community 1 - "card.tsx"
Cohesion: 0.09
Nodes (20): client, httpLink, GET_ALL_DATABASES, GET_DATABASE_METRICS, GET_GLOBAL_TOPOLOGY, GET_SERVICE_TOPOLOGY, GET_TOPOLOGY, toJsonSchema() (+12 more)

### Community 2 - "tambo-tools.ts"
Cohesion: 0.12
Nodes (14): MetricChart(), CallingServicesPanel(), DbLatencyTrendChart(), DbMetricsSummary(), DbMetricsSummaryProps, N1DetectorBanner(), QueryFingerprintPanel(), CallingServiceRow (+6 more)

### Community 3 - "devDependencies"
Cohesion: 0.13
Nodes (15): autoprefixer, devDependencies, autoprefixer, @replit/vite-plugin-cartographer, @tailwindcss/typography, @tailwindcss/vite, @types/connect-pg-simple, @types/passport-local (+7 more)

### Community 4 - "cn"
Cohesion: 0.09
Nodes (36): MetricChartProps, ResizableHandle(), ResizablePanelGroup(), Separator, SheetHeader(), Sidebar(), SidebarContent(), SidebarContext (+28 more)

### Community 5 - "SkyObserv - Observability"
Cohesion: 0.06
Nodes (36): 1. Clone the Repository, 2. Install Dependencies, 3. Docker Build, 3. Environment Configuration, Access the Application, Adding New AI Tools, Adding New TamboAI Components, APM & Monitoring (+28 more)

### Community 6 - "compilerOptions"
Cohesion: 0.07
Nodes (30): build, client/src/**/*, dist, dom, dom.iterable, esnext, node, node_modules (+22 more)

### Community 7 - "use-toast.ts"
Cohesion: 0.12
Nodes (24): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+16 more)

### Community 8 - "AppLayout.tsx"
Cohesion: 0.17
Nodes (13): MessageThreadFull, MessageThreadFullProps, ScrollableMessageContainer, ScrollableMessageContainerProps, ThreadHistory, ThreadHistoryContext, ThreadHistoryContextValue, ThreadHistoryHeader (+5 more)

### Community 9 - "utils.ts"
Cohesion: 0.09
Nodes (13): PodCard(), ThreadDropdown, ThreadDropdownProps, Avatar, AvatarFallback, AvatarImage, HoverCardContent, Progress (+5 more)

### Community 10 - "index.ts"
Cohesion: 0.29
Nodes (11): createUser(), CreateUserInput, ensureAuthSchema(), ensureBootstrapAdmin(), isAuthEnabled(), PgSession, requireAuth(), setupAuth() (+3 more)

### Community 11 - "K8sNamespaceDetailPage.tsx"
Cohesion: 0.27
Nodes (8): DrawerContent(), TabsContent, TabsList, TabsTrigger, useServiceMetrics(), apdexLabel(), EndpointDetailPage(), ServiceDetailPage()

### Community 12 - "useDurationStore"
Cohesion: 0.19
Nodes (14): AddStorageBackendDialog(), Props, DialogContent, DialogDescription, DialogFooter(), DialogHeader(), DialogOverlay, DialogTitle (+6 more)

### Community 13 - "dependencies"
Cohesion: 0.11
Nodes (19): @apollo/client, clsx, framer-motion, dependencies, @apollo/client, clsx, framer-motion, @prisma/client (+11 more)

### Community 14 - "index.js"
Cohesion: 0.14
Nodes (18): app, { buildSchema }, cors, DATABASES, ENDPOINTS, express, generateSpans(), generateTraces() (+10 more)

### Community 15 - "package.json"
Cohesion: 0.18
Nodes (10): bufferutil, @esbuild-kit/esm-loader, license, name, optionalDependencies, bufferutil, overrides, drizzle-kit (+2 more)

### Community 16 - "chart.tsx"
Cohesion: 0.13
Nodes (22): GET_LINEAR_INT_VALUES, GET_SERVICE_METRICS, METRICS, GET_SERVICE_ENDPOINTS, GET_SERVICE_INSTANCES, ServiceOverviewCard(), ServiceOverviewCardProps, useServiceOverview() (+14 more)

### Community 17 - "command.tsx"
Cohesion: 0.11
Nodes (17): 10. Outputs, 14. Modules, 15. Providers, 16. Graph and debugging, 18. Console and inspection, 19. Testing, 1. Core workflow, 20. Terraform Cloud / login (+9 more)

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
Cohesion: 0.16
Nodes (12): ButtonProps, buttonVariants, Calendar(), CalendarProps, Pagination(), PaginationContent, PaginationEllipsis(), PaginationItem (+4 more)

### Community 22 - "form.tsx"
Cohesion: 0.22
Nodes (9): scripts, build, check, db:push, dev, graphify:update, graphify:watch, start (+1 more)

### Community 23 - "SkyWalking OAP on Oracle Cloud (Always Free)"
Cohesion: 0.17
Nodes (10): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+2 more)

### Community 24 - "carousel.tsx"
Cohesion: 0.09
Nodes (26): DatabaseListCard(), DBInsightsCard(), DetailedMetricsCard(), Props, EndpointsListCard(), Props, ServiceInstancesCard(), ServiceListCard() (+18 more)

### Community 25 - "dropdown-menu.tsx"
Cohesion: 0.20
Nodes (12): autoRefreshOptions, ranges, OPTIONS, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem (+4 more)

### Community 26 - "TracesPage.tsx"
Cohesion: 0.19
Nodes (10): CalloutKind, DOC_CATEGORIES, DOC_TOPICS, DocBlock, DocCategory, DocTopic, getDocTopic(), Callout() (+2 more)

### Community 27 - "context-menu.tsx"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 28 - "useDurationStore.ts"
Cohesion: 0.19
Nodes (20): buildLatencyTrend(), buildQueryFingerprints(), buildSlowSqlLeaderboard(), computeDbMetrics(), detectN1Queries(), filterSpansForStorage(), fingerprintLabel(), getCallingServices() (+12 more)

### Community 29 - "alert-dialog.tsx"
Cohesion: 0.29
Nodes (8): GET_TRACE_DETAILS, GET_TRACES_FOR_DB, RawSpan, TraceListItem, useDatabaseTraceScan(), extractStatement(), isStorageSpan(), STATEMENT_TAG_KEYS

### Community 30 - "table.tsx"
Cohesion: 0.21
Nodes (13): GET_ALL_SERVICES, CustomRangePicker(), DurationSelector(), AppLayout(), AppLayoutProps, FailedTracesPanel(), formatTraceTime(), TAMBO_SYSTEM_PROMPT (+5 more)

### Community 31 - "breadcrumb.tsx"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 32 - "drawer.tsx"
Cohesion: 0.21
Nodes (9): AccordionContent, AccordionItem, AccordionTrigger, FAQS, FEATURES, STACKS, STATS, STEPS (+1 more)

### Community 33 - "navigation-menu.tsx"
Cohesion: 0.40
Nodes (5): RankBadge(), rankStyles, ServiceRef, SlowEndpointsLeaderboard(), useSlowEndpoints()

### Community 34 - "sheet.tsx"
Cohesion: 0.20
Nodes (10): 4. Plan, Basic plan, Disable locking (not recommended), Plan a destroy, Plan only specific resources, Plan with inline variable, Plan with variable file, Refresh-only plan (+2 more)

### Community 35 - "toggle-group.tsx"
Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 36 - "queryClient.ts"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 37 - "vite.ts"
Cohesion: 0.33
Nodes (3): viteLogger, __dirname, __filename

### Community 38 - "alert.tsx"
Cohesion: 0.18
Nodes (8): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES, useChart()

### Community 39 - "accordion.tsx"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 40 - "avatar.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 44 - "@apollo/client"
Cohesion: 0.22
Nodes (8): GenerationStageProps, MessageGenerationStage(), MessageSuggestions, MessageSuggestionsContext, MessageSuggestionsContextValue, MessageSuggestionsList, MessageSuggestionsProps, MessageSuggestionsStatus

### Community 45 - "class-variance-authority"
Cohesion: 0.07
Nodes (53): GET_TRACE_DETAILS, GET_TRACES, CriticalPathBanner(), CriticalPathBannerProps, ErrorFingerprintPanel(), ErrorFingerprintPanelProps, FlameGraph(), FlameGraphProps (+45 more)

### Community 47 - "clsx"
Cohesion: 0.15
Nodes (12): GET_K8S_DASHBOARD, GET_K8S_NODES, GET_SERVICE_INSTANCES, formatBytes(), getMQEValue(), K8sNodeExplorerPage(), MetricProgress(), getDisplayName() (+4 more)

### Community 50 - "date-fns"
Cohesion: 0.14
Nodes (13): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+5 more)

### Community 51 - "dotenv"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 54 - "framer-motion"
Cohesion: 0.25
Nodes (7): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetOverlay, SheetTitle, sheetVariants

### Community 56 - "@hookform/resolvers"
Cohesion: 0.25
Nodes (8): 22. Common workflows, First time on a new machine, Import an existing EC2 instance, Rename a resource without recreating it, Safe production apply, Stop managing a resource (keep it in AWS), Switch environment (no re-init), Tear down one environment

### Community 57 - "input-otp"
Cohesion: 0.10
Nodes (21): AppShell(), AuthenticatedApp(), isPublicPath(), ThemeToggle(), FOOTER_LINKS, PublicLayout(), PublicLayoutProps, AuthContext (+13 more)

### Community 60 - "lucide-react"
Cohesion: 0.25
Nodes (8): 2. Init, Backend config as CLI flags, Basic, Migrate state to remote backend, Reconfigure backend, Upgrade modules, Upgrade providers, With partial backend config (this project)

### Community 62 - "next-themes"
Cohesion: 0.25
Nodes (8): 5. Apply, Apply a saved plan, Apply with targets, Apply with variable file, Auto-approve (skip confirmation), Basic apply, Control parallelism, Replace on apply

### Community 63 - "thread-container.tsx"
Cohesion: 0.29
Nodes (7): 24. SkyObserv project notes, Copy local var files, Key files, One-time S3 bucket setup, Project outputs, S3 state paths, Verify state in S3

### Community 64 - "useSidebar"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 65 - "express"
Cohesion: 0.40
Nodes (5): 6. Destroy, Auto-approve destroy, Basic destroy, Destroy specific resources only, Destroy with variable file

### Community 70 - "@radix-ui/react-accordion"
Cohesion: 0.40
Nodes (5): 9. Variables, Environment variables, Inline variable, Variable file, Variable precedence (highest wins)

### Community 76 - "@radix-ui/react-context-menu"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 78 - "@radix-ui/react-dropdown-menu"
Cohesion: 0.50
Nodes (4): 11. State commands, Examples, When to use `state mv`, When to use `state rm`

### Community 93 - "@radix-ui/react-tooltip"
Cohesion: 0.50
Nodes (4): 13. Replace and targeted changes, Force replace (modern approach), Legacy: taint (deprecated), Target specific resources

### Community 94 - "react-day-picker"
Cohesion: 0.47
Nodes (4): DbQueryRow(), DbQueryRowProps, FailedDbQueriesPanel(), DbSpanRow

### Community 96 - "react-force-graph-2d"
Cohesion: 0.67
Nodes (3): 12. Import and remove from state, Import existing infrastructure, Import with config generation (Terraform 1.5+)

### Community 103 - "@tambo-ai/typescript-sdk"
Cohesion: 0.67
Nodes (3): 17. Locking, Error: `Error acquiring the state lock`, Fix stale lock

### Community 104 - "@tanstack/react-query"
Cohesion: 0.16
Nodes (15): getTopologyNodeColors(), useTopologyHealth(), readStoredTheme(), ResolvedTheme, systemTheme(), ThemeContext, ThemeContextValue, ThemePreference (+7 more)

### Community 105 - "tw-animate-css"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 114 - "drizzle.config.ts"
Cohesion: 0.24
Nodes (7): db, globalForPrisma, opts, pool, DatabaseConnectionOptions, DatabaseSslConfig, getDatabaseConnectionOptions()

### Community 117 - "alert.tsx"
Cohesion: 0.67
Nodes (3): 3. Validate and format, Format, Validate

### Community 123 - "@radix-ui/react-toggle-group"
Cohesion: 0.26
Nodes (13): getClient(), getConfig(), isEmailConfigured(), sendPasswordResetOtp(), hashPassword(), verifyPassword(), generateOtpCode(), isValidEmail() (+5 more)

### Community 124 - "react-icons"
Cohesion: 0.40
Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 136 - "thread-container.tsx"
Cohesion: 0.26
Nodes (12): Message(), MessageContent(), MessageRenderedComponentArea(), ThreadContainer, ThreadContainerProps, useThreadContainerContext(), getSafeContent(), hasRightClass() (+4 more)

### Community 138 - "date-fns"
Cohesion: 0.13
Nodes (14): Express, User, api, Duration, InsertSkyobservUser, insertSkyobservUserSchema, insertUserPreferenceSchema, SavePreferenceRequest (+6 more)

### Community 140 - "Typography Specifications"
Cohesion: 0.20
Nodes (10): 1. Provision infra, 2. Remote state (optional but recommended), 3. GitHub secrets, 4. Env file on EC2, 5. Deploy, 6. Production approval gate, 7. CloudWatch (manual — AWS console), 8. Destroy (+2 more)

### Community 143 - "Logo Usage Rules"
Cohesion: 0.50
Nodes (3): rankStyles, SlowSqlLeaderboard(), SlowSqlRow

### Community 145 - "shadcn/ui Accessibility Patterns"
Cohesion: 0.22
Nodes (9): CD — build-push job, CD — deploy-production job, CD — deploy-staging job, CD Pipeline — Waiting for Production Approval, CI Checks on Pull Request, CI Pipeline — All Checks Passed, CI — scan job steps, CI — test job steps (+1 more)

### Community 146 - "TestTailwindConfigGenerator"
Cohesion: 0.25
Nodes (8): 1. GHCR rejects image names with uppercase letters, 2. Docker login fails in the SSH deploy step, 3. RDS refusing connections after deploy, 4. EBS disk filled up, container stopped starting, 5. CloudWatch memory and disk widgets showing no data, 6. CloudWatch agent wasn't installed on the existing EC2, 7. /var/log/messages missing on Amazon Linux 2023, Challenges & Resolutions

### Community 150 - "Logo AI Prompt Engineering"
Cohesion: 0.25
Nodes (8): Architecture, Architecture decisions, Backup strategy, Cost optimization, Security considerations, SkyObserv — DevOps Setup, Troubleshooting, What Terraform creates

### Community 151 - "teamAccess.ts"
Cohesion: 0.57
Nodes (6): canManageTeam(), generateTempPassword(), inviteTeamMember(), listTeamMembers(), removeTeamMember(), resetTeamMemberPassword()

### Community 153 - "BM25"
Cohesion: 0.29
Nodes (7): Access Log Events, CloudWatch Dashboards List, CloudWatch Log Groups, Part 3 — Monitoring & Logging, skyobserv-app Dashboard, skyobserv-infra Dashboard, skyobserv-rds Dashboard

### Community 154 - "States and Variants"
Cohesion: 0.29
Nodes (7): App Running on EC2, EC2 Instance — Running, Part 1 — Infrastructure (Terraform), Part 4 — Application, RDS — Available, Screenshots, Terraform State — Provisioned Resources

### Community 156 - "Workflow"
Cohesion: 0.18
Nodes (13): CodeHeader(), createMarkdownComponents(), looksLikeCode(), useMessageSuggestionsContext(), useThreadHistoryContext(), CodeHeader(), createMarkdownComponents(), looksLikeCode() (+5 more)

### Community 161 - "generate-slide.py"
Cohesion: 0.09
Nodes (22): GET_EVENTS, GET_INSTANCE_DETAIL, GET_MQE_METRICS, GET_NODE_INSTANCES, GET_NODE_METRICS, K8sPodEventsPanel(), K8sPodEventsPanelProps, K8sPodPropertiesPanel() (+14 more)

### Community 205 - "_select_palette_for_mode"
Cohesion: 0.13
Nodes (20): publicUser(), app, __dirname, distPath, __filename, httpServer, PORT, requestLogMiddleware() (+12 more)

### Community 207 - "input"
Cohesion: 0.18
Nodes (21): assertGraphQLAccess(), canAccessService(), collectServiceNamesFromVariables(), decodeSkyWalkingServiceId(), emptyK8sListServiceFields(), encodeSkyWalkingServiceId(), fetchGlobalTopology(), filterByServiceName() (+13 more)

### Community 222 - "button"
Cohesion: 0.29
Nodes (11): createStorageBackendForUser(), getStorageBackendForUser(), listStorageBackendsForUser(), StorageBackendView, toView(), configuredStorageId(), defaultPortForKind(), inferKindFromProtocol() (+3 more)

## Knowledge Gaps
- **602 isolated node(s):** `httpLink`, `GET_NODE_METRICS`, `GET_NODE_INSTANCES`, `GET_TOPOLOGY`, `GET_SERVICE_TOPOLOGY` (+597 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **92 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `message-thread-full.tsx`, `tambo-tools.ts`, `use-toast.ts`, `thread-container.tsx`, `utils.ts`, `AppLayout.tsx`, `K8sNamespaceDetailPage.tsx`, `useDurationStore`, `Logo Usage Rules`, `menubar.tsx`, `CustomRangePicker.tsx`, `button.tsx`, `SkyWalking OAP on Oracle Cloud (Always Free)`, `carousel.tsx`, `dropdown-menu.tsx`, `TracesPage.tsx`, `context-menu.tsx`, `Workflow`, `table.tsx`, `breadcrumb.tsx`, `drawer.tsx`, `generate-slide.py`, `navigation-menu.tsx`, `toggle-group.tsx`, `alert.tsx`, `accordion.tsx`, `avatar.tsx`, `@apollo/client`, `class-variance-authority`, `clsx`, `date-fns`, `dotenv`, `framer-motion`, `input-otp`, `useSidebar`, `@radix-ui/react-aspect-ratio`, `@radix-ui/react-context-menu`, `react-day-picker`, `@tanstack/react-query`, `tw-animate-css`, `react-icons`?**
  _High betweenness centrality (0.246) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `@types/express`, `@types/node`, `K8sResourceDrawer.tsx`, `TestStyleTaxonomy`, `class-variance-authority`, `class-variance-authority`, `scripts/core.py`, `package.json`, `alert.tsx`, `react-icons`, `Workflow`, `@tanstack/react-query`, `cmdk`, `connect-pg-simple`, `Design Principles`, `icon/generate.py`, `embla-carousel-react`, `express-session`, `fontSize`, `highlight.js`, `.add_components`, `TestShadcnInstaller`, `@jridgewell/trace-mapping`, `json-stringify-pretty-compact`, `CatalogRefreshTest`, `memorystore`, `graphql`, `passport-local`, `pg`, `radix-ui`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible`, `@radix-ui/react-dialog`, `@radix-ui/react-label`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-popover`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `@radix-ui/react-scroll-area`, `@radix-ui/react-select`, `@radix-ui/react-separator`, `@radix-ui/react-slider`, `@radix-ui/react-switch`, `@radix-ui/react-tabs`, `@radix-ui/react-toast`, `resizable.tsx`, `@radix-ui/react-toggle`, `react-dom`, `react-resizable-panels`, `react-xarrows`, `recharts`, `tailwind-merge`, `tailwindcss-animate`, `@tambo-ai/react`, `vaul`, `wouter`, `ws`, `zod`, `zod-validation-error`, `zustand`, `12`, `input-otp.tsx`, `destructive`, `drizzle-orm`, `@radix-ui/react-slot`, `react-markdown`, `class-variance-authority`, `@types/connect-pg-simple`?**
  _High betweenness centrality (0.183) - this node is a cross-community bridge._
- **Why does `react` connect `Workflow` to `message-thread-full.tsx`, `cn`, `alert.tsx`, `use-toast.ts`, `thread-container.tsx`, `K8sNamespaceDetailPage.tsx`, `dependencies`, `date-fns`, `SkyWalking OAP on Oracle Cloud (Always Free)`, `carousel.tsx`, `table.tsx`?**
  _High betweenness centrality (0.166) - this node is a cross-community bridge._
- **What connects `httpLink`, `GET_NODE_METRICS`, `GET_NODE_INSTANCES` to the rest of the system?**
  _602 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `message-thread-full.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12857142857142856 - nodes in this community are weakly interconnected._
- **Should `card.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09230769230769231 - nodes in this community are weakly interconnected._
- **Should `tambo-tools.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12380952380952381 - nodes in this community are weakly interconnected._