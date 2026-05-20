'use client';

import { useEffect, useState, useCallback } from 'react';
import { TelegramWebApp, TelegramUser } from '@shared/types';

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
    TelegramWebviewProxy?: unknown;
  }
}

interface UseTelegramReturn {
  webApp: TelegramWebApp | null;
  user: TelegramUser | null;
  initData: string;
  colorScheme: 'light' | 'dark';
  isReady: boolean;
  haptic: {
    impact: (style?: 'light' | 'medium' | 'heavy') => void;
    success: () => void;
    error: () => void;
    selection: () => void;
  };
  showBackButton: (callback: () => void) => void;
  hideBackButton: () => void;
  close: () => void;
  expand: () => void;
}

export function useTelegram(): UseTelegramReturn {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [isReady, setIsReady] = useState(false);
  // initData stored as state so async postMessage updates trigger re-auth
  const [initData, setInitData] = useState('');
  const [tgUser, setTgUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    let dataPollInterval: ReturnType<typeof setInterval> | null = null;

    // Manually extract a hash parameter — URLSearchParams fails when value contains unencoded &
    const extractHashParam = (hash: string, key: string): string => {
      const prefix = `${key}=`;
      const idx = hash.indexOf(prefix);
      if (idx === -1) return '';
      const start = idx + prefix.length;
      // Stop at the next &tgWebApp parameter (Telegram's own params)
      const next = hash.indexOf('&tgWebApp', start);
      const raw = next === -1 ? hash.slice(start) : hash.slice(start, next);
      try { return decodeURIComponent(raw); } catch { return raw; }
    };

    const applyWebApp = (tg: TelegramWebApp) => {
      tg.ready();
      tg.expand();
      setWebApp(tg);

      const sdkData = tg.initData;
      const rawHash = window.location.hash.slice(1);
      // Manual extraction handles unencoded & inside tgWebAppData value
      const hashData = extractHashParam(rawHash, 'tgWebAppData');
      // Fallback: hash itself is legacy initData format
      const legacyData = !hashData && rawHash.includes('auth_date=') ? rawHash : '';
      const initial = sdkData || hashData || legacyData;

      if (initial) {
        setInitData(initial);
        setTgUser(tg.initDataUnsafe?.user || null);
        setIsReady(true);
      } else {
        // Poll for async delivery (Telegram Desktop sends initData after ready())
        setIsReady(true);
        let attempts = 0;
        dataPollInterval = setInterval(() => {
          const data = window.Telegram?.WebApp?.initData;
          const rh = window.location.hash.slice(1);
          const hd = extractHashParam(rh, 'tgWebAppData');
          const found = data || hd || (rh.includes('auth_date=') ? rh : '');
          if (found) {
            setInitData(found);
            setTgUser(window.Telegram?.WebApp?.initDataUnsafe?.user || null);
            clearInterval(dataPollInterval!);
          } else if (attempts++ > 150) {
            clearInterval(dataPollInterval!);
          }
        }, 100);
      }
    };

    const init = () => {
      const tg = window.Telegram?.WebApp;
      if (tg) {
        applyWebApp(tg);
        return;
      }
      // SDK not loaded yet — poll for it
      let attempts = 0;
      const sdkPoll = () => {
        const tg2 = window.Telegram?.WebApp;
        if (tg2) {
          applyWebApp(tg2);
        } else if (attempts++ < 50) {
          setTimeout(sdkPoll, 100);
        } else {
          setIsReady(true); // no Telegram context
        }
      };
      sdkPoll();
    };

    if (document.readyState === 'complete') {
      init();
    } else {
      window.addEventListener('load', init, { once: true });
    }

    return () => {
      if (dataPollInterval) clearInterval(dataPollInterval);
    };
  }, []);

  const colorScheme = webApp?.colorScheme || 'dark';

  const haptic = {
    impact: useCallback(
      (style: 'light' | 'medium' | 'heavy' = 'medium') => {
        webApp?.HapticFeedback?.impactOccurred(style);
      },
      [webApp],
    ),
    success: useCallback(() => {
      webApp?.HapticFeedback?.notificationOccurred('success');
    }, [webApp]),
    error: useCallback(() => {
      webApp?.HapticFeedback?.notificationOccurred('error');
    }, [webApp]),
    selection: useCallback(() => {
      webApp?.HapticFeedback?.selectionChanged();
    }, [webApp]),
  };

  const showBackButton = useCallback(
    (callback: () => void) => {
      if (webApp?.BackButton) {
        webApp.BackButton.show();
        webApp.BackButton.onClick(callback);
      }
    },
    [webApp],
  );

  const hideBackButton = useCallback(() => {
    webApp?.BackButton?.hide();
  }, [webApp]);

  const close = useCallback(() => webApp?.close(), [webApp]);
  const expand = useCallback(() => webApp?.expand(), [webApp]);

  return { webApp, user: tgUser, initData, colorScheme, isReady, haptic, showBackButton, hideBackButton, close, expand };
}
