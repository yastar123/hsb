import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, CalendarDays, Check, ChevronRight, Copy, Crown, Eye, EyeOff, FileBarChart, Landmark, LockKeyhole, LogOut, Moon, Percent, Signal, TrendingUp, Wallet, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomNav, Notice } from '@/components/account-pages';
import { isValidPassword, passwordRules } from '@/lib/account-validation';

const UID = '95279505';

function Header({ title, back = '/profil' }: { title: string; back?: '/profil' }) {
  return <header className="acct-header"><Button asChild variant="ghost" size="icon"><Link to={back} aria-label="Kembali"><ArrowLeft /></Link></Button><h1>{title}</h1></header>;
}

function Countdown() {
  const [left, setLeft] = useState(18 * 60 + 22);
  useEffect(() => { const t = setInterval(() => setLeft((v) => (v > 0 ? v - 1 : 0)), 1000); return () => clearInterval(t); }, []);
  const parts = [Math.floor(left / 3600), Math.floor((left % 3600) / 60), left % 60].map((n) => String(n).padStart(2, '0'));
  return <span className="prof-timer">{parts.map((p, i) => <b key={i}>{p}</b>)}</span>;
}

export function ProfileScreen() {
  const [notice, setNotice] = useState('');
  const navigate = useNavigate();
  const soon = (name: string) => () => setNotice(`${name} belum tersedia pada pratinjau ini.`);
  const shortcuts = [
    { label: 'Trade', icon: TrendingUp, to: '/pasar' as const },
    { label: 'Copy Signals', icon: Signal, to: '/sinyal-trading' as const },
    { label: 'Deposit', icon: Wallet, to: '/deposit' as const },
    { label: 'Kalender Ekonomi', icon: CalendarDays, to: '/kalender-ekonomi' as const },
    { label: 'Daily Report', icon: FileBarChart, to: '/daily-report' as const },
    { label: 'Premium Program', icon: Crown },
    { label: 'Promo', icon: Percent, to: '/promo' as const },
    { label: 'Smart Trader', icon: Sparkles, to: '/smart-trader' as const },
  ];
  const copy = async () => { try { await navigator.clipboard.writeText(UID); setNotice('UID disalin.'); } catch { setNotice('UID belum dapat disalin.'); } };
  return <main className="home-page"><div className="home-shell prof-shell">
    <section className="prof-head">
      <img src="/hsb-mark.svg" width="34" height="34" alt="" />
      <div><h1>Hello Demo</h1><p>UID: {UID} <button onClick={copy} aria-label="Salin UID"><Copy /></button> <span className="prof-unverified">Belum Terverifikasi</span></p></div>
      <Moon className="prof-moon" aria-hidden />
    </section>
    <section className="prof-bonus">
      <div className="prof-bonus-top"><span className="prof-real">Lanjutkan real</span><small>BERAKHIR DALAM <Countdown /></small></div>
      <p>hingga <b>$350</b> Bonus Selamat Datang</p>
      <div className="prof-progress"><i /><small>Langkah 3 dari 4</small><Link to="/register">Verifikasi ›</Link></div>
    </section>
    <nav className="prof-grid">{shortcuts.map(({ label, icon: Icon, to }) => to
      ? <Link key={label} to={to}><span><Icon /></span>{label}</Link>
      : <button key={label} onClick={soon(label)}><span><Icon /></span>{label}</button>)}</nav>
    <section className="prof-list">
      <h2>Pusat Klien</h2>
      <Link to="/informasi-akun">Informasi Anda<ChevronRight /></Link>
      <button onClick={soon('Dokumen')}>Dokumen<ChevronRight /></button>
      <Link to="/bank-penarikan">Bank Penarikan<ChevronRight /></Link>
      <Link to="/layanan-pelanggan">Layanan Pelanggan<ChevronRight /></Link>
      <h2>Pengaturan</h2>
      <Link to="/ganti-kata-sandi">Ganti Password<ChevronRight /></Link>
      <Link to="/bahasa">Bahasa<ChevronRight /></Link>
    </section>
    <button className="prof-logout" onClick={() => navigate({ to: '/login' })}><LogOut /> Keluar</button>
    <BottomNav active="Profil" />
    {notice && <Notice text={notice} onClose={() => setNotice('')} />}
  </div></main>;
}

