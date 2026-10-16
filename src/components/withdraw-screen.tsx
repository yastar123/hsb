import { useState, type FormEvent } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Landmark, Wallet, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Notice } from '@/components/account-pages';
import { useAppPreferences, translate } from '@/components/app-preferences';
import { profitOf, depOf, mainOf, useLedger } from '@/components/ledger-content';

export function WithdrawScreen() {
  const { language } = useAppPreferences();
  const tr = (text: string) => translate(text, language);
  const { users, currentEmail, currentUser, requestWithdrawal } = useLedger();
  const me = users.find((user) => user.email.toLowerCase() === (currentEmail || currentUser?.email || '').toLowerCase()) ?? currentUser ?? users[0];

  // Penarikan HANYA berdasarkan Saldo Total Profit
  const availableProfit = me ? profitOf(me) : 0;
  const depositBalance = me ? depOf(me) : 0;
  const mainBalance = me ? mainOf(me) : 0;

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
    if (val > availableProfit) {
      setNotice(tr(`Jumlah penarikan melebihi Saldo Total Profit ($${availableProfit.toFixed(2)} USD). Sesuai ketentuan, penarikan hanya bisa dilakukan dari Saldo Total Profit.`));
      return;
    }
    setSubmitting(true);
    try {
      const targetUserId = me?.id || 'demo-user-1';
      await requestWithdrawal(targetUserId, { bank: bank.trim(), account: cleanNum, amount: val });
      setNotice(tr('Permintaan penarikan dana berhasil dikirim dan sedang diproses.'));
      setAmount('');
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : tr('Permintaan penarikan tidak dapat diproses. Periksa Saldo Total Profit Anda.'));
    } finally {
      setSubmitting(false);
    }
  };

  return <main className="home-page"><div className="home-shell acct-shell acct-plain">
    <header className="acct-header"><Button asChild variant="ghost" size="icon"><Link to="/beranda" aria-label={tr('Kembali ke Beranda')}><ArrowLeft /></Link></Button><h1>{tr('Withdraw')}</h1></header>

    {/* Balance Info Cards */}
    <div className="p-4 rounded-xl bg-card border border-border space-y-3 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs text-muted-foreground block">{tr('Saldo Siap Ditarik (Saldo Total Profit)')}</span>
          <span className="text-2xl font-extrabold text-emerald-400 font-mono block mt-0.5">${availableProfit.toFixed(2)} USD</span>
        </div>
        <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Wallet className="size-6" />
        </div>
      </div>
      <div className="pt-2.5 border-t border-border/60 text-xs text-muted-foreground space-y-1.5">
        <div className="flex items-center justify-between">
          <span>{tr('Saldo Deposit:')}</span>
          <span className="font-mono font-medium text-foreground">${depositBalance.toFixed(2)} USD</span>
        </div>
        <div className="flex items-center justify-between">
          <span>{tr('Saldo Utama (Aktif Compounding):')}</span>
          <span className="font-mono font-medium text-foreground">${mainBalance.toFixed(2)} USD</span>
        </div>
      </div>
    </div>

    {/* Rule Info */}
    <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
      <div className="font-bold flex items-center gap-1.5 text-amber-400">
        <AlertCircle className="size-4 shrink-0" />
        <span>{tr('Ketentuan Penarikan Dana')}</span>
      </div>
      <p className="text-muted-foreground leading-relaxed">
        {tr('Penarikan dana hanya dapat dilakukan berdasarkan Saldo Total Profit.')}
      </p>
    </div>

    <form className="withdraw-form" onSubmit={submit}>
      <label>{tr('Bank Tujuan')}<Input value={bank} onChange={(e) => setBank(e.target.value)} placeholder={tr('Ketik nama bank tujuan')} maxLength={100} /></label>
      <label>{tr('Nomor Rekening')}<Input inputMode="numeric" value={number} onChange={(e) => setNumber(e.target.value.replace(/\D/g, '').slice(0, 30))} placeholder={tr('Nomor rekening tujuan')} maxLength={30} /></label>
      <label>
        <div className="flex items-center justify-between mb-1">
          <span>{tr('Jumlah Penarikan (USD)')}</span>
          {availableProfit > 0 && (
            <button
              type="button"
              onClick={() => setAmount(String(availableProfit))}
              className="text-xs text-primary font-bold hover:underline"
            >
              {tr('Tarik Semua Profit')} (${availableProfit.toFixed(2)})
            </button>
          )}
        </div>
        <Input type="number" inputMode="decimal" min="0.01" max={availableProfit} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
      </label>
      <Button className="acct-submit cursor-pointer font-bold text-base bg-primary text-primary-foreground hover:brightness-105 active:scale-[0.99] transition-all shadow-md" disabled={submitting || availableProfit <= 0} type="submit">
        <Landmark /> {submitting ? tr('Memproses...') : tr('Tarik Dana Profit')}
      </Button>
    </form>
    {notice && <Notice text={notice} onClose={() => setNotice('')} />}
  </div></main>;
}