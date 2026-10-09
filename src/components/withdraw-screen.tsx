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
  const { users, currentEmail, currentUser, requestWithdrawal } = useLedger();
  const me = users.find((user) => user.email.toLowerCase() === (currentEmail || currentUser?.email || '').toLowerCase()) ?? currentUser ?? users[0];
  const available = me ? mainOf(me) : 1000;
  const [amount, setAmount] = useState('');
  const [bank, setBank] = useState('BCA');
  const [number, setNumber] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setNotice('');
    if (me?.status === 'Diblokir') {
      setNotice(tr('Akun Anda sedang diblokir. Hubungi layanan pelanggan.'));
      return;
    }
    if (!bank.trim()) {
      setNotice(tr('Silakan masukkan nama bank tujuan penarikan.'));
      return;
    }
    const cleanNum = number.replace(/\D/g, '');
    if (cleanNum.length < 4) {
      setNotice(tr('Silakan masukkan nomor rekening tujuan yang valid (minimal 4 digit).'));
      return;
    }
    const val = Number(amount);
    if (!val || val <= 0) {
      setNotice(tr('Silakan masukkan jumlah nominal penarikan.'));
      return;
    }
    if (val > available) {
      setNotice(tr(`Jumlah penarikan melebihi saldo utama yang tersedia ($${available.toFixed(2)} USD).`));
      return;
    }
    setSubmitting(true);
    try {
      const targetUserId = me?.id || 'demo-user-1';
      await requestWithdrawal(targetUserId, { bank: bank.trim(), account: cleanNum, amount: val });
      setNotice(tr('Permintaan penarikan dana berhasil dikirim dan sedang diproses.'));
      setAmount('');
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : tr('Permintaan tidak dapat dibuat. Periksa saldo utama.'));
    } finally {
      setSubmitting(false);
    }
  };
  return <main className="home-page"><div className="home-shell acct-shell acct-plain">
    <header className="acct-header"><Button asChild variant="ghost" size="icon"><Link to="/beranda" aria-label={tr('Kembali ke Beranda')}><ArrowLeft /></Link></Button><h1>{tr('Withdraw')}</h1></header>
    <form className="withdraw-form" onSubmit={submit}>
      <div className="withdraw-account"><Wallet /><div><b>{tr('Saldo utama tersedia')} · ${available.toFixed(2)} USD</b></div></div>
      <label>{tr('Bank Tujuan')}<Input value={bank} onChange={(e) => setBank(e.target.value)} placeholder={tr('Ketik nama bank tujuan')} maxLength={100} /></label>
      <label>{tr('Nomor Rekening')}<Input inputMode="numeric" value={number} onChange={(e) => setNumber(e.target.value.replace(/\D/g, '').slice(0, 30))} placeholder={tr('Nomor rekening tujuan')} maxLength={30} /></label>
      <label>{tr('Jumlah Penarikan (USD)')}<Input type="number" inputMode="decimal" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></label>
      <Button className="acct-submit cursor-pointer font-bold text-base bg-primary text-primary-foreground hover:brightness-105 active:scale-[0.99] transition-all shadow-md" disabled={submitting} type="submit"><Landmark /> {submitting ? tr('Memproses...') : tr('Tarik Dana')}</Button>
    </form>
    {notice && <Notice text={notice} onClose={() => setNotice('')} />}
  </div></main>;
}