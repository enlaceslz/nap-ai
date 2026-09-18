import { describe, it } from 'node:test';
import assert from 'node:assert';
import { agentToolRegistry } from '../../server/agent/toolRegistry';
import { AiPolicyEngine } from '../../server/agent/policyEngine';
import { AuthenticatedUser } from '../../server/auth/types';

describe('MaIA Tool Registry & Policy Engine (Correções 1 e 2)', () => {
  const adminUser: AuthenticatedUser = {
    id: 'usr_admin',
    nome: 'Super Admin',
    email: 'admin@provedor.com.br',
    role: 'ADMIN',
    permissions: [
      'CUSTOMER_READ', 'CUSTOMER_CREATE', 'CUSTOMER_UPDATE', 'CUSTOMER_DELETE', 'CUSTOMER_UNBLOCK',
      'ONU_READ', 'ONU_REBOOT', 'INVOICE_READ', 'INVOICE_CREATE', 'PAYMENT_PROCESS',
      'GENIEACS_WRITE', 'ASTERISK_CONTROL', 'SYSTEM_CONFIG', 'IPAM_READ', 'IPAM_WRITE',
      'HELPDESK_WRITE', 'FIELD_WRITE'
    ]
  };

  const atendenteUser: AuthenticatedUser = {
    id: 'usr_atendente',
    nome: 'Atendente N1',
    email: 'atendente@provedor.com.br',
    role: 'ATENDIMENTO',
    permissions: ['CUSTOMER_READ', 'INVOICE_READ', 'ONU_READ']
  };

  // 1. Deny by default: Ferramenta sem política cadastrada
  it('1. Deve negar (Deny-by-Default) ferramenta sem política cadastrada', () => {
    const result = AiPolicyEngine.evaluate('ferramenta_inexistente_ou_sem_politica', {}, adminUser);
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.status, 'FORBIDDEN');
    assert.match(result.message || '', /Deny-By-Default/);
  });

  // 2. Deny by default: Ausência de usuário
  it('2. Deve negar execução se o usuário não for informado', () => {
    const result = AiPolicyEngine.evaluate('consultar_status_conexao', {}, undefined);
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.status, 'FORBIDDEN');
    assert.match(result.message || '', /exige obrigatoriamente autenticação/);
  });

  // 3. Deny by default: Permissão RBAC insuficiente
  it('3. Deve negar execução se o usuário não possuir a permissão RBAC necessária', () => {
    // Atendente tentando reiniciar ONU (exige ONU_REBOOT)
    const result = AiPolicyEngine.evaluate('reiniciar_equipamento_cpe', {}, atendenteUser);
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.status, 'FORBIDDEN');
    assert.match(result.message || '', /Permissão insuficiente/);
  });

  // 4. Deny by default: Parâmetros inválidos
  it('4. Deve negar execução se a validação de parâmetros falhar', () => {
    // ipam_allocate_ip exige prefixId e customerId
    const result = AiPolicyEngine.evaluate('ipam_allocate_ip', { customerId: undefined }, adminUser);
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.status, 'FORBIDDEN');
    assert.match(result.message || '', /Parâmetros inválidos/);
  });

  // 5. Confirmação humana obrigatória para operações HIGH / CRITICAL / DESTRUCTIVE
  it('5. Deve exigir confirmação humana para operações de risco elevado (ex: reiniciar_onu)', () => {
    const result = AiPolicyEngine.evaluate('reiniciar_equipamento_cpe', { serial: 'FHTT12345678' }, adminUser, false);
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.status, 'CONFIRMATION_REQUIRED');
    assert.ok(result.confirmationPrompt && result.confirmationPrompt.length > 0);
  });

  // 6. Execução autorizada via executeToolSecurely com confirmação
  it('6. Deve autorizar e executar ferramenta com sucesso após confirmação do operador', async () => {
    const execResult = await agentToolRegistry.executeToolSecurely(
      'reiniciar_equipamento_cpe',
      { serial: 'FHTT12345678' },
      { user: adminUser, isConfirmed: true }
    );

    assert.strictEqual(execResult.success, true);
    assert.strictEqual(execResult.status, 'APPROVED');
    assert.ok(execResult.respostaGerada);
  });

  // 7. Bloqueio estrutural de bypass: tentar chamar tool.execute() diretamente deve lançar erro
  it('7. Deve bloquear estruturalmente tentativa de chamar tool.execute() diretamente sem executeToolSecurely', async () => {
    const tool = agentToolRegistry.getTool('sgp_consultar_status_conexao');
    assert.ok(tool, 'Ferramenta deve estar registrada');

    await assert.rejects(
      async () => {
        // Tentativa de bypass direto sem token interno
        await tool.execute({ cliente_cpf: '000.000.000-00' });
      },
      /\[VIOLAÇÃO DE SEGURANÇA\] Tentativa de bypass detectada/
    );
  });
});
