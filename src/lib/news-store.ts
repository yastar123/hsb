import { useServerContent } from '@/lib/site-content';
import { newsArticles, type NewsArticle } from '@/lib/news-data';

/** PostgreSQL-backed news content shared by /berita and /admin/berita. */
export function useNews() {
  const remote = useServerContent<NewsArticle[]>('news', newsArticles);
  return {
    list: remote.value,
    save: remote.setValue,
    reset: () => remote.setValue(newsArticles),
    ready: remote.loaded,
    status: remote.status,
    error: remote.error,
  };
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
