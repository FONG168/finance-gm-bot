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
    const isProd = webAppUrl?.startsWith('https://');

    const tok = crypto.createHmac('sha256', process.env.BOT_TOKEN!)
      .update(`telegramId:${user.id}`)
      .digest('hex');
    const appUrl = isProd ? `${webAppUrl}?uid=${user.id}&tok=${tok}` : webAppUrl;

    // Clear any persistent bottom reply keyboards (the black bar)
    const cleanMsg = await ctx.reply('🧹 Syncing...', {
      reply_markup: { remove_keyboard: true }
    });
    await ctx.telegram.deleteMessage(ctx.chat!.id, cleanMsg.message_id).catch(() => {});

    // Explicitly update the chat menu button for this chat
    if (isProd) {
      await ctx.setChatMenuButton({
        type: 'web_app',
        text: '💰 ' + (lang === 'km' ? 'បើក Dashboard' : lang === 'zh' ? '打开 Dashboard' : 'Open Dashboard'),
        web_app: { url: appUrl }
      }).catch((e) => console.error('Failed to set chat menu button:', e));
    }

    const weeklyBtn = { text: '📊 ' + (lang === 'km' ? 'សង្ខេបសប្តាហ៍' : lang === 'zh' ? '每周摘要' : 'Weekly Summary'), callback_data: 'weekly_summary' };
    const reportBtn = { text: '📄 ' + (lang === 'km' ? 'របាយការណ៍ខែ' : lang === 'zh' ? '月度报告' : 'Monthly Report'), callback_data: 'monthly_report' };
    const langBtn = { text: '🌐 ' + (lang === 'km' ? 'ភាសា' : lang === 'zh' ? '语言' : 'Language'), callback_data: 'lang_choose' };

    await ctx.reply(tr.welcome(user.first_name), {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: isProd
          ? [
              [{ text: tr.openDashboard, web_app: { url: appUrl } }],
              [weeklyBtn, reportBtn],
              [langBtn],
            ]
          : [
              [weeklyBtn, reportBtn],
              [langBtn],
            ]
      }
    });
  } catch (error) {
    console.error('Start command error:', error);
    await ctx.reply('❌ Something went wrong. Please try again.');
  }
}
