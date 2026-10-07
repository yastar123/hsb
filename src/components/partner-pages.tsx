import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { BadgeDollarSign, CalendarDays, ChartLine, CircleHelp, Copy, Download, Filter, House, Image as ImageIcon, Instagram, Music2, Package, UserRoundSearch, Users, Video, Wallet } from 'lucide-react';
import { Gift, Share2, Trophy } from 'lucide-react';
import { commissionOf, useReferral } from '@/components/referral-content';
import { postJson } from '@/lib/site-content';
import { Button } from '@/components/ui/button';
import { BottomNav, Notice } from '@/components/account-pages';
import { useAppPreferences, translate } from '@/components/app-preferences';

const REFERRAL_LINK = 'https://client.hsb.co.id/id/register?ref_code=WiJAR4-AWZSP';

function PartnerNav({ active }: { active: '/mitra' | '/klien' | '/alat-pemasaran' }) {
  const { language } = useAppPreferences();
  const tabs = [
    { label: 'Beranda', to: '/mitra', icon: House },
    { label: 'Klien', to: '/klien', icon: Users },
    { label: 'Alat Pemasaran', to: '/alat-pemasaran', icon: Package },
  ] as const;
   return <nav className="partner-nav" aria-label={translate('Navigasi mitra', language)}>{tabs.map(({ label, to, icon: Icon }) => <Link key={to} to={to} aria-current={active === to ? 'page' : undefined}><Icon /><span>{translate(label, language)}</span></Link>)}</nav>;
}

function DateRange({ from, to, onFrom, onTo, id }: { from: string; to: string; onFrom: (v: string) => void; onTo: (v: string) => void; id: string }) {
  return <div className="partner-range"><label htmlFor={`${id}-from`}><CalendarDays /><input id={`${id}-from`} type="date" value={from} onChange={(e) => onFrom(e.target.value)} aria-label="Dari tanggal" /> - <input id={`${id}-to`} type="date" value={to} onChange={(e) => onTo(e.target.value)} aria-label="Sampai tanggal" /></label></div>;
}

function DailyChart({ title }: { title: string }) {
  return <div className="partner-chart">
    <p>{title} <CircleHelp /></p>
    <div className="partner-chart-plot" role="img" aria-label={`${title}: belum ada data`}>
      <div className="partner-chart-y">{[6, 4, 2, 0].map((v) => <small key={v}>{v}</small>)}</div>
      <div className="partner-chart-lines">{[0, 1, 2, 3].map((i) => <i key={i} />)}</div>
    </div>
  </div>;
}

const d = (days: number) => { const t = new Date('2026-10-06T00:00:00Z'); t.setUTCDate(t.getUTCDate() - days); return t.toISOString().slice(0, 10); };

