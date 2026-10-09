import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowDown, ArrowLeft, ArrowUp, BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/account-pages';
import { useFaq } from '@/components/faq-content';
import { useCalendarContent } from '@/components/calendar-content';
import { useAppPreferences, translate } from '@/components/app-preferences';

function Header({ title }: { title: string }) {
  const { language } = useAppPreferences();
  return <header className="acct-header"><Button asChild variant="ghost" size="icon"><Link to="/profil" aria-label={translate('Kembali', language)}><ArrowLeft /></Link></Button><h1>{translate(title, language)}</h1></header>;
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
  const { language } = useAppPreferences();
  const tr = (text: string) => translate(text, language);
  const [filter, setFilter] = useState('ALL');
  const [status, setStatus] = useState<'aktif' | 'kedaluwarsa'>('aktif');
  const [notice, setNotice] = useState('');
  const list = signalData.filter((s) => (filter === 'ALL' || s.symbol === filter) && s.active === (status === 'aktif'));
  const copy = async (s: typeof signalData[number]) => {
    try { await navigator.clipboard.writeText(`${s.symbol} ${s.buy ? 'BUY' : 'SELL'} Open ${s.open} TP ${s.tp} SL ${s.sl}`); setNotice(`Sinyal ${s.symbol} disalin.`); } catch { setNotice('Sinyal belum dapat disalin.'); }
  };
  return <Shell title="Sinyal Trading">
    <p className="ins-intro">{tr('Trading menjadi lebih mudah dengan meniru analisa dari analis profesional dan terpercaya dari organisasi trading central.')}</p>
    <button className="ins-link" onClick={() => setNotice(tr('Pilih sinyal, tekan Copy Signal, lalu buka posisi dengan Open, TP, dan SL yang sama.'))}><BookOpen /> {tr('Pelajari bagaimana untuk menggunakan Copy Signal?')}</button>
    <div className="ins-filters">
      <label>{tr('Filter Produk')}<select value={filter} onChange={(e) => setFilter(e.target.value)}><option>ALL</option>{signalData.map((s) => <option key={s.symbol}>{s.symbol}</option>)}</select></label>
      <div>{tr('Status Signal')}<span><button aria-pressed={status === 'aktif'} onClick={() => setStatus('aktif')}>{tr('Aktif')}</button><button aria-pressed={status === 'kedaluwarsa'} onClick={() => setStatus('kedaluwarsa')}>{tr('Kedaluwarsa')}</button></span></div>
    </div>
    <div className="ins-timeline">
      {list.length === 0 && <p className="ins-empty">{tr('Tidak ada sinyal.')}</p>}
      {list.map((s) => <div key={s.symbol} className="ins-item">
        <p className="ins-date"><b>{s.time.slice(8, 10)}/{s.time.slice(5, 7)}/{s.time.slice(0, 4)}</b>{s.time}</p>
        <article className={`ins-signal ${s.buy ? 'ins-buy' : 'ins-sell'}`}>
          <div className="ins-signal-top"><h2>{s.symbol}</h2><div><b>{tr(s.buy ? 'Beli Signal' : 'Jual Signal')}</b><small>{tr('Intraday')}</small></div><i>{s.buy ? <ArrowUp /> : <ArrowDown />}</i></div>
          <div className="ins-signal-body"><dl><div><dt>Open</dt><dd>{s.open}</dd></div><div><dt>TP</dt><dd>{s.tp}</dd></div><div><dt>SL</dt><dd>{s.sl}</dd></div></dl>
            <div className="home-minichart" aria-hidden>{[12,18,13,27,19,22,15,32,25,20].map((h, i) => <i key={i} className={`chart-bar chart-bar-${h} ${i % 3 === 0 ? 'chart-up' : ''}`} />)}</div></div>
          <div className="home-profit"><Sparkles /><div><b>Estimasi Keuntungan:</b><p>Jika membuka 0.1 lot | Profit <span className="home-positive">0$</span> | SL <span className="home-negative">-0$</span></p></div></div>
          <div className="ins-actions"><Button onClick={() => copy(s)}>{tr('Copy Signal')}</Button><Button variant="secondary" disabled={!s.active} onClick={() => setNotice(`${s.symbol}: Open ${s.open}, TP ${s.tp}, SL ${s.sl}. ${tr('Data contoh, bukan rekomendasi investasi.')}`)}>{tr('Selengkapnya')}</Button></div>
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

export function CalendarScreen() {
  const [more, setMore] = useState(false);
  const { events } = useCalendarContent();
  const { language } = useAppPreferences();
  const tr = (text: string) => translate(text, language);
  const ordered = [...events].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  const countries = [...new Set(ordered.map((event) => event.country))].slice(0, 3);
  return <Shell title={tr('Kalender Ekonomi')}>
    <section className="ins-cal">
      <div className="ins-cal-head"><span>{countries.join(' ')} {ordered.length > countries.length && <b>+{ordered.length - countries.length}</b>}</span><small>{tr('Aktual · Prakiraan · Sebelumnya')}</small></div>
      {(more ? ordered : ordered.slice(0, 8)).map((event) => <div key={event.id} className="ins-event"><b className={event.impact === 'Tinggi' ? 'ins-hot' : ''}>{event.time}</b><div><p>{event.name}</p><small>{event.country} · {new Date(`${event.date}T00:00:00`).toLocaleDateString(language === 'zh' ? 'zh-CN' : language === 'en' ? 'en-US' : 'id-ID')}</small></div><small className="ins-prev">{tr('Aktual:')} <b>{event.actual}</b><br />{tr('Prakiraan:')} <b>{event.forecast}</b><br />{tr('Sebelumnya:')} <b>{event.previous}</b></small></div>)}
      {!more && ordered.length > 8 && <button className="ins-more" onClick={() => setMore(true)}>{tr('Peristiwa lainnya ›')}</button>}
      {ordered.length === 0 && <p className="ins-empty">{tr('Belum ada agenda.')}</p>}
    </section>
    <p className="ins-foot">{tr('Data contoh kalender ekonomi')}</p>
  </Shell>;
}

const promos = [
  ['Bonus Selamat Datang $350', 'Lakukan deposit pertama untuk klaim bonus langsung.', 'Berakhir 31 Okt 2026'],
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

export const smartTraderTools = [
  {
    id: 'analisa-teknikal',
    title: 'Analisa Teknikal',
    summary: 'Pelajari bagaimana tren, level support dan resistance, serta indikator teknikal digunakan untuk membaca pergerakan harga.',
    points: [
      'Amati arah tren dan perubahan struktur harga.',
      'Tandai zona support dan resistance sebagai area, bukan angka yang pasti.',
      'Gunakan indikator sebagai konfirmasi, bukan jaminan arah harga.',
    ],
  },
  {
    id: 'sentimen-pasar',
    title: 'Sentimen Pasar',
    summary: 'Sentimen merangkum kecenderungan posisi beli dan jual dari sumber data tertentu.',
    points: [
      'Periksa sumber, waktu pembaruan, dan cakupan data sebelum menafsirkan sentimen.',
      'Sentimen hanya memberi konteks dan tidak memprediksi pergerakan berikutnya.',
      'Aplikasi ini belum terhubung ke sumber data posisi trader langsung.',
    ],
  },
  {
    id: 'kalkulator-lot',
    title: 'Kalkulator Lot',
    summary: 'Perencanaan ukuran posisi mempertimbangkan modal, batas risiko, jarak stop-loss, dan nilai kontrak instrumen.',
    points: [
      'Tentukan jumlah kerugian maksimum yang dapat diterima sebelum membuka posisi.',
      'Sesuaikan ukuran posisi dengan jarak stop-loss dan spesifikasi kontrak.',
      'Periksa kembali nilai pip, mata uang akun, dan ketentuan broker untuk instrumen terkait.',
    ],
  },
  {
    id: 'peringatan-harga',
    title: 'Peringatan Harga',
    summary: 'Peringatan harga memberi tahu saat suatu instrumen mencapai level yang dipilih.',
    points: [
      'Pilih instrumen, harga pemicu, dan arah kondisi yang ingin dipantau.',
      'Pastikan peringatan menggunakan kuotasi dan zona waktu yang benar.',
      'Peringatan harga dan notifikasi belum terhubung ke umpan harga langsung.',
    ],
  },
] as const;

export function SmartTraderScreen() {
  return <Shell title="Smart Trader">
    <p className="ins-intro">Kumpulan alat bantu untuk mengambil keputusan trading lebih cerdas.</p>
    <div className="ins-cards">{smartTraderTools.map((tool) => <article key={tool.id} className="ins-card"><h2><Sparkles /> {tool.title}</h2><p>{tool.summary}</p><div><span /><Button asChild size="sm" variant="secondary"><Link to="/smart-trader/$toolId" params={{ toolId: tool.id }}>Buka</Link></Button></div></article>)}</div>
  </Shell>;
}

export function SmartTraderDetailScreen({ toolId }: { toolId: string }) {
  const tool = smartTraderTools.find((item) => item.id === toolId);
  if (!tool) return <Shell title="Smart Trader"><p className="ins-empty">Alat Smart Trader tidak ditemukan.</p><Button asChild><Link to="/smart-trader">Kembali ke Smart Trader</Link></Button></Shell>;

  return <Shell title={tool.title}>
    <p className="ins-intro">{tool.summary}</p>
    <article className="ins-card">
      <h2>Gambaran umum</h2>
      <p>{tool.summary}</p>
      <h2>Cara memahami alat ini</h2>
      <ul>{tool.points.map((point) => <li key={point}>{point}</li>)}</ul>
    </article>
    <p className="ins-foot">Konten ini bersifat edukatif. Data harga di aplikasi masih berupa ilustrasi; fitur yang memerlukan data langsung belum terhubung.</p>
    <Button asChild variant="outline"><Link to="/smart-trader">Kembali ke Smart Trader</Link></Button>
  </Shell>;
}
