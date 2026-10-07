import { useEffect, useState } from 'react';
import { newsArticles, type NewsArticle } from '@/lib/news-data';

const KEY = 'hsb-news-v1';
const EVT = 'hsb-news-change';

function load(): NewsArticle[] {
  try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : newsArticles; } catch { return newsArticles; }
}

/** Browser-saved news list shared by /berita and /admin/berita. Falls back to sample articles. */
export function useNews() {
  const [list, setList] = useState<NewsArticle[]>(newsArticles);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sync = () => setList(load());
    sync(); setReady(true);
    window.addEventListener(EVT, sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener('storage', sync); };
  }, []);
  const save = (n: NewsArticle[]) => {
    try { localStorage.setItem(KEY, JSON.stringify(n)); } catch { alert('Penyimpanan browser penuh. Gunakan gambar yang lebih kecil.'); return; }
    setList(n); window.dispatchEvent(new Event(EVT));
  };
  const reset = () => { localStorage.removeItem(KEY); setList(newsArticles); window.dispatchEvent(new Event(EVT)); };
  return { list, save, reset, ready };
}

/** Resize an uploaded image and return it as a compact data URL. */
export function fileToDataUrl(file: File, max = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = url;
  });
}
