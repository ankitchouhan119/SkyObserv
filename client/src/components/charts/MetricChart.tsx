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
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parse } from 'date-fns';

interface MetricChartProps {
  title: string;
  data: { id: string; value: number }[];
  unit?: string;
  color?: string;
  loading?: boolean;
}

export function MetricChart({ title, data, unit = '', color = '#3b82f6', loading }: MetricChartProps) {
  if (loading) {
    return (
      <Card className="p-6 h-[300px] border-white/5 bg-card/50">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">{title}</h3>
        <Skeleton className="w-full h-[200px]" />
      </Card>
    );
  }

  // Format data for Recharts
  // SkyWalking returns 'id' as 'yyyyMMddHHmm' usually
  const formattedData = data.map(item => {
    // Basic parsing assuming MINUTE step for now
    // In production, would use proper parsing based on step
    const dateStr = item.id; 
    // Handle different formats if needed, e.g. 202310251200
    // Simplified parsing:
    const shortTime = dateStr.slice(-4);
    const timeLabel = `${shortTime.slice(0, 2)}:${shortTime.slice(2)}`;
    return {
      time: timeLabel,
      value: item.value,
      fullDate: item.id
    };
  });

  return (
    <Card className="p-6 border-white/5 bg-card/50 shadow-sm hover:border-primary/20 transition-colors">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-medium text-muted-foreground tracking-wide uppercase">{title}</h3>
        <span className="text-2xl font-bold font-mono">
          {data.length > 0 ? data[data.length - 1].value.toLocaleString() : 0}
          <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
        </span>
      </div>
      
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="rgba(255,255,255,0.3)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              minTickGap={30}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.3)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(value) => value >= 1000 ? `${value/1000}k` : value}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                borderColor: 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)' 
              }}
              itemStyle={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-mono)' }}
              labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem' }}
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={2}
              fillOpacity={1} 
              fill={`url(#gradient-${title})`} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
