import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, ArrowLeftRight, CircleHelp, Wallet, ReceiptText, House, ChartNoAxesColumn, BriefcaseBusiness, Users, UserRound, ChevronRight, ShieldCheck, CalendarDays, PackageOpen, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDepositContent } from '@/components/deposit-content';
import { useLedger, compressImage, depOf, profitOf, dailyProfitOf, mainOf, rateOf } from '@/components/ledger-content';
import { useBankAccounts } from '@/lib/bank-accounts';
import { useAppPreferences, translate } from '@/components/app-preferences';
import { ArrowUpFromLine } from 'lucide-react';
import { ImageUp } from 'lucide-react';

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
  const [tab, setTab] = useState<'Posisi' | 'Riwayat'>('Posisi');
  const [notice, setNotice] = useState('');
  const { users, compound, currentEmail, transferDepositToMain } = useLedger();
  const { language } = useAppPreferences();
  const tr = (text: string) => translate(text, language);
  const me = users.find((u) => u.email.toLowerCase() === currentEmail.toLowerCase());
  const f = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const compoundNow = async () => {
    if (!me) return;
    try {
      const moved = await transferDepositToMain(me.id);
      if (moved > 0) setNotice(`${tr('Saldo deposit')} $${f(moved)} ${tr('dipindahkan ke saldo utama. Akrual harian mengikuti tarif admin.')}`);
      else if (!compound.enabled) setNotice(tr('Compounding sedang dinonaktifkan admin.'));
      else if (me.status !== 'Aktif') setNotice(tr('Akun belum aktif untuk compounding.'));
      else setNotice(tr('Tidak ada saldo deposit yang dapat dipindahkan.'));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : tr('Pemindahan saldo gagal.'));
    }
  };
  const marquee = me ? `Saldo akun · tarif akrual admin ${rateOf(me, compound)}% per hari · ` : 'Masuk ke akun untuk melihat saldo dan transaksi · ';
  return <main className="home-page"><div className="home-shell acct-shell">
    <section className="acct-card">
      <div className="acct-equity"><div><small>{tr('Saldo Utama')} <CircleHelp /></small><b>{f(me ? mainOf(me) : 0)}</b></div><div><small>{tr('Saldo Profit Harian')} <CircleHelp /></small><b>{f(me ? dailyProfitOf(me) : 0)}</b></div></div>
      <div className="acct-margins">{[['Saldo Deposit', f(me ? depOf(me) : 0)], ['Saldo Total Profit', f(me ? profitOf(me) : 0)], ['Compounding', `${me ? rateOf(me, compound) : 0} % / hari`]].map(([k, v]) => <div key={k}><small>{tr(String(k))} <CircleHelp /></small><b>{v}</b></div>)}</div>
    </section>
    <section className="acct-real"><div className="acct-marquee"><span>{marquee.repeat(6)}</span></div><Button variant="outline" disabled={!me || depOf(me) <= 0 || !compound.enabled || me.status !== 'Aktif'} onClick={compoundNow}><ArrowLeftRight /> {tr('Compounding')}</Button></section>
    <nav className="acct-actions"><Link to="/withdraw"><span className="acct-icon"><ArrowUpFromLine /></span>{tr('Withdraw')}</Link><Link to="/deposit"><span className="acct-icon"><Wallet /></span>{tr('Deposit')}</Link><Link to="/riwayat-pembayaran"><span className="acct-icon"><ReceiptText /></span>{tr('Riwayat Pembayaran')}</Link></nav>
    <div className="acct-tabs" role="tablist">{(['Posisi', 'Riwayat'] as const).map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{tr(t)}{t === 'Posisi' && <em>0</em>}</button>)}</div>
    <section className="acct-empty"><PackageOpen /><p>{tr(tab === 'Posisi' ? 'Belum ada posisi terbuka.' : 'Belum ada riwayat transaksi.')}<br />{tr('Pilih pasar dan lakukan trading pertama Anda.')}</p><Button asChild className="acct-pill"><Link to="/pasar">{tr('Trade Sekarang')}</Link></Button></section>
    <BottomNav active="Posisi" />
    {notice && <Notice text={notice} onClose={() => setNotice('')} />}
  </div></main>;
}

