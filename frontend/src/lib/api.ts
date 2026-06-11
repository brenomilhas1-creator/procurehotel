/**
 * Cliente HTTP para o backend FastAPI.
 * Inclui refresh automático do access_token Supabase em 401.
 */

import { useAuthStore } from '@/stores/auth';
import { getSupabase } from './supabase';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

type FetchOptions = RequestInit & { json?: unknown; __isRetry?: boolean };

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function refreshSession(): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { data } = await sb.auth.refreshSession();
  if (!data.session) return false;
  useAuthStore.setState({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  });
  return true;
}

export async function api<T = unknown>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { json, headers, __isRetry, ...rest } = opts;
  const token = useAuthStore.getState().accessToken;
  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string>),
  };
  if (json !== undefined) finalHeaders['Content-Type'] = 'application/json';
  if (token) finalHeaders['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: json !== undefined ? JSON.stringify(json) : (rest as RequestInit).body,
  });

  if (res.status === 401 && !__isRetry) {
    const ok = await refreshSession();
    if (ok) {
      return api<T>(path, { ...opts, __isRetry: true });
    }
    useAuthStore.getState().clear();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new ApiError('Não autenticado', 401, null);
  }

  if (!res.ok) {
    let payload: any = null;
    try { payload = await res.json(); } catch { /* ignore */ }
    throw new ApiError(payload?.detail || res.statusText, res.status, payload);
  }
  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

export const apiGet = <T,>(path: string) => api<T>(path, { method: 'GET' });
export const apiPost = <T,>(path: string, body?: unknown) =>
  api<T>(path, { method: 'POST', json: body });
export const apiPatch = <T,>(path: string, body?: unknown) =>
  api<T>(path, { method: 'PATCH', json: body });
export const apiDelete = <T,>(path: string) => api<T>(path, { method: 'DELETE' });

export async function apiUpload<T = unknown>(path: string, formData: FormData) {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    body: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (res.status === 401) {
    const ok = await refreshSession();
    if (ok) return apiUpload<T>(path, formData);
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(data?.detail || res.statusText, res.status, data);
  }
  return res.json() as Promise<T>;
}
