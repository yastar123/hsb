import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Language = 'id' | 'en' | 'zh';
export type Theme = 'light' | 'dark';

const translations: Record<Language, Record<string, string>> = {
  id: {},
  en: {
    Beranda: 'Home', Pasar: 'Markets', Posisi: 'Positions', Mitra: 'Partners', Profil: 'Profile',
    Withdraw: 'Withdraw', Deposit: 'Deposit', 'Riwayat Pembayaran': 'Payment History',
    'Trade Sekarang': 'Trade now', 'Belum ada posisi terbuka.': 'No open positions.',
    'Belum ada riwayat transaksi.': 'No transaction history.', 'Ganti Akun': 'Switch account',
    'Saldo Utama': 'Main balance', 'Saldo Profit': 'Profit balance', 'Saldo Deposit': 'Deposit balance',
    'Kalender Ekonomi': 'Economic Calendar', 'Sinyal Trading': 'Trading Signals',
    'Layanan Pelanggan': 'Customer Service', 'Bahasa': 'Language', 'Pengaturan': 'Settings',
    'Pusat Klien': 'Client Center', 'Informasi Anda': 'Your Information',
    'Bank Penarikan': 'Withdrawal Bank', 'Ganti Password': 'Change Password',
    'Nama pemilik rekening': 'Account holder name', 'Nomor rekening': 'Account number',
    'Bank rekening': 'Bank name', 'Rekening Tujuan': 'Receiving Account',
    'Nama rekening:': 'Account name:', 'Nomor rekening:': 'Account number:',
    'Minimal deposit $200': 'Minimum deposit $200', 'Deposit Sekarang': 'Deposit now',
    'Pilih Metode Pembayaran': 'Select payment method', 'Pilih bank': 'Choose a bank',
    'Unggah foto / tangkapan layar bukti transfer': 'Upload a transfer receipt or screenshot',
    'Bukti transfer': 'Transfer receipt', 'Pratinjau demo: deposit tidak memindahkan dana sungguhan.': 'Demo preview: deposits do not move real money.',
    'Masuk dengan akun demo pengguna sebelum mengirim permintaan deposit.': 'Sign in with a demo user account before submitting a deposit request.',
    'Bukti transfer terkirim. Deposit Anda menunggu persetujuan admin.': 'Receipt submitted. Your deposit is waiting for admin approval.',
    'Belum ada rekening bank penarikan.': 'No withdrawal bank account saved.',
    'Tambah Rekening Bank': 'Add bank account', 'Pilih rekening': 'Select an account',
    'Jumlah penarikan': 'Withdrawal amount', 'Jumlah deposit': 'Deposit amount',
    'Tutup': 'Close', 'Simpan': 'Save', 'Batal': 'Cancel', 'Keluar': 'Log out',
    'Lanjutkan real': 'Continue verification', 'Promo': 'Promotions',
    'Tidak ada sinyal.': 'No signals.', 'Aktual: — · Prakiraan: — · Sebelumnya: —': 'Actual: — · Forecast: — · Previous: —',
    'Data contoh kalender ekonomi': 'Sample economic calendar data',
    'Rekening tujuan untuk metode ini belum diatur oleh admin.': 'No receiving account is configured for this method.',
    'Pratinjau demo, bukan transaksi nyata.': 'Demo preview, not a real transaction.',
    'Hubungi Layanan Pelanggan': 'Contact Customer Service', 'Jika Anda membutuhkan dukungan, hubungi kami melalui:': 'If you need support, contact us through:',
    'Nomor Telepon': 'Phone Number', Whatsapp: 'WhatsApp', Email: 'Email', 'Ngobrol dengan Agen kami': 'Chat with an agent',
    'Status Pembayaran': 'Payment Status', 'Tanggal Permintaan': 'Request Date', Terapkan: 'Apply',
    Semua: 'All', Menunggu: 'Pending', Disetujui: 'Approved', Gagal: 'Failed', Setoran: 'Deposits', Penarikan: 'Withdrawals',
    'Dari tanggal': 'From date', 'Sampai tanggal': 'To date', 'Tidak ada rekening bank penarikan.': 'No withdrawal bank account saved.',
    'Nama sesuai rekening': 'Name as shown on account', 'Nomor rekening pengirim': 'Sender account number',
    'Nama bank pengirim': 'Sender bank name', 'JPG atau PNG, maks 10 MB': 'JPG or PNG, up to 10 MB',
    'Minimal deposit': 'Minimum deposit',
    'Kembali ke Beranda': 'Back to Home', 'Bank Tujuan': 'Destination Bank', 'Nomor Rekening': 'Account Number',
    'Jumlah Penarikan (USD)': 'Withdrawal Amount (USD)', 'Tarik Dana': 'Request Withdrawal',
    'Pratinjau saja; tidak ada dana sungguhan yang dipindahkan.': 'Preview only; no real funds are moved.',
    'Penarikan belum terhubung ke layanan akun. Tidak ada dana yang dipindahkan.': 'Withdrawals are not connected to an account service. No funds were moved.',
    'Deposit payment': 'Deposit',
    'Transfer Bank BCA': 'Bank Transfer BCA', 'Transfer Bank BNI': 'Bank Transfer BNI',
    'Transfer Bank Mandiri': 'Bank Transfer Mandiri', 'Transfer Bank BRI': 'Bank Transfer BRI',
    'Transfer Bank BSI': 'Bank Transfer BSI', 'Transfer Bank CIMB': 'Bank Transfer CIMB',
    'Transfer Bank Permata': 'Bank Transfer Permata',
    'Ganti Kata Sandi': 'Change Password', Dokumen: 'Documents', 'Klik untuk menyalin UID': 'Copy UID',
    'Aktual · Prakiraan · Sebelumnya': 'Actual · Forecast · Previous', 'Aktual:': 'Actual:',
    'Prakiraan:': 'Forecast:', 'Sebelumnya:': 'Previous:', 'Peristiwa lainnya ›': 'More events ›',
    'Belum ada agenda.': 'No events scheduled.', Tinggi: 'High', Sedang: 'Medium', Rendah: 'Low',
    Hubungi: 'Contact', Telepon: 'Call', 'Tautan belum tersedia': 'Link is not available',
    'Ketik nama bank tujuan': 'Enter the destination bank', 'Nomor rekening tujuan': 'Destination account number',
    'File harus berupa gambar.': 'The file must be an image.', 'Ukuran gambar maksimal 10 MB.': 'The image must be 10 MB or smaller.',
    'Gambar tidak dapat dibaca.': 'The image could not be read.', 'Pratinjau bukti transfer': 'Transfer receipt preview',
    'Unggah bukti transfer': 'Upload transfer receipt', 'Ganti / hapus gambar': 'Replace / remove image',
    'Pilih pasar dan lakukan trading pertama Anda.': 'Choose a market to get started.',
    'Layanan mitra belum terhubung.': 'Partner services are not connected.',
    'Navigasi utama': 'Main navigation', 'Informasi': 'Information', Notifikasi: 'Notifications',
    'Belum ada notifikasi.': 'No notifications.', Bantuan: 'Help',
    'Pusat Bantuan': 'Help Center', 'Untuk pertanyaan umum, buka menu FAQ. Layanan bantuan pelanggan belum terhubung.': 'For common questions, open FAQ. Customer support is not connected.',
    FAQ: 'FAQ',
  },
  zh: {
    Beranda: '首页', Pasar: '市场', Posisi: '持仓', Mitra: '合作伙伴', Profil: '个人资料',
    Withdraw: '提现', Deposit: '存款', 'Riwayat Pembayaran': '付款记录',
    'Trade Sekarang': '立即交易', 'Belum ada posisi terbuka.': '暂无未平仓头寸。',
    'Belum ada riwayat transaksi.': '暂无交易记录。', 'Ganti Akun': '切换账户',
    'Saldo Utama': '主余额', 'Saldo Profit': '利润余额', 'Saldo Deposit': '存款余额',
    'Kalender Ekonomi': '经济日历', 'Sinyal Trading': '交易信号',
    'Layanan Pelanggan': '客户服务', Bahasa: '语言', Pengaturan: '设置',
    'Pusat Klien': '客户中心', 'Informasi Anda': '您的信息',
    'Bank Penarikan': '提现银行', 'Ganti Password': '更改密码',
    'Nama pemilik rekening': '账户持有人姓名', 'Nomor rekening': '账号',
    'Bank rekening': '银行名称', 'Rekening Tujuan': '收款账户',
    'Nama rekening:': '账户名称：', 'Nomor rekening:': '账号：',
    'Minimal deposit $200': '最低存款 $200', 'Deposit Sekarang': '立即存款',
    'Pilih Metode Pembayaran': '选择付款方式', 'Pilih bank': '选择银行',
    'Unggah foto / tangkapan layar bukti transfer': '上传转账凭证或截图',
    'Bukti transfer': '转账凭证', 'Pratinjau demo: deposit tidak memindahkan dana sungguhan.': '演示预览：存款不会转移真实资金。',
    'Masuk dengan akun demo pengguna sebelum mengirim permintaan deposit.': '请先使用演示用户账户登录，再提交存款申请。',
    'Bukti transfer terkirim. Deposit Anda menunggu persetujuan admin.': '凭证已提交，存款等待管理员批准。',
    'Belum ada rekening bank penarikan.': '尚未保存提现银行账户。',
    'Tambah Rekening Bank': '添加银行账户', 'Pilih rekening': '选择账户',
    'Jumlah penarikan': '提现金额', 'Jumlah deposit': '存款金额',
    Tutup: '关闭', Simpan: '保存', Batal: '取消', Keluar: '退出',
    Promo: '优惠活动', 'Tidak ada sinyal.': '暂无信号。',
    'Aktual: — · Prakiraan: — · Sebelumnya: —': '实际：— · 预测：— · 前值：—',
    'Data contoh kalender ekonomi': '经济日历示例数据',
    'Rekening tujuan untuk metode ini belum diatur oleh admin.': '管理员尚未为此方式配置收款账户。',
    'Pratinjau demo, bukan transaksi nyata.': '演示预览，不是真实交易。',
    'Hubungi Layanan Pelanggan': '联系客户服务', 'Jika Anda membutuhkan dukungan, hubungi kami melalui:': '如需帮助，请通过以下方式联系我们：',
    'Nomor Telepon': '电话号码', Whatsapp: 'WhatsApp', Email: '电子邮件', 'Ngobrol dengan Agen kami': '与客服交谈',
    'Status Pembayaran': '付款状态', 'Tanggal Permintaan': '申请日期', Terapkan: '应用',
    Semua: '全部', Menunggu: '待处理', Disetujui: '已批准', Gagal: '失败', Setoran: '存款', Penarikan: '提现',
    'Dari tanggal': '开始日期', 'Sampai tanggal': '结束日期', 'Nama sesuai rekening': '与账户一致的姓名',
    'Nomor rekening pengirim': '付款人账号', 'Nama bank pengirim': '付款人银行名称',
    'JPG atau PNG, maks 10 MB': 'JPG 或 PNG，最大 10 MB', 'Kembali ke Beranda': '返回首页',
    'Bank Tujuan': '收款银行', 'Nomor Rekening': '账号', 'Jumlah Penarikan (USD)': '提现金额（美元）',
    'Tarik Dana': '提交提现申请', 'Pratinjau saja; tidak ada dana sungguhan yang dipindahkan.': '仅为预览；不会转移真实资金。',
    'Penarikan belum terhubung ke layanan akun. Tidak ada dana yang dipindahkan.': '提现尚未连接到账户服务。未转移任何资金。',
    'Deposit payment': '存款', 'Transfer Bank BCA': 'BCA 银行转账', 'Transfer Bank BNI': 'BNI 银行转账',
    'Transfer Bank Mandiri': 'Mandiri 银行转账', 'Transfer Bank BRI': 'BRI 银行转账',
    'Transfer Bank BSI': 'BSI 银行转账', 'Transfer Bank CIMB': 'CIMB 银行转账', 'Transfer Bank Permata': 'Permata 银行转账',
    'Ganti Kata Sandi': '更改密码', Dokumen: '文件',
    'Aktual · Prakiraan · Sebelumnya': '实际 · 预测 · 前值', 'Aktual:': '实际：',
    'Prakiraan:': '预测：', 'Sebelumnya:': '前值：', 'Peristiwa lainnya ›': '更多事件 ›',
    'Belum ada agenda.': '暂无日程。', Tinggi: '高', Sedang: '中', Rendah: '低',
    Hubungi: '联系', Telepon: '拨打电话', 'Tautan belum tersedia': '链接不可用',
    'Ketik nama bank tujuan': '输入收款银行', 'Nomor rekening tujuan': '收款账号',
    'File harus berupa gambar.': '文件必须是图片。', 'Ukuran gambar maksimal 10 MB.': '图片大小不能超过 10 MB。',
    'Gambar tidak dapat dibaca.': '无法读取图片。', 'Pratinjau bukti transfer': '转账凭证预览',
    'Unggah bukti transfer': '上传转账凭证', 'Ganti / hapus gambar': '更换 / 删除图片',
    'Pilih pasar dan lakukan trading pertama Anda.': '选择一个市场以开始使用。',
    'Layanan mitra belum terhubung.': '合作伙伴服务尚未连接。',
    'Navigasi utama': '主导航', Informasi: '信息', Notifikasi: '通知',
    'Belum ada notifikasi.': '暂无通知。', Bantuan: '帮助',
    'Pusat Bantuan': '帮助中心', 'Untuk pertanyaan umum, buka menu FAQ. Layanan bantuan pelanggan belum terhubung.': '常见问题请查看 FAQ。客户服务尚未连接。',
    FAQ: '常见问题',
  },
};

