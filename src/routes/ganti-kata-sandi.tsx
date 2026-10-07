import { createFileRoute } from '@tanstack/react-router';
import { ChangePasswordScreen } from '@/components/profile-pages';
export const Route = createFileRoute('/ganti-kata-sandi')({
  head: () => ({ meta: [
    { title: 'Ganti Kata Sandi — HSB Trading' },
    { name: 'description', content: 'Ganti kata sandi akun HSB Trading Anda dengan aman.' },
    { property: 'og:title', content: 'Ganti Kata Sandi — HSB Trading' },
    { property: 'og:description', content: 'Ganti kata sandi akun HSB Trading Anda dengan aman.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: ChangePasswordScreen,
});
