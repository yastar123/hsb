import { createFileRoute } from '@tanstack/react-router';
import { AdminHomeEditor } from '@/components/admin-home-editor';

export const Route = createFileRoute('/admin/beranda')({
  head: () => ({ meta: [
    { title: 'Kelola Beranda — Admin HSB' },
    { name: 'description', content: 'Kelola semua konten halaman Beranda HSB dengan live preview.' },
    { property: 'og:title', content: 'Kelola Beranda — Admin HSB' },
    { property: 'og:description', content: 'Editor konten Beranda HSB dengan pratinjau langsung.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: AdminHomeEditor,
});
