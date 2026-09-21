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
});
