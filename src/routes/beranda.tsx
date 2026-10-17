import { createFileRoute } from '@tanstack/react-router';
import { HomeScreen } from '@/components/home-screen';
export const Route = createFileRoute('/beranda')({
  head: () => ({ meta: [
    { title: 'Beranda — WebullXAU Trading' },
    { name: 'description', content: 'Beranda WebullXAU Trading dengan promo, ringkasan pasar, sinyal trading, dan berita ekonomi.' },
    { property: 'og:title', content: 'Beranda — WebullXAU Trading' },
    { property: 'og:description', content: 'Jelajahi promo, informasi pasar, sinyal trading, dan berita ekonomi WebullXAU.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: HomeScreen,
});