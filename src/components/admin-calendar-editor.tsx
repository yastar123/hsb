import { Link } from '@tanstack/react-router';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useCalendarContent, type EconomicEvent } from '@/components/calendar-content';
import { Button } from '@/components/ui/button';
import { SaveStatusText } from '@/lib/site-content';

const input = 'w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground';
const blankEvent = (): EconomicEvent => ({
  id: crypto.randomUUID(),
  date: new Date().toISOString().slice(0, 10),
  time: '09:00',
  country: '🇺🇸',
  name: '',
  actual: '—',
  forecast: '—',
  previous: '—',
  impact: 'Sedang',
});

export function AdminCalendarEditor() {
  const { events, setEvents, status, error } = useCalendarContent();
  const [draft, setDraft] = useState<EconomicEvent>(blankEvent);
  const update = (id: string, patch: Partial<EconomicEvent>) => setEvents((list) => list.map((item) => item.id === id ? { ...item, ...patch } : item));
  const ordered = [...events].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  const add = () => {
    if (!draft.name.trim()) return;
    setEvents((list) => [draft, ...list]);
    setDraft(blankEvent());
  };
  return <main className="min-w-0 bg-muted p-3 text-foreground sm:p-6">
    <header className="mb-4 flex flex-wrap items-center gap-3">
      <CalendarDays className="size-5" /><h1 className="text-xl font-bold">Kelola Kalender Ekonomi</h1>
      <Button asChild variant="outline" size="sm" className="ml-auto"><Link to="/kalender-ekonomi">Buka kalender</Link></Button>
    </header>
    <p className="mb-4 rounded-lg bg-accent px-4 py-2 text-xs text-accent-foreground"><SaveStatusText status={status} error={error} /> Agenda dimasukkan admin; tidak ada feed peristiwa otomatis.</p>
    <section className="mb-4 grid gap-2 rounded-xl border border-border bg-background p-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className="grid gap-1 text-xs">Tanggal<input type="date" className={input} value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></label>
      <label className="grid gap-1 text-xs">Waktu<input type="time" className={input} value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} /></label>
      <label className="grid gap-1 text-xs">Negara / bendera<input className={input} value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} placeholder="🇺🇸 atau kode negara" /></label>
      <label className="grid gap-1 text-xs">Dampak<select className={input} value={draft.impact} onChange={(e) => setDraft({ ...draft, impact: e.target.value as EconomicEvent['impact'] })}><option>Tinggi</option><option>Sedang</option><option>Rendah</option></select></label>
      <label className="grid gap-1 text-xs sm:col-span-2">Nama peristiwa<input className={input} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Contoh: Inflasi bulanan" /></label>
      <label className="grid gap-1 text-xs">Aktual<input className={input} value={draft.actual} onChange={(e) => setDraft({ ...draft, actual: e.target.value })} /></label>
      <label className="grid gap-1 text-xs">Prakiraan<input className={input} value={draft.forecast} onChange={(e) => setDraft({ ...draft, forecast: e.target.value })} /></label>
      <label className="grid gap-1 text-xs">Sebelumnya<input className={input} value={draft.previous} onChange={(e) => setDraft({ ...draft, previous: e.target.value })} /></label>
      <div className="flex items-end"><Button className="w-full" onClick={add} disabled={!draft.name.trim()}><Plus /> Tambah agenda</Button></div>
    </section>
    <section className="space-y-3">
      {ordered.map((event) => <article key={event.id} className="grid min-w-0 gap-2 rounded-xl border border-border bg-background p-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-1 text-xs">Tanggal<input type="date" className={input} value={event.date} onChange={(e) => update(event.id, { date: e.target.value })} /></label>
        <label className="grid gap-1 text-xs">Waktu<input type="time" className={input} value={event.time} onChange={(e) => update(event.id, { time: e.target.value })} /></label>
        <label className="grid gap-1 text-xs">Negara / bendera<input className={input} value={event.country} onChange={(e) => update(event.id, { country: e.target.value })} /></label>
        <label className="grid gap-1 text-xs">Dampak<select className={input} value={event.impact} onChange={(e) => update(event.id, { impact: e.target.value as EconomicEvent['impact'] })}><option>Tinggi</option><option>Sedang</option><option>Rendah</option></select></label>
        <label className="grid gap-1 text-xs sm:col-span-2">Nama peristiwa<input className={input} value={event.name} onChange={(e) => update(event.id, { name: e.target.value })} /></label>
        <label className="grid gap-1 text-xs">Aktual<input className={input} value={event.actual} onChange={(e) => update(event.id, { actual: e.target.value })} /></label>
        <label className="grid gap-1 text-xs">Prakiraan<input className={input} value={event.forecast} onChange={(e) => update(event.id, { forecast: e.target.value })} /></label>
        <label className="grid gap-1 text-xs">Sebelumnya<input className={input} value={event.previous} onChange={(e) => update(event.id, { previous: e.target.value })} /></label>
        <div className="flex items-end"><Button variant="destructive" className="w-full" onClick={() => setEvents((list) => list.filter((item) => item.id !== event.id))}><Trash2 /> Hapus</Button></div>
      </article>)}
      {ordered.length === 0 && <p className="rounded-xl border border-dashed border-border bg-background p-8 text-center text-sm text-muted-foreground">Belum ada agenda. Tambahkan agenda di atas.</p>}
    </section>
  </main>;
}
