import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, ArrowLeftRight, CircleHelp, Wallet, ReceiptText, House, ChartNoAxesColumn, BriefcaseBusiness, Users, UserRound, ChevronRight, ShieldCheck, CalendarDays, PackageOpen, Check, X, TrendingUp, Zap, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDepositContent } from '@/components/deposit-content';
import { useLedger, compressImage, depOf, profitOf, dailyProfitOf, mainOf, rateOf } from '@/components/ledger-content';
import { useBankAccounts } from '@/lib/bank-accounts';
import { useAppPreferences, translate } from '@/components/app-preferences';
import { ArrowUpFromLine } from 'lucide-react';
import { ImageUp } from 'lucide-react';
import { TradingTerminalSection } from '@/components/market-screens';

export function Notice({ text, onClose }: { text: string; onClose: () => void }) {
  return <div className="account-dialog-backdrop" onClick={onClose}><section className="account-dialog" role="dialog" aria-modal="true" aria-label="Informasi" onClick={(e) => e.stopPropagation()}><p>{text}</p><Button onClick={onClose}>Tutup</Button></section></div>;
}

export function BottomNav({ active }: { active: 'Beranda' | 'Pasar' | 'Posisi' | 'Mitra' | 'Profil' }) {
  const [notice, setNotice] = useState('');
  const { language } = useAppPreferences();
  const tr = (text: string) => translate(text, language);
  return <><nav className="home-bottom-nav" aria-label="Navigasi utama">
    <Button asChild variant="ghost"><Link to="/beranda" aria-current={active === 'Beranda' ? 'page' : undefined}><House /><span>{tr('Beranda')}</span></Link></Button>
    <Button asChild variant="ghost"><Link to="/pasar" aria-current={active === 'Pasar' ? 'page' : undefined}><ChartNoAxesColumn /><span>{tr('Pasar')}</span></Link></Button>
    <Button asChild variant="ghost"><Link to="/posisi" aria-current={active === 'Posisi' ? 'page' : undefined}><BriefcaseBusiness /><span>{tr('Posisi')}</span></Link></Button>
    <Button asChild variant="ghost"><Link to="/mitra" aria-current={active === 'Mitra' ? 'page' : undefined}><Users /><span>{tr('Mitra')}</span></Link></Button>
    <Button asChild variant="ghost"><Link to="/profil" aria-current={active === 'Profil' ? 'page' : undefined}><UserRound /><span>{tr('Profil')}</span></Link></Button>
  </nav>{notice && <Notice text={notice} onClose={() => setNotice('')} />}</>;
}

function PageHeader({ title }: { title: string }) {
  const { language } = useAppPreferences();
  return <header className="acct-header"><Button asChild variant="ghost" size="icon"><Link to="/posisi" aria-label={translate('Kembali', language)}><ArrowLeft /></Link></Button><h1>{translate(title, language)}</h1></header>;
}

export function PositionScreen() {
  const { language } = useAppPreferences();
  const tr = (text: string) => translate(text, language);
  return <main className="home-page"><div className="home-shell acct-shell">
    <TradingTerminalSection />
    <BottomNav active="Posisi" />
  </div></main>;
}

