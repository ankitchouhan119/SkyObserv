"use client";

import { Link } from "wouter";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Box,
  Check,
  Database,
  GitBranch,
  Layers,
  Radar,
  Shield,
  Terminal,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useAuth } from "@/hooks/useAuth";

const STATS = [
  { value: "4", label: "Languages supported" },
  { value: "2", label: "Env vars to connect" },
  { value: "<2 min", label: "Until first trace" },
  { value: "100%", label: "Open source core" },
];

const FEATURES = [
  {
    icon: GitBranch,
    title: "Distributed traces",
    description:
      "Follow a single request across every service. Span-level latency, errors, and database calls in one waterfall.",
    span: "lg:col-span-2",
  },
  {
    icon: Radar,
    title: "Live topology",
    description: "See how services connect to Redis, PostgreSQL, and third-party APIs as traffic flows.",
    span: "",
  },
  {
    icon: Database,
    title: "Storage insights",
    description: "Detect databases and caches automatically — including Prisma and ORM-backed workloads.",
    span: "",
  },
  {
    icon: Box,
    title: "Kubernetes view",
    description:
      "Pod metrics, namespace health, and instance events beside the traces they belong to, so you stop switching tabs.",
    span: "lg:col-span-2",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Create an account",
    body: "Sign up and copy your token and register URL from the Profile page.",
  },
  {
    step: "02",
    title: "Add two env vars",
    body: "Drop them into your service. The agent resolves the collector on boot — no OAP hostname to manage.",
  },
  {
    step: "03",
    title: "Ship and observe",
    body: "Restart the process. Traces, topology, and storage appear within a couple of minutes.",
  },
];

const STACKS = [
  "Node.js",
  "Express",
  "Java",
  "Spring Boot",
  "Python",
  "FastAPI",
  "Prisma",
  "PostgreSQL",
  "Redis",
  "MongoDB",
  "Kubernetes",
];

const TRACE_SPANS = [
  { name: "GET /api/v1/trips", layer: "HTTP", offset: 0, width: 100, tone: "bg-primary" },
  { name: "TripService.list", layer: "Local", offset: 6, width: 78, tone: "bg-primary/70" },
  { name: "PostgreSQL/Trip/findMany", layer: "Database", offset: 14, width: 44, tone: "bg-chart-4" },
  { name: "Redis/GET trips:feed", layer: "Cache", offset: 60, width: 12, tone: "bg-chart-2" },
  { name: "HTTP GET maps.api", layer: "External", offset: 74, width: 20, tone: "bg-chart-3" },
];

const FAQS = [
  {
    q: "Do I need to run Apache SkyWalking myself?",
    a: "SkyObserv connects to a SkyWalking OAP deployment and handles registration, access control, and the UI on top of it. Your services never need the collector address — they receive it from the register endpoint at startup.",
  },
  {
    q: "Which languages are supported?",
    a: "Node.js, Java, and Python backends. Instrument your API server — React or mobile frontends do not need a separate agent. Traces start when requests hit your backend.",
  },
  {
    q: "Will my ORM queries show up?",
    a: "Driver-level clients like pg, mysql2, and ioredis are traced automatically. Prisma uses its own query engine, so it needs a small client extension — the Prisma guide walks through it.",
  },
  {
    q: "Can my teammates see my services?",
    a: "Only if you invite them. Each account sees traces from the services registered with its own token, and team invites share that scope explicitly.",
  },
];

