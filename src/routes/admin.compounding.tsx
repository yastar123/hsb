import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { Search, Play, Save, Clock, Timer, CheckCircle2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pagination, usePagination } from '@/components/pagination';
import { useLedger, depOf, profitOf, dailyProfitOf, mainOf, rateOf, type AppUser, type CompoundSettings, type UserStatus } from '@/components/ledger-content';

export const Route = createFileRoute('/admin/compounding')({
  head: () => ({ meta: [
    { title: 'Compounding — Admin WebullXAU' },
    { name: 'description', content: 'Atur persentase compounding harian untuk semua user atau user tertentu.' },
    { property: 'og:title', content: 'Compounding — Admin WebullXAU' },
    { property: 'og:description', content: 'Panel admin pengaturan compounding harian dan saldo user.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: AdminCompounding,
});

const inp = 'w-full rounded-md border border-input bg-background px-2 py-1 text-sm';
const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function useJakartaCompoundingTimer() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return useMemo(() => {
    const jakartaStr = now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
    const jakartaNow = new Date(jakartaStr);

    const targetToday = new Date(jakartaNow);
    targetToday.setHours(14, 0, 0, 0);

    let nextTarget: Date;
    let prevCycleStart: Date;
    let isPast14Today = false;

    if (jakartaNow.getTime() >= targetToday.getTime()) {
      isPast14Today = true;
      prevCycleStart = targetToday;
      nextTarget = new Date(targetToday);
      nextTarget.setDate(nextTarget.getDate() + 1);
    } else {
      isPast14Today = false;
      nextTarget = targetToday;
      prevCycleStart = new Date(targetToday);
      prevCycleStart.setDate(prevCycleStart.getDate() - 1);
    }

    const totalCycleMs = nextTarget.getTime() - prevCycleStart.getTime();
    const elapsedMs = Math.max(0, jakartaNow.getTime() - prevCycleStart.getTime());
    const remainingMs = Math.max(0, nextTarget.getTime() - jakartaNow.getTime());

    const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalCycleMs) * 100)));

    const remHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const remMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    const remSeconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

    const elapHours = Math.floor(elapsedMs / (1000 * 60 * 60));
    const elapMinutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));

    const pad = (n: number) => String(n).padStart(2, '0');

    return {
      currentTimeWib: `${pad(jakartaNow.getHours())}:${pad(jakartaNow.getMinutes())}:${pad(jakartaNow.getSeconds())} WIB`,
      remainingFormatted: `${pad(remHours)}j : ${pad(remMinutes)}m : ${pad(remSeconds)}d`,
      remainingText: `${remHours} jam ${remMinutes} menit ${remSeconds} detik`,
      elapsedFormatted: `${elapHours} jam ${elapMinutes} menit`,
      progressPercent,
      isPast14Today,
      nextScheduleDate: isPast14Today ? 'Besok pukul 14:00 WIB' : 'Hari ini pukul 14:00 WIB',
    };
  }, [now]);
}

