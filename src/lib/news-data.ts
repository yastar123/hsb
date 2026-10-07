import news from '@/assets/trading-news.jpg';
import bonus from '@/assets/home-bonus.jpg';

export const newsCategories = ['Semua', 'Berita Pasar', 'Analisa Teknikal', 'Belajar Trading'];

export interface NewsArticle {
  id: number;
  cat: string;
  title: string;
  img: string;
  date: string;
  text: string;
  body: string[];
}

export const newsArticles: NewsArticle[] = [
  {
    id: 1,
    cat: 'Berita Pasar',
    title: 'Cara Cek Aplikasi Trading yang Terdaftar di OJK dan Bappebti',
    img: news,
    date: '7 Okt 2026',
    text: 'Kenali cara memeriksa izin resmi aplikasi trading sebelum mulai bertransaksi.',
    body: [
      'Sebelum mulai bertransaksi, pastikan aplikasi atau broker yang Anda pilih terdaftar resmi. Di Indonesia, pengawasan trading berada di bawah Otoritas Jasa Keuangan (OJK) untuk instrumen tertentu dan Badan Pengawas dan Perdagangan Berjangka Komoditi (Bappebti) untuk perdagangan derivatif komoditi termasuk forex dan emas.',
      'Langkah pemeriksaannya sederhana: buka situs resmi OJK atau Bappebti, masuk ke menu daftar perizinan, lalu ketik nama perusahaan atau aplikasi yang ingin Anda gunakan. Jika namanya tidak muncul, berhati-hatilah — kemungkinan besar platform tersebut beroperasi tanpa izin.',
      'Perhatikan juga nama legal perusahaan, karena banyak platform meniru nama broker besar dengan sedikit perubahan huruf. Cocokkan alamat kantor, nomor izin, dan kontak resmi yang tertera di situs regulator dengan yang ditampilkan aplikasi.',
      'Selalu unduh aplikasi dari toko aplikasi resmi atau situs utama broker. Hindari tautan yang dikirim lewat pesan pribadi atau grup media sosial, karena sering menjadi jalur penyebaran aplikasi palsu.',
      'Artikel ini merupakan contoh konten edukasi dan bukan rekomendasi investasi.',
    ],
  },
  {
    id: 2,
    cat: 'Belajar Trading',
    title: '47 Istilah Trading Forex yang Wajib Diketahui',
    img: bonus,
    date: '6 Okt 2026',
    text: 'Lot, leverage, spread, margin, dan istilah dasar lainnya dijelaskan singkat.',
    body: [
      'Memahami istilah dasar adalah langkah pertama sebelum membuka posisi pertama. Berikut istilah yang paling sering muncul di platform trading.',
      'Lot adalah satuan volume transaksi; 1 lot standar bernilai 100.000 unit mata uang dasar. Leverage memungkinkan Anda mengendalikan posisi besar dengan modal kecil, sedangkan margin adalah jaminan yang ditahan broker untuk membuka posisi.',
      'Spread adalah selisih antara harga beli (ask) dan harga jual (bid). Pip mengukur pergerakan harga terkecil, sementara slippage adalah selisih harga saat order dieksekusi dibanding harga yang diminta.',
      'Istilah manajemen risiko juga penting: stop loss membatasi kerugian, take profit mengunci keuntungan, dan margin call muncul ketika ekuitas akun tidak lagi mencukupi untuk menahan posisi yang merugi.',
      'Pelajari istilah satu per satu sambil mencoba di akun demo agar lebih mudah diingat. Artikel ini merupakan contoh konten edukasi dan bukan rekomendasi investasi.',
    ],
  },
  {
    id: 3,
    cat: 'Analisa Teknikal',
    title: 'Cara Analisa Teknikal: Tren, Support, dan Resistance',
    img: news,
    date: '5 Okt 2026',
    text: 'Panduan membaca arah tren dan level harga penting di grafik.',
    body: [
      'Analisa teknikal membaca pergerakan harga dari grafik untuk memperkirakan arah selanjutnya. Tiga fondasinya adalah tren, support, dan resistance.',
      'Tren naik terbentuk ketika harga membuat puncak dan lembah yang semakin tinggi; tren turun sebaliknya. Mengikuti arah tren umumnya lebih aman daripada melawan, terutama bagi trader pemula.',
      'Support adalah area harga di mana permintaan beli cenderung muncul dan mencegah harga turun lebih jauh. Resistance adalah kebalikannya: area di mana tekanan jual menahan kenaikan harga.',
      'Level-level ini tidak selalu tepat di satu angka — perlakukan sebagai zona. Semakin sering sebuah level tersentuh, semakin banyak pelaku pasar memperhatikannya.',
      'Kombinasikan pembacaan tren dengan konfirmasi seperti candlestick atau volume sebelum mengambil posisi. Artikel ini merupakan contoh konten edukasi dan bukan rekomendasi investasi.',
    ],
  },
  {
    id: 4,
    cat: 'Berita Pasar',
    title: 'Emas Bergerak Naik Jelang Rilis Data Inflasi AS',
    img: bonus,
    date: '5 Okt 2026',
    text: 'XAUUSD menguat seiring pelaku pasar menanti data inflasi pekan ini.',
    body: [
      'Harga emas (XAUUSD) bergerak menguat dalam perdagangan pekan ini seiring pelaku pasar menantikan rilis data inflasi Amerika Serikat yang dijadwalkan akhir pekan.',
      'Emas umumnya bergerak sensitif terhadap ekspektasi suku bunga. Ketika inflasi terlihat melandai, pasar menduga suku bunga akan diturunkan — hal yang biasanya melemahkan dolar dan mendukung harga emas.',
      'Selain data inflasi, harga emas juga dipengaruhi arus masuk ke aset lindung nilai saat ketidakpastian geopolitik meningkat, serta permintaan fisik dari bank sentral dan sektor perhiasan.',
      'Pergerakan menjelang rilis data besar sering kali sempit dan meledak setelah rilis. Trader disarankan memperkecil ukuran posisi dan memperhatikan jadwal rilis data ekonomi.',
      'Artikel ini merupakan contoh konten dan bukan rekomendasi investasi.',
    ],
  },
  {
    id: 5,
    cat: 'Belajar Trading',
    title: 'Manajemen Risiko untuk Trader Pemula',
    img: news,
    date: '4 Okt 2026',
    text: 'Tetapkan batas risiko sebelum transaksi dan pahami potensi kerugian.',
    body: [
      'Manajemen risiko adalah keterampilan yang membedakan trader yang bertahan lama dari yang cepat habis modal. Prinsip dasarnya: lindungi modal dulu, kejar keuntungan kemudian.',
      'Aturan yang umum dipakai adalah mempertaruhkan maksimal 1–2% dari total modal dalam satu transaksi. Dengan batas ini, rangkaian kerugian tidak akan menghabiskan akun.',
      'Selalu tentukan stop loss sebelum membuka posisi, bukan setelahnya. Hitung ukuran lot dari jarak stop loss, bukan dari feeling — posisi besar dengan stop jauh sama berisikonya dengan posisi kecil dengan stop rapat.',
      'Hindari revenge trading setelah rugi, dan catat setiap transaksi di jurnal trading agar pola kesalahan terlihat. Evaluasi mingguan jauh lebih berharga daripada mencoba menang cepat.',
      'Artikel ini merupakan contoh konten edukasi dan bukan rekomendasi investasi.',
    ],
  },
  {
    id: 6,
    cat: 'Berita Pasar',
    title: 'Harga Minyak Melemah karena Kekhawatiran Permintaan',
    img: bonus,
    date: '3 Okt 2026',
    text: 'USOIL turun di tengah prospek permintaan global yang melambat.',
    body: [
      'Harga minyak mentah AS (USOIL) melemah dalam perdagangan pekan ini seiring memburuknya prospek permintaan global.',
      'Data manufaktur dari beberapa ekonomi besar menunjukkan pelambatan, memicu kekhawatiran konsumsi bahan bakar akan ikut menurun. Di sisi pasokan, produksi tetap terjaga sehingga tekanan jual menahan harga.',
      'Pergerakan minyak juga dipengaruhi keputusan produksi negara-negara produsen, nilai tukar dolar, dan stok mingguan yang dirilis setiap pekan.',
      'Bagi trader, volatilitas minyak cenderung tinggi — gunakan ukuran posisi lebih kecil dibanding instrumen lain dan perhatikan jam rilis data stok.',
      'Artikel ini merupakan contoh konten dan bukan rekomendasi investasi.',
    ],
  },
];

export function getNewsArticle(id: string | undefined): NewsArticle | undefined {
  if (!id || !/^\d+$/.test(id)) return undefined;
  const n = Number(id);
  return newsArticles.find((a) => a.id === n);
}
