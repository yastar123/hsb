import { createFileRoute } from '@tanstack/react-router';
import { PaymentHistoryScreen } from '@/components/account-pages';
export const Route = createFileRoute('/riwayat-pembayaran')({
  head: () => ({ meta: [
    { title: 'Riwayat Pembayaran — HSB Trading' },
    { name: 'description', content: 'Lihat riwayat setoran dan penarikan akun HSB Trading.' },
    { property: 'og:title', content: 'Riwayat Pembayaran — HSB Trading' },
    { property: 'og:description', content: 'Lihat riwayat setoran dan penarikan akun HSB Trading.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: PaymentHistoryScreen,
});
