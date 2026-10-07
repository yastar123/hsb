import { createFileRoute } from '@tanstack/react-router';
import { Users, Wallet, WalletCards, Handshake, Activity, UserPlus } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

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

const months = ['Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt'];
const flow = months.map((m, i) => ({ month: m, deposit: [182, 214, 238, 276, 301, 342][i]!, withdraw: [96, 121, 134, 150, 171, 188][i]! }));
const signups = months.map((m, i) => ({ month: m, users: [420, 515, 610, 702, 836, 948][i]!, referral: [88, 112, 140, 166, 201, 243][i]! }));
const flowCfg = { deposit: { label: 'Deposit (rb $)', color: 'var(--primary)' }, withdraw: { label: 'Withdraw (rb $)', color: 'var(--destructive)' } } satisfies ChartConfig;
const userCfg = { users: { label: 'User baru', color: 'var(--primary)' }, referral: { label: 'Via referral', color: 'var(--chart-2)' } } satisfies ChartConfig;

const stats = [
  { label: 'User Terdaftar', value: '12.486', delta: '+948 bulan ini', icon: Users },
  { label: 'User Aktif (30 hari)', value: '7.203', delta: '57,7% dari total', icon: Activity },
  { label: 'Total Deposit', value: '$1,553,000', delta: '+13,6% vs bulan lalu', icon: Wallet },
  { label: 'Total Withdraw', value: '$860,000', delta: '+9,9% vs bulan lalu', icon: WalletCards },
  { label: 'Mitra / IB', value: '318', delta: '+24 bulan ini', icon: Handshake },
  { label: 'User via Referral', value: '2.950', delta: '23,6% dari total', icon: UserPlus },
];
const partners = [
  { name: 'Budi Santoso', code: 'HSB-BUDI', refs: 412, volume: '$184,200' },
  { name: 'Sari Wulandari', code: 'HSB-SARI', refs: 356, volume: '$152,900' },
  { name: 'Andi Pratama', code: 'HSB-ANDI', refs: 298, volume: '$121,400' },
  { name: 'Dewi Lestari', code: 'HSB-DEWI', refs: 241, volume: '$98,750' },
];
const recent = [
  { user: 'rina***@mail.com', type: 'Deposit', amount: '$500', status: 'Selesai' },
  { user: 'joko***@mail.com', type: 'Withdraw', amount: '$220', status: 'Diproses' },
  { user: 'maya***@mail.com', type: 'Deposit', amount: '$1,200', status: 'Selesai' },
  { user: 'agus***@mail.com', type: 'Withdraw', amount: '$75', status: 'Ditolak' },
  { user: 'fajr***@mail.com', type: 'Deposit', amount: '$300', status: 'Selesai' },
];

function AdminDashboard() {
  return <main className="space-y-4 p-4 text-foreground md:p-6">
    <div><h1 className="text-2xl font-bold">Dashboard</h1><p className="text-sm text-muted-foreground">Data contoh · belum terhubung ke server transaksi.</p></div>
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
        <table className="w-full text-sm"><thead className="text-left text-muted-foreground"><tr><th className="py-2">Mitra</th><th>Kode</th><th className="text-right">Referral</th><th className="text-right">Volume</th></tr></thead>
          <tbody>{partners.map((p) => <tr key={p.code} className="border-t border-border"><td className="py-2 font-medium">{p.name}</td><td>{p.code}</td><td className="text-right">{p.refs}</td><td className="text-right">{p.volume}</td></tr>)}</tbody></table></article>
      <article className="overflow-x-auto rounded-xl border border-border bg-background p-4"><h2 className="mb-2 font-semibold">Transaksi Terbaru</h2>
        <table className="w-full text-sm"><thead className="text-left text-muted-foreground"><tr><th className="py-2">User</th><th>Jenis</th><th className="text-right">Jumlah</th><th className="text-right">Status</th></tr></thead>
          <tbody>{recent.map((r, i) => <tr key={i} className="border-t border-border"><td className="py-2">{r.user}</td><td>{r.type}</td><td className="text-right">{r.amount}</td><td className={`text-right ${r.status === 'Ditolak' ? 'text-destructive' : r.status === 'Selesai' ? 'text-primary' : 'text-muted-foreground'}`}>{r.status}</td></tr>)}</tbody></table></article>
    </section>
  </main>;
}