type Preferences = {
  language: Language;
  setLanguage: (language: Language) => void;
  theme: Theme;
  toggleTheme: () => void;
};
const PreferencesContext = createContext<Preferences | null>(null);

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('id');
  const [theme, setThemeState] = useState<Theme>('light');
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem('hsb-language');
      const savedTheme = localStorage.getItem('hsb-theme');
      if (savedLanguage === 'id' || savedLanguage === 'en' || savedLanguage === 'zh') setLanguageState(savedLanguage);
      if (savedTheme === 'dark' || savedTheme === 'light') setThemeState(savedTheme);
    } catch { /* use defaults when browser storage is unavailable */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    if (loaded) {
      try {
        localStorage.setItem('hsb-language', language);
        localStorage.setItem('hsb-theme', theme);
      } catch { /* keep this session usable without persistent storage */ }
    }
  }, [language, theme, loaded]);
  const setLanguage = (next: Language) => setLanguageState(next);
  const toggleTheme = () => setThemeState((current) => current === 'dark' ? 'light' : 'dark');
  return <PreferencesContext.Provider value={{ language, setLanguage, theme, toggleTheme }}>{children}</PreferencesContext.Provider>;
}

export function useAppPreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('AppPreferencesProvider missing');
  return context;
}

export function translate(text: string, language: Language) {
  return translations[language][text] ?? text;
}
