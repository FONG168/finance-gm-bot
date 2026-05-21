'use client';

import '@/lib/i18n';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/layout/BottomNav';
import { AddTransactionForm } from '@/components/transactions/AddTransactionForm';
import { useTelegram } from '@/hooks/useTelegram';
import { useAuth } from '@/hooks/useAuth';
import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AddTransactionPage() {
  const router = useRouter();
  const { showBackButton, hideBackButton } = useTelegram();
  const { user } = useAuth();
  const { t } = useTranslation('common');

  const isExpired =
    user?.subscriptionStatus === 'EXPIRED' ||
    (user?.plan === 'PREMIUM' && user?.premiumExpiresAt && new Date(user.premiumExpiresAt) < new Date());

  useEffect(() => {
    showBackButton(() => router.back());
    return () => hideBackButton();
  }, [showBackButton, hideBackButton, router]);

  return (
    <div className="min-h-screen bg-background pb-nav">
      <div className="px-4 pt-5 pb-2 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold">{t('add.title')}</h1>
      </div>

      {isExpired && (
        <div className="px-4 pb-3 max-w-2xl mx-auto">
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm"
            style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.18),rgba(79,70,229,0.18))', border: '1px solid rgba(124,58,237,0.35)' }}
          >
            <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="font-semibold text-violet-300 text-xs">
                {user?.plan === 'PREMIUM' ? t('subscription.expired') : t('subscription.trialEnded')}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{t('add.blocked')}</p>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-3 max-w-2xl mx-auto">
        <AddTransactionForm />
      </div>

      <BottomNav />
    </div>
  );
}
