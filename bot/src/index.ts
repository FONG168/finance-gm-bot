import 'dotenv/config';
import { Telegraf, session } from 'telegraf';
import { startCommand } from './commands/start.command';
import { summaryCommand } from './commands/summary.command';
import { reportCommand } from './commands/report.command';
import { languageCommand, handleLangCallback } from './commands/language.command';
import { handleTextMessage } from './handlers/message.handler';
import { startWeeklyReportScheduler } from './scheduler/weekly-report';
import { startSubscriptionReminderScheduler } from './scheduler/subscription-reminder';
import { prisma } from './lib/prisma';
import { t, resolveLang } from './i18n';

const bot = new Telegraf(process.env.BOT_TOKEN!);

// Session middleware
bot.use(session());

// Commands
bot.command('start', startCommand);
bot.command('summary', summaryCommand);
bot.command('report', reportCommand);
bot.command('language', languageCommand);
bot.command('lang', languageCommand); // alias

bot.command('help', async (ctx) => {
  const user = await prisma.user.findUnique({ where: { telegramId: BigInt(ctx.from!.id) } });
  const lang = resolveLang(user?.preferredLanguage);
  const tr = t(lang);
  const webAppUrl = process.env.FRONTEND_URL!;
  const isProd = process.env.NODE_ENV === 'production' && webAppUrl?.startsWith('https://');
  await ctx.reply(tr.help(), {
    parse_mode: 'HTML',
    reply_markup: isProd
      ? { inline_keyboard: [[{ text: tr.openDashboard, web_app: { url: webAppUrl } }]] }
      : undefined,
  });
});

// Language selection callbacks
bot.action('lang_km', (ctx) => handleLangCallback(ctx as any, 'km'));
bot.action('lang_zh', (ctx) => handleLangCallback(ctx as any, 'zh'));
bot.action('lang_en', (ctx) => handleLangCallback(ctx as any, 'en'));

// Weekly summary button
bot.action('weekly_summary', async (ctx) => {
  await ctx.answerCbQuery();
  await summaryCommand(ctx as any);
});

bot.action('help', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Use /help for the full command list.');
});

// Handle free-text transaction messages
bot.on('text', handleTextMessage);

// Error handling
bot.catch((err, ctx) => {
  console.error(`Bot error for ${ctx.updateType}:`, err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM: shutting down bot...');
  bot.stop('SIGTERM');
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  console.log('SIGINT: shutting down bot...');
  bot.stop('SIGINT');
  await prisma.$disconnect();
});

async function start() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Register slash-command list (shows when user types /)
    const commandsEn = [
      { command: 'start',    description: '👋 Welcome & open Dashboard' },
      { command: 'summary',  description: '📊 Weekly finance summary' },
      { command: 'report',   description: '📈 Monthly report + PDF download' },
      { command: 'language', description: '🌐 Change language' },
      { command: 'help',     description: '🤖 Help & all commands' },
    ];
    const commandsKm = [
      { command: 'start',    description: '👋 ស្វាគមន៍ & បើក Dashboard' },
      { command: 'summary',  description: '📊 របាយការណ៍ហិរញ្ញវត្ថុសប្តាហ៍' },
      { command: 'report',   description: '📈 របាយការណ៍ប្រចាំខែ' },
      { command: 'language', description: '🌐 ប្ដូរភាសា' },
      { command: 'help',     description: '🤖 ជំនួយ & ពាក្យបញ្ជា' },
    ];
    const commandsZh = [
      { command: 'start',    description: '👋 欢迎 & 打开 Dashboard' },
      { command: 'summary',  description: '📊 每周财务摘要' },
      { command: 'report',   description: '📈 月度报告' },
      { command: 'language', description: '🌐 切换语言' },
      { command: 'help',     description: '🤖 帮助 & 所有命令' },
    ];
    await Promise.all([
      bot.telegram.setMyCommands(commandsEn),                                          // default (English)
      bot.telegram.setMyCommands(commandsKm, { scope: { type: 'all_private_chats' }, language_code: 'km' }),
      bot.telegram.setMyCommands(commandsZh, { scope: { type: 'all_private_chats' }, language_code: 'zh' }),
    ]);
    console.log('✅ Bot commands registered');

    const webAppUrl = process.env.FRONTEND_URL!;
    if (webAppUrl?.startsWith('https://')) {
      await bot.telegram.setChatMenuButton({
        menuButton: { type: 'web_app', text: '💰 Open Dashboard', web_app: { url: webAppUrl } },
      });
      console.log('✅ Menu button registered:', webAppUrl);
    }

    startWeeklyReportScheduler(bot);
    startSubscriptionReminderScheduler(bot);

    const publicDomain = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.PUBLIC_URL;
    if (process.env.NODE_ENV === 'production' && publicDomain) {
      const webhookDomain = publicDomain.startsWith('https://') ? publicDomain : `https://${publicDomain}`;
      const port = parseInt(process.env.PORT || '8080');
      await bot.launch({ webhook: { domain: webhookDomain, port } });
      console.log(`🤖 Finance GM Bot running via webhook: ${webhookDomain} port ${port}`);
    } else {
      await bot.launch();
      console.log('🤖 Finance GM Bot running via long polling');
    }
  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

start();
