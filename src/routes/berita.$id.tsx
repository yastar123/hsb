import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, Newspaper, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getNewsArticle } from '@/lib/news-data';
import { useNews } from '@/lib/news-store';

export const Route = createFileRoute('/berita/$id')({
  loader: ({ params }) => ({ article: getNewsArticle(params.id) ?? null }),
  head: ({ loaderData }) => {
    if (!loaderData?.article) {
      return { meta: [
        { title: 'Berita — HSB Trading' },
        { name: 'robots', content: 'noindex' },
      ] };
    }
    const a = loaderData.article;
    return { meta: [
      { title: `${a.title} — HSB Trading` },
      { name: 'description', content: a.text },
      { property: 'og:title', content: a.title },
      { property: 'og:description', content: a.text },
      { property: 'og:type', content: 'article' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ] };
  },
  component: BeritaDetailPage,
  notFoundComponent: BeritaNotFound,
});

function BeritaDetailPage() {
  const { id } = Route.useParams();
  const { list, ready } = useNews();
  const article = list.find((a) => String(a.id) === id);
  if (!article) return ready ? <BeritaNotFound /> : null;
  const related = list.filter((a) => a.id !== article.id && a.cat === article.cat).slice(0, 2);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: article.title, url }); } catch { /* dibatalkan pengguna */ }
    } else {
      try { await navigator.clipboard.writeText(url); } catch { /* tidak diizinkan */ }
    }
  };

  return <main className="home-page"><div className="home-shell">
    <header className="home-header">
      <Button asChild variant="ghost" size="icon" aria-label="Kembali"><Link to="/berita"><ArrowLeft /></Link></Button>
      <b className="flex items-center gap-2"><Newspaper className="size-4" /> Detail Berita</b>
      <Button variant="ghost" size="icon" aria-label="Bagikan" onClick={share}><Share2 /></Button>
    </header>
    <article className="pb-8">
      <img src={article.img} alt={article.title} className="h-48 w-full object-cover" />
      <div className="px-4 pt-4">
        <small className="text-primary">{article.cat} · {article.date}</small>
        <h1 className="mt-2 text-xl font-bold leading-snug">{article.title}</h1>
        <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-foreground/90">
          {article.body.map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <p className="mt-6 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          Konten ini hanya untuk informasi dan edukasi, bukan rekomendasi investasi. Perdagangan mengandung risiko kerugian.
        </p>
      </div>
      {related.length > 0 && (
        <div className="mt-6 px-4">
          <h2 className="mb-3 font-semibold">Berita Terkait</h2>
          <div className="flex flex-col gap-3">
            {related.map((a) => (
              <Link key={a.id} to="/berita/$id" params={{ id: String(a.id) }} className="flex gap-3 overflow-hidden rounded-xl border border-border bg-card p-3">
                <img src={a.img} alt={a.title} loading="lazy" className="h-16 w-20 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0">
                  <small className="text-primary">{a.cat}</small>
                  <p className="line-clamp-2 text-sm font-medium">{a.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      <div className="mt-6 px-4">
        <Button asChild variant="outline" className="w-full"><Link to="/berita">Lihat Semua Berita</Link></Button>
      </div>
    </article>
  </div></main>;
}

function BeritaNotFound() {
  return <main className="home-page"><div className="home-shell">
    <div className="flex flex-col items-center gap-3 px-4 py-20 text-center">
      <Newspaper className="size-10 text-muted-foreground" />
      <h1 className="text-lg font-bold">Berita tidak ditemukan</h1>
      <p className="text-sm text-muted-foreground">Berita yang Anda cari mungkin sudah dihapus atau tidak pernah ada.</p>
      <Button asChild className="mt-2"><Link to="/berita">Kembali ke Daftar Berita</Link></Button>
    </div>
  </div></main>;
}
