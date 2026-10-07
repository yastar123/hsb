import { createFileRoute } from '@tanstack/react-router';
import { DepositScreen } from '@/components/account-pages';
export const Route = createFileRoute('/deposit')({
  head: () => ({ meta: [
    { title: 'Deposit — HSB Trading' },
    { name: 'description', content: 'Isi saldo akun trading HSB melalui transfer bank lokal.' },
    { property: 'og:title', content: 'Deposit — HSB Trading' },
    { property: 'og:description', content: 'Isi saldo akun trading HSB melalui transfer bank lokal.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: DepositScreen,
});
