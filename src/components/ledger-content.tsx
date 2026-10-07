import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type UserStatus = 'Aktif' | 'Belum Verifikasi' | 'Diblokir';
export type AppUser = { id: string; name: string; email: string; phone: string; joined: string; balance: number; deposit?: number; profit?: number; dailyProfit?: number; dailyProfitDate?: string; creditedReferralIds?: string[]; rate?: number | null; lastCompound?: string; status: UserStatus };
export type CompoundSettings = { globalRate: number; enabled: boolean };
export type DepositStatus = 'Menunggu' | 'Disetujui' | 'Ditolak';
export type DepositReq = { id: string; name: string; email: string; bankName?: string; accountNumber?: string; method: string; amount: number; proof: string; date: string; status: DepositStatus; note?: string | undefined };
export type WithdrawalStatus = 'Menunggu' | 'Diproses' | 'Berhasil' | 'Ditolak';
export type WithdrawalReq = { id: string; userId?: string; name: string; email: string; bank: string; account: string; amount: number; date: string; status: WithdrawalStatus };
export type LedgerData = { users: AppUser[]; deposits: DepositReq[]; withdrawals: WithdrawalReq[]; compound: CompoundSettings };

export const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const money = (value: number) => Math.round(value * 100) / 100;
export const seedUsers: AppUser[] = [
  { id: 'u1', name: 'Budi Santoso', email: 'budi@contoh.com', phone: '081234567890', joined: '2026-08-12', balance: 0, deposit: 1500, profit: 0, dailyProfit: 0, status: 'Aktif' },
  { id: 'u2', name: 'Siti Rahma', email: 'siti@contoh.com', phone: '081298765432', joined: '2026-09-03', balance: 0, deposit: 320, profit: 0, dailyProfit: 0, status: 'Belum Verifikasi' },
  { id: 'u3', name: 'Andi Wijaya', email: 'andi@contoh.com', phone: '085611223344', joined: '2026-09-21', balance: 0, deposit: 0, profit: 0, dailyProfit: 0, status: 'Diblokir' },
];
const seed: LedgerData = { users: seedUsers, deposits: [], withdrawals: [], compound: { globalRate: 1, enabled: true } };
export const depOf = (u: AppUser) => u.deposit ?? u.balance;
export const profitOf = (u: AppUser) => u.profit ?? 0;
export const dailyProfitOf = (u: AppUser) => u.dailyProfitDate === today() ? (u.dailyProfit ?? 0) : 0;
export const mainOf = (u: AppUser) => u.balance;
export const rateOf = (u: AppUser, c: CompoundSettings) => (u.rate ?? null) === null ? c.globalRate : (u.rate as number);
const dayDiff = (a: string, b: string) => Math.max(0, Math.floor((Date.parse(b) - Date.parse(a)) / 86400000));
/** Applies daily compounding (on saldo utama) for every full day elapsed since the user's last run. */
export function compoundAll(d: LedgerData, force = false, date = today()): LedgerData {
  const t = date;
  if (!d.compound.enabled && !force) {
    const users = d.users.map((u) => u.lastCompound === t && u.dailyProfitDate === t
      ? u
      : { ...u, lastCompound: t, dailyProfit: 0, dailyProfitDate: t });
    return users.every((u, i) => u === d.users[i]) ? d : { ...d, users };
  }
  let changed = false;
  const users = d.users.map((u) => {
    const last = u.lastCompound ?? t;
    const days = force ? 1 : dayDiff(last, t);
    if (!u.lastCompound) { changed = true; return { ...u, deposit: depOf(u), profit: profitOf(u), dailyProfit: 0, dailyProfitDate: t, lastCompound: t }; }
    if (!days) {
      if (u.dailyProfitDate === t) return u;
      changed = true;
      return { ...u, dailyProfit: 0, dailyProfitDate: t };
    }
    changed = true;
    if (u.status === 'Diblokir' || mainOf(u) <= 0) return { ...u, dailyProfit: 0, dailyProfitDate: t, lastCompound: t };
    const main = mainOf(u);
    const rate = Math.max(0, rateOf(u, d.compound)) / 100;
    let balance = main;
    let gain = 0;
    let dailyGain = 0;
    for (let day = 0; day < days; day++) {
      dailyGain = money(balance * rate);
      balance = money(balance + dailyGain);
      gain = money(gain + dailyGain);
    }
    const todayCarry = force && u.dailyProfitDate === t ? (u.dailyProfit ?? 0) : 0;
    return { ...u, deposit: depOf(u), profit: money(profitOf(u) + gain), dailyProfit: money(todayCarry + dailyGain), dailyProfitDate: t, balance, lastCompound: t };
  });
  return changed ? { ...d, users } : d;
}
const KEY = 'hsb-ledger-v2';
const LEGACY_LEDGER_KEY = 'hsb-ledger-v1';
const LEGACY_WITHDRAWAL_KEY = 'hsb-admin-withdraw-v1';

