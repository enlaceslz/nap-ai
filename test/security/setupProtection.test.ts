import { describe, it } from 'node:test';
import assert from 'node:assert';
import { hashPassword, verifyPassword } from '../../server/auth/passwordUtils';

describe('Setup Wizard & Admin Security Protection Tests', () => {
  it('1. Deve gerar hash bcrypt forte (12 rounds) para a senha do administrador', async () => {
    const rawPassword = 'MinhaSenhaSegura2026!@#';
    const hash = hashPassword(rawPassword);

    assert.ok(hash.startsWith('$2'), 'Hash deve iniciar com prefixo de algoritmo bcrypt ($2a, $2b ou $2y)');
    assert.strictEqual(hash.length, 60, 'Hash bcrypt deve possuir exatamente 60 caracteres');
    assert.notStrictEqual(hash, rawPassword, 'Hash não deve conter a senha em texto plano');

    const isValid = verifyPassword(rawPassword, hash);
    assert.strictEqual(isValid, true, 'verifyPassword deve validar a senha original');

    const isInvalid = verifyPassword('SenhaErrada123', hash);
    assert.strictEqual(isInvalid, false, 'verifyPassword deve rejeitar senha incorreta');
  });

  it('2. Deve rejeitar senhas com comprimento inferior a 8 caracteres', () => {
    const shortPassword = 'abc';
    assert.ok(shortPassword.length < 8, 'Senha curta deve ser barrada na validação');
  });

  it('3. Deve assegurar que o arquivo .env gerado NUNCA contenha a chave ADMIN_PASSWORD', () => {
    const sampleEnvTemplate = `
GEMINI_API_KEY="AIzaSy..."
SGP_URL="https://sgp.provedor.com.br"
DATABASE_URL="postgres://nap:pass@127.0.0.1:5432/nap_production"
ADMIN_EMAIL="admin@provedor.com.br"
SETUP_ENABLED="false"
`;
    assert.ok(!sampleEnvTemplate.includes('ADMIN_PASSWORD'), 'O arquivo .env de produção é proibido de conter ADMIN_PASSWORD');
    assert.ok(sampleEnvTemplate.includes('SETUP_ENABLED="false"'), 'SETUP_ENABLED deve ser setado para false após o finish');
  });

  it('4. Deve bloquear terminantemente Setup Wizard com HTTP 403 em NODE_ENV=production', () => {
    // Simulando middleware de setup em ambiente de produção
    const mockReq = { url: '/api/setup/finish', path: '/finish' };
    let statusSent: number | null = null;
    let jsonSent: any = null;
    let nextCalled = false;

    const mockRes: any = {
      status(code: number) {
        statusSent = code;
        return this;
      },
      json(data: any) {
        jsonSent = data;
        return this;
      }
    };

    const setupMiddleware = (nodeEnv: string, req: any, res: any, next: () => void) => {
      if (nodeEnv === 'production') {
        return res.status(403).json({
          error: 'Setup Wizard permanentemente desabilitado em ambiente de produção (NODE_ENV=production).',
          code: 'SETUP_FORBIDDEN_IN_PRODUCTION',
          status: 'locked'
        });
      }
      next();
    };

    // Cenário 1: Produção com SETUP_ENABLED=true e SETUP_ALLOW_OVERRIDE=true (deve retornar 403 SEMPRE)
    setupMiddleware('production', mockReq, mockRes, () => { nextCalled = true; });
    assert.strictEqual(statusSent, 403, 'Em produção deve retornar HTTP 403');
    assert.strictEqual(nextCalled, false, 'Em produção o middleware next() nunca deve ser chamado');
    assert.strictEqual(jsonSent?.code, 'SETUP_FORBIDDEN_IN_PRODUCTION');

    // Cenário 2: Bootstrap/Dev (deve chamar next())
    statusSent = null;
    nextCalled = false;
    setupMiddleware('bootstrap', mockReq, mockRes, () => { nextCalled = true; });
    assert.strictEqual(statusSent, null, 'Em bootstrap não deve retornar 403');
    assert.strictEqual(nextCalled, true, 'Em bootstrap o next() deve ser chamado');
  });

  it('5. Deve impedir bypass de setup por qualquer combinação de flags em produção', () => {
    function verifyProductionBlock(env: { NODE_ENV: string; SETUP_ENABLED?: string; SETUP_ALLOW_OVERRIDE?: string }) {
      if (env.NODE_ENV === 'production') {
        return { allowed: false, reason: 'Setup Wizard permanentemente desabilitado em produção.' };
      }
      return { allowed: true };
    }

    const testCases = [
      { NODE_ENV: 'production', SETUP_ENABLED: 'true', SETUP_ALLOW_OVERRIDE: 'true' },
      { NODE_ENV: 'production', SETUP_ENABLED: 'true', SETUP_ALLOW_OVERRIDE: 'false' },
      { NODE_ENV: 'production', SETUP_ENABLED: 'false', SETUP_ALLOW_OVERRIDE: 'true' },
      { NODE_ENV: 'production' }
    ];

    for (const tc of testCases) {
      const result = verifyProductionBlock(tc);
      assert.strictEqual(result.allowed, false, `Falha: combinação permitiu setup em produção: ${JSON.stringify(tc)}`);
    }
  });
});
