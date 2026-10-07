import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type RewardTier = { id: string; invites: number; reward: number; label: string };
export type Referrer = { id: string; name: string; email: string; code: string; commissionRate: number; status: 'Aktif' | 'Nonaktif' };
export type Referral = { id: string; referrerId: string; name: string; email: string; joined: string; deposit: number; status: 'Terdaftar' | 'Deposit' | 'Aktif Trading'; commissionPaid: boolean };
export type ReferralData = {
  title: string; subtitle: string; bonusPerInvite: number; friendBonus: number; minDeposit: number; defaultRate: number; terms: string;
  currentUserCode: string; tiers: RewardTier[]; referrers: Referrer[]; referrals: Referral[];
};

export const defaultReferralData: ReferralData = {
  title: 'Ajak Teman, Dapatkan Hadiah',
  subtitle: 'Bagikan kode referral Anda. Setiap teman yang mendaftar dan deposit, Anda dan teman sama-sama mendapat hadiah.',
  bonusPerInvite: 10, friendBonus: 5, minDeposit: 25, defaultRate: 10,
  terms: 'Hadiah diberikan setelah teman melakukan deposit pertama minimal sesuai ketentuan. S&K berlaku.',
  currentUserCode: 'WIJAR4',
  tiers: [
    { id: 't1', invites: 5, reward: 25, label: 'Bronze' },
    { id: 't2', invites: 15, reward: 100, label: 'Silver' },
    { id: 't3', invites: 50, reward: 500, label: 'Gold' },
  ],
  referrers: [
    { id: 'r0', name: 'Wijar (Anda)', email: 'wijar@mail.com', code: 'WIJAR4', commissionRate: 10, status: 'Aktif' },
    { id: 'r1', name: 'Budi Santoso', email: 'budi@mail.com', code: 'BUDI01', commissionRate: 12, status: 'Aktif' },
    { id: 'r2', name: 'Sari Wulandari', email: 'sari@mail.com', code: 'SARI22', commissionRate: 10, status: 'Aktif' },
  ],
  referrals: [
    { id: 'u1', referrerId: 'r0', name: 'Rina', email: 'rina@mail.com', joined: '2026-09-28', deposit: 500, status: 'Aktif Trading', commissionPaid: true },
    { id: 'u2', referrerId: 'r0', name: 'Joko', email: 'joko@mail.com', joined: '2026-10-02', deposit: 0, status: 'Terdaftar', commissionPaid: false },
    { id: 'u3', referrerId: 'r1', name: 'Maya', email: 'maya@mail.com', joined: '2026-09-15', deposit: 1200, status: 'Deposit', commissionPaid: false },
    { id: 'u4', referrerId: 'r1', name: 'Agus', email: 'agus@mail.com', joined: '2026-09-20', deposit: 300, status: 'Aktif Trading', commissionPaid: true },
    { id: 'u5', referrerId: 'r2', name: 'Fajar', email: 'fajar@mail.com', joined: '2026-10-01', deposit: 150, status: 'Deposit', commissionPaid: false },
  ],
};

export function commissionOf(d: ReferralData, r: Referral) {
  const ref = d.referrers.find((x) => x.id === r.referrerId);
  if (r.deposit < d.minDeposit) return 0;
  return d.bonusPerInvite + (r.deposit * (ref?.commissionRate ?? d.defaultRate)) / 100;
}

const KEY = 'hsb-referral-data-v1';
type Ctx = { data: ReferralData; setData: (u: ReferralData | ((p: ReferralData) => ReferralData)) => void; reset: () => void };
const C = createContext<Ctx | null>(null);
export function ReferralProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ReferralData>(defaultReferralData);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { try { const raw = localStorage.getItem(KEY); if (raw) setData({ ...defaultReferralData, ...JSON.parse(raw) }); } catch { /* ignore */ } setLoaded(true); }, []);
  useEffect(() => { if (loaded) localStorage.setItem(KEY, JSON.stringify(data)); }, [data, loaded]);
  return <C.Provider value={{ data, setData, reset: () => setData(defaultReferralData) }}>{children}</C.Provider>;
}
export function useReferral() { const c = useContext(C); if (!c) throw new Error('ReferralProvider missing'); return c; }
export const uid = () => Math.random().toString(36).slice(2, 9);