export function AccountInfoScreen() {
  const rows = [['Nama', 'Demo'], ['Email', ''], ['Nomor Telepon', '85366195381'], ['Nomor ID', ''], ['Tipe ID', ''], ['Tanggal Lahir', ''], ['Waktu Pendaftaran', '2026-10-06 19:47:25']];
  return <main className="home-page"><div className="home-shell acct-shell acct-plain">
    <Header title="Informasi Anda" />
    <div className="prof-fields">{rows.map(([k, v]) => <div key={k} className="prof-field"><small>{k}</small><p>{v || '\u00a0'}</p></div>)}</div>
  </div></main>;
}

const LANGS = [{ id: 'en', label: 'English', flag: 'prof-flag-en' }, { id: 'id', label: 'Bahasa Indonesia', flag: 'prof-flag-id' }, { id: 'zh', label: '汉语', flag: 'prof-flag-zh' }];
export function LanguageScreen() {
  const [lang, setLang] = useState('id');
  return <main className="home-page"><div className="home-shell acct-shell acct-plain">
    <Header title="Bahasa" />
    <div className="prof-langs" role="radiogroup" aria-label="Bahasa">{LANGS.map((l) => <button key={l.id} role="radio" aria-checked={lang === l.id} onClick={() => setLang(l.id)}><i className={`prof-flag ${l.flag}`} />{l.label}<span><Check /></span></button>)}</div>
    {lang !== 'id' && <p className="prof-hint">Terjemahan bahasa ini belum tersedia; tampilan tetap dalam Bahasa Indonesia.</p>}
  </div></main>;
}

function PwField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return <div className="account-field"><span className="account-field-icon"><LockKeyhole /></span><input className="prof-pw-input" aria-label={label} placeholder={label} type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} /><Button type="button" variant="ghost" size="icon" className="account-eye" aria-label={show ? 'Sembunyikan' : 'Tampilkan'} onClick={() => setShow(!show)}>{show ? <Eye /> : <EyeOff />}</Button></div>;
}

export function ChangePasswordScreen() {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [conf, setConf] = useState('');
  const [notice, setNotice] = useState('');
  const mismatch = conf.length > 0 && conf !== next;
  const ready = cur && isValidPassword(next) && conf === next;
  const submit = (e: FormEvent) => { e.preventDefault(); setNotice('Penggantian kata sandi belum terhubung ke layanan akun.'); };
  return <main className="account-page"><div className="account-shell">
    <header className="account-banner"><Link to="/beranda" className="account-brand"><img src="/hsb-mark.svg" width="25" height="25" alt="" />HSB</Link></header>
    <section className="account-content">
      <div className="account-heading"><Button asChild variant="ghost" size="icon"><Link to="/profil" aria-label="Kembali"><ArrowLeft /></Link></Button><h1>Ganti Kata Sandi</h1></div>
      <form className="account-form prof-pw-form" onSubmit={submit}>
        <PwField label="Masukkan Kata Sandi Saat Ini" value={cur} onChange={setCur} />
        <PwField label="Masukkan Kata Sandi Baru" value={next} onChange={setNext} />
        <ul className="account-password-rules">{passwordRules.map((r) => <li key={r.label} className={r.valid(next) ? 'account-rule-valid' : ''}><Check />{r.label}</li>)}</ul>
        <PwField label="Konfirmasi Kata Sandi Baru" value={conf} onChange={setConf} />
        {mismatch && <p className="prof-error">Konfirmasi kata sandi tidak sama.</p>}
        <Button type="submit" className="account-submit" disabled={!ready}>Ganti Kata Sandi</Button>
      </form>
      <p className="prof-help">Butuh bantuan? <Link to="/layanan-pelanggan">Layanan Pelanggan</Link></p>
    </section>
    {notice && <Notice text={notice} onClose={() => setNotice('')} />}
  </div></main>;
}

