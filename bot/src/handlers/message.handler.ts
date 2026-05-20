import { Context } from 'telegraf';
import { parseTransaction } from '../services/nlp.service';
import { prisma } from '../lib/prisma';

const db = prisma as any;

export async function handleTextMessage(ctx: Context): Promise<void> {
  const text = (ctx.message as any)?.text;
  if (!text || text.startsWith('/')) return;

  const parsed = parseTransaction(text);
  if (!parsed) return;

  const telegramId = ctx.from!.id;

  try {
    const user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });
    if (!user) {
      await ctx.reply('Please start the bot first with /start');
      return;
    }

    // ── 1. Require at least one account ──────────────────────────────────────
    const accounts: any[] = await db.account.findMany({
      where: { userId: user.id, isArchived: false },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    if (accounts.length === 0) {
      const webAppUrl = process.env.FRONTEND_URL!;
      const isProd = webAppUrl?.startsWith('https://');
      await ctx.reply(
        '🏦 *No account found!*\n\n' +
        'You need to create a cash account before recording transactions.\n\n' +
        '👉 Open the dashboard, go to *Accounts* tab, and tap ➕ to create your first account ' +
        '(e.g. "Cash on Hand").\n\n' +
        'Once your account is set up, come back and record your transaction normally.',
        {
          parse_mode: 'Markdown',
          reply_markup: isProd
            ? ({
                keyboard: [[{ text: '🏦 Open Accounts', web_app: { url: `${webAppUrl}/accounts` } }]],
                resize_keyboard: true,
                one_time_keyboard: true,
              } as any)
            : undefined,
        },
      );
      return;
    }

    // Use default account, fallback to first
    const account = accounts.find((a: any) => a.isDefault) ?? accounts[0];

    // ── 2. Insufficient funds check for expenses ──────────────────────────────
    if (parsed.type === 'expense') {
      const balance = Number(account.balance);
      if (balance < parsed.amount) {
        await ctx.reply(
          `❌ *Insufficient funds!*\n\n` +
          `💳 *${account.name}* balance: *$${balance.toFixed(2)}*\n` +
          `💸 Transaction amount: *$${parsed.amount.toFixed(2)}*\n\n` +
          `You need *$${(parsed.amount - balance).toFixed(2)}* more to complete this transaction.\n\n` +
          `_Add income first or reduce the amount._`,
          { parse_mode: 'Markdown' },
        );
        return;
      }
    }

    // ── 3. Create transaction + update account balance atomically ─────────────
    const category = await prisma.category.findUnique({ where: { name: parsed.category } });
    const categoryId = category?.id || 'other';

    await db.$transaction([
      db.transaction.create({
        data: {
          userId: user.id,
          accountId: account.id,
          amount: parsed.amount,
          type: parsed.type,
          categoryId,
          note: parsed.note,
          date: new Date(),
        },
      }),
      parsed.type === 'income'
        ? db.account.update({
            where: { id: account.id },
            data: { balance: { increment: parsed.amount } },
          })
        : db.account.update({
            where: { id: account.id },
            data: { balance: { decrement: parsed.amount } },
          }),
    ]);

    // Fetch updated balance to show in reply
    const updated = await db.account.findUnique({ where: { id: account.id } });
    const newBalance = Number(updated.balance);

    const isIncome = parsed.type === 'income';
    const sign = isIncome ? '+' : '-';
    const emoji = isIncome ? '💰' : '💸';

    const reply =
      `${emoji} *Transaction Logged!*\n\n` +
      `*Amount:* ${sign}$${parsed.amount.toFixed(2)}\n` +
      `*Category:* ${category?.icon || '📦'} ${category?.label || 'Other'}\n` +
      `*Note:* ${parsed.note}\n` +
      `*Account:* ${account.icon} ${account.name}\n` +
      `*New Balance:* $${newBalance.toFixed(2)}\n\n` +
      `_Use /summary to see your weekly report._`;

    await ctx.reply(reply, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Message handler error:', error);
    await ctx.reply('❌ Failed to log transaction. Please try again.');
  }
}
