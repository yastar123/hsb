import { createContext, useContext, type ReactNode } from 'react';
import { useServerContent, type SaveStatus } from '@/lib/site-content';
import bonusAsset from '@/assets/home-bonus.jpg';
import newsAsset from '@/assets/trading-news.jpg';
import demoAsset from '@/assets/welcome-demo.jpg';
import rewardsAsset from '@/assets/welcome-rewards.jpg';
import safeAsset from '@/assets/welcome-safe.jpg';
import welcomeBonusAsset from '@/assets/welcome-bonus.jpg';

export const imageLibrary: Record<string, string> = {
  'home-bonus': bonusAsset,
  'trading-news': newsAsset,
  'welcome-demo': demoAsset,
  'welcome-rewards': rewardsAsset,
  'welcome-safe': safeAsset,
  'welcome-bonus': welcomeBonusAsset,
};
export const resolveImage = (key: string) => imageLibrary[key] ?? key;

export type Banner = { id: string; image: string; alt: string; title: string; heading: string; text: string; button: string; link: string; dark: boolean; note: string };
export type Market = { id: string; symbol: string; price: string; change: string };
export type Shortcut = { id: string; label: string; link: string };
export type Signal = { id: string; symbol: string; open: string; tp: string; sl: string; profit: string; loss: string; sell: boolean };
export type Agenda = { id: string; text: string; bold: string; detail: string };
export type NewsItem = { id: string; image: string; category: string; title: string; text: string };
export type HomeContent = { banners: Banner[]; markets: Market[]; shortcuts: Shortcut[]; signals: Signal[]; agenda: Agenda[]; news: NewsItem[] };

export const uid = () => Math.random().toString(36).slice(2, 9);

export const defaultHomeContent: HomeContent = {
  banners: [
    { id: 'b1', image: 'home-bonus', alt: 'Welcome bonus hingga 350 dolar', title: 'Welcome Bonus', heading: 'TRADING\nIS NOT SCARY', text: 'Add Welcome Bonus Buat\nTambahan Modal Awalmu', button: 'MULAI & DEPOSIT', link: '/deposit', dark: true, note: '*S&K Berlaku' },
    { id: 'b2', image: 'welcome-demo', alt: 'Belajar trading dengan akun demo', title: 'Akun Demo', heading: 'BELAJAR\nTRADING', text: 'Berlatih dengan\nAkun Demo HSB', button: 'LIHAT PASAR', link: '/pasar', dark: false, note: '' },
    { id: 'b3', image: 'welcome-rewards', alt: 'Hadiah dan poin Smart Reward', title: 'Smart Reward', heading: 'SMART\nREWARD', text: 'Nikmati promo menarik\nuntuk setiap trader', button: 'LIHAT PROMO', link: '/promo', dark: false, note: '' },
  ],
  markets: [
    { id: 'm1', symbol: 'XAUUSD', price: '4168.26', change: '0.69' },
    { id: 'm2', symbol: 'USDJPY', price: '158.124', change: '0.14' },
    { id: 'm3', symbol: 'USOIL', price: '87.61', change: '-1.86' },
  ],
  shortcuts: [
    { id: 's1', label: 'Withdraw', link: '/withdraw' },
    { id: 's2', label: 'FAQ', link: '/faq' },
    { id: 's3', label: 'Deposit', link: '/deposit' },
    { id: 's4', label: 'Promo', link: '/promo' },
    { id: 's5', label: 'Proteksi Dana', link: '/proteksi-dana' },
  ],
  signals: [
    { id: 'g1', symbol: 'XAUUSD', open: '4168.33', tp: '4101', sl: '4202', profit: '+67.33$', loss: '-33.67$', sell: true },
    { id: 'g2', symbol: 'USDJPY', open: '158.124', tp: '158.800', sl: '157.800', profit: '+42.60$', loss: '-20.40$', sell: false },
  ],
  agenda: [
    { id: 'a1', text: 'Cek sinyal harian', bold: 'XAUUSD ↗', detail: 'Pantau pergerakan emas dan pasangan mata uang. Artikel lengkap belum tersedia.' },
    { id: 'a2', text: 'Siapkan strategi trading', bold: 'Rekap Agenda Penting Minggu Ini', detail: 'Kalender ekonomi dan jadwal rilis data akan tersedia setelah layanan berita terhubung.' },
  ],
  news: [
    { id: 'n1', image: 'trading-news', category: 'Edukasi', title: 'Cara Cek Aplikasi Trading yang Terdaftar di OJK dan Bappebti', text: 'Artikel contoh tentang mengenali aplikasi trading dan memeriksa informasi perizinan resmi.' },
    { id: 'n2', image: 'home-bonus', category: 'Belajar Trading', title: '47 Istilah Trading Forex', text: 'Kenali istilah dasar forex, lot, leverage, dan pengelolaan risiko.' },
    { id: 'n3', image: 'trading-news', category: 'Analisa Teknikal', title: 'Cara Analisa Teknikal', text: 'Artikel contoh: memahami tren, support, dan resistance.' },
  ],
};

type Ctx = { content: HomeContent; setContent: (c: HomeContent | ((p: HomeContent) => HomeContent)) => void; reset: () => void; status: SaveStatus; error: string };
const HomeContentContext = createContext<Ctx | null>(null);

export function HomeContentProvider({ children }: { children: ReactNode }) {
  const remote = useServerContent<HomeContent>('home', defaultHomeContent);
  return <HomeContentContext.Provider value={{ content: remote.value, setContent: remote.setValue, reset: () => remote.setValue(defaultHomeContent), status: remote.status, error: remote.error }}>{children}</HomeContentContext.Provider>;
}

export function useHomeContent() {
  const ctx = useContext(HomeContentContext);
  if (!ctx) throw new Error('useHomeContent must be used within HomeContentProvider');
  return ctx;
}
