import { useState, type FormEvent } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Landmark, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Notice } from '@/components/account-pages';

export function WithdrawScreen() {
  const [amount, setAmount] = useState('');
  const [bank, setBank] = useState('');
  const [number, setNumber] = useState('');
  const [notice, setNotice] = useState('');
  const ready = Number(amount) > 0 && bank !== '' && /^\d{6,20}$/.test(number);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (ready) setNotice('Penarikan belum terhubung ke layanan akun. Tidak ada dana yang dipindahkan.');
  };
  return <main className="home-page"><div className="home-shell acct-shell acct-plain">
    <header className="acct-header"><Button asChild variant="ghost" size="icon"><Link to="/beranda" aria-label="Kembali ke Beranda"><ArrowLeft /></Link></Button><h1>Withdraw</h1></header>
    <form className="withdraw-form" onSubmit={submit}>
      <div className="withdraw-account"><Wallet /><div><b>Akun Demo · USD</b><p>Penarikan hanya tersedia untuk akun real.</p></div></div>
      <label>Akun Trading<Input value="#90260762 · Demo USD" readOnly /></label>
      <label>Bank Tujuan<select required value={bank} onChange={(e) => setBank(e.target.value)}><option value="">Pilih bank</option>{['BCA', 'BNI', 'Mandiri', 'BRI', 'BSI', 'CIMB Niaga', 'Permata'].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>Nomor Rekening<Input inputMode="numeric" required value={number} onChange={(e) => setNumber(e.target.value.replace(/\D/g, ''))} placeholder="Nomor rekening tujuan" /></label>
      <label>Jumlah Penarikan (USD)<Input type="number" inputMode="decimal" min="0" step="any" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></label>
      <p className="prof-hint">Penarikan belum terhubung ke layanan akun.</p>
      <Button className="acct-submit" disabled={!ready} type="submit"><Landmark /> Tarik Dana</Button>
    </form>
    {notice && <Notice text={notice} onClose={() => setNotice('')} />}
  </div></main>;
}