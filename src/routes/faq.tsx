import { createFileRoute } from '@tanstack/react-router';
import { FaqScreen } from '@/components/insight-pages';
export const Route = createFileRoute('/faq')({
  head: () => ({ meta: [
    { title: 'FAQ — HSB Trading' },
    { name: 'description', content: 'Pertanyaan yang sering diajukan seputar akun, deposit, penarikan, dan trading di HSB.' },
    { property: 'og:title', content: 'FAQ — HSB Trading' },
    { property: 'og:description', content: 'Pertanyaan yang sering diajukan seputar akun, deposit, penarikan, dan trading di HSB.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: FaqScreen,
});
