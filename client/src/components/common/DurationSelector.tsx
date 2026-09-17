import { useDurationStore } from '@/store/useDurationStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Clock, RefreshCw } from 'lucide-react';

const ranges = [
  { label: 'Last 15 Minutes', minutes: 15, step: 'MINUTE' as const },
  { label: 'Last 30 Minutes', minutes: 30, step: 'MINUTE' as const },
  { label: 'Last 1 Hour', minutes: 60, step: 'HOUR' as const },
  { label: 'Last 6 Hours', minutes: 360, step: 'HOUR' as const },
  { label: 'Last 12 Hours', minutes: 720, step: 'HOUR' as const },
  { label: 'Last 24 Hours', minutes: 1440, step: 'HOUR' as const },
];

const autoRefreshOptions = [
  { label: 'Auto refresh off', ms: 0 },
  { label: '1 second', ms: 1_000 },
  { label: '5 seconds', ms: 5_000 },
  { label: '30 seconds', ms: 30_000 },
  { label: '1 minute', ms: 60_000 },
  { label: '2 minutes', ms: 120_000 },
  { label: '5 minutes', ms: 300_000 },
];

export function DurationSelector() {
  const { label, setDuration, refresh, autoRefreshMs, setAutoRefresh } = useDurationStore();

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-[180px]">
            <Clock className="mr-2 h-4 w-4 text-primary" />
            {label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {ranges.map((r) => (
            <DropdownMenuItem key={r.label} onClick={() => setDuration(r.label, r.minutes, r.step)}>
              {r.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" title="Refresh">
            <RefreshCw className={`h-4 w-4 ${autoRefreshMs > 0 ? 'text-primary' : ''}`} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={refresh}>Refresh now</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Auto refresh</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={String(autoRefreshMs)}
            onValueChange={(value) => setAutoRefresh(Number(value))}
          >
            {autoRefreshOptions.map((option) => (
              <DropdownMenuRadioItem key={option.ms} value={String(option.ms)}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
