import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouterState } from '@tanstack/react-router';

export type UserStatus = 'Aktif' | 'Belum Verifikasi' | 'Diblokir';
export type AppUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  joined: string;
  balance: number;
  deposit: number;
  profit: number;
  dailyProfit: number;
  dailyProfitDate: string;
  rate: number | null;
  effectiveRate?: number;
  lastCompound: string;
  status: UserStatus;
};
export type CompoundSettings = { globalRate: number; enabled: boolean };
export type DepositStatus = 'Menunggu' | 'Disetujui' | 'Ditolak';
export type DepositReq = {
  id: string;
  userId: string;
  name: string;
  email: string;
  bankName: string;
  accountNumber: string;
  transferredAmountIdr: number;
  destinationAccountId: string;
  method: string;
  amount: number;
  proof?: string;
  proofAvailable: boolean;
  date: string;
  status: DepositStatus;
  note?: string;
};
export type WithdrawalStatus = 'Menunggu' | 'Diproses' | 'Berhasil' | 'Ditolak';
export type WithdrawalReq = {
  id: string;
  userId: string;
  name: string;
  email: string;
  bank: string;
  account: string;
  amount: number;
  date: string;
  status: WithdrawalStatus;
  note?: string;
};
export type LedgerData = {
  users: AppUser[];
  deposits: DepositReq[];
  withdrawals: WithdrawalReq[];
  compound: CompoundSettings;
};
export type DepositInput = {
  name: string;
  bankName: string;
  accountNumber: string;
  transferredAmountIdr: number;
  destinationAccountId: string;
  method: string;
  amount: number;
  proof: string;
};
export type SessionUser = Pick<AppUser, 'id' | 'name' | 'email' | 'phone' | 'status'> & { created_at?: string };

const emptyData: LedgerData = {
  users: [],
  deposits: [],
  withdrawals: [],
  compound: { globalRate: 0, enabled: false },
};
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
const money = (value: number) => Math.round(value * 100) / 100;

export const uid = () => crypto.randomUUID();
export const depOf = (user: AppUser) => user.deposit ?? 0;
export const profitOf = (user: AppUser) => user.profit ?? 0;
export const dailyProfitOf = (user: AppUser) => user.dailyProfitDate === today() ? (user.dailyProfit ?? 0) : 0;
export const mainOf = (user: AppUser) => user.balance;
export const rateOf = (user: AppUser, compound: CompoundSettings) => user.rate ?? compound.globalRate;
const dayDiff = (start: string, end: string) => Math.max(0, Math.floor((Date.parse(end) - Date.parse(start)) / 86400000));

