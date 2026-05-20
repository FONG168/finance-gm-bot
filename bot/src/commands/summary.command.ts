import { Context } from 'telegraf';
import { prisma } from '../lib/prisma';
import { analyticsService } from '../services/analytics.service';

function getMotivation(savingsRate: number, netBalance: number): string {
  if (netBalance < 0) return "You're overspending this week. Time to cut back! 💪";
  if (savingsRate >= 50) return "Incredible savings rate! You're crushing it! 🏆";
  if (savingsRate >= 30) return "You're crushing it this week! 💚";
  if (savingsRate >= 20) return "You're saving strong this week! 💪";
  if (savingsRate >= 10) return "Good progress! Keep it up this week! 👍";
  return "Every dollar counts. Keep tracking! 📊";
}

export async function summaryCommand(ctx: Context): Promise<void> {
  const telegramId = ctx.from!.id;

  try {
    const user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });
    if (!user) {
      await ctx.reply('Please start the bot first with /start');
      return;
    }

    const [summary, accounts] = await Promise.all([
      analyticsService.getWeeklySummary(user.id),
      (prisma as any).account.findMany({
        where: { userId: user.id, isArchived: false },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      }) as Promise<any[]>,
    ]);

    const weekStart = new Date(summary.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const weekEnd   = new Date(summary.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const netSign   = summary.netBalance >= 0 ? '+' : '-';
    const motivation = getMotivation(summary.savingsRate, summary.netBalance);

    let categoryLines = '';
    for (const cat of summary.categoryBreakdown.slice(0, 5)) {
      categoryLines += `• ${cat.label}: $${cat.amount.toFixed(2)}\n`;
    }

    let accountLines = '';
    if (accounts.length > 0) {
      const totalAssets = accounts.reduce((s: number, a: any) => s + Number(a.balance), 0);
      for (const acc of accounts) {
        accountLines += `${acc.icon} *${acc.name}:* $${Number(acc.balance).toFixed(2)}\n`;
      }
      accountLines = `\n*💼 Accounts (Total: $${totalAssets.toFixed(2)})*\n` + accountLines;
    }

    const message =
      `📊 *Weekly Finance Summary* (${weekStart} - ${weekEnd})\n\n` +
      `*Income:* $${summary.totalIncome.toFixed(2)}\n` +
      `*Expenses:* $${summary.totalExpenses.toFixed(2)}\n` +
      `*Net:* ${netSign}$${Math.abs(summary.netBalance).toFixed(2)}\n` +
      (categoryLines
        ? `\n*By Category:*\n${categoryLines}`
        : '\nNo expenses logged this week.\n') +
      accountLines +
      `\n${motivation}`;

    const webAppUrl = process.env.FRONTEND_URL!;
    const isProd = webAppUrl.startsWith('https://');

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: isProd
        ? ({
            keyboard: [[{ text: '📱 Open Dashboard', web_app: { url: webAppUrl } }]],
            resize_keyboard: true,
            persistent: true,
          } as any)
        : undefined,
    });
  } catch (error) {
    console.error('Summary command error:', error);
    await ctx.reply('❌ Failed to generate summary. Please try again.');
  }
}
