import { createFileRoute } from '@tanstack/react-router';
import { SearchScreen } from '@/components/market-screens';
import { marketMeta } from '@/lib/market-data';
export const Route=createFileRoute('/cari-produk')({head:()=>marketMeta('Cari Produk','Cari produk trading berdasarkan simbol atau nama produk di HSB Trading.'),component:SearchScreen});