import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface MetricChartProps {
  title: string;
  data: { id: string; value: number }[];
  unit?: string;
  color?: string;
  loading?: boolean;
}

export function MetricChart({ title, data, unit = '', color = '#2563EB', loading }: MetricChartProps) {
  const formattedData = data.map((item) => {
    const rawId = String(item.id || "");
    let timeLabel = "N/A";
    let fullLabel = "N/A";

    const timestampMatch = rawId.match(/\d{10,12}/);

    if (timestampMatch) {
      const ts = timestampMatch[0];
      try {
        const yyyy = Number(ts.substring(0, 4));
        const month = Number(ts.substring(4, 6)) - 1;
        const dd = Number(ts.substring(6, 8));
        const hh = Number(ts.substring(8, 10));
        const mm = ts.length >= 12 ? Number(ts.substring(10, 12)) : 0;

        const utcDate = new Date(Date.UTC(yyyy, month, dd, hh, mm));

        if (!isNaN(utcDate.getTime())) {
          timeLabel = utcDate.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });

          fullLabel = utcDate.toLocaleString('en-IN', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
          });

          if (ts.length === 10 && hh === 0) {
            timeLabel = utcDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
          }
        }
      } catch {
        timeLabel = ts.slice(-4);
      }
    }

    return { time: timeLabel, fullTime: fullLabel, value: item.value };
  });

  if (loading) {
    return (
      <div className="so-card p-5">
        <Skeleton className="h-4 w-24 mb-4" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  return (
    <div className="so-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</h3>
        <span className="text-2xl font-semibold font-mono text-foreground tabular-nums">
          {data.length > 0 ? data[data.length - 1].value.toLocaleString() : 0}
          <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
        </span>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id={`gradient-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
              interval="preserveStartEnd"
            />
            <YAxis hide={false} stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip
              labelFormatter={(label, payload) => payload[0]?.payload?.fullTime || label}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#gradient-${title.replace(/\s+/g, '-')})`}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
