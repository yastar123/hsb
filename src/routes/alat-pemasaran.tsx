import { createFileRoute } from '@tanstack/react-router';
import { MarketingToolsScreen } from '@/components/partner-pages';
export const Route = createFileRoute('/alat-pemasaran')({
  head: () => ({ meta: [
    { title: 'Alat Pemasaran — HSB Trading' },
    { name: 'description', content: 'Pusat sumber daya pemasaran mitra HSB: banner, video, dan halaman arahan siap pakai.' },
    { property: 'og:title', content: 'Alat Pemasaran — HSB Trading' },
    { property: 'og:description', content: 'Pusat sumber daya pemasaran mitra HSB: banner, video, dan halaman arahan siap pakai.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: MarketingToolsScreen,
});
