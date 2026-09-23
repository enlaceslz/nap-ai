import express from 'express';
import { webPushService } from './webPushService';
import { requireAuth } from '../auth/rbacMiddleware';
import { recordMandatoryAuditLog } from '../security/httpSecurity';

export const setupOperatorPushRoutes = (app: express.Express) => {
  const router = express.Router();

  // 1. Inscrição do Navegador/PWA do Operador (PostgreSQL)
  router.post('/operator/subscribe', async (req, res) => {
    try {
      const { subscription, operador_id, operador_nome, ramal, dispositivo } = req.body;
      const endpoint = subscription?.endpoint || req.body.endpoint;

      if (!endpoint) {
        return res.status(400).json({
          sucesso: false,
          status: 'failed',
          mensagem: 'Endpoint de subscrição Push obrigatório.'
        });
      }

      const user = (req as any).user;
      const subItem = await webPushService.registerSubscription({
        endpoint,
        keys: subscription?.keys,
        userId: operador_id ? Number(operador_id) : (user?.id ? Number(user.id) : undefined),
        operadorNome: operador_nome || user?.nome || 'Operador',
        dispositivo: dispositivo || 'Navegador Web / PWA',
        userAgent: (req.headers['user-agent'] as string) || undefined
      });

      return res.status(201).json({
        sucesso: true,
        status: 'subscribed',
        mensagem: 'Subscrição WebPush registrada com sucesso no PostgreSQL.',
        subscription: subItem
      });
    } catch (err: any) {
      return res.status(500).json({
        sucesso: false,
        status: 'failed',
        mensagem: `Erro ao registrar subscrição: ${err.message}`
      });
    }
  });

  // 2. Disparo de Teste Real de Push Notification para o Operador
  // BLOQUEADOR 1: ZERO falsos sucessos. Exige autenticação e envio comprovado.
  router.post('/operator/test', requireAuth, async (req, res) => {
    const { tipo = 'alerta', operador_nome, ramal, endpoint } = req.body;
    const user = (req as any).user;

    if (!webPushService.isConfigured()) {
      return res.status(503).json({
        sucesso: false,
        status: 'not_configured',
        mensagem: 'Serviço WebPush VAPID não configurado no servidor (defina VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY).'
      });
    }

    try {
      const result = await webPushService.testPush({
        userId: user?.id ? Number(user.id) : undefined,
        operadorNome: operador_nome || user?.nome,
        ramal,
        tipo,
        endpoint
      });

      // Registro obrigatório de auditoria imutável
      await recordMandatoryAuditLog({
        usuario: user?.email || user?.nome || 'operador',
        modulo: 'WebPush Operacional',
        acao: 'Disparo de Notificação Push de Teste',
        detalhes: `Teste de push '${tipo}' para operador '${operador_nome || user?.nome}'. Status retornado: ${result.status}`,
        recurso: operador_nome || user?.nome || 'operador',
        resultado: result.status,
        categoria: 'disparo',
        severidade: result.sucesso ? 'info' : 'atencao',
        status: result.sucesso ? 'sucesso' : 'falha',
        ip: req.ip || undefined,
        userAgent: (req.headers['user-agent'] as string) || undefined
      });

      if (result.status === 'subscription_not_found') {
        return res.status(404).json({
          sucesso: false,
          status: 'subscription_not_found',
          mensagem: result.mensagem
        });
      }

      if (result.status === 'expired') {
        return res.status(410).json({
          sucesso: false,
          status: 'expired',
          mensagem: result.mensagem
        });
      }

      if (result.status === 'unavailable') {
        return res.status(503).json({
          sucesso: false,
          status: 'unavailable',
          mensagem: result.mensagem
        });
      }

      if (!result.sucesso) {
        return res.status(502).json({
          sucesso: false,
          status: result.status,
          mensagem: result.mensagem
        });
      }

      return res.json({
        sucesso: true,
        status: 'sent',
        mensagem: result.mensagem
      });
    } catch (err: any) {
      return res.status(500).json({
        sucesso: false,
        status: 'failed',
        mensagem: `Falha interna no envio de WebPush: ${err.message}`
      });
    }
  });

  // 3. Envio de Notificação Direta para Operador (chamado por WABA, SGP, Kanban)
  router.post('/operator/send', async (req, res) => {
    const { operador_id, operador_nome, titulo, mensagem, categoria, dados } = req.body;

    if (!webPushService.isConfigured()) {
      return res.status(503).json({
        sucesso: false,
        status: 'not_configured',
        mensagem: 'Serviço WebPush VAPID não configurado no servidor.'
      });
    }

    const target = operador_id || operador_nome;
    if (!target) {
      return res.status(400).json({
        sucesso: false,
        status: 'failed',
        mensagem: 'Parâmetro operador_id ou operador_nome é obrigatório.'
      });
    }

    try {
      const result = await webPushService.sendNotification(target, {
        title: titulo || `[NAP] Novo Alerta Operacional (${categoria || 'Geral'})`,
        body: mensagem || 'Você possui uma nova atribuição no sistema.',
        data: dados || {}
      });

      const httpStatus = result.sucesso ? 200 : (result.status === 'subscription_not_found' ? 404 : 502);
      return res.status(httpStatus).json(result);
    } catch (err: any) {
      return res.status(500).json({
        sucesso: false,
        status: 'failed',
        mensagem: `Erro ao enviar notificação: ${err.message}`
      });
    }
  });

  app.use('/api/push', router);
};