export function PartnerScreen() {
  const { language } = useAppPreferences();
  const tr = (text: string) => translate(text, language);
  const { data, refresh } = useReferral();
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState('');
  const [claimBusy, setClaimBusy] = useState(false);
  const me = data.referrers.find((r) => r.code === data.currentUserCode);
  const mine = data.referrals.filter((r) => r.referrerId === me?.id);
  const earned = mine.reduce((s, r) => s + commissionOf(data, r), 0);
  const claimableReferrals = mine.filter((r) => r.deposit >= data.minDeposit && !r.commissionPaid);
  const claimable = claimableReferrals.reduce((s, r) => s + commissionOf(data, r), 0)
    + (data.friendBonusClaimable ? Number(data.friendBonusAmount ?? data.friendBonus) : 0);
  const link = data.currentUserCode
    ? `${window.location.origin}/register?ref_code=${encodeURIComponent(data.currentUserCode)}`
    : '';
  const next = data.tiers.slice().sort((a, b) => a.invites - b.invites).find((t) => t.invites > mine.length);
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { setNotice('Belum dapat disalin di perangkat ini.'); }
  };
  const share = async () => {
    if (!link) {
      setNotice(tr('Masuk ke akun untuk mendapatkan kode referral Anda.'));
      return;
    }
    try { if (navigator.share) await navigator.share({ title: 'HSB Trading', text: `Daftar di HSB dengan kode ${data.currentUserCode} dan dapatkan bonus $${data.friendBonus}!`, url: link }); else await copy(link); } catch { /* dibatalkan */ }
  };
  const addRewardsToDeposit = async () => {
    if (!claimable) {
      setNotice(tr('Belum ada komisi referral yang dapat ditambahkan ke saldo deposit.'));
      return;
    }
    setClaimBusy(true);
    try {
      const result = await postJson<{ credited: number }>('/api/account/referrals/claim');
      await refresh();
      setNotice(result.credited > 0
        ? `${tr('Hadiah referral berhasil ditambahkan ke saldo deposit')} $${result.credited.toFixed(2)}.`
        : tr('Belum ada hadiah referral yang dapat diklaim.'));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : tr('Komisi referral tidak dapat ditambahkan.'));
    } finally {
      setClaimBusy(false);
    }
  };
  return <main className="home-page"><div className="home-shell partner-shell">
    <PartnerNav active="/mitra" />
    <section className="partner-hero">
      <div className="partner-coins"><span><Gift /></span><span><BadgeDollarSign /></span><span><Users /></span></div>
      <h2>{data.title}</h2>
      <p className="partner-note">{data.subtitle}</p>
      <div className="partner-hero-actions"><Button onClick={share} disabled={!data.currentUserCode}><Share2 /> {tr('AJAK TEMAN SEKARANG')}</Button></div>
      <small>*{data.terms}</small>
    </section>
    <section className="partner-card">
      <div className="partner-card-heading"><i><Gift /></i>{tr('Hadiah Untuk Anda & Teman')}</div>
      <div className="partner-stat"><small>{tr('Anda dapatkan per teman')}</small><b>${data.bonusPerInvite} <span>+ {me?.commissionRate ?? data.defaultRate}% {tr('deposit')}</span></b></div>
      <div className="partner-stat"><small>{tr('Teman Anda dapatkan')}</small><b>${data.friendBonus} <span>{tr('bonus')}</span></b></div>
      <p className="partner-note">Berlaku setelah teman deposit pertama minimal ${data.minDeposit}.</p>
    </section>
    <section className="partner-card">
      <div className="partner-card-heading"><i><Users /></i>{tr('Kode & Link Referral')}</div>
      <p className="partner-ref-label">{tr('Kode Referral')}</p>
       <div className="partner-ref-link"><code>{data.currentUserCode || tr('Masuk untuk melihat kode')}</code><Button variant="outline" disabled={!data.currentUserCode} onClick={() => copy(data.currentUserCode)}><Copy /> {tr('Salin')}</Button></div>
      <p className="partner-ref-label">{tr('Link Referral')}</p>
       <div className="partner-ref-link"><code>{link || tr('Link referral tersedia setelah masuk')}</code><Button variant="outline" disabled={!link} onClick={() => copy(link)}>{copied ? <>{tr('Tersalin')}</> : <><Copy /> {tr('Salin')}</>}</Button></div>
      <Button asChild variant="outline" className="partner-wide"><Link to="/alat-pemasaran">{tr('Materi Promosi')}</Link></Button>
    </section>
    <section className="partner-card">
      <div className="partner-card-heading"><i><Wallet /></i>{tr('Hadiah Saya')}</div>
      <p className="partner-income-value">${earned.toFixed(2)} <small>USD</small></p>
      <p className="partner-income-note">{mine.length} teman diajak · {mine.filter((r) => r.deposit >= data.minDeposit).length} sudah deposit</p>
      <p className="partner-income-note">{tr('Belum ditambahkan ke saldo deposit')}: ${claimable.toFixed(2)}</p>
       <Button className="partner-wide" disabled={!claimable || claimBusy} onClick={() => { void addRewardsToDeposit(); }}>{claimBusy ? tr('Memproses...') : tr('Tambahkan ke Saldo Deposit')}</Button>
    </section>
    <section className="partner-section">
      <div className="partner-section-heading"><i><Trophy /></i>{tr('Bonus Level')}</div>
      {data.tiers.map((t) => <div key={t.id} className="partner-stat"><small>{t.label} · ajak {t.invites} teman {mine.length >= t.invites ? '✓' : ''}</small><b>${t.reward}</b></div>)}
      {next && <p className="partner-note">Ajak {next.invites - mine.length} teman lagi untuk level {next.label}.</p>}
    </section>
    <section className="partner-section">
      <div className="partner-section-heading"><i><UserRoundSearch /></i>{tr('Teman yang Anda Ajak')}</div>
      <div className="partner-top"><table><thead><tr><th>Teman</th><th>Status</th><th>Hadiah (USD)</th></tr></thead><tbody>
        {mine.length ? mine.map((r) => <tr key={r.id}><td>{r.name}</td><td>{r.status}</td><td>{commissionOf(data, r).toFixed(2)}</td></tr>) : <tr><td colSpan={3}>Belum ada teman yang diajak.</td></tr>}
      </tbody></table></div>
    </section>
    <BottomNav active="Mitra" />
    {notice && <Notice text={notice} onClose={() => setNotice('')} />}
  </div></main>;
}

