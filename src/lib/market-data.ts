export type MarketGroup = string;
export type Product = { symbol: string; name: string; group: MarketGroup; ask: number; spread: number; decimals: number; change: number };
export const products: Product[] = [
  { symbol:'AUDJPY',name:'Australian Dollar / Japanese Yen',group:'Forex',ask:110.401,spread:28,decimals:3,change:0.30 },
  { symbol:'AUDNZD',name:'Australian Dollar / New Zealand Dollar',group:'Forex',ask:1.24284,spread:31,decimals:5,change:-0.11 },
  { symbol:'AUDUSD',name:'Australian Dollar / US Dollar',group:'Forex',ask:0.69828,spread:23,decimals:5,change:0.14 },
  { symbol:'EURAUD',name:'Euro / Australian Dollar',group:'Forex',ask:1.61279,spread:44,decimals:5,change:0.22 },
  { symbol:'EURCHF',name:'Euro / Swiss Franc',group:'Forex',ask:0.93549,spread:30,decimals:5,change:0.34 },
  { symbol:'EURGBP',name:'Euro / British Pound',group:'Forex',ask:0.84837,spread:22,decimals:5,change:-0.04 },
  { symbol:'EURJPY',name:'Euro / Japanese Yen',group:'Forex',ask:178.016,spread:26,decimals:3,change:0.46 },
  { symbol:'EURUSD',name:'Euro / US Dollar',group:'Forex',ask:1.12593,spread:20,decimals:5,change:0.33 },
  { symbol:'GBPAUD',name:'British Pound / Australian Dollar',group:'Forex',ask:1.90125,spread:40,decimals:5,change:0.27 },
  { symbol:'GBPCHF',name:'British Pound / Swiss Franc',group:'Forex',ask:1.10287,spread:42,decimals:5,change:0.40 },
  { symbol:'GBPJPY',name:'British Pound / Japanese Yen',group:'Forex',ask:209.845,spread:35,decimals:3,change:0.53 },
  { symbol:'GBPUSD',name:'British Pound / US Dollar',group:'Forex',ask:1.32737,spread:22,decimals:5,change:0.40 },
  { symbol:'USDJPY',name:'US Dollar / Japanese Yen',group:'Forex',ask:158.124,spread:24,decimals:3,change:0.14 },
  { symbol:'XAUUSD',name:'Gold / US Dollar',group:'Metal',ask:4168.26,spread:32,decimals:2,change:0.69 },
  { symbol:'XAGUSD',name:'Silver / US Dollar',group:'Metal',ask:48.325,spread:25,decimals:3,change:0.82 },
  { symbol:'USOIL',name:'West Texas Intermediate',group:'Energy',ask:87.61,spread:3,decimals:2,change:-1.86 },
  { symbol:'UKOIL',name:'Brent Crude Oil',group:'Energy',ask:91.24,spread:4,decimals:2,change:-1.24 },
  { symbol:'US30',name:'Dow Jones Industrial Average',group:'Index',ask:42852.4,spread:20,decimals:1,change:0.42 },
  { symbol:'NAS100',name:'Nasdaq 100',group:'Index',ask:21345.6,spread:15,decimals:1,change:0.76 },
];
export const bidPrice = (p: Product) => p.ask - p.spread / 10 ** p.decimals;
export const marketMeta = (title: string, description: string) => ({ meta:[{title:`${title} — HSB Trading`},{name:'description',content:description},{property:'og:title',content:`${title} — HSB Trading`},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}] });