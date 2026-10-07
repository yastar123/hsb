import { createFileRoute } from '@tanstack/react-router';
import { ClientScreen } from '@/components/partner-pages';
export const Route = createFileRoute('/klien')({
  head: () => ({ meta: [
    { title: 'Klien Mitra — HSB Trading' },
    { name: 'description', content: 'Daftar dan ringkasan klien yang Anda referensikan melalui program mitra HSB.' },
    { property: 'og:title', content: 'Klien Mitra — HSB Trading' },
    { property: 'og:description', content: 'Daftar dan ringkasan klien yang Anda referensikan melalui program mitra HSB.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: ClientScreen,
});
