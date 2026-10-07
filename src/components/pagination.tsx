import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const PAGE_SIZE = 8;

/** Paginates a list: returns the 8 items of the current page plus the controls state. */
export function usePagination<T>(items: T[], pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  const pageItems = useMemo(() => items.slice((page - 1) * pageSize, page * pageSize), [items, page, pageSize]);
  return { page, setPage, totalPages, pageItems, total: items.length, pageSize };
}

export function Pagination({ page, totalPages, total, pageSize, onPage }: {
  page: number; totalPages: number; total: number; pageSize?: number; onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const size = pageSize ?? PAGE_SIZE;
  const from = (page - 1) * size + 1;
  const to = Math.min(total, page * size);
  const nums: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) nums.push(i);
  }
  const dedup = nums.filter((n, i) => nums.indexOf(n) === i);
  return <nav className="mt-3 flex flex-wrap items-center justify-between gap-2" aria-label="Navigasi halaman">
    <p className="text-xs text-muted-foreground">Menampilkan {from}–{to} dari {total} data</p>
    <div className="flex items-center gap-1">
      <Button size="icon" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Halaman sebelumnya"><ChevronLeft /></Button>
      {dedup.map((n, i) => <span key={n} className="flex items-center">
        {i > 0 && dedup[i - 1]! < n - 1 && <span className="px-1 text-muted-foreground">…</span>}
        <Button size="icon" variant={n === page ? 'default' : 'outline'} onClick={() => onPage(n)} aria-label={`Halaman ${n}`} aria-current={n === page ? 'page' : undefined}>{n}</Button>
      </span>)}
      <Button size="icon" variant="outline" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Halaman berikutnya"><ChevronRight /></Button>
    </div>
  </nav>;
}
