import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Plus, Trash2, ArrowUp, ArrowDown, ChevronLeft, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HomeScreen } from '@/components/home-screen';
import { useHomeContent, imageLibrary, resolveImage, uid, type HomeContent } from '@/components/home-content';
import { SaveStatusText } from '@/lib/site-content';

type FieldType = 'text' | 'textarea' | 'checkbox' | 'image' | 'link';
type Field = { key: string; label: string; type?: FieldType };
type SectionKey = keyof HomeContent;
const links = ['/deposit', '/withdraw', '/faq', '/promo', '/proteksi-dana', '/pasar', '/berita', '/posisi', '/mitra', '/profil', '/sinyal-trading', '/kalender-ekonomi', '/beranda'];

const sections: { key: SectionKey; label: string; titleKey: string; fields: Field[]; blank: () => Record<string, unknown> }[] = [
  { key: 'banners', label: 'Banner Promo', titleKey: 'title', fields: [
    { key: 'title', label: 'Nama banner' }, { key: 'heading', label: 'Judul (baris baru = Enter)', type: 'textarea' }, { key: 'text', label: 'Teks', type: 'textarea' },
    { key: 'button', label: 'Teks tombol' }, { key: 'link', label: 'Tujuan tombol', type: 'link' }, { key: 'note', label: 'Catatan kecil' },
    { key: 'image', label: 'Gambar', type: 'image' }, { key: 'alt', label: 'Deskripsi gambar' }, { key: 'dark', label: 'Tema gelap', type: 'checkbox' },
  ], blank: () => ({ id: uid(), image: 'welcome-safe', alt: 'Banner baru', title: 'Banner Baru', heading: 'JUDUL\nBARU', text: 'Teks banner', button: 'LIHAT', link: '/promo', dark: false, note: '' }) },
  { key: 'markets', label: 'Harga Pasar', titleKey: 'symbol', fields: [
    { key: 'symbol', label: 'Simbol' }, { key: 'price', label: 'Harga' }, { key: 'change', label: 'Perubahan (%)' },
  ], blank: () => ({ id: uid(), symbol: 'EURUSD', price: '1.0850', change: '0.10' }) },
  { key: 'shortcuts', label: 'Menu Cepat', titleKey: 'label', fields: [
    { key: 'label', label: 'Nama menu' }, { key: 'link', label: 'Tujuan', type: 'link' },
  ], blank: () => ({ id: uid(), label: 'Menu Baru', link: '/promo' }) },
  { key: 'signals', label: 'Sinyal Trading', titleKey: 'symbol', fields: [
    { key: 'symbol', label: 'Simbol' }, { key: 'open', label: 'Open' }, { key: 'tp', label: 'TP' }, { key: 'sl', label: 'SL' },
    { key: 'profit', label: 'Estimasi profit' }, { key: 'loss', label: 'Estimasi rugi' }, { key: 'sell', label: 'Sinyal jual', type: 'checkbox' },
  ], blank: () => ({ id: uid(), symbol: 'EURUSD', open: '1.0850', tp: '1.0900', sl: '1.0820', profit: '+50.00$', loss: '-30.00$', sell: false }) },
  { key: 'agenda', label: 'Agenda', titleKey: 'bold', fields: [
    { key: 'text', label: 'Teks atas' }, { key: 'bold', label: 'Teks tebal' }, { key: 'detail', label: 'Isi saat diklik', type: 'textarea' },
  ], blank: () => ({ id: uid(), text: 'Agenda baru', bold: 'Judul agenda', detail: 'Detail agenda.' }) },
  { key: 'news', label: 'Berita', titleKey: 'title', fields: [
    { key: 'title', label: 'Judul' }, { key: 'category', label: 'Kategori' }, { key: 'text', label: 'Isi singkat', type: 'textarea' }, { key: 'image', label: 'Gambar', type: 'image' },
  ], blank: () => ({ id: uid(), image: 'trading-news', category: 'Edukasi', title: 'Berita baru', text: 'Isi berita.' }) },
];

const input = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground';

