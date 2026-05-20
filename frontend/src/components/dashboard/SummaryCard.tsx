'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { WeeklySummary } from '@shared/types';

interface SummaryCardProps {
  summary: WeeklySummary;
}

export function SummaryCard({ summary }: SummaryCardProps) {
  const isPositive = summary.netBalance >= 0;
  const TrendIcon = summary.netBalance > 0 ? TrendingUp : summary.netBalance < 0 ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 p-6 text-white shadow-xl shadow-violet-300/30"
    >
      {/* Background decorative circles */}
      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
      <div className="absolute -right-4 -bottom-12 w-56 h-56 rounded-full bg-white/5" />

      <div className="relative z-10">
        <p className="text-sm font-medium text-white/70 mb-1">Net Balance</p>
        <div className="flex items-center gap-2 mb-6">
          <span className="text-4xl font-bold tracking-tight">
            {formatCurrency(Math.abs(summary.netBalance))}
          </span>
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
              isPositive ? 'bg-emerald-400/20 text-emerald-300' : 'bg-rose-400/20 text-rose-300'
            }`}
          >
            <TrendIcon className="w-3 h-3" />
            {summary.savingsRate}%
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded-full bg-emerald-400/30 flex items-center justify-center">
                <TrendingUp className="w-3 h-3 text-emerald-300" />
              </div>
              <span className="text-xs text-white/60">Income</span>
            </div>
            <p className="text-lg font-bold">{formatCurrency(summary.totalIncome)}</p>
          </div>

          <div className="bg-white/10 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded-full bg-rose-400/30 flex items-center justify-center">
                <TrendingDown className="w-3 h-3 text-rose-300" />
              </div>
              <span className="text-xs text-white/60">Expenses</span>
            </div>
            <p className="text-lg font-bold">{formatCurrency(summary.totalExpenses)}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
