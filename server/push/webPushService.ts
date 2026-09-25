import webpush from 'web-push';
import { db, isDatabaseConnected } from '../../src/db/index';
import { push_subscriptions } from '../../src/db/schema';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import { appendAuditLog } from '../security/httpSecurity';

export interface PushSubscriptionItem {
  id?: number | string;
  endpoint: string;
  keys?: {
    p256dh: string;
    auth: string;
  };
  userId?: number | null;
  clienteId?: number | null;
  operadorNome?: string | null;
  clienteNome?: string | null;
  dispositivo?: string | null;
  userAgent?: string | null;
  criadoEm?: string;
  active?: boolean;
}

export interface PushSendResult {
  sucesso: boolean;
  status: 'accepted' | 'sent' | 'delivered' | 'failed' | 'not_configured' | 'subscription_not_found' | 'expired' | 'unavailable' | 'cancelled';
  mensagem: string;
  detalhes?: any;
}

class WebPushService {
  private static instance: WebPushService;
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
    const subject = process.env.VAPID_SUBJECT || process.env.VAPID_EMAIL;
    const isProd = process.env.NODE_ENV === 'production';

    if (publicKey && privateKey) {
      if (!subject) {
        if (isProd) {
          console.warn('[WebPush] VAPID_SUBJECT não configurado em ambiente de produção. WebPush desabilitado (not_configured).');
        } else {
          console.warn('[WebPush] VAPID_SUBJECT ausente. WebPush desabilitado (not_configured). Defina VAPID_SUBJECT.');
        }
        this.vapidConfigured = false;
        return;
      }
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

  /**
   * Registra ou atualiza uma subscrição WebPush com separação estrita entre usuário NAP (users.id) e assinante ISP (clientes.id)
   */
  public async registerSubscription(sub: {
    endpoint: string;
    keys?: { p256dh: string; auth: string };
    userId?: number | null;
    clienteId?: number | null;
    operadorNome?: string | null;
    clienteNome?: string | null;
    dispositivo?: string;
    userAgent?: string;
  }): Promise<PushSubscriptionItem> {
    if (!sub.endpoint) {
      throw new Error('Endpoint de subscrição WebPush é obrigatório.');
    }

    if (!isDatabaseConnected) {
      throw new Error('Banco de dados PostgreSQL indisponível para persistência de subscription.');
    }

    const [saved] = await db.insert(push_subscriptions).values({
      userId: sub.userId || null,
      clienteId: sub.clienteId || null,
      endpoint: sub.endpoint,
      p256dh: sub.keys?.p256dh || null,
      auth: sub.keys?.auth || null,
      userAgent: sub.userAgent || null,
      deviceName: sub.dispositivo || 'Navegador Web / PWA',
      operadorNome: sub.operadorNome || null,
      clienteNome: sub.clienteNome || null,
      active: true,
      lastUsedAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: push_subscriptions.endpoint,
      set: {
        userId: sub.userId !== undefined ? sub.userId : sql`${push_subscriptions.userId}`,
        clienteId: sub.clienteId !== undefined ? sub.clienteId : sql`${push_subscriptions.clienteId}`,
        p256dh: sub.keys?.p256dh || null,
        auth: sub.keys?.auth || null,
        userAgent: sub.userAgent || null,
        deviceName: sub.dispositivo || 'Navegador Web / PWA',
        operadorNome: sub.operadorNome || null,
        clienteNome: sub.clienteNome || null,
        active: true,
        lastUsedAt: new Date(),
        updatedAt: new Date()
      }
    }).returning();

    return {
      id: saved.id,
      endpoint: saved.endpoint,
      keys: {
        p256dh: saved.p256dh || '',
        auth: saved.auth || ''
      },
      userId: saved.userId,
      clienteId: saved.clienteId,
      operadorNome: saved.operadorNome,
      clienteNome: saved.clienteNome,
      dispositivo: saved.deviceName,
      criadoEm: saved.createdAt.toISOString(),
      active: saved.active
    };
  }

  /**
   * Conta total de subscrições ativas no PostgreSQL
   */
  public async getSubscriptionsCount(): Promise<number> {
    if (!isDatabaseConnected) {
      return 0;
    }
    try {
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(push_subscriptions)
        .where(eq(push_subscriptions.active, true));
      return Number(result[0]?.count || 0);
    } catch {
      return 0;
    }
  }

  /**
   * Transmissão real de notificação WebPush para destinatário específico
   */
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

    if (!isDatabaseConnected) {
      return {
        sucesso: false,
        status: 'unavailable',
        mensagem: 'PostgreSQL indisponível para consulta de credenciais de Push.'
      };
    }

    // Busca subscrição ativa no PostgreSQL por endpoint ou userId
    let targetSub;
    try {
      const targetStr = String(targetEndpointOrUser);
      const isNum = !isNaN(Number(targetEndpointOrUser));

      if (isNum) {
        const found = await db.select().from(push_subscriptions)
          .where(and(eq(push_subscriptions.userId, Number(targetEndpointOrUser)), eq(push_subscriptions.active, true)))
          .orderBy(desc(push_subscriptions.updatedAt))
          .limit(1);
        targetSub = found[0];
      }

      if (!targetSub) {
        const found = await db.select().from(push_subscriptions)
          .where(and(eq(push_subscriptions.endpoint, targetStr), eq(push_subscriptions.active, true)))
          .limit(1);
        targetSub = found[0];
      }

      if (!targetSub && typeof targetEndpointOrUser === 'string') {
        const found = await db.select().from(push_subscriptions)
          .where(and(eq(push_subscriptions.operadorNome, targetEndpointOrUser), eq(push_subscriptions.active, true)))
          .orderBy(desc(push_subscriptions.updatedAt))
          .limit(1);
        targetSub = found[0];
      }
    } catch (err: any) {
      return {
        sucesso: false,
        status: 'unavailable',
        mensagem: `Erro ao consultar base de subscriptions: ${err.message}`
      };
    }

    if (!targetSub) {
      return {
        sucesso: false,
        status: 'subscription_not_found',
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
        keys: {
          p256dh: targetSub.p256dh || '',
          auth: targetSub.auth || ''
        }
      };

      await webpush.sendNotification(pushSub, pushPayload);

      // Atualiza timestamp de último uso no PostgreSQL
      await db.update(push_subscriptions)
        .set({ lastUsedAt: new Date() })
        .where(eq(push_subscriptions.id, targetSub.id));

      return {
        sucesso: true,
        status: 'accepted',
        mensagem: `Notificação aceita pelo serviço WebPush para encaminhamento a ${targetSub.operadorNome || targetSub.clienteNome || 'destinatário'}.`
      };
    } catch (err: any) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        // Subscrição expirada ou revogada no navegador cliente -> Desativa no PostgreSQL
        try {
          await db.update(push_subscriptions)
            .set({ active: false, updatedAt: new Date() })
            .where(eq(push_subscriptions.id, targetSub.id));
        } catch {}

        return {
          sucesso: false,
          status: 'expired',
          mensagem: 'Subscrição expirada ou cancelada pelo navegador do usuário. Registro desativado.'
        };
      }

