import { AuthenticatedUser, Permission } from '../auth/types';
import { appendAuditLog } from '../security/httpSecurity';

export type RiskLevel = 
  | 'READ_ONLY'
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL'
  | 'FINANCIAL'
  | 'DESTRUCTIVE';

export interface ToolPolicy {
  toolName: string;
  riskLevel: RiskLevel;
  requiredPermission?: Permission;
  requiresConfirmation: boolean;
  confirmationPrompt?: (params: any) => string;
  paramValidator?: (params: any) => { valid: boolean; reason?: string };
}

// Catálogo estrito de políticas do Ecossistema MaIA (IA Telecom)
// Deny-By-Default: Ferramentas não cadastradas aqui são sumariamente NEGADAS
export const TOOL_POLICIES: Record<string, ToolPolicy> = {
  // --- READ_ONLY (Operações de Consulta e Diagnóstico) ---
  'consultar_cliente': {
    toolName: 'consultar_cliente',
    riskLevel: 'READ_ONLY',
    requiredPermission: 'CUSTOMER_READ',
    requiresConfirmation: false
  },
  'consultar_onu': {
    toolName: 'consultar_onu',
    riskLevel: 'READ_ONLY',
    requiredPermission: 'ONU_READ',
    requiresConfirmation: false
  },
  'consultar_onu_olt': {
    toolName: 'consultar_onu_olt',
    riskLevel: 'READ_ONLY',
    requiredPermission: 'ONU_READ',
    requiresConfirmation: false
  },
  'consultar_sinal': {
    toolName: 'consultar_sinal',
    riskLevel: 'READ_ONLY',
    requiredPermission: 'ONU_READ',
    requiresConfirmation: false
  },
  'consultar_status_conexao': {
    toolName: 'consultar_status_conexao',
    riskLevel: 'READ_ONLY',
    requiredPermission: 'ONU_READ',
    requiresConfirmation: false
  },
  'sgp_consultar_status_conexao': {
    toolName: 'sgp_consultar_status_conexao',
    riskLevel: 'READ_ONLY',
    requiredPermission: 'ONU_READ',
    requiresConfirmation: false
  },
  'consultar_faturas_aberto': {
    toolName: 'consultar_faturas_aberto',
    riskLevel: 'READ_ONLY',
    requiredPermission: 'INVOICE_READ',
    requiresConfirmation: false
  },
  'consultar_viabilidade_tecnica': {
    toolName: 'consultar_viabilidade_tecnica',
    riskLevel: 'READ_ONLY',
    requiredPermission: 'CUSTOMER_READ',
    requiresConfirmation: false
  },
  'consulta_viabilidade_tecnica': {
    toolName: 'consulta_viabilidade_tecnica',
    riskLevel: 'READ_ONLY',
    requiredPermission: 'CUSTOMER_READ',
    requiresConfirmation: false
  },
  'verificar_incidente_rede': {
    toolName: 'verificar_incidente_rede',
    riskLevel: 'READ_ONLY',
    requiredPermission: 'ZABBIX_READ',
    requiresConfirmation: false
  },
  'ipam_search_customer': {
    toolName: 'ipam_search_customer',
    riskLevel: 'READ_ONLY',
    requiredPermission: 'IPAM_READ',
    requiresConfirmation: false,
    paramValidator: (p) => (!p || p.customerId === undefined) ? { valid: false, reason: 'customerId numérico é obrigatório' } : { valid: true }
  },

  // --- LOW (Ações rotineiras de baixo impacto) ---
  'abrir_chamado': {
    toolName: 'abrir_chamado',
    riskLevel: 'LOW',
    requiredPermission: 'HELPDESK_WRITE',
    requiresConfirmation: false
  },
  'abrir_chamado_suporte': {
    toolName: 'abrir_chamado_suporte',
    riskLevel: 'LOW',
    requiredPermission: 'HELPDESK_WRITE',
    requiresConfirmation: false
  },
  'criar_lead_vendas': {
    toolName: 'criar_lead_vendas',
    riskLevel: 'LOW',
    requiredPermission: 'CUSTOMER_CREATE',
    requiresConfirmation: false
  },

  // --- MEDIUM (Ações que mobilizam recursos ou alocam infraestrutura) ---
  'agendar_visita': {
    toolName: 'agendar_visita',
    riskLevel: 'MEDIUM',
    requiredPermission: 'FIELD_WRITE',
    requiresConfirmation: false
  },
  'agendar_visita_tecnica': {
    toolName: 'agendar_visita_tecnica',
    riskLevel: 'MEDIUM',
    requiredPermission: 'FIELD_WRITE',
    requiresConfirmation: false
  },
  'abrir_os_campo': {
    toolName: 'abrir_os_campo',
    riskLevel: 'MEDIUM',
    requiredPermission: 'FIELD_WRITE',
    requiresConfirmation: false
  },
  'ipam_allocate_ip': {
    toolName: 'ipam_allocate_ip',
    riskLevel: 'MEDIUM',
    requiredPermission: 'IPAM_WRITE',
    requiresConfirmation: false,
    paramValidator: (p) => (!p || !p.prefixId || p.customerId === undefined) ? { valid: false, reason: 'prefixId e customerId são obrigatórios' } : { valid: true }
  },

  // --- HIGH (Operações com impacto direto na conectividade do assinante) ---
  'alterar_wifi': {
    toolName: 'alterar_wifi',
    riskLevel: 'HIGH',
    requiredPermission: 'GENIEACS_WRITE',
    requiresConfirmation: true,
    confirmationPrompt: (params) => `Confirma a reprogramação de credenciais Wi-Fi (SSID/Senha) no roteador CPE do assinante?`
  },
  'alterar_wifi_cpe': {
    toolName: 'alterar_wifi_cpe',
    riskLevel: 'HIGH',
    requiredPermission: 'GENIEACS_WRITE',
    requiresConfirmation: true,
    confirmationPrompt: (params) => `Confirma a reprogramação de credenciais Wi-Fi (SSID/Senha) no roteador CPE do assinante?`
  },
  'reiniciar_onu': {
    toolName: 'reiniciar_onu',
    riskLevel: 'HIGH',
    requiredPermission: 'ONU_REBOOT',
    requiresConfirmation: true,
    confirmationPrompt: (params) => `Atenção: A reinicialização da ONT/ONU ${params?.serial || params?.cliente_cpf || 'do cliente'} interromperá o tráfego óptico por cerca de 2 minutos. Confirma o reboot via TR-069 CWMP?`
  },
  'reiniciar_equipamento_cpe': {
    toolName: 'reiniciar_equipamento_cpe',
    riskLevel: 'HIGH',
    requiredPermission: 'ONU_REBOOT',
    requiresConfirmation: true,
    confirmationPrompt: (params) => `Atenção: A reinicialização da ONT/ONU interromperá o tráfego óptico. Confirma o envio de reboot via TR-069?`
  },
  'genieacs_reboot_cpe': {
    toolName: 'genieacs_reboot_cpe',
    riskLevel: 'HIGH',
    requiredPermission: 'ONU_REBOOT',
    requiresConfirmation: true,
    confirmationPrompt: (params) => `Atenção: A reinicialização da ONT/ONU interromperá o tráfego óptico. Confirma o envio de reboot via TR-069?`
  },
  'derrubar_sessao': {
    toolName: 'derrubar_sessao',
    riskLevel: 'HIGH',
    requiredPermission: 'ASTERISK_CONTROL',
    requiresConfirmation: true,
    confirmationPrompt: (params) => `Confirma o envio de comando PoD (Packet-of-Disconnect) para desconectar a sessão do cliente?`
  },
  'desconectar_sessao_radius': {
    toolName: 'desconectar_sessao_radius',
    riskLevel: 'HIGH',
    requiredPermission: 'ASTERISK_CONTROL',
    requiresConfirmation: true,
    confirmationPrompt: (params) => `Confirma o envio de comando Radius PoD para derrubar a sessão do cliente?`
  },
  'desbloqueio_confianca': {
    toolName: 'desbloqueio_confianca',
    riskLevel: 'HIGH',
    requiredPermission: 'CUSTOMER_UNBLOCK',
    requiresConfirmation: true,
    confirmationPrompt: (params) => `Confirma a concessão de Desbloqueio em Confiança (Promessa 48h) para o cliente?`
  },
  'sgp_desbloqueio_confianca': {
    toolName: 'sgp_desbloqueio_confianca',
    riskLevel: 'HIGH',
    requiredPermission: 'CUSTOMER_UNBLOCK',
    requiresConfirmation: true,
    confirmationPrompt: (params) => `Confirma a concessão de Desbloqueio em Confiança (Promessa 48h) para o cliente?`
  },

  // --- CRITICAL (Operações com impacto em múltiplos assinantes ou topologia central) ---
  'alterar_olt': {
    toolName: 'alterar_olt',
    riskLevel: 'CRITICAL',
    requiredPermission: 'OLT_UPDATE',
    requiresConfirmation: true,
    confirmationPrompt: (params) => `[CRÍTICO] Confirma a modificação de parâmetros de provisionamento na OLT?`
  },
  'reconfigurar_router': {
    toolName: 'reconfigurar_router',
    riskLevel: 'CRITICAL',
    requiredPermission: 'SYSTEM_CONFIG',
    requiresConfirmation: true,
    confirmationPrompt: (params) => `[CRÍTICO] Confirma o envio de nova configuração para o roteador de borda/BNG?`
  },
  'ipam_delegate_ipv6': {
    toolName: 'ipam_delegate_ipv6',
    riskLevel: 'CRITICAL',
    requiredPermission: 'IPAM_WRITE',
    requiresConfirmation: true,
    confirmationPrompt: (params) => `[CRÍTICO] Confirma a delegação de bloco de prefixo IPv6 (/56) no BNG?`,
    paramValidator: (p) => (!p || !p.parentPrefixId || p.customerId === undefined) ? { valid: false, reason: 'parentPrefixId e customerId são obrigatórios' } : { valid: true }
  },

  // --- FINANCIAL (Transações financeiras, geração de cobrança ou baixa de faturas) ---
  'pagamento': {
    toolName: 'pagamento',
    riskLevel: 'FINANCIAL',
    requiredPermission: 'PAYMENT_PROCESS',
    requiresConfirmation: true,
    confirmationPrompt: (params) => `Confirma o processamento/estorno de pagamento no valor de R$ ${params?.valor || 'informado'}?`
  },
  'sgp_gerar_pix': {
    toolName: 'sgp_gerar_pix',
    riskLevel: 'FINANCIAL',
    requiredPermission: 'INVOICE_READ',
    requiresConfirmation: false
  },
  'gerar_pix_segunda_via': {
    toolName: 'gerar_pix_segunda_via',
    riskLevel: 'FINANCIAL',
    requiredPermission: 'INVOICE_READ',
    requiresConfirmation: false
  },

  // --- DESTRUCTIVE (Exclusão irreversível de entidades) ---
  'excluir_cliente': {
    toolName: 'excluir_cliente',
    riskLevel: 'DESTRUCTIVE',
    requiredPermission: 'CUSTOMER_DELETE',
    requiresConfirmation: true,
    confirmationPrompt: (params) => `[DESTRUTIVO] ATENÇÃO: Confirma a exclusão definitiva do cadastro do cliente? Esta operação é irreversível.`
  }
};

