import { useEffect, useState } from 'react';

export type BankAccount = { id: string; bank: string; holder: string; number: string; active: boolean };
const KEY = 'hsb-bank-accounts-v1';
const EVT = 'hsb-bank-accounts-change';
export const sampleAccounts: BankAccount[] = [];

function load(): BankAccount[] {
  try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : sampleAccounts; } catch { return sampleAccounts; }
}

/** Company receiving accounts (browser-saved), shared by /deposit and admin deposit settings. */
export function useBankAccounts() {
  const [list, setList] = useState<BankAccount[]>(sampleAccounts);
  useEffect(() => {
    const sync = () => setList(load());
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener('storage', sync); };
  }, []);
  const save = (n: BankAccount[]) => { localStorage.setItem(KEY, JSON.stringify(n)); setList(n); window.dispatchEvent(new Event(EVT)); };
  return { list, save };
}
