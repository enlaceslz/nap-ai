import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { db, isDatabaseConnected } from '../../src/db/index';
import { webhooks_recebidos } from '../../src/db/schema';
import { eq, and } from 'drizzle-orm';

interface ProcessedWebhookRecord {
  id: string;
  source: string;
  processedAt: number;
}

// Cache de idempotência em memória com TTL de 24 horas para deduplicação e proteção contra replay
const processedWebhooks = new Map<string, ProcessedWebhookRecord>();
const TTL_MS = 24 * 60 * 60 * 1000;

// Limpeza periódica de nonces antigos
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of processedWebhooks.entries()) {
    if (now - record.processedAt > TTL_MS) {
      processedWebhooks.delete(key);
    }
  }
}, 60 * 60 * 1000).unref();

export interface WebhookValidationOptions {
  source: 'waba' | 'c6_bank' | 'zabbix' | 'zammad' | 'generic';
  secretEnvVar?: string;
  maxTimeDriftSeconds?: number;
}

export class WebhookGateway {
  /**
   * Verifica se o webhook já foi processado (Idempotência e Proteção contra Replay)
   */
  public static isDuplicate(source: string, idempotencyKey: string): boolean {
    const key = `${source}:${idempotencyKey}`;
    return processedWebhooks.has(key);
  }

  /**
   * Registra a chave de idempotência do webhook
   */
  public static markProcessed(source: string, idempotencyKey: string): void {
    const key = `${source}:${idempotencyKey}`;
    processedWebhooks.set(key, {
      id: idempotencyKey,
      source,
      processedAt: Date.now()
    });
  }

  /**
   * Valida assinatura HMAC SHA-256 da Meta (WhatsApp WABA)
   * Header: 'x-hub-signature-256' -> sha256=<hash>
   */
  public static validateMetaSignature(rawBody: string | Buffer, signatureHeader: string | undefined, appSecret: string): boolean {
    if (!signatureHeader || !appSecret) return false;
    if (!signatureHeader.startsWith('sha256=')) return false;

    const signature = signatureHeader.substring(7);
    const hmac = crypto.createHmac('sha256', appSecret);
    const digest = hmac.update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody)).digest('hex');

    try {
      return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(digest, 'hex'));
    } catch {
      return false;
    }
  }

  /**
   * Valida timestamp para mitigar ataques de Replay
   * Rejeita payloads com diferença de tempo superior ao drift tolerado (padrão 300s = 5 minutos)
   */
  public static validateTimestamp(timestampSecondsOrMs: number | string, maxDriftSec = 300): boolean {
    if (!timestampSecondsOrMs) return true; // Se não fornecido, depende do nonce
    let ts = Number(timestampSecondsOrMs);
    if (ts > 10000000000) {
      ts = Math.floor(ts / 1000); // Converte ms para segundos
    }
    const nowSec = Math.floor(Date.now() / 1000);
    return Math.abs(nowSec - ts) <= maxDriftSec;
  }

  /**
   * Middleware de validação do Gateway para WABA
   */
  public static wabaMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const signature = req.headers['x-hub-signature-256'] as string;
      const appSecret = process.env.WABA_APP_SECRET || process.env.WABA_ACCESS_TOKEN;

      // Em ambiente de desenvolvimento sem segredo Meta configurado, permite teste de desenvolvimento
      if (!appSecret || process.env.NODE_ENV !== 'production') {
        return next();
      }

      const isValid = WebhookGateway.validateMetaSignature(req.body, signature, appSecret);
      if (!isValid) {
        console.warn('[WEBHOOK_GATEWAY] Assinatura da Meta inválida ou ausente.');
        return res.status(401).json({
          success: false,
          error: 'Assinatura inválida no Webhook Meta (x-hub-signature-256).',
          code: 'INVALID_SIGNATURE'
        });
      }

      next();
    };
  }

  /**
   * Middleware de validação do Gateway para C6 Bank / Enlace-Pay
   * Protege contra Replay, Webhooks falsos sem autenticação e Duplicações (Idempotência)
   */
  public static c6BankMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const webhookSecret = process.env.C6_WEBHOOK_SECRET || process.env.C6_CLIENT_SECRET;
      const authToken = req.headers['authorization'] || req.headers['x-webhook-token'];
      const timestamp = req.headers['x-timestamp'] as string;
      const nonce = (req.headers['x-nonce'] as string) || req.body?.webhookId || req.body?.txid;

      // 1. Validação de Token de Autenticidade do Gateway
      if (webhookSecret) {
        const expectedHeader = `Bearer ${webhookSecret}`;
        if (!authToken || (authToken !== expectedHeader && authToken !== webhookSecret)) {
          return res.status(401).json({
            success: false,
            error: 'Autenticação do webhook do Banco C6 falhou. Token inválido ou ausente.',
            code: 'UNAUTHORIZED_WEBHOOK'
          });
        }
      } else if (process.env.NODE_ENV === 'production') {
        return res.status(401).json({
          success: false,
          error: 'Segredo de autenticação de webhook (C6_WEBHOOK_SECRET) não configurado em produção.',
          code: 'UNAUTHORIZED_WEBHOOK'
        });
      }

      // 2. Validação de Replay Attack por Timestamp
      if (timestamp && !WebhookGateway.validateTimestamp(timestamp)) {
        return res.status(400).json({
          success: false,
          error: 'Requisição de webhook expirada (Replay Attack Protection).',
          code: 'EXPIRED_TIMESTAMP'
        });
      }

      // 3. Validação de Idempotência no PostgreSQL (webhooks_recebidos) e em memória
      if (nonce) {
        if (WebhookGateway.isDuplicate('c6_bank', String(nonce))) {
          return res.status(200).json({
            success: true,
            message: 'Webhook já processado anteriormente (Idempotency Key válida).',
            duplicated: true
          });
        }

        if (isDatabaseConnected) {
          try {
            const rows = await db.select().from(webhooks_recebidos)
              .where(and(eq(webhooks_recebidos.origem, 'c6_bank'), eq(webhooks_recebidos.identificadorExterno, String(nonce))))
              .limit(1);
            if (rows.length > 0) {
              WebhookGateway.markProcessed('c6_bank', String(nonce));
              return res.status(200).json({
                success: true,
                message: 'Webhook já processado anteriormente no PostgreSQL (Idempotency Key válida).',
                duplicated: true
              });
            }
          } catch (dbErr: any) {
            console.warn('[WEBHOOK_GATEWAY] Falha ao verificar idempotência no PostgreSQL:', dbErr.message);
          }
        }
      }

      next();
    };
  }

  /**
   * Middleware de validação do Gateway para Zabbix NOC Webhook
   */
  public static zabbixMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const zabbixToken = process.env.ZABBIX_WEBHOOK_TOKEN || process.env.ZABBIX_TOKEN;
      const authHeader = req.headers['authorization'] || req.headers['x-zabbix-token'];

      if (process.env.NODE_ENV === 'production' && zabbixToken) {
        const valid = authHeader === `Bearer ${zabbixToken}` || authHeader === zabbixToken;
        if (!valid) {
          return res.status(401).json({
            success: false,
            error: 'Webhook Zabbix não autorizado.',
            code: 'UNAUTHORIZED_ZABBIX_WEBHOOK'
          });
        }
      }

      // Idempotência por eventId do Zabbix
      const eventId = req.body.event_id || req.body.eventid;
      if (eventId && WebhookGateway.isDuplicate('zabbix', String(eventId))) {
        return res.status(200).json({
          success: true,
          message: 'Evento Zabbix já correlacionado.',
          duplicated: true
        });
      }

      next();
    };
  }
}
