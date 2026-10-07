import { createFileRoute } from '@tanstack/react-router';
import { FundProtectionScreen } from '@/components/fund-protection-screen';
export const Route = createFileRoute('/proteksi-dana')({
  head: () => ({ meta: [
    { title: 'Proteksi Dana — HSB Trading' },
    { name: 'description', content: 'Bagaimana dana Anda dilindungi: akun terpisah, proteksi saldo negatif, verifikasi penarikan, dan pengawasan regulator.' },
    { property: 'og:title', content: 'Proteksi Dana — HSB Trading' },
    { property: 'og:description', content: 'Bagaimana dana Anda dilindungi: akun terpisah, proteksi saldo negatif, verifikasi penarikan, dan pengawasan regulator.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: FundProtectionScreen,
});
