import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Activity, Zap } from "lucide-react";

type Props = {
  serviceName: string;
  latency: number;
  throughput: number;
  sla: number;
  latencyValues?: Array<{ id: string; value: number }>;
  throughputValues?: Array<{ id: string; value: number }>;
  slaValues?: Array<{ id: string; value: number }>;
  showChart?: boolean;
};

export function DetailedMetricsCard({
  serviceName,
  latency,
  throughput,
  sla,
  latencyValues = [],
  throughputValues = [],
  slaValues = [],
  showChart = true,
}: Props) {
  // Prepare chart data
  const chartData = latencyValues.map((item, idx) => ({
    time: new Date(parseInt(item.id)).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    latency: item.value || 0,
    throughput: throughputValues[idx]?.value || 0,
    sla: slaValues[idx]?.value || 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-1">{serviceName}</h3>
        <p className="text-sm text-muted-foreground">Service Performance Metrics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-900/20 to-transparent border-blue-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Latency</p>
              <p className="text-2xl font-bold">{latency} <span className="text-sm">ms</span></p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-900/20 to-transparent border-green-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Zap className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Throughput</p>
              <p className="text-2xl font-bold">{throughput} <span className="text-sm">cpm</span></p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-900/20 to-transparent border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">SLA</p>
              <p className="text-2xl font-bold">{sla} <span className="text-sm">%</span></p>
            </div>
          </div>
        </Card>
      </div>

      {/* Chart */}
      {showChart && chartData.length > 0 && (
        <Card className="p-6 bg-card/40 border-white/10">
          <h4 className="text-sm font-medium mb-4">Metrics Over Time</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="time"
                stroke="#888"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="#888" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="latency"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Latency (ms)"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="throughput"
                stroke="#10b981"
                strokeWidth={2}
                name="Throughput (cpm)"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
