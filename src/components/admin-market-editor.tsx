import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Plus, Trash2, ArrowUp, ArrowDown, ChevronLeft, Monitor, Pencil, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketScreen } from '@/components/market-screens';
import { useMarket } from '@/components/market-context';
import type { Product } from '@/lib/market-data';

const input = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground';
type Tab = 'products' | 'groups';

export function AdminMarketEditor() {
  const { products, setProducts, groups, setGroups, moveGroup } = useMarket();
  const [tab, setTab] = useState<Tab>('products');
  const [filter, setFilter] = useState('Semua');
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [newGroup, setNewGroup] = useState('');
  const [editGroup, setEditGroup] = useState<{ i: number; v: string } | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  const update = (i: number, patch: Partial<Product>) => setProducts(p => p.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const addProduct = () => {
    const group = filter !== 'Semua' ? filter : groups[0] ?? 'Forex';
    let n = 1; while (products.some(p => p.symbol === `NEW${n}`)) n++;
    setProducts(p => [...p, { symbol: `NEW${n}`, name: 'Produk baru', group, ask: 1, spread: 10, decimals: 5, change: 0 }]);
    setOpenIdx(products.length);
  };
  const addGroup = () => { const v = newGroup.trim(); if (!v || groups.includes(v)) return; setGroups(g => [...g, v]); setNewGroup(''); setPreviewKey(k => k + 1); };
  const renameGroup = (i: number, v: string) => {
    const old = groups[i]; const name = v.trim(); if (!old || !name || (name !== old && groups.includes(name))) return;
    setGroups(g => g.map((x, j) => (j === i ? name : x)));
    setProducts(p => p.map(x => (x.group === old ? { ...x, group: name } : x)));
    setEditGroup(null); setPreviewKey(k => k + 1);
  };
  const deleteGroup = (i: number) => {
    const g = groups[i]; if (!g) return; const count = products.filter(p => p.group === g).length;
    if (!confirm(`Hapus kategori "${g}"${count ? ` beserta ${count} produk di dalamnya` : ''}?`)) return;
    setGroups(x => x.filter((_, j) => j !== i)); setProducts(p => p.filter(x => x.group !== g)); setPreviewKey(k => k + 1);
  };

  const rows = products.map((p, i) => ({ p, i })).filter(r => filter === 'Semua' || r.p.group === filter);

  return <div className="min-h-screen bg-muted text-foreground">
    <header className="flex flex-wrap items-center gap-3 border-b border-border bg-background px-4 py-3">
      <Button asChild variant="ghost" size="sm"><Link to="/admin"><ChevronLeft /> Admin</Link></Button>
      <h1 className="text-lg font-bold">Kelola Pasar</h1>
      <div className="ml-auto flex gap-2">
        <Button asChild size="sm"><Link to="/pasar"><Monitor /> Buka Pasar</Link></Button>
      </div>
    </header>
    <p className="bg-accent px-4 py-2 text-xs text-accent-foreground">Perubahan tersimpan otomatis di browser ini saja (belum terhubung ke server). Harga bersifat simulasi.</p>
    <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="min-w-0 rounded-xl border border-border bg-background p-4">
        <nav className="mb-4 flex flex-wrap gap-2">
          <Button size="sm" variant={tab === 'products' ? 'default' : 'outline'} onClick={() => setTab('products')}>Produk <span className="opacity-70">({products.length})</span></Button>
          <Button size="sm" variant={tab === 'groups' ? 'default' : 'outline'} onClick={() => setTab('groups')}>Kategori <span className="opacity-70">({groups.length})</span></Button>
        </nav>

        {tab === 'products' ? <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <select className={`${input} w-auto`} value={filter} onChange={e => { setFilter(e.target.value); setOpenIdx(null); }}>
              {['Semua', ...groups].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <span className="text-xs text-muted-foreground">{rows.length} produk</span>
            <Button size="sm" className="ml-auto" disabled={!groups.length} onClick={addProduct}><Plus /> Tambah Produk</Button>
          </div>
          <ul className="space-y-2">{rows.map(({ p, i }) => { const isOpen = openIdx === i; const dup = products.some((x, j) => j !== i && x.symbol === p.symbol); return <li key={i} className="rounded-lg border border-border">
            <div className="flex items-center gap-2 p-2">
              <button className="flex-1 truncate text-left text-sm" onClick={() => setOpenIdx(isOpen ? null : i)}><b>{p.symbol}</b> <span className="text-muted-foreground">· {p.group} · {p.name}</span></button>
              <Button variant="ghost" size="icon" aria-label="Hapus" onClick={() => { if (confirm(`Hapus ${p.symbol}?`)) { setProducts(x => x.filter((_, j) => j !== i)); setOpenIdx(null); } }}><Trash2 className="text-destructive" /></Button>
            </div>
            {isOpen && <div className="grid gap-3 border-t border-border p-3 sm:grid-cols-2">
              <label className="grid gap-1 text-xs font-medium">Simbol<input className={input} value={p.symbol} onChange={e => update(i, { symbol: e.target.value.toUpperCase().replace(/\s/g, '') })} />{dup && <span className="text-destructive">Simbol sudah dipakai</span>}</label>
              <label className="grid gap-1 text-xs font-medium">Kategori<select className={input} value={p.group} onChange={e => update(i, { group: e.target.value })}>{groups.map(g => <option key={g} value={g}>{g}</option>)}</select></label>
              <label className="grid gap-1 text-xs font-medium sm:col-span-2">Nama<input className={input} value={p.name} onChange={e => update(i, { name: e.target.value })} /></label>
              <label className="grid gap-1 text-xs font-medium">Ask Price<input type="number" step="any" className={input} value={p.ask} onChange={e => update(i, { ask: Number(e.target.value) || 0 })} /></label>
              <label className="grid gap-1 text-xs font-medium">Spread (poin)<input type="number" className={input} value={p.spread} onChange={e => update(i, { spread: Number(e.target.value) || 0 })} /></label>
              <label className="grid gap-1 text-xs font-medium">Desimal<input type="number" min={0} max={8} className={input} value={p.decimals} onChange={e => update(i, { decimals: Math.min(8, Math.max(0, Math.round(Number(e.target.value) || 0))) })} /></label>
              <label className="grid gap-1 text-xs font-medium">Perubahan (%)<input type="number" step="0.01" className={input} value={p.change} onChange={e => update(i, { change: Number(e.target.value) || 0 })} /></label>
            </div>}
          </li>; })}
            {rows.length === 0 && <li className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Belum ada produk.</li>}
          </ul>
        </> : <>
          <form className="mb-3 flex gap-2" onSubmit={e => { e.preventDefault(); addGroup(); }}>
            <input className={input} placeholder="Nama kategori baru" value={newGroup} onChange={e => setNewGroup(e.target.value)} />
            <Button size="sm" type="submit" disabled={!newGroup.trim() || groups.includes(newGroup.trim())}><Plus /> Tambah</Button>
          </form>
          <ul className="space-y-2">{groups.map((g, i) => <li key={g} className="flex items-center gap-2 rounded-lg border border-border p-2">
            {editGroup?.i === i
              ? <form className="flex flex-1 gap-2" onSubmit={e => { e.preventDefault(); renameGroup(i, editGroup.v); }}><input autoFocus className={input} value={editGroup.v} onChange={e => setEditGroup({ i, v: e.target.value })} /><Button size="icon" type="submit" aria-label="Simpan"><Check /></Button></form>
              : <span className="flex-1 text-sm font-medium">{i + 1}. {g} <span className="text-muted-foreground">({products.filter(p => p.group === g).length} produk)</span></span>}
            <Button variant="ghost" size="icon" aria-label="Ubah nama" onClick={() => setEditGroup({ i, v: g })}><Pencil /></Button>
            <Button variant="ghost" size="icon" aria-label="Naik" onClick={() => moveGroup(i, i - 1)}><ArrowUp /></Button>
            <Button variant="ghost" size="icon" aria-label="Turun" onClick={() => moveGroup(i, i + 1)}><ArrowDown /></Button>
            <Button variant="ghost" size="icon" aria-label="Hapus" onClick={() => deleteGroup(i)}><Trash2 className="text-destructive" /></Button>
          </li>)}
            {groups.length === 0 && <li className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Belum ada kategori.</li>}
          </ul>
        </>}
      </section>
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <h2 className="mb-2 text-sm font-semibold">Live Preview</h2>
        <div className="mx-auto h-[760px] w-[390px] max-w-full overflow-hidden rounded-[2rem] border-8 border-foreground bg-background shadow-xl" style={{ transform: 'translateZ(0)' }}>
          <div className="h-full overflow-y-auto"><MarketScreen key={previewKey} /></div>
        </div>
      </aside>
    </div>
  </div>;
}
