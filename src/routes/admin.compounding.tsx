import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { Plus, Trash2, Search, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pagination, usePagination } from '@/components/pagination';
import { useLedger, uid, depOf, profitOf, mainOf, rateOf, type AppUser, type UserStatus } from '@/components/ledger-content';

export const Route = createFileRoute('/admin/compounding')({
  head: () => ({ meta: [
    { title: 'Compounding — Admin HSB' },
    { name: 'description', content: 'Atur persentase compounding harian untuk semua user atau user tertentu.' },
    { property: 'og:title', content: 'Compounding — Admin HSB' },
    { property: 'og:description', content: 'Panel admin pengaturan compounding harian dan saldo user.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: AdminCompounding,
});

const inp = 'w-full rounded-md border border-input bg-background px-2 py-1 text-sm';
const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function AdminCompounding() {
  const { users, setUsers, compound, setCompound, runCompound } = useLedger();
  const [q, setQ] = useState('');
  const upd = (id: string, p: Partial<AppUser>) => setUsers((us) => us.map((u) => {
    if (u.id !== id) return u;
    const n = { ...u, deposit: depOf(u), profit: profitOf(u), ...p };
    return { ...n, balance: mainOf(n) };
  }));
  const shown = useMemo(() => users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase())), [users, q]);
  const pg = usePagination(shown);
  const tot = (f: (u: AppUser) => number) => users.reduce((s, u) => s + f(u), 0);
  const stats: [string, string][] = [['Total User', String(users.length)], ['Total Saldo Deposit', usd(tot(depOf))], ['Total Saldo Profit', usd(tot(profitOf))], ['Total Saldo Utama', usd(tot(mainOf))]];

  return <main className="space-y-4 p-4 text-foreground md:p-6">
    <div><h1 className="text-2xl font-bold">Compounding</h1><p className="text-sm text-muted-foreground">Profit harian = saldo utama × persentase. Saldo utama = saldo deposit + saldo profit. Simulasi · tersimpan di browser ini.</p></div>
    <section className="grid gap-3 sm:grid-cols-4">{stats.map(([l, v]) =>
      <article key={l} className="rounded-xl border border-border bg-background p-4"><p className="text-sm text-muted-foreground">{l}</p><p className="mt-1 text-2xl font-bold">{v}</p></article>)}</section>
    <article className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-background p-4">
      <label className="text-sm"><span className="mb-1 block font-medium">Compounding semua user (% / hari)</span><input type="number" step="0.01" className={inp + ' w-40'} value={compound.globalRate} onChange={(e) => setCompound({ globalRate: Number(e.target.value) })} /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={compound.enabled} onChange={(e) => setCompound({ enabled: e.target.checked })} /> Compounding otomatis aktif</label>
      <Button variant="outline" onClick={() => { if (confirm('Tambahkan profit 1 hari ke semua user sekarang?')) runCompound(); }}><Play /> Jalankan 1 hari sekarang</Button>
    </article>
    <article className="overflow-x-auto rounded-xl border border-border bg-background p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <label className="relative"><Search className="absolute left-2 top-1.5 size-4 text-muted-foreground" /><input className={`${inp} pl-8`} placeholder="Cari nama / email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari user" /></label>
        <Button size="sm" onClick={() => setUsers((us) => [{ id: uid(), name: 'User Baru', email: '', phone: '', joined: new Date().toISOString().slice(0, 10), balance: 0, deposit: 0, profit: 0, rate: null, lastCompound: new Date().toISOString().slice(0, 10), status: 'Aktif' }, ...us])}><Plus /> Tambah User</Button>
      </div>
      <table className="w-full min-w-[1100px] text-sm"><thead className="text-left text-muted-foreground"><tr><th className="py-2">Nama</th><th>Email</th><th>No. HP</th><th>Saldo Deposit $</th><th>Saldo Profit $</th><th>Saldo Utama</th><th>% / hari (kosong = global)</th><th>Profit besok</th><th>Status</th><th /></tr></thead>
        <tbody>{pg.pageItems.map((u) => <tr key={u.id} className="border-t border-border">
          <td className="py-1 pr-1"><input className={inp} value={u.name} onChange={(e) => upd(u.id, { name: e.target.value })} aria-label="Nama" /></td>
          <td className="pr-1"><input type="email" className={inp} value={u.email} onChange={(e) => upd(u.id, { email: e.target.value })} aria-label="Email" /></td>
          <td className="pr-1"><input className={inp} value={u.phone} onChange={(e) => upd(u.id, { phone: e.target.value })} aria-label="No HP" /></td>
          <td className="pr-1"><input type="number" className={inp} value={depOf(u)} onChange={(e) => upd(u.id, { deposit: Number(e.target.value) })} aria-label="Saldo deposit" /></td>
          <td className="pr-1"><input type="number" className={inp} value={profitOf(u)} onChange={(e) => upd(u.id, { profit: Number(e.target.value) })} aria-label="Saldo profit" /></td>
          <td className="pr-1 font-semibold">{usd(mainOf(u))}</td>
          <td className="pr-1"><input type="number" step="0.01" className={inp} placeholder={`${compound.globalRate}`} value={u.rate ?? ''} onChange={(e) => upd(u.id, { rate: e.target.value === '' ? null : Number(e.target.value) })} aria-label="Persen compounding user" /></td>
          <td className="pr-1 text-muted-foreground">{u.status === 'Diblokir' ? '—' : usd(mainOf(u) * rateOf(u, compound) / 100)}</td>
          <td className="pr-1"><select className={inp} value={u.status} onChange={(e) => upd(u.id, { status: e.target.value as UserStatus })} aria-label="Status"><option>Aktif</option><option>Belum Verifikasi</option><option>Diblokir</option></select></td>
          <td><Button size="icon" variant="ghost" aria-label="Hapus user" onClick={() => { if (confirm(`Hapus ${u.name}?`)) setUsers((us) => us.filter((x) => x.id !== u.id)); }}><Trash2 /></Button></td>
        </tr>)}
        {!shown.length && <tr><td colSpan={10} className="py-6 text-center text-muted-foreground">Tidak ada user.</td></tr>}</tbody></table>
      <Pagination page={pg.page} totalPages={pg.totalPages} total={pg.total} onPage={pg.setPage} />
    </article>
  </main>;
}
