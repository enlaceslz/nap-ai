import { describe, it } from 'node:test';
import assert from 'node:assert';
import { assertRealService, ServiceUnavailableError, areMocksAllowed } from '../../server/security/mockGuard';

describe('Production Mock Guard Enforcement Tests', () => {
  const originalEnv = process.env.NODE_ENV;

  it('1. Em desenvolvimento/preview, permite fallback sem lançar exceção', () => {
    process.env.NODE_ENV = 'development';
    assert.strictEqual(areMocksAllowed(), true);

    // Não deve lançar erro em desenvolvimento
    assert.doesNotThrow(() => {
      assertRealService('ERP_SGP', 'ERP não configurado no ambiente de dev');
    });
  });

  it('2. Em produção, bloqueia estritamente e lança ServiceUnavailableError (503)', () => {
    process.env.NODE_ENV = 'production';
    assert.strictEqual(areMocksAllowed(), false);

    assert.throws(
      () => {
        assertRealService('ERP_SGP', 'ERP indisponível na URL configurada');
      },
      (err: any) => {
        assert.ok(err instanceof ServiceUnavailableError);
        assert.strictEqual(err.statusCode, 503);
        assert.strictEqual(err.serviceName, 'ERP_SGP');
        assert.match(err.message, /ERP indisponível/);
        return true;
      }
    );

    // Restaura ambiente
    process.env.NODE_ENV = originalEnv;
  });

  it('3. Bloqueia múltiplos serviços críticos em produção (ASTERISK, HELPDESK, C6_BANK)', () => {
    process.env.NODE_ENV = 'production';

    for (const service of ['ASTERISK_ARI', 'HELPDESK_ZAMMAD', 'C6_BANK_PIX']) {
      assert.throws(
        () => assertRealService(service, 'Falha de conexão'),
        (err: any) => {
          assert.strictEqual(err.statusCode, 503);
          assert.strictEqual(err.serviceName, service);
          return true;
        }
      );
    }

    process.env.NODE_ENV = originalEnv;
  });
});
