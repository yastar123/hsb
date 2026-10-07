import { createFileRoute } from '@tanstack/react-router';
import { LanguageScreen } from '@/components/profile-pages';
export const Route = createFileRoute('/bahasa')({
  head: () => ({ meta: [
    { title: 'Bahasa — HSB Trading' },
    { name: 'description', content: 'Pilih bahasa tampilan aplikasi HSB Trading.' },
    { property: 'og:title', content: 'Bahasa — HSB Trading' },
    { property: 'og:description', content: 'Pilih bahasa tampilan aplikasi HSB Trading.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: LanguageScreen,
});
