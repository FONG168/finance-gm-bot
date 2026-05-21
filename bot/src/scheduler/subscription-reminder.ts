import cron from 'node-cron';
import { Telegraf } from 'telegraf';
import { prisma } from '../lib/prisma';

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

const DIV = '━━━━━━━━━━━━━━━━━━';

export function startSubscriptionReminderScheduler(bot: Telegraf): void {
  // Run daily at 09:00 Asia/Phnom_Penh (UTC+7) = 02:00 UTC
  cron.schedule('0 2 * * *', async () => {
    console.log('🔔 Checking subscription expiries...');

    const now = new Date();

    // Find users expiring in 3 days or 1 day
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
          const expiryDate = formatDate(user.premiumExpiresAt!);
          const urgency = daysLeft === 1 ? '🚨' : '⚠️';
          const dayLabel = daysLeft === 1 ? 'tomorrow' : 'in 3 days';

          const message =
            `${urgency} <b>Subscription Expiring ${daysLeft === 1 ? 'Tomorrow' : 'in 3 Days'}</b>\n${DIV}\n\n` +
            `Your Finance GM Premium subscription expires <b>${dayLabel}</b>.\n\n` +
            `  Expires on   <code>${expiryDate}</code>\n\n` +
            `${DIV}\n\n` +
            `Renew now to keep tracking your finances without interruption.`;

          const appUrl = process.env.FRONTEND_URL || 'https://t.me/kh_mart_finance_bot';

          await bot.telegram.sendMessage(Number(user.telegramId), message, {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [[{ text: '💳 Renew Subscription', web_app: { url: `${appUrl}/settings` } }]],
            },
          } as any);

          console.log(`✅ Reminder sent to ${user.firstName} (${daysLeft}d left)`);
        } catch (err) {
          console.error(`Failed to send reminder to ${user.firstName}:`, err);
        }
      }
    }
  });

  console.log('🔔 Subscription reminder scheduler started (daily 09:00 ICT)');
}
