import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type FaqItem = { id: string; question: string; answer: string };
export type FaqData = { title: string; intro: string; footer: string; items: FaqItem[] };

export const defaultFaqData: FaqData = {
  title: 'FAQ',
  intro: 'Pertanyaan yang sering diajukan seputar akun, deposit, dan trading di HSB.',
  footer: 'Tidak menemukan jawaban? Hubungi layanan pelanggan melalui menu Layanan Pelanggan.',
  items: [
    { id: 'f1', question: 'Bagaimana cara membuka akun?', answer: 'Tekan menu Buka Akun, isi data diri, lalu ikuti langkah verifikasi identitas (KYC). Pada pratinjau ini pendaftaran belum terhubung ke layanan akun sungguhan.' },
    { id: 'f2', question: 'Apakah ada akun demo?', answer: 'Ya. Anda dapat mencoba akun demo dengan dana virtual untuk berlatih trading tanpa risiko sebelum membuka akun sungguhan.' },
    { id: 'f3', question: 'Bagaimana cara deposit dan penarikan?', answer: 'Deposit dan penarikan dilakukan melalui rekening bank atas nama yang terdaftar di akun Anda. Setiap penarikan diperiksa sebelum diproses.' },
    { id: 'f4', question: 'Apakah dana saya aman?', answer: 'Dana klien disimpan di akun bank terpisah dari dana operasional perusahaan. Lihat halaman Proteksi Dana untuk detail lapisan perlindungan.' },
    { id: 'f5', question: 'Apa itu sinyal trading?', answer: 'Sinyal trading adalah analisa dari analis profesional berisi level Open, Take Profit (TP), dan Stop Loss (SL). Sinyal bersifat edukatif dan bukan jaminan keuntungan.' },
    { id: 'f6', question: 'Apa risiko trading?', answer: 'Trading mengandung risiko kerugian. Gunakan proteksi saldo negatif dan manajemen risiko, dan jangan pernah menggunakan dana yang tidak siap Anda rugikan.' },
  ],
};

const KEY = 'hsb-faq-data-v1';
type Ctx = { data: FaqData; setData: (u: FaqData | ((p: FaqData) => FaqData)) => void; reset: () => void };
const C = createContext<Ctx | null>(null);
export function FaqProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FaqData>(defaultFaqData);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { try { const raw = localStorage.getItem(KEY); if (raw) setData({ ...defaultFaqData, ...JSON.parse(raw) }); } catch { /* ignore */ } setLoaded(true); }, []);
  useEffect(() => { if (loaded) localStorage.setItem(KEY, JSON.stringify(data)); }, [data, loaded]);
  return <C.Provider value={{ data, setData, reset: () => setData(defaultFaqData) }}>{children}</C.Provider>;
}
export function useFaq() { const c = useContext(C); if (!c) throw new Error('FaqProvider missing'); return c; }
export const faqUid = () => Math.random().toString(36).slice(2, 9);
