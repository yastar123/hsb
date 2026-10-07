import { createFileRoute } from '@tanstack/react-router';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBankAccounts, type BankAccount } from '@/lib/bank-accounts';
import { useDepositContent } from '@/components/deposit-content';

export const Route = createFileRoute('/admin/rekening')({
  head: () => ({ meta: [
    { title: 'Kelola Rekening — Admin HSB' },
    { name: 'description', content: 'Kelola rekening bank tujuan deposit yang ditampilkan ke user.' },
    { property: 'og:title', content: 'Kelola Rekening — Admin HSB' },
    { property: 'og:description', content: 'Panel admin rekening bank tujuan deposit.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: AdminRekening,
});

const inp = 'w-full rounded-md border border-input bg-background px-2 py-1 text-sm';

function AdminRekening() {
  const { list, save } = useBankAccounts();
  const { content } = useDepositContent();
  const banks = content.methods.map((m) => m.badge);
  const upd = (id: string, p: Partial<BankAccount>) => save(list.map((a) => a.id === id ? { ...a, ...p } : a));

  return <main className="space-y-4 p-4 text-foreground md:p-6">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h1 className="text-2xl font-bold">Kelola Rekening</h1><p className="text-sm text-muted-foreground">Rekening tujuan yang muncul saat user memilih bank di halaman Deposit. Tersimpan di browser ini.</p></div>
      <Button onClick={() => save([...list, { id: Math.random().toString(36).slice(2, 9), bank: banks[0] ?? 'BCA', holder: '', number: '', active: true }])}><Plus /> Tambah Rekening</Button>
    </div>
    <article className="overflow-x-auto rounded-xl border border-border bg-background p-4">
      <table className="w-full min-w-[640px] text-sm"><thead className="text-left text-muted-foreground"><tr><th className="py-2">Bank</th><th>Nama Pemilik</th><th>Nomor Rekening</th><th>Aktif</th><th /></tr></thead>
        <tbody>{list.map((a) => <tr key={a.id} className="border-t border-border">
          <td className="py-1 pr-1"><select className={inp} value={a.bank} onChange={(e) => upd(a.id, { bank: e.target.value })} aria-label="Bank">{[...new Set([...banks, a.bank])].map((b) => <option key={b}>{b}</option>)}</select></td>
          <td className="pr-1"><input className={inp} value={a.holder} maxLength={100} onChange={(e) => upd(a.id, { holder: e.target.value })} aria-label="Nama pemilik" /></td>
          <td className="pr-1"><input className={inp} inputMode="numeric" value={a.number} maxLength={30} onChange={(e) => upd(a.id, { number: e.target.value.replace(/\D/g, '') })} aria-label="Nomor rekening" /></td>
          <td className="pr-1"><input type="checkbox" checked={a.active} onChange={(e) => upd(a.id, { active: e.target.checked })} aria-label="Aktif" /></td>
          <td><Button size="icon" variant="ghost" aria-label="Hapus" onClick={() => confirm('Hapus rekening ini?') && save(list.filter((x) => x.id !== a.id))}><Trash2 /></Button></td>
        </tr>)}</tbody></table>
      {!list.length && <p className="py-4 text-sm text-muted-foreground">Belum ada rekening.</p>}
    </article>
  </main>;
}
