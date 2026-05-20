import 'dotenv/config';
import { Telegraf, session } from 'telegraf';
import { startCommand } from './commands/start.command';
import { summaryCommand } from './commands/summary.command';
import { handleTextMessage } from './handlers/message.handler';
import { startWeeklyReportScheduler } from './scheduler/weekly-report';
import { prisma } from './lib/prisma';

const bot = new Telegraf(process.env.BOT_TOKEN!);

// Session middleware
bot.use(session());

// Commands
bot.command('start', startCommand);
bot.command('summary', summaryCommand);
bot.command('report', summaryCommand); // alias
bot.command('help', async (ctx) => {
  const isProd = process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL?.startsWith('https://');
  await ctx.reply(
    `🤖 <b>Finance GM Bot Help</b>\n\n` +
    `<b>Commands:</b>\n` +
    `/start - Welcome message &amp; dashboard link\n` +
    `/summary - This week's finance summary\n` +
    `/report - Monthly report\n` +
    `/help - Show this help\n\n` +
    `<b>Quick expense logging:</b>\n` +
    `Just type naturally! Examples:\n` +
    `• "Spent $12 on lunch"\n` +
    `• "Paid $50 for groceries"\n` +
    `• "Earned $500 from freelance"\n` +
    `• "Bought coffee for $4"\n\n` +
    `<b>I'll automatically detect:</b>\n` +
    `✅ Amount\n` +
    `✅ Category (food, transport, etc.)\n` +
    `✅ Income vs expense\n\n` +
    `Use the dashboard for full analytics 📊`,
    {
      parse_mode: 'HTML',
      reply_markup: isProd
        ? { inline_keyboard: [[{ text: '📱 Open Dashboard', web_app: { url: process.env.FRONTEND_URL! } }]] }
        : undefined,
    },
  );
});

// Callback queries from inline buttons
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

    // Register web_app menu button so users always get Mini App access
    const webAppUrl = process.env.FRONTEND_URL!;
    if (webAppUrl?.startsWith('https://')) {
      await bot.telegram.setChatMenuButton({
        menuButton: { type: 'web_app', text: '💰 Open Dashboard', web_app: { url: webAppUrl } },
      });
      console.log('✅ Menu button registered:', webAppUrl);
    }

    // Start weekly report scheduler
    startWeeklyReportScheduler(bot);

    // Use webhook in production (Railway provides PUBLIC_URL or RAILWAY_PUBLIC_DOMAIN)
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
