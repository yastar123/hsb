import { createContext, useContext, type ReactNode } from 'react';
import { useServerContent, type SaveStatus } from '@/lib/site-content';

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

export const defaultCalendarEvents: EconomicEvent[] = [];

const KEY = 'hsb-economic-calendar-v1';
type CalendarContextValue = {
  events: EconomicEvent[];
  setEvents: (events: EconomicEvent[] | ((previous: EconomicEvent[]) => EconomicEvent[])) => void;
  status: SaveStatus;
  error: string;
};
const CalendarContext = createContext<CalendarContextValue | null>(null);

export function CalendarContentProvider({ children }: { children: ReactNode }) {
  const remote = useServerContent<EconomicEvent[]>('calendar', defaultCalendarEvents);
  return <CalendarContext.Provider value={{ events: remote.value, setEvents: remote.setValue, status: remote.status, error: remote.error }}>{children}</CalendarContext.Provider>;
}

export function useCalendarContent() {
  const context = useContext(CalendarContext);
  if (!context) throw new Error('CalendarContentProvider missing');
  return context;
}
