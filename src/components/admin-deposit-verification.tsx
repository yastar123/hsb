import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Check, ChevronLeft, ClipboardCheck, Eye, ImageOff, Loader2, X } from 'lucide-react';
import { useLedger, type DepositReq } from '@/components/ledger-content';
import { Button } from '@/components/ui/button';

const money = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function AdminDepositVerification() {
  const { deposits, review, getDepositProof } = useLedger();
  const [filter, setFilter] = useState<'Menunggu' | 'Semua'>('Menunggu');
  const [activeProof, setActiveProof] = useState<{ deposit: DepositReq; imageUrl: string } | null>(null);
  const [loadingProofId, setLoadingProofId] = useState<string | null>(null);
  const [loadedProofs, setLoadedProofs] = useState<Record<string, string>>({});

  const rows = [...deposits]
    .filter((deposit) => filter === 'Semua' || deposit.status === 'Menunggu')
    .sort((a, b) => b.date.localeCompare(a.date));

  const handleOpenProof = async (deposit: DepositReq) => {
    // 1. Direct proof image in deposit object
    const existingUrl = deposit.proof || loadedProofs[deposit.id];
    if (existingUrl) {
      setActiveProof({ deposit, imageUrl: existingUrl });
      return;
    }

    // 2. Fetch on demand from /api/admin/deposits/:id/proof
    setLoadingProofId(deposit.id);
    try {
      const fetched = await getDepositProof(deposit.id);
      if (fetched) {
        setLoadedProofs((prev) => ({ ...prev, [deposit.id]: fetched }));
        setActiveProof({ deposit, imageUrl: fetched });
      } else {
        alert('Gambar bukti transfer tidak ditemukan di server.');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal memuat gambar bukti transfer.');
    } finally {
      setLoadingProofId(null);
    }
  };

  return <main className="min-w-0 bg-muted p-3 text-foreground sm:p-6">
    <header className="mb-4 flex flex-wrap items-center gap-3">
      <ClipboardCheck className="size-5" /><h1 className="text-xl font-bold">Persetujuan Deposit</h1>
      <Button asChild variant="outline" size="sm" className="ml-auto"><Link to="/admin/deposit"><ChevronLeft /> Pengaturan Deposit</Link></Button>
    </header>
    <p className="mb-4 rounded-lg bg-accent px-4 py-2 text-xs text-accent-foreground">Persetujuan hanya menambah saldo pada ledger demo lokal pengguna. Tidak ada uang sungguhan yang dipindahkan atau diverifikasi oleh bank.</p>
    <nav className="mb-4 flex gap-2" aria-label="Filter permintaan deposit">
      {(['Menunggu', 'Semua'] as const).map((value) => <Button key={value} size="sm" variant={filter === value ? 'default' : 'outline'} onClick={() => setFilter(value)}>{value === 'Menunggu' ? `Menunggu (${deposits.filter((item) => item.status === 'Menunggu').length})` : 'Semua permintaan'}</Button>)}
    </nav>
    <section className="space-y-3">
      {rows.map((deposit) => {
        const proofImg = deposit.proof || loadedProofs[deposit.id];
        const hasProof = Boolean(proofImg || deposit.proofAvailable);
        const isLoadingProof = loadingProofId === deposit.id;

        return (
          <article key={deposit.id} className="grid min-w-0 gap-4 rounded-xl border border-border bg-background p-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="grid min-w-0 gap-x-4 gap-y-2 sm:grid-cols-2 xl:grid-cols-3">
              <div><small className="text-muted-foreground">Pengguna</small><p className="break-all font-semibold">{deposit.email || 'Email tidak tersedia'}</p></div>
              <div><small className="text-muted-foreground">Nama pemilik rekening pengirim</small><p>{deposit.name}</p></div>
              <div><small className="text-muted-foreground">Bank rekening pengirim</small><p>{deposit.bankName || '—'}</p></div>
              <div><small className="text-muted-foreground">Nomor rekening pengirim</small><p className="break-all">{deposit.accountNumber || '—'}</p></div>
              <div><small className="text-muted-foreground">Metode tujuan</small><p>{deposit.method}</p></div>
              <div><small className="text-muted-foreground">Jumlah · status</small><p className="font-semibold">{money(deposit.amount)} · <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold ${deposit.status === 'Disetujui' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : deposit.status === 'Ditolak' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>{deposit.status}</span></p></div>
              <div><small className="text-muted-foreground">Dikirim</small><p>{new Date(deposit.date).toLocaleString('id-ID')}</p></div>
              {deposit.note && <div className="sm:col-span-2"><small className="text-muted-foreground">Catatan</small><p>{deposit.note}</p></div>}

              {/* Thumbnail preview if directly loaded */}
              {proofImg && (
                <div className="sm:col-span-2 xl:col-span-3 mt-1 pt-2 border-t border-border/50">
                  <small className="text-muted-foreground block mb-1">Pratinjau Bukti Transfer:</small>
                  <div
                    onClick={() => handleOpenProof(deposit)}
                    className="relative inline-block cursor-pointer group rounded-lg overflow-hidden border border-border hover:border-primary transition-all"
                  >
                    <img
                      src={proofImg}
                      alt={`Bukti transfer dari ${deposit.name}`}
                      className="h-28 w-auto max-w-xs object-cover rounded-md group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-medium gap-1.5">
                      <Eye className="size-4" /> Perbesar
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 justify-between">
              <div className="space-y-2">
                {hasProof ? (
                  <Button
                    variant="outline"
                    className="w-full justify-center gap-2"
                    disabled={isLoadingProof}
                    onClick={() => handleOpenProof(deposit)}
                  >
                    {isLoadingProof ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
                    {isLoadingProof ? 'Memuat gambar...' : 'Lihat bukti transfer'}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                    <ImageOff className="size-4 text-muted-foreground" />
                    <span>Bukti gambar tidak tersedia.</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                {deposit.status === 'Menunggu' ? <>
                  <Button onClick={() => review(deposit.id, true, 'Disetujui admin; saldo demo ditambahkan.')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                    <Check className="size-4" /> Setujui & tambah saldo
                  </Button>
                  <Button variant="destructive" onClick={() => review(deposit.id, false, 'Ditolak admin.')} className="w-full gap-2">
                    <X className="size-4" /> Tolak permintaan
                  </Button>
                </> : <p className="rounded-md bg-muted p-2.5 text-center text-xs text-muted-foreground">Permintaan sudah ditinjau ({deposit.status}).</p>}
              </div>
            </div>
          </article>
        );
      })}
      {rows.length === 0 && <p className="rounded-xl border border-dashed border-border bg-background p-8 text-center text-sm text-muted-foreground">{filter === 'Menunggu' ? 'Tidak ada deposit yang menunggu persetujuan.' : 'Belum ada permintaan deposit.'}</p>}
    </section>

    {activeProof && <div className="account-dialog-backdrop" onClick={() => setActiveProof(null)}>
      <section className="account-dialog w-full max-w-2xl" role="dialog" aria-modal="true" aria-label="Bukti transfer" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="account-dialog-close" aria-label="Tutup bukti" onClick={() => setActiveProof(null)}><X className="size-4" /></Button>
        <h2 className="text-lg font-bold pr-8">Bukti Transfer · {activeProof.deposit.email}</h2>
        <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1">
          <span>Pengirim: <b>{activeProof.deposit.name}</b></span>
          <span>Bank: <b>{activeProof.deposit.bankName || '—'}</b> ({activeProof.deposit.accountNumber})</span>
          <span>Jumlah: <b>{money(activeProof.deposit.amount)}</b></span>
        </div>
        <div className="mt-4 flex justify-center bg-black/5 dark:bg-black/30 rounded-lg p-2 border border-border">
          <img
            src={activeProof.imageUrl}
            alt={`Bukti transfer dari ${activeProof.deposit.name}`}
            className="max-h-[70vh] w-auto max-w-full rounded-md object-contain shadow-sm"
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setActiveProof(null)}>Tutup</Button>
          <a
            href={activeProof.imageUrl}
            download={`bukti-transfer-${activeProof.deposit.id}.jpg`}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
            target="_blank"
            rel="noreferrer"
          >
            Buka Ukuran Asli
          </a>
        </div>
      </section>
    </div>}
  </main>;
}
