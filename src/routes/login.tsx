import { createFileRoute } from '@tanstack/react-router';
import { AccountScreen } from '@/components/account-screen';
export const Route = createFileRoute('/login')({
  head: () => ({ meta: [
    { title: 'Masuk — HSB Trading' },
    { name: 'description', content: 'Halaman masuk HSB Trading dengan nomor telepon, email, atau akun MT5.' },
    { property: 'og:title', content: 'Masuk — HSB Trading' },
    { property: 'og:description', content: 'Masuk ke akun HSB Trading Anda.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: () => <AccountScreen mode="login" />,
});