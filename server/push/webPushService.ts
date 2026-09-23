import webpush from 'web-push';
import { appendAuditLog } from '../security/httpSecurity.js';

export interface PushSubscriptionItem {
  id: string;
  endpoint: string;
  keys?: {
    p256dh: string;
    auth: string;
  };
  userId?: string | number;
  operadorNome?: string;
  dispositivo?: string;
  criadoEm: string;
}

export interface PushSendResult {
  sucesso: boolean;
  status: 'sent' | 'delivered' | 'failed' | 'not_configured' | 'expired_subscription';
  mensagem: string;
  detalhes?: any;
}

class WebPushService {
  private static instance: WebPushService;
  private subscriptions: Map<string, PushSubscriptionItem> = new Map();
  private vapidConfigured: boolean = false;

  private constructor() {
    this.initVapid();
  }

  public static getInstance(): WebPushService {
    if (!WebPushService.instance) {
      WebPushService.instance = new WebPushService();
    }
    return WebPushService.instance;
  }

  private initVapid(): void {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || process.env.VAPID_EMAIL || 'mailto:admin@nap.local';

    if (publicKey && privateKey) {
      try {
        webpush.setVapidDetails(subject, publicKey, privateKey);
        this.vapidConfigured = true;
      } catch (err: any) {
        console.warn('[WebPush] Falha ao configurar VAPID:', err.message);
        this.vapidConfigured = false;
      }
    } else {
      this.vapidConfigured = false;
    }
  }

  public isConfigured(): boolean {
    return this.vapidConfigured;
  }

  public getPublicKey(): string | null {
    return process.env.VAPID_PUBLIC_KEY || null;
  }

  public registerSubscription(sub: {
    endpoint: string;
    keys?: { p256dh: string; auth: string };
    userId?: string | number;
    operadorNome?: string;
    dispositivo?: string;
  }): PushSubscriptionItem {
    if (!sub.endpoint) {
      throw new Error('Endpoint de subscrição WebPush é obrigatório.');
    }
    const item: PushSubscriptionItem = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      endpoint: sub.endpoint,
      keys: sub.keys,
      userId: sub.userId,
      operadorNome: sub.operadorNome,
      dispositivo: sub.dispositivo || 'Web / PWA',
      criadoEm: new Date().toISOString()
    };
    this.subscriptions.set(sub.endpoint, item);
    return item;
  }

  public getSubscriptionsCount(): number {
    return this.subscriptions.size;
  }

  public async sendNotification(
    targetEndpointOrUser: string | number,
    payload: { title: string; body: string; data?: any; icon?: string }
  ): Promise<PushSendResult> {
    if (!this.vapidConfigured) {
      return {
        sucesso: false,
        status: 'not_configured',
        mensagem: 'Serviço WebPush VAPID não configurado. Defina VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY no ambiente do servidor.'
      };
    }

    // Busca subscrição por endpoint ou userId
    let targetSub: PushSubscriptionItem | undefined;
    for (const sub of this.subscriptions.values()) {
      if (sub.endpoint === targetEndpointOrUser || String(sub.userId) === String(targetEndpointOrUser)) {
        targetSub = sub;
        break;
      }
    }

    if (!targetSub) {
      return {
        sucesso: false,
        status: 'failed',
        mensagem: `Nenhuma subscrição ativa encontrada para o destinatário '${targetEndpointOrUser}'.`
      };
    }

    try {
      const pushPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/pwa-192x192.png',
        data: payload.data || {}
      });

      const pushSub = {
        endpoint: targetSub.endpoint,
        keys: targetSub.keys || { p256dh: '', auth: '' }
      };

      await webpush.sendNotification(pushSub, pushPayload);

      return {
        sucesso: true,
        status: 'sent',
        mensagem: `Notificação enviada com sucesso para ${targetSub.operadorNome || 'destinatário'}.`
      };
    } catch (err: any) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        this.subscriptions.delete(targetSub.endpoint);
        return {
          sucesso: false,
          status: 'expired_subscription',
          mensagem: 'Subscrição expirada ou cancelada pelo navegador do usuário.'
        };
      }
      return {
        sucesso: false,
        status: 'failed',
        mensagem: `Falha ao transmitir push: ${err.message || 'Erro no serviço de push'}`
      };
    }
  }

  public async testPush(options: { tipo?: string; operador_nome?: string; ramal?: string }): Promise<PushSendResult> {
    if (!this.vapidConfigured) {
      return {
        sucesso: false,
        status: 'not_configured',
        mensagem: 'Serviço WebPush VAPID não configurado. Defina VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY.'
      };
    }

    if (this.subscriptions.size === 0) {
      return {
        sucesso: false,
        status: 'failed',
        mensagem: 'Nenhum navegador/operador registrado para recebimento de Push Notifications.'
      };
    }

    const firstSub = Array.from(this.subscriptions.values())[0];
    return this.sendNotification(firstSub.endpoint, {
      title: `[NAP] Teste de Push: ${options.tipo || 'Operacional'}`,
      body: `Mensagem de homologação para ${options.operador_nome || 'Operador'} (Ramal ${options.ramal || 'PWA'}).`
    });
  }
}

export const webPushService = WebPushService.getInstance();
