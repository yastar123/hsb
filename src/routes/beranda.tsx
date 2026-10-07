import { createFileRoute } from '@tanstack/react-router';
import { HomeScreen } from '@/components/home-screen';
export const Route = createFileRoute('/beranda')({
  head: () => ({ meta: [
    { title: 'Beranda — HSB Trading' },
    { name: 'description', content: 'Beranda HSB Trading dengan promo, ringkasan pasar, sinyal trading, dan berita ekonomi.' },
    { property: 'og:title', content: 'Beranda — HSB Trading' },
    { property: 'og:description', content: 'Jelajahi promo, informasi pasar, sinyal trading, dan berita ekonomi HSB.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: HomeScreen,
});