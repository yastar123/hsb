import { createElement, useCallback, useEffect, useRef, useState, type SetStateAction } from 'react';

export type SaveStatus = 'loading' | 'ready' | 'saved' | 'saving' | 'error';

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof payload?.error === 'string' ? payload.error : `Permintaan gagal (${response.status}).`);
  }
  return payload as T;
}

export function useServerContent<T>(key: string, initial: T) {
  const [value, setValueState] = useState(initial);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<SaveStatus>('loading');
  const [error, setError] = useState('');
  const dirty = useRef(false);
  const revision = useRef(0);

  useEffect(() => {
    let active = true;
    void requestJson<{ value: T | null }>(`/api/content/${encodeURIComponent(key)}`)
      .then(({ value: saved }) => {
        if (active && !dirty.current && saved !== null) setValueState(saved);
        if (active) setError('');
        if (active) setStatus(saved === null ? 'ready' : 'saved');
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'Konten tidak dapat dimuat dari server.');
          setStatus('error');
        }
      })
      .finally(() => {
        if (active) {
          setLoaded(true);
        }
      });
    return () => { active = false; };
  }, [key]);

  const setValue = useCallback((next: SetStateAction<T>) => {
    revision.current += 1;
    dirty.current = true;
    setStatus('saving');
    setError('');
    setValueState(next);
  }, []);

  useEffect(() => {
    if (!loaded || !dirty.current) return;
    const savingRevision = revision.current;
    const snapshot = value;
    const timer = window.setTimeout(() => {
      void requestJson<{ ok: true }>(`/api/admin/content/${encodeURIComponent(key)}`, {
        method: 'PUT',
        body: JSON.stringify({ value: snapshot }),
      }).then(() => {
        if (revision.current === savingRevision) {
          dirty.current = false;
          setStatus('saved');
          setError('');
        }
      }).catch((cause: unknown) => {
        if (revision.current === savingRevision) {
          setStatus('error');
          setError(cause instanceof Error ? cause.message : 'Perubahan tidak dapat disimpan.');
        }
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [key, value, loaded]);

  return { value, setValue, loaded, status, error };
}

export function SaveStatusText({ status, error }: { status: SaveStatus; error?: string }) {
  const label = status === 'loading'
    ? 'Memuat dari server…'
    : status === 'ready'
      ? 'Penyimpanan server siap; belum ada perubahan tersimpan.'
    : status === 'saving'
      ? 'Menyimpan ke server…'
      : status === 'error'
        ? error || 'Gagal menyimpan ke server.'
        : 'Tersimpan di server.';
  return createElement('span', { role: status === 'error' ? 'alert' : 'status', 'aria-live': 'polite' }, label);
}

export async function postJson<T>(url: string, body?: unknown, method = 'POST'): Promise<T> {
  return requestJson<T>(url, {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
