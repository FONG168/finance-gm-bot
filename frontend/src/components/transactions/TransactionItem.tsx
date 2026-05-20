'use client';

import { motion } from 'framer-motion';
import { Trash2, Pencil } from 'lucide-react';
import { Transaction } from '@shared/types';
import { formatCurrency, formatRelativeDate, formatTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface TransactionItemProps {
  transaction: Transaction;
  onEdit?: (t: Transaction) => void;
  onDelete?: (id: string) => void;
  index?: number;
}

export function TransactionItem({ transaction, onEdit, onDelete, index = 0 }: TransactionItemProps) {
  const cat = transaction.category;
  const isIncome = transaction.type === 'income';

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex items-center gap-3 py-3 px-1"
    >
      {/* Category icon */}
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ backgroundColor: `${cat?.color}20` }}
      >
        {cat?.icon || '📦'}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">
          {transaction.note || cat?.label || 'Transaction'}
        </p>
        <p className="text-xs text-muted-foreground">
          {cat?.label} · {formatRelativeDate(transaction.date)}, {formatTime(transaction.date)}
        </p>
      </div>

      {/* Amount + actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <p className={cn('font-bold text-sm tabular-nums', isIncome ? 'amount-income' : 'amount-expense')}>
          {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
        </p>

        {(onEdit || onDelete) && (
          <div className="flex gap-1">
            {onEdit && (
              <button
                onClick={() => onEdit(transaction)}
                className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center active:scale-90 transition-transform"
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(transaction.id)}
                className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center active:scale-90 transition-transform"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