export function migrateUsers(value: unknown) {
  if (!Array.isArray(value)) return seedUsers;
  const t = today();
  return (value as AppUser[]).map((user) => {
    const oldDeposit = Math.max(0, Number(user.deposit ?? user.balance) || 0);
    const oldMainTotal = Math.max(0, Number(user.balance) || 0);
    const oldMain = user.deposit === undefined ? 0 : Math.max(0, oldMainTotal - oldDeposit);
    return {
      ...user,
      balance: money(oldMain),
      deposit: money(oldDeposit),
      profit: money(Math.max(0, Number(user.profit) || 0)),
      dailyProfit: 0,
      dailyProfitDate: t,
      creditedReferralIds: user.creditedReferralIds ?? [],
      lastCompound: t,
    };
  });
}

function migrateWithdrawals(value: unknown): WithdrawalReq[] {
  if (!Array.isArray(value)) return [];
  const allowed: WithdrawalStatus[] = ['Menunggu', 'Diproses', 'Berhasil', 'Ditolak'];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Partial<WithdrawalReq>;
    if (typeof row.id !== 'string' || typeof row.amount !== 'number') return [];
    return [{
      id: row.id,
      ...(typeof row.userId === 'string' ? { userId: row.userId } : {}),
      name: row.name ?? '',
      email: row.email ?? '',
      bank: row.bank ?? '',
      account: row.account ?? '',
      amount: row.amount,
      date: row.date ?? today(),
      status: allowed.includes(row.status as WithdrawalStatus) ? row.status as WithdrawalStatus : 'Menunggu',
    }];
  });
}

type Ctx = LedgerData & {
  setUsers: (f: (u: AppUser[]) => AppUser[]) => void;
  submitDeposit: (d: Omit<DepositReq, 'id' | 'date' | 'status'>) => void;
  review: (id: string, approve: boolean, note?: string) => void;
  removeDeposit: (id: string) => void;
  resetUsers: () => void;
  setCompound: (c: Partial<CompoundSettings>) => void;
  runCompound: () => void;
  transferDepositToMain: (userId: string) => number;
  creditReferralDeposit: (userId: string, amount: number, referralId: string) => boolean;
  requestWithdrawal: (userId: string, details: { bank: string; account: string; amount: number }) => string | null;
  reviewWithdrawal: (id: string, status: WithdrawalStatus) => void;
  updateWithdrawal: (id: string, patch: Partial<Pick<WithdrawalReq, 'name' | 'email' | 'bank' | 'account' | 'date'>>) => void;
  deleteWithdrawal: (id: string) => boolean;
  currentEmail: string;
  setCurrentEmail: (e: string) => void;
};
const C = createContext<Ctx | null>(null);

