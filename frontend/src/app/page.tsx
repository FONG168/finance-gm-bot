'use client';

import '@/lib/i18n';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, RefreshCw, TrendingUp, TrendingDown, X, AlertCircle, CheckCircle, Clock, Globe, Eye, EyeOff, ArrowUpRight, PiggyBank, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
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
import { useToast } from '@/providers/ToastProvider';

const MONTH_NAMES_FULL: Record<string, string[]> = {
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  km: ['មករា','កុម្ភៈ','មីនា','មេសា','ឧសភា','មិថុនា','កក្កដា','សីហា','កញ្ញា','តុលា','វិច្ឆិកា','ធ្នូ'],
  zh: ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'],
};

function formatMonthTitle(month: number, year: number, lang: string) {
  const names = MONTH_NAMES_FULL[lang] ?? MONTH_NAMES_FULL.en;
  return `${names[month - 1]} ${year}`;
}

function PlanBadge({ plan, status, premiumExpiresAt, onExpiredClick }: { plan?: string; status?: string; premiumExpiresAt?: string | null; onExpiredClick?: () => void }) {
  const isPremiumExpired = plan === 'PREMIUM' && premiumExpiresAt && new Date(premiumExpiresAt) < new Date();
  const isExpired = status === 'EXPIRED' || isPremiumExpired;

  if (isExpired) {
    return (
      <button
        onClick={onExpiredClick}
        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-600 tracking-wide active:scale-95 transition-transform"
      >
        EXPIRED
      </button>
    );
  }
  if (plan === 'LIFETIME') {
    return (
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-700 tracking-wide">
        ∞ LIFETIME
      </span>
    );
  }
  if (plan === 'PREMIUM') {
    return (
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-700 tracking-wide">
        PRO
      </span>
    );
  }
  if (status === 'TRIAL') {
    return (
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-700 tracking-wide">
        TRIAL
      </span>
    );
  }
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-500/20 text-zinc-600 tracking-wide">
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
  const { t } = useTranslation('common');
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
                <Globe className="w-4 h-4 text-violet-600" />
                <h2 className="text-base font-bold">{t('settings.language')}</h2>
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
                    <p className={`text-sm font-bold ${current === lang.code ? 'text-violet-700' : ''}`}>
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
        return <AlertCircle className="w-5 h-5 text-rose-600" />;
      case 'premium_expiring':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'payment_pending':
        return <Clock className="w-5 h-5 text-violet-600" />;
      case 'payment_approved':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
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
                <Bell className="w-4 h-4 text-violet-600" />
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
                            <p className="text-xs text-violet-700 font-semibold mt-2">{t('notifications.tapToUpgrade')}</p>
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
  const toast = useToast();
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
  const [hideBalance, setHideBalance] = useState(false);
  const { language, changeLanguage, syncFromServer } = useLanguage();

  // Persist balance-visibility preference across sessions
  useEffect(() => {
    const saved = localStorage.getItem('hideBalance');
    if (saved === '1') setHideBalance(true);
  }, []);
  const toggleHideBalance = () => {
    setHideBalance(prev => {
      localStorage.setItem('hideBalance', !prev ? '1' : '0');
      return !prev;
    });
  };

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

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const handleMonthPrev = async () => {
    let newM = selectedMonth - 1;
    let newY = selectedYear;
    if (newM < 1) {
      newM = 12;
      newY -= 1;
    }
    setSelectedMonth(newM);
    setSelectedYear(newY);
    try {
      const m = await apiService.analytics.monthly(newM, newY);
      setMonthly(m);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMonthNext = async () => {
    const now = new Date();
    const currentM = now.getMonth() + 1;
    const currentY = now.getFullYear();
    if (selectedYear > currentY || (selectedYear === currentY && selectedMonth >= currentM)) {
      return;
    }
    let newM = selectedMonth + 1;
    let newY = selectedYear;
    if (newM > 12) {
      newM = 1;
      newY += 1;
    }
    setSelectedMonth(newM);
    setSelectedYear(newY);
    try {
      const m = await apiService.analytics.monthly(newM, newY);
      setMonthly(m);
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async (isInitial = false) => {
    if (isInitial && !weekly) setIsLoading(true);
    try {
      const [w, m, r] = await Promise.all([
        apiService.analytics.weekly(),
        apiService.analytics.monthly(selectedMonth, selectedYear),
        apiService.transactions.list({ limit: 10 }),
      ]);
      setWeekly(w);
      setMonthly(m);
      setRecent(r.data);
    } catch (e: any) {
      console.error('Error loading dashboard data:', e);
      toast.error(t('common.loadFailed'));
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
      loadData(true);
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
    loadData(false);
  };

  // Re-fetch auth + data when user returns to the app (after bot approval message)
  useEffect(() => {
    if (!isAuthenticated) return;

    const refresh = () => {
      loadData(false);
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
            <p className="font-bold text-amber-600">Auth debug</p>
            <p className="text-muted-foreground">Error: {authError || 'none'}</p>
            <p className="text-muted-foreground">initData: {initData ? `✅ ${initData.length} chars` : '❌ empty'}</p>
            <p className="text-muted-foreground">initDataUnsafe user: {tgUser ? `✅ id=${tgUser.id}` : '❌ none'}</p>
            <p className="text-muted-foreground">raw: {rawTgDebug}</p>
          </div>
        )}

        {/* Total Net Worth Hero Card */}
        {isLoading ? (
          <div className="h-52 rounded-3xl bg-secondary/40 animate-pulse border border-border" />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden p-6 text-white hero-card-decor"
          >
            <div className="hero-card-sheen" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-bold text-lime-100/70 uppercase tracking-widest">
                  {t('home.totalNetWorth')}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-black/30 text-white border border-white/15 tracking-wide backdrop-blur-sm">
                    {t('home.liveBalance')}
                  </span>
                  <button
                    onClick={toggleHideBalance}
                    className="w-6 h-6 rounded-full bg-black/25 flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
                    aria-label={hideBalance ? 'Show balance' : 'Hide balance'}
                  >
                    {hideBalance ? (
                      <EyeOff className="w-3 h-3 text-white/80" />
                    ) : (
                      <Eye className="w-3 h-3 text-white/80" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-end gap-2.5 mb-5">
                <p
                  className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-white"
                  style={{ textShadow: '0 2px 12px rgba(0,0,0,0.35)' }}
                >
                  {hideBalance ? '••••••' : formatCurrency(accountSummary?.totalAssets ?? weekly?.netBalance ?? 0)}
                </p>
                {!hideBalance && weekly && (
                  <span
                    className={`mb-1.5 flex items-center gap-0.5 text-[11px] font-bold ${
                      (weekly.netBalance ?? 0) >= 0 ? 'text-lime-300' : 'text-rose-300'
                    }`}
                  >
                    {(weekly.netBalance ?? 0) >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {formatCurrency(Math.abs(weekly.netBalance ?? 0))}
                  </span>
                )}
              </div>

              <div className="flex gap-2.5">
                <a
                  href="/add?type=income"
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-full bg-black/70 backdrop-blur-sm border border-white/10 text-white text-xs font-bold active:scale-95 transition-transform shadow-sm"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  {t('home.income')}
                </a>
                <a
                  href="/add?type=expense"
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-full bg-white text-zinc-900 text-xs font-bold active:scale-95 transition-transform shadow-sm"
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  {t('home.spent')}
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {/* Monthly Selector & Income/Expenses stat cards */}
        {!isLoading && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between bg-secondary/80 rounded-2xl px-3.5 py-2 border border-border/40">
              <button
                onClick={handleMonthPrev}
                className="w-7 h-7 rounded-xl bg-card border border-border flex items-center justify-center text-foreground font-bold active:scale-90 transition-transform shadow-xs"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4 text-foreground" />
              </button>

              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-violet-500" />
                <span className="text-xs font-extrabold tracking-tight text-foreground">
                  {formatMonthTitle(selectedMonth, selectedYear, language)}
                </span>
                {selectedMonth === new Date().getMonth() + 1 && selectedYear === new Date().getFullYear() && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-600">
                    Current
                  </span>
                )}
              </div>

              <button
                onClick={handleMonthNext}
                disabled={selectedMonth === new Date().getMonth() + 1 && selectedYear === new Date().getFullYear()}
                className={`w-7 h-7 rounded-xl bg-card border border-border flex items-center justify-center font-bold transition-transform shadow-xs ${
                  selectedMonth === new Date().getMonth() + 1 && selectedYear === new Date().getFullYear()
                    ? 'opacity-30 cursor-not-allowed'
                    : 'text-foreground active:scale-90'
                }`}
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4 text-foreground" />
              </button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="grid grid-cols-2 gap-2.5"
            >
              <a
                href={`/transactions?type=income`}
                className="bg-secondary rounded-3xl p-4 flex flex-col gap-3 shadow-sm active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4.5 h-4.5 text-emerald-600" />
                  </span>
                  <span className="w-8 h-8 rounded-full bg-card flex items-center justify-center flex-shrink-0">
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-semibold">{t('home.income')}</p>
                  <p className="font-rounded text-lg font-extrabold tabular-nums text-foreground truncate">
                    {hideBalance ? '••••' : `+${formatCurrency(monthly?.totalIncome ?? 0)}`}
                  </p>
                </div>
              </a>
              <a
                href={`/transactions?type=expense`}
                className="bg-secondary rounded-3xl p-4 flex flex-col gap-3 shadow-sm active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-full bg-rose-500/15 flex items-center justify-center flex-shrink-0">
                    <TrendingDown className="w-4.5 h-4.5 text-rose-600" />
                  </span>
                  <span className="w-8 h-8 rounded-full bg-card flex items-center justify-center flex-shrink-0">
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-semibold">{t('home.spent')}</p>
                  <p className="font-rounded text-lg font-extrabold tabular-nums text-foreground truncate">
                    {hideBalance ? '••••' : `-${formatCurrency(monthly?.totalExpenses ?? 0)}`}
                  </p>
                </div>
              </a>
            </motion.div>
          </div>
        )}

        {/* Quick Action Buttons (Revolut / Fintech Style) */}
        {!isLoading && (
          <div className="grid grid-cols-3 gap-2 py-1">
            <a href="/reports" className="flex flex-col items-center gap-1.5 group">
              <div className="w-12 h-12 rounded-2xl bg-card border border-border hover:border-violet-300 text-foreground flex items-center justify-center shadow-sm active:scale-95 transition-all">
                <TrendingUp className="w-5 h-5 text-cyan-500" />
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground">{t('home.analytics')}</span>
            </a>

            <a href="/accounts" className="flex flex-col items-center gap-1.5 group">
              <div className="w-12 h-12 rounded-2xl bg-card border border-border hover:border-violet-300 text-foreground flex items-center justify-center shadow-sm active:scale-95 transition-all">
                <Clock className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground">{t('home.accounts')}</span>
            </a>

            <a href="/transactions" className="flex flex-col items-center gap-1.5 group">
              <div className="w-12 h-12 rounded-2xl bg-card border border-border hover:border-violet-300 text-foreground flex items-center justify-center shadow-sm active:scale-95 transition-all">
                <Bell className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground">{t('home.history')}</span>
            </a>
          </div>
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
              <a href="/accounts" className="text-xs text-violet-600 font-semibold">{t('home.manage')}</a>
            </div>
            <div className="space-y-2.5">
              {Array.from(
                { length: Math.ceil(accountSummary.accounts.length / 2) },
                (_, row) => accountSummary.accounts.slice(row * 2, row * 2 + 2)
              ).map((pair, i) => (
                <div
                  key={i}
                  className={`blob-wrap !bg-secondary grid overflow-hidden ${
                    pair.length === 1 ? 'grid-cols-1' : 'grid-cols-2 divide-x divide-border/60'
                  }`}
                >
                  {pair.map((acc) => (
                    <a
                      key={acc.id}
                      href="/accounts"
                      className="p-5 flex flex-col gap-4 active:bg-card/60 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-11 h-11 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                            style={{ backgroundColor: acc.color + '1f' }}
                          >
                            {acc.icon}
                          </span>
                          <span className="text-xs font-semibold leading-tight">{acc.name}</span>
                        </div>
                        <span className="w-9 h-9 rounded-full bg-card flex items-center justify-center flex-shrink-0">
                          <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-rounded text-lg font-extrabold tabular-nums text-foreground truncate">
                          {formatCurrency(acc.balance)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 capitalize">{acc.type}</p>
                      </div>
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* This Week + Savings Rate */}
        {weekly && !isLoading && (
          <div className="blob-wrap !bg-secondary grid grid-cols-2 divide-x divide-border/60 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-5 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${weekly.netBalance >= 0 ? 'bg-emerald-500/15' : 'bg-rose-500/15'}`}>
                    {weekly.netBalance >= 0 ? (
                      <TrendingUp className="w-4.5 h-4.5 text-emerald-600" />
                    ) : (
                      <TrendingDown className="w-4.5 h-4.5 text-rose-600" />
                    )}
                  </span>
                  <span className="text-xs font-semibold leading-tight">{t('home.netThisWeek')}</span>
                </div>
                <span className="w-9 h-9 rounded-full bg-card flex items-center justify-center flex-shrink-0">
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                </span>
              </div>
              <div>
                <p className={`font-rounded text-lg sm:text-xl font-extrabold tabular-nums truncate ${weekly.netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {weekly.netBalance >= 0 ? '+' : '-'}{formatCurrency(Math.abs(weekly.netBalance))}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {weekly.transactionCount} {t('home.transactions')}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="p-5 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-11 h-11 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                    <PiggyBank className="w-4.5 h-4.5 text-amber-600" />
                  </span>
                  <span className="text-xs font-semibold leading-tight">{t('home.savingsRate')}</span>
                </div>
                <span className="w-9 h-9 rounded-full bg-card flex items-center justify-center flex-shrink-0">
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                </span>
              </div>
              <div>
                <p className="font-rounded text-lg sm:text-xl font-extrabold tabular-nums text-foreground">{weekly.savingsRate}%</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {weekly.savingsRate >= 20
                    ? t('home.excellent')
                    : weekly.savingsRate >= 0
                    ? t('home.keepGoing')
                    : t('home.overspending')}
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Spending by Category */}
        {weekly && !isLoading && weekly.categoryBreakdown.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl glass-card p-5"
          >
            <h2 className="text-sm font-bold mb-4 gradient-text">{t('home.spendingByCategory')}</h2>
            <CategoryPieChart data={weekly.categoryBreakdown} />
          </motion.div>
        )}

        {/* Recent Transactions */}
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-3xl glass-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold">{t('home.recentTransactions')}</h2>
              <a href="/transactions" className="text-xs text-violet-600 font-semibold hover:underline">
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
              <div className="divide-y divide-border">
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
            className="rounded-3xl glass-card p-5"
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