/** Kept for deterministic model tests; production accrual is written once by the server. */
export function compoundAll(data: LedgerData, force = false, date = today()): LedgerData {
  if (!data.compound.enabled && !force) {
    return {
      ...data,
      users: data.users.map((user) => ({ ...user, dailyProfit: 0, dailyProfitDate: date })),
    };
  }
  return {
    ...data,
    users: data.users.map((user) => {
      const days = force ? 1 : dayDiff(user.lastCompound || date, date);
      if (!days || user.status !== 'Aktif' || user.balance <= 0) {
        return { ...user, dailyProfit: 0, dailyProfitDate: date, lastCompound: date };
      }
      const rate = Math.min(100, Math.max(0, rateOf(user, data.compound))) / 100;
      let balance = user.balance;
      let total = 0;
      let daily = 0;
      for (let index = 0; index < days; index += 1) {
        daily = money(balance * rate);
        balance = money(balance + daily);
        total = money(total + daily);
      }
      return {
        ...user,
        balance,
        profit: money(user.profit + total),
        dailyProfit: daily,
        dailyProfitDate: date,
        lastCompound: date,
      };
    }),
  };
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
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

type Ctx = LedgerData & {
  currentEmail: string;
  currentUser: SessionUser | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  register: (details: { name: string; email: string; phone: string; password: string; referralCode?: string }) => Promise<void>;
  login: (identity: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setCurrentEmail: (email: string) => void;
  submitDeposit: (details: DepositInput) => Promise<void>;
  getDepositProof: (id: string) => Promise<string>;
  review: (id: string, approve: boolean, note?: string) => Promise<void>;
  updateUser: (id: string, patch: Partial<Pick<AppUser, 'name' | 'email' | 'phone' | 'status' | 'rate' | 'balance' | 'deposit' | 'profit'>>) => Promise<void>;
  setCompound: (compound: Partial<CompoundSettings>) => Promise<void>;
  runCompound: () => Promise<{ applied: number; date: string }>;
  transferDepositToMain: (userId: string) => Promise<number>;
  creditReferralDeposit: (userId: string, amount: number, referralId: string) => Promise<number>;
  requestWithdrawal: (userId: string, details: { bank: string; account: string; amount: number }) => Promise<string | null>;
  reviewWithdrawal: (id: string, status: WithdrawalStatus, confirmPayout?: boolean, note?: string) => Promise<void>;
};

const LedgerContext = createContext<Ctx | null>(null);

export function LedgerProvider({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [data, setData] = useState<LedgerData>(emptyData);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const auth = await requestJson<{ user: SessionUser | null }>('/api/auth/me');
      setCurrentUser(auth.user);
      if (pathname.startsWith('/admin')) {
        setData(await requestJson<LedgerData & { bankAccounts?: unknown[]; depositContent?: unknown }>('/api/admin/state'));
      } else if (auth.user) {
        setData(await requestJson<LedgerData>('/api/account/state'));
      } else {
        setData(emptyData);
      }
    } catch (cause) {
      setData(emptyData);
      setError(cause instanceof Error ? cause.message : 'Tidak dapat memuat akun.');
    } finally {
      setLoading(false);
    }
  }, [pathname]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const currentEmail = currentUser?.email ?? '';
  const post = useCallback(<T,>(url: string, body?: unknown, method = 'POST') =>
    requestJson<T>(url, {
      method,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }), []);

  const register = useCallback(async (details: { name: string; email: string; phone: string; password: string; referralCode?: string }) => {
    await post('/api/auth/register', details);
    await refresh();
  }, [post, refresh]);

  const login = useCallback(async (identity: string, password: string) => {
    await post('/api/auth/login', { identity, password });
    await refresh();
  }, [post, refresh]);

  const logout = useCallback(async () => {
    try {
      await post('/api/auth/logout');
    } finally {
      setCurrentUser(null);
      setData(emptyData);
      setError('');
    }
  }, [post]);

  const setCurrentEmail = useCallback((email: string) => {
    if (!email) void logout();
  }, [logout]);

  const submitDeposit = useCallback(async (details: DepositInput) => {
    await post('/api/account/deposits', details);
    await refresh();
  }, [post, refresh]);

  const getDepositProof = useCallback(async (id: string) => {
    const result = await requestJson<{ proof: string }>(`/api/admin/deposits/${encodeURIComponent(id)}/proof`);
    return result.proof;
  }, []);

  const review = useCallback(async (id: string, approve: boolean, note = '') => {
    await post(`/api/admin/deposits/${encodeURIComponent(id)}/review`, { approved: approve, note });
    await refresh();
  }, [post, refresh]);

  const updateUser = useCallback(async (id: string, patch: Partial<Pick<AppUser, 'name' | 'email' | 'phone' | 'status' | 'rate' | 'balance' | 'deposit' | 'profit'>>) => {
    await post(`/api/admin/users/${encodeURIComponent(id)}`, patch, 'PATCH');
    await refresh();
  }, [post, refresh]);

  const setCompound = useCallback(async (patch: Partial<CompoundSettings>) => {
    const next = { ...data.compound, ...patch };
    await post('/api/admin/compound/settings', next, 'PATCH');
    await refresh();
  }, [data.compound, post, refresh]);

  const runCompound = useCallback(async () => {
    const result = await post<{ applied: number; date: string }>('/api/admin/compound/run');
    await refresh();
    return result;
  }, [post, refresh]);

  const transferDepositToMain = useCallback(async (_userId: string) => {
    const result = await post<{ moved: number }>('/api/account/transfer-deposit');
    await refresh();
    return result.moved;
  }, [post, refresh]);

  const creditReferralDeposit = useCallback(async (userId: string, amount: number, referralId: string) => {
    const result = await post<{ amount: number }>('/api/admin/referrals/credit', { userId, amount, referralId });
    await refresh();
    return result.amount;
  }, [post, refresh]);

  const requestWithdrawal = useCallback(async (_userId: string, details: { bank: string; account: string; amount: number }) => {
    const result = await post<{ id: string }>('/api/account/withdrawals', details);
    await refresh();
    return result.id;
  }, [post, refresh]);

  const reviewWithdrawal = useCallback(async (id: string, status: WithdrawalStatus, confirmPayout = false, note = '') => {
    await post(`/api/admin/withdrawals/${encodeURIComponent(id)}/review`, { status, confirmPayout, note });
    await refresh();
  }, [post, refresh]);

  const value = useMemo<Ctx>(() => ({
    ...data,
    currentEmail,
    currentUser,
    loading,
    error,
    refresh,
    register,
    login,
    logout,
    setCurrentEmail,
    submitDeposit,
    getDepositProof,
    review,
    updateUser,
    setCompound,
    runCompound,
    transferDepositToMain,
    creditReferralDeposit,
    requestWithdrawal,
    reviewWithdrawal,
  }), [
    data, currentEmail, currentUser, loading, error, refresh, register, login, logout,
    setCurrentEmail, submitDeposit, getDepositProof, review, updateUser, setCompound,
    runCompound, transferDepositToMain, creditReferralDeposit, requestWithdrawal, reviewWithdrawal,
  ]);

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>;
}

export function useLedger() {
  const context = useContext(LedgerContext);
  if (!context) throw new Error('LedgerProvider missing');
  return context;
}

/** Shrinks an uploaded proof to a smaller JPEG before encrypted database storage. */
export function compressImage(file: File, max = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Gambar tidak valid'));
    };
    img.src = url;
  });
}
