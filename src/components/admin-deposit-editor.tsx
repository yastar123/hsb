import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Plus, Trash2, ArrowUp, ArrowDown, ChevronLeft, Monitor, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DepositScreen } from '@/components/account-pages';
import { useDepositContent, type DepositContent } from '@/components/deposit-content';
import { useBankAccounts } from '@/lib/bank-accounts';

const input = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground';
type TextKey = Exclude<keyof DepositContent, 'methods'>;
const fields: { key: TextKey; label: string; num?: boolean }[] = [
  { key: 'title', label: 'Judul halaman' }, { key: 'methodPlaceholder', label: 'Teks pilihan metode' },
  { key: 'sheetTitle', label: 'Judul daftar metode' }, { key: 'currency', label: 'Mata uang' },
  { key: 'rateLabel', label: 'Label kurs' }, { key: 'rate', label: 'Kurs ke IDR', num: true },
  { key: 'minimum', label: 'Minimal deposit', num: true }, { key: 'minimumText', label: 'Pesan minimal deposit' },
  { key: 'button', label: 'Teks tombol' }, { key: 'notice', label: 'Pesan setelah tombol ditekan' },
  { key: 'securityText', label: 'Teks keamanan' }, { key: 'securityBrand', label: 'Nama keamanan (tebal)' },
];

