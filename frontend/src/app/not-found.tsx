'use client';

import '@/lib/i18n';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation('common');
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background px-6 text-center">
      <p className="text-4xl">🧭</p>
      <h1 className="text-lg font-bold">{t('common.pageNotFound')}</h1>
      <p className="text-sm text-muted-foreground max-w-xs">
        {t('common.pageNotFoundHint')}
      </p>
      <Link
        href="/"
        className="mt-2 px-5 py-2.5 rounded-full bg-violet-600 text-white text-sm font-semibold active:scale-95 transition-transform"
      >
        {t('common.backToHome')}
      </Link>
    </div>
  );
}
