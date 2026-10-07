import { createFileRoute } from '@tanstack/react-router';
import { WithdrawalBankScreen } from '@/components/profile-pages';
export const Route = createFileRoute('/bank-penarikan')({
  head: () => ({ meta: [
    { title: 'Bank Penarikan — HSB Trading' },
    { name: 'description', content: 'Kelola rekening bank untuk penarikan dana dari akun HSB.' },
    { property: 'og:title', content: 'Bank Penarikan — HSB Trading' },
    { property: 'og:description', content: 'Kelola rekening bank untuk penarikan dana dari akun HSB.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: WithdrawalBankScreen,
});
