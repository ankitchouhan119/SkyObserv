"use client";

import { Link } from "wouter";
import { BookOpen, Box, ChevronRight, Server, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

type K8sSetupPanelProps = {
  compact?: boolean;
  showAdminNote?: boolean;
};

const SETUP_STEPS = [
  {
    icon: Zap,
    title: "Enable OAP K8s receiver",
    detail: "SW_OTEL_RECEIVER, SW_K8S_MONITORING_ENABLED, and k8s OTel metric rules on OAP.",
  },
  {
    icon: Shield,
    title: "Apply RBAC",
    detail: "Grant OAP read-only access to pods, nodes, services, and deployments (k8s-rbac.yaml).",
  },
  {
    icon: Server,
    title: "Metrics pipeline",
    detail: "kube-state-metrics + OpenTelemetry Collector → OAP :11800 (production), or mount kubeconfig for local Minikube.",
  },
  {
    icon: Box,
    title: "Instrument workloads",
    detail: "SkyWalking agent in pods with SKYOBSERV_REGISTER_URL — same as VM deployments.",
  },
] as const;

export function K8sSetupPanel({ compact = false, showAdminNote = true }: K8sSetupPanelProps) {
  return (
    <section className="so-card overflow-hidden">
      <div className="p-5 border-b border-border bg-gradient-to-r from-primary/5 via-transparent to-violet-500/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">Connect a Kubernetes cluster</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              SkyObserv reads cluster layers from SkyWalking OAP. OAP must reach your Kubernetes API
              and receive kube-state-metrics via OpenTelemetry.
            </p>
          </div>
          <Link href="/docs/kubernetes">
            <Button variant="outline" size="sm" className="shrink-0">
              <BookOpen className="w-4 h-4 mr-2" />
              Full setup guide
            </Button>
          </Link>
        </div>
        {showAdminNote && (
          <p className="mt-3 text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 max-w-2xl">
            Kubernetes data is visible only to the account owner (admin). Team members cannot access this page.
          </p>
        )}
      </div>

      <div className={compact ? "p-4 grid grid-cols-1 sm:grid-cols-2 gap-3" : "p-5 grid grid-cols-1 md:grid-cols-2 gap-4"}>
        {SETUP_STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={step.title}
              className="flex gap-3 rounded-xl border border-border bg-muted/30 p-4"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-semibold">
                {index + 1}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                  <p className="text-sm font-medium text-foreground">{step.title}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{step.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      {!compact && (
        <div className="px-5 pb-5">
          <Link href="/docs/kubernetes">
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline cursor-pointer">
              Open Kubernetes monitoring documentation
              <ChevronRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      )}
    </section>
  );
}
