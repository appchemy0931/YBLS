import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types';
import { authAPI } from '../api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('userInfo');
    if (!stored) return null;
    try {
      return JSON.parse(stored) as User;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => localStorage.getItem('userInfo') !== null);

  useEffect(() => {
    const stored = localStorage.getItem('userInfo');
    if (!stored) return;
    let cancelled = false;
    let token: string | undefined;
    try {
      token = (JSON.parse(stored) as { token?: string }).token;
    } catch {
      token = undefined;
    }

    const refreshFromServer = async () => {
      try {
        const { data } = await authAPI.getProfile();
        if (cancelled) return;
        // getProfile does not return a token — preserve the existing one.
        const fresh = { ...data, token } as User;
        setUser(fresh);
        localStorage.setItem('userInfo', JSON.stringify(fresh));
      } catch (err) {
        if (cancelled) return;
        const status = (err as Error & { status?: number }).status;
        if (status === 401) {
          // Token invalid/expired — force logout.
          setUser(null);
          localStorage.removeItem('userInfo');
        }
        // On other errors (e.g. network), keep the persisted user as-is.
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    refreshFromServer();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('userInfo', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userInfo');
  };

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...userData };
      localStorage.setItem('userInfo', JSON.stringify(updated));
      return updated;
    });
  };

  const refreshUser = async () => {
    try {
      const { data } = await authAPI.getProfile();
      const stored = localStorage.getItem('userInfo');
      const token = stored ? (JSON.parse(stored) as { token?: string }).token : undefined;
      const fresh = { ...data, token } as User;
      setUser(fresh);
      localStorage.setItem('userInfo', JSON.stringify(fresh));
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      if (status === 401) {
        logout();
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
