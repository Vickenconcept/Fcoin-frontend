const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ?? 'http://localhost:8000/api';

const TOKEN_COOKIE = 'fancoin_auth_token';
const TOKEN_STORAGE_KEY = 'fancoin_auth_token_storage';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, maxAgeSeconds?: number) {
  if (typeof document === 'undefined') return;

  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'SameSite=Lax',
  ];

  if (maxAgeSeconds) {
    parts.push(`Max-Age=${maxAgeSeconds}`);
  }

  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    parts.push('Secure');
  }

  document.cookie = parts.join('; ');
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;

  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function setStorageToken(token: string | null) {
  if (typeof window === 'undefined') return;

  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

function getStorageToken(): string | null {
  if (typeof window === 'undefined') return null;

  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

type ApiError = {
  title?: string;
  detail?: string;
  code?: string;
  source?: Record<string, unknown>;
};

export type ApiResponse<T> = {
  ok: boolean;
  status: number;
  data?: T;
  errors?: ApiError[];
  meta?: Record<string, unknown>;
  raw?: unknown;
};

class ApiClient {
  private token: string | null;

  constructor() {
    this.token = this.loadToken();
  }

  setToken(token: string | null) {
    this.token = token;

    if (token) {
      setCookie(TOKEN_COOKIE, token, COOKIE_MAX_AGE_SECONDS);
      setStorageToken(token);
    } else {
      deleteCookie(TOKEN_COOKIE);
      setStorageToken(null);
    }
  }

  getToken(): string | null {
    return this.token;
  }

  async request<T>(
    path: string,
    options: RequestInit & { skipAuth?: boolean } = {},
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
    const headers = new Headers(options.headers);

    headers.set('Accept', 'application/json');

    const isFormData = options.body instanceof FormData;

    if (!isFormData && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (!options.skipAuth && this.token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: options.credentials ?? 'same-origin',
      body:
        options.body && !isFormData && typeof options.body !== 'string'
          ? JSON.stringify(options.body)
          : options.body,
    });

    let payload: any = null;

    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      data: payload?.data,
      errors: payload?.errors,
      meta: payload?.meta,
      raw: payload,
    };
  }

  private loadToken(): string | null {
    return getStorageToken() ?? getCookie(TOKEN_COOKIE);
  }
}

export const apiClient = new ApiClient();

