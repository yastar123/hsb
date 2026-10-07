import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pagination, usePagination } from '@/components/pagination';
import { useLedger, type WithdrawalReq, type WithdrawalStatus } from '@/components/ledger-content';

export const Route = createFileRoute('/admin/withdraw')({
  head: () => ({ meta: [
    { title: 'Kelola Withdraw — Admin HSB' },
    { name: 'description', content: 'Pantau siapa saja yang melakukan withdraw, total penarikan, dan riwayatnya (simulasi).' },
    { property: 'og:title', content: 'Kelola Withdraw — Admin HSB' },
    { property: 'og:description', content: 'Panel admin riwayat dan total penarikan dana.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: AdminWithdraw,
});

const statuses: WithdrawalStatus[] = ['Menunggu', 'Diproses', 'Berhasil', 'Ditolak'];
const inp = 'w-full rounded-md border border-input bg-background px-2 py-1 text-sm';
const usd = (n: number) => `$${n.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function AdminWithdraw() {
  const { withdrawals: rows, reviewWithdrawal, updateWithdrawal, deleteWithdrawal } = useLedger();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const upd = (id: string, p: Partial<Pick<WithdrawalReq, 'name' | 'email' | 'bank' | 'account' | 'date'>>) => updateWithdrawal(id, p);
  const done = rows.filter((r) => r.status === 'Berhasil');
  const totalDone = done.reduce((s, r) => s + r.amount, 0);
  const pending = rows.filter((r) => r.status === 'Menunggu' || r.status === 'Diproses').reduce((s, r) => s + r.amount, 0);

  const perUser = useMemo(() => {
    const m = new Map<string, { name: string; email: string; count: number; total: number; last: string }>();
    for (const r of rows) {
      const k = r.email || r.name;
      const e = m.get(k) ?? { name: r.name, email: r.email, count: 0, total: 0, last: '' };
      e.count++; if (r.status === 'Berhasil') e.total += r.amount; if (r.date > e.last) e.last = r.date;
      m.set(k, e);
    }
    return [...m.values()].sort((a, b) => b.total - a.total);
  }, [rows]);

  const shown = rows.filter((r) => (!status || r.status === status) && `${r.name} ${r.email} ${r.bank}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.date.localeCompare(a.date));
  const pg = usePagination(shown);
  const stats: [string, string][] = [['Total Berhasil Ditarik', usd(totalDone)], ['Menunggu / Diproses', usd(pending)], ['Jumlah Transaksi', String(rows.length)], ['User yang Withdraw', String(perUser.length)]];

  return <main className="space-y-4 p-4 text-foreground md:p-6">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h1 className="text-2xl font-bold">Kelola Withdraw</h1><p className="text-sm text-muted-foreground">Simulasi · tersimpan di browser ini, tidak ada dana sungguhan yang dipindahkan.</p></div>
    </div>
    <section className="grid gap-3 sm:grid-cols-4">{stats.map(([l, v]) =>
      <article key={l} className="rounded-xl border border-border bg-background p-4"><p className="text-sm text-muted-foreground">{l}</p><p className="mt-1 text-2xl font-bold">{v}</p></article>)}</section>

    <article className="overflow-x-auto rounded-xl border border-border bg-background p-4">
      <h2 className="mb-2 font-semibold">User yang Melakukan Withdraw</h2>
      <table className="w-full min-w-[600px] text-sm"><thead className="text-left text-muted-foreground"><tr><th className="py-2">Nama</th><th>Email</th><th className="text-right">Transaksi</th><th className="text-right">Total Berhasil</th><th className="text-right">Terakhir</th></tr></thead>
        <tbody>{perUser.map((u) => <tr key={u.email + u.name} className="border-t border-border"><td className="py-2 font-medium">{u.name}</td><td>{u.email}</td><td className="text-right">{u.count}</td><td className="text-right">{usd(u.total)}</td><td className="text-right">{u.last}</td></tr>)}</tbody></table>
    </article>

    <article className="overflow-x-auto rounded-xl border border-border bg-background p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Riwayat Withdraw</h2>
        <div className="flex flex-wrap gap-2">
          <label className="relative"><Search className="absolute left-2 top-1.5 size-4 text-muted-foreground" /><input className={`${inp} pl-8`} placeholder="Cari nama, email, bank" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari" /></label>
          <select className={inp + ' w-auto'} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter status"><option value="">Semua status</option>{statuses.map((s) => <option key={s}>{s}</option>)}</select>
          <span className="text-xs text-muted-foreground">Permintaan dibuat dari halaman Withdraw pengguna.</span>
        </div>
      </div>
      <table className="w-full min-w-[960px] text-sm"><thead className="text-left text-muted-foreground"><tr><th className="py-2">Tanggal</th><th>Nama</th><th>Email</th><th>Bank</th><th>No. Rekening</th><th>Jumlah $</th><th>Status</th><th /></tr></thead>
        <tbody>{pg.pageItems.map((r) => <tr key={r.id} className="border-t border-border">
          <td className="py-1 pr-1"><input type="date" className={inp} value={r.date} onChange={(e) => upd(r.id, { date: e.target.value })} aria-label="Tanggal" /></td>
          <td className="pr-1"><input className={inp} value={r.name} onChange={(e) => upd(r.id, { name: e.target.value })} aria-label="Nama" /></td>
          <td className="pr-1"><input className={inp} value={r.email} onChange={(e) => upd(r.id, { email: e.target.value })} aria-label="Email" /></td>
          <td className="pr-1"><input className={inp} value={r.bank} onChange={(e) => upd(r.id, { bank: e.target.value })} aria-label="Bank" /></td>
          <td className="pr-1"><input className={inp} value={r.account} onChange={(e) => upd(r.id, { account: e.target.value })} aria-label="Rekening" /></td>
          <td className="pr-1">{usd(r.amount)}</td>
          <td className="pr-1"><select className={inp} value={r.status} disabled={Boolean(r.userId && (r.status === 'Berhasil' || r.status === 'Ditolak'))} onChange={(e) => reviewWithdrawal(r.id, e.target.value as WithdrawalStatus)} aria-label="Status">{statuses.map((s) => <option key={s}>{s}</option>)}</select></td>
          <td><Button size="icon" variant="ghost" aria-label="Hapus" disabled={Boolean(r.userId && r.status === 'Berhasil')} onClick={() => { if (confirm('Hapus transaksi ini? Permintaan aktif akan dikembalikan ke saldo utama.')) deleteWithdrawal(r.id); }}><Trash2 /></Button></td>
        </tr>)}
        {!shown.length && <tr><td colSpan={8} className="py-6 text-center text-muted-foreground">Tidak ada transaksi.</td></tr>}</tbody></table>
      <Pagination page={pg.page} totalPages={pg.totalPages} total={pg.total} onPage={pg.setPage} />
    </article>
  </main>;
}
