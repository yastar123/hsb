import { createFileRoute } from '@tanstack/react-router';
import { AdminDepositEditor } from '@/components/admin-deposit-editor';

export const Route = createFileRoute('/admin/deposit')({
  head: () => ({ meta: [
    { title: 'Kelola Deposit — Admin WebullXAU' },
    { name: 'description', content: 'Kelola isi halaman Deposit WebullXAU dengan live preview.' },
    { property: 'og:title', content: 'Kelola Deposit — Admin WebullXAU' },
    { property: 'og:description', content: 'Editor halaman Deposit WebullXAU dengan pratinjau langsung.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: AdminDepositEditor,
});