export function AdminHomeEditor() {
  const { content, setContent, status, error } = useHomeContent();
  const [tab, setTab] = useState<SectionKey>('banners');
  const [openId, setOpenId] = useState<string | null>(null);
  const section = sections.find((s) => s.key === tab)!;
  const items = content[tab] as unknown as Record<string, unknown>[];
  const save = (next: Record<string, unknown>[]) => setContent((p) => ({ ...p, [tab]: next }));
  const update = (id: string, key: string, value: unknown) => save(items.map((it) => (it['id'] === id ? { ...it, [key]: value } : it)));
  const move = (i: number, d: number) => { const n = [...items]; const j = i + d; if (j < 0 || j >= n.length) return; const t = n[i]!; n[i] = n[j]!; n[j] = t; save(n); };

  return <div className="min-h-screen bg-muted text-foreground">
    <header className="flex flex-wrap items-center gap-3 border-b border-border bg-background px-4 py-3">
      <Button asChild variant="ghost" size="sm"><Link to="/admin"><ChevronLeft /> Admin</Link></Button>
      <h1 className="text-lg font-bold">Kelola Beranda</h1>
      <div className="ml-auto flex gap-2">
        <Button asChild size="sm"><Link to="/beranda"><Monitor /> Buka Beranda</Link></Button>
      </div>
    </header>
    <p className="bg-accent px-4 py-2 text-xs text-accent-foreground"><SaveStatusText status={status} error={error} /></p>
    <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="min-w-0 rounded-xl border border-border bg-background p-4">
        <nav className="mb-4 flex flex-wrap gap-2">{sections.map((s) => <Button key={s.key} size="sm" variant={tab === s.key ? 'default' : 'outline'} onClick={() => { setTab(s.key); setOpenId(null); }}>{s.label} <span className="opacity-70">({(content[s.key] as unknown[]).length})</span></Button>)}</nav>
        <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">{section.label}</h2><Button size="sm" onClick={() => { const b = section.blank(); save([...items, b]); setOpenId(b['id'] as string); }}><Plus /> Tambah</Button></div>
        <ul className="space-y-2">{items.map((it, i) => { const id = it['id'] as string; const isOpen = openId === id; return <li key={id} className="rounded-lg border border-border">
          <div className="flex items-center gap-2 p-2">
            <button className="flex-1 truncate text-left text-sm font-medium" onClick={() => setOpenId(isOpen ? null : id)}>{i + 1}. {String(it[section.titleKey] ?? '').replace(/\n/g, ' ')}</button>
            <Button variant="ghost" size="icon" aria-label="Naik" onClick={() => move(i, -1)}><ArrowUp /></Button>
            <Button variant="ghost" size="icon" aria-label="Turun" onClick={() => move(i, 1)}><ArrowDown /></Button>
            <Button variant="ghost" size="icon" aria-label="Hapus" onClick={() => { if (confirm('Hapus item ini?')) save(items.filter((x) => x['id'] !== id)); }}><Trash2 className="text-destructive" /></Button>
          </div>
          {isOpen && <div className="grid gap-3 border-t border-border p-3 sm:grid-cols-2">{section.fields.map((f) => <label key={f.key} className={`grid gap-1 text-xs font-medium ${f.type === 'textarea' || f.type === 'image' ? 'sm:col-span-2' : ''}`}>
            {f.type === 'checkbox' ? <span className="flex items-center gap-2"><input type="checkbox" checked={Boolean(it[f.key])} onChange={(e) => update(id, f.key, e.target.checked)} />{f.label}</span> : <>{f.label}
              {f.type === 'textarea' ? <textarea rows={2} className={input} value={String(it[f.key] ?? '')} onChange={(e) => update(id, f.key, e.target.value)} />
                : f.type === 'link' ? <select className={input} value={String(it[f.key])} onChange={(e) => update(id, f.key, e.target.value)}>{links.map((l) => <option key={l} value={l}>{l}</option>)}</select>
                : f.type === 'image' ? <div className="grid gap-2"><div className="flex flex-wrap gap-2">{Object.keys(imageLibrary).map((k) => <button type="button" key={k} onClick={() => update(id, f.key, k)} className={`overflow-hidden rounded-md border-2 ${it[f.key] === k ? 'border-primary' : 'border-transparent'}`}><img src={imageLibrary[k]} alt={k} className="h-12 w-20 object-cover" /></button>)}</div><input className={input} placeholder="atau tempel URL gambar (https://...)" value={imageLibrary[String(it[f.key])] ? '' : String(it[f.key] ?? '')} onChange={(e) => update(id, f.key, e.target.value)} />{!imageLibrary[String(it[f.key])] && it[f.key] ? <img src={resolveImage(String(it[f.key]))} alt="" className="h-16 w-28 rounded object-cover" /> : null}</div>
                : <input className={input} value={String(it[f.key] ?? '')} onChange={(e) => update(id, f.key, e.target.value)} />}</>}
          </label>)}</div>}
        </li>; })}
          {items.length === 0 && <li className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Belum ada item.</li>}
        </ul>
      </section>
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <h2 className="mb-2 text-sm font-semibold">Live Preview</h2>
        <div className="mx-auto h-[760px] w-[390px] max-w-full overflow-hidden rounded-[2rem] border-8 border-foreground bg-background shadow-xl" style={{ transform: 'translateZ(0)' }}>
          <div className="h-full overflow-y-auto"><HomeScreen /></div>
        </div>
      </aside>
    </div>
  </div>;
}
