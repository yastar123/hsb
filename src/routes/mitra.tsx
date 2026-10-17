import { createFileRoute } from '@tanstack/react-router';
import { PartnerScreen } from '@/components/partner-pages';
export const Route = createFileRoute('/mitra')({
  head: () => ({ meta: [
    { title: 'Referral — Ajak Teman, Dapat Hadiah | WebullXAU' },
    { name: 'description', content: 'Ajak teman ke WebullXAU Trading dan dapatkan hadiah untuk setiap teman yang mendaftar dan deposit.' },
    { property: 'og:title', content: 'Referral — Ajak Teman, Dapat Hadiah | WebullXAU' },
    { property: 'og:description', content: 'Ajak teman ke WebullXAU Trading dan dapatkan hadiah untuk setiap teman yang mendaftar dan deposit.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: PartnerScreen,
});
