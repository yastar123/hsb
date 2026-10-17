import { createFileRoute } from '@tanstack/react-router';
import { WithdrawScreen } from '@/components/withdraw-screen';

export const Route = createFileRoute('/withdraw')({
  head: () => ({ meta: [
    { title: 'Withdraw — WebullXAU Trading' },
    { name: 'description', content: 'Penarikan dana akun WebullXAU Trading.' },
    { property: 'og:title', content: 'Withdraw — WebullXAU Trading' },
    { property: 'og:description', content: 'Halaman penarikan dana akun WebullXAU Trading.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: WithdrawScreen,
});