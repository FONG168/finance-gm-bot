import { Context } from 'telegraf';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';

export async function startCommand(ctx: Context): Promise<void> {
  const user = ctx.from!;

  try {
    await prisma.user.upsert({
      where: { telegramId: BigInt(user.id) },
      update: {
        firstName: user.first_name,
        lastName: user.last_name || null,
        username: user.username || null,
      },
      create: {
        telegramId: BigInt(user.id),
        firstName: user.first_name,
        lastName: user.last_name || null,
        username: user.username || null,
        languageCode: user.language_code || null,
      },
    });

    const webAppUrl = process.env.FRONTEND_URL!;
    const isProd = process.env.NODE_ENV === 'production' && webAppUrl?.startsWith('https://');

    // Stable signed token so Desktop users can auth without initData
    const tok = crypto.createHmac('sha256', process.env.BOT_TOKEN!)
      .update(`telegramId:${user.id}`)
      .digest('hex');
    const appUrl = isProd ? `${webAppUrl}?uid=${user.id}&tok=${tok}` : webAppUrl;
    const firstName = user.first_name;

    const text =
      `👋 <b>Welcome to Finance GM, ${firstName}!</b>\n\n` +
      `I'm your personal AI finance assistant.\n` +
      `Track every dollar. Build better habits. 💚\n\n` +
      `<b>What I can do:</b>\n` +
      `📊 Track expenses &amp; income\n` +
      `📈 Weekly &amp; monthly reports\n` +
      `🏆 Category spending insights\n` +
      `🤖 Natural language logging\n\n` +
      `<b>Quick expense logging:</b>\n` +
      `Just type naturally:\n` +
      `• <i>"Spent $12 on lunch"</i>\n` +
      `• <i>"Paid $50 for groceries"</i>\n` +
      `• <i>"Earned $500 freelance"</i>\n\n` +
      `<b>Commands:</b>\n` +
      `/summary — This week's report\n` +
      `/report  — Monthly report\n` +
      `/help    — Show all commands\n\n` +
      `Ready to crush your finances? 🚀`;

    // Persistent bottom keyboard with Open Dashboard (production + HTTPS only)
    const replyMarkup = isProd
      ? {
          keyboard: [[{ text: '📱 Open Dashboard', web_app: { url: appUrl } }]],
          resize_keyboard: true,
          persistent: true,
        }
      : undefined;

    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    });
  } catch (error) {
    console.error('Start command error:', error);
    await ctx.reply('❌ Something went wrong. Please try again.');
  }
}
