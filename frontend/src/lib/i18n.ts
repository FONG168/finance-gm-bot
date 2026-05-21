import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const LANGUAGE_KEY = 'finance_gm_language';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇺🇸' },
  { code: 'km', label: 'Khmer', nativeLabel: 'ភាសាខ្មែរ', flag: '🇰🇭' },
  { code: 'zh', label: 'Chinese', nativeLabel: '中文', flag: '🇨🇳' },
];

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {},
    lng: 'en',
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export async function loadLanguage(lang: string) {
  if (i18n.hasResourceBundle(lang, 'common')) return;
  try {
    const res = await fetch(`/locales/${lang}/common.json`);
    const data = await res.json();
    i18n.addResourceBundle(lang, 'common', data, true, true);
  } catch (e) {
    console.error(`Failed to load language: ${lang}`, e);
  }
}

export default i18n;
