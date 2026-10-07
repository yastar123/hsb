import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, ArrowLeftRight, CircleHelp, Wallet, ReceiptText, House, ChartNoAxesColumn, BriefcaseBusiness, Users, UserRound, ChevronRight, ShieldCheck, CalendarDays, PackageOpen, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDepositContent } from '@/components/deposit-content';
import { useLedger, compressImage, depOf, profitOf, mainOf, rateOf } from '@/components/ledger-content';
import { ArrowUpFromLine } from 'lucide-react';
import { ImageUp } from 'lucide-react';

export function Notice({ text, onClose }: { text: string; onClose: () => void }) {
  return <div className="account-dialog-backdrop" onClick={onClose}><section className="account-dialog" role="dialog" aria-modal="true" aria-label="Informasi" onClick={(e) => e.stopPropagation()}><p>{text}</p><Button onClick={onClose}>Tutup</Button></section></div>;
}

export function BottomNav({ active }: { active: 'Beranda' | 'Pasar' | 'Posisi' | 'Mitra' | 'Profil' }) {
  const [notice, setNotice] = useState('');
  return <><nav className="home-bottom-nav" aria-label="Navigasi utama">
    <Button asChild variant="ghost"><Link to="/beranda" aria-current={active === 'Beranda' ? 'page' : undefined}><House /><span>Beranda</span></Link></Button>
    <Button asChild variant="ghost"><Link to="/pasar" aria-current={active === 'Pasar' ? 'page' : undefined}><ChartNoAxesColumn /><span>Pasar</span></Link></Button>
    <Button asChild variant="ghost"><Link to="/posisi" aria-current={active === 'Posisi' ? 'page' : undefined}><BriefcaseBusiness /><span>Posisi</span></Link></Button>
    <Button asChild variant="ghost"><Link to="/mitra" aria-current={active === 'Mitra' ? 'page' : undefined}><Users /><span>Mitra</span></Link></Button>
    <Button asChild variant="ghost"><Link to="/profil" aria-current={active === 'Profil' ? 'page' : undefined}><UserRound /><span>Profil</span></Link></Button>
  </nav>{notice && <Notice text={notice} onClose={() => setNotice('')} />}</>;
}

function PageHeader({ title }: { title: string }) {
  return <header className="acct-header"><Button asChild variant="ghost" size="icon"><Link to="/posisi" aria-label="Kembali"><ArrowLeft /></Link></Button><h1>{title}</h1></header>;
}

export function PositionScreen() {
  const [tab, setTab] = useState<'Posisi' | 'Tertunda' | 'Riwayat'>('Posisi');
  const [notice, setNotice] = useState('');
  const { users, compound, currentEmail, setCurrentEmail } = useLedger();
  const me = users.find((u) => u.email.toLowerCase() === currentEmail.toLowerCase()) ?? users[0];
  const f = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const switchAcc = () => { if (!users.length) return; const i = users.findIndex((u) => u.id === me?.id); setCurrentEmail(users[(i + 1) % users.length]?.email ?? ""); };
  const marquee = me ? `Compounding harian ${rateOf(me, compound)}% dari saldo utama · ` : 'Lakukan deposit untuk mulai · ';
  return <main className="home-page"><div className="home-shell acct-shell">
    <section className="acct-card">
      <div className="acct-id"><div><h1>{me?.name || 'Belum ada akun'} <small>USD</small></h1><span className="acct-demo-tag">{me?.email || 'Akun'}</span></div><Button variant="outline" size="sm" onClick={users.length > 1 ? switchAcc : () => setNotice('Belum ada akun lain.')}><ArrowLeftRight /> Ganti Akun</Button></div>
      <div className="acct-equity"><div><small>Saldo Utama <CircleHelp /></small><b>{f(me ? mainOf(me) : 0)}</b></div><div><small>Saldo Profit <CircleHelp /></small><b>{f(me ? profitOf(me) : 0)}</b></div></div>
      <div className="acct-margins">{[['Saldo Deposit', f(me ? depOf(me) : 0)], ['Saldo Profit', f(me ? profitOf(me) : 0)], ['Compounding', `${me ? rateOf(me, compound) : 0} % / hari`]].map(([k, v]) => <div key={k}><small>{k} <CircleHelp /></small><b>{v}</b></div>)}</div>
    </section>
    <section className="acct-real"><span className="acct-real-tag">Akun Real</span><div className="acct-marquee"><span>{marquee.repeat(6)}</span></div><Button asChild variant="outline"><Link to="/withdraw">Withdraw</Link></Button></section>
    <nav className="acct-actions"><Link to="/withdraw"><span className="acct-icon"><ArrowUpFromLine /></span>Withdraw</Link><Link to="/deposit"><span className="acct-icon"><Wallet /></span>Deposit</Link><Link to="/riwayat-pembayaran"><span className="acct-icon"><ReceiptText /></span>Riwayat Pembayaran</Link></nav>
    <div className="acct-tabs" role="tablist">{(['Posisi', 'Tertunda', 'Riwayat'] as const).map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t}{t !== 'Riwayat' && <em>0</em>}</button>)}</div>
    <section className="acct-empty"><PackageOpen /><p>{tab === 'Posisi' ? 'Belum ada posisi terbuka.' : tab === 'Tertunda' ? 'Belum ada order tertunda.' : 'Belum ada riwayat transaksi.'}<br />Pilih pasar dan lakukan trading pertama Anda.</p><Button asChild className="acct-pill"><Link to="/pasar">Trade Sekarang</Link></Button></section>
    <BottomNav active="Posisi" />
    {notice && <Notice text={notice} onClose={() => setNotice('')} />}
  </div></main>;
}

