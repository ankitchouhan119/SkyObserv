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

interface MetricChartProps {
  title: string;
  data: { id: string; value: number }[];
  unit?: string;
  color?: string;
  loading?: boolean;
}

export function MetricChart({ title, data, unit = '', color = '#3b82f6', loading }: MetricChartProps) {

  const formattedData = data.map((item) => {
  const rawId = String(item.id || "");
  let timeLabel = "N/A";
  let fullLabel = "N/A";

  // 10 digits (Hour) ya 12 digits (Minute) dono ko match karein
  const timestampMatch = rawId.match(/\d{10,12}/);
  
  if (timestampMatch) {
    const ts = timestampMatch[0];
    try {
      const yyyy = Number(ts.substring(0, 4));
      const month = Number(ts.substring(4, 6)) - 1;
      const dd = Number(ts.substring(6, 8));
      const hh = Number(ts.substring(8, 10));
      // Minute sirf tabhi jab length 12 ho
      const mm = ts.length >= 12 ? Number(ts.substring(10, 12)) : 0;

      const utcDate = new Date(Date.UTC(yyyy, month, dd, hh, mm));

      if (!isNaN(utcDate.getTime())) {
        // IST (Local) Time conversion
        timeLabel = utcDate.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });

        fullLabel = utcDate.toLocaleString('en-IN', {
          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false
        });

        // Agar Date range hai aur naya din shuru ho raha hai, toh date dikhao
        if (ts.length === 10 && hh === 0) {
          timeLabel = utcDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        }
      }
    } catch (e) {
      timeLabel = ts.slice(-4); 
    }
  }

  return { time: timeLabel, fullTime: fullLabel, value: item.value };
});
  return (
    <Card className="p-6 border-white/5 bg-card/50 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase font-bold">{title}</h3>
        <span className="text-2xl font-bold font-mono text-white">
          {data.length > 0 ? data[data.length - 1].value.toLocaleString() : 0}
          <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
        </span>
      </div>
      
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id={`gradient-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="rgba(255,255,255,0.4)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              minTickGap={40} // 👈 Space for Date labels
              interval="preserveStartEnd"
            />
            <YAxis hide={false} stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip
              labelFormatter={(label, payload) => payload[0]?.payload?.fullTime || label}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill={`url(#gradient-${title.replace(/\s+/g, '-')})`}
              connectNulls={true} // 👈 Taaki blank gap na dikhe
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}