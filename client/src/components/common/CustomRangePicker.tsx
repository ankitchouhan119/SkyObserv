// src/components/common/CustomRangePicker.tsx
import React, { useState } from 'react';
import { useDurationStore } from '@/store/useDurationStore';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

export function CustomRangePicker() {
  const { setCustomRange } = useDurationStore();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const handleApply = () => {
    if (start && end) {
      setCustomRange(start, end); // Ab ye sirf dates bhejega
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="bg-card/50 border-white/10 text-xs h-9">
          <CalendarIcon className="mr-2 h-3.5 w-3.5 text-primary" />
          Custom Date
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 bg-card border-white/10 p-4" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Start Date</label>
            <Input 
              type="date" // 🔥 FIX: Sirf Date mangega, Time nahi
              className="bg-background border-white/5"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">End Date</label>
            <Input 
              type="date" // 🔥 FIX: Sirf Date mangega, Time nahi
              className="bg-background border-white/5"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>

          <Button className="w-full h-8 text-xs" onClick={handleApply} disabled={!start || !end}>
            Apply Date Range
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}