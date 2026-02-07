"use client";

import { Card } from "@/components/ui/card";
import { useEffect, useRef, useMemo } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { Activity, Share2 } from "lucide-react";

export function TopologyGraphCard(props: any) {
  const graphRef = useRef<any>();

  const data = props.args || props; 
  const nodes = data.nodes || [];
  const calls = data.calls || [];

  const graphData = useMemo(() => {
    // Create a Set of valid node IDs for validation
    const validNodeIds = new Set(nodes.map((n: any) => String(n.id)));
    
    
    // Process each call and show what's happening
    const validLinks = calls.map((c: any, index: number) => {
      const sourceId = String(typeof c.source === 'object' ? c.source.id : c.source);
      const targetId = String(typeof c.target === 'object' ? c.target.id : c.target);
      
      return {
        source: sourceId,
        target: targetId,
      };
    }).filter((link: any) => {
      const isValid = validNodeIds.has(link.source) && validNodeIds.has(link.target);
      if (!isValid) {
        console.warn(`Filtered out invalid link:`, link);
      }
      return isValid;
    });
    

    return {
      nodes: nodes.map((n: any) => ({
        id: String(n.id),
        name: n.name || "Unknown",
        isReal: n.isReal,
        color: n.isReal ? "#3b82f6" : "#64748b",
      })),
      links: validLinks,
    };
  }, [nodes, calls]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Dependency Graph</h3>
        </div>
        <div className="text-[10px] text-muted-foreground bg-white/5 px-2 py-1 rounded">
          {graphData.nodes.length} Nodes | {graphData.links.length} Links
        </div>
      </div>

      <Card className="bg-[#0a0a0a]/90 border-white/5 overflow-hidden rounded-xl h-[400px] relative">
        {graphData.nodes.length > 0 ? (
          <ForceGraph2D
              graphData={graphData}
              nodeLabel="name"
              nodeRelSize={6}
              linkColor={() => 'rgba(255, 255, 255, 0.15)'}
              linkDirectionalParticles={3}
              linkDirectionalParticleSpeed={0.005}
              linkDirectionalParticleWidth={2}
              backgroundColor="transparent"
              width={500}
              height={400}
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
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs p-4 text-center">
            <Activity className="w-6 h-6 opacity-20 animate-pulse" />
            No data synced to card yet. Check Tool console logs.
          </div>
        )}
      </Card>
    </div>
  );
}