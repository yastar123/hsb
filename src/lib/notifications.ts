import { useEffect, useState } from 'react';

export type Notif = { id: string; title: string; message: string; target: 'all' | string[]; createdAt: string };
const KEY = 'hsb-notifications-v1';
const EVT = 'hsb-notifications-change';

export function loadNotifs(): Notif[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
export function saveNotifs(n: Notif[]) {
  localStorage.setItem(KEY, JSON.stringify(n));
  window.dispatchEvent(new Event(EVT));
}

export function useNotifs() {
  const [list, setList] = useState<Notif[]>([]);
  useEffect(() => {
    const sync = () => setList(loadNotifs());
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener('storage', sync); };
  }, []);
  const update = (n: Notif[]) => { saveNotifs(n); setList(n); };
  return [list, update] as const;
}
