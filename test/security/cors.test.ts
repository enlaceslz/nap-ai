import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateAndBuildCorsOptions } from '../../server/security/httpSecurity';

describe('CORS Security Enforcement Tests (Correção 4)', () => {
  // Teste 1: Origin autorizado em produção
  it('1. Deve autorizar origin configurado em produção', () => {
    const corsOptions = validateAndBuildCorsOptions(
      'https://admin.provedor.com.br,https://portal.provedor.com.br',
      true
    );

    assert.strictEqual(typeof corsOptions.origin, 'function');
    assert.strictEqual(corsOptions.credentials, true);

    const originFn = corsOptions.origin as Function;
    let allowedResult = false;
    let errorResult: any = null;

    originFn('https://admin.provedor.com.br', (err: any, allow: boolean) => {
      errorResult = err;
      allowedResult = allow;
    });

    assert.strictEqual(errorResult, null);
    assert.strictEqual(allowedResult, true);
  });

  // Teste 2: Origin não autorizado em produção deve ser rejeitado
  it('2. Deve rejeitar origin não autorizado em produção', () => {
    const corsOptions = validateAndBuildCorsOptions(
      'https://admin.provedor.com.br',
      true
    );

    const originFn = corsOptions.origin as Function;
    let allowedResult = false;
    let errorResult: any = null;

    originFn('https://malicious-site.com', (err: any, allow: boolean) => {
      errorResult = err;
      allowedResult = allow;
    });

    assert.ok(errorResult instanceof Error);
    assert.match(errorResult.message, /não autorizada pelas políticas estritas de CORS/);
    assert.strictEqual(allowedResult, undefined);
  });

  // Teste 3: Produção sem ALLOWED_ORIGINS deve falhar startup (FAIL STARTUP)
  it('3. Deve falhar startup (lançar exceção fatal) em produção se ALLOWED_ORIGINS estiver ausente ou vazio', () => {
    assert.throws(
      () => validateAndBuildCorsOptions('', true),
      /FALHA CRÍTICA DE STARTUP/
    );

    assert.throws(
      () => validateAndBuildCorsOptions(undefined, true),
      /FALHA CRÍTICA DE STARTUP/
    );

    // E proibir wildcard (*) em produção
    assert.throws(
      () => validateAndBuildCorsOptions('*', true),
      /wildcard/
    );
  });

  // Teste 4: Múltiplos origins configurados (admin + portal + pwa)
  it('4. Deve autorizar corretamente múltiplos origins configurados', () => {
    const corsOptions = validateAndBuildCorsOptions(
      'https://admin.isp.com.br,https://portal.isp.com.br,https://app.isp.com.br',
      true
    );

    const originFn = corsOptions.origin as Function;

    const testOrigins = [
      'https://admin.isp.com.br',
      'https://portal.isp.com.br',
      'https://app.isp.com.br'
    ];

    for (const origin of testOrigins) {
      originFn(origin, (err: any, allow: boolean) => {
        assert.strictEqual(err, null);
        assert.strictEqual(allow, true);
      });
    }
  });

  // Teste 5: Credentials deve ser estritamente true com origin explícito
  it('5. Deve garantir credentials: true para suporte a cookies e tokens de sessão', () => {
    const corsOptions = validateAndBuildCorsOptions(
      'https://admin.isp.com.br',
      true
    );

    assert.strictEqual(corsOptions.credentials, true);
  });

  // Teste 6: Tentativa de origin arbitrário (ex: subdomínio não autorizado ou protocolo http inseguro)
  it('6. Deve bloquear tentativa de bypass com origin arbitrário ou não cadastrado', () => {
    const corsOptions = validateAndBuildCorsOptions(
      'https://admin.isp.com.br',
      true
    );

    const originFn = corsOptions.origin as Function;
    const invalidOrigins = [
      'http://admin.isp.com.br', // HTTP não seguro em produção
      'https://attacker.admin.isp.com.br',
      'https://isp.com.br.evil.com',
      'null'
    ];

    for (const invalid of invalidOrigins) {
      originFn(invalid, (err: any, allow: boolean) => {
        assert.ok(err instanceof Error, `Origin '${invalid}' deveria ter sido rejeitado`);
      });
    }
  });
});
