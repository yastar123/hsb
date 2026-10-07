import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowDown, ArrowLeft, ArrowUp, BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/account-pages';
import { useFaq } from '@/components/faq-content';

function Header({ title }: { title: string }) {
  return <header className="acct-header"><Button asChild variant="ghost" size="icon"><Link to="/profil" aria-label="Kembali"><ArrowLeft /></Link></Button><h1>{title}</h1></header>;
}
function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return <main className="home-page"><div className="home-shell acct-shell acct-plain ins-shell"><Header title={title} />{children}</div></main>;
}

const signalData = [
  { symbol: 'AAPL', buy: true, time: '2026-10-06 03:08:26', open: '329.09', tp: '334.12', sl: '326.57', active: true },
  { symbol: 'AMZN', buy: false, time: '2026-10-06 03:08:26', open: '253.19', tp: '248.16', sl: '255.71', active: true },
  { symbol: 'AUDJPY', buy: true, time: '2026-10-06 16:08:26', open: '110.283', tp: '110.73', sl: '110.06', active: true },
  { symbol: 'XAUUSD', buy: false, time: '2026-10-05 21:14:02', open: '4172.40', tp: '4150.00', sl: '4185.00', active: false },
  { symbol: 'EURUSD', buy: true, time: '2026-10-05 09:30:11', open: '1.12410', tp: '1.12800', sl: '1.12200', active: false },
];

export function SignalScreen() {
  const [filter, setFilter] = useState('ALL');
  const [status, setStatus] = useState<'aktif' | 'kedaluwarsa'>('aktif');
  const [notice, setNotice] = useState('');
  const list = signalData.filter((s) => (filter === 'ALL' || s.symbol === filter) && s.active === (status === 'aktif'));
  const copy = async (s: typeof signalData[number]) => {
    try { await navigator.clipboard.writeText(`${s.symbol} ${s.buy ? 'BUY' : 'SELL'} Open ${s.open} TP ${s.tp} SL ${s.sl}`); setNotice(`Sinyal ${s.symbol} disalin.`); } catch { setNotice('Sinyal belum dapat disalin.'); }
  };
  return <Shell title="Sinyal Trading">
    <p className="ins-intro">Trading menjadi lebih mudah dengan meniru analisa dari analis profesional dan terpercaya dari organisasi trading central.</p>
    <button className="ins-link" onClick={() => setNotice('Pilih sinyal, tekan Copy Signal, lalu buka posisi dengan Open, TP, dan SL yang sama.')}><BookOpen /> Pelajari bagaimana untuk menggunakan Copy Signal?</button>
    <div className="ins-filters">
      <label>Filter Produk<select value={filter} onChange={(e) => setFilter(e.target.value)}><option>ALL</option>{signalData.map((s) => <option key={s.symbol}>{s.symbol}</option>)}</select></label>
      <div>Status Signal<span><button aria-pressed={status === 'aktif'} onClick={() => setStatus('aktif')}>Aktif</button><button aria-pressed={status === 'kedaluwarsa'} onClick={() => setStatus('kedaluwarsa')}>Kedaluwarsa</button></span></div>
    </div>
    <div className="ins-timeline">
      {list.length === 0 && <p className="ins-empty">Tidak ada sinyal.</p>}
      {list.map((s) => <div key={s.symbol} className="ins-item">
        <p className="ins-date"><b>{s.time.slice(8, 10)}/{s.time.slice(5, 7)}/{s.time.slice(0, 4)}</b>{s.time}</p>
        <article className={`ins-signal ${s.buy ? 'ins-buy' : 'ins-sell'}`}>
          <div className="ins-signal-top"><h2>{s.symbol}</h2><div><b>{s.buy ? 'Beli Signal' : 'Jual Signal'}</b><small>Intraday</small></div><i>{s.buy ? <ArrowUp /> : <ArrowDown />}</i></div>
          <div className="ins-signal-body"><dl><div><dt>Open</dt><dd>{s.open}</dd></div><div><dt>TP</dt><dd>{s.tp}</dd></div><div><dt>SL</dt><dd>{s.sl}</dd></div></dl>
            <div className="home-minichart" aria-hidden>{[12,18,13,27,19,22,15,32,25,20].map((h, i) => <i key={i} className={`chart-bar chart-bar-${h} ${i % 3 === 0 ? 'chart-up' : ''}`} />)}</div></div>
          <div className="home-profit"><Sparkles /><div><b>Estimasi Keuntungan:</b><p>Jika membuka 0.1 lot | Profit <span className="home-positive">0$</span> | SL <span className="home-negative">-0$</span></p></div></div>
          <div className="ins-actions"><Button onClick={() => copy(s)}>Copy Signal</Button><Button variant="secondary" disabled={!s.active} onClick={() => setNotice(`${s.symbol}: Open ${s.open}, TP ${s.tp}, SL ${s.sl}. Data contoh, bukan rekomendasi investasi.`)}>Selengkapnya</Button></div>
        </article>
      </div>)}
    </div>
    {notice && <Notice text={notice} onClose={() => setNotice('')} />}
  </Shell>;
}

