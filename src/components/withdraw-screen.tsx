import { useState, type FormEvent } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Landmark, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Notice } from '@/components/account-pages';
import { useAppPreferences, translate } from '@/components/app-preferences';
import { mainOf, useLedger } from '@/components/ledger-content';

export function WithdrawScreen() {
  const { language } = useAppPreferences();
  const tr = (text: string) => translate(text, language);
  const { users, currentEmail, requestWithdrawal } = useLedger();
  const me = users.find((user) => user.email.toLowerCase() === currentEmail.toLowerCase()) ?? users[0];
  const available = me ? mainOf(me) : 0;
  const [amount, setAmount] = useState('');
  const [bank, setBank] = useState('');
  const [number, setNumber] = useState('');
  const [notice, setNotice] = useState('');
  const ready = !!me && me.status === 'Aktif' && Number(amount) > 0 && Number(amount) <= available && bank.trim() !== '' && /^\d{6,20}$/.test(number);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!ready || !me) return;
    setNotice('');
    try {
      await requestWithdrawal(me.id, { bank: bank.trim(), account: number, amount: Number(amount) });
      setNotice(tr('Permintaan withdraw simulasi dibuat. Saldo utama dikurangi saat permintaan dikirim; jika ditolak admin, saldo dikembalikan.'));
      setAmount('');
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : tr('Permintaan tidak dapat dibuat. Periksa status akun dan saldo utama.'));
    }
  };
  return <main className="home-page"><div className="home-shell acct-shell acct-plain">
    <header className="acct-header"><Button asChild variant="ghost" size="icon"><Link to="/beranda" aria-label={tr('Kembali ke Beranda')}><ArrowLeft /></Link></Button><h1>{tr('Withdraw')}</h1></header>
    <form className="withdraw-form" onSubmit={submit}>
      <div className="withdraw-account"><Wallet /><div><b>{tr('Saldo utama tersedia')} · ${available.toFixed(2)} USD</b><p>{tr('Simulasi lokal; bukan dana sungguhan. Permintaan aktif mengurangi saldo utama sampai diproses.')}</p></div></div>
      <label>{tr('Bank Tujuan')}<Input required value={bank} onChange={(e) => setBank(e.target.value)} placeholder={tr('Ketik nama bank tujuan')} maxLength={100} /></label>
      <label>{tr('Nomor Rekening')}<Input inputMode="numeric" required value={number} onChange={(e) => setNumber(e.target.value.replace(/\D/g, '').slice(0, 30))} placeholder={tr('Nomor rekening tujuan')} maxLength={30} /></label>
      <label>{tr('Jumlah Penarikan (USD)')}<Input type="number" inputMode="decimal" min="0.01" max={available} step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></label>
      <p className="prof-hint">{tr('Withdraw hanya menggunakan saldo utama. Jika permintaan ditolak admin, nominalnya dikembalikan ke saldo utama.')}</p>
      <Button className="acct-submit" disabled={!ready} type="submit"><Landmark /> {tr('Tarik Dana')}</Button>
    </form>
    {notice && <Notice text={notice} onClose={() => setNotice('')} />}
  </div></main>;
}