import { describe, expect, it } from 'vitest';
import { isValidPassword, passwordRules } from '@/lib/account-validation';
describe('Reference registration password requirements', () => {
  it('accepts only 8 to 12 characters', () => {
    const rule = passwordRules[0];
    expect(rule?.valid('Ab1!abc')).toBe(false);
    expect(rule?.valid('Ab1!abcd')).toBe(true);
    expect(rule?.valid('Ab1!abcdefgh')).toBe(true);
    expect(rule?.valid('Ab1!abcdefghi')).toBe(false);
  });
  it('requires a number', () => { expect(isValidPassword('Abc!defg')).toBe(false); });
  it('requires an uppercase letter', () => { expect(isValidPassword('abc1!def')).toBe(false); });
  it('requires a lowercase letter', () => { expect(isValidPassword('ABC1!DEF')).toBe(false); });
  it('requires a special character', () => { expect(isValidPassword('Abc1defg')).toBe(false); });
  it('rejects spaces', () => { expect(isValidPassword('Ab1! abc')).toBe(false); });
  it('accepts a password satisfying all requirements', () => { expect(isValidPassword('Ab1!abcd')).toBe(true); });
});