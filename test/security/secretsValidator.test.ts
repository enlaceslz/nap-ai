import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateSecrets } from '../../server/security/secretsValidator';

describe('Conditional Secrets Matrix Validation (Correção 7)', () => {
  const baseValidEnv: Record<string, string> = {
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://nap_prod_user:StrongEntropyPassword123!@127.0.0.1:5432/nap_crm',
    JWT_SECRET: 'k8d9f0a2b1c4e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2',
    ALLOWED_ORIGINS: 'https://admin.provedor.com.br,https://portal.provedor.com.br',
    WEBHOOKS_EXPOSED: 'false'
  };

  // 1. Sucesso com segredos globais válidos em produção
  it('1. Deve validar com sucesso ambiente de produção com segredos globais fortes', () => {
    const report = validateSecrets({ env: baseValidEnv, isProduction: true });
    assert.strictEqual(report.valid, true);
    assert.strictEqual(report.errors.length, 0);
  });

  // 2. Falha com segredo obrigatório ausente
  it('2. Deve falhar startup se DATABASE_URL ou JWT_SECRET estiverem ausentes em produção', () => {
    const invalidEnv = { ...baseValidEnv, DATABASE_URL: '' };
    assert.throws(
      () => validateSecrets({ env: invalidEnv, isProduction: true }),
      /Secret obrigatório ausente.*DATABASE_URL/
    );

    const noJwtEnv = { ...baseValidEnv, JWT_SECRET: '' };
    assert.throws(
      () => validateSecrets({ env: noJwtEnv, isProduction: true }),
      /Secret obrigatório ausente.*JWT_SECRET/
    );
  });

  // 3. Falha se segredo contiver placeholder proibido
  it('3. Deve falhar startup se qualquer segredo contiver placeholder proibido (CHANGE_ME, nap_secure_pwd)', () => {
    const placeholderEnv = {
      ...baseValidEnv,
      DATABASE_URL: 'postgresql://postgres:CHANGE_ME_IN_PRODUCTION@127.0.0.1:5432/nap_crm'
    };
    assert.throws(
      () => validateSecrets({ env: placeholderEnv, isProduction: true }),
      /Secret inseguro\/fraco em produção/
    );
  });

  // 4. Falha se JWT_SECRET tiver entropia insuficiente (< 32 caracteres)
  it('4. Deve falhar startup se JWT_SECRET tiver menos de 32 caracteres', () => {
    const shortJwtEnv = {
      ...baseValidEnv,
      JWT_SECRET: 'curto_demais_123'
    };
    assert.throws(
      () => validateSecrets({ env: shortJwtEnv, isProduction: true }),
      /Comprimento insuficiente/
    );
  });

  // 5. Módulo desabilitado não exige seus segredos
  it('5. Não deve exigir segredos do Asterisk se ASTERISK_ENABLED não estiver ativo', () => {
    const noAsteriskEnv = { ...baseValidEnv, ASTERISK_ENABLED: 'false' };
    const report = validateSecrets({ env: noAsteriskEnv, isProduction: true });
    assert.strictEqual(report.valid, true);
    assert.ok(!report.modulosAtivos.includes('Asterisk 20+ NBI'));
  });

  // 6. Módulo Asterisk ativado exige seus segredos
  it('6. Deve falhar se ASTERISK_ENABLED=true mas segredos do Asterisk estiverem ausentes', () => {
    const asteriskMissingEnv = {
      ...baseValidEnv,
      ASTERISK_ENABLED: 'true',
      ASTERISK_HOST: '127.0.0.1'
      // Faltam ARI, AMI e RAMAL
    };
    assert.throws(
      () => validateSecrets({ env: asteriskMissingEnv, isProduction: true }),
      /\[ASTERISK\] Módulo ativo mas/
    );
  });

  // 7. Módulo C6 Bank ativado valida existência de arquivo no disco
  it('7. Deve falhar se C6_BANK_ENABLED=true e o arquivo de certificado não existir no disco', () => {
    const c6Env = {
      ...baseValidEnv,
      C6_BANK_ENABLED: 'true',
      WEBHOOK_SECRET: 'webhook_secret_entropy_991823',
      C6_CLIENT_ID: 'client_c6_empresa_123',
      C6_CLIENT_SECRET: 'c6_client_secret_entropy_long_token_2026',
      C6_CERT_PATH: '/caminho/inexistente/certificado_c6.crt',
      C6_KEY_PATH: '/caminho/inexistente/chave_c6.key'
    };
    assert.throws(
      () => validateSecrets({ env: c6Env, isProduction: true }),
      /não existe no disco/
    );
  });

  // 8. Módulo Gemini ativado exige GEMINI_API_KEY
  it('8. Deve exigir GEMINI_API_KEY se GEMINI_ENABLED=true', () => {
    const geminiMissingEnv = {
      ...baseValidEnv,
      GEMINI_ENABLED: 'true',
      GEMINI_API_KEY: ''
    };
    assert.throws(
      () => validateSecrets({ env: geminiMissingEnv, isProduction: true }),
      /\[GEMINI_AI\] Módulo ativo mas 'GEMINI_API_KEY' está ausente/
    );
  });
});
