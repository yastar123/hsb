import { createFileRoute } from '@tanstack/react-router';
import { DailyReportScreen } from '@/components/insight-pages';
export const Route = createFileRoute('/daily-report')({
  head: () => ({ meta: [
    { title: 'Daily Report — WebullXAU Trading' },
    { name: 'description', content: 'Ringkasan harian pasar emas, minyak, dan saham dari tim WebullXAU.' },
    { property: 'og:title', content: 'Daily Report — WebullXAU Trading' },
    { property: 'og:description', content: 'Ringkasan harian pasar emas, minyak, dan saham dari tim WebullXAU.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: DailyReportScreen,
});
