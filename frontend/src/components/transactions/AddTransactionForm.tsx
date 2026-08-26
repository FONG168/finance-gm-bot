'use client';

import '@/lib/i18n';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Check, X, AlertCircle, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { TransactionType, Account, Category } from '@shared/types';
import { apiService } from '@/services/api';
import { useTelegram } from '@/hooks/useTelegram';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { cn, formatCurrency, getPhnomPenhToday, combineDateWithPhnomPenhNow } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/providers/ToastProvider';

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
            <AlertCircle className="w-7 h-7 text-rose-600" />
          </div>
          <h3 className="text-base font-bold text-rose-600">{t('add.blocked')}</h3>
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
  type, amount, categoryObj, account, note,
  onConfirm, onCancel, isLoading,
}: {
  type: TransactionType; amount: string; categoryObj: Category | undefined; account: Account | undefined;
  note: string; onConfirm: () => void; onCancel: () => void; isLoading: boolean;
}) {
  const { t } = useTranslation('common');
  const amountNum = parseFloat(amount);
  const isExpense = type === 'expense';
  const cat = categoryObj;

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
            <span className="font-semibold">{cat ? t(`categories.${cat.name}`, { defaultValue: cat.label }) : t('categories.other')}</span>
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

// ── Add category modal ────────────────────────────────────────────────────────
function AddCategoryModal({
  onClose,
  onSave,
  defaultType,
}: {
  onClose: () => void;
  onSave: (name: string, icon: string, color: string, type: 'income' | 'expense' | 'both') => Promise<void>;
  defaultType: TransactionType;
}) {
  const { t } = useTranslation('common');
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📦');
  const [selectedColor, setSelectedColor] = useState('#7c3aed');
  const [categoryType, setCategoryType] = useState<'income' | 'expense' | 'both'>(defaultType === 'income' ? 'income' : 'expense');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const emojis = ['🍔', '🚗', '🎬', '🛍️', '📄', '❤️', '💼', '💻', '📈', '📦', '🏠', '🎓', '🎁', '✈️', '🛒', '🔌', '💅', '🎮', '🐕', '🍕'];
  const colors = [
    { name: 'Violet', value: '#7c3aed' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Fuchsia', value: '#d946ef' },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    setErrorMsg('');
    try {
      await onSave(name.trim(), selectedIcon, selectedColor, categoryType);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to save category');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:px-5"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="w-full max-w-sm sm:max-w-md bg-card rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl overflow-y-auto max-h-[90vh] sm:max-h-none border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold">{t('add.addNewCategory', { defaultValue: 'Create New Category' })}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-500/10 text-rose-500 text-xs p-3.5 rounded-2xl mb-4 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* Preview */}
          <div className="flex justify-center py-2">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-md border"
              style={{ backgroundColor: selectedColor + '20', borderColor: selectedColor + '40' }}
            >
              {selectedIcon}
            </div>
          </div>

          {/* Name Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('add.categoryName', { defaultValue: 'Category Name' })}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Books, Coffee"
              maxLength={25}
              required
              className="w-full h-12 px-4 rounded-2xl bg-secondary border border-transparent focus:border-violet-500 outline-none text-sm font-semibold text-foreground transition-all"
            />
          </div>

          {/* Type Select */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('add.categoryType', { defaultValue: 'Category Type' })}</label>
            <div className="flex gap-2">
              {(['expense', 'income', 'both'] as const).map((tp) => (
                <button
                  key={tp}
                  type="button"
                  onClick={() => setCategoryType(tp)}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all',
                    categoryType === tp
                      ? 'bg-violet-600 border-violet-600 text-white shadow-sm'
                      : 'bg-secondary border-transparent text-muted-foreground'
                  )}
                >
                  {tp === 'expense' ? 'Expense' : tp === 'income' ? 'Income' : 'Both'}
                </button>
              ))}
            </div>
          </div>

          {/* Emojis Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('add.selectIcon', { defaultValue: 'Select Icon' })}</label>
            <div className="grid grid-cols-5 gap-2 max-h-[120px] overflow-y-auto p-1 border border-border/40 rounded-2xl no-scrollbar">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedIcon(emoji)}
                  className={cn(
                    'h-10 rounded-xl text-xl flex items-center justify-center hover:bg-secondary active:scale-95 transition-all',
                    selectedIcon === emoji ? 'bg-secondary border border-border shadow-inner' : 'bg-transparent border border-transparent'
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Colors Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('add.selectColor', { defaultValue: 'Select Color' })}</label>
            <div className="flex flex-wrap gap-2.5 p-1">
              {colors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 border-2',
                    selectedColor === color.value ? 'border-foreground shadow-md' : 'border-transparent'
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-secondary text-sm font-semibold text-muted-foreground"
            >
              {t('add.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="flex-1 py-3 rounded-2xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-violet-950/20"
            >
              {isSaving ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <>{t('add.save', { defaultValue: 'Save' })}</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────
export function AddTransactionForm() {
  const router = useRouter();
  const { haptic } = useTelegram();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation('common');
  const toast = useToast();
  const [type, setType] = useState<TransactionType>(() => {
    if (typeof window === 'undefined') return 'expense';
    const q = new URLSearchParams(window.location.search).get('type');
    return q === 'income' ? 'income' : 'expense';
  });
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [accountId, setAccountId] = useState('');
  const [txDate, setTxDate] = useState(() => getPhnomPenhToday());
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorPopup, setErrorPopup] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);

  const { categories, addCategory } = useCategories();
  const filteredCategories = categories.filter((c) => c.type === type || c.type === 'both');
  const selectedAccount = accounts.find((a) => a.id === accountId);

  useEffect(() => {
    // Wait for auth to actually be ready — this form can mount before
    // useAuth() finishes setting the API token (e.g. landing directly on
    // /add on a cold start), and firing this fetch too early gets a 401
    // that never gets retried, silently leaving the account picker empty.
    if (!isAuthenticated) return;
    apiService.accounts.list().then(({ accounts }) => {
      setAccounts(accounts);
      const def = accounts.find((a) => a.isDefault) ?? accounts[0];
      if (def) setAccountId(def.id);
    }).catch((e) => {
      console.error(e);
      toast.error(t('common.loadFailed'));
    });
  }, [isAuthenticated]);

  const accountScrollRef = useRef<HTMLDivElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const handleAccountScroll = (direction: 'left' | 'right') => {
    if (accountScrollRef.current) {
      const scrollAmount = direction === 'left' ? -180 : 180;
      accountScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!accountScrollRef.current) return;
    setIsMouseDown(true);
    setStartX(e.pageX - accountScrollRef.current.offsetLeft);
    setScrollLeftState(accountScrollRef.current.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => {
    setIsMouseDown(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !accountScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - accountScrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    accountScrollRef.current.scrollLeft = scrollLeftState - walk;
  };

  const handleSaveClick = () => {
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
        date: txDate ? combineDateWithPhnomPenhNow(txDate) : new Date().toISOString(),
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
              type="button"
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
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => { setCategoryId(cat.id); haptic.selection(); }}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-2.5 sm:p-3 rounded-2xl border-2 transition-all',
                  categoryId === cat.id ? 'border-violet-500 bg-violet-500/15' : 'border-transparent bg-secondary',
                )}
              >
                <span className="text-xl sm:text-2xl">{cat.icon}</span>
                <span className={cn(
                  'text-[9px] sm:text-[10px] font-medium text-center leading-tight',
                  categoryId === cat.id ? 'text-violet-700' : 'text-muted-foreground',
                )}>
                  {t(`categories.${cat.name}`, { defaultValue: cat.label })}
                </span>
              </button>
            ))}

            {/* "+ Add New" button */}
            <button
              type="button"
              onClick={() => { setShowAddCategory(true); haptic.selection(); }}
              className="flex flex-col items-center justify-center gap-1.5 p-2.5 sm:p-3 rounded-2xl border border-dashed border-muted-foreground/35 bg-transparent hover:bg-secondary/35 active:scale-95 transition-all min-h-[78px]"
            >
              <span className="text-xl sm:text-2xl text-muted-foreground">+</span>
              <span className="text-[9px] sm:text-[10px] font-medium text-center text-muted-foreground leading-tight">
                {t('add.newCategory', { defaultValue: 'Add New' })}
              </span>
            </button>
          </div>
        </div>

        {/* Account selector */}
        {accounts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('add.account')}</p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAccountScroll('left')}
                  className="w-7 h-7 rounded-full bg-secondary border border-border hover:bg-secondary/80 flex items-center justify-center text-muted-foreground active:scale-95 transition-all shadow-sm"
                  title={t('add.scrollLeft')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleAccountScroll('right')}
                  className="w-7 h-7 rounded-full bg-secondary border border-border hover:bg-secondary/80 flex items-center justify-center text-muted-foreground active:scale-95 transition-all shadow-sm"
                  title={t('add.scrollRight')}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              ref={accountScrollRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeaveOrUp}
              onMouseUp={handleMouseLeaveOrUp}
              onMouseMove={handleMouseMove}
              className="flex gap-2.5 overflow-x-auto pb-2 pt-0.5 no-scrollbar scrollbar-none snap-x snap-mandatory touch-pan-x -mx-1 px-1 cursor-grab active:cursor-grabbing select-none"
            >
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => { setAccountId(acc.id); haptic.selection(); }}
                  className={cn(
                    'flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border-2 min-w-[155px] sm:min-w-[170px] flex-shrink-0 snap-start transition-all active:scale-95',
                    accountId === acc.id
                      ? 'border-violet-500 bg-violet-500/15 shadow-sm'
                      : 'border-border bg-secondary/80 hover:bg-secondary',
                  )}
                >
                  <span
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 shadow-inner pointer-events-none"
                    style={{ backgroundColor: acc.color + '25', border: `1px solid ${acc.color}40` }}
                  >
                    {acc.icon}
                  </span>
                  <div className="text-left min-w-0 flex-1 pointer-events-none">
                     <p className={cn('text-xs font-bold truncate', accountId === acc.id ? 'text-violet-700' : 'text-foreground')}>{acc.name}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">{formatCurrency(acc.balance)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Date Selector */}
        <div className="bg-secondary rounded-2xl p-4">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-violet-600" />
            <span>{t('add.dateOfTransaction')}</span>
          </label>
          <input
            type="date"
            value={txDate}
            onChange={(e) => setTxDate(e.target.value)}
            className="w-full bg-transparent outline-none text-sm font-semibold text-foreground cursor-pointer"
          />
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
            categoryObj={categories.find((c) => c.id === categoryId)}
            account={selectedAccount}
            note={note}
            onConfirm={handleConfirm}
            onCancel={() => setShowConfirm(false)}
            isLoading={isLoading}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddCategory && (
          <AddCategoryModal
            onClose={() => setShowAddCategory(false)}
            onSave={async (name, icon, color, type) => {
              const newCat = await addCategory({ name, label: name, icon, color, type });
              if (newCat && newCat.id) {
                setCategoryId(newCat.id);
              }
            }}
            defaultType={type}
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
    </>
  );
}
