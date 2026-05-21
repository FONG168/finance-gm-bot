// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');

import { MonthlySummary, CategoryBreakdown, TransactionRecord } from '../types';

// ── Design tokens ────────────────────────────────────────────────────────────
const PURPLE      = '#7c3aed';
const PURPLE_DARK = '#5b21b6';
const PURPLE_PALE = '#ede9fe';
const GREEN       = '#059669';
const GREEN_PALE  = '#d1fae5';
const RED         = '#dc2626';
const RED_PALE    = '#fee2e2';
const AMBER       = '#d97706';
const GRAY_50     = '#f9fafb';
const GRAY_100    = '#f3f4f6';
const GRAY_200    = '#e5e7eb';
const GRAY_300    = '#d1d5db';
const GRAY_400    = '#9ca3af';
const GRAY_500    = '#6b7280';
const GRAY_700    = '#374151';
const GRAY_900    = '#111827';
const WHITE       = '#ffffff';

// ── Page geometry ────────────────────────────────────────────────────────────
const W  = 595.28;  // A4 width  (pts)
const M  = 44;      // left/right margin
const CW = W - 2 * M; // content width = 507.28

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function safeLabel(label: string, fallback: string): string {
  const clean = label.replace(/[^\x00-\x7F]/g, '').trim();
  return clean || (fallback.charAt(0).toUpperCase() + fallback.slice(1));
}

