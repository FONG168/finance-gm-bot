'use client';

import '@/lib/i18n';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowLeftRight, Pencil, Trash2, ChevronRight, X, Check } from 'lucide-react';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api';
import { Account, AccountType, CreateAccountDto, Transaction, PaginatedResponse } from '@shared/types';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { TransactionItem } from '@/components/transactions/TransactionItem';
import { useTranslation } from 'react-i18next';

const ACCOUNT_PRESETS: { type: AccountType; icon: string; color: string; labelKey: string }[] = [
  { type: 'cash',    icon: '💵', color: '#10b981', labelKey: 'accountType.cash' },
  { type: 'bank',    icon: '🏦', color: '#3b82f6', labelKey: 'accountType.bank' },
  { type: 'ewallet', icon: '📱', color: '#8b5cf6', labelKey: 'accountType.ewallet' },
  { type: 'savings', icon: '🏧', color: '#f59e0b', labelKey: 'accountType.savings' },
  { type: 'credit',  icon: '💳', color: '#ef4444', labelKey: 'accountType.credit' },
];

const COLOR_OPTIONS = ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#ec4899','#f97316','#6366f1','#84cc16'];
const ICON_OPTIONS  = ['💵','🏦','📱','🏧','💳','💰','🪙','💎','🏪','🛒','💼','🎯'];