const reports = [
  ['💰', 'Imbal Hasil AS Tinggi dan Sinyal Hawkish The Fed Tahan Pemulihan Emas', 'Harga emas terus tertekan oleh tingginya imbal hasil US Treasury dan keperkasaan Dolar AS, di mana meskipun pelemahan data ketenagakerjaan AS sempat meredakan spekulasi kenaikan suku bunga Oktober, pemulihan emas masih tertahan oleh retorika hawkish pejabat The Fed sembari investor menantikan rilis risalah rapat FOMC.'],
  ['🛢️', 'Pelepasan Cadangan G7 Redakan Minyak di Tengah Ancaman Geopolitik', 'Pasar minyak mendapat tekanan penurunan setelah pelepasan 100 juta barel cadangan darurat oleh negara G7 dan peningkatan ekspor Timur Tengah membantu meredakan kecemasan pasokan jangka pendek, walaupun risiko eskalasi konflik AS-Iran serta ancaman serangan terhadap infrastruktur Selat Hormuz tetap menjaga premi risiko geopolitik.'],
  ['🏢', 'Bursa AS Menguat Menjelang Musim Laporan Keuangan dan Risalah FOMC', 'Pasar saham AS mempertahankan momentum positif yang didorong oleh penguatan indeks teknologi seiring optimisme investor menjelang musim laporan keuangan kuartal ketiga, sementara pelaku pasar tetap mencermati risalah FOMC untuk petunjuk arah suku bunga.'],
];
export function DailyReportScreen() {
  const [notice, setNotice] = useState('');
  return <Shell title="">
    <p className="ins-crumb">HSB Blog <span>›</span> Daily Report HSB</p>
    <h1 className="ins-title">Daily Report HSB</h1>
    <p className="ins-meta">Updated 6 Oktober 2026 · <u>HSB Team</u></p>
    <p className="ins-share">Share {['WhatsApp', 'Telegram', 'X', 'Facebook', 'LinkedIn', 'Instagram'].map((n) => <button key={n} onClick={() => setNotice(`Berbagi ke ${n} belum tersedia pada pratinjau ini.`)}>{n[0]}</button>)}</p>
    {reports.map(([icon, title, body]) => <article key={title} className="ins-report"><h2>{icon} {title}</h2><p>{body}</p></article>)}
    {notice && <Notice text={notice} onClose={() => setNotice('')} />}
  </Shell>;
}

