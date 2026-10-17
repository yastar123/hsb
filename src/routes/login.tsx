import { createFileRoute } from '@tanstack/react-router';
import { AccountScreen } from '@/components/account-screen';
export const Route = createFileRoute('/login')({
  head: () => ({ meta: [
    { title: 'Masuk — WebullXAU Trading' },
    { name: 'description', content: 'Halaman masuk WebullXAU Trading dengan email.' },
    { property: 'og:title', content: 'Masuk — WebullXAU Trading' },
    { property: 'og:description', content: 'Masuk ke akun WebullXAU Trading Anda.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: () => <AccountScreen mode="login" />,
});