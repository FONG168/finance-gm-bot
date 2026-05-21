'use client';

import '@/lib/i18n';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Check, Trash2, Pencil } from 'lucide-react';
import { BottomNav } from '@/components/layout/BottomNav';
import { TransactionItem } from '@/components/transactions/TransactionItem';
import { useAuth } from '@/hooks/useAuth';
import { useTelegram } from '@/hooks/useTelegram';
import { apiService } from '@/services/api';
import { Transaction, CATEGORIES, TransactionType } from '@shared/types';
import { formatDate, formatCurrency, formatTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

type FilterType = 'all' | 'income' | 'expense';

const EXPENSE_CATS = CATEGORIES.filter((c) => c.type === 'expense' || c.type === 'both');
const INCOME_CATS = CATEGORIES.filter((c) => c.type === 'income' || c.type === 'both');

function groupByDate(transactions: Transaction[]): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const key = formatDate(t.date, { weekday: 'long', month: 'short', day: 'numeric' });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }
  return groups;
}

// ── Delete confirmation popup ─────────────────────────────────────────────────
function DeleteConfirmModal({
  transaction, onConfirm, onCancel, isLoading,
}: {
  transaction: Transaction; onConfirm: () => void; onCancel: () => void; isLoading: boolean;
}) {
  const { t } = useTranslation('common');
  const cat = CATEGORIES.find((c) => c.id === transaction.categoryId);
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center px-5"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="w-full max-w-sm bg-card rounded-3xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center gap-3 mb-5">
          <div className="w-14 h-14 rounded-full bg-rose-500/20 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-rose-400" />
          </div>
          <h3 className="text-base font-bold">{t('transactions.deleteTransaction')}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('transactions.deleteWarning')}
          </p>
        </div>

        {/* Transaction summary */}
        <div className="rounded-2xl bg-secondary p-3 mb-5 flex items-center gap-3">
          <span className="text-2xl flex-shrink-0">{cat?.icon || '📦'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{transaction.note || (cat ? t(`categories.${cat.name}`) : t('categories.other'))}</p>
            <p className="text-xs text-muted-foreground">{cat ? t(`categories.${cat.name}`) : ''}</p>
          </div>
          <p className={cn('text-sm font-bold tabular-nums flex-shrink-0', transaction.type === 'income' ? 'text-emerald-400' : 'text-rose-400')}>
            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl bg-secondary text-sm font-semibold text-muted-foreground"
          >
            {t('transactions.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3 rounded-2xl bg-rose-500 text-white text-sm font-bold flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <><Trash2 className="w-4 h-4" />{t('transactions.delete')}</>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Edit transaction modal ────────────────────────────────────────────────────
function EditTransactionModal({
  transaction, onSaved, onCancel,
}: {
  transaction: Transaction; onSaved: () => void; onCancel: () => void;
}) {
  const { haptic } = useTelegram();
  const { t } = useTranslation('common');
  const [type, setType] = useState<TransactionType>(transaction.type as TransactionType);
  const [amount, setAmount] = useState(String(transaction.amount));
  const [categoryId, setCategoryId] = useState(transaction.categoryId);
  const [note, setNote] = useState(transaction.note || '');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const categories = type === 'expense' ? EXPENSE_CATS : INCOME_CATS;
  const amountColor = type === 'expense' ? '#ef4444' : '#22c55e';
  const cat = CATEGORIES.find((c) => c.id === categoryId);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await apiService.transactions.update(transaction.id, {
        amount: parseFloat(amount),
        type,
        categoryId,
        note: note.trim() || undefined,
      });
      haptic.success();
      setShowConfirm(false);
      onSaved();
    } catch (err: any) {
      haptic.error();
      alert(err.message || 'Failed to update transaction');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-black/70 flex items-end sm:items-center sm:justify-center sm:px-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full max-w-lg mx-auto bg-card rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3 flex-shrink-0">
          <h2 className="text-base font-bold">{t('transactions.editTransaction')}</h2>
          <button onClick={onCancel} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable form */}
        <div className="overflow-y-auto flex-1 px-5 pb-safe space-y-4">
          {/* Type toggle */}
          <div className="flex rounded-2xl bg-secondary p-1 gap-1">
            {(['expense', 'income'] as TransactionType[]).map((tp) => (
              <button
                key={tp}
                onClick={() => { setType(tp); setCategoryId(''); haptic.selection(); }}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  type === tp
                    ? tp === 'expense' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                    : 'text-muted-foreground',
                )}
              >
                {tp === 'expense' ? `💸 ${t('add.expense')}` : `💰 ${t('add.income')}`}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div className="text-center py-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('add.amount')}</p>
            <div className="flex items-center justify-center gap-1">
              <span className="text-4xl font-bold flex-shrink-0" style={{ color: amountColor }}>$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="text-4xl font-bold bg-transparent outline-none placeholder:text-muted-foreground/25 w-full max-w-[180px] text-center"
                style={{ color: amountColor }}
                inputMode="decimal"
              />
            </div>
          </div>

          {/* Category grid */}
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('transactions.category')}</p>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setCategoryId(c.id); haptic.selection(); }}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2.5 rounded-2xl border-2 transition-all',
                    categoryId === c.id ? 'border-violet-500 bg-violet-500/15' : 'border-transparent bg-secondary',
                  )}
                >
                  <span className="text-xl">{c.icon}</span>
                  <span className={cn('text-[9px] font-medium text-center leading-tight', categoryId === c.id ? 'text-violet-400' : 'text-muted-foreground')}>
                    {t(`categories.${c.name}`)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="bg-secondary rounded-2xl p-4">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">{t('add.noteOptional')}</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('add.noteHint')}
              className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground/40"
              maxLength={100}
            />
          </div>

          {/* Save button */}
          <button
            onClick={() => setShowConfirm(true)}
            disabled={!amount || !categoryId}
            className="w-full h-12 rounded-2xl text-sm font-bold text-white disabled:opacity-40 flex items-center justify-center gap-2 mb-4"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
          >
            <Check className="w-4 h-4" />
            {t('transactions.saveChanges')}
          </button>
        </div>
      </motion.div>

      {/* Confirm edit popup */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center px-5"
            style={{ background: 'rgba(0,0,0,0.75)' }}
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="w-full max-w-sm bg-card rounded-3xl p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center gap-2 mb-5">
                <span className="text-3xl">{cat?.icon || '📦'}</span>
                <h3 className="text-base font-bold">{t('transactions.saveChangesQ')}</h3>
                <p className="text-xs text-muted-foreground">
                  Update this transaction to{' '}
                  <span style={{ color: type === 'expense' ? '#ef4444' : '#22c55e' }} className="font-bold">
                    {type === 'expense' ? '-' : '+'}{formatCurrency(parseFloat(amount) || 0)}
                  </span>
                  {' '}· {cat ? t(`categories.${cat.name}`) : t('categories.other')}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 rounded-2xl bg-secondary text-sm font-semibold text-muted-foreground"
                >
                  {t('transactions.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <><Check className="w-4 h-4" />{t('transactions.confirm')}</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TransactionsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { haptic } = useTelegram();
  const { t } = useTranslation('common');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(
    async (reset = false) => {
      const currentPage = reset ? 1 : page;
      try {
        const res = await apiService.transactions.list({
          page: currentPage,
          limit: 20,
          type: filter === 'all' ? undefined : filter,
        });
        setTransactions((prev) => (reset ? res.data : [...prev, ...res.data]));
        setHasMore(res.hasMore);
        if (!reset) setPage((p) => p + 1);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [filter, page],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { setIsLoading(false); return; }
    setPage(1);
    setIsLoading(true);
    load(true);
  }, [filter, isAuthenticated, authLoading]);

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await apiService.transactions.delete(pendingDelete.id);
      haptic.success();
      setTransactions((prev) => prev.filter((t) => t.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err: any) {
      haptic.error();
      alert(err.message || 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSaved = () => {
    setEditingTransaction(null);
    setPage(1);
    setIsLoading(true);
    load(true);
  };

  const filtered = transactions.filter((tr) => {
    if (!search) return true;
    return (
      tr.note?.toLowerCase().includes(search.toLowerCase()) ||
      tr.category?.label.toLowerCase().includes(search.toLowerCase())
    );
  });

  const grouped = groupByDate(filtered);

  return (
    <div className="min-h-screen bg-background pb-nav">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 max-w-2xl mx-auto space-y-3">
        <div>
          <h1 className="text-xl font-bold">{t('transactions.title')}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{t('transactions.subtitle')}</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('transactions.search')}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-secondary text-sm outline-none placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(['all', 'expense', 'income'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all',
                filter === f ? 'bg-violet-600 text-white' : 'bg-secondary text-muted-foreground',
              )}
            >
              {f === 'all' ? t('transactions.all') : f === 'expense' ? `💸 ${t('transactions.expenses')}` : `💰 ${t('transactions.income')}`}
            </button>
          ))}
        </div>
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
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-muted-foreground text-sm">{t('transactions.notFound')}</p>
          </div>
        ) : (
          <>
            {Array.from(grouped.entries()).map(([date, txns]) => (
              <div key={date}>
                <p className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-widest">
                  {date}
                </p>
                <div className="rounded-2xl bg-card border border-border divide-y divide-border/50 overflow-hidden">
                  {txns.map((tr, i) => (
                    <div key={tr.id} className="px-3">
                      <TransactionItem
                        transaction={tr}
                        onClick={(tx) => { haptic.selection(); setViewingTransaction(tx); }}
                        onEdit={(tx) => { haptic.selection(); setEditingTransaction(tx); }}
                        onDelete={(id) => { haptic.selection(); setPendingDelete(transactions.find((tx) => tx.id === id) || null); }}
                        index={i}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {hasMore && (
              <button
                onClick={() => load(false)}
                className="w-full py-3 text-sm text-violet-400 font-semibold"
              >
                {t('transactions.loadMore')}
              </button>
            )}
          </>
        )}
      </div>

      <BottomNav />

      {/* Delete confirmation */}
      <AnimatePresence>
        {pendingDelete && (
          <DeleteConfirmModal
            transaction={pendingDelete}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setPendingDelete(null)}
            isLoading={isDeleting}
          />
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {editingTransaction && (
          <EditTransactionModal
            transaction={editingTransaction}
            onSaved={handleEditSaved}
            onCancel={() => setEditingTransaction(null)}
          />
        )}
      </AnimatePresence>

      {/* Transaction detail sheet */}
      <AnimatePresence>
        {viewingTransaction && (
          <TransactionDetailSheet
            transaction={viewingTransaction}
            onClose={() => setViewingTransaction(null)}
            onEdit={(tx) => { setViewingTransaction(null); setEditingTransaction(tx); }}
            onDelete={(tx) => { setViewingTransaction(null); setPendingDelete(tx); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Transaction Detail Sheet ──────────────────────────────────────────────────
function TransactionDetailSheet({
  transaction, onClose, onEdit, onDelete,
}: {
  transaction: Transaction;
  onClose: () => void;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
}) {
  const { t } = useTranslation('common');
  const cat = CATEGORIES.find((c) => c.id === transaction.categoryId) || transaction.category;
  const isIncome =
    transaction.type === 'income' ||
    (transaction.type === 'transfer' && (transaction.note?.startsWith('Transfer from') ?? false));
  const catLabel = cat ? t(`categories.${cat.name}`, { defaultValue: cat.label }) : '';
  const typeLabel = transaction.type === 'transfer'
    ? t('common.transfer', { defaultValue: 'Transfer' })
    : isIncome
    ? t('transactions.income', { defaultValue: 'Income' })
    : t('transactions.expenses', { defaultValue: 'Expense' });

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-black/60 flex items-end sm:items-center sm:justify-center sm:px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full max-w-lg mx-auto bg-card rounded-t-3xl sm:rounded-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Colored top banner */}
        <div
          className="px-6 pt-8 pb-6 flex flex-col items-center text-center"
          style={{ backgroundColor: `${cat?.color}18` }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-3"
            style={{ backgroundColor: `${cat?.color}30` }}
          >
            {cat?.icon || '📦'}
          </div>
          <p className={`text-3xl font-bold tabular-nums mb-1 ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
          </p>
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: `${cat?.color}25`, color: cat?.color }}>
            {typeLabel}
          </span>
        </div>

        {/* Details list */}
        <div className="px-6 py-4 space-y-3">
          <DetailRow label={t('add.category', { defaultValue: 'Category' })} value={`${cat?.icon || ''} ${catLabel}`} />
          <DetailRow label={t('add.date', { defaultValue: 'Date' })} value={formatDate(transaction.date, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} />
          <DetailRow label={t('add.time', { defaultValue: 'Time' })} value={formatTime(transaction.date)} />
          {transaction.note && <DetailRow label={t('add.note', { defaultValue: 'Note' })} value={transaction.note} />}
          {transaction.account && <DetailRow label={t('accounts.title', { defaultValue: 'Account' })} value={`${transaction.account.icon} ${transaction.account.name}`} />}
        </div>

        {/* Action buttons */}
        <div className="px-6 pb-safe flex gap-3" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 20px)' }}>
          <button
            onClick={() => onEdit(transaction)}
            className="flex-1 py-3 rounded-2xl bg-secondary flex items-center justify-center gap-2 text-sm font-semibold"
          >
            <Pencil className="w-4 h-4" />
            {t('transactions.edit', { defaultValue: 'Edit' })}
          </button>
          <button
            onClick={() => onDelete(transaction)}
            className="flex-1 py-3 rounded-2xl bg-rose-500/10 flex items-center justify-center gap-2 text-sm font-semibold text-rose-400"
          >
            <Trash2 className="w-4 h-4" />
            {t('transactions.delete', { defaultValue: 'Delete' })}
          </button>
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-right max-w-[60%]">{value}</span>
    </div>
  );
}
