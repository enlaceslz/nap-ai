import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getHelmetOptions } from '../../server/security/httpSecurity';

describe('Helmet Security Policy Separation Tests (Requisito 4)', () => {
  it('1. Deve configurar política estrita e segura em PRODUÇÃO', () => {
    const prodOptions: any = getHelmetOptions(true);

    // CSP deve estar ativo e conter diretivas restritivas
    assert.ok(prodOptions.contentSecurityPolicy, 'CSP deve estar habilitado em produção');
    assert.strictEqual(typeof prodOptions.contentSecurityPolicy, 'object');
    assert.ok(Array.isArray(prodOptions.contentSecurityPolicy.directives.defaultSrc));
    assert.deepStrictEqual(prodOptions.contentSecurityPolicy.directives.defaultSrc, ["'self'"]);
    assert.deepStrictEqual(prodOptions.contentSecurityPolicy.directives.objectSrc, ["'none'"]);

    // HSTS deve estar ativo
    assert.ok(prodOptions.hsts, 'HSTS deve estar ativo em produção');
    assert.strictEqual(prodOptions.hsts.maxAge, 31536000);
    assert.strictEqual(prodOptions.hsts.includeSubDomains, true);
    assert.strictEqual(prodOptions.hsts.preload, true);

    // X-Frame-Options deve ser SAMEORIGIN
    assert.deepStrictEqual(prodOptions.xFrameOptions, { action: 'sameorigin' });

    // Proteções adicionais
    assert.strictEqual(prodOptions.noSniff, true);
    assert.deepStrictEqual(prodOptions.referrerPolicy, { policy: 'strict-origin-when-cross-origin' });
    assert.deepStrictEqual(prodOptions.crossOriginOpenerPolicy, { policy: 'same-origin' });
    assert.deepStrictEqual(prodOptions.crossOriginResourcePolicy, { policy: 'same-origin' });
  });

  it('2. Deve configurar política flexível para iframe em PREVIEW / DEV', () => {
    const previewOptions: any = getHelmetOptions(false);

    // No preview / dev, o iframe do Google AI Studio precisa ser permitido
    assert.strictEqual(previewOptions.xFrameOptions, false, 'xFrameOptions deve ser false no preview');
    assert.strictEqual(previewOptions.contentSecurityPolicy, false, 'CSP deve ser false no preview');
    assert.strictEqual(previewOptions.hsts, false, 'HSTS deve ser false no preview');
    assert.strictEqual(previewOptions.crossOriginEmbedderPolicy, false);
    assert.strictEqual(previewOptions.crossOriginOpenerPolicy, false);
    assert.strictEqual(previewOptions.crossOriginResourcePolicy, false);
  });

  it('3. Deve garantir categoricamente que as configurações de PRODUÇÃO e PREVIEW são diferentes (production != preview)', () => {
    const prodOptions = getHelmetOptions(true);
    const previewOptions = getHelmetOptions(false);

    assert.notDeepStrictEqual(
      prodOptions,
      previewOptions,
      'As configurações de segurança do Helmet em produção e preview devem ser diferentes'
    );
    assert.notStrictEqual(prodOptions.contentSecurityPolicy, previewOptions.contentSecurityPolicy);
    assert.notStrictEqual(prodOptions.hsts, previewOptions.hsts);
    assert.notStrictEqual(prodOptions.xFrameOptions, previewOptions.xFrameOptions);
  });
});
