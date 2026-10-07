import { describe, expect, it } from 'vitest';
import { compoundAll, depOf, mainOf, profitOf, type AppUser, type LedgerData } from '@/components/ledger-content';

const baseUser = (patch: Partial<AppUser> = {}): AppUser => ({
  id: 'u1',
  name: 'Demo User',
  email: 'demo@example.com',
  phone: '',
  joined: '2026-10-01',
  balance: 100,
  deposit: 50,
  profit: 0,
  dailyProfit: 0,
  dailyProfitDate: '2026-10-06',
  rate: null,
  lastCompound: '2026-10-06',
  status: 'Aktif',
  ...patch,
});

const ledger = (user: AppUser): LedgerData => ({
  users: [user],
  deposits: [],
  withdrawals: [],
  compound: { globalRate: 1, enabled: true },
});

describe('financial ledger model', () => {
  it('keeps deposit balance separate from main and lifetime profit', () => {
    const user = baseUser();
    expect(depOf(user)).toBe(50);
    expect(mainOf(user)).toBe(100);
    expect(profitOf(user)).toBe(0);
  });

  it('compounds only the main balance and records today’s profit', () => {
    const result = compoundAll(ledger(baseUser()), false, '2026-10-07').users[0]!;
    expect(result.balance).toBe(101);
    expect(result.deposit).toBe(50);
    expect(result.profit).toBe(1);
    expect(result.dailyProfit).toBe(1);
    expect(result.dailyProfitDate).toBe('2026-10-07');
  });

  it('does not accrue daily profit while compounding is disabled', () => {
    const data = { ...ledger(baseUser()), compound: { globalRate: 1, enabled: false } };
    const result = compoundAll(data, false, '2026-10-07').users[0]!;
    expect(result.balance).toBe(100);
    expect(result.profit).toBe(0);
    expect(result.dailyProfit).toBe(0);
    expect(result.dailyProfitDate).toBe('2026-10-07');
  });
});