      return {
        sucesso: false,
        status: 'failed',
        mensagem: `Falha ao transmitir push: ${err.message || 'Erro no serviço de push'}`
      };
    }
  }

  /**
   * Envio direcionado exclusivamente para Cliente ISP (clientes.id)
   * NUNCA busca por users.id ou faz confusão de identidade.
   */
  public async sendToCliente(clienteId: number, payload: {
    title: string;
    body: string;
    icon?: string;
    data?: any;
  }): Promise<PushSendResult & { subscriptionId?: number }> {
    if (!this.vapidConfigured) {
      return {
        sucesso: false,
        status: 'not_configured',
        mensagem: 'Serviço WebPush VAPID não configurado.'
      };
    }

    if (!isDatabaseConnected) {
      return {
        sucesso: false,
        status: 'unavailable',
        mensagem: 'Banco de dados indisponível para consulta de subscriptions.'
      };
    }

    try {
      const rows = await db.select().from(push_subscriptions)
        .where(and(eq(push_subscriptions.clienteId, clienteId), eq(push_subscriptions.active, true)))
        .orderBy(desc(push_subscriptions.updatedAt))
        .limit(1);

      if (rows.length === 0) {
        return {
          sucesso: false,
          status: 'subscription_not_found',
          mensagem: `Nenhuma subscrição ativa encontrada para o cliente ISP #${clienteId}.`
        };
      }

      const sub = rows[0];
      const res = await this.sendNotification(sub.endpoint, payload);
      return {
        ...res,
        subscriptionId: sub.id
      };
    } catch (err: any) {
      return {
        sucesso: false,
        status: 'failed',
        mensagem: `Erro ao enviar push para cliente #${clienteId}: ${err.message}`
      };
    }
  }

  /**
   * Envio direcionado exclusivamente para Operador/Usuário NAP (users.id)
   * NUNCA busca por clientes.id.
   */
  public async sendToUser(userId: number, payload: {
    title: string;
    body: string;
    icon?: string;
    data?: any;
  }): Promise<PushSendResult & { subscriptionId?: number }> {
    if (!this.vapidConfigured) {
      return {
        sucesso: false,
        status: 'not_configured',
        mensagem: 'Serviço WebPush VAPID não configurado.'
      };
    }

    if (!isDatabaseConnected) {
      return {
        sucesso: false,
        status: 'unavailable',
        mensagem: 'Banco de dados indisponível para consulta de subscriptions.'
      };
    }

    try {
      const rows = await db.select().from(push_subscriptions)
        .where(and(eq(push_subscriptions.userId, userId), eq(push_subscriptions.active, true)))
        .orderBy(desc(push_subscriptions.updatedAt))
        .limit(1);

      if (rows.length === 0) {
        return {
          sucesso: false,
          status: 'subscription_not_found',
          mensagem: `Nenhuma subscrição ativa encontrada para o usuário NAP #${userId}.`
        };
      }

      const sub = rows[0];
      const res = await this.sendNotification(sub.endpoint, payload);
      return {
        ...res,
        subscriptionId: sub.id
      };
    } catch (err: any) {
      return {
        sucesso: false,
        status: 'failed',
        mensagem: `Erro ao enviar push para usuário #${userId}: ${err.message}`
      };
    }
  }

  /**
   * Envio de teste real para operador autenticado
   */
  public async testPush(options: { 
    userId?: number;
    operadorNome?: string; 
    ramal?: string;
    tipo?: string;
    endpoint?: string;
  }): Promise<PushSendResult> {
    if (!this.vapidConfigured) {
      return {
        sucesso: false,
        status: 'not_configured',
        mensagem: 'Serviço WebPush VAPID não configurado. Defina VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY.'
      };
    }

    if (!isDatabaseConnected) {
      return {
        sucesso: false,
        status: 'unavailable',
        mensagem: 'PostgreSQL indisponível para consulta de subscriptions.'
      };
    }

    let subAlvo;
    if (options.endpoint && options.userId) {
      // Se endpoint e userId foram informados, ambos devem corresponder
      const rows = await db.select().from(push_subscriptions)
        .where(and(
          eq(push_subscriptions.endpoint, options.endpoint),
          eq(push_subscriptions.userId, options.userId),
          eq(push_subscriptions.active, true)
        ))
        .limit(1);
      subAlvo = rows[0];
    } else if (options.userId) {
      const rows = await db.select().from(push_subscriptions)
        .where(and(eq(push_subscriptions.userId, options.userId), eq(push_subscriptions.active, true)))
        .orderBy(desc(push_subscriptions.updatedAt))
        .limit(1);
      subAlvo = rows[0];
    } else if (options.endpoint) {
      const rows = await db.select().from(push_subscriptions)
        .where(and(eq(push_subscriptions.endpoint, options.endpoint), eq(push_subscriptions.active, true)))
        .limit(1);
      subAlvo = rows[0];
    } else if (options.operadorNome) {
      const rows = await db.select().from(push_subscriptions)
        .where(and(eq(push_subscriptions.operadorNome, options.operadorNome), eq(push_subscriptions.active, true)))
        .orderBy(desc(push_subscriptions.updatedAt))
        .limit(1);
      subAlvo = rows[0];
    }

    // REGRA DE SEGURANÇA: NUNCA pegar subscription arbitrária de outro operador.
    // Se o usuário/alvo não possui subscrição ativa vinculada, reportar explicitamente subscription_not_found.
    if (!subAlvo) {
      return {
        sucesso: false,
        status: 'subscription_not_found',
        mensagem: options.userId 
          ? `Nenhuma subscrição ativa encontrada para o usuário #${options.userId}. Ative as notificações no navegador/PWA.`
          : 'Nenhum navegador/operador com subscrição ativa registrado para o identificador informado.'
      };
    }

    return this.sendNotification(subAlvo.endpoint, {
      title: `[NAP] Teste de Push: ${options.tipo || 'Operacional'}`,
      body: `Mensagem de homologação para ${subAlvo.operadorNome || options.operadorNome || 'Operador'} (Ramal ${options.ramal || 'PWA'}).`
    });
  }
}

export const webPushService = WebPushService.getInstance();
