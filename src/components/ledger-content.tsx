import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type UserStatus = 'Aktif' | 'Belum Verifikasi' | 'Diblokir';
export type AppUser = { id: string; name: string; email: string; phone: string; joined: string; balance: number; deposit?: number; profit?: number; rate?: number | null; lastCompound?: string; status: UserStatus };
export type CompoundSettings = { globalRate: number; enabled: boolean };
export type DepositStatus = 'Menunggu' | 'Disetujui' | 'Ditolak';
export type DepositReq = { id: string; name: string; email: string; bankName?: string; accountNumber?: string; method: string; amount: number; proof: string; date: string; status: DepositStatus; note?: string | undefined };
type Data = { users: AppUser[]; deposits: DepositReq[]; compound: CompoundSettings };

export const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().slice(0, 10);
export const seedUsers: AppUser[] = [
  { id: 'u1', name: 'Budi Santoso', email: 'budi@contoh.com', phone: '081234567890', joined: '2026-08-12', balance: 1500, status: 'Aktif' },
  { id: 'u2', name: 'Siti Rahma', email: 'siti@contoh.com', phone: '081298765432', joined: '2026-09-03', balance: 320, status: 'Belum Verifikasi' },
  { id: 'u3', name: 'Andi Wijaya', email: 'andi@contoh.com', phone: '085611223344', joined: '2026-09-21', balance: 0, status: 'Diblokir' },
];
const seed: Data = { users: seedUsers, deposits: [], compound: { globalRate: 1, enabled: true } };
export const depOf = (u: AppUser) => u.deposit ?? u.balance;
export const profitOf = (u: AppUser) => u.profit ?? 0;
export const mainOf = (u: AppUser) => depOf(u) + profitOf(u);
export const rateOf = (u: AppUser, c: CompoundSettings) => (u.rate ?? null) === null ? c.globalRate : (u.rate as number);
const dayDiff = (a: string, b: string) => Math.max(0, Math.floor((Date.parse(b) - Date.parse(a)) / 86400000));
/** Applies daily compounding (on saldo utama) for every full day elapsed since the user's last run. */
function compoundAll(d: Data, force = false): Data {
  if (!d.compound.enabled && !force) return d;
  const t = today();
  let changed = false;
  const users = d.users.map((u) => {
    const last = u.lastCompound ?? t;
    const days = force ? 1 : dayDiff(last, t);
    if (!u.lastCompound) { changed = true; return { ...u, deposit: depOf(u), profit: profitOf(u), lastCompound: t }; }
    if (!days || u.status === 'Diblokir') return u;
    changed = true;
    const main = mainOf(u);
    const gain = main * (Math.pow(1 + rateOf(u, d.compound) / 100, days) - 1);
    const profit = Math.round((profitOf(u) + gain) * 100) / 100;
    return { ...u, deposit: depOf(u), profit, balance: depOf(u) + profit, lastCompound: t };
  });
  return changed ? { ...d, users } : d;
}
const KEY = 'hsb-ledger-v1';

type Ctx = Data & {
  setUsers: (f: (u: AppUser[]) => AppUser[]) => void;
  submitDeposit: (d: Omit<DepositReq, 'id' | 'date' | 'status'>) => void;
  review: (id: string, approve: boolean, note?: string) => void;
  removeDeposit: (id: string) => void;
  resetUsers: () => void;
  setCompound: (c: Partial<CompoundSettings>) => void;
  runCompound: () => void;
  currentEmail: string;
  setCurrentEmail: (e: string) => void;
};
const C = createContext<Ctx | null>(null);

export function LedgerProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(seed);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const r = localStorage.getItem(KEY);
      if (r) setData(compoundAll({ ...seed, ...JSON.parse(r) }));
      else { const old = localStorage.getItem('hsb-admin-users-v1'); if (old) setData({ ...seed, users: JSON.parse(old) }); }
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);
  useEffect(() => { if (!loaded) return; try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage full */ } }, [data, loaded]);

  const [currentEmail, setCur] = useState('');
  useEffect(() => { setCur(localStorage.getItem('hsb-current-email') || ''); }, []);
  const setCurrentEmail = (e: string) => { setCur(e); try { if (e) localStorage.setItem('hsb-current-email', e); else localStorage.removeItem('hsb-current-email'); } catch { /* ignore */ } };
  useEffect(() => { const t = setInterval(() => setData((p) => compoundAll(p)), 60000); return () => clearInterval(t); }, []);
  const review = (id: string, approve: boolean, note?: string) => setData((p) => {
    const d = p.deposits.find((x) => x.id === id);
    if (!d || d.status !== 'Menunggu') return p;
    const deposits = p.deposits.map((x) => x.id === id ? { ...x, status: (approve ? 'Disetujui' : 'Ditolak') as DepositStatus, note } : x);
    if (!approve) return { ...p, deposits };
    const key = (d.email || d.name).trim().toLowerCase();
    const exists = p.users.some((u) => (u.email || u.name).trim().toLowerCase() === key);
    const users = exists
      ? p.users.map((u) => (u.email || u.name).trim().toLowerCase() === key ? { ...u, deposit: depOf(u) + d.amount, balance: mainOf(u) + d.amount } : u)
      : [{ id: uid(), name: d.name, email: d.email, phone: '', joined: today(), balance: d.amount, deposit: d.amount, profit: 0, lastCompound: today(), status: 'Aktif' as UserStatus }, ...p.users];
    return { ...p, users, deposits };
  });

  return <C.Provider value={{
    ...data,
    setUsers: (f) => setData((p) => ({ ...p, users: f(p.users) })),
    currentEmail, setCurrentEmail,
    setCompound: (c) => setData((p) => ({ ...p, compound: { ...p.compound, ...c } })),
    runCompound: () => setData((p) => compoundAll(p, true)),
    submitDeposit: (d) => { setCurrentEmail(d.email); setData((p) => ({ ...p, deposits: [{ ...d, id: uid(), date: new Date().toISOString(), status: 'Menunggu' }, ...p.deposits] })); },
    review,
    removeDeposit: (id) => setData((p) => ({ ...p, deposits: p.deposits.filter((x) => x.id !== id) })),
    resetUsers: () => setData((p) => ({ ...p, users: seedUsers })),
  }}>{children}</C.Provider>;
}
export function useLedger() { const c = useContext(C); if (!c) throw new Error('LedgerProvider missing'); return c; }

/** Shrinks an uploaded image to a small JPEG data URL so it fits in browser storage. */
export function compressImage(file: File, max = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Gambar tidak valid')); };
    img.src = url;
  });
}