function pctChange(current: number, prev: number | undefined): string | null {
  if (prev === undefined || prev === 0) return null;
  const pct = ((current - prev) / Math.abs(prev)) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

export interface AccountRow {
  name: string;
  type: string;
  balance: number;
  icon: string;
}

export interface ReportData {
  monthly: MonthlySummary;
  prevMonthly?: MonthlySummary;
  accounts: AccountRow[];
  userName: string;
}

// ── PDF generator ─────────────────────────────────────────────────────────────
export async function generateMonthlyPDF(data: ReportData): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const { monthly, prevMonthly, accounts, userName } = data;

    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      info: {
        Title: 'Finance GM Monthly Report',
        Author: 'Finance GM',
        Subject: `Monthly Finance Report`,
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const MONTHS = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];
    const monthName = MONTHS[monthly.month - 1];

    // ── Track y ──────────────────────────────────────────────────────────────
    let y = 0;

    // ── HEADER ───────────────────────────────────────────────────────────────
    // Main purple band
    doc.rect(0, 0, W, 118).fill(PURPLE_DARK);
    // Decorative lighter stripe at bottom of header
    doc.rect(0, 110, W, 8).fill(PURPLE);

    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(22)
      .text('Finance GM', M, 26, { lineBreak: false });

    doc.fillColor('#c4b5fd').font('Helvetica').fontSize(9.5)
      .text('MONTHLY FINANCE REPORT', M, 56, { lineBreak: false, characterSpacing: 1 });

    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(15)
      .text(`${monthName} ${monthly.year}`, M, 74, { lineBreak: false });

    doc.fillColor('#ddd6fe').font('Helvetica').fontSize(8.5)
      .text(`Prepared for ${userName}`, M, 96, { lineBreak: false });

    // Right side: transaction count badge
    const txLabel = `${monthly.weeklyTrends.reduce((s, w) => {
      // rough tx count from income+expenses
      return s;
    }, 0)}`;
    const badgeX = W - M - 90;
    doc.roundedRect(badgeX, 36, 90, 44, 6).fill('#6d28d9');
    doc.fillColor('#c4b5fd').font('Helvetica').fontSize(8).text('TOTAL BALANCE', badgeX + 8, 42, { lineBreak: false });
    const totalBal = accounts.reduce((s, a) => s + a.balance, 0);
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(13)
      .text(`$${fmt(totalBal)}`, badgeX + 8, 56, { lineBreak: false });

    y = 136;

    // ── Helper: section header ────────────────────────────────────────────────
    function sectionHeader(title: string, yPos: number): number {
      doc.fillColor(GRAY_400).font('Helvetica-Bold').fontSize(7.5)
        .text(title.toUpperCase(), M, yPos, { lineBreak: false, characterSpacing: 1.2 });
      doc.strokeColor(GRAY_200).lineWidth(0.5)
        .moveTo(M + doc.widthOfString(title.toUpperCase(), { characterSpacing: 1.2 }) + 8, yPos + 4)
        .lineTo(W - M, yPos + 4).stroke();
      return yPos + 18;
    }

    // ── Helper: page break ────────────────────────────────────────────────────
    function pageBreakIfNeeded(requiredHeight: number): void {
      if (y + requiredHeight > 820) {
        doc.addPage({ size: 'A4', margin: 0 });
        y = 40;
      }
    }

    // ── OVERVIEW CARDS ───────────────────────────────────────────────────────
    y = sectionHeader('Overview', y);

    const cardW = (CW - 16) / 3;
    interface CardDef {
      label: string;
      value: number;
      prevValue?: number;
      accentColor: string;
      isExpense?: boolean;
    }
    const cards: CardDef[] = [
      { label: 'Total Income',   value: monthly.totalIncome,   prevValue: prevMonthly?.totalIncome,   accentColor: GREEN },
      { label: 'Total Expenses', value: monthly.totalExpenses, prevValue: prevMonthly?.totalExpenses, accentColor: RED,   isExpense: true },
      { label: 'Net Balance',    value: monthly.netBalance,    prevValue: prevMonthly?.netBalance,    accentColor: monthly.netBalance >= 0 ? GREEN : RED },
    ];

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const cx = M + i * (cardW + 8);
      const cardH = 76;

      // Card shadow/border
      doc.roundedRect(cx, y, cardW, cardH, 6).fill(GRAY_50);
      // Accent top bar
      doc.rect(cx, y, cardW, 4).fill(card.accentColor);
      // Clip corners of top bar to match rounded rect — draw rounded rect again on top in GRAY_50 except top
      // (simpler: just use a thin rounded top)

      doc.fillColor(GRAY_500).font('Helvetica').fontSize(7.5)
        .text(card.label.toUpperCase(), cx + 10, y + 14, { lineBreak: false, characterSpacing: 0.5 });

      doc.fillColor(GRAY_900).font('Helvetica-Bold').fontSize(14)
        .text(`$${fmt(Math.abs(card.value))}`, cx + 10, y + 28, { lineBreak: false });

      // Month-over-month change
      const chg = pctChange(card.value, card.prevValue);
      if (chg) {
        const isPositive = chg.startsWith('+');
        // For expenses: positive change (higher) = bad
        const goodChange = card.isExpense ? !isPositive : isPositive;
        const chgColor = goodChange ? GREEN : RED;
        const arrow = isPositive ? '▲' : '▼';
        doc.fillColor(chgColor).font('Helvetica').fontSize(8)
          .text(`${arrow} ${chg.replace(/^[+-]/, '')} vs last month`, cx + 10, y + 54, { lineBreak: false });
      } else {
        doc.fillColor(GRAY_300).font('Helvetica').fontSize(8)
          .text('— first month', cx + 10, y + 54, { lineBreak: false });
      }
    }

    y += 90;

    // ── SAVINGS RATE BAR ─────────────────────────────────────────────────────
    const srColor = monthly.savingsRate >= 50 ? GREEN : monthly.savingsRate >= 20 ? AMBER : RED;
    const srBarW = CW * 0.72;
    const srFillW = Math.min(1, Math.max(0, monthly.savingsRate / 100)) * srBarW;

    const srNoIncome = monthly.totalIncome === 0 ? '  ·  No income this month' : '';
    doc.fillColor(GRAY_700).font('Helvetica-Bold').fontSize(8.5)
      .text(`Savings Rate: ${monthly.savingsRate}%${srNoIncome}`, M, y, { lineBreak: false });

    y += 14;
    doc.roundedRect(M, y, srBarW, 9, 4.5).fill(GRAY_200);
    if (srFillW > 4) doc.roundedRect(M, y, srFillW, 9, 4.5).fill(srColor);

    y += 26;

    // ── WEEKLY BREAKDOWN TABLE ────────────────────────────────────────────────
    if (monthly.weeklyTrends.length > 0) {
      pageBreakIfNeeded(monthly.weeklyTrends.length * 24 + 60);
      y = sectionHeader('Weekly Breakdown', y);

      // Table header
      doc.rect(M, y, CW, 18).fill(GRAY_100);
      doc.fillColor(GRAY_400).font('Helvetica-Bold').fontSize(7)
        .text('WK', M + 6, y + 5, { lineBreak: false, characterSpacing: 0.5 })
        .text('PERIOD', M + 30, y + 5, { lineBreak: false })
        .text('INCOME', M + 175, y + 5, { lineBreak: false })
        .text('EXPENSES', M + 275, y + 5, { lineBreak: false })
        .text('NET', M + 385, y + 5, { lineBreak: false })
        .text('SAVINGS %', M + 435, y + 5, { lineBreak: false });
      y += 22;

      for (const week of monthly.weeklyTrends) {
        const wDate = new Date(week.weekStart);
        const wEndDate = new Date(wDate);
        wEndDate.setDate(wEndDate.getDate() + 6);
        const wLabel = `${wDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${wEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

        const wNet = week.income - week.expenses;
        const wSR  = week.income > 0 ? Math.round(((week.income - week.expenses) / week.income) * 1000) / 10 : 0;
        const netColor = wNet >= 0 ? GREEN : RED;
        const srTxt = week.income > 0 ? `${wSR}%` : '—';

        doc.fillColor(GRAY_700).font('Helvetica-Bold').fontSize(8.5)
          .text(`${week.weekNumber}`, M + 6, y + 3, { lineBreak: false });
        doc.fillColor(GRAY_500).font('Helvetica').fontSize(8)
          .text(wLabel, M + 30, y + 3, { lineBreak: false });
        doc.fillColor(GREEN).font('Helvetica').fontSize(8.5)
          .text(`+$${fmt(week.income)}`, M + 175, y + 3, { lineBreak: false });
        doc.fillColor(RED).font('Helvetica').fontSize(8.5)
          .text(`-$${fmt(week.expenses)}`, M + 275, y + 3, { lineBreak: false });
        doc.fillColor(netColor).font('Helvetica-Bold').fontSize(8.5)
          .text(`${wNet >= 0 ? '+' : '-'}$${fmt(Math.abs(wNet))}`, M + 385, y + 3, { lineBreak: false });
        doc.fillColor(GRAY_400).font('Helvetica').fontSize(8)
          .text(srTxt, M + 440, y + 3, { lineBreak: false });

        // Row divider
        doc.strokeColor(GRAY_100).lineWidth(0.5)
          .moveTo(M, y + 18).lineTo(W - M, y + 18).stroke();

        y += 20;
      }

      y += 14;
    }

    // ── TRANSACTION HISTORY ──────────────────────────────────────────────────
    if (monthly.transactions.length > 0) {
      pageBreakIfNeeded(60);
      y = sectionHeader('Transaction History', y);

      // Column X positions
      const TX_DATE  = M;
      const TX_TYPE  = M + 52;
      const TX_NOTE  = M + 100;
      const TX_CAT   = M + 248;
      const TX_ACC   = M + 358;
      const TX_AMT   = W - M - 2; // right-aligned

      // Table column headers
      doc.rect(M, y, CW, 16).fill(GRAY_100);
      doc.fillColor(GRAY_400).font('Helvetica-Bold').fontSize(6.5)
        .text('DATE',    TX_DATE, y + 4, { lineBreak: false, characterSpacing: 0.4 })
        .text('TYPE',    TX_TYPE, y + 4, { lineBreak: false, characterSpacing: 0.4 })
        .text('NOTE / DESCRIPTION', TX_NOTE, y + 4, { lineBreak: false, characterSpacing: 0.4 })
        .text('CATEGORY',  TX_CAT, y + 4, { lineBreak: false, characterSpacing: 0.4 })
        .text('ACCOUNT',   TX_ACC, y + 4, { lineBreak: false, characterSpacing: 0.4 })
        .text('AMOUNT',    TX_AMT - 40, y + 4, { lineBreak: false, characterSpacing: 0.4 });
      y += 20;

      // Group transactions by week
      for (const week of monthly.weeklyTrends) {
        const wStart = new Date(week.weekStart);
        const wEnd   = new Date(wStart);
        wEnd.setDate(wEnd.getDate() + 6);
        wEnd.setHours(23, 59, 59, 999);

        const weekTxns = monthly.transactions.filter((t) => {
          const d = new Date(t.date);
          return d >= wStart && d <= wEnd;
        });

        // Week group header
        pageBreakIfNeeded(22);
        const wLabel = `Week ${week.weekNumber}  ·  ${wStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${wEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        const wNet   = week.income - week.expenses;
        const wNetColor = wNet >= 0 ? GREEN : RED;

        doc.rect(M, y, CW, 16).fill('#f5f3ff');
        doc.fillColor(PURPLE).font('Helvetica-Bold').fontSize(7.5)
          .text(wLabel, M + 6, y + 4, { lineBreak: false });
        doc.fillColor(wNetColor).font('Helvetica-Bold').fontSize(7.5)
          .text(`${wNet >= 0 ? '+' : '-'}$${fmt(Math.abs(wNet))} net`, TX_AMT - 60, y + 4, { lineBreak: false });
        y += 18;

        if (weekTxns.length === 0) {
          doc.fillColor(GRAY_400).font('Helvetica').fontSize(7.5)
            .text('No transactions this week', M + 6, y + 2, { lineBreak: false });
          y += 16;
        } else {
          for (const tx of weekTxns) {
            pageBreakIfNeeded(17);

            const isIncome  = tx.type === 'income';
            const txColor   = isIncome ? GREEN : RED;
            const txSign    = isIncome ? '+' : '-';
            const txDate    = new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const txType    = isIncome ? 'Income' : 'Expense';
            const txNote    = (tx.note || '—').substring(0, 28);
            const txCat     = safeLabel(tx.categoryLabel, tx.categoryName).substring(0, 16);
            const txAcc     = tx.accountName.substring(0, 14);

            doc.fillColor(GRAY_700).font('Helvetica').fontSize(8)
              .text(txDate, TX_DATE, y + 3, { lineBreak: false });
            doc.fillColor(txColor).font('Helvetica').fontSize(7.5)
              .text(txType, TX_TYPE, y + 3, { lineBreak: false });
            doc.fillColor(GRAY_700).font('Helvetica').fontSize(8)
              .text(txNote, TX_NOTE, y + 3, { lineBreak: false });
            doc.fillColor(GRAY_500).font('Helvetica').fontSize(7.5)
              .text(txCat, TX_CAT, y + 3, { lineBreak: false });
            doc.fillColor(GRAY_400).font('Helvetica').fontSize(7.5)
              .text(txAcc, TX_ACC, y + 3, { lineBreak: false });
            doc.fillColor(txColor).font('Helvetica-Bold').fontSize(8.5)
              .text(`${txSign}$${fmt(tx.amount)}`, TX_AMT - 60, y + 3, { lineBreak: false, width: 62, align: 'right' });

            // Row separator
            doc.strokeColor(GRAY_100).lineWidth(0.4)
              .moveTo(M, y + 15).lineTo(W - M, y + 15).stroke();
            y += 16;
          }
        }

        y += 4; // gap between weeks
      }

      y += 10;
    }

    // ── SPENDING BY CATEGORY ─────────────────────────────────────────────────
    if (monthly.categoryBreakdown.length > 0) {
      pageBreakIfNeeded(monthly.categoryBreakdown.length * 24 + 60);
      y = sectionHeader('Spending by Category', y);

      const maxAmt = monthly.categoryBreakdown[0].amount;
      const barAreaW = CW - 210; // 120 label + bar + 90 value+pct

      for (const cat of monthly.categoryBreakdown.slice(0, 10)) {
        const displayName = safeLabel(cat.label, cat.categoryName);
        const barFillW = maxAmt > 0 ? Math.max(4, (cat.amount / maxAmt) * barAreaW) : 4;
        const barColor = cat.color && /^#[0-9a-fA-F]{6}$/.test(cat.color) ? cat.color : PURPLE;

        // Label
        doc.fillColor(GRAY_700).font('Helvetica').fontSize(8.5)
          .text(displayName.substring(0, 18), M, y + 4, { lineBreak: false, width: 112 });

        // Bar track
        doc.roundedRect(M + 120, y, barAreaW, 14, 3).fill(GRAY_100);
        // Bar fill
        doc.roundedRect(M + 120, y, barFillW, 14, 3).fill(barColor);

        // Amount + percent
        doc.fillColor(GRAY_900).font('Helvetica-Bold').fontSize(8.5)
          .text(`$${fmt(cat.amount)}`, M + 120 + barAreaW + 6, y + 1, { lineBreak: false });
        doc.fillColor(GRAY_400).font('Helvetica').fontSize(7.5)
          .text(`${cat.percentage}%  ·  ${cat.transactionCount} txn${cat.transactionCount !== 1 ? 's' : ''}`, M + 120 + barAreaW + 6, y + 13, { lineBreak: false });

        y += 26;
      }

      // Total expenses footnote
      doc.fillColor(GRAY_400).font('Helvetica').fontSize(8)
        .text(`Total expenses: $${fmt(monthly.totalExpenses)} across ${monthly.categoryBreakdown.length} categor${monthly.categoryBreakdown.length !== 1 ? 'ies' : 'y'}`, M, y, { lineBreak: false });
      y += 20;
    }

    // ── ACCOUNT BALANCES ─────────────────────────────────────────────────────
    if (accounts.length > 0) {
      pageBreakIfNeeded(accounts.length * 22 + 80);
      y = sectionHeader('Account Balances', y);

      // Header row
      doc.rect(M, y, CW, 18).fill(GRAY_100);
      doc.fillColor(GRAY_400).font('Helvetica-Bold').fontSize(7)
        .text('ACCOUNT', M + 8, y + 5, { lineBreak: false, characterSpacing: 0.5 })
        .text('TYPE', M + CW * 0.5, y + 5, { lineBreak: false })
        .text('BALANCE', W - M - 80, y + 5, { lineBreak: false });
      y += 22;

      for (const acc of accounts) {
        const typeLabel = acc.type.charAt(0).toUpperCase() + acc.type.slice(1);

        doc.fillColor(GRAY_900).font('Helvetica').fontSize(9)
          .text(acc.name, M + 8, y + 2, { lineBreak: false, width: CW * 0.45 });
        doc.fillColor(GRAY_500).font('Helvetica').fontSize(8.5)
          .text(typeLabel, M + CW * 0.5, y + 2, { lineBreak: false });
        doc.fillColor(GRAY_900).font('Helvetica-Bold').fontSize(9)
          .text(`$${fmt(acc.balance)}`, W - M - 80, y + 2, { lineBreak: false });

        doc.strokeColor(GRAY_100).lineWidth(0.5)
          .moveTo(M, y + 18).lineTo(W - M, y + 18).stroke();
        y += 20;
      }

      // Total row
      const totalBal2 = accounts.reduce((s, a) => s + a.balance, 0);
      doc.roundedRect(M, y + 4, CW, 22, 4).fill(PURPLE_PALE);
      doc.fillColor(PURPLE).font('Helvetica-Bold').fontSize(9)
        .text('TOTAL BALANCE', M + 8, y + 10, { lineBreak: false });
      doc.fillColor(PURPLE_DARK).font('Helvetica-Bold').fontSize(10)
        .text(`$${fmt(totalBal2)}`, W - M - 80, y + 10, { lineBreak: false });

      y += 40;
    }

    // ── INSIGHT CALLOUT ───────────────────────────────────────────────────────
    pageBreakIfNeeded(64);
    y += 4;

    let insight = '';
    if (monthly.netBalance < 0) {
      insight = `You spent $${fmt(Math.abs(monthly.netBalance))} more than you earned this month. Review your top spending categories and set limits for next month.`;
    } else if (monthly.savingsRate >= 50) {
      insight = `Outstanding! You saved ${monthly.savingsRate}% of your income this month — a $${fmt(monthly.netBalance)} surplus. Keep this momentum going!`;
    } else if (monthly.savingsRate >= 25) {
      insight = `Good work! A ${monthly.savingsRate}% savings rate puts you ahead of most. Aim to hit 50% next month.`;
    } else if (monthly.totalIncome === 0) {
      insight = `No income recorded this month. Log your income so Finance GM can calculate your savings rate and trends.`;
    } else {
      insight = `Your savings rate of ${monthly.savingsRate}% is building up. Target 30%+ next month by trimming your top spending categories.`;
    }

    doc.roundedRect(M, y, CW, 52, 6).fill(GRAY_50);
    doc.rect(M, y, 4, 52).fill(PURPLE);
    doc.fillColor(PURPLE).font('Helvetica-Bold').fontSize(8.5)
      .text('Monthly Insight', M + 14, y + 10, { lineBreak: false });
    doc.fillColor(GRAY_700).font('Helvetica').fontSize(8.5)
      .text(insight, M + 14, y + 24, { width: CW - 24, lineBreak: true });

    y += 68;

    // ── FOOTER ────────────────────────────────────────────────────────────────
    const footerY = Math.max(y + 16, 808);
    doc.rect(0, footerY, W, 34).fill(GRAY_50);
    doc.strokeColor(GRAY_200).lineWidth(0.5)
      .moveTo(0, footerY).lineTo(W, footerY).stroke();
    doc.fillColor(GRAY_400).font('Helvetica').fontSize(7.5)
      .text(
        `Generated by Finance GM  ·  ${monthName} ${monthly.year}  ·  All amounts in USD  ·  Data is for personal reference only`,
        M, footerY + 10,
        { width: CW, align: 'center', lineBreak: false },
      );

    doc.end();
  });
}
