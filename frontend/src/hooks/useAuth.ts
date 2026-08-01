'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTelegram } from './useTelegram';
import { apiService } from '@/services/api';
import { User } from '@shared/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export function useAuth() {
  const { initData, isReady, webApp } = useTelegram();
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  const saveAndSet = (response: { token: string; user: User }) => {
    localStorage.setItem('auth_token', response.token);
    apiService.setToken(response.token);
    setState({ user: response.user, token: response.token, isLoading: false, isAuthenticated: true, error: null });
  };

  const authenticate = useCallback(async () => {
    const savedToken = localStorage.getItem('auth_token');
    const urlParams = new URLSearchParams(window.location.search);
    const uid = urlParams.get('uid');
    const tok = urlParams.get('tok');

    const isLocal = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1'
    );

    if (savedToken) {
      apiService.setToken(savedToken);
      try {
        const user = await apiService.auth.me();
        // Clear cached mock token if we have real Telegram credentials or are on a tunnel domain
        if (user.telegramId === 12345 && (!isLocal || initData || (uid && tok))) {
          localStorage.removeItem('auth_token');
          apiService.setToken('');
        } else {
          setState({ user, token: savedToken, isLoading: false, isAuthenticated: true, error: null });
          return;
        }
      } catch {
        localStorage.removeItem('auth_token');
        apiService.setToken('');
      }
    }
    if (uid && tok) {
      try {
        const response = await apiService.auth.botToken(uid, tok);
        saveAndSet(response);
        return;
      } catch {
        // Fall through
      }
    }

    let effectiveInitData = initData;

    if (isLocal && !effectiveInitData) {
      effectiveInitData = `user=${encodeURIComponent(JSON.stringify({ id: 12345, first_name: 'Test', last_name: 'User', username: 'testuser' }))}&auth_date=${Math.floor(Date.now() / 1000)}&hash=mock`;
    }

    if (!effectiveInitData) {
      setState((s) => ({ ...s, isLoading: false, error: 'No authentication data' }));
      return;
    }

    try {
      const response = await apiService.auth.telegram(effectiveInitData);
      saveAndSet(response);
    } catch (error: any) {
      if (webApp?.initDataUnsafe?.user) {
        const tgUser = webApp.initDataUnsafe.user;
        const fallbackUser: any = {
          id: String(tgUser.id),
          telegramId: tgUser.id,
          firstName: tgUser.first_name,
          lastName: tgUser.last_name || null,
          username: tgUser.username || null,
          photoUrl: tgUser.photo_url || null,
          currency: 'USD',
          timezone: 'UTC',
          preferredLanguage: tgUser.language_code || 'en',
          plan: 'FREE',
          subscriptionStatus: 'TRIAL',
          trialEndsAt: null,
          premiumStartedAt: null,
          premiumExpiresAt: null,
        };
        setState({
          user: fallbackUser,
          token: 'telegram-session-token',
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } else {
        setState((s) => ({ ...s, isLoading: false, error: error.message || 'Authentication failed' }));
      }
    }
  }, [initData, webApp]);

  useEffect(() => {
    if (isReady) {
      authenticate();
    }
  }, [isReady, authenticate, initData]);

  const refreshUser = useCallback(async () => {
    try {
      const user = await apiService.auth.me();
      setState(s => ({ ...s, user }));
    } catch {}
  }, []);

  // Real-time listener: sync user status with admin actions every 2.5 seconds
  useEffect(() => {
    if (!state.isAuthenticated) return;
    const interval = setInterval(() => {
      refreshUser();
    }, 2500);
    return () => clearInterval(interval);
  }, [state.isAuthenticated, refreshUser]);

  const updatePreferences = useCallback(async (prefs: { currency?: string; timezone?: string }) => {
    await apiService.user.updatePreferences(prefs);
    await refreshUser();
  }, [refreshUser]);

  return { ...state, authenticate, refreshUser, updatePreferences };
}
