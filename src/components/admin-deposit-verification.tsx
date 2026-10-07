import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Check, ChevronLeft, ClipboardCheck, Eye, X } from 'lucide-react';
import { useLedger, type DepositReq } from '@/components/ledger-content';
import { Button } from '@/components/ui/button';

const money = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function AdminDepositVerification() {
  const { deposits, review } = useLedger();
  const [filter, setFilter] = useState<'Menunggu' | 'Semua'>('Menunggu');
  const [proof, setProof] = useState<DepositReq | null>(null);
  const rows = [...deposits]
    .filter((deposit) => filter === 'Semua' || deposit.status === 'Menunggu')
    .sort((a, b) => b.date.localeCompare(a.date));
  return <main className="min-w-0 bg-muted p-3 text-foreground sm:p-6">
    <header className="mb-4 flex flex-wrap items-center gap-3">
      <ClipboardCheck className="size-5" /><h1 className="text-xl font-bold">Verifikasi Deposit</h1>
      <Button asChild variant="outline" size="sm" className="ml-auto"><Link to="/admin/deposit"><ChevronLeft /> Pengaturan Deposit</Link></Button>
    </header>
    <p className="mb-4 rounded-lg bg-accent px-4 py-2 text-xs text-accent-foreground">Persetujuan hanya menambah saldo pada ledger demo lokal pengguna. Tidak ada uang sungguhan yang dipindahkan atau diverifikasi oleh bank.</p>
    <nav className="mb-4 flex gap-2" aria-label="Filter permintaan deposit">
      {(['Menunggu', 'Semua'] as const).map((value) => <Button key={value} size="sm" variant={filter === value ? 'default' : 'outline'} onClick={() => setFilter(value)}>{value === 'Menunggu' ? `Menunggu (${deposits.filter((item) => item.status === 'Menunggu').length})` : 'Semua permintaan'}</Button>)}
    </nav>
    <section className="space-y-3">
      {rows.map((deposit) => <article key={deposit.id} className="grid min-w-0 gap-3 rounded-xl border border-border bg-background p-4 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="grid min-w-0 gap-x-4 gap-y-2 sm:grid-cols-2 xl:grid-cols-3">
          <div><small className="text-muted-foreground">Pengguna</small><p className="break-all font-semibold">{deposit.email || 'Email tidak tersedia'}</p></div>
          <div><small className="text-muted-foreground">Nama pemilik rekening pengirim</small><p>{deposit.name}</p></div>
          <div><small className="text-muted-foreground">Bank rekening pengirim</small><p>{deposit.bankName || '—'}</p></div>
          <div><small className="text-muted-foreground">Nomor rekening pengirim</small><p className="break-all">{deposit.accountNumber || '—'}</p></div>
          <div><small className="text-muted-foreground">Metode tujuan</small><p>{deposit.method}</p></div>
          <div><small className="text-muted-foreground">Jumlah · status</small><p className="font-semibold">{money(deposit.amount)} · {deposit.status}</p></div>
          <div><small className="text-muted-foreground">Dikirim</small><p>{new Date(deposit.date).toLocaleString('id-ID')}</p></div>
          {deposit.note && <div className="sm:col-span-2"><small className="text-muted-foreground">Catatan</small><p>{deposit.note}</p></div>}
        </div>
        <div className="flex flex-col gap-2">
          {deposit.proof
            ? <Button variant="outline" onClick={() => setProof(deposit)}><Eye /> Lihat bukti transfer</Button>
            : <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">Bukti gambar tidak tersedia.</p>}
          {deposit.status === 'Menunggu' ? <>
            <Button onClick={() => review(deposit.id, true, 'Disetujui admin; saldo demo ditambahkan.')}><Check /> Setujui & tambah saldo demo</Button>
            <Button variant="destructive" onClick={() => review(deposit.id, false, 'Ditolak admin.') }><X /> Tolak permintaan</Button>
          </> : <p className="rounded-md bg-muted p-3 text-center text-sm">Permintaan sudah ditinjau.</p>}
        </div>
      </article>)}
      {rows.length === 0 && <p className="rounded-xl border border-dashed border-border bg-background p-8 text-center text-sm text-muted-foreground">{filter === 'Menunggu' ? 'Tidak ada deposit yang menunggu persetujuan.' : 'Belum ada permintaan deposit.'}</p>}
    </section>
    {proof && <div className="account-dialog-backdrop" onClick={() => setProof(null)}>
      <section className="account-dialog w-full max-w-2xl" role="dialog" aria-modal="true" aria-label="Bukti transfer" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="account-dialog-close" aria-label="Tutup bukti" onClick={() => setProof(null)}><X /></Button>
        <h2>Bukti transfer · {proof.email}</h2>
        <img src={proof.proof} alt={`Bukti transfer dari ${proof.name}`} className="mt-4 max-h-[70vh] w-full rounded-md border border-border object-contain" />
      </section>
    </div>}
  </main>;
}
