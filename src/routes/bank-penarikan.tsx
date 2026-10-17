import { createFileRoute } from '@tanstack/react-router';
import { WithdrawalBankScreen } from '@/components/profile-pages';
export const Route = createFileRoute('/bank-penarikan')({
  head: () => ({ meta: [
    { title: 'Bank Penarikan — WebullXAU Trading' },
    { name: 'description', content: 'Kelola rekening bank untuk penarikan dana dari akun WebullXAU.' },
    { property: 'og:title', content: 'Bank Penarikan — WebullXAU Trading' },
    { property: 'og:description', content: 'Kelola rekening bank untuk penarikan dana dari akun WebullXAU.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: WithdrawalBankScreen,
});
