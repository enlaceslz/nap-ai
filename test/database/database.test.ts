import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateDatabaseUrl } from '../../src/db/index';

describe('Database Configuration & Production Hardening (Correção 6)', () => {
  // Teste 1: Em produção, ausência de DATABASE_URL deve falhar startup
  it('1. Deve falhar startup em produção se DATABASE_URL for vazia ou undefined', () => {
    assert.throws(
      () => validateDatabaseUrl('', true),
      /FALHA CRÍTICA DE STARTUP.*DATABASE_URL é OBRIGATÓRIA/
    );

    assert.throws(
      () => validateDatabaseUrl(undefined, true),
      /FALHA CRÍTICA DE STARTUP.*DATABASE_URL é OBRIGATÓRIA/
    );
  });

  // Teste 2: Em produção, rejeitar senhas fracas ou default
  it('2. Deve falhar startup em produção se DATABASE_URL contiver credenciais padrão ou inseguras', () => {
    const insecureUrls = [
      'postgresql://postgres:postgres@127.0.0.1:5432/nap_crm',
      'postgresql://postgres:CHANGE_ME_IN_PRODUCTION@127.0.0.1:5432/nap_crm',
      'postgresql://postgres:nap_secure_pwd@127.0.0.1:5432/nap_crm',
      'postgresql://admin:password@127.0.0.1:5432/nap_crm',
      'postgresql://user:123456@127.0.0.1:5432/nap_crm',
    ];

    for (const url of insecureUrls) {
      assert.throws(
        () => validateDatabaseUrl(url, true),
        /credencial padrão ou insegura proibida/,
        `Deveria rejeitar: ${url}`
      );
    }
  });

  // Teste 3: Formato inválido de URL em produção
  it('3. Deve falhar startup em produção se o protocolo da URL não for postgresql://', () => {
    assert.throws(
      () => validateDatabaseUrl('http://localhost:5432/nap_crm', true),
      /DATABASE_URL inválida/
    );
  });

  // Teste 4: URL válida em produção deve passar
  it('4. Deve aprovar DATABASE_URL válida com credencial forte em produção', () => {
    const validUrl = 'postgresql://nap_admin:x99A87zK_prod_entropy_992@127.0.0.1:5432/nap_crm';
    const result = validateDatabaseUrl(validUrl, true);
    assert.strictEqual(result, validUrl);
  });

  // Teste 5: Em desenvolvimento, aceita fallback sem quebrar
  it('5. Em desenvolvimento (NODE_ENV !== production), permite fallback local', () => {
    const result = validateDatabaseUrl('', false);
    assert.ok(result.includes('postgresql://'));
  });
});
