'use client';

import '@/lib/i18n';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, ArrowLeftRight, FileDown } from 'lucide-react';
import { BottomNav } from '@/components/layout/BottomNav';
import { IncomeExpenseChart } from '@/components/charts/IncomeExpenseChart';
import { CategoryPieChart } from '@/components/charts/CategoryPieChart';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api';
import { MonthlySummary, Transaction } from '@shared/types';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MONTH_NAMES: Record<string, string[]> = {
  en: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  km: ['មករា','កុម្ភៈ','មីនា','មេសា','ឧសភា','មិថុនា','កក្កដា','សីហា','កញ្ញា','តុលា','វិច្ឆិកា','ធ្នូ'],
  zh: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
};

const MONTH_NAMES_FULL: Record<string, string[]> = {
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  km: ['មករា','កុម្ភៈ','មីនា','មេសា','ឧសភា','មិថុនា','កក្កដា','សីហា','កញ្ញា','តុលា','វិច្ឆិកា','ធ្នូ'],
  zh: ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'],
};

function formatMonthLabel(month: number, year: number, lang: string) {
  const months = MONTH_NAMES[lang] ?? MONTH_NAMES.en;
  return `${months[month - 1]} ${year}`;
}

function formatMonthFull(month: number, year: number, lang: string) {
  const months = MONTH_NAMES_FULL[lang] ?? MONTH_NAMES_FULL.en;
  return `${months[month - 1]} ${year}`;
}

// ─── Month Detail Sheet ───────────────────────────────────────────────────────

