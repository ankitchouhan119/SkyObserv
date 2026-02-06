import { Card } from "@/components/ui/card";
import { useEffect, useRef } from "react";
import ForceGraph2D from "react-force-graph-2d";

type Node = {
  id: string;
  name: string;
  type: string;
  isReal: boolean;
  layers?: string[];
};

type Call = {
  id: string;
  source: string;
  target: string;
  detectPoints?: string[];
};

type Props = {
  nodes: Node[];
  calls: Call[];
};

export function TopologyGraphCard({ nodes, calls }: Props) {
  const graphRef = useRef<any>();

  // Transform data for force graph
  const graphData = {
    nodes: nodes.map((node) => ({
      id: node.id,
      name: node.name,
      type: node.type,
      isReal: node.isReal,
      color: node.isReal ? "#3b82f6" : "#6b7280",
    })),
    links: calls.map((call) => ({
      source: call.source,
      target: call.target,
      id: call.id,
    })),
  };

  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3Force("charge").strength(-400);
      graphRef.current.d3Force("link").distance(100);
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Service Topology</h3>
        <div className="text-sm text-muted-foreground">
          {nodes.length} services, {calls.length} connections
        </div>
      </div>

      <Card className="p-4 bg-card/40 border-white/10">
        <div className="w-full h-[400px] bg-black/20 rounded-lg overflow-hidden">
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            nodeLabel="name"
            nodeColor={(node: any) => node.color}
            nodeRelSize={8}
            linkColor={() => "#444"}
            linkWidth={2}
            linkDirectionalArrowLength={6}
            linkDirectionalArrowRelPos={1}
            backgroundColor="#0a0a0a"
            nodeCanvasObject={(node: any, ctx: any, globalScale: number) => {
              const label = node.name;
              const fontSize = 12 / globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;
              
              // Draw node circle
              ctx.beginPath();
              ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI);
              ctx.fillStyle = node.color;
              ctx.fill();
              ctx.strokeStyle = node.isReal ? "#60a5fa" : "#9ca3af";
              ctx.lineWidth = 2 / globalScale;
              ctx.stroke();

              // Draw label
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = "#fff";
              ctx.fillText(label, node.x, node.y + 12);
            }}
          />
        </div>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">Real Service</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-500" />
          <span className="text-muted-foreground">Virtual/External</span>
        </div>
      </div>
    </div>
  );
}
