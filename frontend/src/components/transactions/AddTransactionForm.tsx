'use client';

import '@/lib/i18n';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Check, X, AlertCircle } from 'lucide-react';
import { CATEGORIES, TransactionType, Account } from '@shared/types';
import { apiService } from '@/services/api';
import { useTelegram } from '@/hooks/useTelegram';
import { useAuth } from '@/hooks/useAuth';
import { cn, formatCurrency } from '@/lib/utils';
import { SubscriptionExpiredModal } from '@/components/subscription/SubscriptionExpiredModal';
import { useTranslation } from 'react-i18next';

const EXPENSE_CATS = CATEGORIES.filter((c) => c.type === 'expense' || c.type === 'both');
const INCOME_CATS = CATEGORIES.filter((c) => c.type === 'income' || c.type === 'both');

// ── Error popup ───────────────────────────────────────────────────────────────
function ErrorPopup({ message, onClose }: { message: string; onClose: () => void }) {
  const { t } = useTranslation('common');
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center px-5"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="w-full max-w-sm sm:max-w-md bg-card rounded-3xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-rose-500/20 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-rose-400" />
          </div>
          <h3 className="text-base font-bold text-rose-400">{t('add.blocked')}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
          <button
            onClick={onClose}
            className="mt-2 w-full py-3 rounded-2xl bg-rose-500 text-white text-sm font-bold"
          >
            {t('add.gotIt')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Confirm modal ─────────────────────────────────────────────────────────────
function ConfirmModal({
  type, amount, category, account, note,
  onConfirm, onCancel, isLoading,
}: {
  type: TransactionType; amount: string; category: string; account: Account | undefined;
  note: string; onConfirm: () => void; onCancel: () => void; isLoading: boolean;
}) {
  const { t } = useTranslation('common');
  const amountNum = parseFloat(amount);
  const isExpense = type === 'expense';
  const cat = CATEGORIES.find((c) => c.id === category);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center px-5"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="w-full max-w-sm sm:max-w-md bg-card rounded-3xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold">{t('add.confirmTransaction')}</h2>
          <button onClick={onCancel} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary card */}
        <div
          className="rounded-2xl p-4 mb-4"
          style={{ background: isExpense ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{cat?.icon || '📦'}</span>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                {isExpense ? t('add.expense') : t('add.income')}
              </p>
              <p className="text-xl font-bold" style={{ color: isExpense ? '#ef4444' : '#22c55e' }}>
                {isExpense ? '-' : '+'}{formatCurrency(amountNum)}
              </p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('add.category')}</span>
            <span className="font-semibold">{cat ? t(`categories.${cat.name}`) : t('categories.other')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('add.account')}</span>
            <span className="font-semibold">{account ? `${account.icon} ${account.name}` : '—'}</span>
          </div>
          {account && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('add.balanceAfter')}</span>
              <span
                className="font-bold"
                style={{ color: (account.balance + (isExpense ? -amountNum : amountNum)) >= 0 ? '#22c55e' : '#ef4444' }}
              >
                {formatCurrency(account.balance + (isExpense ? -amountNum : amountNum))}
              </span>
            </div>
          )}
          {note && (
            <div className="flex justify-between text-sm gap-3">
              <span className="text-muted-foreground flex-shrink-0">{t('add.note')}</span>
              <span className="font-semibold text-right truncate">{note}</span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl bg-secondary text-sm font-semibold text-muted-foreground"
          >
            {t('add.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2"
            style={{ background: isExpense ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#22c55e,#16a34a)' }}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <><Check className="w-4 h-4" />{t('add.confirm')}</>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────
export function AddTransactionForm() {
  const router = useRouter();
  const { haptic } = useTelegram();
  const { user } = useAuth();
  const { t } = useTranslation('common');
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [accountId, setAccountId] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorPopup, setErrorPopup] = useState('');
  const [showExpiredModal, setShowExpiredModal] = useState(false);

  const isExpired =
    user?.subscriptionStatus === 'EXPIRED' ||
    (user?.plan === 'PREMIUM' && user?.premiumExpiresAt && new Date(user.premiumExpiresAt) < new Date());

  const categories = type === 'expense' ? EXPENSE_CATS : INCOME_CATS;
  const selectedAccount = accounts.find((a) => a.id === accountId);

  useEffect(() => {
    apiService.accounts.list().then(({ accounts }) => {
      setAccounts(accounts);
      const def = accounts.find((a) => a.isDefault) ?? accounts[0];
      if (def) setAccountId(def.id);
    }).catch(() => {});
  }, []);

  const handleSaveClick = () => {
    if (isExpired) {
      haptic.error();
      setShowExpiredModal(true);
      return;
    }
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setErrorPopup(t('add.invalidAmount'));
      haptic.error();
      return;
    }
    if (!categoryId) {
      setErrorPopup(t('add.selectCategory'));
      haptic.error();
      return;
    }
    haptic.selection();
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await apiService.transactions.create({
        amount: parseFloat(amount),
        type,
        categoryId,
        note: note.trim() || undefined,
        accountId: accountId || undefined,
        date: new Date().toISOString(),
      });
      haptic.success();
      setShowConfirm(false);
      router.push('/');
    } catch (err: any) {
      haptic.error();
      setShowConfirm(false);
      setErrorPopup(err.message || 'Failed to save transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const amountColor = type === 'expense' ? '#ef4444' : '#22c55e';

  return (
    <>
      <div className="space-y-5">
        {/* Type toggle */}
        <div className="flex rounded-2xl bg-secondary p-1 gap-1">
          {(['expense', 'income'] as TransactionType[]).map((tp) => (
            <button
              key={tp}
              onClick={() => { setType(tp); setCategoryId(''); haptic.selection(); }}
              className={cn(
                'flex-1 py-3 rounded-xl text-sm font-semibold transition-all',
                type === tp
                  ? tp === 'expense' ? 'bg-rose-500 text-white shadow-sm' : 'bg-emerald-500 text-white shadow-sm'
                  : 'text-muted-foreground',
              )}
            >
              {tp === 'expense' ? `💸 ${t('add.expense')}` : `💰 ${t('add.income')}`}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div className="text-center py-5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">{t('add.amount')}</p>
          <div className="flex items-center justify-center gap-1">
            <span className="text-4xl sm:text-5xl font-bold flex-shrink-0" style={{ color: amountColor }}>$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="text-4xl sm:text-5xl font-bold bg-transparent outline-none placeholder:text-muted-foreground/25 w-full max-w-[200px] text-center"
              style={{ color: amountColor }}
              inputMode="decimal"
              autoFocus
            />
          </div>
        </div>

        {/* Category grid */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">{t('add.category')}</p>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setCategoryId(cat.id); haptic.selection(); }}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-2.5 sm:p-3 rounded-2xl border-2 transition-all',
                  categoryId === cat.id ? 'border-violet-500 bg-violet-500/15' : 'border-transparent bg-secondary',
                )}
              >
                <span className="text-xl sm:text-2xl">{cat.icon}</span>
                <span className={cn(
                  'text-[9px] sm:text-[10px] font-medium text-center leading-tight',
                  categoryId === cat.id ? 'text-violet-400' : 'text-muted-foreground',
                )}>
                  {t(`categories.${cat.name}`)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Account selector */}
        {accounts.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">{t('add.account')}</p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => { setAccountId(acc.id); haptic.selection(); }}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-2xl border-2 flex-shrink-0 transition-all',
                    accountId === acc.id ? 'border-violet-500 bg-violet-500/15' : 'border-transparent bg-secondary',
                  )}
                >
                  <span
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                    style={{ backgroundColor: acc.color + '33' }}
                  >
                    {acc.icon}
                  </span>
                  <div className="text-left">
                    <p className={cn('text-xs font-semibold', accountId === acc.id ? 'text-violet-400' : '')}>{acc.name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatCurrency(acc.balance)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

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
          onClick={handleSaveClick}
          disabled={!amount || !categoryId}
          className={cn(
            'w-full h-14 rounded-2xl text-base font-semibold text-white transition-all flex items-center justify-center gap-2',
            !amount || !categoryId ? 'opacity-40 cursor-not-allowed bg-violet-600' : 'shadow-lg shadow-violet-950/60',
          )}
          style={amount && categoryId ? { background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' } : undefined}
        >
          <Check className="w-5 h-5" />
          {type === 'expense' ? t('add.saveExpense') : t('add.saveIncome')}
        </button>
      </div>

      <AnimatePresence>
        {showConfirm && (
          <ConfirmModal
            type={type}
            amount={amount}
            category={categoryId}
            account={selectedAccount}
            note={note}
            onConfirm={handleConfirm}
            onCancel={() => setShowConfirm(false)}
            isLoading={isLoading}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {errorPopup && (
          <ErrorPopup
            message={errorPopup}
            onClose={() => setErrorPopup('')}
          />
        )}
      </AnimatePresence>

      <SubscriptionExpiredModal
        isOpen={showExpiredModal}
        onClose={() => setShowExpiredModal(false)}
        plan={user?.plan}
      />
    </>
  );
}
