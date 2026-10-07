import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, ArrowUp, ArrowDown, Search, SlidersHorizontal, Star, GripHorizontal, House, ChartNoAxesColumn, BriefcaseBusiness, Users, UserRound, X, Maximize2, CandlestickChart, LineChart, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { bidPrice, type Product } from '@/lib/market-data';
import { useMarket } from '@/components/market-context';
import { SimulatedChart } from '@/components/simulated-chart';
import { useAppPreferences, translate } from '@/components/app-preferences';

export function MarketHeader({title,back=true,children}:{title:string;back?:boolean;children?:React.ReactNode}){const {language}=useAppPreferences();const tr=(text:string)=>translate(text,language);return <header className="market-header">{back&&<Button asChild variant="ghost" size="icon"><Link to="/pasar" aria-label={tr('Kembali ke pasar')}><ArrowLeft/></Link></Button>}<h1>{tr(title)}</h1><div className="market-header-actions">{children}</div></header>;}
function MarketNav(){const [notice,setNotice]=useState('');const {language}=useAppPreferences();const tr=(text:string)=>translate(text,language);return <><nav className="home-bottom-nav" aria-label={tr('Navigasi utama')}><Button asChild variant="ghost"><Link to="/beranda"><House/><span>{tr('Beranda')}</span></Link></Button><Button asChild variant="ghost"><Link to="/pasar" aria-current="page"><ChartNoAxesColumn/><span>{tr('Pasar')}</span></Link></Button><Button asChild variant="ghost"><Link to="/posisi"><BriefcaseBusiness/><span>{tr('Posisi')}</span></Link></Button><Button variant="ghost" onClick={()=>setNotice(tr('Layanan mitra belum terhubung.'))}><Users/><span>{tr('Mitra')}</span></Button><Button asChild variant="ghost"><Link to="/profil"><UserRound/><span>{tr('Profil')}</span></Link></Button></nav>{notice&&<div className="account-dialog-backdrop"><section className="account-dialog" role="dialog" aria-modal="true" aria-label={tr('Informasi')}><p>{notice}</p><Button onClick={()=>setNotice('')}>{tr('Tutup')}</Button></section></div>}</>;}
function ProductTable({items}:{items:Product[]}){const {favorites,toggleFavorite,products}=useMarket();const {language}=useAppPreferences();const tr=(text:string)=>translate(text,language);const [sort,setSort]=useState<'symbol'|'change'>('symbol');const [descending,setDescending]=useState(false);const order=(key:'symbol'|'change')=>{setDescending(sort===key?!descending:false);setSort(key);};const sorted=[...items].sort((a,b)=>(sort==='symbol'?a.symbol.localeCompare(b.symbol):a.change-b.change)*(descending?-1:1));return <div className="market-table"><div className="market-table-head"><Button variant="ghost" onClick={()=>order('symbol')}>↕ {tr('Simbol')}</Button><span>{tr('Ask Price')}<br/>{tr('Bid Price')}</span><span>{tr('Spread')}</span><Button variant="ghost" onClick={()=>order('change')}>↕ {tr('Chg')}</Button></div>{sorted.map(p=><div className="market-row" key={p.symbol}><Button variant="ghost" size="icon" className={`market-star ${favorites.includes(p.symbol)?'is-favorite':''}`} aria-label={`${favorites.includes(p.symbol)?tr('Hapus'):tr('Tambah')} ${tr('Favorit')} ${p.symbol}`} aria-pressed={favorites.includes(p.symbol)} onClick={()=>toggleFavorite(p.symbol)}><Star/></Button><Link to="/pasar/$symbol" params={{symbol:p.symbol}} className="market-product-link"><b>{p.symbol}</b><span className="market-quotes"><span className="market-up">{p.ask.toFixed(p.decimals)}</span><span className="market-down">{bidPrice(p).toFixed(p.decimals)}</span></span><span className="market-spread">{p.spread}</span><span className={`market-change ${p.change>=0?'positive':'negative'}`}>{p.change>=0?'+':''}{p.change.toFixed(2)}%</span></Link></div>)}{!sorted.length&&<div className="market-empty">{tr(items===products?'Produk tidak ditemukan':'Belum ada produk')}<small>—</small></div>}</div>;}
export function MarketScreen() {
  const { favorites, groups, products, loading, error, refresh } = useMarket();
  const { language } = useAppPreferences();
  const tr = (text: string) => translate(text, language);
  const [group, setGroup] = useState('');
  const [visible, setVisible] = useState(8);

  useEffect(() => {
    if (!loading && !group) setGroup(groups.includes('Forex') ? 'Forex' : (groups[0] ?? 'Favorit'));
  }, [group, groups, loading]);

  const setCategory = (next: string) => {
    setGroup(next);
    setVisible(8);
  };
  const list = products.filter((product) => group === 'Favorit'
    ? favorites.includes(product.symbol)
    : product.group === group);

  return <main className="market-page">
    <div className="market-shell market-list-shell">
      <MarketHeader title="Pasar" back={false}>
        <Button asChild variant="ghost" size="icon"><Link to="/cari-produk" aria-label={tr('Cari Produk')}><Search /></Link></Button>
        <Button asChild variant="ghost" size="icon"><Link to="/arrangement" aria-label={tr('Arrangement')}><SlidersHorizontal /></Link></Button>
      </MarketHeader>
      {loading ? <p className="market-empty" role="status">{tr('Memuat katalog pasar...')}</p>
        : error ? <div className="market-empty" role="alert">
          {tr(error)}
          <Button variant="outline" className="mt-3" onClick={() => void refresh().catch(() => {})}>{tr('Coba lagi')}</Button>
        </div>
          : <>
            <div className="market-tabs" role="tablist" aria-label={tr('Kategori pasar')}>
              {['Favorit', ...groups].map((item) => <Button
                variant="ghost" role="tab" aria-selected={item === group} key={item}
                onClick={() => setCategory(item)}
              >{tr(item)}</Button>)}
            </div>
            <ProductTable items={list.slice(0, visible)} />
            {list.length > visible && <div className="flex justify-center p-3">
              <Button variant="outline" onClick={() => setVisible((value) => value + 8)}>
                {tr('Load more')} ({list.length - visible} {tr('lagi')})
              </Button>
            </div>}
          </>}
      <MarketNav />
    </div>
  </main>;
}
export function SearchScreen() {
  const { products, loading, error, refresh } = useMarket();
  const { language } = useAppPreferences();
  const tr = (text: string) => translate(text, language);
  const [query, setQuery] = useState('');
  const filtered = products.filter((product) =>
    `${product.symbol} ${product.name} ${product.group}`.toLowerCase().includes(query.toLowerCase().trim()),
  );

  return <main className="market-page">
    <div className="market-shell">
      <MarketHeader title="Cari Produk" />
      <p className="market-quote-notice" role="note">{tr('Harga dan grafik adalah ilustrasi, bukan kuotasi pasar langsung.')}</p>
      <div className="market-search">
        <Search />
        <Input aria-label={tr('Pencarian Cepat')} placeholder={tr('Pencarian Cepat')} value={query} onChange={(event) => setQuery(event.target.value)} />
        {query && <Button variant="ghost" size="icon" aria-label={tr('Hapus pencarian')} onClick={() => setQuery('')}><X /></Button>}
      </div>
      {loading ? <p className="market-empty" role="status">{tr('Memuat katalog pasar...')}</p>
        : error ? <div className="market-empty" role="alert">
          {tr(error)}
          <Button variant="outline" className="mt-3" onClick={() => void refresh().catch(() => {})}>{tr('Coba lagi')}</Button>
        </div>
          : filtered.length ? <ProductTable items={filtered} />
            : <p className="market-empty">{tr('Produk tidak ditemukan')}</p>}
    </div>
  </main>;
}
export function ArrangementScreen() {
  const { groups, moveGroup, loading, error, refresh } = useMarket();
  const { language } = useAppPreferences();
  const tr = (text: string) => translate(text, language);
  const [dragged, setDragged] = useState<number | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  return <main className="market-page">
    <div className="market-shell">
      <MarketHeader title="Arrangement" />
      {loading ? <p className="market-empty" role="status">{tr('Memuat katalog pasar...')}</p>
        : error ? <div className="market-empty" role="alert">
          {tr(error)}
          <Button variant="outline" className="mt-3" onClick={() => void refresh().catch(() => {})}>{tr('Coba lagi')}</Button>
        </div>
          : <>
            <div className="market-arrangement-head"><span>{tr('Symbol Group')}</span><span>{tr('Order')}</span></div>
            <div className="market-group-row">{tr('Favorit')}</div>
            {groups.map((group, index) => <div
              key={group}
              className={`market-group-row ${dragged === index ? 'is-dragging' : ''}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (dragged !== null) moveGroup(dragged, index);
                setDragged(null);
              }}
            >
              <span>{tr(group)}</span>
              <div>
                {selected === group && <>
                  <Button variant="ghost" size="icon" disabled={index === 0} aria-label={`${tr('Naikkan')} ${tr(group)}`} onClick={() => moveGroup(index, index - 1)}><ArrowUp /></Button>
                  <Button variant="ghost" size="icon" disabled={index === groups.length - 1} aria-label={`${tr('Turunkan')} ${tr(group)}`} onClick={() => moveGroup(index, index + 1)}><ArrowDown /></Button>
                </>}
                <Button
                  variant="ghost" size="icon" draggable
                  onDragStart={() => setDragged(index)}
                  onDragEnd={() => setDragged(null)}
                  onClick={() => setSelected(selected === group ? null : group)}
                  aria-expanded={selected === group}
                  aria-label={`${tr('Atur urutan')} ${tr(group)}`}
                  title={`${tr('Atur urutan')} ${tr(group)}`}
                ><GripHorizontal /></Button>
              </div>
            </div>)}
          </>}
    </div>
  </main>;
}
export function MarketDetailScreen({ product }: { product: Product }) {
  const { favorites, toggleFavorite } = useMarket();
  const { language } = useAppPreferences();
  const tr = (text: string) => translate(text, language);
  const [tab, setTab] = useState('Grafik');
  const [interval, setInterval] = useState('1m');
  const [line, setLine] = useState(false);
  const [indicator, setIndicator] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return <main className="market-page">
    <div className={`market-shell market-detail-shell ${expanded ? 'market-chart-expanded' : ''}`}>
      <MarketHeader title={product.symbol}>
        <Button variant="ghost" size="icon" className={`market-star ${favorites.includes(product.symbol) ? 'is-favorite' : ''}`} aria-label={`Favorit ${product.symbol}`} aria-pressed={favorites.includes(product.symbol)} onClick={() => toggleFavorite(product.symbol)}><Star /></Button>
      </MarketHeader>
      <p className="market-quote-notice" role="note">
        {tr('Harga dan grafik adalah ilustrasi, bukan kuotasi pasar langsung. Halaman Pasar tidak menyediakan transaksi broker.')}
      </p>
      <div className="market-detail-tabs market-tabs" role="tablist" aria-label="Detail produk">
        {['Grafik', 'Berita', 'Spesifikasi'].map((value) => <Button key={value} variant="ghost" role="tab" aria-selected={tab === value} onClick={() => setTab(value)}>{tr(value)}</Button>)}
      </div>
      {tab === 'Grafik' ? <>
        <section className="market-detail-prices">
          <strong>{product.ask.toFixed(product.decimals)}</strong>
          <dl>
            <div><dt>{tr('Ask')}</dt><dd>{product.ask.toFixed(product.decimals)}</dd></div>
            <div><dt>{tr('Bid')}</dt><dd>{bidPrice(product).toFixed(product.decimals)}</dd></div>
            <div><dt>{tr('Spread')}</dt><dd>{product.spread}</dd></div>
            <div><dt>{tr('Perubahan contoh')}</dt><dd>{product.change >= 0 ? '+' : ''}{product.change.toFixed(2)}%</dd></div>
          </dl>
        </section>
        <div className="market-chart-tools">
          <label><select aria-label="Interval grafik" value={interval} onChange={(e) => setInterval(e.target.value)}>{['1m', '5m', '15m', '1h', '1D'].map((value) => <option key={value}>{value}</option>)}</select><ChevronDown /></label>
          <Button variant="ghost" size="icon" aria-label={line ? 'Tampilkan candlestick' : 'Tampilkan garis'} onClick={() => setLine(!line)}>{line ? <LineChart /> : <CandlestickChart />}</Button>
          <Button variant="ghost" aria-pressed={indicator} onClick={() => setIndicator(!indicator)}>ƒx <span>{tr('Indicators')}</span></Button>
          <Button variant="ghost" size="icon" aria-label={expanded ? 'Kecilkan grafik' : 'Perbesar grafik'} onClick={() => setExpanded(!expanded)}><Maximize2 /></Button>
        </div>
        <div className="market-chart-label"><span>{product.symbol} · {interval}</span><small>{tr('Ilustrasi · bukan data harga live')}</small></div>
        <SimulatedChart product={product} price={product.ask} interval={interval} line={line} indicator={indicator} />
      </> : <section className="market-detail-content">
        {tab === 'Spesifikasi' ? <dl>{[['Produk', product.name], ['Kelompok', product.group], ['Mata uang contoh', 'USD'], ['Spread contoh', `${product.spread}`], ['Digit desimal', `${product.decimals}`]].map(([key, value]) => <div key={String(key)}><dt>{tr(String(key))}</dt><dd>{tr(String(value))}</dd></div>)}</dl>
          : tab === 'Berita' ? <><h2>{product.symbol}: ringkasan pasar</h2><p>Pergerakan {product.name} dalam sesi perdagangan simulasi.</p><small>Berita simulasi · Bukan rekomendasi investasi</small></>
              : <p className="market-empty">{tr('Belum ada informasi.')}</p>}
      </section>}
    </div>
  </main>;
}