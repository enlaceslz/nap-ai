import { AuthenticatedUser, Permission } from '../auth/types';
import { appendAuditLog } from '../security/httpSecurity';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'CRITICAL';

export interface ToolPolicy {
  toolName: string;
  riskLevel: RiskLevel;
  requiredPermission?: Permission;
  requiresConfirmation: boolean;
  confirmationPrompt?: (params: any) => string;
}

// Catálogo de políticas do Ecossistema MaIA (IA Telecom)
export const TOOL_POLICIES: Record<string, ToolPolicy> = {
  // Operações de Leitura / Baixo Risco
  'consultar_status_conexao': {
    toolName: 'consultar_status_conexao',
    riskLevel: 'LOW',
    requiredPermission: 'ONU_READ',
    requiresConfirmation: false
  },
  'gerar_pix_segunda_via': {
    toolName: 'gerar_pix_segunda_via',
    riskLevel: 'LOW',
    requiredPermission: 'INVOICE_READ',
    requiresConfirmation: false
  },
  'consultar_faturas_aberto': {
    toolName: 'consultar_faturas_aberto',
    riskLevel: 'LOW',
    requiredPermission: 'INVOICE_READ',
    requiresConfirmation: false
  },
  'consultar_viabilidade_tecnica': {
    toolName: 'consultar_viabilidade_tecnica',
    riskLevel: 'LOW',
    requiresConfirmation: false
  },
  'criar_lead_vendas': {
    toolName: 'criar_lead_vendas',
    riskLevel: 'LOW',
    requiresConfirmation: false
  },

  // Operações de Médio Risco
  'abrir_chamado_suporte': {
    toolName: 'abrir_chamado_suporte',
    riskLevel: 'MEDIUM',
    requiredPermission: 'HELPDESK_WRITE',
    requiresConfirmation: false
  },
  'agendar_visita_tecnica': {
    toolName: 'agendar_visita_tecnica',
    riskLevel: 'MEDIUM',
    requiredPermission: 'FIELD_WRITE',
    requiresConfirmation: false
  },

  // Operações Críticas de Telecom (Exigem RBAC estrito e Confirmação Explícita)
  'reiniciar_equipamento_cpe': {
    toolName: 'reiniciar_equipamento_cpe',
    riskLevel: 'CRITICAL',
    requiredPermission: 'ONU_REBOOT',
    requiresConfirmation: true,
    confirmationPrompt: (params) => 
      `Atenção: A reinicialização da ONT/ONU ${params.serial || params.cliente_cpf || 'do cliente'} interromperá o sinal e tráfego óptico por cerca de 2 minutos. Confirma o envio do comando de reboot via TR-069 CWMP?`
  },
  'desbloqueio_confianca': {
    toolName: 'desbloqueio_confianca',
    riskLevel: 'CRITICAL',
    requiredPermission: 'CUSTOMER_UNBLOCK',
    requiresConfirmation: true,
    confirmationPrompt: (params) => 
      `Confirma a concessão de Desbloqueio em Confiança (Promessa de Pagamento 48h) para o documento ${params.cliente_cpf || params.cpf_cnpj}?`
  },
  'alterar_wifi_cpe': {
    toolName: 'alterar_wifi_cpe',
    riskLevel: 'CRITICAL',
    requiredPermission: 'GENIEACS_WRITE',
    requiresConfirmation: true,
    confirmationPrompt: (params) => 
      `Confirma a reprogramação de credenciais Wi-Fi (SSID/Senha) no roteador CPE do assinante?`
  },
  'desconectar_sessao_radius': {
    toolName: 'desconectar_sessao_radius',
    riskLevel: 'CRITICAL',
    requiredPermission: 'ASTERISK_CONTROL', // Radius PoD/CoA
    requiresConfirmation: true,
    confirmationPrompt: (params) => 
      `Confirma o envio de pacote Radius Packet-of-Disconnect (PoD/CoA) para derrubar a sessão PPPoE/IPoE do cliente?`
  }
};

export interface PolicyEvaluationResult {
  allowed: boolean;
  status: 'APPROVED' | 'CONFIRMATION_REQUIRED' | 'FORBIDDEN';
  message?: string;
  confirmationPrompt?: string;
  riskLevel: RiskLevel;
}

export class AiPolicyEngine {
  /**
   * Avalia a execução de uma ferramenta chamada pela IA
   * A IA NUNCA possui privilégio próprio — ela executa sob a identidade e permissões do usuário autenticado.
   */
  public static evaluate(
    toolName: string,
    params: any,
    user?: AuthenticatedUser,
    isConfirmed = false
  ): PolicyEvaluationResult {
    const policy = TOOL_POLICIES[toolName] || {
      toolName,
      riskLevel: 'MEDIUM',
      requiresConfirmation: false
    };

    // 1. Verificação de Autenticação para Operações de Risco Médio e Crítico
    if (policy.riskLevel !== 'LOW' && !user) {
      return {
        allowed: false,
        status: 'FORBIDDEN',
        message: `A operação '${toolName}' exige autenticação de operador ou técnico responsável.`,
        riskLevel: policy.riskLevel
      };
    }

    // 2. Verificação de Permissão Granular (RBAC)
    if (policy.requiredPermission && user) {
      const hasPerm = user.permissions?.includes(policy.requiredPermission);
      if (!hasPerm) {
        appendAuditLog({
          usuario: user.nome,
          usuarioEmail: user.email,
          usuarioRole: user.role,
          modulo: 'MaIA Policy Engine',
          acao: 'AI_PRIVILEGE_DENIED',
          detalhes: `Tentativa da IA de executar '${toolName}' sem a permissão '${policy.requiredPermission}'.`,
          severidade: 'critico',
          status: 'bloqueado'
        });

        return {
          allowed: false,
          status: 'FORBIDDEN',
          message: `Permissão insuficiente: o usuário não possui '${policy.requiredPermission}' para executar esta ação via IA.`,
          riskLevel: policy.riskLevel
        };
      }
    }

    // 3. Avaliação de Risco e Exigência de Confirmação para Operações Críticas
    if (policy.requiresConfirmation && !isConfirmed) {
      const prompt = policy.confirmationPrompt ? policy.confirmationPrompt(params) : `Confirma a execução da operação crítica '${toolName}'?`;
      
      return {
        allowed: false,
        status: 'CONFIRMATION_REQUIRED',
        message: 'Operação de alto impacto operacional. Confirmação do operador é obrigatória.',
        confirmationPrompt: prompt,
        riskLevel: policy.riskLevel
      };
    }

    // 4. Operação Aprovada
    if (user && policy.riskLevel === 'CRITICAL') {
      appendAuditLog({
        usuario: user.nome,
        usuarioEmail: user.email,
        usuarioRole: user.role,
        modulo: 'MaIA Policy Engine',
        acao: `AI_EXEC_${toolName.toUpperCase()}`,
        detalhes: `Operação crítica executada pela IA sob autorização de ${user.nome} (${user.role}).`,
        severidade: 'atencao',
        status: 'sucesso'
      });
    }

    return {
      allowed: true,
      status: 'APPROVED',
      riskLevel: policy.riskLevel
    };
  }
}
