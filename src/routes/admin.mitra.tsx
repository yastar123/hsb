import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { commissionOf, uid, useReferral, type Referral } from '@/components/referral-content';
import { useLedger } from '@/components/ledger-content';
import { SaveStatusText } from '@/lib/site-content';

export const Route = createFileRoute('/admin/mitra')({
  head: () => ({ meta: [
    { title: 'Kelola Mitra & Referral — Admin HSB' },
    { name: 'description', content: 'Kelola program referral HSB: mitra, user yang diajak, hadiah, dan pembagian komisi.' },
    { property: 'og:title', content: 'Kelola Mitra & Referral — Admin HSB' },
    { property: 'og:description', content: 'Admin program referral: mitra, referral, dan komisi.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: AdminMitra,
});

const inp = 'w-full rounded-md border border-input bg-background px-2 py-1 text-sm';
const tabs = ['Ringkasan Komisi', 'Mitra', 'User Diajak', 'Pengaturan Program'] as const;
type ProgramKey = 'title' | 'subtitle' | 'bonusPerInvite' | 'friendBonus' | 'minDeposit' | 'defaultRate' | 'terms' | 'tiers';

function AdminMitra() {
  const { data, setData, status, error, recordsStatus, recordsError, refresh, updatePartner } = useReferral();
  const { creditReferralDeposit } = useLedger();
  const [tab, setTab] = useState<(typeof tabs)[number]>('Ringkasan Komisi');
  const [filter, setFilter] = useState('');
  const [notice, setNotice] = useState('');
  const [rateDrafts, setRateDrafts] = useState<Record<string, string>>({});
  const [busyPartner, setBusyPartner] = useState('');
  const [busyReferral, setBusyReferral] = useState('');
  const set = <K extends ProgramKey>(key: K, value: (typeof data)[K]) => setData((previous) => ({ ...previous, [key]: value }));
  const total = data.referrals.reduce((s, r) => s + commissionOf(data, r), 0);
  const paid = data.referrals.filter((r) => r.commissionPaid).reduce((s, r) => s + (r.paidAmount ?? commissionOf(data, r)), 0);
  const unpaid = Math.max(0, total - paid);
  const users = data.referrals.filter((r) => !filter || r.referrerId === filter);
  const savePartner = async (id: string, patch: { commissionRate?: number; status?: 'Aktif' | 'Nonaktif' }) => {
    setBusyPartner(id);
    setNotice('');
    try {
      await updatePartner(id, patch);
      setRateDrafts((current) => { const next = { ...current }; delete next[id]; return next; });
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : 'Perubahan mitra tidak dapat disimpan.');
    } finally {
      setBusyPartner('');
    }
  };
  const payReferral = async (referral: Referral) => {
    if (referral.commissionPaid) return;
    if (referral.deposit < data.minDeposit) {
      setNotice('Komisi baru dapat dikreditkan setelah deposit referral mencapai batas minimum.');
      return;
    }
    const amount = commissionOf(data, referral);
    if (amount <= 0) {
      setNotice('Komisi referral tidak valid.');
      return;
    }
    setBusyReferral(referral.id);
    setNotice('');
    try {
      const credited = await creditReferralDeposit(referral.referrerId, amount, referral.id);
      await refresh();
      setNotice(`Komisi aktual $${credited.toFixed(2)} ditambahkan ke saldo deposit mitra.`);
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : 'Komisi referral tidak dapat dikreditkan.');
    } finally {
      setBusyReferral('');
    }
  };

  return <main className="space-y-4 p-4 text-foreground md:p-6">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h1 className="text-2xl font-bold">Kelola Mitra &amp; Referral</h1><p className="text-sm text-muted-foreground"><SaveStatusText status={status} error={error} /> · data akun: <SaveStatusText status={recordsStatus} error={recordsError} /></p></div>
    </div>
    {(error || recordsError) && <p role="alert" className="rounded-lg border border-destructive/40 bg-background p-3 text-sm text-destructive">{error || recordsError}</p>}
    {notice && <p role="status" className="rounded-lg border border-border bg-background p-3 text-sm">{notice}</p>}
    <div className="flex flex-wrap gap-2">{tabs.map((t) => <Button key={t} variant={tab === t ? 'default' : 'outline'} size="sm" onClick={() => setTab(t)}>{t}</Button>)}</div>

    {tab === 'Ringkasan Komisi' && <>
      <section className="grid gap-3 sm:grid-cols-4">
        {[['Akun Mitra', data.referrers.length], ['User Diajak', data.referrals.length], ['Total Komisi', `$${total.toFixed(2)}`], ['Belum Dibayar', `$${unpaid.toFixed(2)}`]].map(([l, v]) =>
          <article key={l} className="rounded-xl border border-border bg-background p-4"><p className="text-sm text-muted-foreground">{l}</p><p className="mt-1 text-2xl font-bold">{v}</p></article>)}
      </section>
      <article className="overflow-x-auto rounded-xl border border-border bg-background p-4"><h2 className="mb-2 font-semibold">Pembagian Komisi per Mitra</h2>
        <table className="w-full text-sm"><thead className="text-left text-muted-foreground"><tr><th className="py-2">Mitra</th><th>Kode</th><th>Rate</th><th className="text-right">Diajak</th><th className="text-right">Deposit</th><th className="text-right">Komisi</th><th className="text-right">Dibayar</th></tr></thead>
          <tbody>{data.referrers.map((m) => { const rs = data.referrals.filter((r) => r.referrerId === m.id); const c = rs.reduce((s, r) => s + commissionOf(data, r), 0); const p = rs.filter((r) => r.commissionPaid).reduce((s, r) => s + (r.paidAmount ?? commissionOf(data, r)), 0);
            return <tr key={m.id} className="border-t border-border"><td className="py-2 font-medium">{m.name}</td><td>{m.code}</td><td>{m.commissionRate}%</td><td className="text-right">{rs.length}</td><td className="text-right">${rs.reduce((s, r) => s + r.deposit, 0)}</td><td className="text-right">${c.toFixed(2)}</td><td className="text-right">${p.toFixed(2)}</td></tr>; })}</tbody></table></article>
    </>}

    {tab === 'Mitra' && <article className="overflow-x-auto rounded-xl border border-border bg-background p-4">
      <div className="mb-2"><h2 className="font-semibold">Akun Mitra</h2><p className="text-xs text-muted-foreground">Daftar ini berasal dari akun nyata. Kode referral dibuat saat pendaftaran dan akun tidak dapat dibuat atau dihapus dari tabel ini.</p></div>
      <table className="w-full min-w-[720px] text-sm"><thead className="text-left text-muted-foreground"><tr><th className="py-2">Nama</th><th>Email</th><th>Kode</th><th>Komisi %</th><th>Status Referral</th></tr></thead>
        <tbody>{data.referrers.map((m) => <tr key={m.id} className="border-t border-border">
          <td className="py-1 pr-1">{m.name}</td>
          <td className="pr-1">{m.email}</td>
          <td className="pr-1 font-mono">{m.code}</td>
          <td className="pr-1"><input type="number" min="0" max="100" step="0.01" className={inp} value={rateDrafts[m.id] ?? String(m.commissionRate)} onChange={(e) => setRateDrafts((current) => ({ ...current, [m.id]: e.target.value }))} onBlur={() => { const rate = Number(rateDrafts[m.id] ?? m.commissionRate); if (rate !== m.commissionRate) void savePartner(m.id, { commissionRate: rate }); }} aria-label="Komisi" disabled={busyPartner === m.id} /></td>
          <td className="pr-1"><select className={inp} value={m.status} onChange={(e) => { void savePartner(m.id, { status: e.target.value as 'Aktif' | 'Nonaktif' }); }} aria-label="Status" disabled={busyPartner === m.id}><option>Aktif</option><option>Nonaktif</option></select></td>
        </tr>)}</tbody></table></article>}

    {tab === 'User Diajak' && <article className="overflow-x-auto rounded-xl border border-border bg-background p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">User yang Berhasil Diajak</h2>
        <select className={inp + ' max-w-xs'} value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter mitra"><option value="">Semua mitra</option>{data.referrers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
      <p className="mb-2 text-xs text-muted-foreground">Referral muncul otomatis setelah pengguna mendaftar memakai kode mitra. Deposit hanya dihitung dari permintaan yang disetujui.</p>
      <table className="w-full min-w-[850px] text-sm"><thead className="text-left text-muted-foreground"><tr><th className="py-2">Nama</th><th>Email</th><th>Diajak oleh</th><th>Tgl Daftar</th><th>Deposit Disetujui ($)</th><th>Status</th><th>Komisi</th><th>Dibayar</th></tr></thead>
        <tbody>{users.map((u) => <tr key={u.id} className="border-t border-border">
          <td className="py-1 pr-1">{u.name}</td>
          <td className="pr-1">{u.email}</td>
          <td className="pr-1">{data.referrers.find((m) => m.id === u.referrerId)?.name ?? '—'}</td>
          <td className="pr-1">{u.joined ? new Date(u.joined).toLocaleDateString('id-ID') : '—'}</td>
          <td className="pr-1">{u.deposit.toFixed(2)}</td>
          <td className="pr-1">{u.status}</td>
          <td className="pr-1 font-medium">${commissionOf(data, u).toFixed(2)}</td>
          <td><input type="checkbox" checked={u.commissionPaid} disabled={u.commissionPaid || u.deposit < data.minDeposit || busyReferral === u.id} onChange={() => { void payReferral(u); }} aria-label="Komisi dikreditkan ke saldo deposit" title="Kredit dihitung di server dari deposit yang disetujui dan aturan program" /></td>
        </tr>)}</tbody></table></article>}

    {tab === 'Pengaturan Program' && <article className="space-y-3 rounded-xl border border-border bg-background p-4">
      <label className="block text-sm">Judul<input className={inp} value={data.title} onChange={(e) => set('title', e.target.value)} /></label>
      <label className="block text-sm">Deskripsi<textarea className={inp} value={data.subtitle} onChange={(e) => set('subtitle', e.target.value)} /></label>
      <div className="grid gap-3 sm:grid-cols-4">
        <label className="text-sm">Bonus per teman ($)<input type="number" className={inp} value={data.bonusPerInvite} onChange={(e) => set('bonusPerInvite', Number(e.target.value))} /></label>
        <label className="text-sm">Bonus untuk teman ($)<input type="number" className={inp} value={data.friendBonus} onChange={(e) => set('friendBonus', Number(e.target.value))} /></label>
        <label className="text-sm">Min. deposit ($)<input type="number" className={inp} value={data.minDeposit} onChange={(e) => set('minDeposit', Number(e.target.value))} /></label>
        <label className="text-sm">Komisi default (%)<input type="number" className={inp} value={data.defaultRate} onChange={(e) => set('defaultRate', Number(e.target.value))} /></label>
      </div>
      <label className="block text-sm">Syarat &amp; ketentuan<textarea className={inp} value={data.terms} onChange={(e) => set('terms', e.target.value)} /></label>
       <p className="text-sm text-muted-foreground">Rumus berlaku untuk akun dan deposit aktual. Komisi referral: bonus per teman + persentase dari total deposit yang disetujui, setelah melewati minimum deposit. Perubahan pengaturan ini diterapkan saat hadiah diklaim atau admin memberi kredit.</p>
      <div><div className="mb-1 flex items-center justify-between"><h3 className="font-semibold">Bonus Level</h3><Button size="sm" onClick={() => set('tiers', [...data.tiers, { id: uid(), label: 'Level Baru', invites: 100, reward: 1000 }])}><Plus /> Tambah</Button></div>
        {data.tiers.map((t) => <div key={t.id} className="mb-2 grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
          <input className={inp} value={t.label} aria-label="Nama level" onChange={(e) => set('tiers', data.tiers.map((x) => x.id === t.id ? { ...x, label: e.target.value } : x))} />
          <input type="number" className={inp} value={t.invites} aria-label="Jumlah ajakan" onChange={(e) => set('tiers', data.tiers.map((x) => x.id === t.id ? { ...x, invites: Number(e.target.value) } : x))} />
          <input type="number" className={inp} value={t.reward} aria-label="Hadiah" onChange={(e) => set('tiers', data.tiers.map((x) => x.id === t.id ? { ...x, reward: Number(e.target.value) } : x))} />
          <Button size="icon" variant="ghost" aria-label="Hapus" onClick={() => set('tiers', data.tiers.filter((x) => x.id !== t.id))}><Trash2 /></Button>
        </div>)}</div>
    </article>}
  </main>;
}
