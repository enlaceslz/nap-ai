import express from 'express';
import { webPushService } from './webPushService';
import { requireAuth } from '../auth/rbacMiddleware';
import { recordMandatoryAuditLog } from '../security/httpSecurity';
import { db } from '../../src/db/index';
import { users, push_subscriptions } from '../../src/db/schema';
import { eq, and } from 'drizzle-orm';

export const setupOperatorPushRoutes = (app: express.Express) => {
  const router = express.Router();

  // 1. Inscrição do Navegador/PWA do Operador (PostgreSQL)
  // BLOQUEADOR 03 & 04: Autorização estrita e RBAC. Nunca confiar em operador_id arbitrário do frontend.
  router.post(['/operator/subscribe', '/subscribe'], requireAuth, async (req, res) => {
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

      const currentUser = (req as any).user;
      let effectiveUserId = Number(currentUser?.id);
      let effectiveOperadorNome = currentUser?.nome || currentUser?.email || 'Operador';

      // Se o payload indicar outro operador, exige perfil administrativo (ADMIN / SUPERADMIN)
      if (operador_id && Number(operador_id) !== effectiveUserId) {
        const userRole = (currentUser?.cargo || currentUser?.role || '').toUpperCase();
        if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
          return res.status(403).json({
            sucesso: false,
            status: 'forbidden',
            mensagem: 'Acesso negado: apenas administradores com perfil RBAC podem vincular subscrições a outros usuários.'
          });
        }

        // Valida existência do usuário alvo no PostgreSQL
        const targetUsers = await db.select().from(users).where(eq(users.id, Number(operador_id))).limit(1);
        if (targetUsers.length === 0) {
          return res.status(404).json({
            sucesso: false,
            status: 'not_found',
            mensagem: `Usuário operador #${operador_id} não encontrado no banco de dados.`
          });
        }

        effectiveUserId = Number(operador_id);
        effectiveOperadorNome = targetUsers[0].nome;

        // Auditoria obrigatória para delegação/associação administrativa de push
        await recordMandatoryAuditLog({
          userId: String(currentUser.id),
          usuario: currentUser.email || currentUser.nome || 'administrador',
          usuarioRole: userRole,
          modulo: 'WebPush Autorização',
          acao: 'Associação Administrativa de Push Subscription',
          detalhes: `Administrador #${currentUser.id} associou inscrição WebPush ao usuário #${operador_id} (${effectiveOperadorNome}).`,
          recurso: `user_${operador_id}`,
          resultado: 'sucesso',
          categoria: 'seguranca',
          severidade: 'atencao',
          status: 'sucesso',
          ip: req.ip || undefined,
          userAgent: (req.headers['user-agent'] as string) || undefined
        });
      }

      const subItem = await webPushService.registerSubscription({
        endpoint,
        keys: subscription?.keys,
        userId: effectiveUserId,
        operadorNome: effectiveOperadorNome,
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
  // BLOQUEADOR V6: Usuário comum NUNCA pode testar em nome de outro operador ou fornecer endpoint de terceiros.
  router.post('/operator/test', requireAuth, async (req, res) => {
    const { tipo = 'alerta', operador_id, operador_nome, ramal, endpoint } = req.body;
    const currentUser = (req as any).user;
    const currentUserId = Number(currentUser?.id);
    const currentUserRole = (currentUser?.cargo || currentUser?.role || '').toUpperCase();
    const isAdmin = currentUserRole === 'ADMIN' || currentUserRole === 'SUPERADMIN';

    if (!webPushService.isConfigured()) {
      return res.status(503).json({
        sucesso: false,
        status: 'not_configured',
        mensagem: 'Serviço WebPush VAPID não configurado no servidor (defina VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY).'
      });
    }

    let targetUserId = currentUserId;
    let targetOperadorNome = currentUser?.nome || currentUser?.email || 'Operador';

    // Se o cliente tentar direcionar para outro operador:
    if (operador_id && Number(operador_id) !== currentUserId) {
      if (!isAdmin) {
        return res.status(403).json({
          sucesso: false,
          status: 'forbidden',
          mensagem: 'Acesso negado: apenas administradores (RBAC ADMIN/SUPERADMIN) podem disparar testes para outros operadores.'
        });
      }

      // Validar existência do operador alvo no banco de dados
      const targetUserRows = await db.select().from(users).where(eq(users.id, Number(operador_id))).limit(1);
      if (targetUserRows.length === 0) {
        return res.status(404).json({
          sucesso: false,
          status: 'not_found',
          mensagem: `Usuário operador #${operador_id} não encontrado no banco de dados.`
        });
      }
      targetUserId = Number(operador_id);
      targetOperadorNome = targetUserRows[0].nome;
    } else if (!isAdmin && operador_nome && operador_nome !== currentUser?.nome && operador_nome !== currentUser?.email) {
      // Usuário comum não pode apontar para o nome de outro operador
      return res.status(403).json({
        sucesso: false,
        status: 'forbidden',
        mensagem: 'Acesso negado: operadores comuns não podem escolher arbitrariamente outro destinatário de Push.'
      });
    }

    // Se endpoint específico foi fornecido por usuário comum, validar que pertence ao próprio usuário
    if (endpoint && !isAdmin) {
      const ownedSub = await db.select().from(push_subscriptions)
        .where(and(eq(push_subscriptions.endpoint, endpoint), eq(push_subscriptions.userId, currentUserId), eq(push_subscriptions.active, true)))
        .limit(1);
      if (ownedSub.length === 0) {
        return res.status(403).json({
          sucesso: false,
          status: 'forbidden',
          mensagem: 'Acesso negado: o endpoint informado não pertence ao usuário autenticado.'
        });
      }
    }

    try {
      const result = await webPushService.testPush({
        userId: targetUserId,
        operadorNome: targetOperadorNome,
        ramal,
        tipo,
        endpoint: isAdmin ? endpoint : undefined
      });

      // Registro obrigatório de auditoria imutável com rastreabilidade completa (quem enviou, para quem, resultado)
      await recordMandatoryAuditLog({
        userId: String(currentUserId),
        usuario: currentUser?.email || currentUser?.nome || 'operador',
        usuarioRole: currentUserRole,
        modulo: 'WebPush Operacional',
        acao: 'Disparo de Notificação Push de Teste',
        detalhes: `Teste de push '${tipo}' disparado por #${currentUserId} (${currentUser?.nome || currentUser?.email}) para o operador #${targetUserId} (${targetOperadorNome}). Status: ${result.status}`,
        recurso: `user_${targetUserId}`,
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

  // 3. Envio de Notificação Direta para Operador (chamado por WABA, SGP, Kanban ou Admin)
  // BLOQUEADOR V6: Exige autenticação estrita requireAuth, validação RBAC e auditoria completa
  router.post('/operator/send', requireAuth, async (req, res) => {
    const { operador_id, operador_nome, titulo, mensagem, categoria, dados } = req.body;
    const currentUser = (req as any).user;
    const currentUserId = Number(currentUser?.id);
    const currentUserRole = (currentUser?.cargo || currentUser?.role || '').toUpperCase();
    const isAdmin = currentUserRole === 'ADMIN' || currentUserRole === 'SUPERADMIN';

    if (!webPushService.isConfigured()) {
      return res.status(503).json({
        sucesso: false,
        status: 'not_configured',
        mensagem: 'Serviço WebPush VAPID não configurado no servidor.'
      });
    }

    const rawTarget = operador_id || operador_nome;
    if (!rawTarget) {
      return res.status(400).json({
        sucesso: false,
        status: 'failed',
        mensagem: 'Parâmetro operador_id ou operador_nome é obrigatório.'
      });
    }

    let targetUserId = operador_id ? Number(operador_id) : undefined;
    let targetName = operador_nome;

    // Se usuário comum tentar enviar para outro operador
    if (!isAdmin) {
      if (targetUserId && targetUserId !== currentUserId) {
        return res.status(403).json({
          sucesso: false,
          status: 'forbidden',
          mensagem: 'Acesso negado: apenas administradores (RBAC) podem enviar notificações Push para outros operadores.'
        });
      }
      if (!targetUserId && targetName && targetName !== currentUser?.nome && targetName !== currentUser?.email) {
        return res.status(403).json({
          sucesso: false,
          status: 'forbidden',
          mensagem: 'Acesso negado: operador não autorizado a enviar notificações Push para terceiros.'
        });
      }
      targetUserId = currentUserId;
      targetName = currentUser?.nome || currentUser?.email;
    }

    // Se for admin enviando para operador_id específico, valida no PostgreSQL
    if (targetUserId && isAdmin && targetUserId !== currentUserId) {
      const targetUserRows = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
      if (targetUserRows.length === 0) {
        return res.status(404).json({
          sucesso: false,
          status: 'not_found',
          mensagem: `Operador alvo #${targetUserId} não existe no banco de dados.`
        });
      }
      targetName = targetUserRows[0].nome;
    }

    try {
      const effectiveTarget = targetUserId || targetName || rawTarget;
      const result = await webPushService.sendNotification(effectiveTarget, {
        title: titulo || `[NAP] Alerta Operacional (${categoria || 'Geral'})`,
        body: mensagem || 'Você possui uma nova atribuição no sistema.',
        data: dados || {}
      });

      // Registro obrigatório de auditoria imutável
      await recordMandatoryAuditLog({
        userId: String(currentUserId),
        usuario: currentUser?.email || currentUser?.nome || 'operador',
        usuarioRole: currentUserRole,
        modulo: 'WebPush Operacional',
        acao: 'Envio de Notificação Push para Operador',
        detalhes: `Push enviado por #${currentUserId} para o operador '${effectiveTarget}'. Título: '${titulo || 'Alerta'}'. Resultado: ${result.status}`,
        recurso: `user_${effectiveTarget}`,
        resultado: result.status,
        categoria: 'disparo',
        severidade: result.sucesso ? 'info' : 'atencao',
        status: result.sucesso ? 'sucesso' : 'falha',
        ip: req.ip || undefined,
        userAgent: (req.headers['user-agent'] as string) || undefined
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

  // 4. Envio Geral / Broadcast para Todos os Operadores (Exclusivo RBAC ADMIN / SUPERADMIN)
  router.post('/broadcast', requireAuth, async (req, res) => {
    const currentUser = (req as any).user;
    const currentUserRole = (currentUser?.cargo || currentUser?.role || '').toUpperCase();
    const isAdmin = currentUserRole === 'ADMIN' || currentUserRole === 'SUPERADMIN';

    if (!isAdmin) {
      return res.status(403).json({
        sucesso: false,
        status: 'forbidden',
        mensagem: 'Acesso negado: broadcast de push notifications é restrito a administradores (ADMIN/SUPERADMIN).'
      });
    }

    const { titulo, mensagem, categoria, dados } = req.body;
    if (!titulo || !mensagem) {
      return res.status(400).json({
        sucesso: false,
        status: 'failed',
        mensagem: 'Campos "titulo" e "mensagem" são obrigatórios para broadcast.'
      });
    }

    try {
      const activeSubs = await db.select().from(push_subscriptions)
        .where(eq(push_subscriptions.active, true));

      let sucessos = 0;
      let falhas = 0;

      for (const sub of activeSubs) {
        const sendRes = await webPushService.sendNotification(sub.endpoint, {
          title: `[NAP Broadcast] ${titulo}`,
          body: mensagem,
          data: dados || { categoria: categoria || 'geral' }
        });
        if (sendRes.sucesso) sucessos++;
        else falhas++;
      }

      await recordMandatoryAuditLog({
        userId: String(currentUser.id),
        usuario: currentUser.email || currentUser.nome || 'administrador',
        usuarioRole: currentUserRole,
        modulo: 'WebPush Operacional',
        acao: 'Broadcast de Notificações Push',
        detalhes: `Broadcast realizado por #${currentUser.id}. Sucessos: ${sucessos}, Falhas: ${falhas}, Total alvos: ${activeSubs.length}.`,
        recurso: 'push_broadcast',
        resultado: sucessos > 0 ? 'sucesso' : 'falha',
        categoria: 'disparo',
        severidade: 'atencao',
        status: sucessos > 0 ? 'sucesso' : 'falha',
        ip: req.ip || undefined,
        userAgent: (req.headers['user-agent'] as string) || undefined
      });

      return res.json({
        sucesso: true,
        status: 'completed',
        total: activeSubs.length,
        sucessos,
        falhas,
        mensagem: `Broadcast concluído: ${sucessos} entregas confirmadas, ${falhas} falhas.`
      });
    } catch (err: any) {
      return res.status(500).json({
        sucesso: false,
        status: 'failed',
        mensagem: `Erro ao processar broadcast: ${err.message}`
      });
    }
  });

  app.use('/api/push', router);
  app.use('/api', router);
};