const banks = ['BCA', 'BNI', 'Mandiri', 'BRI', 'BSI', 'CIMB', 'Permata'];
export function DepositScreen() {
  const { content: c } = useDepositContent();
  const { language } = useAppPreferences();
  const tr = (text: string) => translate(text, language);
  const [sheet, setSheet] = useState(false);
  const [method, setMethod] = useState(c.methods[0]?.label || 'Transfer Bank BCA');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [notice, setNotice] = useState('');
  const { submitDeposit, currentEmail, currentUser, users } = useLedger();
  const { list: receivingAccounts } = useBankAccounts();
  const [ownerName, setOwnerName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('BCA');
  const [transferredAmountIdr, setTransferredAmountIdr] = useState('');
  const [proof, setProof] = useState('');
  const [proofErr, setProofErr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const n = Number(amount) || 0;

  useEffect(() => {
    if (!method && c.methods.length > 0) {
      setMethod(c.methods[0]?.label || '');
      if (c.methods[0]?.bank) setBankName(c.methods[0].bank);
    }
  }, [c.methods, method]);

  const selectedMethod = c.methods.find((item) => item.label === method) || c.methods[0];
  const destinationAccounts = receivingAccounts.filter((account) => 
    account.active && 
    (!selectedMethod?.bank || account.bank.toLowerCase() === selectedMethod.bank.toLowerCase()) && 
    account.holder.trim() && 
    account.number.trim()
  );
  const selectedDestination = destinationAccounts.find((account) => account.id === destinationAccountId)
    ?? destinationAccounts[0]
    ?? receivingAccounts.find((a) => a.active)
    ?? { id: 'default-bca', bank: 'BCA', holder: 'PT WebullXAU INVESTASI MANDIRI', number: '1234567890', active: true };

  const me = users.find((user) => user.email.toLowerCase() === (currentEmail || currentUser?.email || '').toLowerCase()) || currentUser || users[0];

  useEffect(() => {
    if (!ownerName && (me?.name || currentUser?.name)) {
      setOwnerName(me?.name || currentUser?.name || '');
    }
  }, [me?.name, currentUser?.name, ownerName]);

  const handleAmountChange = (val: string) => {
    const cleaned = val.replace(/[^\d.]/g, '');
    setAmount(cleaned);
    const num = Number(cleaned) || 0;
    if (num > 0) {
      setTransferredAmountIdr(String(Math.round(num * (c.rate || 18000))));
    } else {
      setTransferredAmountIdr('');
    }
  };

  const selectMethod = (mLabel: string) => {
    setMethod(mLabel);
    setDestinationAccountId('');
    setSheet(false);
    const mObj = c.methods.find((item) => item.label === mLabel);
    if (mObj?.bank) {
      setBankName(mObj.bank);
    }
  };

  const onFile = async (f?: File) => {
    setProofErr('');
    if (!f) return;
    if (!f.type.startsWith('image/')) { setProofErr(tr('File harus berupa gambar.')); return; }
    if (f.size > 10 * 1024 * 1024) { setProofErr(tr('Ukuran gambar maksimal 10 MB.')); return; }
    try { setProof(await compressImage(f)); } catch { setProofErr(tr('Gambar tidak dapat dibaca.')); }
  };

  const submit = async () => {
    if (me?.status === 'Diblokir' || currentUser?.status === 'Diblokir') {
      setNotice(tr('Akun Anda sedang diblokir. Hubungi layanan pelanggan.'));
      return;
    }
    const currentMethod = method || c.methods[0]?.label || 'Transfer Bank BCA';
    if (!n || n <= 0) {
      setNotice(tr('Silakan masukkan jumlah deposit yang ingin disetorkan.'));
      return;
    }
    const minVal = Number(c.minimum) || 100;
    const currentRate = c.rate || 18000;
    if (n < minVal) {
      setNotice(tr(`Jumlah deposit minimal adalah $${minVal.toLocaleString('id-ID')} USD (~ IDR ${(minVal * currentRate).toLocaleString('id-ID')}).`));
      return;
    }
    if (!ownerName.trim()) {
      setNotice(tr('Silakan masukkan nama pemilik rekening pengirim.'));
      return;
    }
    const cleanAccount = accountNumber.replace(/\D/g, '');
    if (cleanAccount.length < 4) {
      setNotice(tr('Silakan masukkan nomor rekening pengirim yang valid (minimal 4 digit).'));
      return;
    }
    const effectiveBankName = bankName.trim() || selectedMethod?.bank || 'BCA';
    if (!proof) {
      setNotice(tr('Silakan unggah foto atau gambar bukti transfer terlebih dahulu.'));
      return;
    }

    const finalIdr = Number(transferredAmountIdr) > 0 ? Number(transferredAmountIdr) : Math.round(n * currentRate);
    setSubmitting(true);
    try {
      await submitDeposit({
        name: ownerName.trim(),
        bankName: effectiveBankName,
        accountNumber: cleanAccount,
        transferredAmountIdr: finalIdr,
        destinationAccountId: selectedDestination.id,
        method: currentMethod,
        amount: n,
        proof,
      });
      setAmount('');
      setProof('');
      setTransferredAmountIdr('');
      setNotice(tr('Permintaan deposit berhasil dikirim dan menunggu pencocokan mutasi.'));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : tr('Permintaan deposit gagal.'));
    } finally {
      setSubmitting(false);
    }
  };

  return <main className="home-page"><div className="home-shell acct-shell acct-plain">
    <PageHeader title={tr(c.title)} />
    <div className="acct-form">
      <button type="button" className="acct-select" onClick={() => setSheet(true)}><span>{method ? tr(method) : tr(c.methodPlaceholder)}{!method && <span className="acct-banks">{c.methods.map((b) => <i key={b.id}>{b.badge}</i>)}</span>}</span><ChevronRight /></button>
      {method && <section className="acct-deposit-destination" aria-live="polite">
        <h2>{tr('Rekening Tujuan')}</h2>
        {destinationAccounts.length
          ? destinationAccounts.map((account) => <div className="acct-deposit-destination-card" key={account.id}>
              <b>{account.bank}</b><span>{tr('Nama rekening:')} {account.holder || tr('Belum diatur')}</span><span>{tr('Nomor rekening:')} <strong>{account.number || tr('Belum diatur')}</strong></span>
            </div>)
          : <div className="acct-deposit-destination-card">
              <b>{selectedDestination.bank}</b><span>{tr('Nama rekening:')} {selectedDestination.holder}</span><span>{tr('Nomor rekening:')} <strong>{selectedDestination.number}</strong></span>
            </div>}
      </section>}
      {destinationAccounts.length > 1 && <label className="acct-proof"><span>{tr('Pilih rekening tujuan')}</span><select value={destinationAccountId} onChange={(event) => setDestinationAccountId(event.target.value)}><option value="">{tr('Pilih rekening')}</option>{destinationAccounts.map((account) => <option key={account.id} value={account.id}>{account.bank} · {account.holder} · {account.number}</option>)}</select></label>}
      <div className="acct-amount">
        <div className="acct-amount-header">
          <span className="font-semibold text-muted-foreground">{tr('Nominal Deposit (USD)')}</span>
          <span className="acct-amount-min-badge">
            {tr(`Min. $${(c.minimum || 100).toLocaleString('id-ID')} (~ Rp ${((c.minimum || 100) * (c.rate || 18000)).toLocaleString('id-ID')})`)}
          </span>
        </div>
        <div className="acct-amount-box"><input inputMode="decimal" placeholder={String(c.minimum || 100)} value={amount} onChange={(e) => handleAmountChange(e.target.value)} aria-label={tr('Jumlah deposit')} /><span>{c.currency}</span></div>
        <div className="acct-presets">
          {[100, 200, 500, 1000].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleAmountChange(String(preset))}
              className={`acct-preset-chip ${Number(amount) === preset ? 'active' : ''}`}
            >
              ${preset.toLocaleString('id-ID')}
            </button>
          ))}
        </div>
        <p><span>{tr(c.rateLabel)} <b>1</b></span><span>~ IDR {(n * (c.rate || 18000)).toLocaleString('id-ID')}</span></p>
        {amount && n < (c.minimum || 100) && <small className="text-destructive font-semibold block mt-2">{tr(c.minimumText || `Minimal deposit $${(c.minimum || 100).toLocaleString('id-ID')} (~ Rp ${((c.minimum || 100) * (c.rate || 18000)).toLocaleString('id-ID')})`)}</small>}
      </div>
      <div className="acct-proof">
        <label><span>{tr('Nama pemilik rekening')}</span><input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder={tr('Nama sesuai rekening')} maxLength={100} /></label>
        <label><span>{tr('Nomor rekening')}</span><input inputMode="numeric" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 30))} placeholder={tr('Nomor rekening pengirim')} maxLength={30} /></label>
        <label><span>{tr('Bank rekening')}</span><input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder={tr('Nama bank pengirim')} maxLength={100} /></label>
        <label><span>{tr('Jumlah transfer aktual (IDR)')}</span><input inputMode="decimal" value={transferredAmountIdr} onChange={(e) => setTransferredAmountIdr(e.target.value.replace(/[^\d.]/g, ''))} placeholder={tr('Masukkan jumlah sesuai mutasi bank')} /></label>
        <label className="acct-proof-drop"><span>{tr('Bukti transfer')}</span>
          {proof ? <img src={proof} alt={tr('Pratinjau bukti transfer')} /> : <div><ImageUp /><b>{tr('Unggah foto / tangkapan layar bukti transfer')}</b><small>{tr('JPG atau PNG, maks 10 MB')}</small></div>}
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} aria-label={tr('Unggah bukti transfer')} />
        </label>
        {proof && <button type="button" className="acct-proof-remove" onClick={() => setProof('')}>{tr('Ganti / hapus gambar')}</button>}
        {proofErr && <small className="acct-proof-err">{proofErr}</small>}
      </div>
    </div>
    <div className="acct-footer"><Button type="button" className="acct-submit cursor-pointer font-bold text-base bg-primary text-primary-foreground hover:brightness-105 active:scale-[0.99] transition-all shadow-md" disabled={submitting} onClick={submit}>{submitting ? tr('Memproses...') : tr(c.button)}</Button><p><ShieldCheck /> {tr(c.securityText)} <b>{c.securityBrand}</b></p><small className="acct-demo-disclosure">{tr('Deposit diproses secara aman dan langsung terhubung dengan akun Anda.')}</small></div>
    {sheet && <div className="account-dialog-backdrop acct-sheet-wrap" onClick={() => setSheet(false)}><section className="acct-sheet" onClick={(e) => e.stopPropagation()}><header><h2>{tr(c.sheetTitle)}</h2><Button variant="ghost" size="icon" aria-label={tr('Tutup')} onClick={() => setSheet(false)}><X /></Button></header>{c.methods.map((m) => <button key={m.id} onClick={() => selectMethod(m.label)}>{tr(m.label)}{method === m.label && <Check />}</button>)}</section></div>}
    {notice && <Notice text={notice} onClose={() => setNotice('')} />}
  </div></main>;
}

