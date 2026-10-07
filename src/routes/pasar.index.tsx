import { createFileRoute } from '@tanstack/react-router';
import { MarketScreen } from '@/components/market-screens';
import { marketMeta } from '@/lib/market-data';
export const Route=createFileRoute('/pasar/')({head:()=>marketMeta('Pasar','Daftar produk forex, metal, energy, dan index dengan harga simulasi HSB Trading.'),component:MarketScreen});