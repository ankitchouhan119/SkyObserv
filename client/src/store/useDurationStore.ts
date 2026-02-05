import { create } from 'zustand';

type Step = 'MINUTE' | 'HOUR';

interface DurationObj {
  start: string;
  end: string;
  step: Step;
}

interface DurationState {
  label: string;
  durationObj: DurationObj;
  setDuration: (label: string, minutes: number, step: Step) => void;
  setCustomRange: (startDate: string, endDate: string) => void; // 👈 1. Interface mein add karein
  refresh: () => void;
}

const formatSkyTime = (date: Date, step: Step) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = date.getUTCFullYear();
  const mm = pad(date.getUTCMonth() + 1);
  const dd = pad(date.getUTCDate());
  const hh = pad(date.getUTCHours());
  const min = pad(date.getUTCMinutes());

  if (step === 'MINUTE') return `${yyyy}-${mm}-${dd} ${hh}${min}`;
  return `${yyyy}-${mm}-${dd} ${hh}`;
};

export const useDurationStore = create<DurationState>((set, get) => ({
  label: 'Last 15 Minutes',
  durationObj: {
    start: formatSkyTime(new Date(Date.now() - 15 * 60 * 1000), 'MINUTE'),
    end: formatSkyTime(new Date(), 'MINUTE'),
    step: 'MINUTE',
  },
  
  setDuration: (label, minutes, step) => {
    const now = new Date();
    const end = new Date(now.getTime() - 2 * 60 * 1000); 
    const start = new Date(end.getTime() - minutes * 60 * 1000);
    
    set({
      label,
      durationObj: {
        start: formatSkyTime(start, step),
        end: formatSkyTime(end, step),
        step,
      },
    });
  },

  // 🔥 2. Is function ko sahi se yahan define karein
setCustomRange: (startDate: string, endDate: string) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

  // SkyWalking HOUR format: YYYY-MM-DD HH
  const startStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())} 00`;
  const endStr = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())} 23`;

  set({
    label: 'Custom Date',
    durationObj: {
      start: startStr,
      end: endStr,
      step: 'HOUR', // 🔥 Fixed to HOUR for performance
    },
  });
},

  refresh: () => {
    const { label } = get();
    if (label === 'Custom Date') return; // Custom date refresh nahi hogi
    
    let mins = 15;
    if (label.includes('30')) mins = 30;
    else if (label.includes('1 Hour')) mins = 60;
    else if (label.includes('6 Hour')) mins = 360;
    else if (label.includes('12 Hour')) mins = 720;
    else if (label.includes('24 Hour')) mins = 1440;

    const step: Step = mins >= 60 ? 'HOUR' : 'MINUTE';
    get().setDuration(label, mins, step);
  }
}));