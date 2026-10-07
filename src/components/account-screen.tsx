import { Link, useNavigate } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { ArrowLeft, Check, ChevronDown, Eye, EyeOff, LockKeyhole, Mail, Smartphone, Landmark, Layers, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isValidPassword, passwordRules } from '@/lib/account-validation';
import { useLedger } from '@/components/ledger-content';
import { demoAccounts, findDemoAccount } from '@/lib/demo-accounts';

export function AccountScreen({ mode }: { mode: 'login' | 'register' }) {
  const register = mode === 'register';
  const [tab, setTab] = useState('phone');
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [invitation, setInvitation] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [dialog, setDialog] = useState<'privacy' | 'forgot' | null>(null);
  const [notice, setNotice] = useState('');
  const navigate = useNavigate();
  const { setCurrentEmail } = useLedger();
  const signInDemo = (account: (typeof demoAccounts)[number]) => {
    setCurrentEmail(account.role === 'user' ? account.email : '');
    if (account.role === 'admin') {
      void navigate({ to: '/admin' });
    } else {
      void navigate({ to: '/beranda' });
    }
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (register) {
      setNotice('Pendaftaran belum terhubung ke layanan akun.');
      return;
    }
    if (!import.meta.env.DEV) {
      setNotice('Login belum terhubung ke layanan akun.');
      return;
    }
    const account = findDemoAccount(identity, password);
    if (!account) {
      setNotice('Email atau kata sandi akun demo tidak valid.');
      return;
    }
    signInDemo(account);
  };

  return <main className="account-page">
    <div className="account-shell">
      <header className="account-banner">
        <Link to="/beranda" className="account-brand" aria-label="HSB — Beranda"><img src="/hsb-mark.svg" width="25" height="25" alt="" />HSB</Link>
        <div className="account-award"><span>❧</span><div>MOST<br /><b>Innovative</b><br />Broker<br />2024</div><span>❧</span></div>
      </header>
      <section className={`account-content ${register ? 'account-registration' : 'account-signin'} ${!register && import.meta.env.DEV ? 'account-signin-demo' : ''}`}>
        <div className="account-heading"><Button asChild variant="ghost" size="icon"><Link to="/" aria-label="Kembali ke welcome"><ArrowLeft /></Link></Button><h1>{register ? 'Buka Akun' : 'Masuk'}</h1></div>
        {!register && <div className="account-tabs" role="tablist" aria-label="Metode masuk">{[{ id: 'phone', label: 'Nomor Telepon' }, { id: 'email', label: 'Email' }].map((item) => <Button key={item.id} variant="ghost" role="tab" aria-selected={tab === item.id} onClick={() => { setTab(item.id); setIdentity(''); setNotice(''); }}>{item.label}</Button>)}</div>}
        <form onSubmit={submit} className="account-form">
          <div className="account-identity-row">
            {(register || tab === 'phone') && <div className="account-country" aria-label="Indonesia, kode negara +62"><span className="account-flag" />+62</div>}
            <div className="account-field"><span className="account-field-icon">{tab === 'email' && !register ? <Mail /> : <Smartphone />}</span><Input aria-label={tab === 'email' && !register ? 'Email' : 'Nomor Telepon'} placeholder={tab === 'email' && !register ? 'Email' : 'Nomor Telepon'} type={tab === 'email' && !register ? 'email' : 'text'} inputMode={tab === 'email' && !register ? 'email' : 'numeric'} autoComplete={tab === 'email' && !register ? 'email' : 'tel-national'} value={identity} onChange={(event) => setIdentity(event.target.value)} required /></div>
          </div>
          <div className="account-field"><span className="account-field-icon"><LockKeyhole /></span><Input aria-label="Kata Sandi" placeholder="Kata Sandi" type={visible ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} required /><Button type="button" variant="ghost" size="icon" className="account-eye" aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} onClick={() => setVisible(!visible)}>{visible ? <Eye /> : <EyeOff />}</Button></div>
          {register ? <>
            <ul className="account-password-rules">{passwordRules.map((rule) => <li key={rule.label} className={rule.valid(password) ? 'account-rule-valid' : ''}><Check />{rule.label}</li>)}</ul>
            <Button type="button" variant="ghost" className="account-invitation" aria-expanded={invitation} onClick={() => setInvitation(!invitation)}>Kode Undangan (Opsional)<ChevronDown className={invitation ? 'rotate-180' : ''} /></Button>
            {invitation && <div className="account-field"><Input aria-label="Kode Undangan" placeholder="Masukkan kode undangan" /></div>}
            <label className="account-consent"><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} /><span>Saya telah membaca dan menyetujui <Button type="button" variant="link" onClick={() => setDialog('privacy')}>Kebijakan Privasi</Button> HSB.</span></label>
          </> : <div className="account-forgot"><Button type="button" variant="link" onClick={() => setDialog('forgot')}>Lupa Kata Sandi</Button></div>}
          <Button type="submit" className="account-submit" disabled={register && (!identity.trim() || !isValidPassword(password) || !agreed)}>{register ? 'Daftar' : 'Masuk'}</Button>
          {notice && <p className="account-notice" role="status">{notice}</p>}
        </form>
        {!register && import.meta.env.DEV && <section className="account-demo" aria-labelledby="account-demo-title">
          <div className="account-demo-heading"><h2 id="account-demo-title">Akun Demo</h2><span>Pratinjau lokal</span></div>
          <p>Akun simulasi untuk mencoba tampilan pengguna dan admin. Bukan untuk transaksi nyata.</p>
          <div className="account-demo-list">{demoAccounts.map((account) => <article className="account-demo-card" key={account.role}>
            <div><strong>{account.label}</strong><span>Email: <code>{account.email}</code></span><span>Kata sandi: <code>{account.password}</code></span></div>
            <Button type="button" variant="outline" size="sm" onClick={() => signInDemo(account)}>Masuk sebagai {account.label}</Button>
          </article>)}</div>
        </section>}
        <div className="account-switch">{register ? 'Sudah punya akun?' : 'Belum punya akun?'}<Button variant="link" asChild><Link to={register ? '/login' : '/register'}>{register ? 'Masuk Sekarang' : 'Daftar di Sini'}</Link></Button></div>
        <div className="account-browse"><Button variant="link" asChild><Link to="/beranda">Lihat Beranda</Link></Button></div>
        <footer className="account-partners" aria-label="Lembaga terkait"><div><Landmark /><span>KEMENTERIAN<br />PERDAGANGAN<small>REPUBLIK INDONESIA</small></span></div><div className="account-icdx"><b>ICDX</b><small>TRADE THE SOURCE</small></div><div><Layers /><span>INDONESIA<br />CLEARING<br />HOUSE</span></div><div><ShieldCheck /><span>ASPEBTINDO</span></div></footer>
      </section>
    </div>
    {dialog && <div className="account-dialog-backdrop" onClick={() => setDialog(null)}><section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="account-dialog-title" onClick={(event) => event.stopPropagation()}><Button variant="ghost" size="icon" aria-label="Tutup" className="account-dialog-close" onClick={() => setDialog(null)}><X /></Button><h2 id="account-dialog-title">{dialog === 'privacy' ? 'Kebijakan Privasi' : 'Lupa Kata Sandi'}</h2><p>{dialog === 'privacy' ? 'Dokumen kebijakan privasi resmi belum ditambahkan.' : 'Pemulihan kata sandi belum terhubung ke layanan akun.'}</p><Button onClick={() => setDialog(null)}>Kembali</Button></section></div>}
  </main>;
}