export function PaymentHistoryScreen() {
  const [tab, setTab] = useState<'Setoran' | 'Penarikan' | 'Compounding'>('Setoran');
  const [status, setStatus] = useState('Semua');
  const [from, setFrom] = useState('2026-09-06');
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [applied, setApplied] = useState(false);
  const { deposits, withdrawals, dailyAccruals = [], users, currentEmail } = useLedger();
  const { language } = useAppPreferences();
  const tr = (text: string) => translate(text, language);
  const me = users.find((u) => u.email.toLowerCase() === currentEmail.toLowerCase());

  const [compoundingHistory, setCompoundingHistory] = useState<typeof dailyAccruals>([]);

  useEffect(() => {
    let mounted = true;
    fetch('/api/account/compounding-history', { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (mounted && Array.isArray(data?.history)) {
          setCompoundingHistory(data.history);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [tab]);

  const rows = tab === 'Setoran'
    ? deposits.filter((r) => r.email.toLowerCase() === me?.email.toLowerCase())
    : withdrawals.filter((r) => r.userId === me?.id);

  const visibleRows = rows.filter((r) => {
    const date = r.date.slice(0, 10);
    if (applied && (date < from || date > to)) return false;
    if (status === 'Semua') return true;
    if (tab === 'Setoran') return status === 'Gagal' ? r.status === 'Ditolak' : status === r.status;
    if (status === 'Disetujui') return r.status === 'Berhasil';
    if (status === 'Gagal') return r.status === 'Ditolak';
    return status === r.status;
  });

  const allCompounding = compoundingHistory.length > 0 ? compoundingHistory : dailyAccruals;
  const userCompounding = allCompounding.filter((r) => !me?.id || r.userId === me?.id);
  const visibleCompounding = userCompounding.filter((r) => {
    const date = (r.date || '').slice(0, 10);
    if (applied && (date < from || date > to)) return false;
    return true;
  });
  const totalCompoundingProfit = visibleCompounding.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

  return (
    <main className="home-page">
      <div className="home-shell acct-shell acct-plain">
        <PageHeader title="Riwayat Pembayaran" />
        <div className="acct-tabs acct-tabs-left" role="tablist">
          {(['Setoran', 'Penarikan', 'Compounding'] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => {
                setTab(t);
                setApplied(false);
              }}
            >
              {t === 'Compounding' ? (
                <span className="flex items-center gap-1.5">
                  <Zap className="size-3.5 text-primary" />
                  {tr(t)}
                </span>
              ) : (
                tr(t)
              )}
            </button>
          ))}
        </div>

        {tab === 'Compounding' ? (
          <div className="space-y-3 mt-3">
            {/* Compounding metric summary */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 p-3.5 rounded-xl bg-card border border-border">
              <div>
                <span className="text-[11px] text-muted-foreground block">{tr('Total Profit Compounding')}</span>
                <span className="text-lg font-black text-emerald-400 font-mono mt-0.5 block">
                  +${totalCompoundingProfit.toFixed(2)} USD
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">{tr('Jumlah Penyaluran')}</span>
                <span className="text-lg font-black text-foreground font-mono mt-0.5 block">
                  {visibleCompounding.length} {tr('Hari')}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/50">
                <span className="text-[11px] text-muted-foreground block">{tr('Jadwal Eksekusi')}</span>
                <span className="text-xs font-bold text-foreground mt-1 flex items-center gap-1">
                  <Clock className="size-3.5 text-primary" /> 14:00 WIB (1x/hari)
                </span>
              </div>
            </div>

            {/* Date filter */}
            <div className="acct-filter">
              <div>
                <small>{tr('Rentang Tanggal Penyaluran')}</small>
                <div className="acct-dates">
                  <label>
                    <CalendarDays />
                    <input
                      type="date"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      aria-label={tr('Dari tanggal')}
                    />{' '}
                    -{' '}
                    <input
                      type="date"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      aria-label={tr('Sampai tanggal')}
                    />
                  </label>
                  <Button onClick={() => setApplied(true)}>{tr('Terapkan')}</Button>
                </div>
              </div>
            </div>

            <p className="prof-hint flex items-center gap-1.5 text-xs text-muted-foreground">
              <Zap className="size-3.5 text-primary shrink-0" />
              {tr(
                'Estimasi profit harian secara otomatis disalurkan dan disimpan ke Saldo Total Profit setiap hari tepat pukul 14:00 WIB.',
              )}
            </p>

            {visibleCompounding.length ? (
              <section className="space-y-2.5">
                {visibleCompounding.map((row) => (
                  <article
                    key={row.id}
                    className="rounded-xl border border-border bg-card p-4 space-y-2 shadow-sm transition-colors hover:border-primary/40"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                          <TrendingUp className="size-5" />
                        </div>
                        <div>
                          <b className="text-sm font-bold text-foreground block">{tr('Profit Compounding Harian')}</b>
                          <span className="text-xs text-muted-foreground">
                            {tr('Tarif:')}{' '}
                            <span className="font-semibold text-foreground font-mono">
                              {row.ratePercent}% / hari
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <b className="text-base font-extrabold text-emerald-400 font-mono block">
                          +${row.amount.toFixed(2)} USD
                        </b>
                        <span className="text-[11px] text-muted-foreground">
                          {tr('Masuk ke Total Profit')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5 font-mono">
                        <Clock className="size-3 text-primary" />
                        {row.date} · 14:00 WIB
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="size-3" />
                        {tr('Tersalurkan')}
                      </span>
                    </div>

                    {row.balanceAfter > 0 && (
                      <div className="text-[11px] text-muted-foreground/90 flex justify-between pt-0.5">
                        <span>{tr('Saldo Utama setelah penyaluran:')}</span>
                        <span className="font-mono font-semibold text-foreground">
                          ${row.balanceAfter.toFixed(2)} USD
                        </span>
                      </div>
                    )}
                  </article>
                ))}
              </section>
            ) : (
              <p className="acct-history-empty">
                {applied
                  ? tr(`Tidak ada riwayat compounding pada rentang ${from} – ${to}.`)
                  : tr('Belum ada riwayat compounding harian yang disalurkan ke akun Anda.')}
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="acct-filter">
              <div>
                <small>{tr('Status Pembayaran')}</small>
                <div className="acct-chips">
                  {['Semua', 'Menunggu', 'Diproses', 'Disetujui', 'Gagal'].map((s) => (
                    <button key={s} aria-pressed={status === s} onClick={() => setStatus(s)}>
                      {tr(s)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <small>{tr('Tanggal Permintaan')}</small>
                <div className="acct-dates">
                  <label>
                    <CalendarDays />
                    <input
                      type="date"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      aria-label={tr('Dari tanggal')}
                    />{' '}
                    -{' '}
                    <input
                      type="date"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      aria-label={tr('Sampai tanggal')}
                    />
                  </label>
                  <Button onClick={() => setApplied(true)}>{tr('Terapkan')}</Button>
                </div>
              </div>
            </div>
            <p className="prof-hint">
              {tr(
                'Status deposit dan penarikan mengikuti pemeriksaan admin. Status selesai tidak menggantikan bukti mutasi bank.',
              )}
            </p>
            {visibleRows.length ? (
              <section className="space-y-2">
                {visibleRows.map((row) => (
                  <article key={row.id} className="rounded-xl border border-border bg-background p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <b>
                        {tab === 'Setoran'
                          ? (row as (typeof deposits)[number]).method
                          : (row as (typeof withdrawals)[number]).bank}
                      </b>
                      <b>${row.amount.toFixed(2)} USD</b>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(row.date).toLocaleString('id-ID')} · {row.status}
                    </p>
                    {tab === 'Penarikan' && (
                      <p className="mt-1 text-sm">{(row as (typeof withdrawals)[number]).account}</p>
                    )}
                  </article>
                ))}
              </section>
            ) : (
              <p className="acct-history-empty">
                {applied
                  ? `Tidak ada ${tab.toLowerCase()} dengan status “${status}” pada ${from} – ${to}.`
                  : `Belum ada riwayat ${tab.toLowerCase()}.`}
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
