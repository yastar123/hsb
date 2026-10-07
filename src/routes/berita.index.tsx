import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pagination, usePagination } from '@/components/pagination';
import { newsCategories } from '@/lib/news-data';
import { useNews } from '@/lib/news-store';

export const Route = createFileRoute('/berita/')({
  head: () => ({ meta: [
    { title: 'Berita Ekonomi — HSB Trading' },
    { name: 'description', content: 'Berita ekonomi, analisa teknikal, dan materi belajar trading dari HSB.' },
    { property: 'og:title', content: 'Berita Ekonomi — HSB Trading' },
    { property: 'og:description', content: 'Kumpulan berita ekonomi dan edukasi trading terbaru.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: BeritaPage,
});

function BeritaPage() {
  const [cat, setCat] = useState('Semua');
  const { list: all } = useNews();
  const list = all.filter((a) => cat === 'Semua' || a.cat === cat);
  const pg = usePagination(list);
  return <main className="home-page"><div className="home-shell">
    <header className="home-header"><Button asChild variant="ghost" size="icon" aria-label="Kembali"><Link to="/beranda"><ArrowLeft /></Link></Button><b className="flex items-center gap-2"><Newspaper className="size-4" /> Berita Ekonomi</b><span className="w-9" /></header>
    <div className="flex gap-2 overflow-x-auto px-4 py-3">{newsCategories.map((c) => <Button key={c} size="sm" variant={c === cat ? 'default' : 'secondary'} onClick={() => setCat(c)}>{c}</Button>)}</div>
    <div className="flex flex-col gap-4 px-4 pb-8">{pg.pageItems.map((a) => <article key={a.id} className="overflow-hidden rounded-xl border border-border bg-card">
      <img src={a.img} alt={a.title} loading="lazy" className="h-40 w-full object-cover" />
      <div className="p-4"><small className="text-primary">{a.cat} · {a.date}</small><h2 className="mt-1 font-semibold">{a.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{a.text}</p>
        <Button asChild variant="link" className="px-0"><Link to="/berita/$id" params={{ id: String(a.id) }}>Baca Selengkapnya</Link></Button></div>
    </article>)}
      <Pagination page={pg.page} totalPages={pg.totalPages} total={pg.total} onPage={pg.setPage} /></div>
  </div></main>;
}
