"use client";

import React, { useEffect, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { GET_GLOBAL_TOPOLOGY } from '@/apollo/queries/topology';
import { useDurationStore } from '@/store/useDurationStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Activity } from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';

export default function TopologyPage() {
  const { durationObj, setCustomRange } = useDurationStore();
  
  const { data, loading, error, refetch } = useQuery(GET_GLOBAL_TOPOLOGY, {
    variables: { duration: durationObj },
    fetchPolicy: "network-only",
  });

  // Safe Graph Data Mapping
  const graphData = useMemo(() => {
    // Safety check for undefined data or nested properties
    const nodesRaw = data?.getGlobalTopology?.nodes ?? [];
    const callsRaw = data?.getGlobalTopology?.calls ?? [];

    const nodes = nodesRaw.map((node: any) => ({
      id: node.id,
      name: node.name,
      type: node.type,
      isReal: node.isReal,
      color: node.isReal ? '#3b82f6' : '#64748b' 
    }));

    const links = callsRaw.map((call: any) => ({
      source: call.source,
      target: call.target,
      id: call.id,
    }));

    return { nodes, links };
  }, [data]);

  useEffect(() => {
    const handleAutoUpdate = (e: any) => {
      const { filters } = e.detail;
      
      if (filters) {
        console.log("Topology Syncing with Filters:", filters);

        // Update Global Duration Store if AI sends new timestamps
        if (filters.startDate && filters.endDate) {
          setCustomRange(filters.startDate, filters.endDate);
        }

        // Small delay to let the store update before refetching
        setTimeout(() => {
          refetch();
        }, 500);
      }
    };

    window.addEventListener("skyobserv:query-update", handleAutoUpdate);
    return () => window.removeEventListener("skyobserv:query-update", handleAutoUpdate);
  }, [refetch, setCustomRange]);

  return (
    <AppLayout>
      <div className="h-[calc(100vh-140px)] flex flex-col max-w-7xl mx-auto space-y-4">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight text-white">Global Topology</h1>
            </div>
            <p className="text-muted-foreground text-sm">Visualizing service dependencies and traffic flow</p>
          </div>
          <button 
            onClick={() => refetch()} 
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all"
            title="Refresh Topology"
          >
            <RefreshCw className={`w-4 h-4 text-primary ${loading ? 'animate-spin' : ''}`} />
            <span className="text-xs font-medium text-white">Refresh</span>
          </button>
        </div>

        {/* Graph Container */}
        <Card className="flex-1 bg-[#0a0a0a]/60 border-white/5 overflow-hidden relative shadow-2xl backdrop-blur-sm">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 gap-3">
              <AlertCircle className="w-10 h-10 opacity-50" />
              <div className="text-center">
                <p className="font-semibold">Topology Load Failed</p>
                <p className="text-xs opacity-70">{error.message}</p>
              </div>
            </div>
          ) : loading && graphData.nodes.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-primary/50" />
              <p className="text-sm font-medium animate-pulse">Syncing dependency graph...</p>
            </div>
          ) : graphData.nodes.length === 0 ? (
             <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                No service communication detected in this time window.
             </div>
          ) : (
            <ForceGraph2D
              graphData={graphData}
              nodeLabel="name"
              nodeRelSize={6}
              linkColor={() => 'rgba(255, 255, 255, 0.15)'}
              linkDirectionalParticles={3}
              linkDirectionalParticleSpeed={0.005}
              linkDirectionalParticleWidth={2}
              backgroundColor="transparent"
              width={1200}
              height={700}
              onNodeClick={(node) => console.log('Selected Service:', node.name)}
              nodeCanvasObject={(node: any, ctx, globalScale) => {
                const label = node.name;
                const fontSize = 13 / globalScale;
                ctx.font = `${fontSize}px Inter, Sans-Serif`;
                
                // Draw Node Circle
                ctx.beginPath();
                ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
                ctx.fillStyle = node.color;
                ctx.fill();
                
                // Draw Node Glow
                if (node.isReal) {
                  ctx.shadowColor = '#3b82f6';
                  ctx.shadowBlur = 10;
                }

                // Draw Text Label
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#ffffff';
                ctx.fillText(label, node.x, node.y + 12);
                
                // Reset shadow
                ctx.shadowBlur = 0;
              }}
            />
          )}
        </Card>

        {/* Legend */}
        <div className="flex items-center gap-6 px-2">
           <div className="flex items-center gap-2">
             <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
             <span className="text-[11px] text-slate-400 uppercase font-bold tracking-widest">Active Services</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
             <span className="text-[11px] text-slate-400 uppercase font-bold tracking-widest">External / Virtual</span>
           </div>
        </div>
      </div>
    </AppLayout>
  );
}