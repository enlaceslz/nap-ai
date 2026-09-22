// Gateway para integração com o Bot do Telegram

export class TelegramGateway {
  private static instance: TelegramGateway;

  public static getInstance(): TelegramGateway {
    if (!TelegramGateway.instance) {
      TelegramGateway.instance = new TelegramGateway();
    }
    return TelegramGateway.instance;
  }

  private botToken: string;
  private defaultChatId: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.defaultChatId = process.env.TELEGRAM_NOC_GROUP_ID || '';
  }

  async sendMessage(message: string, chatId?: string, parseMode: 'MarkdownV2' | 'HTML' = 'HTML') {
    if (!this.botToken) {
      return { success: false, error: 'Telegram não configurado (TELEGRAM_BOT_TOKEN ausente no ambiente).' };
    }

    try {
      const targetChat = chatId || this.defaultChatId;
      if (!targetChat) {
        return { success: false, error: 'Chat ID do Telegram não informado e TELEGRAM_NOC_GROUP_ID ausente.' };
      }
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChat,
          text: message,
          parse_mode: parseMode
        })
      });

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.description);
      }
      return { success: true, data };
    } catch (error: any) {
      console.error('[TELEGRAM ERROR]', error.message);
      return { success: false, error: error.message };
    }
  }

  // Envia alerta com botões inline (Ex: "Fazer ACK", "Ver no Mapa")
  async sendAlertWithActions(message: string, actions: any[], chatId?: string) {
    if (!this.botToken) {
      return { success: false, error: 'Telegram não configurado (TELEGRAM_BOT_TOKEN ausente no ambiente).' };
    }
    const targetChat = chatId || this.defaultChatId;
    if (!targetChat) {
      return { success: false, error: 'Chat ID do Telegram não informado e TELEGRAM_NOC_GROUP_ID ausente.' };
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChat,
          text: message,
          reply_markup: {
            inline_keyboard: actions
          }
        })
      });

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.description);
      }
      return { success: true, data };
    } catch (error: any) {
      console.error('[TELEGRAM ERROR]', error.message);
      return { success: false, error: error.message };
    }
  }
}
