function getApiBaseUrl(): string {
  // Client-side in browser: use relative path /api/v1 (routed to backend service via Vercel rewrites),
  // or use NEXT_PUBLIC_API_URL if explicitly specified.
  if (typeof window !== 'undefined') {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return `${process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '')}/api/v1`;
    }
    return '/api/v1';
  }

  // Server-side (SSR / Server Functions): use BACKEND_URL bound from Vercel service binding
  const serverBase = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  return `${serverBase.replace(/\/+$/, '')}/api/v1`;
}

const API_BASE_URL = getApiBaseUrl();

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('gamutual_token');
}

export function setStoredToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('gamutual_token', token);
  }
}

export function getActiveAccountId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('gamutual_account_id');
}

export function setActiveAccountId(id: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('gamutual_account_id', id);
  }
}

export function getActiveUsername(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('gamutual_username');
}

export function setActiveUsername(username: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('gamutual_username', username);
  }
}

export function clearAuthSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('gamutual_token');
    localStorage.removeItem('gamutual_account_id');
    localStorage.removeItem('gamutual_username');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      clearAuthSession();
    }
    const errorMsg = data?.detail?.message || data?.detail || data?.message || 'Terjadi kesalahan sistem';
    const err: any = new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

export const api = {
  // Auth
  login: (body: { username: string; password: string; remember_device?: boolean }) =>
    request<any>('/auth/instagram/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  verifyChallenge: (body: { temporary_session_id: string; verification_code: string }) =>
    request<any>('/auth/instagram/challenge/verify', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getAccounts: (activeId?: string) =>
    request<{ active_account_id: string; accounts: any[] }>(
      `/auth/instagram/accounts${activeId ? `?active_id=${activeId}` : ''}`
    ),

  // Dashboard & Sync
  getDashboard: (accountId: string) =>
    request<any>(`/instagram/accounts/${accountId}/home-dashboard`),

  syncNow: (accountId: string) =>
    request<any>(`/instagram/accounts/${accountId}/sync`, {
      method: 'POST',
    }),

  // Unfollowers
  getUnfollowers: (accountId: string, params: { filter?: string; search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params.filter) query.set('filter', params.filter);
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    return request<any>(`/instagram/accounts/${accountId}/unfollowers?${query.toString()}`);
  },

  unfollow: (accountId: string, body: { target_ig_pk: string; target_username: string }) =>
    request<any>(`/instagram/accounts/${accountId}/actions/unfollow`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // Whitelist
  toggleWhitelist: (accountId: string, body: { target_ig_pk: string; target_username: string }) =>
    request<any>(`/instagram/accounts/${accountId}/whitelist/toggle`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getWhitelist: (accountId: string) =>
    request<any>(`/instagram/accounts/${accountId}/whitelist`),

  // Activities
  getActivities: (accountId: string, filter: string = 'all') =>
    request<any>(`/instagram/accounts/${accountId}/activities?filter=${filter}`),
};
