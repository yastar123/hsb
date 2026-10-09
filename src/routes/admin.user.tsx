import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Pagination, usePagination } from '@/components/pagination';
import { useLedger, depOf, mainOf, type AppUser, type UserStatus } from '@/components/ledger-content';

export const Route = createFileRoute('/admin/user')({
  head: () => ({ meta: [
    { title: 'Kelola User — Admin HSB' },
    { name: 'description', content: 'Lihat dan kelola akun pengguna HSB.' },
    { property: 'og:title', content: 'Kelola User — Admin HSB' },
    { property: 'og:description', content: 'Panel admin untuk mengelola semua user terdaftar.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: AdminUser,
});

const inp = 'w-full rounded-md border border-input bg-background px-2 py-1 text-sm';

function AdminUser() {
  const { users, updateUser } = useLedger();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const upd = (id: string, patch: Partial<Pick<AppUser, 'name' | 'email' | 'phone' | 'status' | 'balance'>>) => {
    setError('');
    void updateUser(id, patch).catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : 'Perubahan pengguna gagal disimpan.');
    });
  };
  const shown = useMemo(() => users.filter((u) => (!status || u.status === status) && `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(q.toLowerCase())), [users, q, status]);
  const pg = usePagination(shown);
  const stats: [string, number][] = [['Total User', users.length], ['Aktif', users.filter((u) => u.status === 'Aktif').length], ['Diblokir', users.filter((u) => u.status === 'Diblokir').length]];

  return <main className="space-y-4 p-4 text-foreground md:p-6">
     <div className="flex flex-wrap items-center justify-between gap-2">
       <div><h1 className="text-2xl font-bold">Kelola User</h1><p className="text-sm text-muted-foreground">Data akun dimuat dari PostgreSQL. Pemblokiran akun tidak menghapus saldo atau riwayat ledger.</p></div>
     </div>
     {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    <section className="grid gap-3 sm:grid-cols-3">{stats.map(([l, v]) =>
      <article key={l} className="rounded-xl border border-border bg-background p-4"><p className="text-sm text-muted-foreground">{l}</p><p className="mt-1 text-2xl font-bold">{v}</p></article>)}</section>
    <article className="overflow-x-auto rounded-xl border border-border bg-background p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <label className="relative"><Search className="absolute left-2 top-1.5 size-4 text-muted-foreground" /><input className={`${inp} pl-8`} placeholder="Cari nama, email, HP" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari user" /></label>
          <select className={inp + ' w-auto'} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter status"><option value="">Semua status</option><option>Aktif</option><option>Diblokir</option></select>
        </div>
      </div>
      <table className="w-full min-w-[1000px] text-sm"><thead className="text-left text-muted-foreground"><tr><th className="py-2">Nama</th><th>Email</th><th>No. HP</th><th>Tgl Daftar</th><th>Saldo Utama $</th><th>Saldo Deposit $</th><th>Status</th></tr></thead>
        <tbody>{pg.pageItems.map((u) => <tr key={u.id} className="border-t border-border">
          <td className="py-1 pr-1"><input className={inp} defaultValue={u.name} onBlur={(e) => upd(u.id, { name: e.currentTarget.value })} aria-label="Nama" /></td>
          <td className="pr-1"><input type="email" className={inp} defaultValue={u.email} onBlur={(e) => upd(u.id, { email: e.currentTarget.value })} aria-label="Email" /></td>
          <td className="pr-1"><input className={inp} defaultValue={u.phone} onBlur={(e) => upd(u.id, { phone: e.currentTarget.value })} aria-label="No HP" /></td>
          <td className="pr-1">{u.joined}</td>
          <td className="pr-1"><input type="number" min="0" max="1000000000" step="0.01" className={inp} defaultValue={mainOf(u)} onBlur={(e) => upd(u.id, { balance: Number(e.currentTarget.value) })} aria-label="Saldo utama" /></td>
          <td className="pr-1">{depOf(u).toFixed(2)}</td>
          <td className="pr-1"><select className={inp} value={u.status} onChange={(e) => upd(u.id, { status: e.target.value as UserStatus })} aria-label="Status"><option>Aktif</option><option>Diblokir</option></select></td>
        </tr>)}
        {!shown.length && <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">Tidak ada user.</td></tr>}</tbody></table>
      <Pagination page={pg.page} totalPages={pg.totalPages} total={pg.total} onPage={pg.setPage} />
    </article>
  </main>;
}