function TracePreview() {
  return (
    <div className="so-card overflow-hidden shadow-xl">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/50">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-chart-3/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-chart-2/60" />
        </span>
        <span className="ml-2 text-xs text-muted-foreground font-mono truncate">
          skyobserv — trace 8f2c…a41
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-medium text-primary">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" aria-hidden="true" />
          Live
        </span>
      </div>

      <div className="p-4 sm:p-5 space-y-2.5">
        {TRACE_SPANS.map((span) => (
          <div key={span.name} className="grid grid-cols-[1fr_2fr] gap-3 items-center">
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{span.name}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{span.layer}</p>
            </div>
            <div className="h-5 rounded bg-muted/70 relative overflow-hidden">
              <div
                className={`absolute inset-y-0 rounded ${span.tone}`}
                style={{ left: `${span.offset}%`, width: `${span.width}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border so-code-surface px-4 sm:px-5 py-4 font-mono text-[11px] sm:text-xs leading-relaxed overflow-x-auto">
        <p className="opacity-60"># .env — copy from your Profile</p>
        <p>
          <span className="text-primary">SW_AGENT_ENABLED</span>=true
        </p>
        <p>
          <span className="text-primary">SW_AGENT_NAME</span>=my-service
        </p>
        <p>
          <span className="text-primary">SKYOBSERV_USER_TOKEN</span>=so_••••••••
        </p>
        <p>
          <span className="text-primary">SKYOBSERV_REGISTER_URL</span>=https://skyobserv.example.com
        </p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_-10%,hsl(var(--primary)/0.16),transparent)]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
          aria-hidden="true"
        />

        <div className="relative so-section pt-16 pb-16 sm:pt-24 sm:pb-20">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-14 items-center">
            <div className="so-reveal">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
                <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                Powered by Apache SkyWalking
              </div>

              <h1
                className="mt-6 text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-foreground leading-[1.06] tracking-tight"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                See every request,{" "}
                <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                  end to end
                </span>
              </h1>

              <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-xl">
                Traces, service topology, databases, and Kubernetes in one console. Connect a service
                with a token and a URL — SkyObserv resolves the rest.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href={user ? "/dashboard" : "/login"}>
                  <Button size="lg" className="gap-2 h-11 px-6">
                    {user ? "Open dashboard" : "Get started free"}
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </Link>
                <Link href="/docs/overview">
                  <Button variant="outline" size="lg" className="gap-2 h-11 px-6">
                    <BookOpen className="w-4 h-4" aria-hidden="true" />
                    Read the docs
                  </Button>
                </Link>
              </div>

              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {["No credit card", "Public docs", "Self-hosted friendly"].map((item) => (
                  <li key={item} className="inline-flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-primary" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="so-reveal [animation-delay:120ms]">
              <TracePreview />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-muted/30">
        <div className="so-section py-8">
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span
                    className="block text-2xl sm:text-3xl font-bold text-foreground"
                    style={{ fontFamily: "Outfit, sans-serif" }}
                  >
                    {stat.value}
                  </span>
                  <span className="mt-1 block text-xs sm:text-sm text-muted-foreground">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24">
        <div className="so-section">
          <div className="max-w-2xl">
            <p className="so-eyebrow">Why SkyObserv</p>
            <h2 className="so-h2 mt-3">Everything you need to debug production</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              From the HTTP entry span down to the Prisma query that made it slow — the full request
              path, without stitching together four different tools.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className={`so-card p-6 transition-colors hover:border-primary/30 ${feature.span}`}
              >
                <div className="so-icon-wrap bg-primary/10 text-primary">
                  <feature.icon className="w-4 h-4" aria-hidden="true" />
                </div>
                <h3
                  className="mt-4 font-semibold text-foreground"
                  style={{ fontFamily: "Outfit, sans-serif" }}
                >
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-muted/30 py-16 sm:py-24">
        <div className="so-section">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
            <div className="max-w-xl">
              <p className="so-eyebrow">Setup</p>
              <h2 className="so-h2 mt-3">Connected in three steps</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                The collector address never appears in your configuration. Your service registers on
                startup and receives it over the API.
              </p>
            </div>
            <Link href="/docs/overview">
              <Button variant="outline" className="gap-2 shrink-0">
                <Terminal className="w-4 h-4" aria-hidden="true" />
                View setup guides
              </Button>
            </Link>
          </div>

          <ol className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STEPS.map((step) => (
              <li key={step.step} className="so-card p-6 relative">
                <span
                  className="text-3xl font-bold text-primary/25"
                  style={{ fontFamily: "Outfit, sans-serif" }}
                  aria-hidden="true"
                >
                  {step.step}
                </span>
                <h3
                  className="text-lg font-semibold text-foreground mt-2"
                  style={{ fontFamily: "Outfit, sans-serif" }}
                >
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Stacks */}
      <section className="py-14">
        <div className="so-section text-center">
          <p className="so-eyebrow">Works with your stack</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {STACKS.map((stack) => (
              <span
                key={stack}
                className="px-3 py-1.5 rounded-full bg-card border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
              >
                {stack}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="pb-16 sm:pb-24">
        <div className="so-section">
          <div className="so-card p-8 sm:p-10 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="so-icon-wrap bg-primary/10 text-primary shrink-0 h-11 w-11">
                <Shield className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h2
                  className="text-xl font-semibold text-foreground"
                  style={{ fontFamily: "Outfit, sans-serif" }}
                >
                  Per-account service isolation
                </h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-2xl">
                  Each account only sees traces from the services registered with its token. Team
                  invites share that scope deliberately, and the collector address is resolved
                  server-side so it never ships in a client bundle.
                </p>
              </div>
              <Link href="/login">
                <Button className="shrink-0 gap-2">
                  <Layers className="w-4 h-4" aria-hidden="true" />
                  Create account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border py-16 sm:py-20">
        <div className="so-section max-w-3xl">
          <p className="so-eyebrow">FAQ</p>
          <h2 className="so-h2 mt-3 mb-8">Common questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, i) => (
              <AccordionItem key={faq.q} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-[15px] font-medium hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border bg-muted/30 py-16 sm:py-20">
        <div className="so-section text-center">
          <Activity className="w-8 h-8 text-primary mx-auto" aria-hidden="true" />
          <h2 className="so-h2 mt-5">Ready to see inside your app?</h2>
          <p className="mt-3 text-muted-foreground">
            Start with the docs — no login required — or connect your first service now.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href={user ? "/dashboard" : "/login"}>
              <Button size="lg" className="gap-2 h-11 px-6">
                {user ? "Open dashboard" : "Get started free"}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="/docs/node">
              <Button variant="outline" size="lg" className="h-11 px-6">
                Node.js guide
              </Button>
            </Link>
            <Link href="/docs/prisma">
              <Button variant="outline" size="lg" className="h-11 px-6">
                Prisma guide
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
