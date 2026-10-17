import { createFileRoute } from '@tanstack/react-router';
import { AdminMarketEditor } from '@/components/admin-market-editor';

export const Route = createFileRoute('/admin/pasar')({
  head: () => ({ meta: [
    { title: 'Kelola Pasar — Admin WebullXAU' },
    { name: 'description', content: 'Kelola produk pasar dan kategori WebullXAU dengan live preview.' },
    { property: 'og:title', content: 'Kelola Pasar — Admin WebullXAU' },
    { property: 'og:description', content: 'Editor produk dan kategori Pasar WebullXAU dengan pratinjau langsung.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: AdminMarketEditor,
});
