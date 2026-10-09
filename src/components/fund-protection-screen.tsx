import { Link } from '@tanstack/react-router';
import { ArrowLeft, FileCheck, Landmark, LockKeyhole, ShieldCheck, TrendingDown, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const pillars = [
  { icon: Landmark, title: 'Dana Klien Terpisah', text: 'Dana klien disimpan di akun bank terpisah dari dana operasional perusahaan, sehingga tidak dipakai untuk keperluan lain.' },
  { icon: TrendingDown, title: 'Proteksi Saldo Negatif', text: 'Kerugian Anda dibatasi hingga saldo akun. Position yang sangat bergerak tidak akan membuat saldo Anda berutang.' },
  { icon: LockKeyhole, title: 'Enkripsi Data', text: 'Data pribadi dan transaksi dijaga dengan enkripsi standar industri saat dikirim maupun saat tersimpan.' },
  { icon: UserCheck, title: 'Keamanan Akun', text: 'Sistem proteksi akun otomatis menjaga keamanan akses setiap saat tanpa hambatan verifikasi.' },
  { icon: FileCheck, title: 'Penarikan Cepat & Aman', text: 'Permintaan penarikan diproses secara aman langsung ke rekening Anda tanpa penundaan.' },
  { icon: ShieldCheck, title: 'Pengawasan Regulator', text: 'Layanan trading diawasi oleh regulator yang berlaku, dengan pelaporan dan audit berkala.' },
];

export function FundProtectionScreen() {
  return <main className="home-page"><div className="home-shell acct-shell acct-plain ins-shell">
    <header className="acct-header"><Button asChild variant="ghost" size="icon"><Link to="/beranda" aria-label="Kembali"><ArrowLeft /></Link></Button><h1>Proteksi Dana</h1></header>
    <p className="ins-intro">Keamanan dana Anda adalah prioritas kami. Berikut lapisan perlindungan yang berlaku pada setiap akun trading.</p>
    <div className="ins-cards">{pillars.map(({ icon: Icon, title, text }) => <article key={title} className="ins-card"><h2><Icon /> {title}</h2><p>{text}</p></article>)}</div>
    <p className="ins-foot">Trading mengandung risiko. Informasi ini bersifat edukatif dan bukan janji keuntungan. Layanan akun sungguhan belum diaktifkan pada pratinjau ini.</p>
  </div></main>;
}
