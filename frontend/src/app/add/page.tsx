'use client';

import '@/lib/i18n';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/layout/BottomNav';
import { AddTransactionForm } from '@/components/transactions/AddTransactionForm';
import { useTelegram } from '@/hooks/useTelegram';
import { useTranslation } from 'react-i18next';

export default function AddTransactionPage() {
  const router = useRouter();
  const { showBackButton, hideBackButton } = useTelegram();
  const { t } = useTranslation('common');

  useEffect(() => {
    showBackButton(() => router.back());
    return () => hideBackButton();
  }, [showBackButton, hideBackButton, router]);

  return (
    <div className="min-h-screen bg-background pb-nav">
      <div className="px-4 pt-5 pb-2 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold">{t('add.title')}</h1>
      </div>

      <div className="px-4 py-3 max-w-2xl mx-auto">
        <AddTransactionForm />
      </div>

      <BottomNav />
    </div>
  );
}