const events = [
  ['03.30', '🇺🇸', 'API Cushing number', '0,233 M', true], ['03.30', '🇺🇸', 'API weekly crude imports', '-0,249 M', true],
  ['03.30', '🇺🇸', 'API weekly heating oil', '-0,459 M', true], ['03.30', '🇺🇸', 'API weekly product imports', '0,435 M', true],
  ['03.30', '🇺🇸', 'API Wkly crude runs', '-0,282 M', true], ['03.30', '🇺🇸', 'API wkly crude Stk', '1,019 M', true],
  ['05.00', '🇦🇺', 'AIG Construction Index*', '-6,9', false], ['05.00', '🇦🇺', 'AIG Manufacturing Index*', '-16,6', false],
  ['06.00', '🇯🇵', 'Reuters Tankan Man\'f Idx', '21', false], ['06.00', '🇯🇵', 'Reuters Tankan N-Man Idx', '29', false],
] as const;
export function CalendarScreen() {
  const [more, setMore] = useState(false);
  return <Shell title="Kalender Ekonomi">
    <section className="ins-cal">
      <div className="ins-cal-head"><span>🇺🇸 🇯🇵 🇪🇺 <b>+9</b></span><small>Aktual: — · Prakiraan: — · Sebelumnya: —</small></div>
      {(more ? events : events.slice(0, 8)).map(([t, f, name, prev, hot]) => <div key={name} className="ins-event"><b className={hot ? 'ins-hot' : ''}>{t}</b><div><p>{name}</p><small>{f} ▮</small></div><small className="ins-prev">Sebelumnya: <b>{prev}</b></small></div>)}
      {!more && <button className="ins-more" onClick={() => setMore(true)}>Peristiwa lainnya ›</button>}
    </section>
    <p className="ins-foot">Data contoh kalender ekonomi</p>
  </Shell>;
}

const promos = [
  ['Bonus Selamat Datang $350', 'Verifikasi akun dan lakukan deposit pertama untuk klaim bonus.', 'Berakhir 31 Okt 2026'],
  ['Cashback Trading 20%', 'Dapatkan cashback dari setiap lot yang ditransaksikan bulan ini.', 'Berakhir 15 Nov 2026'],
  ['Undang Teman', 'Ajak teman bergabung dan dapatkan hadiah hingga $50 per teman.', 'Tanpa batas waktu'],
];
export function PromoScreen() {
  const [notice, setNotice] = useState('');
  return <Shell title="Promo">
    <div className="ins-cards">{promos.map(([t, d, e]) => <article key={t} className="ins-card"><h2>{t}</h2><p>{d}</p><div><small>{e}</small><Button size="sm" onClick={() => setNotice(`Klaim "${t}" belum terhubung ke layanan akun.`)}>Klaim</Button></div></article>)}</div>
    {notice && <Notice text={notice} onClose={() => setNotice('')} />}
  </Shell>;
}

export function FaqScreen() {
  const { data } = useFaq();
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return <Shell title={data.title}>
    <p className="ins-intro">{data.intro}</p>
    <div className="ins-cards">{data.items.map((f, i) => <article key={f.id} className="ins-card">
      <h2><button className="ins-link" aria-expanded={openIdx === i} onClick={() => setOpenIdx(openIdx === i ? null : i)}><BookOpen /> {f.question}</button></h2>
      {openIdx === i && <p>{f.answer}</p>}
    </article>)}</div>
    <p className="ins-foot">{data.footer}</p>
  </Shell>;
}

const tools = [
  ['Analisa Teknikal', 'Ringkasan indikator untuk XAUUSD, EURUSD, dan lainnya.'],
  ['Sentimen Pasar', 'Persentase trader yang membuka posisi beli dan jual.'],
  ['Kalkulator Lot', 'Hitung ukuran lot sesuai modal dan risiko.'],
  ['Peringatan Harga', 'Notifikasi saat harga menyentuh level tertentu.'],
];
export function SmartTraderScreen() {
  const [notice, setNotice] = useState('');
  return <Shell title="Smart Trader">
    <p className="ins-intro">Kumpulan alat bantu untuk mengambil keputusan trading lebih cerdas.</p>
    <div className="ins-cards">{tools.map(([t, d]) => <article key={t} className="ins-card"><h2><Sparkles /> {t}</h2><p>{d}</p><div><span /><Button size="sm" variant="secondary" onClick={() => setNotice(`${t} belum tersedia pada pratinjau ini.`)}>Buka</Button></div></article>)}</div>
    {notice && <Notice text={notice} onClose={() => setNotice('')} />}
  </Shell>;
}
