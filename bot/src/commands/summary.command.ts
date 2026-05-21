import { Context } from 'telegraf';
import { prisma } from '../lib/prisma';
import { analyticsService } from '../services/analytics.service';
import { t, resolveLang } from '../i18n';

const CAT_ICON: Record<string, string> = {
  transport: '🚗', entertainment: '🎮', food: '🍽', health: '❤️',
  shopping: '🛍', bills: '📋', salary: '💼', freelance: '💻',
  investment: '📈', other: '📌',
};

const DIV = '━━━━━━━━━━━━━━';

function fmt(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function summaryCommand(ctx: Context): Promise<void> {
  const telegramId = ctx.from!.id;

  try {
    const user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });
    if (!user) { await ctx.reply('Please start the bot first with /start'); return; }

    const lang = resolveLang(user.preferredLanguage);
    const tr = t(lang);

    const [summary, accounts] = await Promise.all([
      analyticsService.getWeeklySummary(user.id),
      (prisma as any).account.findMany({
        where: { userId: user.id, isArchived: false },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      }) as Promise<any[]>,
    ]);

    const weekStart = new Date(summary.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const weekEnd   = new Date(summary.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const isPositive = summary.netBalance >= 0;
    const netSign    = isPositive ? '+' : '-';

    // ── Overview block ──────────────────────────────────────────────────────
    const overviewBlock =
      `🟢 <b>${tr.incomeLabel}</b>   <code>+$${fmt(summary.totalIncome)}</code>\n` +
      `🔴 <b>${tr.expensesLabel}</b>  <code>-$${fmt(summary.totalExpenses)}</code>\n` +
      `${isPositive ? '💚' : '🔥'} <b>${tr.netLabel}</b>      <code>${netSign}$${fmt(Math.abs(summary.netBalance))}</code>`;

    // ── Category block ──────────────────────────────────────────────────────
    let categoryBlock = '';
    if (summary.categoryBreakdown.length > 0) {
      for (const cat of summary.categoryBreakdown.slice(0, 5)) {
        const icon = CAT_ICON[cat.categoryName] ?? '📌';
        categoryBlock += `${icon} ${cat.label}  <code>$${fmt(cat.amount)}</code>\n`;
      }
    } else {
      categoryBlock = `<i>${tr.summaryNoExpenses.trim()}</i>\n`;
    }

    // ── Accounts block ──────────────────────────────────────────────────────
    let accountBlock = '';
    if (accounts.length > 0) {
      const total = accounts.reduce((s: number, a: any) => s + Number(a.balance), 0);
      accountBlock =
        `💼 <b>${tr.accountsLabel}</b>  <code>$${fmt(total)}</code>\n` +
        accounts.map((a: any) =>
          `${a.icon} ${a.name}  <code>$${fmt(Number(a.balance))}</code>`
        ).join('\n') + '\n';
    }

    // ── Assemble ────────────────────────────────────────────────────────────
    const message =
      `📊 <b>${tr.summaryTitle(weekStart, weekEnd)}</b>\n` +
      `${DIV}\n\n` +
      `${overviewBlock}\n\n` +
      `${DIV}\n` +
      `📂 <b>${tr.categoriesLabel}</b>\n` +
      `${categoryBlock}\n` +
      `${DIV}\n` +
      `${accountBlock}\n` +
      `${tr.motivation(summary.savingsRate, summary.netBalance)}`;

    const webAppUrl = process.env.FRONTEND_URL!;
    const isProd = webAppUrl.startsWith('https://');

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
  } catch (error) {
    console.error('Summary command error:', error);
    const lang = resolveLang(undefined);
    await ctx.reply(t(lang).summaryFailed);
  }
}
