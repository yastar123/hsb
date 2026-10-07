import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, CalendarDays, Check, ChevronRight, Copy, Crown, Eye, EyeOff, FileBarChart, Landmark, LockKeyhole, LogOut, Moon, Sun, Percent, Signal, TrendingUp, Wallet, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomNav, Notice } from '@/components/account-pages';
import { isValidPassword, passwordRules } from '@/lib/account-validation';
import { useLedger } from '@/components/ledger-content';
import { useAppPreferences, translate, type Language } from '@/components/app-preferences';
import { useCustomerServiceContent } from '@/components/customer-service-content';

const UID = '95279505';

function Header({ title, back = '/profil' }: { title: string; back?: '/profil' }) {
  const { language } = useAppPreferences();
  return <header className="acct-header"><Button asChild variant="ghost" size="icon"><Link to={back} aria-label={translate('Kembali', language)}><ArrowLeft /></Link></Button><h1>{translate(title, language)}</h1></header>;
}

export function ProfileScreen() {
  const [notice, setNotice] = useState('');
  const navigate = useNavigate();
  const { setCurrentEmail } = useLedger();
  const { language, theme, toggleTheme } = useAppPreferences();
  const tr = (text: string) => translate(text, language);
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
      <div><h1>{tr('Hello Demo')}</h1><p>UID: {UID} <button onClick={copy} aria-label={tr('Salin UID')}><Copy /></button></p></div>
      <Button variant="ghost" size="icon" className="prof-moon" aria-label={theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'} title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'} onClick={toggleTheme}>{theme === 'dark' ? <Sun /> : <Moon />}</Button>
    </section>
    <nav className="prof-grid">{shortcuts.map(({ label, icon: Icon, to }) => to
      ? <Link key={label} to={to}><span><Icon /></span>{tr(label)}</Link>
      : <button key={label} onClick={soon(label)}><span><Icon /></span>{tr(label)}</button>)}</nav>
    <section className="prof-list">
      <h2>{tr('Pusat Klien')}</h2>
       <Link to="/informasi-akun">{tr('Informasi Anda')}<ChevronRight /></Link>
       <button onClick={soon('Dokumen')}>{tr('Dokumen')}<ChevronRight /></button>
      <Link to="/bank-penarikan">{tr('Bank Penarikan')}<ChevronRight /></Link>
      <Link to="/layanan-pelanggan">{tr('Layanan Pelanggan')}<ChevronRight /></Link>
      <h2>{tr('Pengaturan')}</h2>
      <Link to="/ganti-kata-sandi">{tr('Ganti Password')}<ChevronRight /></Link>
      <Link to="/bahasa">{tr('Bahasa')}<ChevronRight /></Link>
    </section>
    <button className="prof-logout" onClick={() => { setCurrentEmail(''); navigate({ to: '/login' }); }}><LogOut /> {tr('Keluar')}</button>
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
  const { language, setLanguage } = useAppPreferences();
  const tr = (text: string) => translate(text, language);
  return <main className="home-page"><div className="home-shell acct-shell acct-plain">
    <Header title={tr('Bahasa')} />
    <div className="prof-langs" role="radiogroup" aria-label="Language">{LANGS.map((l) => <button key={l.id} role="radio" aria-checked={language === l.id} onClick={() => setLanguage(l.id as Language)}><i className={`prof-flag ${l.flag}`} />{l.label}<span><Check /></span></button>)}</div>
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
  const { content } = useCustomerServiceContent();
  const { language } = useAppPreferences();
  const tr = (text: string) => translate(text, language);
  const safeHref = (value: string) => /^(https?:|tel:|mailto:)/i.test(value.trim()) ? value.trim() : '';
  return <main className="home-page"><div className="home-shell acct-shell acct-plain">
    <Header title={tr('Layanan Pelanggan')} />
    <div className="prof-cs">
      <h2>{tr('Hubungi Layanan Pelanggan')}</h2>
      <p className="prof-hint">{tr('Jika Anda membutuhkan dukungan, hubungi kami melalui:')}</p>
      {content.items.map((i) => {
        const href = safeHref(i.href);
        return <div key={i.id} className="prof-cs-card"><small>{tr(i.title)}</small><div><b>{i.value}</b>{href
          ? <Button asChild size="sm"><a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{tr(i.buttonLabel)}</a></Button>
          : <Button size="sm" onClick={() => setNotice(`${i.title} belum tersedia pada pratinjau ini.`)}>{tr(i.buttonLabel)}</Button>}</div></div>;
      })}
      <div className="prof-cs-card prof-cs-office"><h3><img src="/hsb-mark.svg" width="20" height="20" alt="" />{content.officeName}</h3><b>{content.officeBuilding}</b><p>{content.officeAddress}</p></div>
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
