import { createFileRoute } from '@tanstack/react-router';
import { AdminMarketEditor } from '@/components/admin-market-editor';

export const Route = createFileRoute('/admin/pasar')({
  head: () => ({ meta: [
    { title: 'Kelola Pasar — Admin HSB' },
    { name: 'description', content: 'Kelola produk pasar dan kategori HSB dengan live preview.' },
    { property: 'og:title', content: 'Kelola Pasar — Admin HSB' },
    { property: 'og:description', content: 'Editor produk dan kategori Pasar HSB dengan pratinjau langsung.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: AdminMarketEditor,
});
