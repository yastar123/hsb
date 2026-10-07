import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

export type DepositMethod = { id: string; label: string; badge: string; bank: string };
export type DepositContent = {
  title: string; methodPlaceholder: string; currency: string; rateLabel: string; rate: number; minimum: number;
  minimumText: string; button: string; securityText: string; securityBrand: string; notice: string; sheetTitle: string;
  methods: DepositMethod[];
};
const banks = ['BCA', 'BNI', 'Mandiri', 'BRI', 'BSI', 'CIMB', 'Permata'];
export const defaultDepositContent: DepositContent = {
  title: 'Deposit', methodPlaceholder: 'Pilih Metode Pembayaran', currency: 'USD', rateLabel: 'USD / IDR', rate: 16250, minimum: 200,
  minimumText: 'Minimal deposit $200', button: 'Deposit Sekarang', securityText: 'Transaksi Aman oleh', securityBrand: 'HSB Security',
  notice: 'Permintaan deposit menunggu pencocokan mutasi rekening oleh admin.', sheetTitle: 'Pilih Metode Pembayaran',
  methods: banks.map((b) => ({ id: b, label: `Transfer Bank ${b}`, badge: b, bank: b })),
};
const KEY = 'hsb-deposit-content-v2';
type Ctx = {
  content: DepositContent;
  saveError: string;
  setContent: (c: DepositContent | ((p: DepositContent) => DepositContent)) => void;
  reset: () => void;
};
const DepositContext = createContext<Ctx | null>(null);
export function DepositContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<DepositContent>(defaultDepositContent);
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveError, setSaveError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    let active = true;
    fetch('/api/site/deposit-settings', { credentials: 'same-origin' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result?.error || 'Pengaturan deposit gagal dimuat.');
        if (active && result.depositContent) {
          const saved = result.depositContent as Partial<DepositContent>;
          const methods = Array.isArray(saved.methods)
            ? saved.methods.map((method) => ({
                ...method,
                bank: typeof method.bank === 'string' ? method.bank : method.badge,
              }))
            : defaultDepositContent.methods;
          setContent({ ...defaultDepositContent, ...saved, methods });
        }
      })
      .catch((error) => { if (active) setSaveError(error instanceof Error ? error.message : 'Pengaturan deposit gagal dimuat.'); })
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!loaded || !dirty) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fetch('/api/admin/site-settings', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depositContent: content }),
      })
        .then(async (response) => {
          const result = await response.json();
          if (!response.ok) throw new Error(result?.error || 'Pengaturan deposit gagal disimpan.');
          setSaveError('');
          setDirty(false);
        })
        .catch((error) => setSaveError(error instanceof Error ? error.message : 'Pengaturan deposit gagal disimpan.'));
    }, 450);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [content, dirty, loaded]);
  const updateContent = (next: DepositContent | ((previous: DepositContent) => DepositContent)) => {
    setContent(next);
    setDirty(true);
  };
  return <DepositContext.Provider value={{
    content,
    saveError,
    setContent: updateContent,
    reset: () => updateContent(defaultDepositContent),
  }}>{children}</DepositContext.Provider>;
}
export function useDepositContent() { const c = useContext(DepositContext); if (!c) throw new Error('DepositContentProvider missing'); return c; }