const banks = ['BCA', 'BNI', 'Mandiri', 'BRI', 'BSI', 'CIMB', 'Permata'];
export function DepositScreen() {
  const { content: c } = useDepositContent();
  const { language } = useAppPreferences();
  const tr = (text: string) => translate(text, language);
  const [sheet, setSheet] = useState(false);
  const [method, setMethod] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [notice, setNotice] = useState('');
  const { submitDeposit, currentEmail, users } = useLedger();
  const { list: receivingAccounts } = useBankAccounts();
  const [ownerName, setOwnerName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [transferredAmountIdr, setTransferredAmountIdr] = useState('');
  const [proof, setProof] = useState('');
  const [proofErr, setProofErr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const n = Number(amount) || 0;
  const selectedMethod = c.methods.find((item) => item.label === method);
  const destinationAccounts = receivingAccounts.filter((account) => account.active && account.bank === selectedMethod?.bank && account.holder.trim() && account.number.trim());
  const selectedDestination = destinationAccounts.find((account) => account.id === destinationAccountId)
    ?? (destinationAccounts.length === 1 ? destinationAccounts[0] : undefined);
  const me = users.find((user) => user.email.toLowerCase() === currentEmail.toLowerCase());
  const ready = Boolean(me?.status === 'Aktif' && selectedDestination && method && n >= c.minimum && ownerName.trim() && /^\d{6,30}$/.test(accountNumber) && bankName.trim() && Number(transferredAmountIdr) > 0 && proof && !submitting);
  const onFile = async (f?: File) => {
    setProofErr('');
    if (!f) return;
    if (!f.type.startsWith('image/')) { setProofErr(tr('File harus berupa gambar.')); return; }
    if (f.size > 10 * 1024 * 1024) { setProofErr(tr('Ukuran gambar maksimal 10 MB.')); return; }
    try { setProof(await compressImage(f)); } catch { setProofErr(tr('Gambar tidak dapat dibaca.')); }
  };
  const submit = async () => {
    if (!currentEmail) { setNotice(tr('Masuk ke akun terlebih dahulu untuk mengirim permintaan deposit.')); return; }
    if (me?.status !== 'Aktif') { setNotice(tr('Akun harus diverifikasi admin sebelum mengirim deposit.')); return; }
    if (!selectedDestination) { setNotice(tr('Rekening tujuan belum dipilih atau belum diatur admin.')); return; }
    setSubmitting(true);
    try {
      await submitDeposit({
        name: ownerName.trim(),
        bankName: bankName.trim(),
        accountNumber,
        transferredAmountIdr: Number(transferredAmountIdr),
        destinationAccountId: selectedDestination.id,
        method,
        amount: n,
        proof,
      });
      setAmount(''); setProof(''); setMethod(''); setDestinationAccountId(''); setOwnerName(''); setAccountNumber(''); setBankName(''); setTransferredAmountIdr('');
      setNotice(tr('Permintaan deposit tersimpan dan menunggu pencocokan transfer oleh admin.'));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : tr('Permintaan deposit gagal.'));
    } finally {
      setSubmitting(false);
    }
  };
  return <main className="home-page"><div className="home-shell acct-shell acct-plain">
    <PageHeader title={tr(c.title)} />
    <div className="acct-form">
      <button className="acct-select" onClick={() => setSheet(true)}><span>{method ? tr(method) : tr(c.methodPlaceholder)}{!method && <span className="acct-banks">{c.methods.map((b) => <i key={b.id}>{b.badge}</i>)}</span>}</span><ChevronRight /></button>
      {method && <section className="acct-deposit-destination" aria-live="polite">
        <h2>{tr('Rekening Tujuan')}</h2>
        {destinationAccounts.length
          ? destinationAccounts.map((account) => <div className="acct-deposit-destination-card" key={account.id}>
              <b>{account.bank}</b><span>{tr('Nama rekening:')} {account.holder || tr('Belum diatur')}</span><span>{tr('Nomor rekening:')} <strong>{account.number || tr('Belum diatur')}</strong></span>
            </div>)
          : <p>{tr('Rekening tujuan untuk metode ini belum diatur oleh admin.')}</p>}
      </section>}
      {destinationAccounts.length > 1 && <label className="acct-proof"><span>{tr('Pilih rekening tujuan')}</span><select value={destinationAccountId} onChange={(event) => setDestinationAccountId(event.target.value)}><option value="">{tr('Pilih rekening')}</option>{destinationAccounts.map((account) => <option key={account.id} value={account.id}>{account.bank} · {account.holder} · {account.number}</option>)}</select></label>}
      <div className="acct-amount"><div><input inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} aria-label={tr('Jumlah deposit')} /><span>{c.currency}</span></div><p><span>{tr(c.rateLabel)} <b>1</b></span><span>~ IDR {(n * c.rate).toLocaleString('id-ID')}</span></p>{amount && n < c.minimum && <small>{tr(c.minimumText)}</small>}</div>
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
    <div className="acct-footer"><Button className="acct-submit" disabled={!ready} onClick={submit}>{submitting ? tr('Memproses...') : tr(c.button)}</Button><p><ShieldCheck /> {tr(c.securityText)} <b>{c.securityBrand}</b></p><small className="acct-demo-disclosure">{tr(me?.status === 'Aktif' ? 'Saldo hanya dikreditkan setelah admin mencocokkan transfer dengan mutasi bank.' : 'Akun perlu diverifikasi admin sebelum dapat melakukan transaksi keuangan.')}</small></div>
    {sheet && <div className="account-dialog-backdrop acct-sheet-wrap" onClick={() => setSheet(false)}><section className="acct-sheet" onClick={(e) => e.stopPropagation()}><header><h2>{tr(c.sheetTitle)}</h2><Button variant="ghost" size="icon" aria-label={tr('Tutup')} onClick={() => setSheet(false)}><X /></Button></header>{c.methods.map((m) => <button key={m.id} onClick={() => { setMethod(m.label); setDestinationAccountId(''); setSheet(false); }}>{tr(m.label)}{method === m.label && <Check />}</button>)}</section></div>}
    {notice && <Notice text={notice} onClose={() => setNotice('')} />}
  </div></main>;
}

