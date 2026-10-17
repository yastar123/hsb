import { createFileRoute } from '@tanstack/react-router';
import { SignalScreen } from '@/components/insight-pages';
export const Route = createFileRoute('/sinyal-trading')({
  head: () => ({ meta: [
    { title: 'Sinyal Trading — WebullXAU Trading' },
    { name: 'description', content: 'Sinyal trading harian dari analis profesional untuk disalin.' },
    { property: 'og:title', content: 'Sinyal Trading — WebullXAU Trading' },
    { property: 'og:description', content: 'Sinyal trading harian dari analis profesional untuk disalin.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: SignalScreen,
});
