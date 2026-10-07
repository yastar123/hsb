import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { postJson, useServerContent, type SaveStatus } from '@/lib/site-content';

export type RewardTier = { id: string; invites: number; reward: number; label: string };
export type Referrer = { id: string; name: string; email: string; code: string; commissionRate: number; status: 'Aktif' | 'Nonaktif'; customCommissionRate?: number | null };
export type Referral = { id: string; referrerId: string; name: string; email: string; joined: string; deposit: number; status: 'Terdaftar' | 'Deposit'; commissionPaid: boolean; commissionRate?: number; paidAmount?: number };
export type ReferralData = {
  title: string; subtitle: string; bonusPerInvite: number; friendBonus: number; minDeposit: number; defaultRate: number; terms: string;
  currentUserCode: string; tiers: RewardTier[]; referrers: Referrer[]; referrals: Referral[];
  friendBonusClaimable?: boolean; friendBonusAmount?: number;
};

type ReferralProgram = Pick<ReferralData, 'title' | 'subtitle' | 'bonusPerInvite' | 'friendBonus' | 'minDeposit' | 'defaultRate' | 'terms' | 'tiers'>;
type ReferralRecords = Pick<ReferralData, 'currentUserCode' | 'referrers' | 'referrals'> & Pick<ReferralData, 'friendBonusClaimable' | 'friendBonusAmount'>;

export const defaultReferralProgram: ReferralProgram = {
  title: 'Ajak Teman, Dapatkan Hadiah',
  subtitle: 'Bagikan kode referral Anda. Setiap teman yang mendaftar dan deposit, Anda dan teman sama-sama mendapat hadiah.',
  bonusPerInvite: 10, friendBonus: 5, minDeposit: 25, defaultRate: 10,
  terms: 'Hadiah diberikan setelah teman melakukan deposit pertama minimal sesuai ketentuan. S&K berlaku.',
  tiers: [
    { id: 't1', invites: 5, reward: 25, label: 'Bronze' },
    { id: 't2', invites: 15, reward: 100, label: 'Silver' },
    { id: 't3', invites: 50, reward: 500, label: 'Gold' },
  ],
};

export function commissionOf(d: ReferralData, r: Referral) {
  const ref = d.referrers.find((x) => x.id === r.referrerId);
  if (r.deposit < d.minDeposit) return 0;
  return Math.round((d.bonusPerInvite + (r.deposit * (r.commissionRate ?? ref?.commissionRate ?? d.defaultRate)) / 100) * 100) / 100;
}