export default function AccountsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useTranslation('common');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totalAssets, setTotalAssets] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [viewAccount, setViewAccount] = useState<Account | null>(null);

  const loadAccounts = async () => {
    try {
      const data = await apiService.accounts.list();
      setAccounts(data.accounts);
      setTotalAssets(data.totalAssets);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) loadAccounts();
    else setIsLoading(false);
  }, [isAuthenticated, authLoading]);

  const handleDelete = async (id: string) => {
    if (!confirm(t('accounts.deleteConfirm'))) return;
    await apiService.accounts.delete(id);
    loadAccounts();
  };

  return (
    <div className="min-h-screen bg-background pb-nav">
      <div className="px-4 pt-5 pb-3 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold">{t('accounts.title')}</h1>
          <button
            onClick={() => setShowAdd(true)}
            className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">{t('accounts.subtitle')}</p>
      </div>

      <div className="px-4 space-y-4 max-w-2xl mx-auto">
        {/* Net Worth Banner */}
        <div className="rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg,#3b1278,#5b21b6)' }}>
          <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-1">{t('accounts.totalAssets')}</p>
          <p className="text-2xl sm:text-3xl font-bold tabular-nums">{formatCurrency(totalAssets)}</p>
          <div className="flex gap-3 mt-3">
            <button
              onClick={() => setShowTransfer(true)}
              className="flex items-center gap-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" /> {t('accounts.transfer')}
            </button>
          </div>
        </div>

        {/* Account list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-secondary animate-pulse" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">🏦</p>
            <p className="text-sm text-muted-foreground">{t('accounts.noAccounts')}</p>
            <button onClick={() => setShowAdd(true)} className="mt-3 text-xs text-violet-400 font-semibold">
              {t('accounts.addFirst')}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {accounts.map((acc, i) => (
              <motion.div
                key={acc.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl bg-card border border-border p-4 flex items-center gap-3"
              >
                {/* Clickable area: icon + name + balance */}
                <button
                  onClick={() => setViewAccount(acc)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left active:opacity-70 transition-opacity"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: acc.color + '22' }}
                  >
                    {acc.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold truncate">{acc.name}</p>
                      {acc.isDefault && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 font-bold">{t('accounts.default')}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground capitalize">{acc.type}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold tabular-nums ${acc.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCurrency(acc.balance)}
                    </p>
                  </div>
                </button>

                {/* Edit / Delete buttons */}
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => setEditAccount(acc)}
                    className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center"
                  >
                    <Pencil className="w-3 h-3 text-muted-foreground" />
                  </button>
                  {!acc.isDefault && (
                    <button
                      onClick={() => handleDelete(acc.id)}
                      className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center"
                    >
                      <Trash2 className="w-3 h-3 text-rose-400" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Account Sheet */}
      <AnimatePresence>
        {showAdd && (
          <AddAccountSheet
            onClose={() => setShowAdd(false)}
            onSaved={() => { setShowAdd(false); loadAccounts(); }}
          />
        )}
        {editAccount && (
          <EditAccountSheet
            account={editAccount}
            onClose={() => setEditAccount(null)}
            onSaved={() => { setEditAccount(null); loadAccounts(); }}
          />
        )}
        {showTransfer && (
          <TransferSheet
            accounts={accounts}
            onClose={() => setShowTransfer(false)}
            onSaved={() => { setShowTransfer(false); loadAccounts(); }}
          />
        )}
        {viewAccount && (
          <AccountTransactionsSheet
            account={viewAccount}
            onClose={() => setViewAccount(null)}
          />
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}

// ─── Add Account Sheet ────────────────────────────────────────────────────────
function AddAccountSheet({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation('common');
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('cash');
  const [balance, setBalance] = useState('0');
  const [color, setColor] = useState('#10b981');
  const [icon, setIcon] = useState('💵');
  const [saving, setSaving] = useState(false);

  const selectPreset = (preset: typeof ACCOUNT_PRESETS[0]) => {
    setType(preset.type);
    setColor(preset.color);
    setIcon(preset.icon);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await apiService.accounts.create({ name: name.trim(), type, balance: parseFloat(balance) || 0, color, icon });
      onSaved();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  return <Sheet
    onClose={onClose}
    title={t('accounts.newAccount')}
    footer={
      <button
        onClick={handleSave}
        disabled={!name.trim() || saving}
        className="w-full py-3.5 rounded-2xl font-bold text-sm text-white disabled:opacity-40 flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
      >
        {saving ? (
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
        ) : t('accounts.createAccount')}
      </button>
    }
  >
    <AccountForm
      name={name} setName={setName}
      type={type} selectPreset={selectPreset}
      balance={balance} setBalance={setBalance}
      color={color} setColor={setColor}
      icon={icon} setIcon={setIcon}
      showBalance
    />
  </Sheet>;
}

// ─── Edit Account Sheet ───────────────────────────────────────────────────────
function EditAccountSheet({ account, onClose, onSaved }: { account: Account; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation('common');
  const [name, setName] = useState(account.name);
  const [type, setType] = useState<AccountType>(account.type);
  const [color, setColor] = useState(account.color);
  const [icon, setIcon] = useState(account.icon);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await apiService.accounts.update(account.id, { name: name.trim(), type, color, icon });
      onSaved();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  return <Sheet
    onClose={onClose}
    title={t('accounts.editAccount')}
    footer={
      <button
        onClick={handleSave}
        disabled={!name.trim() || saving}
        className="w-full py-3.5 rounded-2xl font-bold text-sm text-white disabled:opacity-40 flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
      >
        {saving ? (
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
        ) : t('accounts.saveChanges')}
      </button>
    }
  >
    <AccountForm
      name={name} setName={setName}
      type={type} selectPreset={(p) => { setType(p.type); setColor(p.color); setIcon(p.icon); }}
      color={color} setColor={setColor}
      icon={icon} setIcon={setIcon}
    />
  </Sheet>;
}

// ─── Transfer Sheet ───────────────────────────────────────────────────────────
function TransferSheet({ accounts, onClose, onSaved }: { accounts: Account[]; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation('common');
  const [fromId, setFromId] = useState(accounts[0]?.id || '');
  const [toId, setToId] = useState(accounts[1]?.id || '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleTransfer = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    if (fromId === toId) { setError(t('accounts.selectDifferent')); return; }
    setSaving(true);
    setError('');
    try {
      await apiService.accounts.transfer({ fromAccountId: fromId, toAccountId: toId, amount: amt, note: note || undefined, date: new Date().toISOString() });
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return <Sheet
    onClose={onClose}
    title={t('accounts.transferMoney')}
    footer={
      <>
        {error && <p className="text-xs text-rose-400 mb-2">{error}</p>}
        <button
          onClick={handleTransfer}
          disabled={!amount || saving}
          className="w-full py-3.5 rounded-2xl font-bold text-sm text-white disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
        >
          {saving ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : t('accounts.transfer')}
        </button>
      </>
    }
  >
    <div className="space-y-3">
      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{t('accounts.from')}</label>
        <select
          value={fromId} onChange={(e) => setFromId(e.target.value)}
          className="mt-1 w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm"
        >
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.icon} {a.name} — {formatCurrency(a.balance)}</option>)}
        </select>
      </div>
      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{t('accounts.to')}</label>
        <select
          value={toId} onChange={(e) => setToId(e.target.value)}
          className="mt-1 w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm"
        >
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.icon} {a.name} — {formatCurrency(a.balance)}</option>)}
        </select>
      </div>
      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{t('accounts.amount')}</label>
        <input
          type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00" className="mt-1 w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm"
        />
      </div>
      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{t('accounts.noteOptional')}</label>
        <input
          type="text" value={note} onChange={(e) => setNote(e.target.value)}
          placeholder={t('accounts.noteHint')} className="mt-1 w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm"
        />
      </div>
    </div>
  </Sheet>;
}

// ─── Account Transactions Sheet ───────────────────────────────────────────────
function AccountTransactionsSheet({ account, onClose }: { account: Account; onClose: () => void }) {
  const { t } = useTranslation('common');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [viewingTx, setViewingTx] = useState<Transaction | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await apiService.accounts.transactions(account.id, 1);
        setTransactions(res.data);
        setHasMore(res.hasMore);
        setPage(1);
        setTotalIncome((res as any).totalIncome ?? 0);
        setTotalExpense((res as any).totalExpense ?? 0);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [account.id]);

  const loadMore = async () => {
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await apiService.accounts.transactions(account.id, nextPage);
      setTransactions((prev) => [...prev, ...res.data]);
      setHasMore(res.hasMore);
      setPage(nextPage);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <>
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-black/60 flex items-end sm:items-center sm:justify-center sm:px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full max-w-lg mx-auto bg-card rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: account.color + '22' }}
            >
              {account.icon}
            </div>
            <div>
              <h2 className="text-base font-bold">{account.name}</h2>
              <p className={`text-sm font-semibold tabular-nums ${account.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(account.balance)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Income / Expense summary */}
        {!isLoading && (
          <div className="mx-6 mb-4 grid grid-cols-2 gap-2 flex-shrink-0">
            <div className="rounded-xl bg-emerald-500/10 px-3 py-2.5">
              <p className="text-[10px] text-emerald-400/70 uppercase tracking-wider font-semibold mb-0.5">
                {t('home.income', { defaultValue: 'Income' })}
              </p>
              <p className="text-sm font-bold text-emerald-400 tabular-nums">+{formatCurrency(totalIncome)}</p>
            </div>
            <div className="rounded-xl bg-rose-500/10 px-3 py-2.5">
              <p className="text-[10px] text-rose-400/70 uppercase tracking-wider font-semibold mb-0.5">
                {t('home.expenses', { defaultValue: 'Expenses' })}
              </p>
              <p className="text-sm font-bold text-rose-400 tabular-nums">-{formatCurrency(totalExpense)}</p>
            </div>
          </div>
        )}

        {/* Transaction list */}
        <div className="overflow-y-auto flex-1 px-6">
          {isLoading ? (
            <div className="space-y-3 py-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-secondary animate-pulse" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm text-muted-foreground">{t('accounts.noTransactions', { defaultValue: 'No transactions yet' })}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {transactions.map((tx, i) => {
                // Normalize transfer direction so TransactionItem shows correct sign/color
                const displayTx = tx.type === 'transfer'
                  ? { ...tx, type: ((tx as any).transferDirection === 'in' ? 'income' : 'expense') as typeof tx.type }
                  : tx;
                return <TransactionItem key={tx.id} transaction={displayTx} index={i} onClick={() => setViewingTx(tx)} />;
              })}
            </div>
          )}

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="w-full py-3 mt-2 text-xs font-semibold text-violet-400 flex items-center justify-center gap-2"
            >
              {isLoadingMore ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full" />
              ) : t('common.loadMore', { defaultValue: 'Load more' })}
            </button>
          )}
          <div className="h-4" />
        </div>
      </motion.div>
    </motion.div>

    {/* Tx detail — rendered outside the sheet so it layers above */}
    <AnimatePresence>
      {viewingTx && (
        <TxDetailOverlay transaction={viewingTx} onClose={() => setViewingTx(null)} />
      )}
    </AnimatePresence>
    </>
  );
}

// ─── Tx detail overlay (read-only, used inside AccountTransactionsSheet) ──────
function TxDetailOverlay({ transaction, onClose }: { transaction: Transaction; onClose: () => void }) {
  const { t } = useTranslation('common');
  const cat = transaction.category;
  const isIncome =
    transaction.type === 'income' ||
    (transaction.type === 'transfer' && (transaction.note?.startsWith('Transfer from') ?? false));
  const catLabel = cat ? t(`categories.${cat.name}`, { defaultValue: cat.label }) : '';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-black/60 flex items-end sm:items-center sm:justify-center sm:px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full max-w-lg mx-auto bg-card rounded-t-3xl sm:rounded-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center" style={{ backgroundColor: `${cat?.color}18` }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-3" style={{ backgroundColor: `${cat?.color}30` }}>
            {cat?.icon || '📦'}
          </div>
          <p className={`text-3xl font-bold tabular-nums mb-1 ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
          </p>
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: `${cat?.color}25`, color: cat?.color }}>
            {catLabel}
          </span>
        </div>
        <div className="px-6 py-4 space-y-0">
          {[
            { label: t('add.category', { defaultValue: 'Category' }), value: `${cat?.icon || ''} ${catLabel}` },
            { label: t('add.date', { defaultValue: 'Date' }), value: formatDate(transaction.date, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
            { label: t('add.time', { defaultValue: 'Time' }), value: formatTime(transaction.date) },
            ...(transaction.note ? [{ label: t('add.note', { defaultValue: 'Note' }), value: transaction.note }] : []),
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-sm font-semibold text-right max-w-[60%]">{value}</span>
            </div>
          ))}
        </div>
        <div className="px-6" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 20px)' }}>
          <button onClick={onClose} className="w-full py-3 rounded-2xl bg-secondary text-sm font-semibold flex items-center justify-center gap-2">
            <X className="w-4 h-4" /> {t('common.close', { defaultValue: 'Close' })}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────
function Sheet({ children, footer, onClose, title }: {
  children: React.ReactNode;
  footer: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-black/60 flex items-end sm:items-center sm:justify-center sm:px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full max-w-lg mx-auto bg-card rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <h2 className="text-base font-bold">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6">
          {children}
          <div className="h-3" />
        </div>

        {/* Pinned footer with save button */}
        <div className="px-6 pt-3 pb-safe flex-shrink-0" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 20px)' }}>
          {footer}
        </div>
      </motion.div>
    </motion.div>
  );
}

function AccountForm({
  name, setName, type, selectPreset, balance, setBalance, color, setColor, icon, setIcon, showBalance,
}: {
  name: string; setName: (v: string) => void;
  type: AccountType; selectPreset: (p: typeof ACCOUNT_PRESETS[0]) => void;
  balance?: string; setBalance?: (v: string) => void;
  color: string; setColor: (v: string) => void;
  icon: string; setIcon: (v: string) => void;
  showBalance?: boolean;
}) {
  const { t } = useTranslation('common');
  return (
    <div className="space-y-4">
      {/* Type presets */}
      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{t('accounts.type')}</label>
        <div className="flex gap-2 mt-2 flex-wrap">
          {ACCOUNT_PRESETS.map((p) => (
            <button
              key={p.type}
              onClick={() => selectPreset(p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${type === p.type ? 'border-violet-500 bg-violet-500/20 text-violet-300' : 'border-border bg-secondary text-muted-foreground'}`}
            >
              {p.icon} {t(p.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{t('accounts.accountName')}</label>
        <input
          type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder={t('accounts.accountNameHint')}
          className="mt-1 w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm"
        />
      </div>

      {/* Initial balance */}
      {showBalance && setBalance && (
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{t('accounts.openingBalance')}</label>
          <input
            type="number" value={balance} onChange={(e) => setBalance(e.target.value)}
            placeholder="0.00"
            className="mt-1 w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm"
          />
        </div>
      )}

      {/* Icon */}
      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{t('accounts.icon')}</label>
        <div className="flex gap-2 mt-2 flex-wrap">
          {ICON_OPTIONS.map((ic) => (
            <button
              key={ic}
              onClick={() => setIcon(ic)}
              className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition-colors ${icon === ic ? 'border-violet-500 bg-violet-500/20' : 'border-border bg-secondary'}`}
            >
              {ic}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{t('accounts.color')}</label>
        <div className="flex gap-2 mt-2 flex-wrap">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: c }}
            >
              {color === c && <Check className="w-3.5 h-3.5 text-white" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
