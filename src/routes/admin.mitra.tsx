import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { commissionOf, uid, useReferral, type Referral, type Referrer } from '@/components/referral-content';

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

function AdminMitra() {
  const { data, setData } = useReferral();
  const [tab, setTab] = useState<(typeof tabs)[number]>('Ringkasan Komisi');
  const [filter, setFilter] = useState('');
  const set = <K extends keyof typeof data>(k: K, v: (typeof data)[K]) => setData((p) => ({ ...p, [k]: v }));
  const updRef = (id: string, patch: Partial<Referrer>) => set('referrers', data.referrers.map((r) => r.id === id ? { ...r, ...patch } : r));
  const updUser = (id: string, patch: Partial<Referral>) => set('referrals', data.referrals.map((r) => r.id === id ? { ...r, ...patch } : r));
  const total = data.referrals.reduce((s, r) => s + commissionOf(data, r), 0);
  const paid = data.referrals.filter((r) => r.commissionPaid).reduce((s, r) => s + commissionOf(data, r), 0);
  const users = data.referrals.filter((r) => !filter || r.referrerId === filter);

  return <main className="space-y-4 p-4 text-foreground md:p-6">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h1 className="text-2xl font-bold">Kelola Mitra &amp; Referral</h1><p className="text-sm text-muted-foreground">Tersimpan di browser ini · belum terhubung ke server.</p></div>
    </div>
    <div className="flex flex-wrap gap-2">{tabs.map((t) => <Button key={t} variant={tab === t ? 'default' : 'outline'} size="sm" onClick={() => setTab(t)}>{t}</Button>)}</div>

    {tab === 'Ringkasan Komisi' && <>
      <section className="grid gap-3 sm:grid-cols-4">
        {[['Mitra', data.referrers.length], ['User Diajak', data.referrals.length], ['Total Komisi', `$${total.toFixed(2)}`], ['Belum Dibayar', `$${(total - paid).toFixed(2)}`]].map(([l, v]) =>
          <article key={l} className="rounded-xl border border-border bg-background p-4"><p className="text-sm text-muted-foreground">{l}</p><p className="mt-1 text-2xl font-bold">{v}</p></article>)}
      </section>
      <article className="overflow-x-auto rounded-xl border border-border bg-background p-4"><h2 className="mb-2 font-semibold">Pembagian Komisi per Mitra</h2>
        <table className="w-full text-sm"><thead className="text-left text-muted-foreground"><tr><th className="py-2">Mitra</th><th>Kode</th><th>Rate</th><th className="text-right">Diajak</th><th className="text-right">Deposit</th><th className="text-right">Komisi</th><th className="text-right">Dibayar</th></tr></thead>
          <tbody>{data.referrers.map((m) => { const rs = data.referrals.filter((r) => r.referrerId === m.id); const c = rs.reduce((s, r) => s + commissionOf(data, r), 0); const p = rs.filter((r) => r.commissionPaid).reduce((s, r) => s + commissionOf(data, r), 0);
            return <tr key={m.id} className="border-t border-border"><td className="py-2 font-medium">{m.name}</td><td>{m.code}</td><td>{m.commissionRate}%</td><td className="text-right">{rs.length}</td><td className="text-right">${rs.reduce((s, r) => s + r.deposit, 0)}</td><td className="text-right">${c.toFixed(2)}</td><td className="text-right">${p.toFixed(2)}</td></tr>; })}</tbody></table></article>
    </>}

    {tab === 'Mitra' && <article className="overflow-x-auto rounded-xl border border-border bg-background p-4">
      <div className="mb-2 flex items-center justify-between"><h2 className="font-semibold">Daftar Mitra</h2>
        <Button size="sm" onClick={() => set('referrers', [...data.referrers, { id: uid(), name: 'Mitra Baru', email: '', code: `HSB${uid().slice(0, 4).toUpperCase()}`, commissionRate: data.defaultRate, status: 'Aktif' }])}><Plus /> Tambah</Button></div>
      <table className="w-full min-w-[720px] text-sm"><thead className="text-left text-muted-foreground"><tr><th className="py-2">Nama</th><th>Email</th><th>Kode</th><th>Komisi %</th><th>Status</th><th /></tr></thead>
        <tbody>{data.referrers.map((m) => <tr key={m.id} className="border-t border-border">
          <td className="py-1 pr-1"><input className={inp} value={m.name} onChange={(e) => updRef(m.id, { name: e.target.value })} aria-label="Nama" /></td>
          <td className="pr-1"><input className={inp} value={m.email} onChange={(e) => updRef(m.id, { email: e.target.value })} aria-label="Email" /></td>
          <td className="pr-1"><input className={inp} value={m.code} onChange={(e) => updRef(m.id, { code: e.target.value.toUpperCase() })} aria-label="Kode" /></td>
          <td className="pr-1"><input type="number" className={inp} value={m.commissionRate} onChange={(e) => updRef(m.id, { commissionRate: Number(e.target.value) })} aria-label="Komisi" /></td>
          <td className="pr-1"><select className={inp} value={m.status} onChange={(e) => updRef(m.id, { status: e.target.value as Referrer['status'] })} aria-label="Status"><option>Aktif</option><option>Nonaktif</option></select></td>
          <td><Button size="icon" variant="ghost" aria-label="Hapus" onClick={() => setData((p) => ({ ...p, referrers: p.referrers.filter((r) => r.id !== m.id), referrals: p.referrals.filter((r) => r.referrerId !== m.id) }))}><Trash2 /></Button></td>
        </tr>)}</tbody></table></article>}

    {tab === 'User Diajak' && <article className="overflow-x-auto rounded-xl border border-border bg-background p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">User yang Berhasil Diajak</h2>
        <div className="flex gap-2"><select className={inp} value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter mitra"><option value="">Semua mitra</option>{data.referrers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
          <Button size="sm" disabled={!data.referrers.length} onClick={() => set('referrals', [...data.referrals, { id: uid(), referrerId: filter || data.referrers[0]!.id, name: 'User Baru', email: '', joined: new Date().toISOString().slice(0, 10), deposit: 0, status: 'Terdaftar', commissionPaid: false }])}><Plus /> Tambah</Button></div></div>
      <table className="w-full min-w-[900px] text-sm"><thead className="text-left text-muted-foreground"><tr><th className="py-2">Nama</th><th>Email</th><th>Diajak oleh</th><th>Tgl Daftar</th><th>Deposit $</th><th>Status</th><th>Komisi</th><th>Dibayar</th><th /></tr></thead>
        <tbody>{users.map((u) => <tr key={u.id} className="border-t border-border">
          <td className="py-1 pr-1"><input className={inp} value={u.name} onChange={(e) => updUser(u.id, { name: e.target.value })} aria-label="Nama" /></td>
          <td className="pr-1"><input className={inp} value={u.email} onChange={(e) => updUser(u.id, { email: e.target.value })} aria-label="Email" /></td>
          <td className="pr-1"><select className={inp} value={u.referrerId} onChange={(e) => updUser(u.id, { referrerId: e.target.value })} aria-label="Pengajak">{data.referrers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></td>
          <td className="pr-1"><input type="date" className={inp} value={u.joined} onChange={(e) => updUser(u.id, { joined: e.target.value })} aria-label="Tanggal" /></td>
          <td className="pr-1"><input type="number" className={inp} value={u.deposit} onChange={(e) => updUser(u.id, { deposit: Number(e.target.value) })} aria-label="Deposit" /></td>
          <td className="pr-1"><select className={inp} value={u.status} onChange={(e) => updUser(u.id, { status: e.target.value as Referral['status'] })} aria-label="Status"><option>Terdaftar</option><option>Deposit</option><option>Aktif Trading</option></select></td>
          <td className="pr-1 font-medium">${commissionOf(data, u).toFixed(2)}</td>
          <td><input type="checkbox" checked={u.commissionPaid} onChange={(e) => updUser(u.id, { commissionPaid: e.target.checked })} aria-label="Komisi dibayar" /></td>
          <td><Button size="icon" variant="ghost" aria-label="Hapus" onClick={() => set('referrals', data.referrals.filter((r) => r.id !== u.id))}><Trash2 /></Button></td>
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
      <label className="block text-sm">Kode referral user yang login (pratinjau)<select className={inp} value={data.currentUserCode} onChange={(e) => set('currentUserCode', e.target.value)}>{data.referrers.map((m) => <option key={m.id} value={m.code}>{m.name} — {m.code}</option>)}</select></label>
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
