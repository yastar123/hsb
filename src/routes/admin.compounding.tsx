import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { Search, Play, Save, CheckCircle2, Zap, Sliders, ShieldAlert, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pagination, usePagination } from '@/components/pagination';
import { useLedger, depOf, profitOf, dailyProfitOf, mainOf, rateOf, type AppUser, type CompoundSettings, type UserStatus } from '@/components/ledger-content';

export const Route = createFileRoute('/admin/compounding')({
  head: () => ({ meta: [
    { title: 'Compounding Manual — Admin WebullXAU' },
    { name: 'description', content: 'Panel eksekusi compounding manual dan pengaturan suku bunga saldo pengguna.' },
    { property: 'og:title', content: 'Compounding Manual — Admin WebullXAU' },
    { property: 'og:description', content: 'Panel admin eksekusi compounding manual harian dan saldo pengguna.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: AdminCompounding,
});

const inp = 'w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary';
const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function AdminCompounding() {
  const { users, compound, setCompound, runCompound, updateUser, loading } = useLedger();
  const [q, setQ] = useState('');
  const [settingsDraft, setSettingsDraft] = useState<CompoundSettings>(compound);
  const [savingSettings, setSavingSettings] = useState(false);
  const [executing, setExecuting] = useState(false);
  const todayStr = useMemo(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date()), []);
  const [cycleDate, setCycleDate] = useState(todayStr);
  const [message, setMessage] = useState('');
  const [lastExecutionInfo, setLastExecutionInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) setSettingsDraft(compound);
  }, [compound, loading]);

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
      // Force enabled true in backend so manual compounding works when triggered
      await setCompound({ globalRate: settingsDraft.globalRate, enabled: true });
      setMessage('Tarif compounding global berhasil disimpan.');
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Pengaturan tarif gagal disimpan.');
    } finally {
      setSavingSettings(false);
    }
  };

  const runManualCompounding = async () => {
    setExecuting(true);
    setMessage('');
    try {
      const result = await runCompound({ cycleDate });
      const info = `Compounding manual berhasil dieksekusi! Disalurkan ke ${result.applied} akun pengguna pada siklus ${result.date}.`;
      setMessage(info);
      setLastExecutionInfo(`${new Date().toLocaleTimeString('id-ID')} WIB (${result.applied} akun diperbarui)`);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Gagal mengeksekusi compounding manual.');
    } finally {
      setExecuting(false);
    }
  };

  const shown = useMemo(
    () => users.filter((u) => `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(q.toLowerCase())),
    [users, q],
  );

  const pg = usePagination(shown);
  const tot = (f: (u: AppUser) => number) => users.reduce((s, u) => s + f(u), 0);

  // Active users eligible for compounding
  const eligibleUsers = useMemo(
    () => users.filter((u) => u.status === 'Aktif' && mainOf(u) > 0 && rateOf(u, compound) > 0),
    [users, compound],
  );

  const projectedTotalPayout = useMemo(
    () => eligibleUsers.reduce((sum, u) => sum + (mainOf(u) * rateOf(u, compound)) / 100, 0),
    [eligibleUsers, compound],
  );

  const stats: [string, string][] = [
    ['Total User Terdaftar', String(users.length)],
    ['Total Saldo Utama (Basis)', usd(tot(mainOf))],
    ['Proyeksi Profit Eksekusi Ini', usd(projectedTotalPayout)],
    ['Total Saldo Profit Terkumpul', usd(tot(profitOf))],
    ['Total Saldo Deposit', usd(tot(depOf))],
  ];

  return (
    <main className="space-y-5 p-4 text-foreground md:p-6">
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight">Kelola Compounding (Manual)</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Sliders className="size-3.5" />
              Mode: Manual oleh Admin
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
            Mekanisme otomatisasi latar belakang telah dinonaktifkan. Seluruh penyaluran profit harian ke Saldo Total Profit akun pengguna hanya akan dijalankan saat Administrator menekan tombol eksekusi manual di bawah ini.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground block">Zona Waktu Operasional:</span>
          <span className="font-mono text-sm font-bold text-foreground">WIB (Asia/Jakarta)</span>
        </div>
      </div>

      {message && (
        <div
          className={`text-sm p-4 rounded-xl border flex items-center gap-2 ${
            message.includes('gagal') || message.includes('Error')
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-medium'
          }`}
          role={message.includes('gagal') ? 'alert' : 'status'}
        >
          {message.includes('gagal') ? <ShieldAlert className="size-4 shrink-0" /> : <CheckCircle2 className="size-4 shrink-0" />}
          <span>{message}</span>
        </div>
      )}

      {/* Manual Execution Control Panel Card */}
      <section className="rounded-2xl border border-border bg-card p-5 space-y-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
              <Zap className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Konsol Eksekusi Compounding Manual</h2>
              <p className="text-xs text-muted-foreground">Kalkulasi dan transfer langsung profit ke Saldo Total Profit pengguna</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium px-2.5 py-1 rounded-lg bg-background border border-border">
              <CheckCircle2 className="size-3.5 text-emerald-400" />
              Otomatisasi Nonaktif
            </span>
            {lastExecutionInfo && (
              <span className="text-xs text-muted-foreground">
                Terakhir: <b className="text-foreground">{lastExecutionInfo}</b>
              </span>
            )}
          </div>
        </div>

        {/* Projection breakdown */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="p-3.5 rounded-xl bg-background border border-border space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="size-3.5" />
              Penerima Compounding Aktif
            </span>
            <div className="text-xl font-extrabold text-foreground font-mono">
              {eligibleUsers.length} <span className="text-xs font-normal text-muted-foreground">dari {users.length} user</span>
            </div>
            <span className="text-[11px] text-muted-foreground block">Akun aktif dengan saldo utama {'>'} 0</span>
          </div>

          <div className="p-3.5 rounded-xl bg-background border border-border space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <DollarSign className="size-3.5" />
              Total Saldo Utama yang Dihitung
            </span>
            <div className="text-xl font-extrabold text-foreground font-mono">
              {usd(eligibleUsers.reduce((sum, u) => sum + mainOf(u), 0))}
            </div>
            <span className="text-[11px] text-muted-foreground block">Dasar persentase compounding harian</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <Zap className="size-3.5" />
              Estimasi Total Payout Sekali Eksekusi
            </span>
            <div className="text-xl font-black text-emerald-400 font-mono">
              +{usd(projectedTotalPayout)}
            </div>
            <span className="text-[11px] text-muted-foreground block">Akan dikreditkan ke Saldo Total Profit</span>
          </div>
        </div>

        {/* Settings & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/60">
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-sm">
              <span className="text-xs font-semibold text-muted-foreground block mb-1">
                Tarif Compounding Global (% / hari)
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  className={`${inp} w-32 font-mono font-bold`}
                  value={settingsDraft.globalRate}
                  onChange={(e) =>
                    setSettingsDraft((curr) => ({
                      ...curr,
                      globalRate: Math.max(0, Number(e.target.value)),
                    }))
                  }
                  aria-label="Tarif compounding global"
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading || savingSettings || settingsDraft.globalRate === compound.globalRate}
                  onClick={() => void saveSettings()}
                  className="gap-1.5"
                >
                  <Save className="size-3.5" />
                  {savingSettings ? 'Menyimpan...' : 'Simpan Tarif'}
                </Button>
              </div>
            </label>

            <label className="text-sm">
              <span className="text-xs font-semibold text-muted-foreground block mb-1">
                Tanggal Siklus yang Disalurkan
              </span>
              <input
                type="date"
                className={`${inp} w-40 font-mono font-medium`}
                value={cycleDate}
                onChange={(e) => setCycleDate(e.target.value)}
                aria-label="Tanggal siklus compounding"
              />
            </label>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 shadow-sm gap-2"
              disabled={loading || executing || eligibleUsers.length === 0}
              onClick={() => {
                const confirmed = confirm(
                  `Eksekusi compounding manual sekarang?\n\n• Tanggal Siklus: ${cycleDate}\n• Jumlah penerima: ${eligibleUsers.length} akun aktif\n• Total profit yang disalurkan: +${usd(projectedTotalPayout)}\n\nSaldo profit akan langsung disalurkan dan dibukukan ke Saldo Total Profit masing-masing user.`,
                );
                if (confirmed) {
                  void runManualCompounding();
                }
              }}
            >
              <Play className="size-4 fill-white" />
              {executing ? 'Sedang Memproses...' : `Eksekusi Compounding (${cycleDate})`}
            </Button>
          </div>
        </div>
      </section>

      {/* Metric statistics */}
      <section className="grid gap-3 sm:grid-cols-5">
        {stats.map(([l, v]) => (
          <article key={l} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{l}</p>
            <p className="mt-1 text-xl font-bold font-mono">{v}</p>
          </article>
        ))}
      </section>

      {/* User Table with individual rates and projections */}
      <article className="overflow-x-auto rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-foreground">Daftar Akun Pengguna</h3>
            <p className="text-xs text-muted-foreground">Atur tarif khusus per pengguna atau biarkan kosong untuk mengikuti tarif global</p>
          </div>
          <label className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <input
              className={`${inp} pl-8 w-64`}
              placeholder="Cari nama, email, no HP..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Cari user"
            />
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
              <th>Saldo Utama $ (Basis)</th>
              <th>% / hari (kosong = global)</th>
              <th>Proyeksi Profit / Eksekusi</th>
              <th>Terakhir Disalurkan</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {pg.pageItems.map((u) => {
              const uRate = rateOf(u, compound);
              const uProjection = u.status === 'Aktif' ? (mainOf(u) * uRate) / 100 : 0;
              return (
                <tr key={u.id} className="border-t border-border hover:bg-muted/20">
                  <td className="py-2 pr-1.5 font-medium">
                    <input
                      className={inp}
                      defaultValue={u.name}
                      onBlur={(e) => {
                        if (e.currentTarget.value !== u.name) upd(u.id, { name: e.currentTarget.value });
                      }}
                      aria-label="Nama"
                    />
                  </td>
                  <td className="pr-1.5">
                    <input
                      type="email"
                      className={inp}
                      defaultValue={u.email}
                      onBlur={(e) => {
                        if (e.currentTarget.value !== u.email) upd(u.id, { email: e.currentTarget.value });
                      }}
                      aria-label="Email"
                    />
                  </td>
                  <td className="pr-1.5">
                    <input
                      className={inp}
                      defaultValue={u.phone}
                      onBlur={(e) => {
                        if (e.currentTarget.value !== u.phone) upd(u.id, { phone: e.currentTarget.value });
                      }}
                      aria-label="No HP"
                    />
                  </td>
                  <td className="pr-1.5">
                    <input
                      type="number"
                      min="0"
                      max="1000000000"
                      step="0.01"
                      className={inp}
                      defaultValue={depOf(u)}
                      onBlur={(e) => {
                        const value = Number(e.currentTarget.value);
                        if (value !== depOf(u)) upd(u.id, { deposit: value });
                      }}
                      aria-label="Saldo deposit"
                    />
                  </td>
                  <td className="pr-1.5 font-semibold text-emerald-400">
                    <input
                      type="number"
                      min="0"
                      max="1000000000"
                      step="0.01"
                      className={inp}
                      defaultValue={profitOf(u)}
                      onBlur={(e) => {
                        const value = Number(e.currentTarget.value);
                        if (value !== profitOf(u)) upd(u.id, { profit: value });
                      }}
                      aria-label="Saldo profit total"
                    />
                  </td>
                  <td className="pr-1.5 font-extrabold font-mono text-foreground">{usd(mainOf(u))}</td>
                  <td className="pr-1.5">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      className={inp}
                      placeholder={`${compound.globalRate}`}
                      defaultValue={u.rate ?? ''}
                      onBlur={(e) => {
                        const value = e.currentTarget.value === '' ? null : Number(e.currentTarget.value);
                        if (value !== u.rate) upd(u.id, { rate: value });
                      }}
                      aria-label="Persen compounding user"
                    />
                  </td>
                  <td className="pr-1.5 font-mono font-bold text-emerald-400">
                    {u.status === 'Diblokir' || uProjection === 0 ? '—' : `+${usd(uProjection)}`}
                  </td>
                  <td className="pr-1.5 text-xs font-mono text-muted-foreground">
                    {u.lastCompound ? u.lastCompound.slice(0, 10) : 'Belum pernah'}
                  </td>
                  <td className="pr-1.5">
                    <select
                      className={inp}
                      value={u.status}
                      onChange={(e) => upd(u.id, { status: e.target.value as UserStatus })}
                      aria-label="Status"
                    >
                      <option>Aktif</option>
                      <option>Diblokir</option>
                    </select>
                  </td>
                </tr>
              );
            })}
            {!shown.length && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-muted-foreground">
                  Tidak ada user yang ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination page={pg.page} totalPages={pg.totalPages} total={pg.total} onPage={pg.setPage} />
      </article>
    </main>
  );
}
