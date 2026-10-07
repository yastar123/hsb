import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Plus, Trash2, Pencil, Upload, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pagination, usePagination } from '@/components/pagination';
import { newsCategories, type NewsArticle } from '@/lib/news-data';
import { fileToDataUrl, useNews } from '@/lib/news-store';
import { SaveStatusText } from '@/lib/site-content';

export const Route = createFileRoute('/admin/berita')({
  head: () => ({ meta: [
    { title: 'Kelola Berita — Admin HSB' },
    { name: 'description', content: 'Tambah, ubah, hapus berita beserta gambar dan isi detailnya.' },
    { property: 'og:title', content: 'Kelola Berita — Admin HSB' },
    { property: 'og:description', content: 'Panel admin untuk mengelola berita.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: AdminBerita,
});

const inp = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm';
const cats = newsCategories.filter((c) => c !== 'Semua');
const today = () => new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
type Draft = Omit<NewsArticle, 'body'> & { bodyText: string };

function AdminBerita() {
  const { list, save, status, error } = useNews();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [q, setQ] = useState('');
  const set = (p: Partial<Draft>) => setDraft((d) => d && { ...d, ...p });

  const openNew = () => setDraft({ id: 0, cat: cats[0]!, title: '', img: '', date: today(), text: '', bodyText: '' });
  const openEdit = (a: NewsArticle) => setDraft({ ...a, bodyText: a.body.join('\n\n') });
  const submit = () => {
    if (!draft || !draft.title.trim() || !draft.img) return;
    const { bodyText, ...rest } = draft;
    const art: NewsArticle = { ...rest, title: rest.title.trim(), body: bodyText.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean) };
    if (draft.id) save(list.map((a) => a.id === draft.id ? art : a));
    else save([{ ...art, id: Math.max(0, ...list.map((a) => a.id)) + 1 }, ...list]);
    setDraft(null);
  };
  const upload = async (f?: File) => { if (f) set({ img: await fileToDataUrl(f) }); };
  const shown = list.filter((a) => `${a.title} ${a.cat}`.toLowerCase().includes(q.toLowerCase()));
  const pg = usePagination(shown);

  return <main className="space-y-4 p-4 text-foreground md:p-6">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h1 className="text-2xl font-bold">Kelola Berita</h1><p className="text-sm text-muted-foreground"><SaveStatusText status={status} error={error} /></p></div>
      <Button onClick={openNew}><Plus /> Tambah Berita</Button>
    </div>

    {draft && <article className="space-y-3 rounded-xl border border-border bg-background p-4">
      <div className="flex items-center justify-between"><h2 className="font-semibold">{draft.id ? 'Ubah Berita' : 'Berita Baru'}</h2><Button size="icon" variant="ghost" aria-label="Tutup" onClick={() => setDraft(null)}><X /></Button></div>
      <div className="grid gap-3 md:grid-cols-[240px_1fr]">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed border-input bg-muted text-sm text-muted-foreground" style={{ minHeight: 160 }}>
          {draft.img ? <img src={draft.img} alt="Pratinjau" className="h-40 w-full object-cover" /> : <><Upload /> Upload gambar</>}
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
          {draft.img && <span className="pb-2 text-xs">Klik untuk ganti gambar</span>}
        </label>
        <div className="space-y-3">
          <input className={inp} placeholder="Judul berita" value={draft.title} onChange={(e) => set({ title: e.target.value })} aria-label="Judul" />
          <div className="grid grid-cols-2 gap-3">
            <select className={inp} value={draft.cat} onChange={(e) => set({ cat: e.target.value })} aria-label="Kategori">{cats.map((c) => <option key={c}>{c}</option>)}</select>
            <input className={inp} value={draft.date} onChange={(e) => set({ date: e.target.value })} aria-label="Tanggal" placeholder="Tanggal" />
          </div>
          <input className={inp} placeholder="Ringkasan singkat" value={draft.text} onChange={(e) => set({ text: e.target.value })} aria-label="Ringkasan" />
        </div>
      </div>
      <textarea className={inp} rows={10} placeholder="Isi detail berita. Pisahkan paragraf dengan baris kosong." value={draft.bodyText} onChange={(e) => set({ bodyText: e.target.value })} aria-label="Isi berita" />
      <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDraft(null)}>Batal</Button><Button disabled={!draft.title.trim() || !draft.img} onClick={submit}>Simpan</Button></div>
      {!draft.img && <p className="text-right text-xs text-muted-foreground">Judul dan gambar wajib diisi.</p>}
    </article>}

    <article className="rounded-xl border border-border bg-background p-4">
      <div className="mb-3 flex items-center justify-between gap-2"><h2 className="font-semibold">Daftar Berita ({list.length})</h2><input className={`${inp} max-w-xs`} placeholder="Cari…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari berita" /></div>
      <ul className="divide-y divide-border">{pg.pageItems.map((a) => <li key={a.id} className="flex items-center gap-3 py-2">
        <img src={a.img} alt="" className="h-14 w-20 shrink-0 rounded-md object-cover" />
        <div className="min-w-0 flex-1"><p className="truncate font-medium">{a.title}</p><p className="text-xs text-muted-foreground">{a.cat} · {a.date} · {a.body.length} paragraf</p></div>
        <Button asChild size="icon" variant="ghost" aria-label="Lihat"><Link to="/berita/$id" params={{ id: String(a.id) }}><ExternalLink /></Link></Button>
        <Button size="icon" variant="ghost" aria-label="Ubah" onClick={() => openEdit(a)}><Pencil /></Button>
        <Button size="icon" variant="ghost" aria-label="Hapus" onClick={() => confirm(`Hapus "${a.title}"?`) && save(list.filter((x) => x.id !== a.id))}><Trash2 /></Button>
      </li>)}</ul>
      {!shown.length && <p className="text-sm text-muted-foreground">Tidak ada berita.</p>}
      <Pagination page={pg.page} totalPages={pg.totalPages} total={pg.total} onPage={pg.setPage} />
    </article>
  </main>;
}