export interface PolicyEvaluationResult {
  allowed: boolean;
  status: 'APPROVED' | 'CONFIRMATION_REQUIRED' | 'FORBIDDEN';
  message?: string;
  confirmationPrompt?: string;
  riskLevel?: RiskLevel;
}

export class AiPolicyEngine {
  /**
   * Avalia estritamente a execução de uma ferramenta chamada pela IA (Deny-by-Default)
   * A IA NUNCA possui privilégio próprio — ela executa sob a identidade e permissões do usuário autenticado.
   */
  public static evaluate(
    toolName: string,
    params: any,
    user?: AuthenticatedUser,
    isConfirmed = false
  ): PolicyEvaluationResult {
    // 1. DENY-BY-DEFAULT: Ferramenta não cadastrada ou sem política configurada
    const policy = TOOL_POLICIES[toolName];
    if (!policy) {
      appendAuditLog({
        usuario: user?.nome || 'Anônimo / Não Autenticado',
        usuarioEmail: user?.email || 'desconhecido',
        usuarioRole: user?.role || 'DESCONHECIDO',
        modulo: 'MaIA Policy Engine',
        acao: 'AI_POLICY_DENY_UNREGISTERED',
        detalhes: `Bloqueio: Ferramenta '${toolName}' não possui política cadastrada no Policy Engine (Deny-by-Default).`,
        severidade: 'critico',
        status: 'bloqueado'
      });

      return {
        allowed: false,
        status: 'FORBIDDEN',
        message: `Acesso negado: Ferramenta '${toolName}' não cadastrada ou sem política de segurança associada (Deny-By-Default).`
      };
    }

    // 2. DENY-BY-DEFAULT: Ausência de Usuário / Identidade
    if (!user) {
      appendAuditLog({
        usuario: 'Não Autenticado',
        usuarioEmail: 'desconhecido',
        usuarioRole: 'ANONIMO',
        modulo: 'MaIA Policy Engine',
        acao: 'AI_POLICY_DENY_NO_USER',
        detalhes: `Bloqueio: Tentativa de execução da ferramenta '${toolName}' sem contexto de usuário autenticado.`,
        severidade: 'critico',
        status: 'bloqueado'
      });

      return {
        allowed: false,
        status: 'FORBIDDEN',
        message: `Acesso negado: A operação '${toolName}' exige obrigatoriamente autenticação de usuário válido.`,
        riskLevel: policy.riskLevel
      };
    }

    // 3. DENY-BY-DEFAULT: Ausência de Permissão Granular (RBAC)
    if (policy.requiredPermission) {
      const hasPerm = user.permissions?.includes(policy.requiredPermission);
      if (!hasPerm) {
        appendAuditLog({
          usuario: user.nome,
          usuarioEmail: user.email,
          usuarioRole: user.role,
          modulo: 'MaIA Policy Engine',
          acao: 'AI_POLICY_DENY_RBAC',
          detalhes: `Bloqueio RBAC: Usuário ${user.nome} (${user.role}) tentou executar '${toolName}' sem a permissão '${policy.requiredPermission}'.`,
          severidade: 'critico',
          status: 'bloqueado'
        });

        return {
          allowed: false,
          status: 'FORBIDDEN',
          message: `Permissão insuficiente: Usuário não possui '${policy.requiredPermission}' para executar a ferramenta '${toolName}'.`,
          riskLevel: policy.riskLevel
        };
      }
    }

    // 4. DENY-BY-DEFAULT: Validação Estrita de Parâmetros
    if (policy.paramValidator) {
      const validation = policy.paramValidator(params);
      if (!validation.valid) {
        appendAuditLog({
          usuario: user.nome,
          usuarioEmail: user.email,
          usuarioRole: user.role,
          modulo: 'MaIA Policy Engine',
          acao: 'AI_POLICY_DENY_INVALID_PARAMS',
          detalhes: `Bloqueio: Parâmetros inválidos para '${toolName}': ${validation.reason}`,
          severidade: 'atencao',
          status: 'bloqueado'
        });

        return {
          allowed: false,
          status: 'FORBIDDEN',
          message: `Parâmetros inválidos para '${toolName}': ${validation.reason}`,
          riskLevel: policy.riskLevel
        };
      }
    }

    // 5. Confirmação Humana Obrigatória para Operações Críticas/Destrutivas/Financeiras
    if (policy.requiresConfirmation && !isConfirmed) {
      const prompt = policy.confirmationPrompt 
        ? policy.confirmationPrompt(params) 
        : `Confirma a execução da operação de risco '${toolName}'?`;
      
      appendAuditLog({
        usuario: user.nome,
        usuarioEmail: user.email,
        usuarioRole: user.role,
        modulo: 'MaIA Policy Engine',
        acao: 'AI_POLICY_CONFIRMATION_REQUIRED',
        detalhes: `Exigência de confirmação humana do operador para '${toolName}' (Nível de Risco: ${policy.riskLevel}).`,
        severidade: 'atencao',
        status: 'bloqueado'
      });

      return {
        allowed: false,
        status: 'CONFIRMATION_REQUIRED',
        message: 'Operação de alto impacto operacional. Confirmação explícita do operador é obrigatória.',
        confirmationPrompt: prompt,
        riskLevel: policy.riskLevel
      };
    }

    // 6. Operação Autorizada — Registro de Auditoria Conforme Severidade
    if (['HIGH', 'CRITICAL', 'FINANCIAL', 'DESTRUCTIVE'].includes(policy.riskLevel)) {
      appendAuditLog({
        usuario: user.nome,
        usuarioEmail: user.email,
        usuarioRole: user.role,
        modulo: 'MaIA Policy Engine',
        acao: `AI_EXEC_${toolName.toUpperCase()}`,
        detalhes: `Operação de risco [${policy.riskLevel}] autorizada e executada via IA sob credenciais de ${user.nome} (${user.role}).`,
        severidade: policy.riskLevel === 'DESTRUCTIVE' ? 'critico' : 'atencao',
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