export function LedgerProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LedgerData>(seed);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const r = localStorage.getItem(KEY);
      if (r) {
        const saved = JSON.parse(r) as Partial<LedgerData>;
        setData(compoundAll({ ...seed, ...saved, users: Array.isArray(saved.users) ? saved.users : seed.users, withdrawals: Array.isArray(saved.withdrawals) ? saved.withdrawals : [] }));
      } else {
        const oldLedger = localStorage.getItem(LEGACY_LEDGER_KEY);
        const oldData = oldLedger ? JSON.parse(oldLedger) as Partial<LedgerData> : null;
        const oldAdminUsers = !oldData ? localStorage.getItem('hsb-admin-users-v1') : null;
        const oldWithdrawals = localStorage.getItem(LEGACY_WITHDRAWAL_KEY);
        setData({
          ...seed,
          ...(oldData ?? {}),
          users: migrateUsers(oldData?.users ?? (oldAdminUsers ? JSON.parse(oldAdminUsers) : seedUsers)),
          deposits: Array.isArray(oldData?.deposits) ? oldData.deposits : [],
          withdrawals: migrateWithdrawals(oldData?.withdrawals ?? (oldWithdrawals ? JSON.parse(oldWithdrawals) : [])),
        });
      }
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
      ? p.users.map((u) => (u.email || u.name).trim().toLowerCase() === key ? { ...u, deposit: money(depOf(u) + d.amount) } : u)
      : [{ id: uid(), name: d.name, email: d.email, phone: '', joined: today(), balance: 0, deposit: d.amount, profit: 0, dailyProfit: 0, dailyProfitDate: today(), lastCompound: today(), status: 'Aktif' as UserStatus }, ...p.users];
    return { ...p, users, deposits };
  });

  const transferDepositToMain = (userId: string) => {
    const user = data.users.find((item) => item.id === userId);
    const amount = user ? depOf(user) : 0;
    if (!user || user.status !== 'Aktif' || !data.compound.enabled || amount <= 0) return 0;
    setData((p) => {
      const current = p.users.find((item) => item.id === userId);
      if (!current || current.status !== 'Aktif' || !p.compound.enabled || depOf(current) <= 0) return p;
      const moved = depOf(current);
      return { ...p, users: p.users.map((item) => item.id === userId ? { ...item, balance: money(mainOf(item) + moved), deposit: 0, dailyProfit: dailyProfitOf(item), dailyProfitDate: today(), lastCompound: today() } : item) };
    });
    return amount;
  };

  const creditReferralDeposit = (userId: string, amount: number, referralId: string) => {
    const user = data.users.find((item) => item.id === userId);
    if (!user || amount <= 0 || !Number.isFinite(amount)) return false;
    if (user.creditedReferralIds?.includes(referralId)) return true;
    setData((p) => ({
      ...p,
      users: p.users.map((item) => {
        if (item.id !== userId || item.creditedReferralIds?.includes(referralId)) return item;
        return { ...item, deposit: money(depOf(item) + amount), creditedReferralIds: [...(item.creditedReferralIds ?? []), referralId] };
      }),
    }));
    return true;
  };

  const requestWithdrawal = (userId: string, details: { bank: string; account: string; amount: number }) => {
    const user = data.users.find((item) => item.id === userId);
    const amount = money(details.amount);
    if (!user || user.status !== 'Aktif' || !Number.isFinite(amount) || amount <= 0 || amount > mainOf(user)) return null;
    const id = uid();
    const request: WithdrawalReq = { id, userId, name: user.name, email: user.email, bank: details.bank, account: details.account, amount, date: today(), status: 'Menunggu' };
    setData((p) => {
      const current = p.users.find((item) => item.id === userId);
      if (!current || current.status !== 'Aktif' || amount > mainOf(current)) return p;
      return {
        ...p,
        users: p.users.map((item) => item.id === userId ? { ...item, balance: money(mainOf(item) - amount) } : item),
        withdrawals: [request, ...p.withdrawals],
      };
    });
    return id;
  };

  const reviewWithdrawal = (id: string, status: WithdrawalStatus) => setData((p) => {
    const request = p.withdrawals.find((item) => item.id === id);
    if (!request || request.status === status) return p;
    if (request.userId && (request.status === 'Berhasil' || request.status === 'Ditolak')) return p;
    const users = status === 'Ditolak' && request.userId
      ? p.users.map((user) => user.id === request.userId ? { ...user, balance: money(mainOf(user) + request.amount) } : user)
      : p.users;
    return { ...p, users, withdrawals: p.withdrawals.map((item) => item.id === id ? { ...item, status } : item) };
  });

  const updateWithdrawal = (id: string, patch: Partial<Pick<WithdrawalReq, 'name' | 'email' | 'bank' | 'account' | 'date'>>) => setData((p) => ({
    ...p,
    withdrawals: p.withdrawals.map((item) => item.id === id ? { ...item, ...patch } : item),
  }));

  const deleteWithdrawal = (id: string) => {
    const request = data.withdrawals.find((item) => item.id === id);
    if (!request || (request.userId && request.status === 'Berhasil')) return false;
    setData((p) => {
      const current = p.withdrawals.find((item) => item.id === id);
      if (!current || (current.userId && current.status === 'Berhasil')) return p;
      const users = current.userId && current.status !== 'Ditolak'
        ? p.users.map((user) => user.id === current.userId ? { ...user, balance: money(mainOf(user) + current.amount) } : user)
        : p.users;
      return { ...p, users, withdrawals: p.withdrawals.filter((item) => item.id !== id) };
    });
    return true;
  };

  return <C.Provider value={{
    ...data,
    setUsers: (f) => setData((p) => ({ ...p, users: f(p.users) })),
    currentEmail, setCurrentEmail,
    setCompound: (c) => setData((p) => ({ ...p, compound: { ...p.compound, ...c } })),
    runCompound: () => setData((p) => compoundAll(p, true)),
    transferDepositToMain,
    creditReferralDeposit,
    requestWithdrawal,
    reviewWithdrawal,
    updateWithdrawal,
    deleteWithdrawal,
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
