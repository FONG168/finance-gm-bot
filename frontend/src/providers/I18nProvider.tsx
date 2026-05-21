'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n, { LANGUAGE_KEY, loadLanguage, SUPPORTED_LANGUAGES } from '@/lib/i18n';

interface LanguageContextType {
  language: string;
  changeLanguage: (lang: string) => Promise<void>;
  syncFromServer: (serverLang: string) => Promise<void>;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'km',
  changeLanguage: async () => {},
  syncFromServer: async () => {},
  supportedLanguages: SUPPORTED_LANGUAGES,
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      const saved = localStorage.getItem(LANGUAGE_KEY) || 'km';
      await loadLanguage('km');
      await loadLanguage(saved);
      await i18n.changeLanguage(saved);
      setLanguage(saved);
      document.documentElement.setAttribute('data-lang', saved);
      setReady(true);
    };
    init();
  }, []);

  // Sync from DB: call this after login to apply the server-side preference
  const syncFromServer = useCallback(async (serverLang: string) => {
    const local = localStorage.getItem(LANGUAGE_KEY);
    if (serverLang && serverLang !== local) {
      await loadLanguage(serverLang);
      await i18n.changeLanguage(serverLang);
      setLanguage(serverLang);
      localStorage.setItem(LANGUAGE_KEY, serverLang);
      document.documentElement.setAttribute('data-lang', serverLang);
    }
  }, []);

  const changeLanguage = useCallback(async (lang: string) => {
    await loadLanguage(lang);
    await i18n.changeLanguage(lang);
    setLanguage(lang);
    localStorage.setItem(LANGUAGE_KEY, lang);
    document.documentElement.setAttribute('data-lang', lang);
    // Sync to DB async (non-blocking) — best-effort
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://finance-gm-backend-production.up.railway.app/api';
        fetch(`${apiBase}/auth/me`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ preferredLanguage: lang }),
        }).catch(() => {});
      }
    } catch {}
  }, []);

  if (!ready) return null;

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, syncFromServer, supportedLanguages: SUPPORTED_LANGUAGES }}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </LanguageContext.Provider>
  );
}
