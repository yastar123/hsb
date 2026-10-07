import { createFileRoute } from '@tanstack/react-router';
import { AdminDepositEditor } from '@/components/admin-deposit-editor';

export const Route = createFileRoute('/admin/deposit')({
  head: () => ({ meta: [
    { title: 'Kelola Deposit — Admin HSB' },
    { name: 'description', content: 'Kelola isi halaman Deposit HSB dengan live preview.' },
    { property: 'og:title', content: 'Kelola Deposit — Admin HSB' },
    { property: 'og:description', content: 'Editor halaman Deposit HSB dengan pratinjau langsung.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: AdminDepositEditor,
});