const banks = ['BCA', 'BNI', 'Mandiri', 'BRI', 'BSI', 'CIMB', 'Permata'];
export function DepositScreen() {
  const { content: c } = useDepositContent();
  const [sheet, setSheet] = useState(false);
  const [method, setMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [notice, setNotice] = useState('');
  const { submitDeposit } = useLedger();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [proof, setProof] = useState('');
  const [proofErr, setProofErr] = useState('');
  const n = Number(amount) || 0;
  const ready = method && n >= c.minimum && name.trim() && /.+@.+\..+/.test(email) && proof;
  const onFile = async (f?: File) => {
    setProofErr('');
    if (!f) return;
    if (!f.type.startsWith('image/')) { setProofErr('File harus berupa gambar.'); return; }
    if (f.size > 10 * 1024 * 1024) { setProofErr('Ukuran gambar maksimal 10 MB.'); return; }
    try { setProof(await compressImage(f)); } catch { setProofErr('Gambar tidak dapat dibaca.'); }
  };
  const submit = () => {
    submitDeposit({ name: name.trim(), email: email.trim(), method, amount: n, proof });
    setAmount(''); setProof(''); setMethod('');
    setNotice('Bukti transfer terkirim. Deposit Anda menunggu persetujuan admin.');
  };
  return <main className="home-page"><div className="home-shell acct-shell acct-plain">
    <PageHeader title={c.title} />
    <div className="acct-form">
      <button className="acct-select" onClick={() => setSheet(true)}><span>{method || c.methodPlaceholder}{!method && <span className="acct-banks">{c.methods.map((b) => <i key={b.id}>{b.badge}</i>)}</span>}</span><ChevronRight /></button>
      <div className="acct-amount"><div><input inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} aria-label="Jumlah deposit" /><span>{c.currency}</span></div><p><span>{c.rateLabel} <b>1</b></span><span>~ IDR {(n * c.rate).toLocaleString('id-ID')}</span></p>{amount && n < c.minimum && <small>{c.minimumText}</small>}</div>
      <div className="acct-proof">
        <label><span>Nama pemilik akun</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" maxLength={100} /></label>
        <label><span>Email akun</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" maxLength={255} /></label>
        <label className="acct-proof-drop"><span>Bukti transfer</span>
          {proof ? <img src={proof} alt="Pratinjau bukti transfer" /> : <div><ImageUp /><b>Unggah foto / tangkapan layar bukti transfer</b><small>JPG atau PNG, maks 10 MB</small></div>}
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} aria-label="Unggah bukti transfer" />
        </label>
        {proof && <button type="button" className="acct-proof-remove" onClick={() => setProof('')}>Ganti / hapus gambar</button>}
        {proofErr && <small className="acct-proof-err">{proofErr}</small>}
      </div>
    </div>
    <div className="acct-footer"><Button className="acct-submit" disabled={!ready} onClick={submit}>{c.button}</Button><p><ShieldCheck /> {c.securityText} <b>{c.securityBrand}</b></p></div>
    {sheet && <div className="account-dialog-backdrop acct-sheet-wrap" onClick={() => setSheet(false)}><section className="acct-sheet" onClick={(e) => e.stopPropagation()}><header><h2>{c.sheetTitle}</h2><Button variant="ghost" size="icon" aria-label="Tutup" onClick={() => setSheet(false)}><X /></Button></header>{c.methods.map((m) => <button key={m.id} onClick={() => { setMethod(m.label); setSheet(false); }}>{m.label}{method === m.label && <Check />}</button>)}</section></div>}
    {notice && <Notice text={notice} onClose={() => setNotice('')} />}
  </div></main>;
}

export function PaymentHistoryScreen() {
  const [tab, setTab] = useState<'Setoran' | 'Penarikan'>('Setoran');
  const [status, setStatus] = useState('Semua');
  const [from, setFrom] = useState('2026-09-06');
  const [to, setTo] = useState('2026-10-06');
  const [applied, setApplied] = useState(false);
  return <main className="home-page"><div className="home-shell acct-shell acct-plain">
    <PageHeader title="Riwayat Pembayaran" />
    <div className="acct-tabs acct-tabs-left" role="tablist">{(['Setoran', 'Penarikan'] as const).map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => { setTab(t); setApplied(false); }}>{t}</button>)}</div>
    <div className="acct-filter">
      <div><small>Status Pembayaran</small><div className="acct-chips">{['Semua', 'Menunggu', 'Disetujui', 'Gagal'].map((s) => <button key={s} aria-pressed={status === s} onClick={() => setStatus(s)}>{s}</button>)}</div></div>
      <div><small>Tanggal Permintaan</small><div className="acct-dates"><label><CalendarDays /><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Dari tanggal" /> - <input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Sampai tanggal" /></label><Button onClick={() => setApplied(true)}>Terapkan</Button></div></div>
    </div>
    {applied && <p className="acct-history-empty">Tidak ada {tab.toLowerCase()} dengan status “{status}” pada {from} – {to}.</p>}
  </div></main>;
}
