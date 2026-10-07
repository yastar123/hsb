import { createFileRoute } from '@tanstack/react-router';
import { PositionScreen } from '@/components/account-pages';
export const Route = createFileRoute('/posisi')({
  head: () => ({ meta: [
    { title: 'Posisi Akun — HSB Trading' },
    { name: 'description', content: 'Ringkasan akun demo, margin, dan posisi trading terbuka di HSB Trading.' },
    { property: 'og:title', content: 'Posisi Akun — HSB Trading' },
    { property: 'og:description', content: 'Ringkasan akun demo, margin, dan posisi trading terbuka di HSB Trading.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: PositionScreen,
});
