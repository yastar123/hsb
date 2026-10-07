import { afterEach, describe, expect, it, vi } from 'vitest';
import { hasConfiguredAdminCredentials, verifyAdminCredentials } from './auth.js';

afterEach(() => vi.unstubAllEnvs());

describe('admin login credentials', () => {
  it('accepts either the configured email or phone with the shared password', () => {
    vi.stubEnv('ADMIN_EMAIL', 'Admin@example.com');
    vi.stubEnv('ADMIN_PHONE', '081234567890');
    vi.stubEnv('ADMIN_PASSWORD', 'test-password-only');

    expect(hasConfiguredAdminCredentials()).toBe(true);
    expect(verifyAdminCredentials('admin@example.com', 'test-password-only')).toBe(true);
    expect(verifyAdminCredentials('+6281234567890', 'test-password-only')).toBe(true);
    expect(verifyAdminCredentials('081234567890', 'wrong-password')).toBe(false);
    expect(verifyAdminCredentials('unknown@example.com', 'test-password-only')).toBe(false);
  });

  it('keeps the admin routes disabled without an identifier and password', () => {
    vi.stubEnv('ADMIN_EMAIL', '');
    vi.stubEnv('ADMIN_PHONE', '');
    vi.stubEnv('ADMIN_NUMBER', '');
    vi.stubEnv('ADMIN_USERNAME', '');
    vi.stubEnv('ADMIN_PASSWORD', '');

    expect(hasConfiguredAdminCredentials()).toBe(false);
    expect(verifyAdminCredentials('admin@example.com', 'test-password-only')).toBe(false);
  });

  it('disables admin access when the configured password is shorter than 16 characters', () => {
    vi.stubEnv('ADMIN_EMAIL', 'admin@example.com');
    vi.stubEnv('ADMIN_PHONE', '081234567890');
    vi.stubEnv('ADMIN_PASSWORD', 'Short-pass-1!');

    expect(hasConfiguredAdminCredentials()).toBe(false);
    expect(verifyAdminCredentials('admin@example.com', 'Short-pass-1!')).toBe(false);
  });
});
