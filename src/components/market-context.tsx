import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { MarketGroup, Product } from '@/lib/market-data';

type MarketState = {
  favorites: string[]; toggleFavorite: (symbol: string) => void;
  groups: MarketGroup[]; moveGroup: (from: number, to: number) => void; setGroups: (g: MarketGroup[] | ((p: MarketGroup[]) => MarketGroup[])) => void;
  products: Product[]; setProducts: (p: Product[] | ((p: Product[]) => Product[])) => void;
  loading: boolean; error: string; refresh: () => Promise<void>; saveCatalog: () => Promise<void>;
};
const MarketContext = createContext<MarketState | null>(null);

async function requestCatalog<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof payload?.error === 'string' ? payload.error : `Permintaan gagal (${response.status}).`);
  }
  return payload as T;
}

type MarketCatalog = { groups: MarketGroup[]; products: Product[]; quoteMode?: string };

export function MarketProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [groups, setGroups] = useState<MarketGroup[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    void requestCatalog<MarketCatalog>('/api/market')
      .then((catalog) => {
        if (!active) return;
        setGroups(catalog.groups);
        setProducts(catalog.products);
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Katalog pasar tidak dapat dimuat.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const toggleFavorite = (symbol: string) => setFavorites(prev => prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]);
  const moveGroup = (from: number, to: number) => setGroups(prev => { if (to < 0 || to >= prev.length) return prev; const next = [...prev]; const [item] = next.splice(from, 1); if (item) next.splice(to, 0, item); return next; });

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const catalog = await requestCatalog<MarketCatalog>('/api/market');
      setGroups(catalog.groups);
      setProducts(catalog.products);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Katalog pasar tidak dapat dimuat.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const saveCatalog = async () => {
    await requestCatalog<{ ok: true }>('/api/admin/market', {
      method: 'PUT',
      body: JSON.stringify({ groups, products }),
    });
  };

  return <MarketContext.Provider value={{
    favorites, toggleFavorite, groups, moveGroup, setGroups, products, setProducts,
    loading, error, refresh, saveCatalog,
  }}>{children}</MarketContext.Provider>;
}
export function useMarket() { const context = useContext(MarketContext); if (!context) throw new Error('Market provider missing'); return context; }
