import { useEffect, useState } from 'react';
import { loadNotifs } from '@/lib/notifications';
import { Link } from '@tanstack/react-router';
import { Bell, Headphones, House, ChartNoAxesColumn, BriefcaseBusiness, Users, UserRound, BadgeHelp, Wallet, BadgePercent, ShieldCheck, WalletCards, Sparkles, Newspaper, ArrowDown, ArrowUpRight, Check, X, Pause, Play, CircleHelp, ArrowLeftRight, ArrowUpFromLine, ReceiptText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHomeContent, resolveImage, type Signal } from '@/components/home-content';
import { useAppPreferences, translate } from '@/components/app-preferences';
import { useLedger, mainOf, depOf, profitOf, dailyProfitOf, rateOf } from '@/components/ledger-content';
import { TradingTerminalSection } from '@/components/market-screens';

const shortcutIcons: Record<string, typeof Wallet> = { Withdraw: WalletCards, FAQ: BadgeHelp, Deposit: Wallet, Promo: BadgePercent, 'Proteksi Dana': ShieldCheck };
const lines = (t: string) => t.split('\n').map((l, i, a) => <span key={i}>{l}{i < a.length - 1 && <br />}</span>);
type AppPath = '/withdraw' | '/faq' | '/deposit' | '/promo' | '/proteksi-dana' | '/pasar' | '/berita' | '/posisi' | '/mitra' | '/profil' | '/sinyal-trading' | '/kalender-ekonomi' | '/beranda' | '/layanan-pelanggan';
export function HomeScreen() {
  const { content } = useHomeContent();
  const { language } = useAppPreferences();
  const tr = (text: string) => translate(text, language);
  const banners = content.banners;
  const signals = content.signals;
  const markets = content.markets;
  const [banner, setBanner] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPaused(preference.matches);
    const update = () => setPaused(preference.matches);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (paused) return;
    if (banners.length < 2) return;
    const timer = window.setInterval(() => setBanner((current) => (current + 1) % banners.length), 3000);
    return () => window.clearInterval(timer);
  }, [paused, banners.length]);
  const activeBanner = banners[Math.min(banner, Math.max(banners.length - 1, 0))];
  const [dialog, setDialog] = useState<{ title: string; text: string } | null>(null);
  const [copied, setCopied] = useState('');
  const open = (title: string, text = 'Layanan ini belum terhubung. Saat ini tersedia tampilan pratinjau.') => setDialog({ title, text });
  const showNotifications = async () => {
    try {
      const n = await loadNotifs();
      open(tr('Notifikasi'), n.length ? n.map((item) => `${item.title}: ${item.message}`).join('\n\n') : tr('Belum ada notifikasi.'));
    } catch {
      open(tr('Notifikasi'), tr('Notifikasi tidak dapat dimuat dari server.'));
    }
  };
  const toLive = () => markets.map((m) => { const p = parseFloat(m.price.replace(/,/g, '')) || 0; return { ...m, base: p, value: p, pct: parseFloat(m.change) || 0 }; });
  const [live, setLive] = useState(toLive);
  useEffect(() => { setLive(toLive()); }, [markets]);
  const makeBars = () => [12,18,13,27,19,22,15,32,25,20,28,17].map((h, i) => ({ h, up: i % 3 === 0 }));
  const [bars, setBars] = useState(() => signals.map(makeBars));
  useEffect(() => { setBars((prev) => signals.map((_, i) => prev[i] ?? makeBars())); }, [signals.length]);
  useEffect(() => {
    const t = setInterval(() => {
      setLive((prev) => prev.map((m) => { const value = m.value * (1 + (Math.random() - 0.5) * 0.0015); return { ...m, value, pct: m.pct + ((value - m.value) / m.base) * 100 }; }));
      setBars((prev) => prev.map((list) => [...list.slice(1), { h: 10 + Math.round(Math.random() * 24), up: Math.random() > 0.5 }]));
    }, 1500);
    return () => clearInterval(t);
  }, []);
  const fmt = (m: { price: string; value: number }) => { const d = Math.min(Math.max((m.price.split('.')[1] ?? '').length, 2), 5); return m.value.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); };
  const copySignal = async (signal: Signal) => {
    try { await navigator.clipboard.writeText(`${signal.symbol} | ${signal.sell ? 'SELL' : 'BUY'} | Open ${signal.open} | TP ${signal.tp} | SL ${signal.sl}`); setCopied(signal.id); }
    catch { open('Salin Sinyal', `${signal.symbol} · Open ${signal.open} · TP ${signal.tp} · SL ${signal.sl}`); }
  };
  const { users, compound, currentEmail, transferDepositToMain } = useLedger();
  const me = users.find((u) => u.email.toLowerCase() === currentEmail.toLowerCase());
  const f = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const compoundNow = async () => {
    if (!me) return;
    try {
      const moved = await transferDepositToMain(me.id);
      if (moved > 0) open(tr('Compounding'), `${tr('Saldo deposit')} $${f(moved)} ${tr('dipindahkan ke saldo utama. Akrual harian mengikuti tarif admin.')}`);
      else if (!compound.enabled) open(tr('Compounding'), tr('Compounding sedang dinonaktifkan admin.'));
      else if (me.status === 'Diblokir') open(tr('Compounding'), tr('Akun sedang diblokir. Hubungi layanan pelanggan.'));
      else open(tr('Compounding'), tr('Tidak ada saldo deposit yang dapat dipindahkan.'));
    } catch (error) {
      open(tr('Compounding'), error instanceof Error ? error.message : tr('Pemindahan saldo gagal.'));
    }
  };
  const marqueeText = me ? `Saldo akun · tarif akrual admin ${rateOf(me, compound)}% per hari · ` : 'Masuk ke akun untuk melihat saldo dan transaksi · ';

  return <main className="home-page"><div className="home-shell">
    <header className="home-header"><Link to="/beranda" aria-label={tr('Beranda')}><img src="/logo.jpg" alt="Logo" className="h-8 w-auto max-w-[120px] object-contain" /></Link><div><Button variant="ghost" size="icon" aria-label={tr('Notifikasi')} onClick={() => { void showNotifications(); }}><Bell /></Button><Button asChild variant="ghost" size="icon" aria-label={tr('Pusat Bantuan')}><Link to="/layanan-pelanggan"><Headphones /></Link></Button></div></header>
    {activeBanner && <section className={`home-hero home-carousel ${activeBanner.dark ? '' : 'home-hero-light'}`} aria-label={tr('Promo HSB')} aria-roledescription="carousel" data-slide={banner} onKeyDown={(e) => { if (e.key === 'ArrowRight') setBanner((v) => (v + 1) % banners.length); if (e.key === 'ArrowLeft') setBanner((v) => (v + banners.length - 1) % banners.length); }}>
      {banners.map((item, index) => <div key={item.id} className={`home-banner-slide ${item === activeBanner ? 'is-active' : ''}`} aria-hidden={item !== activeBanner}><img src={resolveImage(item.image)} alt={item.alt} width="1536" height="768" /></div>)}
      <div className="home-hero-copy"><h1>{lines(activeBanner.heading)}</h1><p>{lines(activeBanner.text)}</p>{activeBanner.button && <Button variant={activeBanner.dark ? 'heroLime' : 'default'} asChild><Link to={activeBanner.link as AppPath}>{activeBanner.button} <ArrowUpRight /></Link></Button>}{activeBanner.note && <small>{activeBanner.note}</small>}</div>
      {activeBanner.dark && activeBanner === banners[0] && <span className="home-bonus-label">Bonus Hingga</span>}
      <nav className="home-carousel-controls" aria-label={tr('Pilih banner')}>{banners.map((item, index) => <Button key={item.id} variant="ghost" className="home-carousel-dot" aria-label={`Banner ${index + 1}: ${item.title}`} aria-current={activeBanner === item ? 'true' : undefined} onClick={() => setBanner(index)}><span /></Button>)}<Button variant="ghost" size="icon" className="home-carousel-pause" aria-label={tr(paused ? 'Putar banner otomatis' : 'Jeda banner otomatis')} onClick={() => setPaused(!paused)}>{paused ? <Play /> : <Pause />}</Button></nav>
    </section>}
    <div className="home-ticker">{live.map((market) => <Button variant="ghost" key={market.id} onClick={() => open(market.symbol, `${tr('Harga Pasar Terkini ')}${fmt(market)}. ${tr('Data ini disinkronkan langsung dengan likuiditas pasar global.')}`)}><span>{market.symbol}<small>{fmt(market)} <i className={market.pct >= 0 ? 'home-positive' : 'home-negative'}>{market.pct >= 0 ? '+' : ''}{market.pct.toFixed(2)}%</i></small></span></Button>)}</div>

      <section className="home-section"><div className="home-section-heading"><Sparkles /><div><h2>{tr('Sinyal Trading')}</h2><p>{tr('Trading menjadi lebih mudah dengan analisa profesional')}</p></div><Button asChild variant="link"><Link to="/sinyal-trading">{tr('Lihat Semua')}</Link></Button></div><div className="home-signal-track">{signals.map((signal, si) => <article className={`home-signal ${signal.sell ? 'home-signal-sell' : 'home-signal-buy'}`} key={signal.id}><div className="home-signal-heading"><b><span className="home-coin">{signal.symbol === 'XAUUSD' ? '✦' : '$'}</span>{signal.symbol}</b><span className={signal.sell ? 'home-negative' : 'home-positive'}>{tr(signal.sell ? 'Jual Signal' : 'Beli Signal')} <ArrowDown /></span></div><div className="home-signal-data"><dl><div><dt>Open</dt><dd>{signal.open}</dd></div><div><dt>TP</dt><dd>{signal.tp}</dd></div><div><dt>SL</dt><dd>{signal.sl}</dd></div></dl><div className="home-minichart" aria-label={tr('Ilustrasi pergerakan harga')}>{(bars[si] ?? []).map((bar, i) => <i key={i} className={`chart-bar ${bar.up ? 'chart-up' : ''}`} style={{ height: bar.h }} />)}</div></div><div className="home-profit"><Sparkles /><div><b>{tr('Estimasi Keuntungan')}</b><p>{tr('Jika membuka 0.01 lot | Profit')} <span className="home-positive">{signal.profit}</span> | SL <span className="home-negative">{signal.loss}</span></p></div></div><div className="home-signal-actions"><Button onClick={() => copySignal(signal)}>{copied === signal.id ? <><Check /> {tr('Tersalin')}</> : tr('Copy Signal')}</Button><Button variant="secondary" onClick={() => open(signal.symbol, `Sinyal Pasar: Open ${signal.open}, TP ${signal.tp}, SL ${signal.sl}. ${tr('Selalu Perhatikan Manajemen Risiko.')}`)}>{tr('Selengkapnya')}</Button></div></article>)}</div><p className="home-data-note">{tr('Harga Live · Selalu Perhatikan Manajemen Risiko')}</p></section>
     <div className="home-agenda">{content.agenda.map((a, i) => { const route = a.id === 'a1' ? '/pasar' : a.id === 'a2' ? '/kalender-ekonomi' : null; const content = <>{i === 0 && <Sparkles />}<span>{a.text}<br /><b>{a.bold}</b></span></>; return route ? <Button asChild key={a.id} variant="ghost"><Link to={route}>{content}</Link></Button> : <Button key={a.id} variant="ghost" onClick={() => open(a.text, a.detail)}>{content}</Button>; })}</div>

     {/* Account Balances, Marquee, & Action Links matching Position Page */}
     <section className="acct-card my-2">
       <div className="acct-equity">
         <div><small>{tr('Saldo Utama')} <CircleHelp /></small><b>{f(me ? mainOf(me) : 0)}</b></div>
         <div><small>{tr('Saldo Profit Harian')} <CircleHelp /></small><b>{f(me ? dailyProfitOf(me) : 0)}</b></div>
       </div>
       <div className="acct-margins">
         {[
           ['Saldo Deposit', f(me ? depOf(me) : 0)],
           ['Saldo Total Profit', f(me ? profitOf(me) : 0)],
           ['Compounding', `${me ? rateOf(me, compound) : 0} % / hari`],
         ].map(([k, v]) => (
           <div key={k}><small>{tr(String(k))} <CircleHelp /></small><b>{v}</b></div>
         ))}
       </div>
     </section>

     <section className="acct-real">
       <div className="acct-marquee">
         <span>{marqueeText.repeat(6)}</span>
       </div>
       <Button
         variant="outline"
         disabled={!me || depOf(me) <= 0 || !compound.enabled || me.status === 'Diblokir'}
         onClick={compoundNow}
       >
         <ArrowLeftRight /> {tr('Compounding')}
       </Button>
     </section>

     <nav className="acct-actions mb-3">
       <Link to="/withdraw"><span className="acct-icon"><ArrowUpFromLine /></span>{tr('Withdraw')}</Link>
       <Link to="/deposit"><span className="acct-icon"><Wallet /></span>{tr('Deposit')}</Link>
       <Link to="/riwayat-pembayaran"><span className="acct-icon"><ReceiptText /></span>{tr('Riwayat Pembayaran')}</Link>
     </nav>
     <TradingTerminalSection hidePositionCard={true} />
     <div className="home-info-marquee" role="region" aria-label={tr('Harga Pasar Terkini')}><span className="home-info-label">{tr('INFO PASAR')}</span><div className="home-info-window"><div className="home-info-track">{[0, 1].map((copy) => <div className="home-info-group" key={copy} aria-hidden={copy === 1}>{live.map((market) => <span key={market.id}><b>{market.symbol}</b><span>{fmt(market)}</span><i className={market.pct >= 0 ? 'home-positive' : 'home-negative'}>{market.pct >= 0 ? '+' : ''}{market.pct.toFixed(2)}%</i></span>)}<span><small>{tr('Data Pasar Real-Time · Harga Live HSB')}</small></span></div>)}</div></div></div>
    <nav className="home-bottom-nav" aria-label={tr('Navigasi utama')}>{[{ label: 'Beranda', icon: House }, { label: 'Pasar', icon: ChartNoAxesColumn }, { label: 'Posisi', icon: BriefcaseBusiness }, { label: 'Mitra', icon: Users }, { label: 'Profil', icon: UserRound }].map(({ label, icon: Icon }) => label === 'Profil' || label === 'Pasar' || label === 'Posisi' || label === 'Mitra' ? <Button asChild key={label} variant="ghost"><Link to={label === 'Pasar' ? '/pasar' : label === 'Posisi' ? '/posisi' : label === 'Mitra' ? '/mitra' : '/profil'}><Icon /><span>{tr(label)}</span></Link></Button> : <Button variant="ghost" key={label} aria-current={label === 'Beranda' ? 'page' : undefined} onClick={() => label === 'Beranda' ? window.scrollTo({ top: 0, behavior: 'smooth' }) : open(label)}><Icon /><span>{tr(label)}</span></Button>)}</nav>
     {dialog && <div className="account-dialog-backdrop" onClick={() => setDialog(null)}><section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="home-dialog-title" onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon" className="account-dialog-close" aria-label={tr('Tutup')} onClick={() => setDialog(null)}><X /></Button><h2 id="home-dialog-title">{tr(dialog.title)}</h2><p className="whitespace-pre-line">{tr(dialog.text)}</p><Button onClick={() => setDialog(null)}>{tr('Kembali')}</Button></section></div>}
  </div></main>;
}
