import { describe, expect, it } from 'vitest';
import { isValidPassword, passwordRules } from '@/lib/account-validation';
describe('Reference registration password requirements', () => {
  it('accepts only 12 to 128 characters', () => {
    const rule = passwordRules[0];
    expect(rule?.valid('Ab1!abcdefg')).toBe(false);
    expect(rule?.valid('Ab1!abcdefgh')).toBe(true);
    expect(rule?.valid(`Ab1!${'a'.repeat(124)}`)).toBe(true);
    expect(rule?.valid(`Ab1!${'a'.repeat(125)}`)).toBe(false);
  });
  it('requires a number', () => { expect(isValidPassword('Abc!defghijk')).toBe(false); });
  it('requires an uppercase letter', () => { expect(isValidPassword('abc1!defghijk')).toBe(false); });
  it('requires a lowercase letter', () => { expect(isValidPassword('ABC1!DEFGHIJK')).toBe(false); });
  it('requires a special character', () => { expect(isValidPassword('Abc1defghijk')).toBe(false); });
  it('rejects spaces', () => { expect(isValidPassword('Ab1! abcdefgh')).toBe(false); });
  it('accepts a password satisfying all requirements', () => { expect(isValidPassword('Ab1!abcdefgh')).toBe(true); });
});