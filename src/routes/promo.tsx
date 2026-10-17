import { createFileRoute } from '@tanstack/react-router';
import { PromoScreen } from '@/components/insight-pages';
export const Route = createFileRoute('/promo')({
  head: () => ({ meta: [
    { title: 'Promo — WebullXAU Trading' },
    { name: 'description', content: 'Promo dan bonus terbaru untuk trader WebullXAU.' },
    { property: 'og:title', content: 'Promo — WebullXAU Trading' },
    { property: 'og:description', content: 'Promo dan bonus terbaru untuk trader WebullXAU.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: PromoScreen,
});
