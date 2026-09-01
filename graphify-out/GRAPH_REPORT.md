# Graph Report - SkyObserv  (2026-09-01)

## Corpus Check
- 136 files · ~144,014 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 951 nodes · 1534 edges · 117 communities (47 shown, 70 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7b8ad655`
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
- message-generation-stage.tsx
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
- setup-oracle.sh
- switch-to-real-oap.sh
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

## God Nodes (most connected - your core abstractions)
1. `cn()` - 134 edges
2. `useDurationStore` - 35 edges
3. `Card` - 27 edges
4. `react` - 24 edges
5. `compilerOptions` - 15 edges
6. `AppLayout()` - 14 edges
7. `SkyObserv - Observability` - 11 edges
8. `Button` - 10 edges
9. `Badge()` - 9 edges
10. `TamboAI Natural Language Queries` - 9 edges

## Surprising Connections (you probably didn't know these)
- `useCarousel()` --references--> `react`  [EXTRACTED]
  client/src/components/ui/carousel.tsx → package.json
- `useChart()` --references--> `react`  [EXTRACTED]
  client/src/components/ui/chart.tsx → package.json
- `useFormField()` --references--> `react`  [EXTRACTED]
  client/src/components/ui/form.tsx → package.json
- `CodeHeader()` --references--> `react`  [EXTRACTED]
  client/src/lib/markdownComponents.tsx → package.json
- `AppLayout()` --references--> `react`  [EXTRACTED]
  client/src/components/layout/AppLayout.tsx → package.json

## Import Cycles
- None detected.

## Communities (117 total, 70 thin omitted)

### Community 0 - "message-thread-full.tsx"
Cohesion: 0.06
Nodes (55): CodeHeader(), createMarkdownComponents(), looksLikeCode(), MessageInput, MessageInputError(), MessageInputProps, MessageInputSubmitButton(), MessageInputTextarea() (+47 more)

### Community 1 - "card.tsx"
Cohesion: 0.06
Nodes (41): GET_TRACE_DETAILS, GET_TRACES, PodCard(), DatabaseListCard(), DBInsightsCard(), DetailedMetricsCard(), Props, EndpointsListCard() (+33 more)

### Community 2 - "tambo-tools.ts"
Cohesion: 0.06
Nodes (36): client, httpLink, GET_LINEAR_INT_VALUES, GET_SERVICE_METRICS, METRICS, GET_ALL_SERVICES, GET_SERVICE_ENDPOINTS, GET_SERVICE_INSTANCES (+28 more)

### Community 3 - "devDependencies"
Cohesion: 0.04
Nodes (47): autoprefixer, drizzle-kit, esbuild, devDependencies, autoprefixer, drizzle-kit, esbuild, postcss (+39 more)

### Community 4 - "cn"
Cohesion: 0.11
Nodes (33): Separator, SheetHeader(), Sidebar(), SidebarContent(), SidebarContext, SidebarContextProps, SidebarFooter(), SidebarGroup() (+25 more)

### Community 5 - "SkyObserv - Observability"
Cohesion: 0.06
Nodes (35): 1. Clone the Repository, 2. Install Dependencies, 3. Docker Build, 3. Environment Configuration, Access the Application, Adding New AI Tools, Adding New TamboAI Components, APM & Monitoring (+27 more)

### Community 6 - "compilerOptions"
Cohesion: 0.07
Nodes (30): build, client/src/**/*, dist, dom, dom.iterable, esnext, node, node_modules (+22 more)

### Community 7 - "use-toast.ts"
Cohesion: 0.12
Nodes (24): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+16 more)

### Community 8 - "AppLayout.tsx"
Cohesion: 0.15
Nodes (14): GET_ALL_DATABASES, GET_DATABASE_METRICS, GET_TRACE_DETAILS, GET_TRACES_FOR_DB, CustomRangePicker(), AppLayout(), AppLayoutProps, MessageThreadCollapsible (+6 more)

### Community 9 - "utils.ts"
Cohesion: 0.08
Nodes (14): TooltipContent, TooltipProps, Checkbox, HoverCardContent, InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot (+6 more)

### Community 10 - "index.ts"
Cohesion: 0.11
Nodes (17): db, pool, app, __dirname, __filename, httpServer, PORT, api (+9 more)

### Community 11 - "K8sNamespaceDetailPage.tsx"
Cohesion: 0.15
Nodes (15): GET_K8S_DASHBOARD, GET_K8S_NODES, GET_MQE_METRICS, GET_NODE_INSTANCES, GET_NODE_METRICS, GET_SERVICE_INSTANCES, formatBytes(), getMQEValue() (+7 more)

### Community 12 - "useDurationStore"
Cohesion: 0.14
Nodes (14): GET_EVENTS, GET_INSTANCE_DETAIL, K8sPodEventsPanel(), K8sPodEventsPanelProps, K8sPodPropertiesPanel(), K8sPodPropertiesPanelProps, K8sPodTopologyPanel(), Props (+6 more)

### Community 13 - "dependencies"
Cohesion: 0.11
Nodes (19): drizzle-orm, drizzle-zod, dependencies, drizzle-orm, drizzle-zod, passport, @radix-ui/react-hover-card, @radix-ui/react-slot (+11 more)

### Community 14 - "index.js"
Cohesion: 0.14
Nodes (18): app, { buildSchema }, cors, DATABASES, ENDPOINTS, express, generateSpans(), generateTraces() (+10 more)

### Community 15 - "package.json"
Cohesion: 0.12
Nodes (16): bufferutil, @esbuild-kit/esm-loader, license, name, optionalDependencies, bufferutil, overrides, drizzle-kit (+8 more)

### Community 16 - "chart.tsx"
Cohesion: 0.12
Nodes (13): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES, useChart() (+5 more)

### Community 17 - "command.tsx"
Cohesion: 0.12
Nodes (14): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut() (+6 more)

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
Cohesion: 0.18
Nodes (12): ButtonProps, buttonVariants, Calendar(), CalendarProps, Pagination(), PaginationContent, PaginationEllipsis(), PaginationItem (+4 more)

### Community 22 - "form.tsx"
Cohesion: 0.14
Nodes (12): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+4 more)

### Community 23 - "SkyWalking OAP on Oracle Cloud (Always Free)"
Cohesion: 0.13
Nodes (14): 1. Connect, 1. Create a VM Instance, 2. Clone repo (or copy oap-deploy folder), 2. Open Security List (firewall), 3. Configure environment, 4. Run setup script, 5. Verify OAP is running (~2 min startup), Optional: Demo app (sample traces) (+6 more)

### Community 24 - "carousel.tsx"
Cohesion: 0.14
Nodes (13): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+5 more)

### Community 25 - "dropdown-menu.tsx"
Cohesion: 0.18
Nodes (11): DurationSelector(), ranges, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator (+3 more)

### Community 26 - "TracesPage.tsx"
Cohesion: 0.26
Nodes (8): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, TracesPage()

### Community 27 - "context-menu.tsx"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 28 - "useDurationStore.ts"
Cohesion: 0.22
Nodes (6): K8sPodResourceCard(), K8sPodResourceCardProps, MetricItem(), DurationObj, DurationState, Step

### Community 29 - "alert-dialog.tsx"
Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 30 - "table.tsx"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 31 - "breadcrumb.tsx"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 32 - "drawer.tsx"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 33 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 34 - "sheet.tsx"
Cohesion: 0.25
Nodes (7): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetOverlay, SheetTitle, sheetVariants

### Community 35 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 36 - "queryClient.ts"
Cohesion: 0.47
Nodes (5): apiRequest(), getQueryFn(), queryClient, throwIfResNotOk(), UnauthorizedBehavior

### Community 37 - "vite.ts"
Cohesion: 0.33
Nodes (3): viteLogger, __dirname, __filename

### Community 38 - "alert.tsx"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 39 - "accordion.tsx"
Cohesion: 0.50
Nodes (3): AccordionContent, AccordionItem, AccordionTrigger

### Community 40 - "avatar.tsx"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

## Knowledge Gaps
- **435 isolated node(s):** `httpLink`, `GET_NODE_METRICS`, `GET_NODE_INSTANCES`, `GET_TOPOLOGY`, `GET_SERVICE_TOPOLOGY` (+430 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **70 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `message-thread-full.tsx`, `package.json`, `chart.tsx`, `@apollo/client`, `class-variance-authority`, `clsx`, `cmdk`, `connect-pg-simple`, `date-fns`, `dotenv`, `embla-carousel-react`, `express-session`, `framer-motion`, `highlight.js`, `@hookform/resolvers`, `input-otp`, `@jridgewell/trace-mapping`, `json-stringify-pretty-compact`, `lucide-react`, `memorystore`, `next-themes`, `express`, `graphql`, `passport-local`, `pg`, `radix-ui`, `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-aspect-ratio`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible`, `@radix-ui/react-context-menu`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-popover`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `@radix-ui/react-scroll-area`, `@radix-ui/react-select`, `@radix-ui/react-separator`, `@radix-ui/react-slider`, `@radix-ui/react-switch`, `@radix-ui/react-tabs`, `@radix-ui/react-toast`, `@radix-ui/react-toggle`, `@radix-ui/react-tooltip`, `react-day-picker`, `react-dom`, `react-force-graph-2d`, `react-resizable-panels`, `react-xarrows`, `recharts`, `tailwind-merge`, `tailwindcss-animate`, `@tambo-ai/react`, `@tambo-ai/typescript-sdk`, `@tanstack/react-query`, `tw-animate-css`, `vaul`, `wouter`, `ws`, `zod`, `zod-validation-error`, `zustand`?**
  _High betweenness centrality (0.306) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `message-thread-full.tsx`, `card.tsx`, `tambo-tools.ts`, `use-toast.ts`, `AppLayout.tsx`, `utils.ts`, `K8sNamespaceDetailPage.tsx`, `useDurationStore`, `chart.tsx`, `command.tsx`, `menubar.tsx`, `button.tsx`, `form.tsx`, `carousel.tsx`, `dropdown-menu.tsx`, `TracesPage.tsx`, `context-menu.tsx`, `useDurationStore.ts`, `alert-dialog.tsx`, `table.tsx`, `breadcrumb.tsx`, `drawer.tsx`, `navigation-menu.tsx`, `sheet.tsx`, `toggle-group.tsx`, `alert.tsx`, `accordion.tsx`, `avatar.tsx`, `message-generation-stage.tsx`, `resizable.tsx`?**
  _High betweenness centrality (0.274) - this node is a cross-community bridge._
- **Why does `react` connect `message-thread-full.tsx` to `card.tsx`, `tambo-tools.ts`, `cn`, `use-toast.ts`, `AppLayout.tsx`, `dependencies`, `chart.tsx`, `form.tsx`, `carousel.tsx`?**
  _High betweenness centrality (0.238) - this node is a cross-community bridge._
- **What connects `httpLink`, `GET_NODE_METRICS`, `GET_NODE_INSTANCES` to the rest of the system?**
  _435 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `message-thread-full.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0574400723654455 - nodes in this community are weakly interconnected._
- **Should `card.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05737704918032787 - nodes in this community are weakly interconnected._
- **Should `tambo-tools.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06079664570230608 - nodes in this community are weakly interconnected._