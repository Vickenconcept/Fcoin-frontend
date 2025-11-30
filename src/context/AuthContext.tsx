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

const AUTH_USER_STORAGE_KEY = 'phanrise_auth_user_storage';

function loadStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const value = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
    return value ? (JSON.parse(value) as AuthUser) : null;
  } catch (error) {
    console.error('Failed to parse stored auth user', error);
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return null;
  }
}

function storeAuthUser(user: AuthUser | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!user) {
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return;
  }

  try {
    window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
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

