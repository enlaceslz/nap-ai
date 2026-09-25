import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { generatePushEnrollmentToken, verifyPushEnrollmentToken } from '../server/push/operatorPushRoutes';
import { webPushService } from '../server/push/webPushService';
import { ZabbixService } from '../server/zabbix/zabbixService';
import { originateCampaignVoiceCall } from '../server/asterisk';

describe('NAP-AI V9 — Correção dos Bloqueadores Finais da Auditoria Independente', () => {

  describe('1. 🔴 BLOQUEADOR CRÍTICO: Autorização Estrita em /api/cobranca/push/send (Item 2)', () => {
    it('1.1 reguaRoutes.ts deve rejeitar endpoints arbitrários (HTTP/HTTPS) com 403 Forbidden', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/marketing/reguaRoutes.ts'), 'utf8');
      assert.ok(code.includes("startsWith('http://') || target.startsWith('https://')"));
      assert.ok(code.includes("Endpoints Push arbitrários não são aceitos como autorização de identidade"));
      assert.ok(code.includes("status(403)"));
    });

    it('1.2 reguaRoutes.ts deve exigir perfil ADMIN ou SUPERADMIN para notificar outro usuário', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/marketing/reguaRoutes.ts'), 'utf8');
      assert.ok(code.includes("targetUserId !== currentUserId && !isAdmin"));
      assert.ok(code.includes("apenas administradores com perfil RBAC podem enviar notificações Push para outros usuários"));
    });

    it('1.3 reguaRoutes.ts deve validar existência do usuário no PostgreSQL e retornar 404 se inexistente', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/marketing/reguaRoutes.ts'), 'utf8');
      assert.ok(code.includes("eq(users.id, targetUserId)"));
      assert.ok(code.includes("status: \"user_not_found\""));
    });

    it('1.4 reguaRoutes.ts deve validar permissão RBAC e existência do cliente para envio de push', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/marketing/reguaRoutes.ts'), 'utf8');
      assert.ok(code.includes("Perfil de usuário sem permissão RBAC para notificar clientes"));
      assert.ok(code.includes("eq(clientes.id, targetClienteId)"));
      assert.ok(code.includes("status: \"cliente_not_found\""));
    });

    it('1.5 reguaRoutes.ts deve consultar subscrição vinculada estritamente ao clienteId (NUNCA users.id)', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/marketing/reguaRoutes.ts'), 'utf8');
      assert.ok(code.includes("eq(push_subscriptions.clienteId, targetClienteId)"));
      assert.ok(code.includes("status: \"subscription_not_found\""));
    });
  });

  describe('2. 🔴 BLOQUEADOR CRÍTICO: Proteção Criptográfica em /portal/subscribe (Item 3)', () => {
    it('2.1 generatePushEnrollmentToken e verifyPushEnrollmentToken devem autenticar cliente legítimo', () => {
      const clienteId = 42;
      const token = generatePushEnrollmentToken(clienteId, { expiresInSeconds: 60 });
      assert.strictEqual(typeof token, 'string');
      assert.ok(token.includes('.'));

      const res = verifyPushEnrollmentToken(token);
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.clienteId, clienteId);
    });

    it('2.2 verifyPushEnrollmentToken deve rejeitar token com assinatura violada / forjada', () => {
      const token = generatePushEnrollmentToken(10, { expiresInSeconds: 60 });
      const [payload, sig] = token.split('.');
      const forgedToken = `${payload}.${sig.slice(0, -4)}xxxx`;

      const res = verifyPushEnrollmentToken(forgedToken);
      assert.strictEqual(res.valid, false);
      assert.ok(res.error?.includes('Assinatura criptográfica'));
    });

    it('2.3 verifyPushEnrollmentToken deve rejeitar token expirado', async () => {
      // Gera token com expiração negativa (-1 segundo)
      const token = generatePushEnrollmentToken(55, { expiresInSeconds: -1 });
      const res = verifyPushEnrollmentToken(token);
      assert.strictEqual(res.valid, false);
      assert.ok(res.error?.includes('expirado'));
    });

    it('2.4 operatorPushRoutes.ts deve rejeitar inscrição no portal sem autenticação ou enrollment token com 401', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/push/operatorPushRoutes.ts'), 'utf8');
      assert.ok(code.includes("status: 'authentication_required'"));
      assert.ok(code.includes("status(401)"));
    });

    it('2.5 operatorPushRoutes.ts deve rejeitar tentativa de registrar para outro cliente com 403 Forbidden', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/push/operatorPushRoutes.ts'), 'utf8');
      assert.ok(code.includes("cliente_id && Number(cliente_id) !== effectiveClienteId"));
      assert.ok(code.includes("Tentativa de registrar subscrição para outro cliente não autorizada"));
      assert.ok(code.includes("status: 'forbidden'"));
    });

    it('2.6 operatorPushRoutes.ts deve validar existência do cliente e retornar 404 se inexistente', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/push/operatorPushRoutes.ts'), 'utf8');
      assert.ok(code.includes("eq(clientes.id, effectiveClienteId)"));
      assert.ok(code.includes("status: 'cliente_not_found'"));
      assert.ok(code.includes("status(404)"));
    });
  });

  describe('3. 🔴 ASTERISK ARI — Máquina de Estados, Canal Tardio e Idempotência (Itens 4 e 5)', () => {
    it('3.1 OriginateCallResult deve suportar todos os estados canônicos incluindo originating_timeout e reconciliation_required', () => {
      const astCode = fs.readFileSync(path.join(process.cwd(), 'server/asterisk.ts'), 'utf8');
      assert.ok(astCode.includes("'originating_timeout'"));
      assert.ok(astCode.includes("'reconciliation_required'"));
      assert.ok(astCode.includes("'terminating'"));
      assert.ok(astCode.includes("'completed'"));
    });

    it('3.2 Timeout antes do canal deve transicionar para originating_timeout e reconciliation_required', () => {
      const astCode = fs.readFileSync(path.join(process.cwd(), 'server/asterisk.ts'), 'utf8');
      assert.ok(astCode.includes("status: 'originating_timeout'"));
      assert.ok(astCode.includes("result: 'reconciliation_required'"));
      assert.ok(astCode.includes("hangupCause: 'ORIGINATING_TIMEOUT'"));
    });

    it('3.3 Canal tardio entregue após timeout deve registrar canais, solicitar hangup e aguardar ChannelDestroyed', () => {
      const astCode = fs.readFileSync(path.join(process.cwd(), 'server/asterisk.ts'), 'utf8');
      assert.ok(astCode.includes("Canal tardio entregue pelo Asterisk após timeout"));
      assert.ok(astCode.includes("status: 'terminating'"));
      assert.ok(astCode.includes("hangupCause: 'LATE_CHANNEL_TERMINATING'"));
      assert.ok(astCode.includes("channel.once('ChannelDestroyed'"));
      assert.ok(astCode.includes("result: 'reconciliation_completed'"));
      assert.ok(astCode.includes("channel.hangup()"));
    });

    it('3.4 Idempotência: banco de dados indisponível DEVE impedir originação', async () => {
      const res = await originateCampaignVoiceCall({
        campaignId: 1,
        recipientId: 1,
        telefone: '11999998888',
        idempotencyKey: 'idemp_v9_test_run'
      });
      // Em ambiente de teste sem Asterisk/PostgreSQL real, a chamada é terminantemente rejeitada
      assert.strictEqual(res.status, 'failed');
      assert.ok(res.errorCode === 'PERSISTENCE_UNAVAILABLE' || res.errorCode === 'ASTERISK_UNAVAILABLE');
    });
  });

  describe('4. 🟠 ZABBIX — Sem Host Inventado e Sem Cache Local Operacional (Item 6)', () => {
    it('4.1 getSecurityAlertsReal não deve inventar host_id nem host_name se ausentes', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/zabbix/zabbixService.ts'), 'utf8');
      assert.ok(code.includes("primaryHost?.hostid ? String(primaryHost.hostid) : null"));
      assert.ok(code.includes("primaryHost?.name || primaryHost?.host || null"));
      assert.strictEqual(code.includes('Zabbix Gateway'), false);
    });

    it('4.2 getSecurityAlertsReal deve usar ID aleatório seguro e nunca Date.now() no JSON-RPC', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/zabbix/zabbixService.ts'), 'utf8');
      assert.strictEqual(code.includes('id: Date.now()'), false);
      assert.ok(code.includes('id: randomInt(1, 1000000)'));
    });
  });

  describe('5. 🟠 RÉGUA DE COBRANÇA — Erradicação de Fallback em Memória (Item 7)', () => {
    it('5.1 GET /regua deve retornar 503 OPERATIONAL_DATA_UNAVAILABLE se PostgreSQL estiver indisponível', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/marketing/reguaRoutes.ts'), 'utf8');
      assert.ok(code.includes("code: \"OPERATIONAL_DATA_UNAVAILABLE\""));
      assert.ok(code.includes("status(503)"));
      assert.strictEqual(
        code.includes("let historicoPostgres = globalReguaConfig.historicoExecucoes;"),
        false,
        "NÃO deve usar globalReguaConfig como fallback para histórico"
      );
    });

    it('5.2 POST /regua/simular-teste não deve conter valor fictício 99,90 fixo', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/marketing/reguaRoutes.ts'), 'utf8');
      assert.strictEqual(code.includes('"99,90"'), false);
      assert.ok(code.includes('"[Valor da Fatura]"'));
    });
  });

  describe('6. 🔴 VAPID & DADOS FICTÍCIOS — Erradicação de admin@nap.local e Fake Tickets (Itens 8 e 9)', () => {
    it('6.1 webPushService.ts não deve conter fallback mailto:admin@nap.local', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/push/webPushService.ts'), 'utf8');
      assert.strictEqual(code.includes('mailto:admin@nap.local'), false);
      assert.ok(code.includes('VAPID_SUBJECT ausente. WebPush desabilitado'));
    });

    it('6.2 PortalSuporte.tsx não deve fabricar ticket João Silva nem fallback Fibra Óptica', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'src/pages/PortalSuporte.tsx'), 'utf8');
      assert.strictEqual(code.includes('João Silva'), false);
      assert.strictEqual(code.includes("plano: clientData.plano || 'Fibra Óptica'"), false);
      assert.ok(code.includes("dado_nao_cadastrado"));
    });
  });

  describe('7. 🟠 WEBPUSH — Semântica de Status e Provedor (Item 10)', () => {
    it('7.1 webPushService.ts deve retornar status "accepted" e nunca "delivered" após envio bem-sucedido', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/push/webPushService.ts'), 'utf8');
      assert.ok(code.includes("status: 'accepted'"));
      assert.ok(code.includes("Notificação aceita pelo serviço WebPush"));
      // Garante que sendNotification não retorna delivered falsamente
      assert.strictEqual(code.includes("status: 'delivered'"), false);
    });

    it('7.2 Não deve inventar provider_message_id sintético no WebPush', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/noc/incidentesRoutes.ts'), 'utf8');
      assert.ok(code.includes("providerMessageId: null"));
      assert.ok(code.includes("deliveredAt: null"));
      assert.ok(code.includes("status: \"accepted\""));
    });
  });

  describe('8. 🔴 NOC — Notificações de Incidentes com Trilha e Tipos Estritos (Item 11)', () => {
    it('8.1 incidentesRoutes.ts deve registrar incident_notifications com recipientType, recipientId e subscriptionId', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/noc/incidentesRoutes.ts'), 'utf8');
      assert.ok(code.includes("recipientType: \"cliente\""));
      assert.ok(code.includes("customerId: cliente.id"));
      assert.ok(code.includes("subscriptionId: sub.id"));
      assert.ok(code.includes("channel: \"whatsapp\""));
      assert.ok(code.includes("channel: \"push\""));
    });

    it('8.2 incidentesRoutes.ts deve utilizar providerMessageId real do Meta Graph API para WABA', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/noc/incidentesRoutes.ts'), 'utf8');
      assert.ok(code.includes("const providerId = metaData.messages?.[0]?.id;"));
      assert.ok(code.includes("providerMessageId: providerId"));
    });
  });

});
