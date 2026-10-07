import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { Search, Play, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pagination, usePagination } from '@/components/pagination';
import { useLedger, depOf, profitOf, dailyProfitOf, mainOf, rateOf, type AppUser, type CompoundSettings, type UserStatus } from '@/components/ledger-content';

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
  const { users, compound, setCompound, runCompound, updateUser, loading } = useLedger();
  const [q, setQ] = useState('');
  const [settingsDraft, setSettingsDraft] = useState<CompoundSettings>(compound);
  const [savingSettings, setSavingSettings] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { if (!loading) setSettingsDraft(compound); }, [compound, loading]);
  const upd = (id: string, patch: Partial<Pick<AppUser, 'name' | 'email' | 'phone' | 'status' | 'rate' | 'balance' | 'deposit' | 'profit'>>) => {
    setMessage('');
    void updateUser(id, patch).catch((cause: unknown) => {
      setMessage(cause instanceof Error ? cause.message : 'Perubahan pengguna gagal disimpan.');
    });
  };
  const saveSettings = async () => {
    setSavingSettings(true);
    setMessage('');
    try {
      await setCompound(settingsDraft);
      setMessage('Pengaturan compounding tersimpan di PostgreSQL.');
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Pengaturan gagal disimpan.');
    } finally {
      setSavingSettings(false);
    }
  };
  const runNow = async () => {
    setMessage('');
    try {
      const result = await runCompound();
      setMessage(`Compounding harian selesai untuk ${result.applied} entri pada ${result.date}.`);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Compounding gagal dijalankan.');
    }
  };
  const shown = useMemo(() => users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase())), [users, q]);
  const pg = usePagination(shown);
  const tot = (f: (u: AppUser) => number) => users.reduce((s, u) => s + f(u), 0);
  const stats: [string, string][] = [['Total User', String(users.length)], ['Total Saldo Deposit', usd(tot(depOf))], ['Total Profit Hari Ini', usd(tot(dailyProfitOf))], ['Total Saldo Profit', usd(tot(profitOf))], ['Total Saldo Utama', usd(tot(mainOf))]];

  return <main className="space-y-4 p-4 text-foreground md:p-6">
    <div><h1 className="text-2xl font-bold">Compounding</h1><p className="text-sm text-muted-foreground">Data akun dan saldo dibaca dari PostgreSQL. Penyesuaian admin dicatat ke ledger; perhitungan ini bukan bukti hasil investasi atau pemindahan dana.</p></div>
    {message && <p className="text-sm" role={message.includes('gagal') ? 'alert' : 'status'}>{message}</p>}
    <section className="grid gap-3 sm:grid-cols-5">{stats.map(([l, v]) =>
      <article key={l} className="rounded-xl border border-border bg-background p-4"><p className="text-sm text-muted-foreground">{l}</p><p className="mt-1 text-2xl font-bold">{v}</p></article>)}</section>
    <article className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-background p-4">
      <label className="text-sm"><span className="mb-1 block font-medium">Compounding semua user (% / hari)</span><input type="number" min="0" max="100" step="0.01" className={inp + ' w-40'} value={settingsDraft.globalRate} onChange={(e) => setSettingsDraft((current) => ({ ...current, globalRate: Math.max(0, Number(e.target.value)) }))} /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settingsDraft.enabled} onChange={(e) => setSettingsDraft((current) => ({ ...current, enabled: e.target.checked }))} /> Compounding otomatis aktif</label>
      <Button variant="outline" disabled={loading || savingSettings || (settingsDraft.globalRate === compound.globalRate && settingsDraft.enabled === compound.enabled)} onClick={() => void saveSettings()}><Save /> Simpan pengaturan</Button>
      <Button variant="outline" disabled={loading} onClick={() => { if (confirm('Catat compounding untuk satu hari sesuai tarif yang telah disimpan?')) void runNow(); }}><Play /> Jalankan 1 hari sekarang</Button>
    </article>
    <article className="overflow-x-auto rounded-xl border border-border bg-background p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <label className="relative"><Search className="absolute left-2 top-1.5 size-4 text-muted-foreground" /><input className={`${inp} pl-8`} placeholder="Cari nama / email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari user" /></label>
      </div>
      <table className="w-full min-w-[1200px] text-sm"><thead className="text-left text-muted-foreground"><tr><th className="py-2">Nama</th><th>Email</th><th>No. HP</th><th>Saldo Deposit $</th><th>Profit Total $</th><th>Profit Hari Ini</th><th>Saldo Utama</th><th>% / hari (kosong = global)</th><th>Proyeksi per hari</th><th>Status</th></tr></thead>
        <tbody>{pg.pageItems.map((u) => <tr key={u.id} className="border-t border-border">
          <td className="py-1 pr-1"><input className={inp} defaultValue={u.name} onBlur={(e) => { if (e.currentTarget.value !== u.name) upd(u.id, { name: e.currentTarget.value }); }} aria-label="Nama" /></td>
          <td className="pr-1"><input type="email" className={inp} defaultValue={u.email} onBlur={(e) => { if (e.currentTarget.value !== u.email) upd(u.id, { email: e.currentTarget.value }); }} aria-label="Email" /></td>
          <td className="pr-1"><input className={inp} defaultValue={u.phone} onBlur={(e) => { if (e.currentTarget.value !== u.phone) upd(u.id, { phone: e.currentTarget.value }); }} aria-label="No HP" /></td>
          <td className="pr-1"><input type="number" min="0" max="1000000000" step="0.01" className={inp} defaultValue={depOf(u)} onBlur={(e) => { const value = Number(e.currentTarget.value); if (value !== depOf(u)) upd(u.id, { deposit: value }); }} aria-label="Saldo deposit" /></td>
          <td className="pr-1"><input type="number" min="0" max="1000000000" step="0.01" className={inp} defaultValue={profitOf(u)} onBlur={(e) => { const value = Number(e.currentTarget.value); if (value !== profitOf(u)) upd(u.id, { profit: value }); }} aria-label="Saldo profit total" /></td>
          <td className="pr-1">{usd(dailyProfitOf(u))}</td>
          <td className="pr-1 font-semibold">{usd(mainOf(u))}</td>
          <td className="pr-1"><input type="number" min="0" max="100" step="0.01" className={inp} placeholder={`${compound.globalRate}`} defaultValue={u.rate ?? ''} onBlur={(e) => { const value = e.currentTarget.value === '' ? null : Number(e.currentTarget.value); if (value !== u.rate) upd(u.id, { rate: value }); }} aria-label="Persen compounding user" /></td>
          <td className="pr-1 text-muted-foreground">{u.status === 'Diblokir' ? '—' : usd(mainOf(u) * rateOf(u, compound) / 100)}</td>
          <td className="pr-1"><select className={inp} value={u.status} onChange={(e) => upd(u.id, { status: e.target.value as UserStatus })} aria-label="Status"><option>Aktif</option><option>Belum Verifikasi</option><option>Diblokir</option></select></td>
        </tr>)}
        {!shown.length && <tr><td colSpan={10} className="py-6 text-center text-muted-foreground">Tidak ada user.</td></tr>}</tbody></table>
      <Pagination page={pg.page} totalPages={pg.totalPages} total={pg.total} onPage={pg.setPage} />
    </article>
  </main>;
}