const emptyRecords: ReferralRecords = { currentUserCode: '', referrers: [], referrals: [], friendBonusClaimable: false, friendBonusAmount: 0 };
type Ctx = {
  data: ReferralData;
  setData: (u: ReferralData | ((p: ReferralData) => ReferralData)) => void;
  reset: () => void;
  status: SaveStatus;
  error: string;
  recordsStatus: SaveStatus;
  recordsError: string;
  refresh: () => Promise<void>;
  updatePartner: (id: string, patch: { commissionRate?: number; status?: Referrer['status'] }) => Promise<void>;
};
const C = createContext<Ctx | null>(null);
export function ReferralProvider({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const program = useServerContent<ReferralProgram>('referral-program', defaultReferralProgram);
  const [records, setRecords] = useState<ReferralRecords>(emptyRecords);
  const [recordsStatus, setRecordsStatus] = useState<SaveStatus>('loading');
  const [recordsError, setRecordsError] = useState('');
  const adminView = pathname.startsWith('/admin');
  const legacyImportAttempted = useRef(false);

  const refresh = useCallback(async () => {
    setRecordsStatus('loading');
    setRecordsError('');
    try {
      const endpoint = adminView ? '/api/admin/referrals' : '/api/referral/state';
      const response = await fetch(endpoint, { credentials: 'same-origin' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof payload?.error === 'string' ? payload.error : 'Data referral tidak dapat dimuat.');
      setRecords({
        currentUserCode: typeof payload.currentUserCode === 'string' ? payload.currentUserCode : '',
        referrers: Array.isArray(payload.referrers) ? payload.referrers : [],
        referrals: Array.isArray(payload.referrals) ? payload.referrals : [],
        friendBonusClaimable: payload.friendBonusClaimable === true,
        friendBonusAmount: Number(payload.friendBonusAmount) || 0,
      });
      setRecordsStatus('saved');
    } catch (cause) {
      setRecordsError(cause instanceof Error ? cause.message : 'Data referral tidak dapat dimuat.');
      setRecordsStatus('error');
    }
  }, [adminView, pathname]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (!adminView || !program.loaded || program.status !== 'ready' || legacyImportAttempted.current) return;
    legacyImportAttempted.current = true;
    try {
      const raw = window.localStorage.getItem('hsb-referral-data-v1');
      if (!raw) return;
      const legacy = JSON.parse(raw);
      if (!legacy || typeof legacy !== 'object' || Array.isArray(legacy)) return;
      const boundedNumber = (key: string, fallback: number, max: number) => {
        const value = Number(legacy[key]);
        return Number.isFinite(value) && value >= 0 && value <= max ? value : fallback;
      };
      const tiers = Array.isArray(legacy.tiers)
        ? legacy.tiers.slice(0, 50).filter((tier: unknown) => {
            if (!tier || typeof tier !== 'object') return false;
            const item = tier as Record<string, unknown>;
            return typeof item['id'] === 'string' && typeof item['label'] === 'string' &&
              Number.isInteger(Number(item['invites'])) && Number(item['invites']) >= 0 &&
              Number.isFinite(Number(item['reward'])) && Number(item['reward']) >= 0;
          }).map((tier: Record<string, unknown>) => ({
            id: String(tier['id']).slice(0, 100),
            label: String(tier['label']).slice(0, 100),
            invites: Math.min(1_000_000, Number(tier['invites'])),
            reward: Math.min(1_000_000_000, Number(tier['reward'])),
          }))
        : defaultReferralProgram.tiers;
      program.setValue({
        title: typeof legacy.title === 'string' ? legacy.title.slice(0, 2000) : defaultReferralProgram.title,
        subtitle: typeof legacy.subtitle === 'string' ? legacy.subtitle.slice(0, 2000) : defaultReferralProgram.subtitle,
        bonusPerInvite: boundedNumber('bonusPerInvite', defaultReferralProgram.bonusPerInvite, 1_000_000_000),
        friendBonus: boundedNumber('friendBonus', defaultReferralProgram.friendBonus, 1_000_000_000),
        minDeposit: boundedNumber('minDeposit', defaultReferralProgram.minDeposit, 1_000_000_000),
        defaultRate: boundedNumber('defaultRate', defaultReferralProgram.defaultRate, 100),
        terms: typeof legacy.terms === 'string' ? legacy.terms.slice(0, 2000) : defaultReferralProgram.terms,
        tiers,
      });
    } catch {
      // Invalid browser content is not imported. Real referral relationships are never read from this legacy key.
    }
  }, [adminView, program.loaded, program.status, program.setValue]);

  const data: ReferralData = { ...program.value, ...records };
  const setData = useCallback((next: ReferralData | ((previous: ReferralData) => ReferralData)) => {
    const updated = typeof next === 'function' ? next({ ...program.value, ...records }) : next;
    program.setValue({
      title: updated.title,
      subtitle: updated.subtitle,
      bonusPerInvite: updated.bonusPerInvite,
      friendBonus: updated.friendBonus,
      minDeposit: updated.minDeposit,
      defaultRate: updated.defaultRate,
      terms: updated.terms,
      tiers: updated.tiers,
    });
  }, [program.value, program.setValue, records]);

  const updatePartner = useCallback(async (id: string, patch: { commissionRate?: number; status?: Referrer['status'] }) => {
    await postJson(`/api/admin/referrals/partners/${encodeURIComponent(id)}`, patch, 'PATCH');
    await refresh();
  }, [refresh]);

  return <C.Provider value={{
    data,
    setData,
    reset: () => program.setValue(defaultReferralProgram),
    status: program.status,
    error: program.error,
    recordsStatus,
    recordsError,
    refresh,
    updatePartner,
  }}>{children}</C.Provider>;
}
export function useReferral() { const c = useContext(C); if (!c) throw new Error('ReferralProvider missing'); return c; }
export const uid = () => Math.random().toString(36).slice(2, 9);
