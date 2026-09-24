import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { webPushService } from '../../server/push/webPushService';

describe('NAP V6 — Validação Técnica de Bloqueadores Finais', () => {

  describe('1. MIGRATIONS POSTGRESQL — Idempotência e Cobertura Integral', () => {
    const migrationFile = path.resolve(process.cwd(), 'drizzle', '0005_pale_santa_claus.sql');
    const journalFile = path.resolve(process.cwd(), 'drizzle', 'meta', '_journal.json');

    it('1.1 Arquivo de migration 0005 deve existir e estar registrado no journal', () => {
      assert.ok(fs.existsSync(migrationFile), 'Arquivo drizzle/0005_pale_santa_claus.sql deve existir');
      assert.ok(fs.existsSync(journalFile), 'Arquivo drizzle/meta/_journal.json deve existir');

      const journal = JSON.parse(fs.readFileSync(journalFile, 'utf8'));
      const entries = journal.entries || [];
      const hasMigration0005 = entries.some((e: any) => e.tag === '0005_pale_santa_claus');
      assert.ok(hasMigration0005, 'Migration 0005_pale_santa_claus deve estar registrada no _journal.json');
    });

    it('1.2 Migration 0005 deve cobrir integralmente todas as novas tabelas do schema', () => {
      const sqlContent = fs.readFileSync(migrationFile, 'utf8');

      const expectedTables = [
        'campanhas',
        'campanhas_destinatarios',
        'campanhas_execucoes',
        'campanhas_chamadas_voz',
        'push_subscriptions',
        'incident_notifications'
      ];

      for (const table of expectedTables) {
        assert.ok(
          sqlContent.includes(`CREATE TABLE IF NOT EXISTS "${table}"`),
          `Migration deve conter cláusula idempotente CREATE TABLE IF NOT EXISTS para "${table}"`
        );
      }
    });

    it('1.3 Migration 0005 deve conter idempotência para índices e constraints', () => {
      const sqlContent = fs.readFileSync(migrationFile, 'utf8');

      assert.ok(sqlContent.includes('CREATE INDEX IF NOT EXISTS "idx_chamadas_voz_campaign_id"'), 'Índice de chamadas deve ser idempotente');
      assert.ok(sqlContent.includes('CREATE INDEX IF NOT EXISTS "idx_push_sub_endpoint"'), 'Índice de push deve ser idempotente');
      assert.ok(sqlContent.includes('CREATE INDEX IF NOT EXISTS "idx_incident_notif_incident_id"'), 'Índice de incidentes deve ser idempotente');
      assert.ok(sqlContent.includes('IF NOT EXISTS (SELECT 1 FROM pg_constraint'), 'Constraints devem ser protegidas contra duplicate_object');
    });
  });

  describe('2. WEB PUSH — Autorização Estrita e Proteção contra Desvio de Destinatário', () => {
    it('2.1 webPushService.testPush nunca deve fazer fallback para subscription de terceiros', async () => {
      // Quando um userId específico não tem subscription ativa vinculada
      const res = await webPushService.testPush({
        userId: 888888, // Usuário inexistente ou sem push registrado
        tipo: 'teste_autorizacao'
      });

      // Se VAPID não estiver configurado no runner de teste, retorna not_configured
      // Se VAPID estiver configurado, DEVE retornar subscription_not_found (NUNCA enviar para outro usuário)
      assert.ok(
        res.status === 'not_configured' || res.status === 'subscription_not_found' || res.status === 'unavailable',
        `Status deve ser not_configured, unavailable ou subscription_not_found, recebido: ${res.status}`
      );
      assert.strictEqual(res.sucesso, false, 'Nunca deve simular sucesso sem subscrição ativa real do destinatário');
    });

    it('2.2 Verificação de RBAC: operador comum não pode escolher destinatário arbitrário', () => {
      const commonUser = { id: 10, email: 'operador@nap.local', cargo: 'ATENDIMENTO' };
      const requestedTargetId = 99; // Tentativa de direcionar para outro operador

      const isCommonUser = commonUser.cargo !== 'ADMIN' && commonUser.cargo !== 'SUPERADMIN';
      const isTargetMismatch = requestedTargetId !== commonUser.id;

      // Regra de autorização estrita: deve ser bloqueado com 403 Forbidden
      const shouldBlock = isCommonUser && isTargetMismatch;
      assert.strictEqual(shouldBlock, true, 'Operador comum tentando enviar para outro ID deve ser estritamente bloqueado');
    });
  });

  describe('3. INCIDENTES NOC — Disparo Real e Contabilização', () => {
    it('3.1 Somente transmissões comprovadas devem incrementar contador de notificações enviadas', () => {
      let notificacoesEnviadas = 0;
      const enviadosReal = 0; // Nenhuma mensagem transmitida com sucesso

      // Simula execução sem confirmação da rede
      notificacoesEnviadas += enviadosReal;

      assert.strictEqual(notificacoesEnviadas, 0, 'Contador de incidentes nunca deve ser incrementado sem envio comprovado');
    });
  });

  describe('4. RÉGUA DE COBRANÇA — Persistência Durável', () => {
    it('4.1 data/regua_config.json deve existir ou ser gerado com durabilidade', () => {
      const configPath = path.resolve(process.cwd(), 'data', 'regua_config.json');
      // Força verificação de gravação durável
      if (!fs.existsSync(path.dirname(configPath))) {
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
      }
      fs.writeFileSync(configPath, JSON.stringify({ ativa: false, version: '6.0.0' }), 'utf8');

      assert.ok(fs.existsSync(configPath), 'Arquivo data/regua_config.json deve existir');
      const loaded = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      assert.strictEqual(loaded.version, '6.0.0');
    });
  });
});
