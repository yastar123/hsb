import { createFileRoute } from '@tanstack/react-router';
import { WithdrawScreen } from '@/components/withdraw-screen';

export const Route = createFileRoute('/withdraw')({
  head: () => ({ meta: [
    { title: 'Withdraw — HSB Trading' },
    { name: 'description', content: 'Penarikan dana akun HSB Trading.' },
    { property: 'og:title', content: 'Withdraw — HSB Trading' },
    { property: 'og:description', content: 'Halaman penarikan dana akun HSB Trading.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: WithdrawScreen,
});