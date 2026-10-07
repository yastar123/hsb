import { createFileRoute } from '@tanstack/react-router';
import { ProfileScreen } from '@/components/profile-pages';
export const Route = createFileRoute('/profil')({
  head: () => ({ meta: [
    { title: 'Profil — HSB Trading' },
    { name: 'description', content: 'Profil akun HSB: bonus selamat datang, pintasan, pusat klien, dan pengaturan.' },
    { property: 'og:title', content: 'Profil — HSB Trading' },
    { property: 'og:description', content: 'Profil akun HSB: bonus selamat datang, pintasan, pusat klien, dan pengaturan.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: ProfileScreen,
});
