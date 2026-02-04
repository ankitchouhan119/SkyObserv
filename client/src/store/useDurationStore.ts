import { create } from 'zustand';
import { subMinutes, subHours, subDays, format } from 'date-fns';

export type Step = 'MINUTE' | 'HOUR' | 'DAY';

interface DurationState {
  label: string; // e.g., "Last 15m"
  step: Step;
  durationObj: {
    start: string;
    end: string;
    step: Step;
  };
  setDuration: (label: string, minutes: number, step: Step) => void;
  refresh: () => void; // Update timestamps for "Last X" logic
}

const dateFormat = 'yyyy-MM-dd HHmm';

const generateDuration = (minutes: number, step: Step) => {
  const now = new Date();
  // SkyWalking expects 'yyyy-MM-dd HHmm' format
  const end = format(now, dateFormat);
  const start = format(subMinutes(now, minutes), dateFormat);
  return { start, end, step };
};

export const useDurationStore = create<DurationState>((set, get) => ({
  label: 'Last 15 Minutes',
  step: 'MINUTE',
  durationObj: generateDuration(15, 'MINUTE'),
  
  setDuration: (label, minutes, step) => {
    set({ 
      label, 
      step, 
      durationObj: generateDuration(minutes, step) 
    });
  },

  refresh: () => {
    const { label, step } = get();
    // Logic to re-calculate based on label is simplified here to just current selection
    // In a real app, we'd store the 'minutes' value in state too to re-compute exactly.
    // For now, let's assume standard intervals:
    let minutes = 15;
    if (label.includes('1 Hour')) minutes = 60;
    if (label.includes('6 Hours')) minutes = 360;
    if (label.includes('12 Hours')) minutes = 720;
    if (label.includes('24 Hours')) minutes = 1440;
    
    set({ durationObj: generateDuration(minutes, step) });
  }
}));
