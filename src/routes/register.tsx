import { createFileRoute } from '@tanstack/react-router';
import { AccountScreen } from '@/components/account-screen';
export const Route = createFileRoute('/register')({
  head: () => ({ meta: [
    { title: 'Buka Akun — HSB Trading' },
    { name: 'description', content: 'Halaman pendaftaran akun HSB Trading.' },
    { property: 'og:title', content: 'Buka Akun — HSB Trading' },
    { property: 'og:description', content: 'Mulai pendaftaran akun HSB Trading Anda.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: () => <AccountScreen mode="register" />,
});