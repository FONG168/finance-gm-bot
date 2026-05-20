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
    // Step 1: Try saved JWT (skip re-auth if still valid)
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      apiService.setToken(savedToken);
      try {
        const user = await apiService.auth.me();
        setState({ user, token: savedToken, isLoading: false, isAuthenticated: true, error: null });
        return;
      } catch {
        localStorage.removeItem('auth_token');
        apiService.setToken('');
      }
    }

    // Step 2: Bot-token auth (Telegram Desktop fallback — uid+tok in URL query params)
    const urlParams = new URLSearchParams(window.location.search);
    const uid = urlParams.get('uid');
    const tok = urlParams.get('tok');
    if (uid && tok) {
      try {
        const response = await apiService.auth.botToken(uid, tok);
        saveAndSet(response);
        return;
      } catch {
        // Invalid token, fall through
      }
    }

    // Step 3: Telegram initData (works on mobile and newer Desktop versions)
    let effectiveInitData = initData;

    // Dev mock when running outside Telegram entirely
    if (process.env.NODE_ENV === 'development' && !effectiveInitData) {
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
      setState((s) => ({ ...s, isLoading: false, error: error.message || 'Authentication failed' }));
    }
  }, [initData, webApp]);

  useEffect(() => {
    if (!isReady) return;
    authenticate();
  }, [isReady, authenticate]);

  return { ...state, authenticate };
}
