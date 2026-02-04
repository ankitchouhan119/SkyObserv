import React from 'react';
import { useDurationStore } from '@/store/useDurationStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Clock, RefreshCw } from 'lucide-react';

const ranges = [
  { label: 'Last 15 Minutes', minutes: 15, step: 'MINUTE' as const },
  { label: 'Last 30 Minutes', minutes: 30, step: 'MINUTE' as const },
  { label: 'Last 1 Hour', minutes: 60, step: 'MINUTE' as const },
  { label: 'Last 6 Hours', minutes: 360, step: 'MINUTE' as const }, // Often better as HOUR but MINUTE gives more detail
  { label: 'Last 12 Hours', minutes: 720, step: 'MINUTE' as const },
  { label: 'Last 24 Hours', minutes: 1440, step: 'HOUR' as const },
];

export function DurationSelector() {
  const { label, setDuration, refresh } = useDurationStore();

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-[180px] justify-start text-left font-normal bg-card/50 border-white/10 hover:bg-white/5">
            <Clock className="mr-2 h-4 w-4 text-primary" />
            {label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px] bg-card border-white/10">
          {ranges.map((range) => (
            <DropdownMenuItem
              key={range.label}
              onClick={() => setDuration(range.label, range.minutes, range.step)}
              className="cursor-pointer focus:bg-primary/10"
            >
              {range.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="ghost" size="icon" onClick={refresh} className="hover:bg-primary/10 hover:text-primary">
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
}
