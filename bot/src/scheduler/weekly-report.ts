import cron from 'node-cron';
import { Telegraf } from 'telegraf';
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

export function startWeeklyReportScheduler(bot: Telegraf): void {
  // Every Monday at 09:00
  cron.schedule('0 9 * * 1', async () => {
    console.log('📅 Sending weekly reports...');

    const users = await prisma.user.findMany({ where: { isActive: true } });
    const webAppUrl = process.env.FRONTEND_URL!;
    const isProd = webAppUrl.startsWith('https://');

    for (const user of users) {
      try {
        const summary = await analyticsService.getWeeklySummary(user.id);
        if (summary.transactionCount === 0) continue;

        const weekStart = new Date(summary.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const weekEnd   = new Date(summary.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const netSign   = summary.netBalance >= 0 ? '+' : '-';
        const motivation = getMotivation(summary.savingsRate, summary.netBalance);

        let categoryLines = '';
        for (const cat of summary.categoryBreakdown.slice(0, 5)) {
          categoryLines += `• ${cat.label}: $${cat.amount.toFixed(2)}\n`;
        }

        const message =
          `📊 *Weekly Finance Summary* (${weekStart} - ${weekEnd})\n\n` +
          `*Income:* $${summary.totalIncome.toFixed(2)}\n` +
          `*Expenses:* $${summary.totalExpenses.toFixed(2)}\n` +
          `*Net:* ${netSign}$${Math.abs(summary.netBalance).toFixed(2)}\n` +
          (categoryLines ? `\n*By Category:*\n${categoryLines}` : '\n') +
          `\n${motivation}`;

        await bot.telegram.sendMessage(Number(user.telegramId), message, {
          parse_mode: 'Markdown',
          reply_markup: isProd
            ? ({
                keyboard: [[{ text: '📱 Open Dashboard', web_app: { url: webAppUrl } }]],
                resize_keyboard: true,
                persistent: true,
              } as any)
            : undefined,
        });

        console.log(`✅ Report sent to user ${user.firstName}`);
      } catch (error) {
        console.error(`Failed to send report to user ${user.firstName}:`, error);
      }
    }
  });

  console.log('📅 Weekly report scheduler started (every Monday 09:00)');
}
