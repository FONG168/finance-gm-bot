'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { adminApi, setToken, clearToken, getToken } from '@/lib/api';

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  role: string;
  permissions: string[];
  lastLoginAt?: string;
}

interface AuthContextValue {
  admin: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    if (!getToken()) { setIsLoading(false); return; }
    try {
      const res = await adminApi.auth.me();
      setAdmin(res.data.data);
    } catch {
      clearToken();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (email: string, password: string) => {
    const res = await adminApi.auth.login(email, password);
    const { token, admin: adminData } = res.data.data;
    setToken(token);
    setAdmin(adminData);
  };

  const logout = () => {
    clearToken();
    setAdmin(null);
    window.location.href = '/login';
  };

  const hasPermission = (permission: string): boolean => {
    if (!admin) return false;
    if (admin.role === 'SUPER_ADMIN') return true;
    return admin.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ admin, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
