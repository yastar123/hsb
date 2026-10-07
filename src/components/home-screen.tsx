import { useEffect, useState } from 'react';
import { loadNotifs } from '@/lib/notifications';
import { Link } from '@tanstack/react-router';
import { Bell, Headphones, House, ChartNoAxesColumn, BriefcaseBusiness, Users, UserRound, BadgeHelp, Wallet, BadgePercent, ShieldCheck, WalletCards, Sparkles, Newspaper, ArrowDown, ArrowUpRight, Check, X, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHomeContent, resolveImage, type Signal } from '@/components/home-content';

const shortcutIcons: Record<string, typeof Wallet> = { Withdraw: WalletCards, FAQ: BadgeHelp, Deposit: Wallet, Promo: BadgePercent, 'Proteksi Dana': ShieldCheck };
const lines = (t: string) => t.split('\n').map((l, i, a) => <span key={i}>{l}{i < a.length - 1 && <br />}</span>);
type AppPath = '/withdraw' | '/faq' | '/deposit' | '/promo' | '/proteksi-dana' | '/pasar' | '/berita' | '/posisi' | '/mitra' | '/profil' | '/sinyal-trading' | '/kalender-ekonomi' | '/beranda';
export function HomeScreen() {
  const { content } = useHomeContent();
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
  const open = (title: string, text = 'Layanan ini belum terhubung. Saat ini tersedia tampilan pratinjau.') => setDialog({ title, text });
  const copySignal = async (signal: Signal) => {
    try { await navigator.clipboard.writeText(`${signal.symbol} | ${signal.sell ? 'SELL' : 'BUY'} | Open ${signal.open} | TP ${signal.tp} | SL ${signal.sl}`); setCopied(signal.id); }
    catch { open('Salin Sinyal', `${signal.symbol} · Open ${signal.open} · TP ${signal.tp} · SL ${signal.sl}`); }
  };
  return <main className="home-page"><div className="home-shell">
    <header className="home-header"><Link to="/beranda" aria-label="HSB Beranda"><img src="/hsb-mark.svg" alt="HSB" width="23" height="23" /></Link><div><Button variant="ghost" size="icon" aria-label="Notifikasi" onClick={() => { const n = loadNotifs().filter((x) => x.target === 'all'); open('Notifikasi', n.length ? n.map((x) => `${x.title}: ${x.message}`).join('\n\n') : 'Belum ada notifikasi.'); }}><Bell /></Button><Button variant="ghost" size="icon" aria-label="Bantuan" onClick={() => open('Pusat Bantuan', 'Untuk pertanyaan umum, buka menu FAQ. Layanan bantuan pelanggan belum terhubung.')}><Headphones /></Button></div></header>
    {activeBanner && <section className={`home-hero home-carousel ${activeBanner.dark ? '' : 'home-hero-light'}`} aria-label="Promo HSB" aria-roledescription="carousel" data-slide={banner} onKeyDown={(e) => { if (e.key === 'ArrowRight') setBanner((v) => (v + 1) % banners.length); if (e.key === 'ArrowLeft') setBanner((v) => (v + banners.length - 1) % banners.length); }}>
      {banners.map((item, index) => <div key={item.id} className={`home-banner-slide ${item === activeBanner ? 'is-active' : ''}`} aria-hidden={item !== activeBanner}><img src={resolveImage(item.image)} alt={item.alt} width="1536" height="768" /></div>)}
      <div className="home-hero-copy"><h1>{lines(activeBanner.heading)}</h1><p>{lines(activeBanner.text)}</p>{activeBanner.button && <Button variant={activeBanner.dark ? 'heroLime' : 'default'} asChild><Link to={activeBanner.link as AppPath}>{activeBanner.button} <ArrowUpRight /></Link></Button>}{activeBanner.note && <small>{activeBanner.note}</small>}</div>
      {activeBanner.dark && activeBanner === banners[0] && <span className="home-bonus-label">Bonus Hingga</span>}
      <nav className="home-carousel-controls" aria-label="Pilih banner">{banners.map((item, index) => <Button key={item.id} variant="ghost" className="home-carousel-dot" aria-label={`Banner ${index + 1}: ${item.title}`} aria-current={activeBanner === item ? 'true' : undefined} onClick={() => setBanner(index)}><span /></Button>)}<Button variant="ghost" size="icon" className="home-carousel-pause" aria-label={paused ? 'Putar banner otomatis' : 'Jeda banner otomatis'} onClick={() => setPaused(!paused)}>{paused ? <Play /> : <Pause />}</Button></nav>
    </section>}
    <div className="home-ticker">{live.map((market) => <Button variant="ghost" key={market.id} onClick={() => open(market.symbol, `Harga simulasi ${fmt(market)}. Data ini bukan harga pasar langsung.`)}><span>{market.symbol}<small>{fmt(market)} <i className={market.pct >= 0 ? 'home-positive' : 'home-negative'}>{market.pct >= 0 ? '+' : ''}{market.pct.toFixed(2)}%</i></small></span></Button>)}</div>
    <nav className="home-shortcuts" aria-label="Menu cepat">{content.shortcuts.map(({ id, label, link }) => { const Icon = shortcutIcons[label] ?? Sparkles; return <Button asChild variant="ghost" key={id}><Link to={link as AppPath}><Icon /><span>{label}</span></Link></Button>; })}</nav>

    <section className="home-section"><div className="home-section-heading"><Sparkles /><div><h2>Sinyal Trading</h2><p>Trading menjadi lebih mudah dengan analisa profesional</p></div><Button variant="link" onClick={() => open('Sinyal Trading', 'Sinyal XAUUSD dan USDJPY merupakan data contoh, bukan rekomendasi transaksi.')}>Lihat Semua</Button></div><div className="home-signal-track">{signals.map((signal, si) => <article className={`home-signal ${signal.sell ? 'home-signal-sell' : 'home-signal-buy'}`} key={signal.id}><div className="home-signal-heading"><b><span className="home-coin">{signal.symbol === 'XAUUSD' ? '✦' : '$'}</span>{signal.symbol}</b><span className={signal.sell ? 'home-negative' : 'home-positive'}>{signal.sell ? 'Jual Signal' : 'Beli Signal'} <ArrowDown /></span></div><div className="home-signal-data"><dl><div><dt>Open</dt><dd>{signal.open}</dd></div><div><dt>TP</dt><dd>{signal.tp}</dd></div><div><dt>SL</dt><dd>{signal.sl}</dd></div></dl><div className="home-minichart" aria-label="Ilustrasi pergerakan harga">{(bars[si] ?? []).map((bar, i) => <i key={i} className={`chart-bar ${bar.up ? 'chart-up' : ''}`} style={{ height: bar.h }} />)}</div></div><div className="home-profit"><Sparkles /><div><b>Estimasi Keuntungan</b><p>Jika membuka 0.01 lot | Profit <span className="home-positive">{signal.profit}</span> | SL <span className="home-negative">{signal.loss}</span></p></div></div><div className="home-signal-actions"><Button onClick={() => copySignal(signal)}>{copied === signal.id ? <><Check /> Tersalin</> : 'Copy Signal'}</Button><Button variant="secondary" onClick={() => open(signal.symbol, `Sinyal contoh: Open ${signal.open}, TP ${signal.tp}, SL ${signal.sl}. Bukan rekomendasi investasi.`)}>Selengkapnya</Button></div></article>)}</div><p className="home-data-note">Data contoh · Bukan rekomendasi investasi</p></section>
    <div className="home-agenda">{content.agenda.map((a, i) => <Button key={a.id} variant="ghost" onClick={() => open(a.text, a.detail)}>{i === 0 && <Sparkles />}<span>{a.text}<br /><b>{a.bold}</b></span></Button>)}</div>
    <div className="home-info-marquee" role="region" aria-label="Info pasar simulasi"><span className="home-info-label">INFO PASAR</span><div className="home-info-window"><div className="home-info-track">{[0, 1].map((copy) => <div className="home-info-group" key={copy} aria-hidden={copy === 1}>{live.map((market) => <span key={market.id}><b>{market.symbol}</b><span>{fmt(market)}</span><i className={market.pct >= 0 ? 'home-positive' : 'home-negative'}>{market.pct >= 0 ? '+' : ''}{market.pct.toFixed(2)}%</i></span>)}<span><small>Data simulasi · Bukan harga pasar langsung</small></span></div>)}</div></div></div>
    <section className="home-section home-news-section"><div className="home-section-heading"><Newspaper /><div><h2>Berita Ekonomi</h2><p>Tetap up-to-date dengan berita terbaru</p></div><Button asChild variant="link"><Link to="/berita">Lihat Semua</Link></Button></div>{content.news.length > 0 && <div className="home-news-grid">{(() => { const [main, ...rest] = content.news; if (!main) return null; return <><Button className="home-news-main" variant="ghost" onClick={() => open(main.title, main.text)}><img src={resolveImage(main.image)} alt={main.title} loading="lazy" width="1024" height="768" /><span>{main.title}</span></Button>{rest.length > 0 && <div className="home-news-side">{rest.map((n) => <Button key={n.id} variant="ghost" onClick={() => open(n.title, n.text)}><img src={resolveImage(n.image)} alt={n.title} width="1024" height="768" loading="lazy" /><span><small>{n.category}</small>{n.title}</span></Button>)}</div>}</>; })()}</div>}</section>
    <nav className="home-bottom-nav" aria-label="Navigasi utama">{[{ label: 'Beranda', icon: House }, { label: 'Pasar', icon: ChartNoAxesColumn }, { label: 'Posisi', icon: BriefcaseBusiness }, { label: 'Mitra', icon: Users }, { label: 'Profil', icon: UserRound }].map(({ label, icon: Icon }) => label === 'Profil' || label === 'Pasar' || label === 'Posisi' || label === 'Mitra' ? <Button asChild key={label} variant="ghost"><Link to={label === 'Pasar' ? '/pasar' : label === 'Posisi' ? '/posisi' : label === 'Mitra' ? '/mitra' : '/login'}><Icon /><span>{label}</span></Link></Button> : <Button variant="ghost" key={label} aria-current={label === 'Beranda' ? 'page' : undefined} onClick={() => label === 'Beranda' ? window.scrollTo({ top: 0, behavior: 'smooth' }) : open(label)}><Icon /><span>{label}</span></Button>)}</nav>
    {dialog && <div className="account-dialog-backdrop" onClick={() => setDialog(null)}><section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="home-dialog-title" onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon" className="account-dialog-close" aria-label="Tutup" onClick={() => setDialog(null)}><X /></Button><h2 id="home-dialog-title">{dialog.title}</h2><p className="whitespace-pre-line">{dialog.text}</p><Button onClick={() => setDialog(null)}>Kembali</Button></section></div>}
  </div></main>;
}
