const BOT_API = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;

export async function sendTelegramMessage(telegramId: number | bigint, text: string): Promise<void> {
  try {
    const res = await fetch(`${BOT_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: Number(telegramId),
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      console.error('[Notify] Telegram sendMessage failed:', err);
    }
  } catch (err) {
    console.error('[Notify] Failed to send Telegram message:', err);
  }
}
