'use client';

import '@/lib/i18n';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, RefreshCw, TrendingUp, TrendingDown, X, AlertCircle, CheckCircle, Clock, Globe } from 'lucide-react';
import { BottomNav } from '@/components/layout/BottomNav';
import { CategoryPieChart } from '@/components/charts/CategoryPieChart';
import { IncomeExpenseChart } from '@/components/charts/IncomeExpenseChart';
import { TransactionItem } from '@/components/transactions/TransactionItem';
import { useAuth } from '@/hooks/useAuth';
import { useTelegram } from '@/hooks/useTelegram';
import { apiService } from '@/services/api';
import { WeeklySummary, MonthlySummary, Transaction, AccountSummary } from '@shared/types';
import { formatCurrency } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { SubscriptionExpiredModal } from '@/components/subscription/SubscriptionExpiredModal';
import { useLanguage } from '@/providers/I18nProvider';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n';

function PlanBadge({ plan, status, premiumExpiresAt, onExpiredClick }: { plan?: string; status?: string; premiumExpiresAt?: string | null; onExpiredClick?: () => void }) {
  const isPremiumExpired = plan === 'PREMIUM' && premiumExpiresAt && new Date(premiumExpiresAt) < new Date();
  const isExpired = status === 'EXPIRED' || isPremiumExpired;

  if (isExpired) {
    return (
      <button
        onClick={onExpiredClick}
        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 tracking-wide active:scale-95 transition-transform"
      >
        EXPIRED
      </button>
    );
  }
  if (plan === 'LIFETIME') {
    return (
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 tracking-wide">
        ∞ LIFETIME
      </span>
    );
  }
  if (plan === 'PREMIUM') {
    return (
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 tracking-wide">
        PRO
      </span>
    );
  }
  if (status === 'TRIAL') {
    return (
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 tracking-wide">
        TRIAL
      </span>
    );
  }
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-500/20 text-zinc-400 tracking-wide">
      FREE
    </span>
  );
}