export function ClientScreen() {
  const { language } = useAppPreferences();
  const tr = (text: string) => translate(text, language);
  const [tab, setTab] = useState<'Daftar Klien' | 'Ringkasan'>('Daftar Klien');
  const [showFilter, setShowFilter] = useState(false);
  return <main className="home-page"><div className="home-shell partner-shell">
    <PartnerNav active="/klien" />
    <h1 className="partner-title">{tr('Klien')}</h1>
    <div className="acct-tabs acct-tabs-left" role="tablist">{(['Daftar Klien', 'Ringkasan'] as const).map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{tr(t)}</button>)}</div>
    {tab === 'Daftar Klien' ? <>
      <div className="partner-klien-head"><b><UserRoundSearch /> {tr('Daftar Klien')}</b><small>{tr('Semua hasil')}: <b>0 {tr('hasil')}</b></small></div>
      <div className="partner-filter"><Button variant="outline" onClick={() => setShowFilter((v) => !v)} aria-expanded={showFilter}><Filter /> {tr('Filter')}</Button></div>
      {showFilter && <div className="partner-filter-panel">
        <input placeholder={tr('Cari nama atau ID klien')} aria-label={tr('Cari klien')} />
        <select aria-label={tr('Status klien')} defaultValue="Semua"><option>{tr('Semua')}</option><option>{tr('Lead')}</option><option>{tr('Sudah deposit')}</option><option>{tr('Trader aktif')}</option></select>
      </div>}
      <p className="partner-empty">{tr('Tidak ada hasil')}</p>
    </> : <div className="partner-summary">
       {[['Total Klien', 'Klien'], ['Lead Baru', 'Lead'], ['Deposit Pertama', 'FTD'], ['Trader Aktif', 'Trader']].map(([l, u]) => <div key={String(l)} className="partner-stat"><small>{tr(String(l))}</small><b>0 <span>{tr(String(u))}</span></b></div>)}
    </div>}
    <BottomNav active="Mitra" />
  </div></main>;
}

const BANNERS = [
  { title: 'Pengenalan HSB', lang: 'Indonesia', head: <>Trading Tenang Terjaga di <em>Platform Terpercaya</em></> },
  { title: 'Bonus Selamat Datang', lang: 'Indonesia', head: <>Raih <em>Bonus</em> untuk Deposit Pertama</> },
  { title: 'Introducing HSB', lang: 'English', head: <>Trade Calmly on a <em>Trusted Platform</em></> },
];

export function MarketingToolsScreen() {
  const { language } = useAppPreferences();
  const tr = (text: string) => translate(text, language);
  const [tab, setTab] = useState<'Banner' | 'Video' | 'Halaman Arahan'>('Banner');
  const [lang, setLang] = useState('Indonesia');
  const [idx, setIdx] = useState(0);
  const [notice, setNotice] = useState('');
  const list = BANNERS.filter((b) => b.lang === lang);
  const cur = list[Math.min(idx, list.length - 1)];
  return <main className="home-page"><div className="home-shell partner-shell">
    <PartnerNav active="/alat-pemasaran" />
    <h1 className="partner-title">{tr('Pusat Sumber Daya Pemasaran')}</h1>
    <div className="partner-tools-tabs" role="tablist">{([{ label: 'Banner', icon: ImageIcon }, { label: 'Video', icon: Video }, { label: 'Halaman Arahan', icon: Package }] as const).map(({ label, icon: Icon }) => <button key={label} role="tab" aria-selected={tab === label} onClick={() => setTab(label)}><Icon /><span>{tr(label)}</span></button>)}</div>
    {tab === 'Banner' ? <>
      <div className="partner-field"><small>Bahasa</small><select value={lang} onChange={(e) => { setLang(e.target.value); setIdx(0); }} aria-label="Bahasa materi">{['Indonesia', 'English'].map((l) => <option key={l}>{l}</option>)}</select></div>
      <div className="partner-sieve"><Filter /> Penyaring</div>
      <section className="partner-group">
        <h2>Pilih Grup Klien untuk Klien yang Anda Referensikan</h2>
        <p>Klien yang bergabung melalui Tautan Undangan atau HTML Anda akan secara otomatis terdaftar dengan kondisi trading dan promosi yang dipilih.</p>
        <select defaultValue="direct_client" aria-label="Grup klien"><option value="direct_client">direct_client</option></select>
      </section>
      {cur && <section className="partner-banner-preview">
        <div className="partner-banner-stage" role="img" aria-label={`Contoh banner ${cur.title}`}>
          <div className="partner-banner-art"><b>HSB</b><strong>{cur.head}</strong><small>Nikmati pengalaman trading aman</small><span /></div>
        </div>
        <Button className="partner-wide" onClick={() => setNotice('Unduhan materi pemasaran belum tersedia. Layanan mitra belum terhubung.')}>Unduh <Download /></Button>
        <p className="partner-banner-caption">{cur.title}</p>
        {list.length > 1 && <div className="partner-pager">{list.map((b, i) => <button key={b.title} aria-label={b.title} aria-current={b === cur} onClick={() => setIdx(i)} />)}</div>}
      </section>}
    </> : <p className="partner-empty">Belum ada materi {tab === 'Video' ? 'video' : 'halaman arahan'}.</p>}
    <BottomNav active="Mitra" />
    {notice && <Notice text={notice} onClose={() => setNotice('')} />}
  </div></main>;
}