export function CustomerServiceScreen() {
  const [notice, setNotice] = useState('');
  const items = [
    { k: 'Nomor Telepon', v: '(+62) 21-501-22288', btn: 'Telepon', href: 'tel:+622150122288' },
    { k: 'Whatsapp', v: 'http://wa.me/628211019087', btn: 'Hubungi', href: 'https://wa.me/628211019087' },
    { k: 'Email', v: 'cs@hsb.co.id', btn: 'Hubungi', href: 'mailto:cs@hsb.co.id' },
    { k: 'Ngobrol dengan Agen kami', v: 'Live Chat', btn: 'Hubungi' },
  ];
  return <main className="home-page"><div className="home-shell acct-shell acct-plain">
    <Header title="Layanan Pelanggan" />
    <div className="prof-cs">
      <h2>Hubungi Layanan Pelanggan</h2>
      <p className="prof-hint">Jika Anda membutuhkan dukungan, hubungi kami melalui:</p>
      {items.map((i) => <div key={i.k} className="prof-cs-card"><small>{i.k}</small><div><b>{i.v}</b>{i.href
        ? <Button asChild size="sm"><a href={i.href} target={i.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{i.btn}</a></Button>
        : <Button size="sm" onClick={() => setNotice('Live Chat belum tersedia pada pratinjau ini.')}>{i.btn}</Button>}</div></div>)}
      <div className="prof-cs-card prof-cs-office"><h3><img src="/hsb-mark.svg" width="20" height="20" alt="" />PT. Handal Semesta Berjangka</h3><b>Mayapada Tower 2</b><p>Jl. Jenderal Sudirman No.27 Lantai 14, RT.4/RW.2, Kuningan, Kecamatan Setiabudi, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12920</p></div>
    </div>
    {notice && <Notice text={notice} onClose={() => setNotice('')} />}
  </div></main>;
}

const BANKS = ['BCA', 'BNI', 'Mandiri', 'BRI', 'BSI', 'CIMB Niaga', 'Permata'];
type Bank = { bank: string; number: string; name: string };
export function WithdrawalBankScreen() {
  const [list, setList] = useState<Bank[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Bank>({ bank: '', number: '', name: '' });
  const valid = form.bank && /^\d{6,20}$/.test(form.number) && form.name.trim().length >= 3;
  const save = (e: FormEvent) => { e.preventDefault(); if (!valid) return; setList([...list, form]); setForm({ bank: '', number: '', name: '' }); setAdding(false); };
  return <main className="home-page"><div className="home-shell acct-shell acct-plain">
    <Header title="Bank Penarikan" />
    <div className="prof-cs">
      {list.length === 0 && !adding && <div className="prof-bank-empty"><Landmark /><p>Belum ada rekening bank penarikan.</p></div>}
      {list.map((b, i) => <div key={i} className="prof-cs-card prof-bank"><Landmark /><div><b>{b.bank}</b><p>{b.number.replace(/\d(?=\d{4})/g, '•')} · {b.name}</p></div><Button variant="ghost" size="icon" aria-label="Hapus rekening" onClick={() => setList(list.filter((_, j) => j !== i))}><Trash2 /></Button></div>)}
      {adding ? <form className="prof-bank-form" onSubmit={save}>
        <label><small>Nama Bank</small><select value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })}><option value="">Pilih bank</option>{BANKS.map((b) => <option key={b}>{b}</option>)}</select></label>
        <label><small>Nomor Rekening</small><input inputMode="numeric" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value.replace(/\D/g, '') })} placeholder="Contoh: 1234567890" /></label>
        <label><small>Nama Pemilik Rekening</small><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sesuai buku tabungan" /></label>
        <p className="prof-hint">Nama pemilik rekening harus sama dengan nama akun Anda.</p>
        <div className="prof-bank-actions"><Button type="button" variant="outline" onClick={() => setAdding(false)}>Batal</Button><Button type="submit" disabled={!valid}>Simpan</Button></div>
      </form> : <Button className="partner-wide" onClick={() => setAdding(true)}>+ Tambah Rekening Bank</Button>}
      <p className="prof-hint">Rekening hanya tersimpan selama sesi ini; belum terhubung ke layanan akun.</p>
    </div>
  </div></main>;
}
