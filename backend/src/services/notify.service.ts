const BOT_API = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;

interface NotifyOptions {
  parseMode?: 'HTML' | 'Markdown';
  inlineKeyboard?: { text: string; url: string }[][];
}

export async function sendTelegramMessage(
  telegramId: number | bigint,
  text: string,
  options: NotifyOptions = {},
): Promise<void> {
  const { parseMode = 'HTML', inlineKeyboard } = options;
  try {
    const body: Record<string, any> = {
      chat_id: Number(telegramId),
      text,
      parse_mode: parseMode,
      disable_web_page_preview: true,
    };
    if (inlineKeyboard) {
      body.reply_markup = { inline_keyboard: inlineKeyboard };
    }
    const res = await fetch(`${BOT_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json();
      console.error('[Notify] Telegram sendMessage failed:', err);
    }
  } catch (err) {
    console.error('[Notify] Failed to send Telegram message:', err);
  }
}
