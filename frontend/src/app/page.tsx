'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { BottomNav } from '@/components/layout/BottomNav';
import { CategoryPieChart } from '@/components/charts/CategoryPieChart';
import { IncomeExpenseChart } from '@/components/charts/IncomeExpenseChart';
import { TransactionItem } from '@/components/transactions/TransactionItem';
import { useAuth } from '@/hooks/useAuth';
import { useTelegram } from '@/hooks/useTelegram';
import { apiService } from '@/services/api';
import { WeeklySummary, MonthlySummary, Transaction, AccountSummary } from '@shared/types';
import { formatCurrency } from '@/lib/utils';

function PlanBadge({ plan, status, premiumExpiresAt }: { plan?: string; status?: string; premiumExpiresAt?: string | null }) {
  const isPremiumExpired = plan === 'PREMIUM' && premiumExpiresAt && new Date(premiumExpiresAt) < new Date();
  const isExpired = status === 'EXPIRED' || isPremiumExpired;

  if (isExpired) {
    return (
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 tracking-wide">
        EXPIRED
      </span>
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

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { user, isLoading: authLoading, isAuthenticated, error: authError, authenticate } = useAuth();
  const { initData, user: tgUser } = useTelegram();
  const [rawTgDebug, setRawTgDebug] = useState<string>('...');
  const [weekly, setWeekly] = useState<WeeklySummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlySummary | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [accountSummary, setAccountSummary] = useState<AccountSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    // Non-critical — don't let this break the rest of the dashboard
    apiService.accounts.summary().then(setAccountSummary).catch(() => {});
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
                {user && <PlanBadge plan={user.plan} status={user.subscriptionStatus} premiumExpiresAt={user.premiumExpiresAt} />}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
            <button className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center relative">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-violet-500" />
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
                Total Net Worth
              </p>
              <p className="text-3xl sm:text-4xl font-bold tracking-tight mb-5 tabular-nums">
                {formatCurrency(accountSummary?.totalAssets ?? weekly?.netBalance ?? 0)}
              </p>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/10 rounded-2xl p-2.5 sm:p-3 min-w-0">
                  <div className="flex items-center gap-1 mb-1.5">
                    <TrendingUp className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    <span className="text-[9px] text-white/50 font-semibold uppercase truncate">Income</span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-emerald-400 tabular-nums truncate">
                    +{formatCurrency(weekly?.totalIncome ?? 0)}
                  </p>
                </div>
                <div className="bg-white/10 rounded-2xl p-2.5 sm:p-3 min-w-0">
                  <div className="flex items-center gap-1 mb-1.5">
                    <TrendingDown className="w-3 h-3 text-rose-400 flex-shrink-0" />
                    <span className="text-[9px] text-white/50 font-semibold uppercase truncate">Spent</span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-rose-400 tabular-nums truncate">
                    -{formatCurrency(weekly?.totalExpenses ?? 0)}
                  </p>
                </div>
                <div className="bg-white/10 rounded-2xl p-2.5 sm:p-3 min-w-0">
                  <div className="flex items-center gap-1 mb-1.5">
                    <span className="text-[9px] text-white/50 font-semibold uppercase">Saved</span>
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
                Accounts
              </p>
              <a href="/accounts" className="text-xs text-violet-400 font-semibold">Manage →</a>
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
                This Week
              </p>
              <p className="text-lg sm:text-xl font-bold text-rose-400 tabular-nums truncate">
                -{formatCurrency(weekly.totalExpenses)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {weekly.transactionCount} transactions
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl bg-card border border-border p-4"
            >
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">
                Savings Rate
              </p>
              <p className="text-lg sm:text-xl font-bold text-violet-400 tabular-nums">{weekly.savingsRate}%</p>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {weekly.savingsRate >= 20
                  ? 'Excellent!'
                  : weekly.savingsRate >= 0
                  ? 'Keep going!'
                  : 'Overspending'}
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
            <h2 className="text-sm font-bold mb-4">Spending by Category</h2>
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
              <h2 className="text-sm font-bold">Recent Transactions</h2>
              <a href="/transactions" className="text-xs text-violet-400 font-semibold">
                See all →
              </a>
            </div>
            {recent.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">💳</p>
                <p className="text-sm text-muted-foreground">No transactions yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add your first expense or income!
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
            <h2 className="text-sm font-bold mb-4">Monthly Trend</h2>
            <IncomeExpenseChart data={monthly.weeklyTrends} />
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