function LanguageSheet({
  isOpen,
  onClose,
  current,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  current: string;
  onSelect: (lang: string) => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95] flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="w-full max-w-md bg-card rounded-t-3xl overflow-hidden pb-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-violet-400" />
                <h2 className="text-base font-bold">Language</h2>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="px-5 space-y-2 mt-1">
              {SUPPORTED_LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => { onSelect(lang.code); onClose(); }}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 transition-all ${
                    current === lang.code
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-border bg-secondary'
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="text-left flex-1">
                    <p className={`text-sm font-bold ${current === lang.code ? 'text-violet-400' : ''}`}>
                      {lang.nativeLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">{lang.label}</p>
                  </div>
                  {current === lang.code && (
                    <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface PaymentRecord {
  id: string;
  status: string;
  amount: number;
  plan: string;
  createdAt: string;
  reviewedAt?: string;
}

interface Notification {
  id: string;
  type: 'plan_expired' | 'premium_expired' | 'premium_expiring' | 'payment_pending' | 'payment_approved';
  daysLeft?: number;
  paymentId?: string;
  createdAt?: string;
}

function NotificationsPanel({
  isOpen,
  onClose,
  notifications,
  onUpgrade,
}: {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onUpgrade: () => void;
}) {
  const { t } = useTranslation('common');

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'plan_expired':
      case 'premium_expired':
        return <AlertCircle className="w-5 h-5 text-rose-400" />;
      case 'premium_expiring':
        return <Clock className="w-5 h-5 text-amber-400" />;
      case 'payment_pending':
        return <Clock className="w-5 h-5 text-violet-400" />;
      case 'payment_approved':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
    }
  };

  const getBg = (type: Notification['type']) => {
    switch (type) {
      case 'plan_expired':
      case 'premium_expired':
        return 'bg-rose-500/10 border-rose-500/20';
      case 'premium_expiring':
        return 'bg-amber-500/10 border-amber-500/20';
      case 'payment_pending':
        return 'bg-violet-500/10 border-violet-500/20';
      case 'payment_approved':
        return 'bg-emerald-500/10 border-emerald-500/20';
    }
  };

  const getTitle = (n: Notification) => {
    switch (n.type) {
      case 'plan_expired': return t('notifications.planExpired');
      case 'premium_expired': return t('notifications.premiumExpired');
      case 'premium_expiring': return t('notifications.premiumExpiringSoon');
      case 'payment_pending': return t('notifications.paymentPending');
      case 'payment_approved': return t('notifications.paymentApproved');
    }
  };

  const getDesc = (n: Notification) => {
    switch (n.type) {
      case 'plan_expired': return t('notifications.planExpiredDesc');
      case 'premium_expired': return t('notifications.premiumExpiredDesc');
      case 'premium_expiring': return t('notifications.premiumExpiringSoonDesc', { days: n.daysLeft ?? 0 });
      case 'payment_pending': return t('notifications.paymentPendingDesc');
      case 'payment_approved': return t('notifications.paymentApprovedDesc');
    }
  };

  const isUpgradeType = (type: Notification['type']) =>
    type === 'plan_expired' || type === 'premium_expired' || type === 'premium_expiring';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="w-full max-w-md bg-card rounded-t-3xl overflow-hidden"
            style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-violet-400" />
                <h2 className="text-base font-bold">{t('notifications.title')}</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 px-5 pb-8">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
                    <Bell className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold">{t('notifications.empty')}</p>
                  <p className="text-xs text-muted-foreground">{t('notifications.emptyDesc')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      className={`rounded-2xl border p-4 ${getBg(n.type)}`}
                      onClick={() => {
                        if (isUpgradeType(n.type)) { onClose(); onUpgrade(); }
                      }}
                      style={{ cursor: isUpgradeType(n.type) ? 'pointer' : 'default' }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">{getIcon(n.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold">{getTitle(n)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{getDesc(n)}</p>
                          {isUpgradeType(n.type) && (
                            <p className="text-xs text-violet-400 font-semibold mt-2">{t('notifications.tapToUpgrade')}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function DashboardPage() {
  const { user, isLoading: authLoading, isAuthenticated, error: authError, authenticate } = useAuth();
  const { initData, user: tgUser } = useTelegram();
  const { t } = useTranslation('common');
  const [rawTgDebug, setRawTgDebug] = useState<string>('...');
  const [weekly, setWeekly] = useState<WeeklySummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlySummary | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [accountSummary, setAccountSummary] = useState<AccountSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const { language, changeLanguage, syncFromServer } = useLanguage();

  // Sync language from DB when user loads (respects bot /language changes)
  useEffect(() => {
    if (user?.preferredLanguage) syncFromServer(user.preferredLanguage);
  }, [user?.preferredLanguage]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  const notifications: Notification[] = (() => {
    const list: Notification[] = [];
    if (user) {
      const isPremiumExpired =
        user.plan === 'PREMIUM' && user.premiumExpiresAt && new Date(user.premiumExpiresAt) < new Date();
      const isPlanExpired = user.subscriptionStatus === 'EXPIRED';

      if (isPremiumExpired) {
        list.push({ id: 'premium_expired', type: 'premium_expired' });
      } else if (isPlanExpired) {
        list.push({ id: 'plan_expired', type: 'plan_expired' });
      } else if (user.plan === 'PREMIUM' && user.premiumExpiresAt) {
        const msLeft = new Date(user.premiumExpiresAt).getTime() - Date.now();
        const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
        if (daysLeft <= 7 && daysLeft > 0) {
          list.push({ id: 'premium_expiring', type: 'premium_expiring', daysLeft });
        }
      }
    }
    for (const p of paymentHistory) {
      if (p.status === 'PENDING') {
        list.push({ id: `payment_pending_${p.id}`, type: 'payment_pending', paymentId: p.id, createdAt: p.createdAt });
      } else if (p.status === 'APPROVED') {
        const reviewedAt = p.reviewedAt ? new Date(p.reviewedAt) : null;
        const isRecent = reviewedAt && Date.now() - reviewedAt.getTime() < 7 * 24 * 60 * 60 * 1000;
        if (isRecent) {
          list.push({ id: `payment_approved_${p.id}`, type: 'payment_approved', paymentId: p.id });
        }
      }
    }
    return list;
  })();

  const getGreeting = (): string => {
    const h = new Date().getHours();
    if (h < 12) return t('greeting.morning');
    if (h < 17) return t('greeting.afternoon');
    return t('greeting.evening');
  };

  const loadData = async () => {
    try {
      const [w, m, txns] = await Promise.all([
        apiService.analytics.weekly(),
        apiService.analytics.monthly(),
        apiService.transactions.list({ limit: 5 }),
      ]);
      setWeekly(w);
      setMonthly(m);
      setRecent(txns.data);
    } catch (e) {
      console.error('Dashboard load failed:', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
    // Non-critical — don't let these break the dashboard
    apiService.accounts.summary().then(setAccountSummary).catch(() => {});
    apiService.payments.history().then(setPaymentHistory).catch(() => {});
  };

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    const check = () => {
      const tg = (window as any).Telegram?.WebApp;
      const proxy = !!(window as any).TelegramWebviewProxy;
      const hash = window.location.hash.slice(1);
      const hashParams = new URLSearchParams(hash);
      const tgData = hashParams.get('tgWebAppData');
      const platform = hashParams.get('tgWebAppPlatform') || 'none';
      const hasTgData = hash.includes('tgWebAppData');
      const hasAuthDate = hash.includes('auth_date');
      setRawTgDebug(
        `WebApp: ${tg ? 'OK' : 'NO'} | proxy: ${proxy} | hash: ${hash.length}c | hasTgData: ${hasTgData} | hasAuthDate: ${hasAuthDate} | preview: ${hash.substring(0, 120)}`
      );
    };
    if (document.readyState === 'complete') check();
    else window.addEventListener('load', check, { once: true });
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Re-fetch auth + data when user returns to the app (after bot approval message)
  useEffect(() => {
    if (!isAuthenticated) return;

    const refresh = () => {
      authenticate();
      loadData();
    };

    // Browser/Telegram visibility API
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);

    // Telegram Mini App activated event (fires when user switches back to the app)
    const tgWebApp = (window as any).Telegram?.WebApp;
    if (tgWebApp?.onEvent) {
      tgWebApp.onEvent('activated', refresh);
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      if (tgWebApp?.offEvent) tgWebApp.offEvent('activated', refresh);
    };
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const initials = user
    ? `${user.firstName[0]}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'FG';

  return (
    <div className="min-h-screen bg-background pb-nav">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 overflow-hidden">
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{getGreeting()},</p>
              <div className="flex items-center gap-2">
                <p className="text-base font-bold">{user?.firstName || 'there'}</p>
                {user && <PlanBadge plan={user.plan} status={user.subscriptionStatus} premiumExpiresAt={user.premiumExpiresAt} onExpiredClick={() => setShowUpgradeModal(true)} />}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Language picker */}
            <button
              onClick={() => setShowLanguage(true)}
              className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center"
              title={currentLang.nativeLabel}
            >
              <span className="text-base leading-none">{currentLang.flag}</span>
            </button>

            <button
              onClick={handleRefresh}
              className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center"
            >
              <motion.div
                animate={{ rotate: refreshing ? 360 : 0 }}
                transition={{ repeat: refreshing ? Infinity : 0, duration: 1, ease: 'linear' }}
              >
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </button>

            <button
              onClick={() => setShowNotifications(true)}
              className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center relative"
            >
              <Bell className="w-4 h-4 text-muted-foreground" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                  {notifications.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4 max-w-2xl mx-auto">
        {/* Auth debug panel */}
        {!isAuthenticated && (
          <div className="rounded-2xl bg-secondary border border-border px-4 py-3 text-xs space-y-1">
            <p className="font-bold text-amber-400">Auth debug</p>
            <p className="text-muted-foreground">Error: {authError || 'none'}</p>
            <p className="text-muted-foreground">initData: {initData ? `✅ ${initData.length} chars` : '❌ empty'}</p>
            <p className="text-muted-foreground">initDataUnsafe user: {tgUser ? `✅ id=${tgUser.id}` : '❌ none'}</p>
            <p className="text-muted-foreground">raw: {rawTgDebug}</p>
          </div>
        )}

        {/* Total Net Worth Card */}
        {isLoading ? (
          <div className="h-52 rounded-3xl bg-secondary animate-pulse" />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-3xl p-6 text-white"
            style={{
              background: 'linear-gradient(135deg, #3b1278 0%, #5b21b6 45%, #312e81 100%)',
            }}
          >
            {/* decorative circles */}
            <div className="absolute -right-12 -top-12 w-52 h-52 rounded-full bg-white/5" />
            <div className="absolute -right-6 -bottom-16 w-64 h-64 rounded-full bg-white/5" />

            <div className="relative z-10">
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5">
                {t('home.totalNetWorth')}
              </p>
              <p className="text-3xl sm:text-4xl font-bold tracking-tight mb-5 tabular-nums">
                {formatCurrency(accountSummary?.totalAssets ?? weekly?.netBalance ?? 0)}
              </p>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/10 rounded-2xl p-2.5 sm:p-3 min-w-0">
                  <div className="flex items-center gap-1 mb-1.5">
                    <TrendingUp className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    <span className="text-[9px] text-white/50 font-semibold uppercase truncate">{t('home.income')}</span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-emerald-400 tabular-nums truncate">
                    +{formatCurrency(weekly?.totalIncome ?? 0)}
                  </p>
                </div>
                <div className="bg-white/10 rounded-2xl p-2.5 sm:p-3 min-w-0">
                  <div className="flex items-center gap-1 mb-1.5">
                    <TrendingDown className="w-3 h-3 text-rose-400 flex-shrink-0" />
                    <span className="text-[9px] text-white/50 font-semibold uppercase truncate">{t('home.spent')}</span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-rose-400 tabular-nums truncate">
                    -{formatCurrency(weekly?.totalExpenses ?? 0)}
                  </p>
                </div>
                <div className="bg-white/10 rounded-2xl p-2.5 sm:p-3 min-w-0">
                  <div className="flex items-center gap-1 mb-1.5">
                    <span className="text-[9px] text-white/50 font-semibold uppercase">{t('home.saved')}</span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-violet-300 tabular-nums">{weekly?.savingsRate ?? 0}%</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Account Cards */}
        {accountSummary && accountSummary.accounts.length > 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {t('home.accounts')}
              </p>
              <a href="/accounts" className="text-xs text-violet-400 font-semibold">{t('home.manage')}</a>
            </div>
            <div className={`grid gap-3 ${accountSummary.accounts.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
              {accountSummary.accounts.map((acc) => (
                <a
                  key={acc.id}
                  href="/accounts"
                  className="rounded-2xl bg-card border border-border p-3 sm:p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: acc.color + '33' }}
                    >
                      {acc.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{acc.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{acc.type}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold tabular-nums" style={{ color: acc.color }}>
                    {formatCurrency(acc.balance)}
                  </p>
                </a>
              ))}
            </div>
          </motion.div>
        )}

        {/* This Week + Savings Rate */}
        {weekly && !isLoading && (
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl bg-card border border-border p-4"
            >
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">
                {t('home.thisWeek')}
              </p>
              <p className="text-lg sm:text-xl font-bold text-rose-400 tabular-nums truncate">
                -{formatCurrency(weekly.totalExpenses)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {weekly.transactionCount} {t('home.transactions')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl bg-card border border-border p-4"
            >
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">
                {t('home.savingsRate')}
              </p>
              <p className="text-lg sm:text-xl font-bold text-violet-400 tabular-nums">{weekly.savingsRate}%</p>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {weekly.savingsRate >= 20
                  ? t('home.excellent')
                  : weekly.savingsRate >= 0
                  ? t('home.keepGoing')
                  : t('home.overspending')}
              </p>
            </motion.div>
          </div>
        )}

        {/* Spending by Category */}
        {weekly && !isLoading && weekly.categoryBreakdown.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl bg-card border border-border p-5"
          >
            <h2 className="text-sm font-bold mb-4">{t('home.spendingByCategory')}</h2>
            <CategoryPieChart data={weekly.categoryBreakdown} />
          </motion.div>
        )}

        {/* Recent Transactions */}
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-3xl bg-card border border-border p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold">{t('home.recentTransactions')}</h2>
              <a href="/transactions" className="text-xs text-violet-400 font-semibold">
                {t('home.seeAll')}
              </a>
            </div>
            {recent.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">💳</p>
                <p className="text-sm text-muted-foreground">{t('home.noTransactions')}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('home.noTransactionsHint')}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {recent.map((t, i) => (
                  <TransactionItem key={t.id} transaction={t} index={i} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Monthly Trend */}
        {monthly && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-3xl bg-card border border-border p-5"
          >
            <h2 className="text-sm font-bold mb-4">{t('home.monthlyTrend')}</h2>
            <IncomeExpenseChart data={monthly.weeklyTrends} />
          </motion.div>
        )}
      </div>

      <BottomNav />

      <SubscriptionExpiredModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        plan={user?.plan}
      />

      <NotificationsPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onUpgrade={() => { setShowNotifications(false); setShowUpgradeModal(true); }}
      />

      <LanguageSheet
        isOpen={showLanguage}
        onClose={() => setShowLanguage(false)}
        current={language}
        onSelect={changeLanguage}
      />
    </div>
  );
}
