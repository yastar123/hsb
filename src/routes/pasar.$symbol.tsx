import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { MarketDetailScreen } from '@/components/market-screens';
import { marketMeta } from '@/lib/market-data';
import { useMarket } from '@/components/market-context';
export const Route=createFileRoute('/pasar/$symbol')({head:({params})=>marketMeta(`${params.symbol} — Detail Pasar`,`Grafik simulasi, harga, dan spesifikasi ${params.symbol} di HSB Trading.`),component:Detail});
function Detail() {
  const { symbol } = Route.useParams();
  const { products, loading, error, refresh } = useMarket();
  const product = products.find((item) => item.symbol === symbol);

  if (loading) return <main className="market-page"><div className="market-shell"><p className="market-empty" role="status">Memuat katalog pasar...</p></div></main>;
  if (error) return <main className="market-page"><div className="market-shell">
    <p className="market-empty" role="alert">{error}</p>
    <Button variant="outline" className="mx-auto mt-3 block" onClick={() => void refresh().catch(() => {})}>Coba lagi</Button>
  </div></main>;
  if (!product) return <main className="market-page"><div className="market-shell">
    <p className="market-empty">Produk tidak ditemukan</p>
    <Link to="/pasar" className="block text-center underline">Kembali ke Pasar</Link>
  </div></main>;
  return <MarketDetailScreen key={symbol} product={product} />;
}
