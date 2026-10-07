export const demoAccounts = [
  {
    role: 'user',
    label: 'Pengguna Demo',
    email: 'budi@contoh.com',
    password: 'Demo@1234',
  },
  {
    role: 'admin',
    label: 'Admin Demo',
    email: 'admin@demo.test',
    password: 'Admin@123',
  },
] as const;

export function findDemoAccount(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return demoAccounts.find(
    (account) => account.email.toLowerCase() === normalizedEmail && account.password === password,
  );
}
