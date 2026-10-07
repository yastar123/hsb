import { createFileRoute } from '@tanstack/react-router';
import { SmartTraderScreen } from '@/components/insight-pages';
export const Route = createFileRoute('/smart-trader')({
  head: () => ({ meta: [
    { title: 'Smart Trader — HSB Trading' },
    { name: 'description', content: 'Alat bantu analisa dan perhitungan untuk trader.' },
    { property: 'og:title', content: 'Smart Trader — HSB Trading' },
    { property: 'og:description', content: 'Alat bantu analisa dan perhitungan untuk trader.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: SmartTraderScreen,
});
