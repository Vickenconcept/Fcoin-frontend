// @ts-nocheck
import React from 'react';
import { apiClient } from '@/lib/apiClient';
import {
  type AuthUser,
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from '@/services/auth';

const AUTH_USER_COOKIE = 'phanrise_auth_user';
const USER_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

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

function loadStoredUser(): AuthUser | null {
  if (typeof document === 'undefined') {
    return null;
  }

  try {
    const value = getCookie(AUTH_USER_COOKIE);
    return value ? (JSON.parse(value) as AuthUser) : null;
  } catch (error) {
    console.error('Failed to parse stored auth user', error);
    deleteCookie(AUTH_USER_COOKIE);
    return null;
  }
}

function storeAuthUser(user: AuthUser | null) {
  if (typeof document === 'undefined') {
    return;
  }

  if (!user) {
    deleteCookie(AUTH_USER_COOKIE);
    return;
  }

  try {
    setCookie(AUTH_USER_COOKIE, JSON.stringify(user), USER_COOKIE_MAX_AGE_SECONDS);
  } catch (error) {
    console.error('Failed to persist auth user', error);
  }
}

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  register: typeof registerUser;
  login: typeof loginUser;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const { createContext, useCallback, useContext, useEffect, useMemo, useState } = React as any;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: any }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadStoredUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        const token = apiClient.getToken();

        if (!token) {
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        apiClient.setToken(token);

        const response = await fetchCurrentUser();

        if (!isMounted) return;

        if (response.ok && response.data) {
          setUser(response.data);
          storeAuthUser(response.data);
        } else {
          apiClient.setToken(null);
          storeAuthUser(null);
        }
      } catch (error) {
        console.error('Auth initialization failed', error);
        apiClient.setToken(null);
        storeAuthUser(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initialize()
      .catch((error) => {
        console.error(error);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRegister = useCallback<typeof registerUser>(async (input) => {
    const response = await registerUser(input);

    if (response.ok && response.data) {
      setUser(response.data.user);
      storeAuthUser(response.data.user);
    }

    return response;
  }, []);

  const handleLogin = useCallback<typeof loginUser>(async (input) => {
    const response = await loginUser(input);

    if (response.ok && response.data) {
      setUser(response.data.user);
      storeAuthUser(response.data.user);
    }

    return response;
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
      storeAuthUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const response = await fetchCurrentUser();

    if (response.ok && response.data) {
      setUser(response.data);
      storeAuthUser(response.data);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      register: handleRegister,
      login: handleLogin,
      logout: handleLogout,
      refreshUser,
    }),
    [user, isLoading, handleRegister, handleLogin, handleLogout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

