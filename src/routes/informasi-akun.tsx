import { createFileRoute } from '@tanstack/react-router';
import { AccountInfoScreen } from '@/components/profile-pages';
export const Route = createFileRoute('/informasi-akun')({
  head: () => ({ meta: [
    { title: 'Informasi Anda — HSB Trading' },
    { name: 'description', content: 'Lihat data pribadi akun HSB Trading Anda.' },
    { property: 'og:title', content: 'Informasi Anda — HSB Trading' },
    { property: 'og:description', content: 'Lihat data pribadi akun HSB Trading Anda.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: AccountInfoScreen,
});
