import { useState, type FormEvent } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Landmark, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Notice } from '@/components/account-pages';
import { useAppPreferences, translate } from '@/components/app-preferences';

export function WithdrawScreen() {
  const { language } = useAppPreferences();
  const tr = (text: string) => translate(text, language);
  const [amount, setAmount] = useState('');
  const [bank, setBank] = useState('');
  const [number, setNumber] = useState('');
  const [notice, setNotice] = useState('');
  const ready = Number(amount) > 0 && bank.trim() !== '' && /^\d{6,20}$/.test(number);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (ready) setNotice(tr('Penarikan belum terhubung ke layanan akun. Tidak ada dana yang dipindahkan.'));
  };
  return <main className="home-page"><div className="home-shell acct-shell acct-plain">
    <header className="acct-header"><Button asChild variant="ghost" size="icon"><Link to="/beranda" aria-label={tr('Kembali ke Beranda')}><ArrowLeft /></Link></Button><h1>{tr('Withdraw')}</h1></header>
    <form className="withdraw-form" onSubmit={submit}>
      <div className="withdraw-account"><Wallet /><div><b>Akun Demo · USD</b><p>{tr('Pratinjau saja; tidak ada dana sungguhan yang dipindahkan.')}</p></div></div>
      <label>{tr('Bank Tujuan')}<Input required value={bank} onChange={(e) => setBank(e.target.value)} placeholder={tr('Ketik nama bank tujuan')} maxLength={100} /></label>
      <label>{tr('Nomor Rekening')}<Input inputMode="numeric" required value={number} onChange={(e) => setNumber(e.target.value.replace(/\D/g, '').slice(0, 30))} placeholder={tr('Nomor rekening tujuan')} maxLength={30} /></label>
      <label>{tr('Jumlah Penarikan (USD)')}<Input type="number" inputMode="decimal" min="0" step="any" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></label>
      <p className="prof-hint">{tr('Penarikan belum terhubung ke layanan akun. Tidak ada dana yang dipindahkan.')}</p>
      <Button className="acct-submit" disabled={!ready} type="submit"><Landmark /> {tr('Tarik Dana')}</Button>
    </form>
    {notice && <Notice text={notice} onClose={() => setNotice('')} />}
  </div></main>;
}