import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, ArrowUp, ArrowDown, Search, SlidersHorizontal, Star, GripHorizontal, House, ChartNoAxesColumn, BriefcaseBusiness, Users, UserRound, X, Maximize2, CandlestickChart, LineChart, ChevronDown, Menu, Wallet, Lock, TrendingUp, WalletCards, FileBarChart, CircleHelp, ArrowLeftRight, ArrowUpFromLine, ReceiptText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { bidPrice, type Product } from '@/lib/market-data';
import { useMarket } from '@/components/market-context';
import { SimulatedChart } from '@/components/simulated-chart';
import { TradingViewChart } from '@/components/trading-view-chart';
import { useAppPreferences, translate } from '@/components/app-preferences';
import { useLedger, mainOf, depOf, profitOf, dailyProfitOf, rateOf } from '@/components/ledger-content';

export function MarketHeader({title,back=true,children}:{title:string;back?:boolean;children?:React.ReactNode}){const {language}=useAppPreferences();const tr=(text:string)=>translate(text,language);return <header className="market-header">{back&&<Button asChild variant="ghost" size="icon"><Link to="/pasar" aria-label={tr('Kembali ke pasar')}><ArrowLeft/></Link></Button>}<h1>{tr(title)}</h1><div className="market-header-actions">{children}</div></header>;}
function MarketNav(){const [notice,setNotice]=useState('');const {language}=useAppPreferences();const tr=(text:string)=>translate(text,language);return <><nav className="home-bottom-nav" aria-label={tr('Navigasi utama')}><Button asChild variant="ghost"><Link to="/beranda"><House/><span>{tr('Beranda')}</span></Link></Button><Button asChild variant="ghost"><Link to="/pasar" aria-current="page"><ChartNoAxesColumn/><span>{tr('Pasar')}</span></Link></Button><Button asChild variant="ghost"><Link to="/posisi"><BriefcaseBusiness/><span>{tr('Posisi')}</span></Link></Button><Button variant="ghost" onClick={()=>setNotice(tr('Layanan mitra belum terhubung.'))}><Users/><span>{tr('Mitra')}</span></Button><Button asChild variant="ghost"><Link to="/profil"><UserRound/><span>{tr('Profil')}</span></Link></Button></nav>{notice&&<div className="account-dialog-backdrop"><section className="account-dialog" role="dialog" aria-modal="true" aria-label={tr('Informasi')}><p>{notice}</p><Button onClick={()=>setNotice('')}>{tr('Tutup')}</Button></section></div>}</>;}
export function ProductTable({items}:{items:Product[]}){const {favorites,toggleFavorite,products}=useMarket();const {language}=useAppPreferences();const tr=(text:string)=>translate(text,language);const [sort,setSort]=useState<'symbol'|'change'>('symbol');const [descending,setDescending]=useState(false);const order=(key:'symbol'|'change')=>{setDescending(sort===key?!descending:false);setSort(key);};const sorted=[...items].sort((a,b)=>(sort==='symbol'?a.symbol.localeCompare(b.symbol):a.change-b.change)*(descending?-1:1));return <div className="market-table"><div className="market-table-head"><Button variant="ghost" onClick={()=>order('symbol')}>↕ {tr('Simbol')}</Button><span>{tr('Ask Price')}<br/>{tr('Bid Price')}</span><span>{tr('Spread')}</span><Button variant="ghost" onClick={()=>order('change')}>↕ {tr('Chg')}</Button></div>{sorted.map(p=><div className="market-row" key={p.symbol}><Button variant="ghost" size="icon" className={`market-star ${favorites.includes(p.symbol)?'is-favorite':''}`} aria-label={`${favorites.includes(p.symbol)?tr('Hapus'):tr('Tambah')} ${tr('Favorit')} ${p.symbol}`} aria-pressed={favorites.includes(p.symbol)} onClick={()=>toggleFavorite(p.symbol)}><Star/></Button><Link to="/pasar/$symbol" params={{symbol:p.symbol}} className="market-product-link"><b>{p.symbol}</b><span className="market-quotes"><span className="market-up">{p.ask.toFixed(p.decimals)}</span><span className="market-down">{bidPrice(p).toFixed(p.decimals)}</span></span><span className="market-spread">{p.spread}</span><span className={`market-change ${p.change>=0?'positive':'negative'}`}>{p.change>=0?'+':''}{p.change.toFixed(2)}%</span></Link></div>)}{!sorted.length&&<div className="market-empty">{tr(items===products?'Produk tidak ditemukan':'Belum ada produk')}<small>—</small></div>}</div>;}

