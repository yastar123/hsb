import { createFileRoute } from '@tanstack/react-router';
import { WithdrawScreen } from '@/components/withdraw-screen';

export const Route = createFileRoute('/withdraw')({
  head: () => ({ meta: [
    { title: 'Withdraw — HSB Trading' },
    { name: 'description', content: 'Pratinjau penarikan dana HSB Trading; belum terhubung ke layanan akun.' },
    { property: 'og:title', content: 'Withdraw — HSB Trading' },
    { property: 'og:description', content: 'Halaman penarikan dana HSB dalam mode pratinjau tanpa pemindahan dana.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: WithdrawScreen,
});