import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type DepositMethod = { id: string; label: string; badge: string };
export type DepositContent = {
  title: string; methodPlaceholder: string; currency: string; rateLabel: string; rate: number; minimum: number;
  minimumText: string; button: string; securityText: string; securityBrand: string; notice: string; sheetTitle: string;
  methods: DepositMethod[];
};
const banks = ['BCA', 'BNI', 'Mandiri', 'BRI', 'BSI', 'CIMB', 'Permata'];
export const defaultDepositContent: DepositContent = {
  title: 'Deposit payment', methodPlaceholder: 'Pilih Metode Pembayaran', currency: 'USD', rateLabel: 'USD / IDR', rate: 16250, minimum: 200,
  minimumText: 'Minimal deposit $200', button: 'Deposit Sekarang', securityText: 'Transaksi Aman oleh', securityBrand: 'HSB Security',
  notice: 'Pembayaran belum terhubung. Ini adalah tampilan pratinjau.', sheetTitle: 'Pilih Metode Pembayaran',
  methods: banks.map((b) => ({ id: b, label: `Transfer Bank ${b}`, badge: b })),
};
const KEY = 'hsb-deposit-content-v2';
type Ctx = { content: DepositContent; setContent: (c: DepositContent | ((p: DepositContent) => DepositContent)) => void; reset: () => void };
const DepositContext = createContext<Ctx | null>(null);
export function DepositContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<DepositContent>(defaultDepositContent);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { try { const raw = localStorage.getItem(KEY); if (raw) setContent({ ...defaultDepositContent, ...JSON.parse(raw) }); } catch { /* ignore */ } setLoaded(true); }, []);
  useEffect(() => { if (loaded) localStorage.setItem(KEY, JSON.stringify(content)); }, [content, loaded]);
  return <DepositContext.Provider value={{ content, setContent, reset: () => setContent(defaultDepositContent) }}>{children}</DepositContext.Provider>;
}
export function useDepositContent() { const c = useContext(DepositContext); if (!c) throw new Error('DepositContentProvider missing'); return c; }
