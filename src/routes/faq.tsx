import { createFileRoute } from '@tanstack/react-router';
import { FaqScreen } from '@/components/insight-pages';
export const Route = createFileRoute('/faq')({
  head: () => ({ meta: [
    { title: 'FAQ — WebullXAU Trading' },
    { name: 'description', content: 'Pertanyaan yang sering diajukan seputar akun, deposit, penarikan, dan trading di WebullXAU.' },
    { property: 'og:title', content: 'FAQ — WebullXAU Trading' },
    { property: 'og:description', content: 'Pertanyaan yang sering diajukan seputar akun, deposit, penarikan, dan trading di WebullXAU.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: FaqScreen,
});
