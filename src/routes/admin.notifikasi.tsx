import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pagination, usePagination } from '@/components/pagination';
import { useNotifs } from '@/lib/notifications';

export const Route = createFileRoute('/admin/notifikasi')({
  head: () => ({ meta: [
    { title: 'Kelola Notifikasi — Admin HSB' },
    { name: 'description', content: 'Kirim notifikasi ke semua user atau user tertentu (simulasi).' },
    { property: 'og:title', content: 'Kelola Notifikasi — Admin HSB' },
    { property: 'og:description', content: 'Panel admin untuk mengirim notifikasi ke user.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: AdminNotif,
});

type U = { id: string; name: string; email: string };
const seed: U[] = [
  { id: 'u1', name: 'Budi Santoso', email: 'budi@contoh.com' },
  { id: 'u2', name: 'Siti Rahma', email: 'siti@contoh.com' },
  { id: 'u3', name: 'Andi Wijaya', email: 'andi@contoh.com' },
];
const inp = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm';

function AdminNotif() {
  const [list, setList] = useNotifs();
  const [users, setUsers] = useState<U[]>(seed);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<'all' | 'some'>('all');
  const [picked, setPicked] = useState<string[]>([]);
  const [q, setQ] = useState('');
  useEffect(() => { try { const r = localStorage.getItem('hsb-admin-users-v1'); if (r) setUsers(JSON.parse(r)); } catch { /* ignore */ } }, []);

  const name = (id: string) => users.find((u) => u.id === id)?.name ?? 'User terhapus';
  const canSend = title.trim() && message.trim() && (mode === 'all' || picked.length > 0);
  const pg = usePagination(list);
  const send = () => {
    if (!canSend) return;
    setList([{ id: Math.random().toString(36).slice(2, 9), title: title.trim(), message: message.trim(), target: mode === 'all' ? 'all' : picked, createdAt: new Date().toISOString() }, ...list]);
    setTitle(''); setMessage(''); setPicked([]);
  };
  const shown = users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()));

  return <main className="space-y-4 p-4 text-foreground md:p-6">
    <div><h1 className="text-2xl font-bold">Kelola Notifikasi</h1><p className="text-sm text-muted-foreground">Tersimpan di browser ini · belum terhubung ke server.</p></div>
    <article className="space-y-3 rounded-xl border border-border bg-background p-4">
      <h2 className="font-semibold">Kirim Notifikasi Baru</h2>
      <input className={inp} placeholder="Judul" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Judul" />
      <textarea className={inp} rows={3} placeholder="Isi pesan" value={message} onChange={(e) => setMessage(e.target.value)} aria-label="Pesan" />
      <div className="flex gap-2">
        <Button size="sm" variant={mode === 'all' ? 'default' : 'outline'} onClick={() => setMode('all')}>Semua User</Button>
        <Button size="sm" variant={mode === 'some' ? 'default' : 'outline'} onClick={() => setMode('some')}>User Tertentu</Button>
      </div>
      {mode === 'some' && <div className="space-y-2 rounded-md border border-border p-3">
        <input className={inp} placeholder="Cari user…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari user" />
        <div className="max-h-56 space-y-1 overflow-y-auto">{shown.map((u) => <label key={u.id} className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={picked.includes(u.id)} onChange={(e) => setPicked((p) => e.target.checked ? [...p, u.id] : p.filter((x) => x !== u.id))} />
          <span className="font-medium">{u.name}</span><span className="text-muted-foreground">{u.email}</span></label>)}
          {!shown.length && <p className="text-sm text-muted-foreground">User tidak ditemukan.</p>}</div>
        <p className="text-xs text-muted-foreground">{picked.length} user dipilih</p>
      </div>}
      <Button disabled={!canSend} onClick={send}><Send /> Kirim</Button>
    </article>
    <article className="rounded-xl border border-border bg-background p-4">
      <h2 className="mb-2 font-semibold">Riwayat Notifikasi ({list.length})</h2>
      {!list.length && <p className="text-sm text-muted-foreground">Belum ada notifikasi terkirim.</p>}
      <ul className="divide-y divide-border">{pg.pageItems.map((n) => <li key={n.id} className="flex items-start justify-between gap-2 py-2">
        <div className="min-w-0"><p className="font-medium">{n.title}</p><p className="text-sm">{n.message}</p>
          <p className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString('id-ID')} · Ke: {n.target === 'all' ? 'Semua user' : n.target.map(name).join(', ')}</p></div>
        <Button size="icon" variant="ghost" aria-label="Hapus" onClick={() => setList(list.filter((x) => x.id !== n.id))}><Trash2 /></Button>
      </li>)}</ul>
      <Pagination page={pg.page} totalPages={pg.totalPages} total={pg.total} onPage={pg.setPage} />
    </article>
  </main>;
}
