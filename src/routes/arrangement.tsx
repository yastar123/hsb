import { createFileRoute } from '@tanstack/react-router';
import { ArrangementScreen } from '@/components/market-screens';
import { marketMeta } from '@/lib/market-data';
export const Route=createFileRoute('/arrangement')({head:()=>marketMeta('Arrangement','Atur urutan kelompok produk pada halaman pasar HSB Trading.'),component:ArrangementScreen});