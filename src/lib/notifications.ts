import { useCallback, useEffect, useState } from 'react';
import type { SaveStatus } from '@/lib/site-content';

export type Notif = { id: string; title: string; message: string; target: 'all' | string[]; createdAt: string };

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...init,
    headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof payload?.error === 'string' ? payload.error : 'Permintaan notifikasi gagal.');
  return payload as T;
}

export async function loadNotifs(): Promise<Notif[]> {
  const result = await request<{ notifications: Notif[] }>('/api/notifications');
  return result.notifications;
}

export function useNotifs() {
  const [list, setList] = useState<Notif[]>([]);
  const [status, setStatus] = useState<SaveStatus>('loading');
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const result = await request<{ notifications: Notif[] }>('/api/admin/notifications');
      setList(result.notifications);
      setStatus('saved');
    } catch (cause) {
      setStatus('error');
      setError(cause instanceof Error ? cause.message : 'Riwayat notifikasi tidak dapat dimuat.');
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const create = useCallback(async (input: Omit<Notif, 'id' | 'createdAt'>) => {
    setStatus('saving');
    setError('');
    try {
      const result = await request<{ notification: Notif }>('/api/admin/notifications', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      setList((current) => [result.notification, ...current]);
      setStatus('saved');
      return result.notification;
    } catch (cause) {
      setStatus('error');
      setError(cause instanceof Error ? cause.message : 'Notifikasi tidak dapat dikirim.');
      throw cause;
    }
  }, []);
  const remove = useCallback(async (id: string) => {
    setStatus('saving');
    setError('');
    try {
      await request(`/api/admin/notifications/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setList((current) => current.filter((item) => item.id !== id));
      setStatus('saved');
    } catch (cause) {
      setStatus('error');
      setError(cause instanceof Error ? cause.message : 'Notifikasi tidak dapat dihapus.');
      throw cause;
    }
  }, []);
  return { list, status, error, refresh, create, remove };
}
