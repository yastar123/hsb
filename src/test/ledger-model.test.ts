import { describe, expect, it } from 'vitest';
import { compoundAll, depOf, mainOf, migrateUsers, profitOf, type AppUser, type LedgerData } from '@/components/ledger-content';

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

  it('preserves the existing total while migrating legacy balances', () => {
    const migrated = migrateUsers([
      { ...baseUser(), balance: 1050, deposit: 1000, profit: 50 },
      { ...baseUser({ id: 'u2' }), balance: 320, deposit: undefined, profit: undefined },
    ]);
    expect(mainOf(migrated[0]!)).toBe(50);
    expect(depOf(migrated[0]!)).toBe(1000);
    expect(mainOf(migrated[0]!) + depOf(migrated[0]!)).toBe(1050);
    expect(mainOf(migrated[1]!)).toBe(0);
    expect(depOf(migrated[1]!)).toBe(320);
  });
});
