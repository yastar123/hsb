import { createFileRoute } from '@tanstack/react-router';
import { SmartTraderDetailScreen, smartTraderTools } from '@/components/insight-pages';

export const Route = createFileRoute('/smart-trader/$toolId')({
  head: ({ params }) => {
    const tool = smartTraderTools.find((item) => item.id === params.toolId);
    const title = tool ? `${tool.title} — Smart Trader` : 'Smart Trader — HSB Trading';
    const description = tool?.summary ?? 'Informasi alat bantu Smart Trader.';
    return { meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'article' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ] };
  },
  component: SmartTraderToolRoute,
});

function SmartTraderToolRoute() {
  const { toolId } = Route.useParams();
  return <SmartTraderDetailScreen toolId={toolId} />;
}
