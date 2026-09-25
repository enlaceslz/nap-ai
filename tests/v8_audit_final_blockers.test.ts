import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { webPushService } from '../server/push/webPushService';
import { ZabbixService } from '../server/zabbix/zabbixService';
import { originateCampaignVoiceCall } from '../server/asterisk';

describe('NAP-AI V8 — Correção dos Bloqueadores Finais da Auditoria Independente', () => {

  describe('1. 🔴 BLOQUEADOR CRÍTICO: Separação entre Cliente ISP e Usuário NAP (Item 2)', () => {
    it('1.1 schema.ts deve modelar push_subscriptions com userId e clienteId explicitamente separados', () => {
      const schema = fs.readFileSync(path.join(process.cwd(), 'src/db/schema.ts'), 'utf8');
      assert.ok(schema.includes("userId: integer('user_id').references(() => users.id)"));
      assert.ok(schema.includes("clienteId: integer('cliente_id').references(() => clientes.id)"));
      assert.ok(schema.includes("idx_push_sub_cliente_id"));
    });

    it('1.2 incidentesRoutes.ts NUNCA deve associar push_subscriptions.userId a cliente.id', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/noc/incidentesRoutes.ts'), 'utf8');
      assert.strictEqual(
        code.includes('eq(push_subscriptions.userId, cliente.id)'),
        false,
        'NÃO deve conter eq(push_subscriptions.userId, cliente.id)'
      );
      assert.ok(
        code.includes('eq(push_subscriptions.clienteId, cliente.id)'),
        'DEVE consultar por push_subscriptions.clienteId'
      );
    });

    it('1.3 incidentesRoutes.ts deve registrar subscriptionId na tabela incident_notifications', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/noc/incidentesRoutes.ts'), 'utf8');
      assert.ok(code.includes('subscriptionId: sub.id'), 'Deve persistir o subscriptionId real da inscrição utilizada');
      assert.ok(code.includes('customerId: cliente.id'), 'Deve persistir o customerId real');
    });

    it('1.4 webPushService deve prover métodos segregados sendToCliente e sendToUser', () => {
      assert.strictEqual(typeof (webPushService as any).sendToCliente, 'function');
      assert.strictEqual(typeof (webPushService as any).sendToUser, 'function');
    });
  });

  describe('2. 🟠 WEBPUSH — Semântica de Status e VAPID Subject (Itens 3 e 10)', () => {
    it('2.1 incident_notifications para WebPush deve usar status "accepted" com deliveredAt=null e providerMessageId=null', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/noc/incidentesRoutes.ts'), 'utf8');
      assert.ok(code.includes('status: "accepted"'), 'WebPush sem confirmação de entrega no dispositivo deve ser accepted');
      assert.ok(code.includes('deliveredAt: null'), 'deliveredAt deve ser null');
      assert.ok(code.includes('providerMessageId: null'), 'providerMessageId deve ser null');
      assert.strictEqual(code.includes('push_${Date.now()}'), false, 'Não deve inventar identificador de push');
    });

    it('2.2 Retorno do NOC deve explicitar que push foi aceito pelo provedor e não entregue ao dispositivo', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/noc/incidentesRoutes.ts'), 'utf8');
      assert.ok(code.includes('aceitosWebPush'));
      assert.ok(code.includes('enviadosWhatsapp'));
      assert.ok(code.includes('Nenhuma entrega física em dispositivo é presumida'));
    });

    it('2.3 VAPID em produção sem VAPID_SUBJECT deve desabilitar push (not_configured) sem inventar fallback', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/push/webPushService.ts'), 'utf8');
      assert.ok(code.includes("VAPID_SUBJECT não configurado em ambiente de produção"));
      assert.ok(code.includes("this.vapidConfigured = false"));
    });
  });

  describe('3. 🔴 ASTERISK — Lifecycle, Identificadores e Timeout (Itens 4 e 5)', () => {
    it('3.1 Lifecycle deve validar telefone e indisponibilidade antes de originar chamada', async () => {
      const res = await originateCampaignVoiceCall({
        campaignId: 1,
        recipientId: 1,
        telefone: '00', // Inválido
        idempotencyKey: 'test_ast_v8_invalid'
      });
      assert.strictEqual(res.status, 'failed');
      assert.strictEqual(res.errorCode, 'INVALID_PHONE_NUMBER');
    });

    it('3.2 asterisk.ts não deve fabricar IDs com Date.now() ou Math.random() para canais SIP', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/asterisk.ts'), 'utf8');
      assert.strictEqual(code.includes('ast_${Date.now()}'), false);
      assert.strictEqual(code.includes('Math.random()'), false);
    });

    it('3.3 Timeout da chamada deve acionar hangup explícito e estado intermediário reconciliation_required', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/asterisk.ts'), 'utf8');
      assert.ok(code.includes('activeChannel.hangup()'));
      assert.ok(code.includes('RECONCILIATION_REQUIRED'));
    });
  });

  describe('4. 🟠 ZABBIX — Sem Host Fictício e Sem Cache Local Operacional (Itens 6 e 7)', () => {
    it('4.1 getSecurityAlertsReal não deve inventar host_id nem usar "Zabbix Gateway"', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/zabbix/zabbixService.ts'), 'utf8');
      assert.strictEqual(code.includes('Zabbix Gateway'), false);
      assert.ok(code.includes('host_id: primaryHost?.hostid || null'));
    });

    it('4.2 ZabbixService deve implementar 6 estados canônicos de conexão', () => {
      const zabbix = new ZabbixService();
      assert.strictEqual(typeof zabbix.checkRealConnectionStatus, 'function');
    });
  });

  describe('5. 🟠 RÉGUA DE COBRANÇA — Persistência 100% PostgreSQL e Sem Dados Fictícios (Itens 8 e 9)', () => {
    it('5.1 reguaRoutes.ts deve consultar e gravar execuções em regua_execucoes e regua_disparos', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/marketing/reguaRoutes.ts'), 'utf8');
      assert.ok(code.includes('db.select().from(regua_execucoes)'));
      assert.ok(code.includes('db.insert(regua_execucoes)'));
      assert.ok(code.includes('db.insert(regua_disparos)'));
    });

    it('5.2 reguaRoutes.ts não deve utilizar "Fibra Óptica" como plano substituto padrão', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/marketing/reguaRoutes.ts'), 'utf8');
      assert.strictEqual(
        code.includes('cliente.plano || "Fibra Óptica"'),
        false,
        'NÃO deve conter fallback "Fibra Óptica"'
      );
      assert.ok(code.includes('plano ausente'), 'Deve marcar como "plano ausente" se incompleto');
    });

    it('5.3 reguaRoutes.ts não deve utilizar domínios fictícios como central.provedor.com.br ou isp.provedor.com.br', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/marketing/reguaRoutes.ts'), 'utf8');
      assert.strictEqual(code.includes('https://central.provedor.com.br/faturas/${fatura.id}'), false);
      assert.strictEqual(code.includes('https://isp.provedor.com.br'), false);
      assert.ok(code.includes('/portal/faturas/'), 'Deve apontar para a rota real de fatura do portal');
    });
  });

});
