import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import {
  type AuthUser,
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from '@/services/auth';

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  register: typeof registerUser;
  login: typeof loginUser;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
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

        const response = await fetchCurrentUser();

        if (!isMounted) return;

        if (response.ok && response.data) {
          setUser(response.data);
        } else {
          apiClient.setToken(null);
        }
      } catch (error) {
        console.error('Auth initialization failed', error);
        apiClient.setToken(null);
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
    }

    return response;
  }, []);

  const handleLogin = useCallback<typeof loginUser>(async (input) => {
    const response = await loginUser(input);

    if (response.ok && response.data) {
      setUser(response.data.user);
    }

    return response;
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const response = await fetchCurrentUser();

    if (response.ok && response.data) {
      setUser(response.data);
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

