import { createFileRoute } from '@tanstack/react-router';
import { ClientScreen } from '@/components/partner-pages';
export const Route = createFileRoute('/klien')({
  head: () => ({ meta: [
    { title: 'Klien Mitra — WebullXAU Trading' },
    { name: 'description', content: 'Daftar dan ringkasan klien yang Anda referensikan melalui program mitra WebullXAU.' },
    { property: 'og:title', content: 'Klien Mitra — WebullXAU Trading' },
    { property: 'og:description', content: 'Daftar dan ringkasan klien yang Anda referensikan melalui program mitra WebullXAU.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: ClientScreen,
});
