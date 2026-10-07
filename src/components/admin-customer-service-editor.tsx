import { Link } from '@tanstack/react-router';
import { Headset, Plus, Trash2 } from 'lucide-react';
import { useCustomerServiceContent } from '@/components/customer-service-content';
import { Button } from '@/components/ui/button';

const input = 'w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground';

export function AdminCustomerServiceEditor() {
  const { content, setContent } = useCustomerServiceContent();
  const add = () => setContent((current) => ({
    ...current,
    items: [...current.items, { id: crypto.randomUUID(), title: 'Kontak baru', value: '', buttonLabel: 'Hubungi', href: '' }],
  }));
  const updateItem = (id: string, patch: Partial<(typeof content.items)[number]>) => setContent((current) => ({
    ...current,
    items: current.items.map((item) => item.id === id ? { ...item, ...patch } : item),
  }));
  const updateOffice = (key: 'officeName' | 'officeBuilding' | 'officeAddress', value: string) => setContent((current) => ({ ...current, [key]: value }));
  return <main className="min-w-0 bg-muted p-3 text-foreground sm:p-6">
    <header className="mb-4 flex flex-wrap items-center gap-3">
      <Headset className="size-5" /><h1 className="text-xl font-bold">Kelola Layanan Pelanggan</h1>
      <Button asChild variant="outline" size="sm" className="ml-auto"><Link to="/layanan-pelanggan">Buka halaman</Link></Button>
    </header>
    <p className="mb-4 rounded-lg bg-accent px-4 py-2 text-xs text-accent-foreground">Kontak dan alamat tersimpan di browser ini. Pastikan detail yang dipublikasikan sudah benar dan aktif.</p>
    <section className="mb-4 grid gap-3 rounded-xl border border-border bg-background p-4 sm:grid-cols-2">
      <label className="grid gap-1 text-xs font-medium">Nama perusahaan<input className={input} value={content.officeName} onChange={(e) => updateOffice('officeName', e.target.value)} /></label>
      <label className="grid gap-1 text-xs font-medium">Gedung / alamat singkat<input className={input} value={content.officeBuilding} onChange={(e) => updateOffice('officeBuilding', e.target.value)} /></label>
      <label className="grid gap-1 text-xs font-medium sm:col-span-2">Alamat lengkap<textarea rows={3} className={input} value={content.officeAddress} onChange={(e) => updateOffice('officeAddress', e.target.value)} /></label>
    </section>
    <div className="mb-3 flex justify-end"><Button onClick={add}><Plus /> Tambah kontak</Button></div>
    <section className="space-y-3">
      {content.items.map((item) => <article key={item.id} className="grid min-w-0 gap-3 rounded-xl border border-border bg-background p-4 sm:grid-cols-2">
        <label className="grid gap-1 text-xs font-medium">Judul kontak<input className={input} value={item.title} onChange={(e) => updateItem(item.id, { title: e.target.value })} /></label>
        <label className="grid gap-1 text-xs font-medium">Informasi yang ditampilkan<input className={input} value={item.value} onChange={(e) => updateItem(item.id, { value: e.target.value })} /></label>
        <label className="grid gap-1 text-xs font-medium">Teks tombol<input className={input} value={item.buttonLabel} onChange={(e) => updateItem(item.id, { buttonLabel: e.target.value })} /></label>
        <label className="grid gap-1 text-xs font-medium">Tautan (https, tel, mailto)<input className={input} value={item.href} onChange={(e) => updateItem(item.id, { href: e.target.value })} placeholder="https:// atau tel: atau mailto:" /></label>
        <div className="sm:col-span-2"><Button variant="destructive" size="sm" onClick={() => setContent((current) => ({ ...current, items: current.items.filter((entry) => entry.id !== item.id) }))}><Trash2 /> Hapus kontak</Button></div>
      </article>)}
      {content.items.length === 0 && <p className="rounded-xl border border-dashed border-border bg-background p-8 text-center text-sm text-muted-foreground">Belum ada kontak layanan.</p>}
    </section>
  </main>;
}
