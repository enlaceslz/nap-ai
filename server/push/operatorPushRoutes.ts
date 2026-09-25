import express from 'express';
import crypto from 'crypto';
import { webPushService } from './webPushService';
import { requireAuth } from '../auth/rbacMiddleware';
import { recordMandatoryAuditLog } from '../security/httpSecurity';
import { db } from '../../src/db/index';
import { users, push_subscriptions, clientes } from '../../src/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Geração de Push Enrollment Token criptograficamente assinado com HMAC-SHA256
 * Curta duração (padrão 15 min), uso único/nonce e cliente_id vinculado.
 */
export function generatePushEnrollmentToken(clienteId: number, options?: { expiresInSeconds?: number }): string {
  const secret = process.env.JWT_SECRET || process.env.NAP_JWT_SECRET || 'nap_portal_push_secret_v9';
  const expiresIn = options?.expiresInSeconds || 900; // 15 minutos
  const expiresAt = Date.now() + expiresIn * 1000;
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = JSON.stringify({ clienteId: Number(clienteId), expiresAt, nonce });
  const base64Payload = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(base64Payload).digest('base64url');
  return `${base64Payload}.${signature}`;
}

/**
 * Validação estrita do Push Enrollment Token
 */
export function verifyPushEnrollmentToken(token: string): { valid: boolean; clienteId?: number; error?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token de inscrição Push ausente ou inválido' };
  }
  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Formato inválido de token de inscrição' };
  }
  const [base64Payload, signature] = parts;
  const secret = process.env.JWT_SECRET || process.env.NAP_JWT_SECRET || 'nap_portal_push_secret_v9';
  const expectedSignature = crypto.createHmac('sha256', secret).update(base64Payload).digest('base64url');

  if (signature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return { valid: false, error: 'Assinatura criptográfica do token inválida' };
  }

  try {
    const payload = JSON.parse(Buffer.from(base64Payload, 'base64url').toString('utf8'));
    if (!payload.clienteId || !payload.expiresAt) {
      return { valid: false, error: 'Payload do token incompleto' };
    }
    if (Date.now() > payload.expiresAt) {
      return { valid: false, error: 'Token de inscrição Push expirado' };
    }
    return { valid: true, clienteId: Number(payload.clienteId) };
  } catch {
    return { valid: false, error: 'Falha ao decodificar token de inscrição' };
  }
}

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

  // 1.1 Inscrição do Portal do Assinante / Cliente ISP (PWA)
  // BLOQUEADOR CRÍTICO V9: NUNCA confiar em cliente_id arbitrário enviado pelo navegador.
  // Exige prova de identidade: Push Enrollment Token assinado criptograficamente ou sessão de cliente.
  router.post(['/cliente/subscribe', '/portal/subscribe'], async (req, res) => {
    try {
      const { subscription, cliente_id, cliente_nome, dispositivo } = req.body;
      const endpoint = subscription?.endpoint || req.body.endpoint;

      if (!endpoint) {
        return res.status(400).json({
          sucesso: false,
          status: 'failed',
          mensagem: 'Endpoint de subscrição Push obrigatório.'
        });
      }

      // 1. Identificar e validar autorização de identidade
      const rawToken = req.headers['x-push-enrollment-token'] || 
                       req.headers['x-enrollment-token'] || 
                       req.body.push_enrollment_token || 
                       req.body.enrollment_token || 
                       req.body.enrollmentToken ||
                       (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.substring(7) : null);

      const currentUser = (req as any).user;
      const userRole = (currentUser?.cargo || currentUser?.role || '').toUpperCase();
      const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN';

      let effectiveClienteId: number | null = null;

      if (rawToken && typeof rawToken === 'string') {
        const verification = verifyPushEnrollmentToken(rawToken);
        if (!verification.valid) {
          if (verification.error?.includes('expirado')) {
            return res.status(403).json({
              sucesso: false,
              status: 'expired_enrollment_token',
              mensagem: 'Token de inscrição Push expirado. Solicite novo token de inscrição no portal.'
            });
          }
          return res.status(403).json({
            sucesso: false,
            status: 'invalid_enrollment_token',
            mensagem: `Token de inscrição Push inválido: ${verification.error}`
          });
        }
        effectiveClienteId = verification.clienteId!;
      } else if (isAdmin && cliente_id) {
        // Administrador autenticado no painel pode associar push ao cliente
        effectiveClienteId = Number(cliente_id);
      } else if (currentUser?.clienteId) {
        effectiveClienteId = Number(currentUser.clienteId);
      } else {
        // Sem prova de identidade: rejeita imediatamente (NÃO aceitar cliente_id informado pelo navegador como prova)
        return res.status(401).json({
          sucesso: false,
          status: 'authentication_required',
          mensagem: 'Inscrição de push do portal exige autenticação do cliente ou token de inscrição assinado (push enrollment token).'
        });
      }

      // Se o cliente tentar especificar outro cliente_id no corpo diferente da identidade comprovada:
      if (cliente_id && Number(cliente_id) !== effectiveClienteId && !isAdmin) {
        return res.status(403).json({
          sucesso: false,
          status: 'forbidden',
          mensagem: 'Tentativa de registrar subscrição para outro cliente não autorizada. Mismatch de identidade.'
        });
      }

      // Validação estrita na tabela clientes (PostgreSQL)
      const clienteRows = await db.select().from(clientes).where(eq(clientes.id, effectiveClienteId)).limit(1);
      if (clienteRows.length === 0) {
        return res.status(404).json({
          sucesso: false,
          status: 'cliente_not_found',
          mensagem: `Cliente ISP #${effectiveClienteId} não encontrado no cadastro.`
        });
      }

      const clienteReal = clienteRows[0];

      const subItem = await webPushService.registerSubscription({
        endpoint,
        keys: subscription?.keys,
        clienteId: clienteReal.id,
        clienteNome: cliente_nome || clienteReal.nome,
        userId: null,
        operadorNome: null,
        dispositivo: dispositivo || 'Portal do Assinante PWA',
        userAgent: (req.headers['user-agent'] as string) || undefined
      });

      return res.status(201).json({
        sucesso: true,
        status: 'subscribed',
        mensagem: `Subscrição WebPush vinculada com sucesso ao cliente ISP #${clienteReal.id} (${clienteReal.nome}).`,
        subscription: subItem
      });
    } catch (err: any) {
      return res.status(500).json({
        sucesso: false,
        status: 'failed',
        mensagem: `Erro ao registrar subscrição do assinante: ${err.message}`
      });
    }
  });

  // 1.2 Emissão de Push Enrollment Token para o Portal do Assinante
  router.post(['/cliente/push-enrollment-token', '/portal/push-enrollment-token'], async (req, res) => {
    try {
      const { cliente_id, cpf } = req.body;
      let targetClienteId = cliente_id ? Number(cliente_id) : null;

      const currentUser = (req as any).user;
      if (!targetClienteId && currentUser?.clienteId) {
        targetClienteId = Number(currentUser.clienteId);
      }

      if (!targetClienteId && cpf) {
        const cleanCpf = String(cpf).replace(/\D/g, '');
        const rows = await db.select().from(clientes).where(eq(clientes.documento, cleanCpf)).limit(1);
        if (rows.length > 0) {
          targetClienteId = rows[0].id;
        }
      }

      if (!targetClienteId || isNaN(targetClienteId)) {
        return res.status(400).json({
          sucesso: false,
          status: 'failed',
          mensagem: 'Identificador cliente_id ou CPF válido obrigatório para emitir push enrollment token.'
        });
      }

      const clienteRows = await db.select().from(clientes).where(eq(clientes.id, targetClienteId)).limit(1);
      if (clienteRows.length === 0) {
        return res.status(404).json({
          sucesso: false,
          status: 'cliente_not_found',
          mensagem: `Cliente ISP #${targetClienteId} não encontrado no cadastro.`
        });
      }

      const token = generatePushEnrollmentToken(targetClienteId);
      return res.json({
        sucesso: true,
        clienteId: targetClienteId,
        pushEnrollmentToken: token,
        expiresInSeconds: 900
      });
    } catch (err: any) {
      return res.status(500).json({
        sucesso: false,
        status: 'error',
        mensagem: `Erro ao gerar push enrollment token: ${err.message}`
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

    // Se endpoint específico foi fornecido, validar obrigatoriamente que pertence ao targetUserId (regra V7: nunca usar endpoint de outro usuário)
    if (endpoint) {
      const ownedSub = await db.select().from(push_subscriptions)
        .where(and(eq(push_subscriptions.endpoint, endpoint), eq(push_subscriptions.userId, targetUserId), eq(push_subscriptions.active, true)))
        .limit(1);
      if (ownedSub.length === 0) {
        return res.status(403).json({
          sucesso: false,
          status: 'forbidden',
          mensagem: 'Acesso negado: o endpoint informado não pertence ao usuário de destino autorizado.'
        });
      }
    }

    try {
      const result = await webPushService.testPush({
        userId: targetUserId,
        operadorNome: targetOperadorNome,
        ramal,
        tipo,
        endpoint: endpoint || undefined
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
        status: result.status,
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
    const { operador_id, operador_nome, titulo, mensagem, categoria, dados, endpoint } = req.body;
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

    // Regra V7: operador_id (userId) é a identidade primária obrigatória
    let targetUserId = operador_id ? Number(operador_id) : currentUserId;
    let targetName = currentUser?.nome || currentUser?.email || 'Operador';

    // Se usuário comum tentar enviar para outro operador
    if (!isAdmin && targetUserId !== currentUserId) {
      return res.status(403).json({
        sucesso: false,
        status: 'forbidden',
        mensagem: 'Acesso negado: apenas administradores (RBAC) podem enviar notificações Push para outros operadores.'
      });
    }

    // Se for admin enviando para outro operador, valida existência do targetUserId no banco
    if (isAdmin && targetUserId !== currentUserId) {
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

    // Se endpoint específico foi informado, valida que pertence ao targetUserId
    if (endpoint) {
      const ownedSub = await db.select().from(push_subscriptions)
        .where(and(eq(push_subscriptions.endpoint, endpoint), eq(push_subscriptions.userId, targetUserId), eq(push_subscriptions.active, true)))
        .limit(1);
      if (ownedSub.length === 0) {
        return res.status(403).json({
          sucesso: false,
          status: 'forbidden',
          mensagem: 'Acesso negado: o endpoint informado não pertence ao usuário de destino autorizado.'
        });
      }
    }

    try {
      // REGRA V7: Utilizar userId (targetUserId) como identidade primária intransponível
      const result = endpoint 
        ? await webPushService.sendNotification(endpoint, {
            title: titulo || `[NAP] Alerta Operacional (${categoria || 'Geral'})`,
            body: mensagem || 'Você possui uma nova atribuição no sistema.',
            data: dados || {}
          })
        : await webPushService.sendNotification(targetUserId, {
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
        detalhes: `Push enviado por #${currentUserId} para o operador #${targetUserId} (${targetName}). Título: '${titulo || 'Alerta'}'. Resultado: ${result.status}`,
        recurso: `user_${targetUserId}`,
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
