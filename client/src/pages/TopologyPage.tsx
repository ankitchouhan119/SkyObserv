"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_GLOBAL_TOPOLOGY } from "@/apollo/queries/topology";
import { useDurationStore } from "@/store/useDurationStore";
import { useTheme } from "@/hooks/useTheme";
import { AppLayout } from "@/components/layout/AppLayout";
import { Link } from "wouter";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Globe,
  Link2,
  Maximize2,
  MousePointer2,
  RefreshCw,
  Server,
  Shuffle,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import { cn } from "@/lib/utils";

type GraphNode = {
  id: string;
  name: string;
  type?: string;
  isReal?: boolean;
  color: string;
  glow: string;
  fx?: number;
  fy?: number;
  x?: number;
  y?: number;
};

const LABEL_PX = 12;
const LABEL_OFFSET_PX = 18;
const NODE_RADIUS_PX = 10;
const HIT_RADIUS_PX = 24;

function formatNodeLabel(name: string): string {
  if (name.length <= 28) return name;
  const colon = name.lastIndexOf(":");
  if (colon > 0 && colon < name.length - 1) {
    const host = name.slice(0, colon);
    const port = name.slice(colon + 1);
    if (host.length > 20) return `${host.slice(0, 18)}…:${port}`;
  }
  return `${name.slice(0, 27)}…`;
}

