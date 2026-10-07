import { createFileRoute } from '@tanstack/react-router';
import { Users, Wallet, WalletCards, Handshake, Activity, UserPlus } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { useLedger } from '@/components/ledger-content';
import { useReferral } from '@/components/referral-content';

export const Route = createFileRoute('/admin/')({
  head: () => ({ meta: [
    { title: 'Dashboard Admin — HSB Trading' },
    { name: 'description', content: 'Ringkasan analitik HSB: pengguna terdaftar, deposit, withdraw, dan mitra referral.' },
    { property: 'og:title', content: 'Dashboard Admin — HSB Trading' },
    { property: 'og:description', content: 'Ringkasan analitik pengguna, deposit, withdraw, dan mitra HSB.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: AdminDashboard,
});

const flowCfg = { deposit: { label: 'Deposit (USD)', color: 'var(--primary)' }, withdraw: { label: 'Withdraw (USD)', color: 'var(--destructive)' } } satisfies ChartConfig;
const userCfg = { users: { label: 'User baru', color: 'var(--primary)' }, referral: { label: 'Via referral', color: 'var(--chart-2)' } } satisfies ChartConfig;

function AdminDashboard() {
  const { users, deposits, withdrawals, loading, error } = useLedger();
  const { data: referralData, recordsStatus, recordsError } = useReferral();
  const currency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const monthKey = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? '' : new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit' }).format(date);
  };
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - 5 + index);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(date),
    };
  });
  const flow = months.map(({ key, label }) => ({
    month: label,
    deposit: deposits.filter((item) => item.status === 'Disetujui' && monthKey(item.date) === key).reduce((sum, item) => sum + item.amount, 0),
    withdraw: withdrawals.filter((item) => item.status === 'Berhasil' && monthKey(item.date) === key).reduce((sum, item) => sum + item.amount, 0),
  }));
  const signups = months.map(({ key, label }) => ({
    month: label,
    users: users.filter((user) => monthKey(user.joined) === key).length,
    referral: referralData.referrals.filter((referral) => monthKey(referral.joined) === key).length,
  }));
  const totalDeposits = deposits.filter((item) => item.status === 'Disetujui').reduce((sum, item) => sum + item.amount, 0);
  const totalWithdrawals = withdrawals.filter((item) => item.status === 'Berhasil').reduce((sum, item) => sum + item.amount, 0);
  const partners = referralData.referrers.map((partner) => ({
    ...partner,
    refs: referralData.referrals.filter((item) => item.referrerId === partner.id).length,
  })).filter((partner) => partner.refs > 0).sort((a, b) => b.refs - a.refs).slice(0, 5);
  const recent = [
    ...deposits.map((item) => ({ id: item.id, user: item.email, type: 'Deposit', amount: item.amount, status: item.status, date: item.date })),
    ...withdrawals.map((item) => ({ id: item.id, user: item.email, type: 'Withdraw', amount: item.amount, status: item.status, date: item.date })),
  ].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 8);
  const stats = [
    { label: 'User Terdaftar', value: users.length.toLocaleString('id-ID'), delta: 'Akun di PostgreSQL', icon: Users },
    { label: 'Akun Aktif', value: users.filter((user) => user.status === 'Aktif').length.toLocaleString('id-ID'), delta: 'Status verifikasi aktif', icon: Activity },
    { label: 'Total Deposit Disetujui', value: currency(totalDeposits), delta: `${deposits.filter((item) => item.status === 'Disetujui').length} transaksi`, icon: Wallet },
    { label: 'Total Withdraw Berhasil', value: currency(totalWithdrawals), delta: `${withdrawals.filter((item) => item.status === 'Berhasil').length} transaksi`, icon: WalletCards },
    { label: 'Mitra dengan Referral', value: partners.length.toLocaleString('id-ID'), delta: 'Memiliki pendaftaran referral', icon: Handshake },
    { label: 'User via Referral', value: referralData.referrals.length.toLocaleString('id-ID'), delta: 'Relasi akun nyata', icon: UserPlus },
  ];
  return <main className="space-y-4 p-4 text-foreground md:p-6">
    <div><h1 className="text-2xl font-bold">Dashboard</h1><p className="text-sm text-muted-foreground">Ringkasan akun dan transaksi dari PostgreSQL. Grafik menampilkan enam bulan terakhir.</p></div>
    {(error || recordsError) && <p role="alert" className="rounded-lg border border-destructive/40 bg-background p-3 text-sm text-destructive">{error || recordsError}</p>}
    {(loading || recordsStatus === 'loading') && <p role="status" className="text-sm text-muted-foreground">Memuat ringkasan dari server…</p>}
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{stats.map((s) => <article key={s.label} className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">{s.label}<s.icon className="h-5 w-5 text-primary" /></div>
      <p className="mt-2 text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.delta}</p>
    </article>)}</section>
    <section className="grid gap-4 lg:grid-cols-2">
      <article className="rounded-xl border border-border bg-background p-4"><h2 className="mb-2 font-semibold">Deposit vs Withdraw</h2>
        <ChartContainer config={flowCfg} className="h-64 w-full"><BarChart data={flow}><CartesianGrid vertical={false} /><XAxis dataKey="month" tickLine={false} axisLine={false} /><YAxis width={32} tickLine={false} axisLine={false} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="deposit" fill="var(--color-deposit)" radius={4} /><Bar dataKey="withdraw" fill="var(--color-withdraw)" radius={4} /></BarChart></ChartContainer></article>
      <article className="rounded-xl border border-border bg-background p-4"><h2 className="mb-2 font-semibold">Pendaftaran User</h2>
        <ChartContainer config={userCfg} className="h-64 w-full"><AreaChart data={signups}><CartesianGrid vertical={false} /><XAxis dataKey="month" tickLine={false} axisLine={false} /><YAxis width={32} tickLine={false} axisLine={false} /><ChartTooltip content={<ChartTooltipContent />} /><Area dataKey="users" stroke="var(--color-users)" fill="var(--color-users)" fillOpacity={0.2} /><Area dataKey="referral" stroke="var(--color-referral)" fill="var(--color-referral)" fillOpacity={0.3} /></AreaChart></ChartContainer></article>
    </section>
    <section className="grid gap-4 lg:grid-cols-2">
      <article className="overflow-x-auto rounded-xl border border-border bg-background p-4"><h2 className="mb-2 font-semibold">Mitra Teratas</h2>
        <table className="w-full text-sm"><thead className="text-left text-muted-foreground"><tr><th className="py-2">Mitra</th><th>Kode</th><th className="text-right">Referral</th></tr></thead>
          <tbody>{partners.map((partner) => <tr key={partner.id} className="border-t border-border"><td className="py-2 font-medium">{partner.name}</td><td>{partner.code}</td><td className="text-right">{partner.refs}</td></tr>)}
            {!partners.length && <tr><td colSpan={3} className="py-3 text-center text-muted-foreground">Belum ada data mitra referral.</td></tr>}</tbody></table></article>
      <article className="overflow-x-auto rounded-xl border border-border bg-background p-4"><h2 className="mb-2 font-semibold">Transaksi Terbaru</h2>
        <table className="w-full text-sm"><thead className="text-left text-muted-foreground"><tr><th className="py-2">User</th><th>Jenis</th><th className="text-right">Jumlah</th><th className="text-right">Status</th></tr></thead>
          <tbody>{recent.map((item) => <tr key={`${item.type}-${item.id}`} className="border-t border-border"><td className="py-2">{item.user}</td><td>{item.type}</td><td className="text-right">{currency(item.amount)}</td><td className={`text-right ${item.status === 'Ditolak' ? 'text-destructive' : item.status === 'Disetujui' || item.status === 'Berhasil' ? 'text-primary' : 'text-muted-foreground'}`}>{item.status}</td></tr>)}
            {!recent.length && <tr><td colSpan={4} className="py-3 text-center text-muted-foreground">Belum ada transaksi.</td></tr>}</tbody></table></article>
    </section>
  </main>;
}