function MonthDetailSheet({
  summary,
  lang,
  onClose,
}: {
  summary: MonthlySummary;
  lang: string;
  onClose: () => void;
}) {
  const { t } = useTranslation('common');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Build ISO date range for the month
  const startDate = `${summary.year}-${String(summary.month).padStart(2, '0')}-01`;
  const lastDay = new Date(summary.year, summary.month, 0).getDate();
  const endDate = `${summary.year}-${String(summary.month).padStart(2, '0')}-${lastDay}`;

  useEffect(() => {
    setLoading(true);
    setPage(1);
    apiService.transactions.list({ startDate, endDate, limit: 30, page: 1 })
      .then(res => {
        setTransactions(res.data);
        setHasMore(res.hasMore);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [summary.month, summary.year]);

  const loadMore = async () => {
    const next = page + 1;
    const res = await apiService.transactions.list({ startDate, endDate, limit: 30, page: next });
    setTransactions(prev => [...prev, ...res.data]);
    setHasMore(res.hasMore);
    setPage(next);
  };

  const downloadPDF = async () => {
    setPdfLoading(true);
    try {
      // Fetch all transactions for the month
      let allTx: Transaction[] = [...transactions];
      if (hasMore) {
        const res = await apiService.transactions.list({ startDate, endDate, limit: 1000, page: 1 });
        allTx = res.data;
      }

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 14;
      const contentW = pageW - margin * 2;

      // ── Header block ──────────────────────────────────────────────────────
      doc.setFillColor(59, 18, 120);
      doc.rect(0, 0, pageW, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Finance GM', margin, 12);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const monthEn = MONTH_NAMES_FULL.en[summary.month - 1];
      doc.text(`${monthEn} ${summary.year} — Monthly Report`, margin, 20);

      doc.setFontSize(8);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, pageW - margin, 20, { align: 'right' });

      let y = 38;

      // ── Summary section ───────────────────────────────────────────────────
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('SUMMARY', margin, y);
      y += 2;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageW - margin, y);
      y += 6;

      const summaryItems = [
        { label: 'Total Income', value: `+${formatCurrency(summary.totalIncome)}`, color: [16, 185, 129] as [number, number, number] },
        { label: 'Total Expenses', value: `-${formatCurrency(summary.totalExpenses)}`, color: [239, 68, 68] as [number, number, number] },
        { label: 'Net Saved', value: formatCurrency(Math.max(0, summary.netBalance)), color: [124, 58, 237] as [number, number, number] },
        { label: 'Savings Rate', value: `${summary.savingsRate}%`, color: [59, 130, 246] as [number, number, number] },
      ];

      const colW = contentW / 4;
      summaryItems.forEach((item, i) => {
        const x = margin + i * colW;
        // Box
        doc.setFillColor(248, 248, 252);
        doc.roundedRect(x, y, colW - 2, 18, 2, 2, 'F');
        // Label
        doc.setTextColor(120, 120, 120);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(item.label, x + (colW - 2) / 2, y + 6, { align: 'center' });
        // Value
        doc.setTextColor(...item.color);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(item.value, x + (colW - 2) / 2, y + 13, { align: 'center' });
      });
      y += 26;

      // ── Category breakdown ────────────────────────────────────────────────
      if (summary.categoryBreakdown.length > 0) {
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('SPENDING BY CATEGORY', margin, y);
        y += 2;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, pageW - margin, y);
        y += 4;

        autoTable(doc, {
          startY: y,
          head: [['Category', 'Amount', '%']],
          body: summary.categoryBreakdown.map(cat => [
            cat.label,
            formatCurrency(cat.amount),
            `${cat.percentage}%`,
          ]),
          margin: { left: margin, right: margin },
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: [59, 18, 120], textColor: 255, fontStyle: 'bold', fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 35, halign: 'right' },
            2: { cellWidth: 18, halign: 'right' },
          },
          alternateRowStyles: { fillColor: [248, 248, 252] },
          theme: 'striped',
        });

        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
      }

      // ── Transaction list ──────────────────────────────────────────────────
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`TRANSACTIONS (${allTx.length} total)`, margin, y);
      y += 2;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageW - margin, y);
      y += 4;

      const PDF_TZ = 'Asia/Phnom_Penh';
      const fmtDatePdf = (d: string | Date) =>
        new Date(d).toLocaleDateString('en-US', { timeZone: PDF_TZ, month: 'short', day: 'numeric', year: 'numeric' });
      const fmtTimePdf = (d: string | Date) =>
        new Date(d).toLocaleTimeString('en-US', { timeZone: PDF_TZ, hour: '2-digit', minute: '2-digit' });

      autoTable(doc, {
        startY: y,
        head: [['Date', 'Time', 'Description', 'Category', 'Type', 'Amount']],
        body: allTx.map(tx => {
          const isIn = tx.type === 'income' || (tx.type === 'transfer' && (tx.note?.startsWith('Transfer from') ?? false));
          const isTransfer = tx.type === 'transfer';
          const sign = isTransfer ? (tx.note?.startsWith('Transfer from') ? '+' : '-') : isIn ? '+' : '-';
          return [
            fmtDatePdf(tx.date),
            fmtTimePdf(tx.date),
            tx.note || '—',
            tx.category?.label || (isTransfer ? 'Transfer' : '—'),
            tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
            `${sign}${formatCurrency(Number(tx.amount))}`,
          ];
        }),
        margin: { left: margin, right: margin },
        styles: { fontSize: 7.5, cellPadding: 2.5, overflow: 'ellipsize' },
        headStyles: { fillColor: [59, 18, 120], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
        columnStyles: {
          0: { cellWidth: 24 },
          1: { cellWidth: 16 },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 24 },
          4: { cellWidth: 16 },
          5: { cellWidth: 26, halign: 'right' },
        },
        alternateRowStyles: { fillColor: [248, 248, 252] },
        theme: 'striped',
        didParseCell: (data) => {
          if (data.column.index === 5 && data.section === 'body') {
            const val = String(data.cell.text[0] || '');
            if (val.startsWith('+')) data.cell.styles.textColor = [16, 185, 129];
            else if (val.startsWith('-')) data.cell.styles.textColor = [239, 68, 68];
          }
        },
      });

      // ── Footer ────────────────────────────────────────────────────────────
      const pageH = doc.internal.pageSize.getHeight();
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, pageH - 14, pageW - margin, pageH - 14);
      doc.setTextColor(160, 160, 160);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('Finance GM — Confidential Financial Report', margin, pageH - 8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 120, 120);
      doc.text('Built & owned by Bun Kompheak', pageW - margin, pageH - 8, { align: 'right' });

      const filename = `FinanceGM_${monthEn}_${summary.year}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error('PDF generation failed', err);
    } finally {
      setPdfLoading(false);
    }
  };

  const totalTransfer = transactions
    .filter(tx => tx.type === 'transfer')
    .reduce((s, tx) => s + Number(tx.amount), 0);

  const isIncomeTx = (tx: Transaction) =>
    tx.type === 'income' || (tx.type === 'transfer' && (tx.note?.startsWith('Transfer from') ?? false));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-end justify-center"
        style={{ background: 'rgba(0,0,0,0.7)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="w-full max-w-md bg-card rounded-t-3xl flex flex-col"
          style={{ maxHeight: '90vh' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
            <div>
              <h2 className="text-base font-bold">{formatMonthFull(summary.month, summary.year, lang)}</h2>
              <p className="text-xs text-muted-foreground">{t('reports.subtitle')}</p>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={downloadPDF}
                disabled={pdfLoading || loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}
              >
                {pdfLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                    className="w-3.5 h-3.5 border-2 border-violet-400 border-t-transparent rounded-full"
                  />
                ) : (
                  <FileDown className="w-3.5 h-3.5" />
                )}
                PDF
              </motion.button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Summary strip */}
          <div className="grid grid-cols-3 gap-2 px-5 mb-3 flex-shrink-0">
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
              <TrendingUp className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <p className="text-xs font-bold text-emerald-400 tabular-nums truncate">
                +{formatCurrency(summary.totalIncome)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t('reports.income')}</p>
            </div>
            <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3 text-center">
              <TrendingDown className="w-4 h-4 text-rose-400 mx-auto mb-1" />
              <p className="text-xs font-bold text-rose-400 tabular-nums truncate">
                -{formatCurrency(summary.totalExpenses)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t('reports.expenses')}</p>
            </div>
            <div className="rounded-2xl bg-violet-500/10 border border-violet-500/20 p-3 text-center">
              <ArrowLeftRight className="w-4 h-4 text-violet-400 mx-auto mb-1" />
              <p className="text-xs font-bold text-violet-400 tabular-nums truncate">
                {formatCurrency(Math.max(0, summary.netBalance))}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t('reports.saved')}</p>
            </div>
          </div>

          {/* Category breakdown */}
          {summary.categoryBreakdown.length > 0 && (
            <div className="px-5 mb-3 flex-shrink-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                {t('reports.spendingByCategory')}
              </p>
              <div className="space-y-1.5">
                {summary.categoryBreakdown.slice(0, 5).map(cat => (
                  <div key={cat.categoryId} className="flex items-center gap-2">
                    <span className="text-base w-6 text-center flex-shrink-0">{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium truncate">{cat.label}</span>
                        <span className="text-xs font-bold text-rose-400 ml-2 flex-shrink-0">
                          {formatCurrency(cat.amount)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground w-8 text-right flex-shrink-0">
                      {cat.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-border mx-5 mb-3 flex-shrink-0" />

          {/* Transaction list */}
          <div className="overflow-y-auto flex-1 px-5 pb-8">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
              {t('transactions.title')} ({transactions.length})
            </p>

            {loading ? (
              <div className="flex justify-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full"
                />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map(tx => {
                  const isIn = isIncomeTx(tx);
                  const isTransfer = tx.type === 'transfer';
                  const color = isTransfer
                    ? 'text-violet-400'
                    : isIn ? 'text-emerald-400' : 'text-rose-400';
                  const sign = isTransfer
                    ? (tx.note?.startsWith('Transfer from') ? '+' : '-')
                    : isIn ? '+' : '-';

                  return (
                    <div
                      key={tx.id}
                      className="flex items-center gap-3 py-2.5 border-b border-border/40 last:border-0"
                    >
                      {/* Icon */}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                        style={{ backgroundColor: (tx.category?.color || '#7c3aed') + '22' }}
                      >
                        {isTransfer ? '↔️' : (tx.category?.icon || '📦')}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {tx.note || tx.category?.label || '—'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDate(tx.date)} · {formatTime(tx.date)}
                        </p>
                      </div>

                      {/* Amount */}
                      <p className={`text-sm font-bold tabular-nums flex-shrink-0 ${color}`}>
                        {sign}{formatCurrency(Number(tx.amount))}
                      </p>
                    </div>
                  );
                })}

                {hasMore && (
                  <button
                    onClick={loadMore}
                    className="w-full py-3 text-sm text-violet-400 font-semibold text-center"
                  >
                    {t('common.loadMore')}
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, i18n } = useTranslation('common');
  const [reports, setReports] = useState<MonthlySummary[]>([]);
  const [selected, setSelected] = useState<MonthlySummary | null>(null);
  const [detailSummary, setDetailSummary] = useState<MonthlySummary | null>(null);
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
        <h1 className="text-xl font-bold">{t('reports.title')}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{t('reports.subtitle')}</p>
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
            {/* Month selector — tap to open detail sheet */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {reports.map((r) => (
                <button
                  key={`${r.year}-${r.month}`}
                  onClick={() => { setSelected(r); setDetailSummary(r); }}
                  className={cn(
                    'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                    selected?.month === r.month && selected?.year === r.year
                      ? 'bg-violet-600 text-white'
                      : 'bg-secondary text-muted-foreground',
                  )}
                >
                  {formatMonthLabel(r.month, r.year, i18n.language)}
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
                    { labelKey: 'reports.income', value: selected.totalIncome, emoji: '💰', color: 'text-emerald-400' },
                    { labelKey: 'reports.expenses', value: selected.totalExpenses, emoji: '💸', color: 'text-rose-400' },
                    { labelKey: 'reports.saved', value: Math.max(0, selected.netBalance), emoji: '🏦', color: 'text-violet-400' },
                  ].map((s) => (
                    <div key={s.labelKey} className="rounded-2xl bg-card border border-border p-3 text-center">
                      <p className="text-xl mb-1">{s.emoji}</p>
                      <p className={`text-sm font-bold tabular-nums truncate ${s.color}`}>{formatCurrency(s.value)}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{t(s.labelKey)}</p>
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
                    <p className="font-bold text-base">{selected.savingsRate}% {t('reports.savingsRate')}</p>
                    <p className="text-xs text-muted-foreground">
                      {selected.savingsRate >= 20
                        ? t('reports.excellentSavings')
                        : selected.savingsRate >= 0
                        ? t('reports.brokeEven')
                        : t('reports.overspent')}
                    </p>
                  </div>
                </div>

                {/* Weekly trends */}
                <div className="rounded-3xl bg-card border border-border p-5">
                  <h2 className="text-sm font-bold mb-4">{t('reports.weeklyTrends')}</h2>
                  <IncomeExpenseChart data={selected.weeklyTrends} />
                </div>

                {/* Category breakdown */}
                <div className="rounded-3xl bg-card border border-border p-5">
                  <h2 className="text-sm font-bold mb-4">{t('reports.spendingByCategory')}</h2>
                  <CategoryPieChart data={selected.categoryBreakdown} />
                </div>

                {/* View all transactions for month */}
                <button
                  onClick={() => setDetailSummary(selected)}
                  className="w-full py-3.5 rounded-2xl border border-violet-500/30 bg-violet-500/5 text-violet-400 text-sm font-semibold"
                >
                  📋 {t('transactions.title')} — {formatMonthFull(selected.month, selected.year, i18n.language)}
                </button>
              </>
            )}

            {reports.length === 0 && (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">📊</p>
                <p className="text-sm text-muted-foreground">{t('reports.noReports')}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('reports.noReportsHint')}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />

      {/* Month detail sheet */}
      {detailSummary && (
        <MonthDetailSheet
          summary={detailSummary}
          lang={i18n.language}
          onClose={() => setDetailSummary(null)}
        />
      )}
    </div>
  );
}
