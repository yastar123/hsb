import { createFileRoute, Link } from '@tanstack/react-router';
import { MarketDetailScreen } from '@/components/market-screens';
import { marketMeta } from '@/lib/market-data';
import { useMarket } from '@/components/market-context';
export const Route=createFileRoute('/pasar/$symbol')({head:({params})=>marketMeta(`${params.symbol} — Detail Pasar`,`Grafik simulasi, harga, dan spesifikasi ${params.symbol} di HSB Trading.`),component:Detail});
function Detail(){const {symbol}=Route.useParams();const {products}=useMarket();const product=products.find(p=>p.symbol===symbol);if(!product)return <main className="market-page"><div className="market-shell"><p className="market-empty">Produk tidak ditemukan</p><Link to="/pasar" className="block text-center underline">Kembali ke Pasar</Link></div></main>;return <MarketDetailScreen key={symbol} product={product}/>;}
