import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pagination, usePagination } from '@/components/pagination';

export const Route = createFileRoute('/admin/user')({
  head: () => ({ meta: [
    { title: 'Kelola User — Admin HSB' },
    { name: 'description', content: 'Lihat, tambah, ubah, dan hapus user terdaftar HSB (simulasi).' },
    { property: 'og:title', content: 'Kelola User — Admin HSB' },
    { property: 'og:description', content: 'Panel admin untuk mengelola semua user terdaftar.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: AdminUser,
});

type Status = 'Aktif' | 'Belum Verifikasi' | 'Diblokir';
type User = { id: string; name: string; email: string; phone: string; joined: string; balance: number; status: Status };

const KEY = 'hsb-admin-users-v1';
const uid = () => Math.random().toString(36).slice(2, 9);
const seed: User[] = [
  { id: 'u1', name: 'Budi Santoso', email: 'budi@contoh.com', phone: '081234567890', joined: '2026-08-12', balance: 1500, status: 'Aktif' },
  { id: 'u2', name: 'Siti Rahma', email: 'siti@contoh.com', phone: '081298765432', joined: '2026-09-03', balance: 320, status: 'Belum Verifikasi' },
  { id: 'u3', name: 'Andi Wijaya', email: 'andi@contoh.com', phone: '085611223344', joined: '2026-09-21', balance: 0, status: 'Diblokir' },
];
const inp = 'w-full rounded-md border border-input bg-background px-2 py-1 text-sm';

function AdminUser() {
  const [users, setUsers] = useState<User[]>(seed);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  useEffect(() => { try { const r = localStorage.getItem(KEY); if (r) setUsers(JSON.parse(r)); } catch { /* ignore */ } setLoaded(true); }, []);
  useEffect(() => { if (loaded) localStorage.setItem(KEY, JSON.stringify(users)); }, [users, loaded]);

  const upd = (id: string, p: Partial<User>) => setUsers((us) => us.map((u) => u.id === id ? { ...u, ...p } : u));
  const shown = useMemo(() => users.filter((u) => (!status || u.status === status) && `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(q.toLowerCase())), [users, q, status]);
  const pg = usePagination(shown);
  const stats: [string, number][] = [['Total User', users.length], ['Aktif', users.filter((u) => u.status === 'Aktif').length], ['Belum Verifikasi', users.filter((u) => u.status === 'Belum Verifikasi').length], ['Diblokir', users.filter((u) => u.status === 'Diblokir').length]];

  return <main className="space-y-4 p-4 text-foreground md:p-6">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h1 className="text-2xl font-bold">Kelola User</h1><p className="text-sm text-muted-foreground">Simulasi · tersimpan di browser ini, belum terhubung ke akun sungguhan.</p></div>
      <Button variant="outline" onClick={() => setUsers(seed)}><RotateCcw /> Reset data contoh</Button>
    </div>
    <section className="grid gap-3 sm:grid-cols-4">{stats.map(([l, v]) =>
      <article key={l} className="rounded-xl border border-border bg-background p-4"><p className="text-sm text-muted-foreground">{l}</p><p className="mt-1 text-2xl font-bold">{v}</p></article>)}</section>
    <article className="overflow-x-auto rounded-xl border border-border bg-background p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <label className="relative"><Search className="absolute left-2 top-1.5 size-4 text-muted-foreground" /><input className={`${inp} pl-8`} placeholder="Cari nama, email, HP" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari user" /></label>
          <select className={inp + ' w-auto'} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter status"><option value="">Semua status</option><option>Aktif</option><option>Belum Verifikasi</option><option>Diblokir</option></select>
        </div>
        <Button size="sm" onClick={() => setUsers((us) => [{ id: uid(), name: 'User Baru', email: '', phone: '', joined: new Date().toISOString().slice(0, 10), balance: 0, status: 'Belum Verifikasi' }, ...us])}><Plus /> Tambah User</Button>
      </div>
      <table className="w-full min-w-[900px] text-sm"><thead className="text-left text-muted-foreground"><tr><th className="py-2">Nama</th><th>Email</th><th>No. HP</th><th>Tgl Daftar</th><th>Saldo $</th><th>Status</th><th /></tr></thead>
        <tbody>{pg.pageItems.map((u) => <tr key={u.id} className="border-t border-border">
          <td className="py-1 pr-1"><input className={inp} value={u.name} onChange={(e) => upd(u.id, { name: e.target.value })} aria-label="Nama" /></td>
          <td className="pr-1"><input type="email" className={inp} value={u.email} onChange={(e) => upd(u.id, { email: e.target.value })} aria-label="Email" /></td>
          <td className="pr-1"><input className={inp} value={u.phone} onChange={(e) => upd(u.id, { phone: e.target.value })} aria-label="No HP" /></td>
          <td className="pr-1"><input type="date" className={inp} value={u.joined} onChange={(e) => upd(u.id, { joined: e.target.value })} aria-label="Tanggal daftar" /></td>
          <td className="pr-1"><input type="number" className={inp} value={u.balance} onChange={(e) => upd(u.id, { balance: Number(e.target.value) })} aria-label="Saldo" /></td>
          <td className="pr-1"><select className={inp} value={u.status} onChange={(e) => upd(u.id, { status: e.target.value as Status })} aria-label="Status"><option>Aktif</option><option>Belum Verifikasi</option><option>Diblokir</option></select></td>
          <td><Button size="icon" variant="ghost" aria-label="Hapus user" onClick={() => { if (confirm(`Hapus ${u.name}?`)) setUsers((us) => us.filter((x) => x.id !== u.id)); }}><Trash2 /></Button></td>
        </tr>)}
        {!shown.length && <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">Tidak ada user.</td></tr>}</tbody></table>
      <Pagination page={pg.page} totalPages={pg.totalPages} total={pg.total} onPage={pg.setPage} />
    </article>
  </main>;
}
