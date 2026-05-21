import { Context } from 'telegraf';
import { prisma } from '../lib/prisma';
import { t, resolveLang, BotLang } from '../i18n';

export async function languageCommand(ctx: Context): Promise<void> {
  const telegramId = ctx.from!.id;
  const user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });
  const lang = resolveLang(user?.preferredLanguage);
  const tr = t(lang);

  await ctx.reply(tr.langChoose, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: tr.langBtn.km, callback_data: 'lang_km' },
          { text: tr.langBtn.zh, callback_data: 'lang_zh' },
          { text: tr.langBtn.en, callback_data: 'lang_en' },
        ],
      ],
    },
  });
}

export async function handleLangCallback(ctx: Context, newLang: BotLang): Promise<void> {
  const telegramId = ctx.from!.id;
  await (ctx as any).answerCbQuery();

  await prisma.user.update({
    where: { telegramId: BigInt(telegramId) },
    data: { preferredLanguage: newLang },
  });

  const tr = t(newLang);
  await ctx.reply(tr.langChanged);
}
