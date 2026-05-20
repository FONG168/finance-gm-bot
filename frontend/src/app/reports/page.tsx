'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BottomNav } from '@/components/layout/BottomNav';
import { IncomeExpenseChart } from '@/components/charts/IncomeExpenseChart';
import { CategoryPieChart } from '@/components/charts/CategoryPieChart';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api';
import { MonthlySummary } from '@shared/types';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export default function ReportsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [reports, setReports] = useState<MonthlySummary[]>([]);
  const [selected, setSelected] = useState<MonthlySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { setIsLoading(false); return; }
    apiService.analytics
      .reports('monthly', 6)
      .then((data) => {
        const list = data as MonthlySummary[];
        setReports(list);
        if (list.length > 0) setSelected(list[0]);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, authLoading]);

  return (
    <div className="min-h-screen bg-background pb-nav">
      <div className="px-4 pt-5 pb-3 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold">Reports</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Your spending analysis</p>
      </div>

      <div className="px-4 max-w-2xl mx-auto space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-7 h-7 rounded-full border-2 border-violet-500 border-t-transparent"
            />
          </div>
        ) : (
          <>
            {/* Month selector */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {reports.map((r) => (
                <button
                  key={`${r.year}-${r.month}`}
                  onClick={() => setSelected(r)}
                  className={cn(
                    'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                    selected?.month === r.month && selected?.year === r.year
                      ? 'bg-violet-600 text-white'
                      : 'bg-secondary text-muted-foreground',
                  )}
                >
                  {MONTHS[r.month - 1]} {r.year}
                </button>
              ))}
            </div>

            {selected && (
              <>
                {/* Summary stats */}
                <motion.div
                  key={`${selected.year}-${selected.month}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-3 gap-2 sm:gap-3"
                >
                  {[
                    { label: 'Income', value: selected.totalIncome, emoji: '💰', color: 'text-emerald-400' },
                    { label: 'Expenses', value: selected.totalExpenses, emoji: '💸', color: 'text-rose-400' },
                    { label: 'Saved', value: Math.max(0, selected.netBalance), emoji: '🏦', color: 'text-violet-400' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl bg-card border border-border p-3 text-center">
                      <p className="text-xl mb-1">{s.emoji}</p>
                      <p className={`text-sm font-bold tabular-nums truncate ${s.color}`}>{formatCurrency(s.value)}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </motion.div>

                {/* Savings rate */}
                <div
                  className={cn(
                    'rounded-2xl border p-4 flex items-center gap-3',
                    selected.savingsRate >= 20
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : selected.savingsRate >= 0
                      ? 'border-amber-500/30 bg-amber-500/10'
                      : 'border-rose-500/30 bg-rose-500/10',
                  )}
                >
                  <span className="text-3xl">
                    {selected.savingsRate >= 20 ? '🎉' : selected.savingsRate >= 0 ? '📊' : '⚠️'}
                  </span>
                  <div>
                    <p className="font-bold text-base">{selected.savingsRate}% Savings Rate</p>
                    <p className="text-xs text-muted-foreground">
                      {selected.savingsRate >= 20
                        ? 'Excellent! You saved well this month.'
                        : selected.savingsRate >= 0
                        ? 'You broke even. Try to save more next month.'
                        : 'You spent more than you earned this month.'}
                    </p>
                  </div>
                </div>

                {/* Weekly trends */}
                <div className="rounded-3xl bg-card border border-border p-5">
                  <h2 className="text-sm font-bold mb-4">Weekly Trends</h2>
                  <IncomeExpenseChart data={selected.weeklyTrends} />
                </div>

                {/* Category breakdown */}
                <div className="rounded-3xl bg-card border border-border p-5">
                  <h2 className="text-sm font-bold mb-4">Spending by Category</h2>
                  <CategoryPieChart data={selected.categoryBreakdown} />
                </div>
              </>
            )}

            {reports.length === 0 && (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">📊</p>
                <p className="text-sm text-muted-foreground">No reports yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start adding transactions to see monthly reports.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