export default function TopologyPage() {
  const { durationObj, setCustomRange } = useDurationStore();
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraphMethods<GraphNode> | undefined>(undefined);
  const hasFittedRef = useRef(false);
  const [dimensions, setDimensions] = useState({ width: 900, height: 560 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_GLOBAL_TOPOLOGY, {
    variables: { duration: durationObj },
    fetchPolicy: "network-only",
  });

  const isDark = resolvedTheme === "dark";
  const labelColor = isDark ? "#F1F5F9" : "#0F172A";
  const labelMuted = isDark ? "#94A3B8" : "#64748B";
  const ringColor = isDark ? "rgba(15, 23, 42, 0.92)" : "rgba(255, 255, 255, 0.96)";
  const linkColor = isDark ? "rgba(96, 165, 250, 0.35)" : "rgba(59, 130, 246, 0.28)";

  const graphData = useMemo(() => {
    const nodesRaw = data?.getGlobalTopology?.nodes ?? [];
    const callsRaw = data?.getGlobalTopology?.calls ?? [];

    const nodes: GraphNode[] = nodesRaw.map((node: GraphNode) => ({
      id: node.id,
      name: node.name,
      type: node.type,
      isReal: node.isReal,
      color: node.isReal ? "#3B82F6" : "#64748B",
      glow: node.isReal ? "rgba(59, 130, 246, 0.45)" : "rgba(100, 116, 139, 0.35)",
    }));

    const links = callsRaw.map((call: { source: string; target: string; id: string }) => ({
      source: call.source,
      target: call.target,
      id: call.id,
    }));

    return { nodes, links };
  }, [data]);

  const stats = useMemo(() => {
    const services = graphData.nodes.filter((n) => n.isReal).length;
    const external = graphData.nodes.length - services;
    return { services, external, links: graphData.links.length };
  }, [graphData]);

  const activeId = hoveredId ?? selectedId;
  const activeNode = graphData.nodes.find((n) => n.id === activeId) ?? null;

  const serviceNodes = useMemo(
    () => graphData.nodes.filter((n) => n.isReal),
    [graphData.nodes],
  );
  const externalNodes = useMemo(
    () => graphData.nodes.filter((n) => !n.isReal),
    [graphData.nodes],
  );

  const freezeLayout = useCallback(() => {
    graphData.nodes.forEach((node) => {
      node.fx = node.x;
      node.fy = node.y;
    });
  }, [graphData]);

  const relayout = useCallback(() => {
    graphData.nodes.forEach((node) => {
      node.fx = undefined;
      node.fy = undefined;
    });
    hasFittedRef.current = false;
    setSelectedId(null);
    graphRef.current?.d3ReheatSimulation();
  }, [graphData]);

  const fitView = useCallback(() => {
    graphRef.current?.zoomToFit(400, 100);
  }, []);

  const zoomBy = useCallback((factor: number) => {
    const graph = graphRef.current;
    if (!graph) return;
    graph.zoom(graph.zoom() * factor, 300);
  }, []);

  const focusNode = useCallback((node: GraphNode) => {
    setSelectedId(node.id);
    if (node.x != null && node.y != null) {
      graphRef.current?.centerAt(node.x, node.y, 450);
      graphRef.current?.zoom(1.35, 450);
    }
  }, []);

  useEffect(() => {
    hasFittedRef.current = false;
    setSelectedId(null);
    setHoveredId(null);
  }, [graphData]);

  useEffect(() => {
    const handleAutoUpdate = (e: Event) => {
      const { filters } = (e as CustomEvent).detail ?? {};
      if (filters?.startDate && filters?.endDate) {
        setCustomRange(filters.startDate, filters.endDate);
      }
      setTimeout(() => refetch(), 500);
    };

    window.addEventListener("skyobserv:query-update", handleAutoUpdate);
    return () => window.removeEventListener("skyobserv:query-update", handleAutoUpdate);
  }, [refetch, setCustomRange]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateSize = () => {
      setDimensions({
        width: element.clientWidth || 900,
        height: element.clientHeight || 560,
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || graphData.nodes.length === 0) return;

    graph.d3Force("charge")?.strength(-380);
    graph.d3Force("link")?.distance(180);
  }, [graphData]);

  const drawNode = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number, emphasis: "normal" | "hover" | "selected") => {
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const scaleBoost = emphasis === "selected" ? 4 : emphasis === "hover" ? 2 : 0;
      const radius = (NODE_RADIUS_PX + scaleBoost) / globalScale;
      const fontSize = LABEL_PX / globalScale;

      if (emphasis !== "normal") {
        ctx.beginPath();
        ctx.arc(x, y, radius + 12 / globalScale, 0, 2 * Math.PI, false);
        ctx.fillStyle = node.glow;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(x, y, radius + 3 / globalScale, 0, 2 * Math.PI, false);
      ctx.fillStyle = ringColor;
      ctx.fill();

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, node.isReal ? "#60A5FA" : "#94A3B8");
      gradient.addColorStop(1, node.color);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.font = `600 ${fontSize}px Work Sans, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = emphasis !== "normal" ? labelColor : labelMuted;
      ctx.fillText(formatNodeLabel(node.name), x, y + LABEL_OFFSET_PX / globalScale);
    },
    [labelColor, labelMuted, ringColor],
  );

  return (
    <AppLayout>
      <div className="h-[calc(100vh-140px)] flex flex-col so-page">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="so-page-header">
            <div className="flex items-center gap-2">
              <div className="so-icon-wrap bg-primary/10 text-primary">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h2>Global Topology</h2>
                <p>Live service map — hover, drag nodes, or pick from the list</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatPill icon={Server} label="Services" value={stats.services} tone="primary" />
            <StatPill icon={Globe} label="External" value={stats.external} tone="muted" />
            <StatPill icon={Link2} label="Links" value={stats.links} tone="accent" />
          </div>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_17rem] gap-4">
          <div className="so-card overflow-hidden relative min-h-[420px] flex flex-col">
            <div
              ref={containerRef}
              className="topology-graph topology-dot-grid relative flex-1 min-h-[380px]"
            >
              {error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-destructive gap-3 z-10 bg-card">
                  <AlertCircle className="w-10 h-10 opacity-50" />
                  <div className="text-center">
                    <p className="font-semibold">Topology load failed</p>
                    <p className="text-xs text-muted-foreground">{error.message}</p>
                  </div>
                </div>
              ) : loading && graphData.nodes.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3 z-10 bg-card/80 backdrop-blur-sm">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary/50" />
                  <p className="text-sm font-medium">Mapping service dependencies…</p>
                </div>
              ) : graphData.nodes.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2 z-10">
                  <Globe className="w-10 h-10 opacity-30" />
                  <p className="text-sm font-medium">No traffic in this time window</p>
                  <p className="text-xs">Try a wider range or send traces from your app</p>
                </div>
              ) : (
                <ForceGraph2D
                  ref={graphRef}
                  graphData={graphData}
                  width={dimensions.width}
                  height={dimensions.height}
                  nodeLabel="name"
                  nodeRelSize={8}
                  enableNodeDrag
                  enablePanInteraction
                  enableZoomInteraction
                  autoPauseRedraw={false}
                  showPointerCursor
                  warmupTicks={280}
                  cooldownTicks={0}
                  minZoom={0.35}
                  maxZoom={4}
                  linkColor={() => linkColor}
                  linkWidth={1.5}
                  linkCurvature={0.12}
                  linkDirectionalParticles={3}
                  linkDirectionalParticleSpeed={0.005}
                  linkDirectionalParticleWidth={2.5}
                  linkDirectionalParticleColor={() => (isDark ? "#60A5FA" : "#3B82F6")}
                  backgroundColor="transparent"
                  onEngineStop={() => {
                    freezeLayout();
                    if (hasFittedRef.current) return;
                    hasFittedRef.current = true;
                    graphRef.current?.zoomToFit(500, 100);
                  }}
                  onNodeClick={(node) => {
                    focusNode(node as GraphNode);
                  }}
                  onNodeHover={(node) => {
                    setHoveredId(node ? (node as GraphNode).id : null);
                  }}
                  onBackgroundClick={() => setSelectedId(null)}
                  onNodeDrag={(node) => {
                    const n = node as GraphNode;
                    n.fx = n.x;
                    n.fy = n.y;
                  }}
                  onNodeDragEnd={(node) => {
                    const n = node as GraphNode;
                    n.fx = n.x;
                    n.fy = n.y;
                  }}
                  nodePointerAreaPaint={(node, color, ctx, globalScale) => {
                    const n = node as GraphNode;
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(n.x ?? 0, n.y ?? 0, HIT_RADIUS_PX / globalScale, 0, 2 * Math.PI, false);
                    ctx.fill();
                  }}
                  nodeCanvasObjectMode={() => "replace"}
                  nodeCanvasObject={(node, ctx, globalScale) => {
                    const n = node as GraphNode;
                    const emphasis =
                      n.id === selectedId ? "selected" : n.id === hoveredId ? "hover" : "normal";
                    drawNode(n, ctx, globalScale, emphasis);
                  }}
                />
              )}

              {graphData.nodes.length > 0 && (
                <>
                  <div className="absolute top-3 right-3 flex items-center gap-1 rounded-lg border border-border/80 bg-card/90 backdrop-blur-md p-1 shadow-sm z-20">
                    <GraphToolButton icon={ZoomIn} label="Zoom in" onClick={() => zoomBy(1.25)} />
                    <GraphToolButton icon={ZoomOut} label="Zoom out" onClick={() => zoomBy(0.8)} />
                    <GraphToolButton icon={Maximize2} label="Fit view" onClick={fitView} />
                    <GraphToolButton icon={Shuffle} label="Re-arrange" onClick={relayout} />
                    <GraphToolButton icon={RefreshCw} label="Refresh" onClick={() => refetch()} />
                  </div>

                  <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full border border-border/80 bg-card/90 backdrop-blur-md px-3 py-1.5 text-[11px] text-muted-foreground shadow-sm z-20">
                    <MousePointer2 className="w-3.5 h-3.5 text-primary" />
                    Hover to highlight · Drag to move · Click to focus
                  </div>

                  {activeNode && (
                    <div className="absolute bottom-3 right-3 w-64 rounded-xl border border-border/80 bg-card/95 backdrop-blur-md p-3 shadow-lg z-20 animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <div className="flex items-start gap-2.5">
                        <div
                          className={cn(
                            "mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-card",
                            activeNode.isReal ? "bg-primary ring-primary/30" : "bg-slate-400 ring-slate-400/30",
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground truncate" title={activeNode.name}>
                            {activeNode.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {activeNode.isReal ? "Active service" : "External dependency"}
                            {activeNode.type ? ` · ${activeNode.type}` : ""}
                          </p>
                          {activeNode.isReal && (
                            <Link
                              href={`/services/${activeNode.id}`}
                              className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                            >
                              Open service
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <aside className="so-card flex flex-col min-h-[280px] lg:min-h-0 overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">Nodes</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Click to focus on the graph</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-3">
              <NodeGroup
                title="Active services"
                nodes={serviceNodes}
                selectedId={selectedId}
                hoveredId={hoveredId}
                onSelect={focusNode}
                onHover={setHoveredId}
              />
              <NodeGroup
                title="External / virtual"
                nodes={externalNodes}
                selectedId={selectedId}
                hoveredId={hoveredId}
                onSelect={focusNode}
                onHover={setHoveredId}
              />
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: "primary" | "muted" | "accent";
}) {
  const toneClass =
    tone === "primary"
      ? "bg-primary/10 text-primary"
      : tone === "accent"
        ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
        : "bg-muted text-muted-foreground";

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
      <div className={cn("flex h-6 w-6 items-center justify-center rounded-full", toneClass)}>
        <Icon className="w-3 h-3" />
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground tabular-nums">{value}</span>
    </div>
  );
}

function GraphToolButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

function NodeGroup({
  title,
  nodes,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
}: {
  title: string;
  nodes: GraphNode[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (node: GraphNode) => void;
  onHover: (id: string | null) => void;
}) {
  if (nodes.length === 0) return null;

  return (
    <div>
      <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
        {title}
      </p>
      <ul className="space-y-1">
        {nodes.map((node) => {
          const active = node.id === selectedId || node.id === hoveredId;
          return (
            <li key={node.id}>
              <button
                type="button"
                onClick={() => onSelect(node)}
                onMouseEnter={() => onHover(node.id)}
                onMouseLeave={() => onHover(null)}
                className={cn(
                  "w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-all",
                  active
                    ? "bg-primary/10 text-foreground ring-1 ring-primary/25"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    node.isReal ? "bg-primary" : "bg-slate-400",
                  )}
                />
                <span className="truncate font-medium">{formatNodeLabel(node.name)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
