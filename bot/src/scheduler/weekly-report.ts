import cron from 'node-cron';
import { Telegraf } from 'telegraf';
import { prisma } from '../lib/prisma';
import { analyticsService } from '../services/analytics.service';
import { t, resolveLang } from '../i18n';

export function startWeeklyReportScheduler(bot: Telegraf): void {
  // Every Monday at 09:00 Asia/Phnom_Penh (UTC+7) = 02:00 UTC
  cron.schedule('0 2 * * 1', async () => {
    console.log('📅 Sending weekly reports...');

    const users = await prisma.user.findMany({ where: { isActive: true } });
    const webAppUrl = process.env.FRONTEND_URL!;
    const isProd = webAppUrl.startsWith('https://');

    for (const user of users) {
      try {
        const summary = await analyticsService.getWeeklySummary(user.id);
        if (summary.transactionCount === 0) continue;

        const lang = resolveLang(user.preferredLanguage);
        const tr = t(lang);

        const weekStart = new Date(summary.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const weekEnd   = new Date(summary.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const netSign   = summary.netBalance >= 0 ? '+' : '-';

        let categoryLines = '';
        for (const cat of summary.categoryBreakdown.slice(0, 5)) {
          categoryLines += `• ${cat.label}: $${cat.amount.toFixed(2)}\n`;
        }

        const message =
          `${tr.summaryTitle(weekStart, weekEnd)}\n\n` +
          `${tr.summaryIncome} $${summary.totalIncome.toFixed(2)}\n` +
          `${tr.summaryExpenses} $${summary.totalExpenses.toFixed(2)}\n` +
          `${tr.summaryNet} ${netSign}$${Math.abs(summary.netBalance).toFixed(2)}\n` +
          (categoryLines ? `${tr.summaryByCategory}${categoryLines}` : tr.summaryNoExpenses) +
          `\n${tr.motivation(summary.savingsRate, summary.netBalance)}`;

        await bot.telegram.sendMessage(Number(user.telegramId), message, {
          parse_mode: 'Markdown',
          reply_markup: isProd
            ? ({
                keyboard: [[{ text: tr.openDashboard, web_app: { url: webAppUrl } }]],
                resize_keyboard: true,
                persistent: true,
              } as any)
            : undefined,
        });

        console.log(`✅ Report sent to user ${user.firstName} (${lang})`);
      } catch (error) {
        console.error(`Failed to send report to user ${user.firstName}:`, error);
      }
    }
  });

  console.log('📅 Weekly report scheduler started (every Monday 09:00 ICT)');
}
