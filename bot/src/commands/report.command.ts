import { Context } from 'telegraf';
import { prisma } from '../lib/prisma';
import { analyticsService } from '../services/analytics.service';
import { generateMonthlyPDF, AccountRow } from '../services/pdf-report.service';
import { t, resolveLang } from '../i18n';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const DIV = '━━━━━━━━━━━━━━';

function fmt(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function reportCommand(ctx: Context): Promise<void> {
  const telegramId = ctx.from!.id;

  try {
    const user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });
    if (!user) { await ctx.reply('Please start the bot first with /start'); return; }

    const lang = resolveLang(user.preferredLanguage);
    const tr = t(lang);

    // Notify user we're generating
    await ctx.reply('📊 Generating your monthly report…', { parse_mode: 'HTML' });

    const now = new Date();
    const thisMonth  = now.getMonth() + 1;
    const thisYear   = now.getFullYear();

    // Compute prev month
    const prevMonth = thisMonth === 1 ? 12 : thisMonth - 1;
    const prevYear  = thisMonth === 1 ? thisYear - 1 : thisYear;

    const [monthly, prevMonthly, accounts] = await Promise.all([
      analyticsService.getMonthlySummary(user.id, thisMonth, thisYear),
      analyticsService.getMonthlySummary(user.id, prevMonth, prevYear),
      (prisma as any).account.findMany({
        where: { userId: user.id, isArchived: false },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      }) as Promise<any[]>,
    ]);

    const monthName  = MONTH_NAMES[thisMonth - 1];
    const isPositive = monthly.netBalance >= 0;
    const netSign    = isPositive ? '+' : '-';

    // ── Inline text summary ──────────────────────────────────────────────────
    const totalAccBal = accounts.reduce((s: number, a: any) => s + Number(a.balance), 0);

    const message =
      `📈 <b>Monthly Finance Report — ${monthName} ${thisYear}</b>\n` +
      `${DIV}\n\n` +
      `🟢 <b>Income</b>      <code>+$${fmt(monthly.totalIncome)}</code>\n` +
      `🔴 <b>Expenses</b>    <code>-$${fmt(monthly.totalExpenses)}</code>\n` +
      `${isPositive ? '💚' : '🔥'} <b>Net</b>         <code>${netSign}$${fmt(Math.abs(monthly.netBalance))}</code>\n` +
      `📊 <b>Savings Rate</b> <code>${monthly.savingsRate}%</code>\n\n` +
      `${DIV}\n` +
      (monthly.weeklyTrends.length > 0
        ? `📅 <b>By Week</b>\n` +
          monthly.weeklyTrends.map((w) => {
            const wNet = w.income - w.expenses;
            const wSign = wNet >= 0 ? '💚' : '🔥';
            return `  Week ${w.weekNumber}  <code>${wSign} ${wNet >= 0 ? '+' : '-'}$${fmt(Math.abs(wNet))}</code>`;
          }).join('\n') + '\n\n' +
          `${DIV}\n`
        : '') +
      (monthly.categoryBreakdown.length > 0
        ? `📂 <b>Top Categories</b>\n` +
          monthly.categoryBreakdown.slice(0, 5).map((c) =>
            `  ${c.icon || '📌'} ${safeLabel(c.label, c.categoryName)}  <code>$${fmt(c.amount)}</code> <i>${c.percentage}%</i>`
          ).join('\n') + '\n\n' +
          `${DIV}\n`
        : '') +
      (accounts.length > 0
        ? `💼 <b>Total Assets</b>  <code>$${fmt(totalAccBal)}</code>\n` +
          accounts.map((a: any) => `  ${a.icon} ${a.name}  <code>$${fmt(Number(a.balance))}</code>`).join('\n') + '\n\n'
        : '') +
      tr.motivation(monthly.savingsRate, monthly.netBalance) + '\n\n' +
      `<i>📎 Full PDF report attached below</i>`;

    const webAppUrl = process.env.FRONTEND_URL!;
    const isProd = webAppUrl?.startsWith('https://');

    await ctx.reply(message, {
      parse_mode: 'HTML',
      reply_markup: isProd
        ? ({
            keyboard: [[{ text: tr.openDashboard, web_app: { url: webAppUrl } }]],
            resize_keyboard: true,
            persistent: true,
          } as any)
        : undefined,
    });

    // ── Generate and send PDF ────────────────────────────────────────────────
    const accountRows: AccountRow[] = accounts.map((a: any) => ({
      name: a.name,
      type: a.type,
      balance: Number(a.balance),
      icon: a.icon,
    }));

    const pdfBuffer = await generateMonthlyPDF({
      monthly,
      prevMonthly: prevMonthly.totalIncome === 0 && prevMonthly.totalExpenses === 0
        ? undefined
        : prevMonthly,
      accounts: accountRows,
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
    });

    const filename = `finance-report-${thisYear}-${String(thisMonth).padStart(2, '0')}.pdf`;
    await ctx.replyWithDocument({ source: pdfBuffer, filename });

  } catch (error) {
    console.error('Report command error:', error);
    const lang = resolveLang(undefined);
    await ctx.reply(t(lang).summaryFailed);
  }
}

function safeLabel(label: string, fallback: string): string {
  const clean = label.replace(/[^\x00-\x7F]/g, '').trim();
  return clean || (fallback.charAt(0).toUpperCase() + fallback.slice(1));
}
