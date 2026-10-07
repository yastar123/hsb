import { createFileRoute } from '@tanstack/react-router';
import { SmartTraderScreen } from '@/components/insight-pages';

export const Route = createFileRoute('/smart-trader/')({
  component: SmartTraderScreen,
});
