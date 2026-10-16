import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  ArrowLeftRight,
  ArrowUpFromLine,
  X,
  Wallet,
  Zap,
  TrendingUp,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppPreferences, translate } from '@/components/app-preferences';
import {
  useLedger,
  depOf,
  profitOf,
  dailyProfitOf,
  mainOf,
  rateOf,
  type AppUser,
  type SessionUser
} from '@/components/ledger-content';

type CompoundingModalProps = {
  open: boolean;
  onClose: () => void;
};

export function CompoundingModal({ open, onClose }: CompoundingModalProps) {
  const { language } = useAppPreferences();
  const tr = (text: string) => translate(text, language);
  const navigate = useNavigate();
  const { users, compound, currentEmail, currentUser, transferDepositToMain } = useLedger();

  const me = (users.find(
    (u) => u.email.toLowerCase() === (currentEmail || currentUser?.email || '').toLowerCase()
  ) ?? currentUser ?? users[0]) as AppUser | SessionUser | undefined;

  const mainBalance = me ? mainOf(me) : 0;
  const depositBalance = me ? depOf(me) : 0;
  const totalProfitBalance = me ? profitOf(me) : 0;
  const dailyProfitBalance = me ? dailyProfitOf(me) : 0;
  const userRate = me ? rateOf(me, compound) : compound.globalRate;

  const [activeTab, setActiveTab] = useState<'menu' | 'reinvest'>('menu');
  const [source, setSource] = useState<'profit' | 'deposit'>(
    totalProfitBalance > 0 ? 'profit' : 'deposit'
  );
  const [amount, setAmount] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!open) return null;

  const maxAvailable = source === 'profit' ? totalProfitBalance : depositBalance;

  const handleOpenReinvest = (selectedSource?: 'profit' | 'deposit') => {
    if (selectedSource) {
      setSource(selectedSource);
      setAmount(String(selectedSource === 'profit' ? totalProfitBalance : depositBalance));
    } else {
      const bestSource = totalProfitBalance > 0 ? 'profit' : 'deposit';
      setSource(bestSource);
      setAmount(String(bestSource === 'profit' ? totalProfitBalance : depositBalance));
    }
    setFeedback(null);
    setActiveTab('reinvest');
  };

  const handleExecuteReinvest = async () => {
    setFeedback(null);
    if (!me) return;

    if (!compound.enabled) {
      setFeedback({ type: 'error', message: tr('Compounding sedang dinonaktifkan oleh admin.') });
      return;
    }

    if (me.status === 'Diblokir') {
      setFeedback({ type: 'error', message: tr('Akun Anda sedang diblokir. Hubungi layanan pelanggan.') });
      return;
    }

    const val = Number(amount);
    if (isNaN(val) || val <= 0) {
      setFeedback({ type: 'error', message: tr('Silakan masukkan jumlah nominal yang valid.') });
      return;
    }

    if (val > maxAvailable) {
      setFeedback({
        type: 'error',
        message: tr(`Jumlah melebihi saldo yang tersedia ($${maxAvailable.toFixed(2)} USD).`)
      });
      return;
    }

    setSubmitting(true);
    try {
      const moved = await transferDepositToMain(me.id, { source, amount: val });
      if (moved > 0) {
        setFeedback({
          type: 'success',
          message: tr(
            `Dana sebesar $${moved.toFixed(2)} USD dari ${source === 'profit' ? 'Saldo Total Profit' : 'Saldo Deposit'} berhasil masuk ke Saldo Utama!`
          )
        });
        setAmount('');
      } else {
        setFeedback({
          type: 'error',
          message: tr('Tidak ada saldo yang dapat dipindahkan ke Saldo Utama.')
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : tr('Gagal melakukan compounding ke Saldo Utama.')
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoToWithdraw = () => {
    onClose();
    void navigate({ to: '/withdraw' });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-5 text-foreground shadow-2xl max-h-[90vh] overflow-y-auto space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
              <ArrowLeftRight className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">{tr('Menu Compounding')}</h2>
              <p className="text-xs text-muted-foreground">{tr('Kelola saldo dan keuntungan compounding Anda')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            aria-label="Tutup"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Current Account Balances Overview */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-background border border-border">
            <span className="text-muted-foreground block text-[11px] font-medium">{tr('Saldo Utama (Aktif)')}</span>
            <span className="text-base font-extrabold text-foreground font-mono block mt-0.5">
              ${mainBalance.toFixed(2)}
            </span>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              {userRate}% {tr('/ hari')}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-emerald-400 block text-[11px] font-bold">{tr('Saldo Total Profit')}</span>
            <span className="text-base font-extrabold text-emerald-400 font-mono block mt-0.5">
              ${totalProfitBalance.toFixed(2)}
            </span>
            <span className="text-[10px] text-emerald-400/80 block mt-0.5">
              {tr('Siap ditarik / di-compound')}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-background border border-border">
            <span className="text-muted-foreground block text-[11px] font-medium">{tr('Saldo Deposit')}</span>
            <span className="text-sm font-bold text-foreground font-mono block mt-0.5">
              ${depositBalance.toFixed(2)}
            </span>
            <span className="text-[10px] text-amber-400 block mt-0.5">
              {tr('Minimal 30 hari')}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-background border border-border">
            <span className="text-muted-foreground block text-[11px] font-medium">{tr('Saldo Profit Harian')}</span>
            <span className="text-sm font-bold text-primary font-mono block mt-0.5">
              ${dailyProfitBalance.toFixed(2)}
            </span>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              {tr('Disalurkan tiap 14:00 WIB')}
            </span>
          </div>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="size-4 shrink-0 text-rose-400 mt-0.5" />
            )}
            <div>{feedback.message}</div>
          </div>
        )}

        {/* View 1: Main Action Selection Menu */}
        {activeTab === 'menu' && (
          <div className="space-y-3 pt-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
              {tr('Pilih Tindakan:')}
            </div>

            {/* Option 1: Melakukan Compounding Lagi */}
            <div
              onClick={() => handleOpenReinvest()}
              className="group p-4 rounded-xl border border-border bg-background hover:border-primary/60 hover:bg-primary/5 cursor-pointer transition-all space-y-2 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                    <TrendingUp className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {tr('1. Melakukan Compounding Lagi')}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {tr('Dana yang ditentukan akan masuk ke Saldo Utama')}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-primary font-bold group-hover:translate-x-0.5 transition-transform">
                  Pilih →
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed pt-1 border-t border-border/50">
                {tr(
                  'Masukkan dana dari Saldo Total Profit atau Saldo Deposit ke Saldo Utama untuk melipatgandakan hasil compounding pada pukul 14:00 WIB berikutnya.'
                )}
              </p>
            </div>

            {/* Option 2: Melakukan Penarikan Dana (WD) */}
            <div
              onClick={handleGoToWithdraw}
              className="group p-4 rounded-xl border border-border bg-background hover:border-primary/60 hover:bg-primary/5 cursor-pointer transition-all space-y-2 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center font-bold">
                    <ArrowUpFromLine className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {tr('2. Melakukan Penarikan Dana (WD)')}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {tr('Halaman WD: Hanya bisa tarik dana berdasarkan Saldo Total Profit')}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-primary font-bold group-hover:translate-x-0.5 transition-transform">
                  Buka WD →
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px]">
                <span className="text-muted-foreground">{tr('Tersedia untuk ditarik:')}</span>
                <span className="font-mono font-bold text-emerald-400">${totalProfitBalance.toFixed(2)} USD</span>
              </div>
            </div>
          </div>
        )}

        {/* View 2: Form Melakukan Compounding Lagi (Reinvest) */}
        {activeTab === 'reinvest' && (
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('menu');
                  setFeedback(null);
                }}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium"
              >
                ← {tr('Kembali ke Pilihan')}
              </button>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <Zap className="size-3.5" /> {tr('Masuk ke Saldo Utama')}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  {tr('Pilih Sumber Dana yang Akan Di-compound:')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSource('profit');
                      setAmount(String(totalProfitBalance));
                      setFeedback(null);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      source === 'profit'
                        ? 'border-emerald-500 bg-emerald-500/10 text-foreground'
                        : 'border-border bg-card text-muted-foreground hover:border-border/80'
                    }`}
                  >
                    <span className="block text-xs font-bold text-foreground">{tr('Saldo Total Profit')}</span>
                    <span className="block text-xs font-mono font-semibold text-emerald-400 mt-0.5">
                      ${totalProfitBalance.toFixed(2)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSource('deposit');
                      setAmount(String(depositBalance));
                      setFeedback(null);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      source === 'deposit'
                        ? 'border-emerald-500 bg-emerald-500/10 text-foreground'
                        : 'border-border bg-card text-muted-foreground hover:border-border/80'
                    }`}
                  >
                    <span className="block text-xs font-bold text-foreground">{tr('Saldo Deposit')}</span>
                    <span className="block text-xs font-mono font-semibold text-foreground mt-0.5">
                      ${depositBalance.toFixed(2)}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    {tr('Jumlah Nominal Masuk ke Saldo Utama (USD)')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setAmount(String(maxAvailable))}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    {tr('Gunakan Semua')} (${maxAvailable.toFixed(2)})
                  </button>
                </div>
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  max={maxAvailable}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="font-mono text-base font-bold"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-secondary/50 text-[11px] text-muted-foreground leading-relaxed">
                {tr(
                  'Dana yang dipindahkan akan langsung ditambahkan ke Saldo Utama dan mulai dihitung bunganya untuk penyaluran otomatis berikutnya pada pukul 14:00 WIB.'
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="outline"
                  className="w-1/3"
                  onClick={() => {
                    setActiveTab('menu');
                    setFeedback(null);
                  }}
                  disabled={submitting}
                >
                  {tr('Batal')}
                </Button>
                <Button
                  className="w-2/3 bg-emerald-500 text-black hover:bg-emerald-400 font-bold"
                  onClick={handleExecuteReinvest}
                  disabled={submitting || maxAvailable <= 0}
                >
                  {submitting ? tr('Memproses...') : tr('Konfirmasi Masuk Saldo Utama')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