export function MarketCatalogSection() {
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
  const list = products.filter((product) =>
    group === 'Favorit'
      ? favorites.includes(product.symbol)
      : product.group === group,
  );

  if (loading) return <p className="market-empty" role="status">{tr('Memuat katalog pasar...')}</p>;
  if (error) return (
    <div className="market-empty" role="alert">
      {tr(error)}
      <Button variant="outline" className="mt-3" onClick={() => void refresh().catch(() => {})}>{tr('Coba lagi')}</Button>
    </div>
  );

  return (
    <section className="market-catalog-section my-3">
      <div className="market-tabs" role="tablist" aria-label={tr('Kategori pasar')}>
        {['Favorit', ...groups].map((item) => (
          <Button
            variant="ghost"
            role="tab"
            aria-selected={item === group}
            key={item}
            onClick={() => setCategory(item)}
          >
            {tr(item)}
          </Button>
        ))}
      </div>
      <ProductTable items={list.slice(0, visible)} />
      {list.length > visible && (
        <div className="flex justify-center p-3">
          <Button variant="outline" onClick={() => setVisible((value) => value + 8)}>
            {tr('Load more')} ({list.length - visible} {tr('lagi')})
          </Button>
        </div>
      )}
    </section>
  );
}
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
  const { products } = useMarket();
  const { language } = useAppPreferences();
  const tr = (text: string) => translate(text, language);
  const navigate = useNavigate();

  let ledgerData: ReturnType<typeof useLedger> | null = null;
  try {
    ledgerData = useLedger();
  } catch {
    // Ledger context fallback for tests
  }
  const currentUser = ledgerData?.currentUser;
  const users = ledgerData?.users ?? [];
  const compound = ledgerData?.compound ?? { globalRate: 0, enabled: false };
  const currentEmail = ledgerData?.currentEmail ?? '';
  const transferDepositToMain = ledgerData?.transferDepositToMain;

  const me = users.find((u) => u.email.toLowerCase() === (currentEmail || currentUser?.email || '').toLowerCase())
    ?? (currentUser ? users.find((u) => u.id === currentUser.id) : null);

  const f = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const [notice, setNotice] = useState('');

  const compoundNow = async () => {
    if (!me || !transferDepositToMain) return;
    try {
      const moved = await transferDepositToMain(me.id);
      if (moved > 0) setNotice(`${tr('Saldo deposit')} $${f(moved)} ${tr('dipindahkan ke saldo utama. Akrual harian mengikuti tarif admin.')}`);
      else if (!compound.enabled) setNotice(tr('Compounding sedang dinonaktifkan admin.'));
      else if (me.status !== 'Aktif') setNotice(tr('Akun belum aktif untuk compounding.'));
      else setNotice(tr('Tidak ada saldo deposit yang dapat dipindahkan.'));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : tr('Pemindahan saldo gagal.'));
    }
  };

  const marquee = me ? `Saldo akun · tarif akrual admin ${rateOf(me, compound)}% per hari · ` : 'Masuk ke akun untuk melihat saldo dan transaksi - ';

  const balance = me ? mainOf(me) : 136.43;
  const equityFormatted = balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const [currentProduct, setCurrentProduct] = useState(product);
  useEffect(() => {
    setCurrentProduct(product);
  }, [product]);

  const [timeframe, setTimeframe] = useState('1H');
  const [expanded, setExpanded] = useState(false);

  const tickerProducts = products.length ? products : [product];
  const availableInstruments = [
    { symbol: 'XAUUSD', name: 'Gold', icon: 'Au' },
    { symbol: 'BTCUSD', name: 'Bitcoin', icon: '₿' },
    { symbol: 'EURUSD', name: 'EUR/USD', icon: '€' },
    { symbol: 'GBPUSD', name: 'GBP/USD', icon: '£' },
  ];

  return (
    <main className="market-page min-h-screen bg-background text-foreground pb-20">
      <div className={`market-shell max-w-md mx-auto min-h-screen ${expanded ? 'market-chart-expanded' : ''}`}>
        
        {/* Navigation Header */}
        <header className="market-header border-b border-border bg-card px-2">
          <Button asChild variant="ghost" size="icon">
            <Link to="/pasar" aria-label={tr('Kembali')}>
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="text-base font-bold text-foreground">{currentProduct.symbol}</h1>
        </header>

        {/* Top Status & Trading Terminal Banner */}
        <section className="p-3.5 bg-card/80 border-b border-border space-y-3">
          <div className="flex items-center justify-between gap-2 text-[10px]">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{tr('KONEKSI LANGSUNG')}</span>
            </div>
            <div className="px-2.5 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground font-mono font-semibold">
              {tr('1 ENTRI · 30 HARI')}
            </div>
          </div>

          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground">{tr('Terminal Trading')}</h1>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              {tr('Pilih satu pasar dan gunakan seluruh modal yang tersedia. Posisi terkunci secara otomatis setelah satu kali klik.')}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-background border border-border/80 text-center">
              <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{tr('EKUITAS')}</span>
              <span className="block text-sm font-extrabold text-foreground font-mono mt-0.5">${equityFormatted}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-background border border-border/80 text-center">
              <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{tr('TERSEDIA')}</span>
              <span className="block text-sm font-extrabold text-foreground font-mono mt-0.5">$0.00</span>
            </div>
            <div className="p-2.5 rounded-xl bg-background border border-border/80 text-center">
              <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{tr('STATUS')}</span>
              <span className="inline-flex items-center justify-center gap-1 text-xs font-bold text-emerald-400 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{tr('TERKUNCI')}</span>
              </span>
            </div>
          </div>
        </section>

        {/* Horizontal Instrument Ticker - Infinite Auto Marquee */}
        <section className="market-ticker-marquee" role="region" aria-label={tr('Pergerakan Harga Pasar')}>
          <div className="market-ticker-track">
            {[0, 1].map((copyIndex) => (
              <div key={copyIndex} className="flex items-center gap-2">
                {tickerProducts.map((item) => (
                  <button
                    key={`${copyIndex}-${item.symbol}`}
                    onClick={() => {
                      setCurrentProduct(item);
                      void navigate({ to: '/pasar/$symbol', params: { symbol: item.symbol } });
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-left transition-all ${
                      item.symbol === currentProduct.symbol
                        ? 'bg-primary/15 border-primary text-foreground shadow-sm'
                        : 'bg-card border-border hover:border-primary/40 text-muted-foreground'
                    }`}
                  >
                    <span className="text-[11px] font-bold text-foreground">{item.symbol}</span>
                    <span className="text-xs font-bold font-mono text-foreground">{item.ask.toFixed(item.decimals)}</span>
                    <span className={`text-[10px] font-mono font-bold ${item.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* MARKET WATCH Instrument Selector */}
        <section className="p-3.5 bg-card border-b border-border space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">{tr('PANTAU PASAR')}</span>
              <h2 className="text-sm font-bold text-foreground">{tr('Pilih instrumen')}</h2>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{tr('Data pasar streaming')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {availableInstruments.map((inst) => {
              const matched = products.find((p) => p.symbol === inst.symbol);
              const isActive = inst.symbol === currentProduct.symbol;
              return (
                <button
                  key={inst.symbol}
                  onClick={() => {
                    if (matched) {
                      setCurrentProduct(matched);
                      void navigate({ to: '/pasar/$symbol', params: { symbol: matched.symbol } });
                    }
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                    isActive
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                      : 'bg-background border-border hover:border-border/80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-amber-400">{inst.icon}</span>
                    <div>
                      <span className="block text-xs font-bold text-foreground">{inst.symbol}</span>
                      <span className="block text-[9px] text-muted-foreground">{inst.name}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-secondary text-muted-foreground border border-border">
                    {tr('TERKUNCI')}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Active Instrument Header & Timeframe Bar */}
        <section className="p-3.5 bg-background border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-foreground">{currentProduct.symbol}</span>
              <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                • {tr('LANGSUNG')}
              </span>
            </div>
            <div className="text-right font-mono">
              <div className="text-sm font-extrabold text-foreground">{currentProduct.ask.toFixed(currentProduct.decimals)}</div>
              <div className={`text-[10px] font-bold ${currentProduct.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {currentProduct.change >= 0 ? '+' : ''}{currentProduct.change.toFixed(2)}%
              </div>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground block -mt-2">{currentProduct.name} · Bitstamp</span>

          <div className="flex items-center gap-1 p-1 bg-card rounded-xl border border-border text-xs font-mono">
            {['5M', '15M', '1H', '4H', '1D'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`flex-1 py-1 rounded-lg text-center font-bold transition-all ${
                  timeframe === tf
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </section>

        {/* Interactive Chart Section */}
        <section className="bg-background relative border-b border-border p-2">
          <TradingViewChart
            product={currentProduct}
            timeframe={timeframe}
          />
        </section>

        {/* Active Position / ORDER TICKET Card */}
        <section className="p-3.5 bg-card border-t border-border space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">{tr('KARTU PESANAN')}</span>
                <h3 className="text-sm font-bold text-foreground">{tr('Posisi aktif')}</h3>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{tr('POSISI TERKUNCI')}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-background border border-border space-y-2.5">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-border/60">
              <span className="text-muted-foreground font-semibold">{tr('INSTRUMEN')}</span>
              <span className="font-bold text-foreground font-mono">{currentProduct.symbol}</span>
            </div>
            <div className="flex items-center justify-between text-xs pb-2 border-b border-border/60">
              <span className="text-muted-foreground font-semibold">{tr('P&L BERJALAN')}</span>
              <span className="font-bold text-emerald-400 font-mono">+$0.00</span>
            </div>
            <div className="flex items-center justify-between text-xs pb-2 border-b border-border/60">
              <span className="text-muted-foreground font-semibold">{tr('MODAL')}</span>
              <span className="font-bold text-foreground font-mono">${equityFormatted}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-semibold">{tr('SIKLUS')}</span>
              <div className="text-right">
                <span className="font-bold text-foreground font-mono block">{tr('Hari 1 dari 30')}</span>
                <span className="text-[10px] text-muted-foreground">{tr('Sisa 29 hari')}</span>
              </div>
            </div>
          </div>

          <Button disabled className="w-full h-11 bg-muted border border-border text-muted-foreground font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
            <Lock className="h-4 w-4" />
            <span>{tr('Posisi telah terkunci')}</span>
          </Button>
          <p className="text-[10px] text-center text-muted-foreground leading-snug">
            {tr('Akun ini tidak dapat membuka posisi lain sampai siklus 30 hari selesai.')}
          </p>
        </section>

        {/* Account Balances & Compounding Summary matching Position Page */}
        <section className="acct-card">
          <div className="acct-equity">
            <div>
              <small>{tr('Saldo Utama')} <CircleHelp /></small>
              <b>{f(me ? mainOf(me) : 0)}</b>
            </div>
            <div>
              <small>{tr('Saldo Profit Harian')} <CircleHelp /></small>
              <b>{f(me ? dailyProfitOf(me) : 0)}</b>
            </div>
          </div>
          <div className="acct-margins">
            {[
              ['Saldo Deposit', f(me ? depOf(me) : 0)],
              ['Saldo Total Profit', f(me ? profitOf(me) : 0)],
              ['Compounding', `${me ? rateOf(me, compound) : 0} % / hari`],
            ].map(([k, v]) => (
              <div key={k}>
                <small>{tr(String(k))} <CircleHelp /></small>
                <b>{v}</b>
              </div>
            ))}
          </div>
        </section>

        <section className="acct-real">
          <div className="acct-marquee">
            <span>{marquee.repeat(6)}</span>
          </div>
          <Button
            variant="outline"
            disabled={!me || depOf(me) <= 0 || !compound.enabled || me.status !== 'Aktif'}
            onClick={compoundNow}
          >
            <ArrowLeftRight /> {tr('Compounding')}
          </Button>
        </section>

        <nav className="acct-actions">
          <Link to="/withdraw">
            <span className="acct-icon"><ArrowUpFromLine /></span>
            {tr('Withdraw')}
          </Link>
          <Link to="/deposit">
            <span className="acct-icon"><Wallet /></span>
            {tr('Deposit')}
          </Link>
          <Link to="/riwayat-pembayaran">
            <span className="acct-icon"><ReceiptText /></span>
            {tr('Riwayat Pembayaran')}
          </Link>
        </nav>

        {notice && (
          <div className="account-dialog-backdrop" onClick={() => setNotice('')}>
            <section className="account-dialog" role="dialog" aria-modal="true" aria-label="Informasi" onClick={(e) => e.stopPropagation()}>
              <p>{notice}</p>
              <Button onClick={() => setNotice('')}>{tr('Tutup')}</Button>
            </section>
          </div>
        )}

        <MarketNav />
      </div>
    </main>
  );
}