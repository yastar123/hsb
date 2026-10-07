import { createFileRoute } from '@tanstack/react-router';
import { PromoScreen } from '@/components/insight-pages';
export const Route = createFileRoute('/promo')({
  head: () => ({ meta: [
    { title: 'Promo — HSB Trading' },
    { name: 'description', content: 'Promo dan bonus terbaru untuk trader HSB.' },
    { property: 'og:title', content: 'Promo — HSB Trading' },
    { property: 'og:description', content: 'Promo dan bonus terbaru untuk trader HSB.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: PromoScreen,
});
