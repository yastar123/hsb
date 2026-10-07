import { createFileRoute } from '@tanstack/react-router';
import { CalendarScreen } from '@/components/insight-pages';
export const Route = createFileRoute('/kalender-ekonomi')({
  head: () => ({ meta: [
    { title: 'Kalender Ekonomi — HSB Trading' },
    { name: 'description', content: 'Jadwal rilis data ekonomi penting dunia.' },
    { property: 'og:title', content: 'Kalender Ekonomi — HSB Trading' },
    { property: 'og:description', content: 'Jadwal rilis data ekonomi penting dunia.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: CalendarScreen,
});
