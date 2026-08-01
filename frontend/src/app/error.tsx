'use client';

import '@/lib/i18n';
import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useTranslation('common');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/15 flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-rose-600" />
      </div>
      <h1 className="text-lg font-bold">{t('common.somethingWentWrong')}</h1>
      <p className="text-sm text-muted-foreground max-w-xs">
        {t('common.somethingWentWrongHint')}
      </p>
      <div className="flex gap-2.5 mt-2">
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-full bg-violet-600 text-white text-sm font-semibold active:scale-95 transition-transform"
        >
          {t('common.tryAgain')}
        </button>
        <a
          href="/"
          className="px-5 py-2.5 rounded-full bg-secondary text-foreground text-sm font-semibold active:scale-95 transition-transform"
        >
          {t('common.backToHome')}
        </a>
      </div>
    </div>
  );
}
