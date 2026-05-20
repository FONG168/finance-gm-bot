'use client';

import { motion } from 'framer-motion';
import { PiggyBank, ShoppingBag, Receipt } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { WeeklySummary } from '@shared/types';

interface QuickStatsProps {
  summary: WeeklySummary;
}

const stats = (summary: WeeklySummary) => [
  {
    label: 'Savings Rate',
    value: `${summary.savingsRate}%`,
    icon: PiggyBank,
    color: 'bg-emerald-50 dark:bg-emerald-950',
    iconColor: 'text-emerald-600',
    subtext: summary.savingsRate >= 20 ? 'Great job! 🎉' : summary.savingsRate >= 0 ? 'Keep going!' : 'Overspending',
  },
  {
    label: 'Top Category',
    value: summary.topCategory,
    icon: ShoppingBag,
    color: 'bg-violet-50 dark:bg-violet-950',
    iconColor: 'text-violet-600',
    subtext: summary.categoryBreakdown[0]
      ? formatCurrency(summary.categoryBreakdown[0].amount)
      : 'No expenses',
  },
  {
    label: 'Transactions',
    value: String(summary.transactionCount),
    icon: Receipt,
    color: 'bg-blue-50 dark:bg-blue-950',
    iconColor: 'text-blue-600',
    subtext: 'This week',
  },
];

export function QuickStats({ summary }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {stats(summary).map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            className={`rounded-2xl p-3 ${stat.color}`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 bg-white dark:bg-gray-900`}>
              <Icon className={`w-4 h-4 ${stat.iconColor}`} />
            </div>
            <p className="text-base font-bold leading-tight">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
            <p className="text-[10px] text-muted-foreground">{stat.subtext}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
