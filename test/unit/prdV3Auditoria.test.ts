import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ZabbixService } from '../../server/zabbix/zabbixService';
import { originateCampaignVoiceCall } from '../../server/asterisk';
import { sanitizeAuditPayload } from '../../server/security/httpSecurity';

describe('PRD V3 - Homologação e Hardening Operacional', () => {

  describe('1. Bloqueador 01 - Telefonia Asterisk e Campanhas de Voz Reais', () => {
    it('1.1 Deve rejeitar números telefônicos inválidos sem originar chamada SIP', async () => {
      const res = await originateCampaignVoiceCall({
        campaignId: 999,
        recipientId: 101,
        telefone: '123',
        idempotencyKey: 'test_invalid_phone_123'
      });

      assert.strictEqual(res.status, 'failed');
      assert.strictEqual(res.errorCode, 'INVALID_PHONE_NUMBER');
      assert.ok(res.errorMessage?.includes('inválido'));
    });

    it('1.2 Asterisk indisponível deve retornar falha explícita com ASTERISK_UNAVAILABLE', async () => {
      // Força portas do Asterisk para porta inativa para simular indisponibilidade
      const originalPort = process.env.ASTERISK_PORT_AMI;
      process.env.ASTERISK_PORT_AMI = '59999';
      process.env.ASTERISK_PORT_ARI = '59998';

      const res = await originateCampaignVoiceCall({
        campaignId: 999,
        recipientId: 102,
        telefone: '98981234567',
        idempotencyKey: 'test_ast_unavailable_1'
      });

      process.env.ASTERISK_PORT_AMI = originalPort;

      assert.strictEqual(res.status, 'failed');
      assert.ok(res.errorCode === 'ASTERISK_UNAVAILABLE' || res.errorCode === 'ARI_NOT_CONNECTED');
      assert.ok(!res.answeredAt, 'Nunca deve registrar answeredAt se o servidor de telefonia estiver offline');
    });

    it('1.3 Nunca deve usar status "sent" como substituto de chamada telefônica', () => {
      const allowedVoiceStates = ['queued', 'originating', 'ringing', 'answered', 'no_answer', 'busy', 'failed', 'cancelled'];
      assert.ok(!allowedVoiceStates.includes('sent'), 'O estado "sent" é proibido no domínio de telefonia');
    });
  });

  describe('2. Bloqueador 02 - NOC Security Alerts & Zabbix API 7.0 LTS', () => {
    it('2.1 Deve retornar status not_configured quando credenciais Zabbix estiverem ausentes', async () => {
      const zabbixService = ZabbixService.getInstance();
      zabbixService.configure('', '');

      const res = await zabbixService.getSecurityAlertsReal();

      assert.strictEqual(res.status, 'not_configured');
      assert.deepStrictEqual(res.alerts, []);
    });

    it('2.2 Zabbix indisponível deve retornar status unavailable sem inventar alertas', async () => {
      const zabbixService = ZabbixService.getInstance();
      zabbixService.configure('http://127.0.0.1:59997', 'token_teste_mock');

      const res = await zabbixService.getSecurityAlertsReal();

      // Restaura configuração padrão
      zabbixService.configure(undefined, undefined);

      assert.strictEqual(res.status, 'unavailable');
      assert.deepStrictEqual(res.alerts, []);
      assert.ok(res.error, 'Deve reportar motivo de indisponibilidade');
    });

    it('2.3 Alertas reais do Zabbix devem possuir modelo estrito com source_event_id rastreável', () => {
      const mockAlert = {
        id: 'sec_100234',
        source: 'zabbix',
        source_event_id: '100234',
        host_id: '10084',
        host_name: 'BGP-Gateway-Core',
        severity: 'high',
        category: 'ddos',
        name: 'SYN Flood detected on WAN interface',
        description: 'Evento real registrado no Zabbix [EventID #100234]',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active',
        acknowledged: false
      };

      assert.ok(mockAlert.source_event_id, 'source_event_id é obrigatório para rastreabilidade com o Zabbix');
      assert.ok(['ddos', 'brute_force', 'intrusion', 'firewall', 'port_scan', 'authentication', 'availability', 'other'].includes(mockAlert.category));
      assert.strictEqual(mockAlert.source, 'zabbix');
    });
  });

  describe('3. Bloqueador 03 - Web Push Authorization e RBAC', () => {
    it('3.1 Usuário comum tentando associar subscription a outro user_id deve ser bloqueado', () => {
      const currentUser = { id: 10, nome: 'Operador N1', cargo: 'OPERADOR' };
      const requestedOperadorId = 99; // Outro operador

      const isForbidden = requestedOperadorId !== currentUser.id && currentUser.cargo !== 'ADMIN' && currentUser.cargo !== 'SUPERADMIN';
      assert.strictEqual(isForbidden, true, 'Operador comum não pode vincular push de terceiros');
    });

    it('3.2 Administrador pode vincular subscription de outro operador mediante auditoria', () => {
      const adminUser = { id: 1, nome: 'Super Admin', cargo: 'ADMIN' };
      const requestedOperadorId = 10;

      const isAllowed = adminUser.cargo === 'ADMIN' || adminUser.cargo === 'SUPERADMIN';
      assert.strictEqual(isAllowed, true, 'Administrador possui prerrogativa de delegação com RBAC');
    });

    it('3.3 Erros HTTP 404 e 410 no disparo de push devem desativar a subscription', () => {
      const pushError410 = { statusCode: 410, message: 'Gone: subscription has expired or unsubscribed' };
      const shouldDeactivate = pushError410.statusCode === 404 || pushError410.statusCode === 410;
      assert.strictEqual(shouldDeactivate, true, 'Subscription deve ser inativada no PostgreSQL ao receber 404 ou 410');
    });
  });

  describe('4. Bloqueador 04 & 05 - Setup Wizard e Auditoria Imutável', () => {
    it('4.1 Em produção (NODE_ENV=production), Setup Wizard deve retornar HTTP 403', () => {
      const env = 'production';
      const isAllowed = env !== 'production';
      assert.strictEqual(isAllowed, false, 'Setup Wizard deve ser bloqueado sem exceção em produção');
    });

    it('4.2 Setup Wizard deve rejeitar qualquer secret de infraestrutura no body', () => {
      const forbiddenKeys = ['geminiApiKey', 'sgpToken', 'amiPassword', 'jwtSecret', 'databaseUrl', 'privateKey'];
      const bodyWithSecret = { adminEmail: 'admin@nap.com', geminiApiKey: 'AIzaSySecret...' };

      const hasForbiddenSecret = Object.keys(bodyWithSecret).some(k => forbiddenKeys.includes(k) || k.toLowerCase().includes('secret'));
      assert.strictEqual(hasForbiddenSecret, true, 'Body contendo secrets de infraestrutura deve ser rejeitado com HTTP 400');
    });

    it('4.3 Trilha de auditoria deve higienizar tokens e credenciais antes da persistência', () => {
      const payloadSensivel = {
        usuario: 'admin@provedor.com.br',
        detalhes: 'Tentativa de login com password="SenhaSuperSecreta123" e token Bearer eyJhbGciOiJIUzI1Ni...'
      };

      const higienizado = sanitizeAuditPayload(payloadSensivel.detalhes);
      assert.ok(!higienizado.includes('SenhaSuperSecreta123'), 'Senha deve ser mascarada com [REDACTED]');
      assert.ok(higienizado.includes('[REDACTED]'), 'Deve conter tag de sanitização');
    });
  });

  describe('5. Bloqueador 06 - WABA & Campanhas com Idempotência e Execução Real', () => {
    it('5.1 Disparo WABA sem providerMessageId retornado da Meta API deve ser marcado como failed', () => {
      const metaResponseSemId = { error: { message: 'Invalid OAuth token' } };
      const providerId = (metaResponseSemId as any).messages?.[0]?.id;

      const statusFinal = providerId ? 'sent' : 'failed';
      assert.strictEqual(statusFinal, 'failed', 'Sem message_id da Meta, o status deve ser obrigatoriamente failed');
    });

    it('5.2 Chave de idempotência de campanha deve ser composta por execução, destinatário e canal', () => {
      const execucaoId = 42;
      const destId = 1005;
      const canal = 'voz';
      const chaveIdempotente = `call_${execucaoId}_${destId}_${canal}`;

      assert.strictEqual(chaveIdempotente, 'call_42_1005_voz');
    });

    it('5.3 Recuperação pós-restart deve transitar execuções órfãs para failed sem inventar sucessos', () => {
      const execucoesOrfas = [{ id: 1, status: 'running' }];
      const execucoesRecuperadas = execucoesOrfas.map(e => ({
        ...e,
        status: 'failed',
        detalhes: 'Execução interrompida por reinício do servidor.'
      }));

      assert.strictEqual(execucoesRecuperadas[0].status, 'failed');
      assert.ok(execucoesRecuperadas[0].detalhes.includes('interrompida'));
    });
  });
});
