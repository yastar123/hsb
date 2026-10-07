import { createFileRoute } from '@tanstack/react-router';
import { CustomerServiceScreen } from '@/components/profile-pages';
export const Route = createFileRoute('/layanan-pelanggan')({
  head: () => ({ meta: [
    { title: 'Layanan Pelanggan — HSB Trading' },
    { name: 'description', content: 'Hubungi layanan pelanggan HSB melalui telepon, WhatsApp, email, atau live chat.' },
    { property: 'og:title', content: 'Layanan Pelanggan — HSB Trading' },
    { property: 'og:description', content: 'Hubungi layanan pelanggan HSB melalui telepon, WhatsApp, email, atau live chat.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: CustomerServiceScreen,
});
