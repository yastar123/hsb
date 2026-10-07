import { Link, useNavigate } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { ArrowLeft, Check, ChevronDown, Eye, EyeOff, LockKeyhole, Mail, Smartphone, Landmark, Layers, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isValidPassword, passwordRules } from '@/lib/account-validation';
import { useLedger } from '@/components/ledger-content';
import { useAppPreferences, translate } from '@/components/app-preferences';

export function AccountScreen({ mode }: { mode: 'login' | 'register' }) {
  const register = mode === 'register';
  const [tab, setTab] = useState('phone');
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [dialog, setDialog] = useState<'privacy' | 'forgot' | null>(null);
  const [notice, setNotice] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [referralCode, setReferralCode] = useState(() => typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('ref_code')?.slice(0, 32).toUpperCase() ?? '');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { login, register: createAccount } = useLedger();
  const { language } = useAppPreferences();
  const tr = (text: string) => translate(text, language);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setNotice('');
    try {
      if (register) {
        const code = referralCode.trim();
        await createAccount({ name, email, phone: identity, password, ...(code ? { referralCode: code } : {}) });
        setNotice(tr('Akun berhasil dibuat dan menunggu verifikasi admin sebelum transaksi keuangan.'));
        await navigate({ to: '/beranda' });
      } else {
        await login(identity, password);
        await navigate({ to: '/beranda' });
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : tr('Permintaan gagal. Periksa data dan coba lagi.'));
    } finally {
      setBusy(false);
    }
  };

  return <main className="account-page">
    <div className="account-shell">
      <header className="account-banner">
        <Link to="/beranda" className="account-brand" aria-label="HSB — Beranda"><img src="/hsb-mark.svg" width="25" height="25" alt="" />HSB</Link>
        <div className="account-award"><span>❧</span><div>MOST<br /><b>Innovative</b><br />Broker<br />2024</div><span>❧</span></div>
      </header>
      <section className={`account-content ${register ? 'account-registration' : 'account-signin'}`}>
        <div className="account-heading"><Button asChild variant="ghost" size="icon"><Link to="/" aria-label={tr('Kembali ke welcome')}><ArrowLeft /></Link></Button><h1>{tr(register ? 'Buka Akun' : 'Masuk')}</h1></div>
        {!register && <div className="account-tabs" role="tablist" aria-label={tr('Metode masuk')}>{[{ id: 'phone', label: 'Nomor Telepon' }, { id: 'email', label: 'Email' }].map((item) => <Button key={item.id} variant="ghost" role="tab" aria-selected={tab === item.id} onClick={() => { setTab(item.id); setIdentity(''); setNotice(''); }}>{tr(item.label)}</Button>)}</div>}
        <form onSubmit={submit} className="account-form">
          <div className="account-identity-row">
            {(register || tab === 'phone') && <div className="account-country" aria-label="Indonesia, kode negara +62"><span className="account-flag" />+62</div>}
            <div className="account-field"><span className="account-field-icon">{tab === 'email' && !register ? <Mail /> : <Smartphone />}</span><Input aria-label={tab === 'email' && !register ? tr('Email') : tr('Nomor Telepon')} placeholder={tab === 'email' && !register ? tr('Email') : tr('Nomor Telepon')} type={tab === 'email' && !register ? 'email' : 'text'} inputMode={tab === 'email' && !register ? 'email' : 'numeric'} autoComplete={tab === 'email' && !register ? 'email' : 'tel-national'} value={identity} onChange={(event) => setIdentity(event.target.value)} required /></div>
          </div>
          {register && <>
            <div className="account-field"><span className="account-field-icon"><Smartphone /></span><Input aria-label={tr('Nama Lengkap')} placeholder={tr('Nama Lengkap')} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={120} required /></div>
            <div className="account-field"><span className="account-field-icon"><Mail /></span><Input aria-label={tr('Email')} placeholder={tr('Email')} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} required /></div>
            <div className="account-field"><Input aria-label={tr('Kode Referral (opsional)')} placeholder={tr('Kode Referral (opsional)')} autoComplete="off" value={referralCode} onChange={(event) => setReferralCode(event.target.value.toUpperCase())} maxLength={32} /></div>
          </>}
          <div className="account-field"><span className="account-field-icon"><LockKeyhole /></span><Input aria-label={tr('Kata Sandi')} placeholder={tr('Kata Sandi')} type={visible ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} required /><Button type="button" variant="ghost" size="icon" className="account-eye" aria-label={tr(visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi')} onClick={() => setVisible(!visible)}>{visible ? <Eye /> : <EyeOff />}</Button></div>
          {register ? <>
            <ul className="account-password-rules">{passwordRules.map((rule) => <li key={rule.label} className={rule.valid(password) ? 'account-rule-valid' : ''}><Check />{tr(rule.label)}</li>)}</ul>
            <label className="account-consent"><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} /><span>{tr('Saya telah membaca dan menyetujui')} <Button type="button" variant="link" onClick={() => setDialog('privacy')}>{tr('Kebijakan Privasi')}</Button> HSB.</span></label>
          </> : <div className="account-forgot"><Button type="button" variant="link" onClick={() => setDialog('forgot')}>{tr('Lupa Kata Sandi')}</Button></div>}
          <Button type="submit" className="account-submit" disabled={busy || (register && (!identity.trim() || !name.trim() || !email.trim() || !isValidPassword(password) || !agreed))}>{busy ? tr('Memproses...') : tr(register ? 'Daftar' : 'Masuk')}</Button>
          {notice && <p className="account-notice" role="status">{notice}</p>}
        </form>
         <div className="account-switch">{tr(register ? 'Sudah punya akun?' : 'Belum punya akun?')}<Button variant="link" asChild><Link to={register ? '/login' : '/register'}>{tr(register ? 'Masuk Sekarang' : 'Daftar di Sini')}</Link></Button></div>
        <footer className="account-partners" aria-label="Lembaga terkait"><div><Landmark /><span>KEMENTERIAN<br />PERDAGANGAN<small>REPUBLIK INDONESIA</small></span></div><div className="account-icdx"><b>ICDX</b><small>TRADE THE SOURCE</small></div><div><Layers /><span>INDONESIA<br />CLEARING<br />HOUSE</span></div><div><ShieldCheck /><span>ASPEBTINDO</span></div></footer>
      </section>
    </div>
     {dialog && <div className="account-dialog-backdrop" onClick={() => setDialog(null)}><section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="account-dialog-title" onClick={(event) => event.stopPropagation()}><Button variant="ghost" size="icon" aria-label={tr('Tutup')} className="account-dialog-close" onClick={() => setDialog(null)}><X /></Button><h2 id="account-dialog-title">{tr(dialog === 'privacy' ? 'Kebijakan Privasi' : 'Lupa Kata Sandi')}</h2><p>{tr(dialog === 'privacy' ? 'Dokumen kebijakan privasi resmi belum ditambahkan.' : 'Pemulihan kata sandi belum terhubung ke layanan akun.')}</p><Button onClick={() => setDialog(null)}>{tr('Kembali')}</Button></section></div>}
  </main>;
}