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
    // Estas credenciais viriam de variáveis de ambiente
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || 'dummy-token';
    this.defaultChatId = process.env.TELEGRAM_NOC_GROUP_ID || 'dummy-chat-id';
  }

  async sendMessage(message: string, chatId?: string, parseMode: 'MarkdownV2' | 'HTML' = 'HTML') {
    if (this.botToken === 'dummy-token') {
      console.log('[TELEGRAM MOCK]', message);
      return { success: true, message: 'Message logged locally' };
    }

    try {
      const targetChat = chatId || this.defaultChatId;
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
    if (this.botToken === 'dummy-token') {
      console.log('[TELEGRAM MOCK ALERT]', message, actions);
      return { success: true, message: 'Alert logged locally' };
    }
    // ... Implementação real enviando reply_markup ...
    return { success: true };
  }
}
