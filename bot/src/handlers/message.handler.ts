import { Context } from 'telegraf';
import { parseTransaction } from '../services/nlp.service';
import { prisma } from '../lib/prisma';
import { t, resolveLang } from '../i18n';

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

    const lang = resolveLang(user.preferredLanguage);
    const tr = t(lang);

    const accounts: any[] = await db.account.findMany({
      where: { userId: user.id, isArchived: false },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    if (accounts.length === 0) {
      const webAppUrl = process.env.FRONTEND_URL!;
      const isProd = webAppUrl?.startsWith('https://');
      await ctx.reply(tr.noAccount, {
        parse_mode: 'Markdown',
        reply_markup: isProd
          ? ({
              keyboard: [[{ text: tr.openAccounts, web_app: { url: `${webAppUrl}/accounts` } }]],
              resize_keyboard: true,
              one_time_keyboard: true,
            } as any)
          : undefined,
      });
      return;
    }

    const account = accounts.find((a: any) => a.isDefault) ?? accounts[0];

    if (parsed.type === 'expense') {
      const balance = Number(account.balance);
      if (balance < parsed.amount) {
        await ctx.reply(
          tr.insufficientFunds(
            account.name,
            balance.toFixed(2),
            parsed.amount.toFixed(2),
            (parsed.amount - balance).toFixed(2),
          ),
          { parse_mode: 'Markdown' },
        );
        return;
      }
    }

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
        ? db.account.update({ where: { id: account.id }, data: { balance: { increment: parsed.amount } } })
        : db.account.update({ where: { id: account.id }, data: { balance: { decrement: parsed.amount } } }),
    ]);

    const updated = await db.account.findUnique({ where: { id: account.id } });
    const newBalance = Number(updated.balance);
    const isIncome = parsed.type === 'income';
    const sign = isIncome ? '+' : '-';

    await ctx.reply(
      tr.txLogged(
        sign,
        parsed.amount.toFixed(2),
        category?.icon || '📦',
        category?.label || 'Other',
        parsed.note,
        account.icon,
        account.name,
        newBalance.toFixed(2),
      ),
      { parse_mode: 'Markdown' },
    );
  } catch (error) {
    console.error('Message handler error:', error);
    await ctx.reply(t(resolveLang(undefined)).txFailed);
  }
}
