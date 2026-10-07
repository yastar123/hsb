import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Plus, Trash2, ArrowUp, ArrowDown, RotateCcw, ChevronLeft, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DepositScreen } from '@/components/account-pages';
import { useDepositContent, type DepositContent } from '@/components/deposit-content';

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
  const { content, setContent, reset } = useDepositContent();
  const [tab, setTab] = useState<'texts' | 'methods'>('texts');
  const set = (patch: Partial<DepositContent>) => setContent((p) => ({ ...p, ...patch }));
  const methods = content.methods;
  const move = (i: number, d: number) => { const n = [...methods]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j]!, n[i]!]; set({ methods: n }); };

  return <div className="min-h-screen bg-muted text-foreground">
    <header className="flex flex-wrap items-center gap-3 border-b border-border bg-background px-4 py-3">
      <Button asChild variant="ghost" size="sm"><Link to="/admin"><ChevronLeft /> Admin</Link></Button>
      <h1 className="text-lg font-bold">Kelola Deposit</h1>
      <div className="ml-auto flex gap-2">
        <Button variant="outline" size="sm" onClick={() => { if (confirm('Kembalikan halaman Deposit ke awal?')) reset(); }}><RotateCcw /> Reset</Button>
        <Button asChild size="sm"><Link to="/deposit"><Monitor /> Buka Deposit</Link></Button>
      </div>
    </header>
    <p className="bg-accent px-4 py-2 text-xs text-accent-foreground">Perubahan tersimpan otomatis di browser ini saja (belum terhubung ke server). Pembayaran tidak benar-benar diproses.</p>
    <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="min-w-0 rounded-xl border border-border bg-background p-4">
        <nav className="mb-4 flex flex-wrap gap-2">
          <Button size="sm" variant={tab === 'texts' ? 'default' : 'outline'} onClick={() => setTab('texts')}>Teks & Pengaturan</Button>
          <Button size="sm" variant={tab === 'methods' ? 'default' : 'outline'} onClick={() => setTab('methods')}>Metode Pembayaran <span className="opacity-70">({methods.length})</span></Button>
        </nav>
        {tab === 'texts' ? <div className="grid gap-3 sm:grid-cols-2">{fields.map((f) => <label key={f.key} className="grid gap-1 text-xs font-medium">{f.label}
          <input className={input} type={f.num ? 'number' : 'text'} value={String(content[f.key])} onChange={(e) => set({ [f.key]: f.num ? Number(e.target.value) || 0 : e.target.value } as Partial<DepositContent>)} />
        </label>)}</div> : <>
          <div className="mb-3 flex justify-end"><Button size="sm" onClick={() => set({ methods: [...methods, { id: crypto.randomUUID(), label: 'Transfer Bank Baru', badge: 'BARU' }] })}><Plus /> Tambah Metode</Button></div>
          <ul className="space-y-2">{methods.map((m, i) => <li key={m.id} className="grid gap-2 rounded-lg border border-border p-2 sm:grid-cols-[1fr_120px_auto]">
            <input className={input} aria-label="Nama metode" value={m.label} onChange={(e) => set({ methods: methods.map((x) => x.id === m.id ? { ...x, label: e.target.value } : x) })} />
            <input className={input} aria-label="Label singkat" value={m.badge} onChange={(e) => set({ methods: methods.map((x) => x.id === m.id ? { ...x, badge: e.target.value } : x) })} />
            <div className="flex">
              <Button variant="ghost" size="icon" aria-label="Naik" onClick={() => move(i, -1)}><ArrowUp /></Button>
              <Button variant="ghost" size="icon" aria-label="Turun" onClick={() => move(i, 1)}><ArrowDown /></Button>
              <Button variant="ghost" size="icon" aria-label="Hapus" onClick={() => { if (confirm(`Hapus ${m.label}?`)) set({ methods: methods.filter((x) => x.id !== m.id) }); }}><Trash2 className="text-destructive" /></Button>
            </div>
          </li>)}
            {methods.length === 0 && <li className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Belum ada metode.</li>}
          </ul>
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
