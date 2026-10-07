import { useEffect, useRef, useState } from 'react';

export type BankAccount = { id: string; bank: string; holder: string; number: string; active: boolean };
export const sampleAccounts: BankAccount[] = [];

export function useBankAccounts() {
  const [list, setList] = useState<BankAccount[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveError, setSaveError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/site/deposit-settings', { credentials: 'same-origin' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result?.error || 'Rekening tujuan gagal dimuat.');
        if (active && Array.isArray(result.bankAccounts)) setList(result.bankAccounts);
      })
      .catch((error) => { if (active) setSaveError(error instanceof Error ? error.message : 'Rekening tujuan gagal dimuat.'); })
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!loaded || !dirty) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fetch('/api/admin/site-settings', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankAccounts: list }),
      })
        .then(async (response) => {
          const result = await response.json();
          if (!response.ok) throw new Error(result?.error || 'Rekening tujuan gagal disimpan.');
          setSaveError('');
          setDirty(false);
        })
        .catch((error) => setSaveError(error instanceof Error ? error.message : 'Rekening tujuan gagal disimpan.'));
    }, 450);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [dirty, list, loaded]);

  const save = (next: BankAccount[]) => {
    setList(next);
    setDirty(true);
  };
  return { list, save, saveError };
}