export function AdminDepositEditor() {
  const { content, setContent, saveError: contentError } = useDepositContent();
  const { list: accounts, save: saveAccounts, saveError: accountsError } = useBankAccounts();
  const [tab, setTab] = useState<'texts' | 'methods' | 'accounts'>('texts');
  const set = (patch: Partial<DepositContent>) => setContent((p) => ({ ...p, ...patch }));
  const methods = content.methods;
  const move = (i: number, d: number) => { const n = [...methods]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j]!, n[i]!]; set({ methods: n }); };

  return <div className="min-h-screen bg-muted text-foreground">
    <header className="flex flex-wrap items-center gap-3 border-b border-border bg-background px-4 py-3">
      <Button asChild variant="ghost" size="sm"><Link to="/admin"><ChevronLeft /> Admin</Link></Button>
      <h1 className="text-lg font-bold">Kelola Deposit</h1>
      <div className="ml-auto flex gap-2">
        <Button asChild variant="outline" size="sm"><Link to="/admin/deposit-verifikasi"><ClipboardCheck /> Verifikasi deposit</Link></Button>
        <Button asChild size="sm"><Link to="/deposit"><Monitor /> Buka Deposit</Link></Button>
      </div>
    </header>
    <p className="bg-accent px-4 py-2 text-xs text-accent-foreground">
      Pengaturan dan rekening tersimpan di PostgreSQL. Deposit dicatat sebagai permintaan dan harus diverifikasi admin; aplikasi tidak memproses transfer otomatis.
      {(contentError || accountsError) && <span role="alert" className="ml-2 text-destructive">{contentError || accountsError}</span>}
    </p>
    <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="min-w-0 rounded-xl border border-border bg-background p-4">
        <nav className="mb-4 flex flex-wrap gap-2">
          <Button size="sm" variant={tab === 'texts' ? 'default' : 'outline'} onClick={() => setTab('texts')}>Teks & Pengaturan</Button>
          <Button size="sm" variant={tab === 'methods' ? 'default' : 'outline'} onClick={() => setTab('methods')}>Metode Pembayaran <span className="opacity-70">({methods.length})</span></Button>
          <Button size="sm" variant={tab === 'accounts' ? 'default' : 'outline'} onClick={() => setTab('accounts')}>Rekening Tujuan <span className="opacity-70">({accounts.length})</span></Button>
        </nav>
        {tab === 'texts' ? <div className="grid gap-3 sm:grid-cols-2">{fields.map((f) => <label key={f.key} className="grid gap-1 text-xs font-medium">{f.label}
          <input className={input} type={f.num ? 'number' : 'text'} value={String(content[f.key])} onChange={(e) => set({ [f.key]: f.num ? Number(e.target.value) || 0 : e.target.value } as Partial<DepositContent>)} />
        </label>)}</div> : tab === 'methods' ? <>
          <div className="mb-3 flex justify-end"><Button size="sm" onClick={() => set({ methods: [...methods, { id: crypto.randomUUID(), label: 'Transfer Bank Baru', badge: 'BARU', bank: '' }] })}><Plus /> Tambah Metode</Button></div>
          <ul className="space-y-2">{methods.map((m, i) => <li key={m.id} className="grid gap-2 rounded-lg border border-border p-2 sm:grid-cols-[1fr_100px_150px_auto]">
            <input className={input} aria-label="Nama metode" value={m.label} onChange={(e) => set({ methods: methods.map((x) => x.id === m.id ? { ...x, label: e.target.value } : x) })} />
            <input className={input} aria-label="Label singkat" value={m.badge} onChange={(e) => set({ methods: methods.map((x) => x.id === m.id ? { ...x, badge: e.target.value } : x) })} />
            <select className={input} aria-label="Bank tujuan" value={m.bank} onChange={(e) => set({ methods: methods.map((x) => x.id === m.id ? { ...x, bank: e.target.value } : x) })}><option value="">Tanpa rekening bank</option>{[...new Set(accounts.map((a) => a.bank).filter(Boolean))].map((bank) => <option key={bank}>{bank}</option>)}</select>
            <div className="flex">
              <Button variant="ghost" size="icon" aria-label="Naik" onClick={() => move(i, -1)}><ArrowUp /></Button>
              <Button variant="ghost" size="icon" aria-label="Turun" onClick={() => move(i, 1)}><ArrowDown /></Button>
              <Button variant="ghost" size="icon" aria-label="Hapus" onClick={() => { if (confirm(`Hapus ${m.label}?`)) set({ methods: methods.filter((x) => x.id !== m.id) }); }}><Trash2 className="text-destructive" /></Button>
            </div>
          </li>)}
            {methods.length === 0 && <li className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Belum ada metode.</li>}
          </ul>
        </> : <>
          <div className="mb-3 flex justify-end"><Button size="sm" onClick={() => saveAccounts([...accounts, { id: crypto.randomUUID(), bank: methods.find((m) => m.bank)?.bank ?? methods[0]?.badge ?? '', holder: '', number: '', active: true }])}><Plus /> Tambah Rekening</Button></div>
          <div className="space-y-2">{accounts.map((account) => <article key={account.id} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[140px_1fr_1fr_auto_auto]">
            <select className={input} aria-label="Bank rekening tujuan" value={account.bank} onChange={(e) => saveAccounts(accounts.map((item) => item.id === account.id ? { ...item, bank: e.target.value } : item))}>{[...new Set([...methods.map((m) => m.bank), account.bank].filter(Boolean))].map((bank) => <option key={bank}>{bank}</option>)}</select>
            <input className={input} aria-label="Nama pemilik rekening tujuan" value={account.holder} maxLength={100} placeholder="Nama pemilik rekening" onChange={(e) => saveAccounts(accounts.map((item) => item.id === account.id ? { ...item, holder: e.target.value } : item))} />
            <input className={input} aria-label="Nomor rekening tujuan" value={account.number} maxLength={30} placeholder="Nomor rekening" onChange={(e) => saveAccounts(accounts.map((item) => item.id === account.id ? { ...item, number: e.target.value.replace(/\D/g, '') } : item))} />
            <label className="flex items-center justify-center gap-2 text-xs"><input type="checkbox" checked={account.active} onChange={(e) => saveAccounts(accounts.map((item) => item.id === account.id ? { ...item, active: e.target.checked } : item))} />Aktif</label>
            <Button variant="ghost" size="icon" aria-label="Hapus rekening tujuan" onClick={() => confirm('Hapus rekening tujuan ini?') && saveAccounts(accounts.filter((item) => item.id !== account.id))}><Trash2 /></Button>
          </article>)}
            {accounts.length === 0 && <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Belum ada rekening tujuan. Tambahkan rekening agar pengguna dapat melihat detail pembayaran.</p>}
          </div>
        </>}
      </section>
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <h2 className="mb-2 text-sm font-semibold">Live Preview</h2>
        <div className="mx-auto h-[760px] w-[390px] max-w-full overflow-hidden rounded-[2rem] border-8 border-foreground bg-background shadow-xl" style={{ transform: 'translateZ(0)' }}>
          <div className="h-full overflow-y-auto"><DepositScreen /></div>
        </div>
      </aside>
    </div>
  </div>;
}
