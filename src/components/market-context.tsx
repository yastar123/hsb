import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { products as defaultProducts, type MarketGroup, type Product } from '@/lib/market-data';

const defaultGroups: MarketGroup[] = ['Metal', 'Forex', 'Energy', 'Index'];
const KEY = 'hsb-market-content-v1';
type MarketState = {
  favorites: string[]; toggleFavorite: (symbol: string) => void;
  groups: MarketGroup[]; moveGroup: (from: number, to: number) => void; setGroups: (g: MarketGroup[] | ((p: MarketGroup[]) => MarketGroup[])) => void;
  products: Product[]; setProducts: (p: Product[] | ((p: Product[]) => Product[])) => void;
  reset: () => void;
};
const MarketContext = createContext<MarketState | null>(null);
export function MarketProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [groups, setGroups] = useState<MarketGroup[]>(defaultGroups);
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) { const d = JSON.parse(raw); if (Array.isArray(d.groups)) setGroups(d.groups); if (Array.isArray(d.products)) setProducts(d.products); } } catch { /* ignore */ }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(KEY, JSON.stringify({ groups, products })); }, [groups, products, loaded]);
  const toggleFavorite = (symbol: string) => setFavorites(prev => prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]);
  const moveGroup = (from: number, to: number) => setGroups(prev => { if (to < 0 || to >= prev.length) return prev; const next = [...prev]; const [item] = next.splice(from, 1); if (item) next.splice(to, 0, item); return next; });
  const reset = () => { setGroups(defaultGroups); setProducts(defaultProducts); };
  return <MarketContext.Provider value={{ favorites, toggleFavorite, groups, moveGroup, setGroups, products, setProducts, reset }}>{children}</MarketContext.Provider>;
}
export function useMarket() { const context = useContext(MarketContext); if (!context) throw new Error('Market provider missing'); return context; }
