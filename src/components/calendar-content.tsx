import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type EconomicEvent = {
  id: string;
  date: string;
  time: string;
  country: string;
  name: string;
  actual: string;
  forecast: string;
  previous: string;
  impact: 'Tinggi' | 'Sedang' | 'Rendah';
};

export const defaultCalendarEvents: EconomicEvent[] = [
  { id: 'e1', date: '2026-10-07', time: '03:30', country: '🇺🇸', name: 'API Cushing number', actual: '—', forecast: '—', previous: '0,233 M', impact: 'Tinggi' },
  { id: 'e2', date: '2026-10-07', time: '03:30', country: '🇺🇸', name: 'API weekly crude imports', actual: '—', forecast: '—', previous: '-0,249 M', impact: 'Tinggi' },
  { id: 'e3', date: '2026-10-07', time: '03:30', country: '🇺🇸', name: 'API weekly heating oil', actual: '—', forecast: '—', previous: '-0,459 M', impact: 'Sedang' },
  { id: 'e4', date: '2026-10-07', time: '03:30', country: '🇺🇸', name: 'API weekly product imports', actual: '—', forecast: '—', previous: '0,435 M', impact: 'Sedang' },
  { id: 'e5', date: '2026-10-07', time: '03:30', country: '🇺🇸', name: 'API Wkly crude runs', actual: '—', forecast: '—', previous: '-0,282 M', impact: 'Rendah' },
  { id: 'e6', date: '2026-10-07', time: '03:30', country: '🇺🇸', name: 'API wkly crude Stk', actual: '—', forecast: '—', previous: '1,019 M', impact: 'Tinggi' },
  { id: 'e7', date: '2026-10-07', time: '05:00', country: '🇦🇺', name: 'AIG Construction Index', actual: '—', forecast: '—', previous: '-6,9', impact: 'Sedang' },
  { id: 'e8', date: '2026-10-07', time: '05:00', country: '🇦🇺', name: 'AIG Manufacturing Index', actual: '—', forecast: '—', previous: '-16,6', impact: 'Sedang' },
  { id: 'e9', date: '2026-10-07', time: '06:00', country: '🇯🇵', name: "Reuters Tankan Man'f Idx", actual: '—', forecast: '—', previous: '21', impact: 'Rendah' },
  { id: 'e10', date: '2026-10-07', time: '06:00', country: '🇯🇵', name: 'Reuters Tankan N-Man Idx', actual: '—', forecast: '—', previous: '29', impact: 'Rendah' },
];

const KEY = 'hsb-economic-calendar-v1';
type CalendarContextValue = {
  events: EconomicEvent[];
  setEvents: (events: EconomicEvent[] | ((previous: EconomicEvent[]) => EconomicEvent[])) => void;
};
const CalendarContext = createContext<CalendarContextValue | null>(null);

export function CalendarContentProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState(defaultCalendarEvents);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setEvents(parsed);
      }
    } catch { /* keep defaults when saved content is unreadable */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) {
      try { localStorage.setItem(KEY, JSON.stringify(events)); } catch { /* keep the page usable if browser storage is full */ }
    }
  }, [events, loaded]);
  return <CalendarContext.Provider value={{ events, setEvents }}>{children}</CalendarContext.Provider>;
}

export function useCalendarContent() {
  const context = useContext(CalendarContext);
  if (!context) throw new Error('CalendarContentProvider missing');
  return context;
}