function AdminCompounding() {
  const { users, compound, setCompound, runCompound, updateUser, loading } = useLedger();
  const [q, setQ] = useState('');
  const [settingsDraft, setSettingsDraft] = useState<CompoundSettings>(compound);
  const [savingSettings, setSavingSettings] = useState(false);
  const [message, setMessage] = useState('');
  const timerData = useJakartaCompoundingTimer();

  useEffect(() => { if (!loading) setSettingsDraft(compound); }, [compound, loading]);
  const upd = (id: string, patch: Partial<Pick<AppUser, 'name' | 'email' | 'phone' | 'status' | 'rate' | 'balance' | 'deposit' | 'profit'>>) => {
    setMessage('');
    void updateUser(id, patch).catch((cause: unknown) => {
      setMessage(cause instanceof Error ? cause.message : 'Perubahan pengguna gagal disimpan.');
    });
  };
  const saveSettings = async () => {
    setSavingSettings(true);
    setMessage('');
    try {
      await setCompound(settingsDraft);
      setMessage('Pengaturan compounding tersimpan di database.');
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Pengaturan gagal disimpan.');
    } finally {
      setSavingSettings(false);
    }
  };
  const runNow = async () => {
    setMessage('');
    try {
      const result = await runCompound();
      setMessage(`Compounding selesai dijalankan untuk ${result.applied} entri pada ${result.date}.`);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Compounding gagal dijalankan.');
    }
  };
  const shown = useMemo(() => users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase())), [users, q]);
  const pg = usePagination(shown);
  const tot = (f: (u: AppUser) => number) => users.reduce((s, u) => s + f(u), 0);
  const stats: [string, string][] = [
    ['Total User', String(users.length)],
    ['Total Saldo Deposit', usd(tot(depOf))],
    ['Estimasi Profit Hari Ini (14:00 WIB)', usd(tot(dailyProfitOf))],
    ['Total Saldo Total Profit', usd(tot(profitOf))],
    ['Total Saldo Utama', usd(tot(mainOf))],
  ];

  return <main className="space-y-4 p-4 text-foreground md:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>Compounding Otomatis</span>
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
            <Zap className="size-3" /> Pukul 14:00 WIB
          </span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Setiap hari tepat pukul 14:00 WIB (1x sehari), estimasi profit harian secara otomatis disalurkan dan disimpan ke Saldo Total Profit serta saldo utama user.
        </p>
      </div>
      <div className="text-right">
        <span className="text-xs text-muted-foreground">Waktu Server (WIB):</span>
        <div className="font-mono text-lg font-bold text-foreground">{timerData.currentTimeWib}</div>
      </div>
    </div>

    {message && <p className="text-sm p-3 rounded-lg bg-card border border-border" role={message.includes('gagal') ? 'alert' : 'status'}>{message}</p>}

    {/* Live Realtime Timer & Timeframe Card */}
    <section className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Timer className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Timeframe & Hitung Mundur Penyaluran Saldo Profit</h2>
            <p className="text-xs text-muted-foreground">Jadwal eksekusi otomatis 1 hari sekali pukul 14:00 WIB</p>
          </div>
        </div>
        <div>
          {compound.enabled ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Compounding Otomatis Aktif
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Compounding Nonaktif
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="p-3 rounded-lg bg-background border border-border">
          <span className="text-xs text-muted-foreground block">Waktu Berjalan Siklus Ini</span>
          <span className="text-base font-bold text-foreground mt-1 flex items-center gap-1.5 font-mono">
            <Clock className="size-4 text-primary" />
            {timerData.elapsedFormatted}
          </span>
          <span className="text-[11px] text-muted-foreground block mt-0.5">Sejak penyaluran 14:00 WIB sebelumnya</span>
        </div>

        <div className="p-3 rounded-lg bg-background border border-border">
          <span className="text-xs text-muted-foreground block">Estimasi Waktu Tersisa Menuju 14:00 WIB</span>
          <span className="text-base font-bold text-primary mt-1 flex items-center gap-1.5 font-mono">
            <Timer className="size-4" />
            {timerData.remainingFormatted}
          </span>
          <span className="text-[11px] text-muted-foreground block mt-0.5">({timerData.remainingText} lagi)</span>
        </div>

        <div className="p-3 rounded-lg bg-background border border-border">
          <span className="text-xs text-muted-foreground block">Jadwal Penyaluran Berikutnya</span>
          <span className="text-sm font-bold text-foreground mt-1 flex items-center gap-1.5">
            <Zap className="size-4 text-amber-400" />
            {timerData.nextScheduleDate}
          </span>
          <span className="text-[11px] text-muted-foreground block mt-0.5">Dana masuk ke Saldo Total Profit</span>
        </div>

        <div className="p-3 rounded-lg bg-background border border-border">
          <span className="text-xs text-muted-foreground block">Status Penyaluran Hari Ini</span>
          {timerData.isPast14Today ? (
            <div className="mt-1">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                Sudah Disalurkan (14:00 WIB)
              </span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">Menyiapkan estimasi siklus esok hari</span>
            </div>
          ) : (
            <div className="mt-1">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400">
                <Clock className="size-3.5 animate-spin" />
                Menunggu Pukul 14:00 WIB
              </span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">Estimasi aktif di Saldo Profit Harian</span>
            </div>
          )}
        </div>
      </div>

      {/* Visual progress bar of the 24-hour cycle */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress Siklus 24 Jam Menuju Pukul 14:00 WIB</span>
          <span className="font-mono font-semibold text-foreground">{timerData.progressPercent}% selesai</span>
        </div>
        <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-500 rounded-full"
            style={{ width: `${timerData.progressPercent}%` }}
          />
        </div>
      </div>
    </section>

    {/* Metric statistics */}
    <section className="grid gap-3 sm:grid-cols-5">{stats.map(([l, v]) =>
      <article key={l} className="rounded-xl border border-border bg-background p-4">
        <p className="text-xs text-muted-foreground">{l}</p>
        <p className="mt-1 text-xl font-bold">{v}</p>
      </article>)}
    </section>

    <article className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-background p-4">
      <label className="text-sm">
        <span className="mb-1 block font-medium">Tarif Compounding Semua User (% / hari)</span>
        <input
          type="number"
          min="0"
          max="100"
          step="0.01"
          className={inp + ' w-44'}
          value={settingsDraft.globalRate}
          onChange={(e) => setSettingsDraft((current) => ({ ...current, globalRate: Math.max(0, Number(e.target.value)) }))}
        />
      </label>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={settingsDraft.enabled}
          onChange={(e) => setSettingsDraft((current) => ({ ...current, enabled: e.target.checked }))}
        />
        <span>Otomatisasi compounding aktif</span>
      </label>
      <Button
        variant="outline"
        disabled={loading || savingSettings || (settingsDraft.globalRate === compound.globalRate && settingsDraft.enabled === compound.enabled)}
        onClick={() => void saveSettings()}
      >
        <Save /> Simpan pengaturan
      </Button>
      <Button
        variant="outline"
        disabled={loading}
        onClick={() => {
          if (confirm('Jalankan proses penyaluran compounding 1 hari secara manual sekarang?')) void runNow();
        }}
      >
        <Play /> Jalankan 1 hari sekarang
      </Button>
    </article>

    <article className="overflow-x-auto rounded-xl border border-border bg-background p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <label className="relative">
          <Search className="absolute left-2 top-1.5 size-4 text-muted-foreground" />
          <input className={`${inp} pl-8`} placeholder="Cari nama / email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari user" />
        </label>
      </div>
      <table className="w-full min-w-[1250px] text-sm">
        <thead className="text-left text-muted-foreground border-b border-border">
          <tr>
            <th className="py-2.5">Nama</th>
            <th>Email</th>
            <th>No. HP</th>
            <th>Saldo Deposit $</th>
            <th>Saldo Total Profit $</th>
            <th>Saldo Profit Harian (14:00 WIB)</th>
            <th>Saldo Utama</th>
            <th>Jadwal Penyaluran</th>
            <th>% / hari (kosong = global)</th>
            <th>Proyeksi per hari</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {pg.pageItems.map((u) => (
            <tr key={u.id} className="border-t border-border hover:bg-muted/20">
              <td className="py-1.5 pr-1"><input className={inp} defaultValue={u.name} onBlur={(e) => { if (e.currentTarget.value !== u.name) upd(u.id, { name: e.currentTarget.value }); }} aria-label="Nama" /></td>
              <td className="pr-1"><input type="email" className={inp} defaultValue={u.email} onBlur={(e) => { if (e.currentTarget.value !== u.email) upd(u.id, { email: e.currentTarget.value }); }} aria-label="Email" /></td>
              <td className="pr-1"><input className={inp} defaultValue={u.phone} onBlur={(e) => { if (e.currentTarget.value !== u.phone) upd(u.id, { phone: e.currentTarget.value }); }} aria-label="No HP" /></td>
              <td className="pr-1"><input type="number" min="0" max="1000000000" step="0.01" className={inp} defaultValue={depOf(u)} onBlur={(e) => { const value = Number(e.currentTarget.value); if (value !== depOf(u)) upd(u.id, { deposit: value }); }} aria-label="Saldo deposit" /></td>
              <td className="pr-1 font-semibold text-emerald-400"><input type="number" min="0" max="1000000000" step="0.01" className={inp} defaultValue={profitOf(u)} onBlur={(e) => { const value = Number(e.currentTarget.value); if (value !== profitOf(u)) upd(u.id, { profit: value }); }} aria-label="Saldo profit total" /></td>
              <td className="pr-1 font-bold text-primary">{usd(dailyProfitOf(u))}</td>
              <td className="pr-1 font-extrabold">{usd(mainOf(u))}</td>
              <td className="pr-1 text-xs font-mono text-muted-foreground">{u.nextCompound ?? '14:00 WIB'}</td>
              <td className="pr-1"><input type="number" min="0" max="100" step="0.01" className={inp} placeholder={`${compound.globalRate}`} defaultValue={u.rate ?? ''} onBlur={(e) => { const value = e.currentTarget.value === '' ? null : Number(e.currentTarget.value); if (value !== u.rate) upd(u.id, { rate: value }); }} aria-label="Persen compounding user" /></td>
              <td className="pr-1 text-muted-foreground">{u.status === 'Diblokir' ? '—' : usd(mainOf(u) * rateOf(u, compound) / 100)}</td>
              <td className="pr-1"><select className={inp} value={u.status} onChange={(e) => upd(u.id, { status: e.target.value as UserStatus })} aria-label="Status"><option>Aktif</option><option>Diblokir</option></select></td>
            </tr>
          ))}
          {!shown.length && <tr><td colSpan={11} className="py-6 text-center text-muted-foreground">Tidak ada user.</td></tr>}
        </tbody>
      </table>
      <Pagination page={pg.page} totalPages={pg.totalPages} total={pg.total} onPage={pg.setPage} />
    </article>
  </main>;
}
