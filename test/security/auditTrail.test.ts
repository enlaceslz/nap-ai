import { describe, it } from 'node:test';
import assert from 'node:assert';
import { appendAuditLog, getAuditChain } from '../../server/security/httpSecurity';

describe('Persistent Hash-Chained Audit Trail Tests', () => {
  it('1. Deve criar entradas de auditoria com hash SHA-256 válido e anterior encadeado', () => {
    const entry1 = appendAuditLog({
      usuario: 'operador_n1@nap.com.br',
      modulo: 'CRM',
      acao: 'DESBLOQUEIO_CONFIANCA',
      recurso: 'cliente_123',
      resultado: 'sucesso',
      detalhes: 'Desbloqueio de confiança solicitado pelo cliente',
      severidade: 'medio',
      status: 'sucesso'
    });

    assert.ok(entry1.id.startsWith('aud_'));
    assert.strictEqual(typeof entry1.entryHash, 'string');
    assert.strictEqual(entry1.entryHash.length, 64); // SHA-256 hex string
    assert.strictEqual(typeof entry1.previousHash, 'string');

    const entry2 = appendAuditLog({
      usuario: 'operador_n2@nap.com.br',
      modulo: 'NOC',
      acao: 'REINICIAR_ONU',
      recurso: 'onu_pon_01',
      resultado: 'sucesso',
      detalhes: 'Comando reboot via CWMP TR-069',
      severidade: 'alto',
      status: 'sucesso'
    });

    // Encadeamento criptográfico: previousHash do entry2 deve ser exatamente entryHash do entry1
    assert.strictEqual(entry2.previousHash, entry1.entryHash);
  });

  it('2. getAuditChain deve retornar entradas recentes em ordem cronológica', () => {
    const chain = getAuditChain();
    assert.ok(Array.isArray(chain));
    assert.ok(chain.length >= 2);
    // A entrada mais recente é a última adicionada à cadeia append-only
    assert.ok(chain[chain.length - 1].timestamp >= chain[0].timestamp);
  });

  it('3. Deve registrar metadados de auditoria LGPD completos (IP, userAgent, severidade)', () => {
    const entry = appendAuditLog({
      usuario: 'admin@nap.com.br',
      userId: 'usr_999',
      requestId: 'req_xyz123',
      modulo: 'AUTH',
      acao: 'LOGIN',
      recurso: '/api/auth/login',
      resultado: 'sucesso',
      detalhes: 'Autenticação bem-sucedida via mTLS',
      severidade: 'baixo',
      status: 'sucesso',
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 NAP Client'
    });

    assert.strictEqual(entry.ip, '192.168.1.100');
    assert.strictEqual(entry.userAgent, 'Mozilla/5.0 NAP Client');
    assert.strictEqual(entry.severidade, 'baixo');
    assert.strictEqual(entry.status, 'sucesso');
  });
});
