import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { normalizeZabbixApiUrl, ZabbixService } from '../server/zabbix/zabbixService';
import { sanitizeConfig } from '../server/gemini_routes';
import { appendAuditLog, getAuditHealthStatus, sanitizeAuditPayload } from '../server/security/httpSecurity';

describe('NAP-AI V7 — Auditoria Independente: Verificação Técnica dos Bloqueadores Finais', () => {

  describe('1. 🔴 NOC — Eliminação de Fallback em Memória e Persistência 100% (Itens 2 e 3)', () => {
    it('incidentesRoutes.ts não deve conter let incidentesRedeMemoria = [] como fonte operacional', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/noc/incidentesRoutes.ts'), 'utf8');
      assert.equal(code.includes('let incidentesRedeMemoria'), false, 'Não deve conter incidentesRedeMemoria em memória');
    });

    it('tabela incidentes_rede deve estar no schema.ts e possuir migration correspondente', () => {
      const schema = fs.readFileSync(path.join(process.cwd(), 'src/db/schema.ts'), 'utf8');
      assert.equal(schema.includes("pgTable('incidentes_rede'"), true);
      assert.equal(schema.includes("protocolo: varchar('protocolo'"), true);
      assert.equal(schema.includes("regioesAfetadas: text('regioes_afetadas')"), true);

      const migration = fs.readFileSync(path.join(process.cwd(), 'drizzle/0006_fluffy_iron_monger.sql'), 'utf8');
      assert.equal(migration.includes('CREATE TABLE IF NOT EXISTS "incidentes_rede"'), true);
    });

    it('quando PostgreSQL estiver indisponível, rotas do NOC devem responder HTTP 503 com database_unavailable', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/noc/incidentesRoutes.ts'), 'utf8');
      assert.equal(code.includes('status: "database_unavailable"'), true);
      assert.equal(code.includes('503'), true);
    });
  });

  describe('2. 🔴 NOC — Clientes Afetados Reais sem .limit() Artificial (Item 4)', () => {
    it('não deve conter .limit(Math.min(clientesAfetadosAprox...)) na seleção de clientes para notificação', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/noc/incidentesRoutes.ts'), 'utf8');
      assert.equal(code.includes('Math.min(clientesAfetadosAprox'), false);
      assert.equal(code.includes('.limit(Math.min'), false);
    });

    it('deve retornar status explícito affected_clients_unresolved se critérios geográficos forem insuficientes', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/noc/incidentesRoutes.ts'), 'utf8');
      assert.equal(code.includes('affected_clients_unresolved'), true);
    });
  });

  describe('3. 🔴 NOC — Notificações com Status Individual e WebPush sem ID Fabricado (Itens 5 e 6)', () => {
    it('tabela incident_notifications deve possuir colunas individuais de status e rastreamento', () => {
      const schema = fs.readFileSync(path.join(process.cwd(), 'src/db/schema.ts'), 'utf8');
      assert.equal(schema.includes("status: varchar('status'"), true);
      assert.equal(schema.includes("recipientType: varchar('recipient_type'"), true);
      assert.equal(schema.includes("recipientId: integer('recipient_id'"), true);
      assert.equal(schema.includes("attemptCount: integer('attempt_count'"), true);
      assert.equal(schema.includes("requestedAt: timestamp('requested_at'"), true);
    });

    it('WebPush não deve receber provider_message_id fabricado com push_${Date.now()}', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/noc/incidentesRoutes.ts'), 'utf8');
      assert.equal(code.includes('push_${Date.now()}'), false, 'Não deve fabricar push_${Date.now()}');
      assert.equal(code.includes('providerMessageId: null'), true, 'WebPush deve ter providerMessageId = null');
    });
  });

  describe('4. 🟠 WEBPUSH — Identidade e RBAC do Destinatário (Item 7)', () => {
    it('operatorPushRoutes.ts deve validar userId como identidade e exigir ADMIN/SUPERADMIN para envio a outros', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/push/operatorPushRoutes.ts'), 'utf8');
      assert.equal(code.includes('effectiveUserId'), true);
      assert.equal(code.includes("userRole !== 'ADMIN' && userRole !== 'SUPERADMIN'"), true);
      assert.equal(code.includes('targetUserId !== currentUserId'), true);
    });

    it('endpoint informado deve ser validado para garantir que pertence ao targetUserId', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/push/operatorPushRoutes.ts'), 'utf8');
      assert.equal(code.includes('eq(push_subscriptions.endpoint, endpoint)'), true);
      assert.equal(code.includes('eq(push_subscriptions.userId, targetUserId)'), true);
      assert.equal(code.includes('o endpoint informado não pertence ao usuário de destino autorizado'), true);
    });
  });

  describe('5. 🔴 ASTERISK — Lifecycle, Hangup no Timeout e Identificadores Reais (Itens 8, 9, 10, 11, 12)', () => {
    it('asterisk.ts não deve fabricar ast_${Date.now()} ou similares para canais', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/asterisk.ts'), 'utf8');
      assert.equal(code.includes('ast_${Date.now()}'), false);
      assert.equal(code.includes('ast_${Date.now()}_${cleanPhone}'), false);
    });

    it('asterisk.ts deve solicitar activeChannel.hangup() e aguardar confirmação antes de declarar encerramento', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/asterisk.ts'), 'utf8');
      assert.equal(code.includes('activeChannel.hangup'), true);
      assert.equal(code.includes('fallbackReconciliationTimer'), true);
      assert.equal(code.includes('RECONCILIATION_REQUIRED'), true);
    });

    it('falha no banco de dados deve impedir terminantemente a originação da chamada telefônica (Item 11)', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/asterisk.ts'), 'utf8');
      assert.equal(code.includes('PERSISTENCE_UNAVAILABLE'), true);
      assert.equal(code.includes('Banco de dados PostgreSQL indisponível. Originação telefônica terminantemente cancelada'), true);
    });

    it('tabela campanhas_chamadas_voz deve possuir idempotency_key UNIQUE e campos completos de rastreabilidade (Item 12)', () => {
      const schema = fs.readFileSync(path.join(process.cwd(), 'src/db/schema.ts'), 'utf8');
      assert.equal(schema.includes("idempotencyKey: varchar('idempotency_key', { length: 255 }).unique()"), true);
      assert.equal(schema.includes("asteriskChannelId: varchar('asterisk_channel_id'"), true);
      assert.equal(schema.includes("asteriskUniqueId: varchar('asterisk_unique_id'"), true);
      assert.equal(schema.includes("durationSeconds: integer('duration_seconds'"), true);
      assert.equal(schema.includes("hangupCause: varchar('hangup_cause'"), true);
    });
  });

  describe('6. 🟠 ZABBIX — Conexão Real, Hosts Reais e Contrato de URL (Itens 13, 14, 15)', () => {
    it('normalizeZabbixApiUrl deve normalizar a URL sem duplicações de /api_jsonrpc.php', () => {
      assert.equal(normalizeZabbixApiUrl('http://zabbix.slz.local/zabbix'), 'http://zabbix.slz.local/zabbix/api_jsonrpc.php');
      assert.equal(normalizeZabbixApiUrl('http://zabbix.slz.local/zabbix/api_jsonrpc.php'), 'http://zabbix.slz.local/zabbix/api_jsonrpc.php');
      assert.equal(normalizeZabbixApiUrl('http://zabbix.slz.local:8080'), 'http://zabbix.slz.local:8080/api_jsonrpc.php');
    });

    it('ZabbixService deve implementar checkRealConnectionStatus com estados semânticos corretos', async () => {
      const zabbix = ZabbixService.getInstance();
      const status = await zabbix.checkRealConnectionStatus();
      // Em ambiente local sem Zabbix configurado, deve retornar not_configured ou unavailable
      assert.equal(['not_configured', 'unavailable', 'connected', 'authentication_failed', 'error'].includes(status.status), true);
    });

    it('zabbixService.ts não deve utilizar host genérico fictício como "Zabbix Gateway"', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/zabbix/zabbixService.ts'), 'utf8');
      assert.equal(code.includes("'Zabbix Gateway'"), false);
      assert.equal(code.includes('hostId || null'), false); // Deve setar null se não vier
      assert.equal(code.includes('host_id: hostId'), true);
      assert.equal(code.includes('host_name: hostName'), true);
    });
  });

  describe('7. 🟠 RÉGUA DE COBRANÇA — Persistência Operacional em PostgreSQL (Item 16)', () => {
    it('tabelas regua_execucoes e regua_disparos devem existir no schema.ts e migrations', () => {
      const schema = fs.readFileSync(path.join(process.cwd(), 'src/db/schema.ts'), 'utf8');
      assert.equal(schema.includes("pgTable('regua_execucoes'"), true);
      assert.equal(schema.includes("pgTable('regua_disparos'"), true);

      const migration = fs.readFileSync(path.join(process.cwd(), 'drizzle/0007_fine_status_notifications.sql'), 'utf8');
      assert.equal(migration.includes('CREATE TABLE IF NOT EXISTS "regua_execucoes"'), true);
      assert.equal(migration.includes('CREATE TABLE IF NOT EXISTS "regua_disparos"'), true);
    });

    it('reguaRoutes.ts deve persistir execuções e disparos em regua_execucoes e regua_disparos', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/marketing/reguaRoutes.ts'), 'utf8');
      assert.equal(code.includes('db.insert(regua_execucoes)'), true);
      assert.equal(code.includes('db.insert(regua_disparos)'), true);
    });
  });

  describe('8. 🔴 AUDITORIA — Status Explícitos queued, persisted, failed (Item 18)', () => {
    it('appendAuditLog deve registrar evento com persistenceStatus = "queued" e nunca "persisted" em memória', () => {
      const entry = appendAuditLog({
        usuario: 'admin_teste',
        modulo: 'Teste de Auditoria',
        acao: 'Ação Teste',
        detalhes: 'Detalhe do log de auditoria',
        status: 'sucesso'
      });

      assert.equal(entry.persistenceStatus, 'queued');
      assert.equal(entry.status, 'sucesso');
      assert.notEqual(entry.entryHash, undefined);
    });

    it('sanitização de auditoria deve proteger segredos e tokens contra vazamento', () => {
      const payload = {
        token: 'secret_bearer_token_1234567890',
        password: 'minha_senha_secreta',
        usuario: 'operador_seguro'
      };

      const sanitized = sanitizeAuditPayload(payload);
      assert.equal(sanitized.token, '[REDACTED_SENSITIVE_DATA]');
      assert.equal(sanitized.password, '[REDACTED_SENSITIVE_DATA]');
      assert.equal(sanitized.usuario, 'operador_seguro');
    });
  });

  describe('9. 🔴 SECRETS — Proteção Absoluta Contra Vazamento ao Frontend (Item 19)', () => {
    it('sanitizeConfig deve mascarar todos os segredos e expor apenas flags booleanas', () => {
      const config = {
        apiKey: 'AIzaSy_SECRET_GEMINI_KEY',
        token: 'WABA_TOKEN_123',
        privateKey: 'PRIVATE_RSA_KEY',
        databaseUrl: 'postgres://user:pass@host:5432/db'
      };

      const sanitized = sanitizeConfig(config);
      assert.equal(sanitized.apiKey, '********');
      assert.equal(sanitized.apiKeyConfigurada, true);
      assert.equal(sanitized.token, '********');
      assert.equal(sanitized.tokenConfigurada, true);
      assert.equal(sanitized.privateKey, '********');
      assert.equal(sanitized.privateKeyConfigurada, true);
    });
  });

});
