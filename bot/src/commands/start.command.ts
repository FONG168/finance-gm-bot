import { Context } from 'telegraf';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { t, resolveLang } from '../i18n';

export async function startCommand(ctx: Context): Promise<void> {
  const user = ctx.from!;

  try {
    const dbUser = await prisma.user.upsert({
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
        preferredLanguage: 'km',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    const lang = resolveLang(dbUser.preferredLanguage);
    const tr = t(lang);

    const webAppUrl = process.env.FRONTEND_URL!;
    const isProd = process.env.NODE_ENV === 'production' && webAppUrl?.startsWith('https://');

    const tok = crypto.createHmac('sha256', process.env.BOT_TOKEN!)
      .update(`telegramId:${user.id}`)
      .digest('hex');
    const appUrl = isProd ? `${webAppUrl}?uid=${user.id}&tok=${tok}` : webAppUrl;

    const replyMarkup = isProd
      ? {
          keyboard: [[{ text: tr.openDashboard, web_app: { url: appUrl } }]],
          resize_keyboard: true,
          persistent: true,
        }
      : undefined;

    await ctx.reply(tr.welcome(user.first_name), {
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    });
  } catch (error) {
    console.error('Start command error:', error);
    await ctx.reply('❌ Something went wrong. Please try again.');
  }
}
