const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ?? 'http://localhost:8000/api';

// Debug: Log the API URL being used
console.log('🔗 Frontend API Base URL:', API_BASE_URL);
console.log('🌐 import.meta.env.VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
const IDEMPOTENT_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

const generateIdempotencyKey = (): string => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `idemp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

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
    const method = (options.method ?? 'GET').toUpperCase();

    console.log('Frontend API: Making request', { url, method, hasToken: !!this.token });

    headers.set('Accept', 'application/json');

    const isFormData = options.body instanceof FormData;

    if (!isFormData && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (!options.skipAuth && this.token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    if (IDEMPOTENT_METHODS.includes(method) && !headers.has('Idempotency-Key')) {
      headers.set('Idempotency-Key', generateIdempotencyKey());
    }

    try {
      // Add timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 10000); // 10 second timeout

      // Determine credentials mode based on whether we're in production or local
      // For production (phanrise.com), use 'include' for cross-origin requests
      // For local development, use 'same-origin'
      let credentialsMode = options.credentials;
      if (!credentialsMode && typeof window !== 'undefined') {
        const isProduction = window.location.hostname === 'phanrise.com' || window.location.hostname === 'www.phanrise.com';
        try {
          const apiOrigin = new URL(API_BASE_URL).origin;
          const currentOrigin = window.location.origin;
          const isCrossOrigin = currentOrigin !== apiOrigin;
          
          // Use 'include' only for production cross-origin requests
          // Use 'same-origin' for localhost or same-origin requests
          if (isProduction && isCrossOrigin) {
            credentialsMode = 'include';
          } else {
            credentialsMode = 'same-origin';
          }
        } catch (e) {
          // If URL parsing fails, default to same-origin
          console.warn('Failed to parse API_BASE_URL for credentials mode:', e);
          credentialsMode = 'same-origin';
        }
      } else if (!credentialsMode) {
        credentialsMode = 'same-origin';
      }

      const response = await fetch(url, {
        ...options,
        method,
        headers,
        credentials: credentialsMode,
        signal: controller.signal,
        body:
          options.body && !isFormData && typeof options.body !== 'string'
            ? JSON.stringify(options.body)
            : options.body,
      });

      clearTimeout(timeoutId);

      console.log('Frontend API: Response received', {
        url,
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
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
    } catch (error) {
      console.error('Frontend API: Request failed', { url, error, errorType: error instanceof Error ? error.name : typeof error });

      // Handle different types of errors
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            ok: false,
            status: 0,
            errors: [
              {
                title: 'Request Timeout',
                detail: 'The request timed out. Please check your internet connection and try again.',
              },
            ],
          };
        }

        // Check for CORS errors
        if (error.message.includes('CORS') || error.message.includes('cross-origin') || error.message.includes('Access-Control')) {
          return {
            ok: false,
            status: 0,
            errors: [
              {
                title: 'CORS Error',
                detail: `Cross-origin request blocked. Please check CORS configuration on the backend. URL: ${url}`,
              },
            ],
          };
        }

        // Check for network errors
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          return {
            ok: false,
            status: 0,
            errors: [
              {
                title: 'Network Error',
                detail: `Unable to connect to server at ${url}. Please ensure the backend is running and accessible.`,
              },
            ],
          };
        }
      }

      return {
        ok: false,
        status: 0,
        errors: [
          {
            title: 'Request Failed',
            detail: error instanceof Error ? error.message : 'An unexpected error occurred',
          },
        ],
      };
    }
  }

  private loadToken(): string | null {
    return getStorageToken() ?? getCookie(TOKEN_COOKIE);
  }
}

export const apiClient = new ApiClient();

