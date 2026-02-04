import React, { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { GET_GLOBAL_TOPOLOGY } from '@/apollo/queries/topology';
import { useDurationStore } from '@/store/useDurationStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';

export default function TopologyPage() {
  const { durationObj } = useDurationStore();
  const { data, loading, error, refetch } = useQuery(GET_GLOBAL_TOPOLOGY, {
    variables: { duration: durationObj },
  });

  const graphData = useMemo(() => {
    if (!data?.getGlobalTopology) return { nodes: [], links: [] };
    
    const nodes = data.getGlobalTopology.nodes.map((node: any) => ({
      id: node.id,
      name: node.name,
      type: node.type,
      isReal: node.isReal,
    }));

    const links = data.getGlobalTopology.calls.map((call: any) => ({
      source: call.source,
      target: call.target,
      id: call.id,
    }));

    return { nodes, links };
  }, [data]);

  return (
    <AppLayout>
      <div className="h-[calc(100vh-140px)] flex flex-col max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Global Topology</h1>
            <p className="text-muted-foreground">Visualize service dependencies and communication paths</p>
          </div>
          <button 
            onClick={() => refetch()} 
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
            title="Refresh Topology"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <Card className="flex-1 bg-card/40 border-white/10 overflow-hidden relative">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 gap-2">
              <AlertCircle className="w-8 h-8" />
              <p>Failed to load topology. {error.message}</p>
            </div>
          ) : loading && graphData.nodes.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading topology map...
            </div>
          ) : (
            <ForceGraph2D
              graphData={graphData}
              nodeLabel="name"
              nodeColor={node => (node as any).isReal ? 'hsl(var(--primary))' : '#94a3b8'}
              linkColor={() => 'rgba(255, 255, 255, 0.1)'}
              linkDirectionalParticles={2}
              linkDirectionalParticleSpeed={0.005}
              backgroundColor="transparent"
              width={1200}
              height={700}
              nodeCanvasObject={(node, ctx, globalScale) => {
                const label = (node as any).name;
                const fontSize = 12 / globalScale;
                ctx.font = `${fontSize}px Inter`;
                const textWidth = ctx.measureText(label).width;
                const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect((node.x as number) - (bckgDimensions[0] as number) / 2, (node.y as number) - (bckgDimensions[1] as number) / 2, bckgDimensions[0] as number, bckgDimensions[1] as number);

                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = (node as any).isReal ? 'hsl(var(--primary))' : '#94a3b8';
                ctx.fillText(label, node.x as number, node.y as number);
              }}
            />
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
