import cron from 'node-cron';
import { Telegraf } from 'telegraf';
import { prisma } from '../lib/prisma';
import { t, resolveLang } from '../i18n';

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function startSubscriptionReminderScheduler(bot: Telegraf): void {
  // Run daily at 09:00 Asia/Phnom_Penh (UTC+7) = 02:00 UTC
  cron.schedule('0 2 * * *', async () => {
    console.log('🔔 Checking subscription expiries...');

    const now = new Date();

    for (const daysLeft of [3, 1]) {
      const targetStart = new Date(now);
      targetStart.setDate(targetStart.getDate() + daysLeft);
      targetStart.setHours(0, 0, 0, 0);

      const targetEnd = new Date(targetStart);
      targetEnd.setHours(23, 59, 59, 999);

      const users = await prisma.user.findMany({
        where: {
          subscriptionStatus: 'ACTIVE',
          premiumExpiresAt: { gte: targetStart, lte: targetEnd },
        },
      });

      for (const user of users) {
        try {
          const lang = resolveLang(user.preferredLanguage);
          const tr = t(lang);
          const expiryDate = formatDate(user.premiumExpiresAt!);
          const appUrl = process.env.FRONTEND_URL || 'https://t.me/kh_mart_finance_bot';

          await bot.telegram.sendMessage(
            Number(user.telegramId),
            tr.subscriptionExpiring(daysLeft, expiryDate),
            {
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [[
                  { text: tr.renewButton, web_app: { url: `${appUrl}/settings` } },
                ]],
              },
            } as any,
          );

          console.log(`✅ Reminder sent to ${user.firstName} [${lang}] (${daysLeft}d left)`);
        } catch (err) {
          console.error(`Failed to send reminder to ${user.firstName}:`, err);
        }
      }
    }
  });

  console.log('🔔 Subscription reminder scheduler started (daily 09:00 ICT)');
}