export function PaymentHistoryScreen() {
  const [tab, setTab] = useState<'Setoran' | 'Penarikan'>('Setoran');
  const [status, setStatus] = useState('Semua');
  const [from, setFrom] = useState('2026-09-06');
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [applied, setApplied] = useState(false);
  const { deposits, withdrawals, users, currentEmail } = useLedger();
  const { language } = useAppPreferences();
  const tr = (text: string) => translate(text, language);
  const me = users.find((u) => u.email.toLowerCase() === currentEmail.toLowerCase());
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
  return <main className="home-page"><div className="home-shell acct-shell acct-plain">
    <PageHeader title="Riwayat Pembayaran" />
    <div className="acct-tabs acct-tabs-left" role="tablist">{(['Setoran', 'Penarikan'] as const).map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => { setTab(t); setApplied(false); }}>{tr(t)}</button>)}</div>
    <div className="acct-filter">
      <div><small>{tr('Status Pembayaran')}</small><div className="acct-chips">{['Semua', 'Menunggu', 'Diproses', 'Disetujui', 'Gagal'].map((s) => <button key={s} aria-pressed={status === s} onClick={() => setStatus(s)}>{tr(s)}</button>)}</div></div>
      <div><small>{tr('Tanggal Permintaan')}</small><div className="acct-dates"><label><CalendarDays /><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label={tr('Dari tanggal')} /> - <input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label={tr('Sampai tanggal')} /></label><Button onClick={() => setApplied(true)}>{tr('Terapkan')}</Button></div></div>
    </div>
    <p className="prof-hint">{tr('Status deposit dan penarikan mengikuti pemeriksaan admin. Status selesai tidak menggantikan bukti mutasi bank.')}</p>
    {visibleRows.length ? <section className="space-y-2">{visibleRows.map((row) => <article key={row.id} className="rounded-xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><b>{tab === 'Setoran' ? (row as (typeof deposits)[number]).method : (row as (typeof withdrawals)[number]).bank}</b><b>${row.amount.toFixed(2)} USD</b></div>
      <p className="mt-1 text-sm text-muted-foreground">{new Date(row.date).toLocaleString('id-ID')} · {row.status}</p>
      {tab === 'Penarikan' && <p className="mt-1 text-sm">{(row as (typeof withdrawals)[number]).account}</p>}
    </article>)}</section> : <p className="acct-history-empty">{applied ? `Tidak ada ${tab.toLowerCase()} dengan status “${status}” pada ${from} – ${to}.` : `Belum ada riwayat ${tab.toLowerCase()}.`}</p>}
  </div></main>;
}
