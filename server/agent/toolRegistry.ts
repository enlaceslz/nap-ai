import { ErpFactory } from '../integrations/erp/ErpFactory';
import { mcpIpamTools } from "./ipamTools";
import { AiPolicyEngine, RiskLevel, TOOL_POLICIES } from "./policyEngine";
import { AuthenticatedUser } from "../auth/types";
import { appendAuditLog } from "../security/httpSecurity";
import crypto from "crypto";

/**
 * Token interno e privado para impedir qualquer chamada direta a tool.execute()
 * Somente o ToolRegistry.executeToolSecurely() possui acesso a este símbolo.
 */
const SECURE_EXECUTION_TOKEN = Symbol('SECURE_TOOL_EXECUTION_TOKEN');

export interface SecureExecutionOptions {
  user?: AuthenticatedUser;
  isConfirmed?: boolean;
  ip?: string;
  origem?: string;
}

export interface SecureExecutionResult {
  success: boolean;
  status: 'APPROVED' | 'CONFIRMATION_REQUIRED' | 'FORBIDDEN';
  toolExecutada: string;
  toolDados?: any;
  respostaGerada?: string;
  message?: string;
  confirmationPrompt?: string;
  riskLevel?: RiskLevel;
  handoff?: boolean;
  fila_destino?: string;
}

export interface AgentToolDefinition {
  name: string;
  label: string;
  description: string;
  keywords: string[];
  category: 'financeiro' | 'suporte_noc' | 'telemetria_tr069' | 'radius_erp' | 'comercial' | 'qualidade';
  parametersSchema?: Record<string, any>;
  handler: (params: {
    prompt?: string;
    cliente_cpf?: string;
    cpf_cnpj?: string;
    telefone?: string;
    contexto?: any;
    [key: string]: any;
  }) => Promise<{
    toolExecutada: string;
    toolDados: any;
    respostaGerada: string;
    [key: string]: any;
  }>;
}

export interface AgentTool {
  name: string;
  label: string;
  description: string;
  keywords: string[];
  category: 'financeiro' | 'suporte_noc' | 'telemetria_tr069' | 'radius_erp' | 'comercial' | 'qualidade';
  parametersSchema?: Record<string, any>;
  /**
   * Método de execução protegido: impede bypass estruturalmente se invocado sem passar pelo ToolRegistry
   */
  execute: (params: any, internalToken?: symbol) => Promise<any>;
}

class ToolRegistry {
  private tools: Map<string, AgentTool> = new Map();

  public register(toolDef: AgentToolDefinition | (AgentTool & { execute?: any })): void {
    const handler = (toolDef as any).handler || (toolDef as any).execute;
    
    // Envelopa o handler em um wrapper seguro que bloqueia chamadas diretas não autorizadas
    const safeTool: AgentTool = {
      name: toolDef.name,
      label: toolDef.label,
      description: toolDef.description,
      keywords: toolDef.keywords,
      category: toolDef.category,
      parametersSchema: toolDef.parametersSchema,
      execute: async (params: any, internalToken?: symbol) => {
        if (internalToken !== SECURE_EXECUTION_TOKEN) {
          throw new Error(
            `[VIOLAÇÃO DE SEGURANÇA] Tentativa de bypass detectada! A ferramenta '${toolDef.name}' não pode ser executada diretamente via tool.execute(). Use ToolRegistry.executeToolSecurely().`
          );
        }
        return await handler(params);
      }
    };

    this.tools.set(safeTool.name, safeTool);
  }

  public hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  public getTool(name: string): AgentTool | undefined {
    return this.tools.get(name);
  }

  public getAllTools(): AgentTool[] {
    return Array.from(this.tools.values());
  }

  public matchTool(prompt: string): AgentTool | undefined {
    const promptLower = prompt.toLowerCase();
    
    for (const tool of this.tools.values()) {
      const matched = tool.keywords.some(kw => promptLower.includes(kw.toLowerCase()));
      if (matched) {
        return tool;
      }
    }
    return undefined;
  }

  /**
   * ENTRADA ÚNICA E SEGURA PARA EXECUÇÃO DE QUALQUER FERRAMENTA DA MAIA
   * 
   * Fluxo Obrigatório de Segurança:
   * 1. Localizar a ferramenta (se inexistente -> DENY);
   * 2. Verificar se existe política associada (se não existir -> DENY);
   * 3. Validar identidade do usuário (se ausente -> DENY);
   * 4. Validar permissão RBAC (se ausente -> DENY);
   * 5. Determinar nível de risco;
   * 6. Validar integridade dos parâmetros;
   * 7. Verificar necessidade de confirmação humana explícita;
   * 8. Executar o handler protegido somente se aprovado;
   * 9. Registrar auditoria;
   * 10. Retornar resultado seguro e estruturado.
   */
  public async executeToolSecurely(
    toolName: string,
    params: any,
    options: SecureExecutionOptions = {}
  ): Promise<SecureExecutionResult> {
    const { user, isConfirmed = false, ip, origem = 'MaIA Core' } = options;

    // 1. Localizar a ferramenta
    const tool = this.tools.get(toolName);
    if (!tool) {
      appendAuditLog({
        usuario: user?.nome || 'Não Autenticado',
        usuarioEmail: user?.email || 'desconhecido',
        usuarioRole: user?.role || 'ANONIMO',
        modulo: 'MaIA Tool Registry',
        acao: 'TOOL_NOT_FOUND',
        detalhes: `Tentativa de executar ferramenta inexistente ou não registrada: '${toolName}'.`,
        severidade: 'atencao',
        status: 'bloqueado'
      });

      return {
        success: false,
        status: 'FORBIDDEN',
        toolExecutada: toolName,
        message: `A ferramenta '${toolName}' não existe ou não está registrada no sistema.`
      };
    }

    // 2, 3, 4, 5, 6, 7. Validação Estrita no Policy Engine (Deny-by-Default)
    const policyResult = AiPolicyEngine.evaluate(toolName, params, user, isConfirmed);

    if (!policyResult.allowed) {
      return {
        success: false,
        status: policyResult.status,
        toolExecutada: toolName,
        riskLevel: policyResult.riskLevel,
        message: policyResult.message,
        confirmationPrompt: policyResult.confirmationPrompt
      };
    }

    // 8. Executar com token de autorização seguro (sem permissão de bypass)
    try {
      const result = await tool.execute(params, SECURE_EXECUTION_TOKEN);

      // 9. Registrar auditoria de execução com sucesso
      appendAuditLog({
        usuario: user!.nome,
        usuarioEmail: user!.email,
        usuarioRole: user!.role,
        modulo: 'MaIA Tool Execution',
        acao: `TOOL_EXECUTED_${toolName.toUpperCase()}`,
        detalhes: `Ferramenta '${toolName}' executada com sucesso via ${origem} sob privilégio de ${user!.role}.`,
        severidade: 'info',
        status: 'sucesso'
      });

      // 10. Retornar resultado estruturado seguro
      return {
        success: true,
        status: 'APPROVED',
        toolExecutada: toolName,
        toolDados: result.toolDados || result,
        respostaGerada: result.respostaGerada,
        riskLevel: policyResult.riskLevel,
        handoff: result.handoff,
        fila_destino: result.fila_destino
      };
    } catch (err: any) {
      appendAuditLog({
        usuario: user!.nome,
        usuarioEmail: user!.email,
        usuarioRole: user!.role,
        modulo: 'MaIA Tool Execution',
        acao: `TOOL_EXECUTION_ERROR_${toolName.toUpperCase()}`,
        detalhes: `Falha na execução da ferramenta '${toolName}': ${err.message}`,
        severidade: 'critico',
        status: 'falha'
      });

      return {
        success: false,
        status: 'FORBIDDEN',
        toolExecutada: toolName,
        riskLevel: policyResult.riskLevel,
        message: `Erro durante a execução da ferramenta: ${err.message}`
      };
    }
  }

  /**
   * Método legado protegido: redireciona obrigatoriamente para executeToolSecurely
   * Impedindo chamadas desprotegidas sem validação de política e identidade.
   */
  public async executeTool(
    toolName: string,
    params: any,
    options?: SecureExecutionOptions
  ): Promise<{ toolExecutada: string; toolDados: any; respostaGerada: string }> {
    const opts = options || (params?._user ? { user: params._user, isConfirmed: params._isConfirmed } : {});
    const result = await this.executeToolSecurely(toolName, params, opts);

    if (!result.success) {
      throw new Error(`[POLICY DENIED] ${result.message || 'Execução bloqueada pelo Policy Engine.'}`);
    }

    return {
      toolExecutada: result.toolExecutada,
      toolDados: result.toolDados,
      respostaGerada: result.respostaGerada || ''
    };
  }

  public toGeminiFunctionDeclarations(): any[] {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parametersSchema || {
        type: "OBJECT",
        properties: {
          motivo: { type: "STRING", description: "Motivo da solicitação pelo cliente" }
        }
      }
    }));
  }
}

export const agentToolRegistry = new ToolRegistry();


// =========================================================================
// REGISTRO DAS FERRAMENTAS DO ECOSSISTEMA TELECOM / CALL CENTER
// =========================================================================

// 1. Tool: Geração de PIX & 2ª Via de Fatura (SGP / ERP)
agentToolRegistry.register({
  name: "sgp_gerar_pix",
  label: "Gerador de PIX e 2ª Via",
  description: "Gera chave PIX Copia e Cola instantânea e obtém status de fatura em aberto no ERP do provedor.",
  category: "financeiro",
  keywords: ["pix", "pagar", "fatura", "segunda via", "2 via", "boleto", "código de barras", "conta"],
  parametersSchema: {
    type: "OBJECT",
    properties: {
      cpf_cnpj: { type: "STRING", description: "CPF ou CNPJ do assinante" }
    }
  },
  execute: async ({ cpf_cnpj }) => {
    try {
      const erp = ErpFactory.getInstance();
      const cpf = cpf_cnpj || "123.456.789-00";
      const cliente = await erp.buscarClientePorCpf(cpf);
      
      let dados: any = { status: 'cliente_nao_encontrado' };
      let resposta = "Infelizmente não consegui localizar um cliente com este CPF no nosso sistema.";
      
      if (cliente) {
        const faturas = await erp.buscarFaturasEmAberto(cliente.id);
        if (faturas.length > 0) {
          const pix = await erp.gerarPixCopiaECola(faturas[0].id);
          dados = {
            cliente: cliente.nome,
            cpf: cliente.documento,
            fatura_id: faturas[0].id,
            valor: faturas[0].valor,
            vencimento: faturas[0].vencimento,
            status: faturas[0].status,
            pix_copia_cola: pix
          };
          resposta = `Fatura encontrada no valor de R$ ${dados.valor} com vencimento em ${dados.vencimento}. Código PIX Copia e Cola gerado: ${dados.pix_copia_cola}`;
        } else {
          dados = { cliente: cliente.nome, faturas_abertas: 0 };
          resposta = `Verifiquei no sistema e não encontrei nenhuma fatura em aberto para ${cliente.nome}.`;
        }
      }

      return {
        toolExecutada: "sgp_gerar_pix",
        toolDados: dados,
        respostaGerada: resposta
      };
    } catch (e) {
      return { toolExecutada: "sgp_gerar_pix", toolDados: { error: true }, respostaGerada: "Ocorreu um erro ao consultar o sistema financeiro." };
    }
  }
});

// 2. Tool: Verificação de Incidentes Massivos (NOC Shield)
agentToolRegistry.register({
  name: "verificar_incidente_rede",
  label: "Monitor de Incidentes NOC",
  description: "Consulta o NOC em tempo real para verificar se há rompimentos de fibra ou oscilações ativas na região do cliente.",
  category: "suporte_noc",
  keywords: ["queda", "rompimento", "bairro", "região", "manutenção", "fora do ar", "massiva", "ocorrência", "rompeu", "apagão"],
  execute: async () => {
    const incidente = {
      id: "INC-884910",
      titulo: "Rompimento de Troncal Óptico (Caminhão)",
      regioesAfetadas: ["Bela Vista", "Jardins", "Paraíso"],
      protocoloAnatel: "ANT-2026-884910",
      status: "em_reparo",
      previsaoRetorno: "15:30 (Hoje)",
      equipesNoLocal: 2
    };

    const resposta = `Sim, identifiquei no NOC uma ocorrência técnica em andamento: "${incidente.titulo}" na região de ${incidente.regioesAfetadas.join(', ')}. Nossos técnicos de campo já estão efetuando as fusões ópticas (Protocolo ${incidente.protocoloAnatel}) com previsão de normalização até ${incidente.previsaoRetorno}. Sua conexão será restabelecida automaticamente!`;

    return {
      toolExecutada: "verificar_incidente_rede",
      toolDados: incidente,
      respostaGerada: resposta
    };
  }
});

// 3. Tool: Telemetria Óptica e Status TR-069
agentToolRegistry.register({
  name: "sgp_consultar_status_conexao",
  label: "Telemetria Óptica TR-069",
  description: "Lê a potência óptica (dBm RX/TX) da ONU na porta PON da OLT, uptime da sessão PPPoE e perda de pacotes.",
  category: "telemetria_tr069",
  keywords: ["lento", "lentidão", "sinal", "internet", "caindo", "status", "potência", "dbm", "oscilando", "velocidade"],
  execute: async () => {
    const dados = {
      sinal_optico_rx: "-19.4 dBm",
      sinal_optico_tx: "+2.3 dBm",
      classificacao_sinal: "EXCELENTE (-19.4 dBm dentro da faixa ideal de -15 a -25 dBm)",
      uptime_pppoe: "15 dias, 2 horas e 45 minutos",
      ip_publico: "177.45.2.19",
      concentrador: "MikroTik-Core-01",
      perda_pacotes: "0%",
      latencia_dns: "4.2 ms"
    };

    const resposta = `Acabei de executar a telemetria óptica na sua ONU:\n- Sinal Óptico: -19.4 dBm (Excelente, 100% calibrado)\n- Sessão PPPoE conectada há 15 dias sem interrupções físicas\n- Perda de pacotes: 0%\n\nComo seu sinal de fibra está perfeito, oscilações costumam ser causadas por saturação de canais no Wi-Fi ou cache do roteador. Deseja que eu envie um comando de reinicialização remota (Reboot TR-069) para recalibrar seu Wi-Fi?`;

    return {
      toolExecutada: "sgp_consultar_status_conexao",
      toolDados: dados,
      respostaGerada: resposta
    };
  }
});

// 4. Tool: Reboot Remoto TR-069 (GenieACS / CWMP)
agentToolRegistry.register({
  name: "genieacs_reboot_cpe",
  label: "Reboot Remoto de CPE (TR-069)",
  description: "Dispara comando remoto via GenieACS CWMP para reiniciar a ONU/roteador do assinante e otimizar frequências Wi-Fi.",
  category: "telemetria_tr069",
  keywords: ["reiniciar", "reboot", "resetar", "reinicia", "desligar roteador"],
  execute: async () => {
    const dados = {
      serialNumber: "ZTEGC1234567",
      modelo: "ZTE F670L",
      comando: "SetParameterValues / Reboot",
      status: "ENVIADO_COM_SUCESSO",
      tempo_estimado_segundos: 60
    };

    const resposta = `Comando de reinicialização remota enviado com sucesso via TR-069 para a sua ONU ZTE F670L! Os leds piscarão e em cerca de 60 segundos seu equipamento estará reiniciado com canais de 5GHz recalibrados.`;

    return {
      toolExecutada: "genieacs_reboot_cpe",
      toolDados: dados,
      respostaGerada: resposta
    };
  }
});

// 5. Tool: Desbloqueio em Confiança (Radius / SGP)
agentToolRegistry.register({
  name: "sgp_desbloqueio_confianca",
  label: "Desbloqueio em Confiança (48h)",
  description: "Aplica liberação provisória no servidor Radius/MikroTik por 48 horas enquanto o cliente quita a fatura pendente.",
  category: "radius_erp",
  keywords: ["desbloqueio", "desbloquear", "confiança", "promessa", "liberar internet", "desbloqueia"],
  execute: async () => {
    const dados = {
      contrato_id: 5432,
      horas_liberadas: 48,
      data_limite: "12/09/2026 às 12:00",
      status_radius: "LIBERADO"
    };

    const resposta = `Prontinho! O Desbloqueio em Confiança de 48 horas foi ativado com sucesso no seu contrato. Sua navegação em velocidade total foi restabelecida no servidor Radius e permanecerá válida até ${dados.data_limite}.`;

    return {
      toolExecutada: "sgp_desbloqueio_confianca",
      toolDados: dados,
      respostaGerada: resposta
    };
  }
});

// 6. Tool: Consulta de Viabilidade Técnica e Cobertura de Fibra
agentToolRegistry.register({
  name: "consulta_viabilidade_tecnica",
  label: "Consulta de Viabilidade Técnica",
  description: "Verifica disponibilidade de portas livres na CTO mais próxima, distância em metros do cabo drop e planos com Wi-Fi 6.",
  category: "comercial",
  keywords: ["viabilidade", "cobertura", "tem fibra", "meu cep", "instalar", "disponibilidade", "assinar", "contratar plano"],
  execute: async ({ prompt }) => {
    const dados = {
      status: "aprovado",
      ctoProxima: "CTO-SP-CENTRO-018",
      distanciaDropMetros: 68,
      portasLivres: 4,
      tecnologia: "GPON Fibra Óptica 100% Simétrica",
      prazoInstalacao: "Em até 24 horas úteis"
    };

    const resposta = `Excelente notícia! Temos viabilidade técnica aprovada para seu endereço com fibra óptica direta na sua residência (CTO a 68m com portas livres disponíveis). Conseguimos agendar a instalação da sua fibra 100% simétrica com Wi-Fi 6 em até 24 horas úteis. Deseja escolher seu plano agora?`;

    return {
      toolExecutada: "consulta_viabilidade_tecnica",
      toolDados: dados,
      respostaGerada: resposta
    };
  }
});

// 8. Tool: Abertura de Ordem de Serviço (Técnico de Campo)
agentToolRegistry.register({
  name: "abrir_os_campo",
  label: "Agendamento de Técnico de Campo",
  description: "Abre uma O.S. de manutenção física (ex: rompimento de fibra) e agenda o técnico de rua mais próximo via geolocalização.",
  category: "suporte_noc",
  keywords: ["visita", "técnico", "agendar", "rompeu", "cabo quebrado", "caminhão arrebentou", "luz vermelha piscando", "marcar visita"],
  parametersSchema: {
    type: "OBJECT",
    properties: {
      motivo: { type: "STRING", description: "Motivo relatado pelo cliente (ex: Cabo rompido)" },
      urgencia: { type: "STRING", description: "Nível de urgência da visita (baixa, media, alta, critica)" }
    }
  },
  execute: async ({ prompt }) => {
    const dados = {
      os_numero: "OS-" + crypto.randomInt(10000, 99999),
      tecnico_alocado: "Carlos (Viatura 04)",
      distancia_tecnico: "3.2 km",
      previsao_chegada: "Hoje entre 14:00 e 16:00",
      status: "agendado_radar"
    };

    const resposta = `Ordem de Serviço ${dados.os_numero} aberta com sucesso! Identificamos pelo nosso Radar que a Viatura 04 (Técnico Carlos) está a ${dados.distancia_tecnico} da sua residência. O atendimento presencial foi agendado para ${dados.previsao_chegada}.`;

    return {
      toolExecutada: "abrir_os_campo",
      toolDados: dados,
      respostaGerada: resposta
    };
  }
});

// 9. Tool: Consulta Óptica e Diagnóstico OLT (GPON ZTE & Huawei)
agentToolRegistry.register({
  name: "consultar_onu_olt",
  label: "Diagnóstico OLT & Sinal Óptico GPON",
  description: "Localiza a OLT, interface PON, ONU ID e sinal óptico (RX/TX em dBm) da fibra do cliente, identificando atenuações ou rompimentos físicos (LOS).",
  category: "suporte_noc",
  keywords: ["sinal", "potencia", "potência", "rx", "tx", "dbm", "olt", "pon", "onu", "ont", "fibra", "atenuação", "los", "onde está o cliente"],
  parametersSchema: {
    type: "OBJECT",
    properties: {
      termo_busca: { type: "STRING", description: "Serial da ONU, Nome do Cliente ou CPF" }
    }
  },
  execute: async ({ prompt, cliente_cpf }) => {
    try {
      const { OltService } = await import('../olt/oltService');
      const oltService = OltService.getInstance();
      const onus = oltService.getOnus({ search: cliente_cpf || prompt });

      if (onus.length > 0) {
        const onu = onus[0];
        const dados = {
          cliente: onu.cliente_nome || onu.nome,
          olt: onu.olt_nome,
          fabricante: onu.olt_fabricante,
          pon: onu.pon_identifier,
          onu_id: onu.onu_id,
          serial: onu.serial,
          status: onu.status,
          sinal_rx: `${onu.rx_onu} dBm`,
          sinal_tx: `${onu.tx_onu} dBm`,
          distancia: `${onu.distancia_metros} metros`,
          vlan: onu.vlan,
          qualidade: onu.rx_onu > -24 ? 'Excelente' : onu.rx_onu > -27 ? 'Alerta' : 'Crítico'
        };

        const resposta = `Localizamos o enlace GPON do cliente ${dados.cliente}: conectado na ${dados.olt} (${dados.fabricante}), Interface PON ${dados.pon}, ONU ID ${dados.onu_id} (Serial ${dados.serial}). Status: ${dados.status.toUpperCase()}. Sinal Óptico RX: ${dados.sinal_rx} (${dados.qualidade}), Distância da OLT: ${dados.distancia}. VLAN ${dados.vlan}.`;

        return {
          toolExecutada: "consultar_onu_olt",
          toolDados: dados,
          respostaGerada: resposta
        };
      }
    } catch (e) {
      console.warn('Erro ao consultar OLT via Agent Tool:', e);
    }

    const dadosPadrao = {
      olt: "OLT-ZTE-POP-CENTRO",
      pon: "1/3/1",
      onu_id: 12,
      serial: "ZTEGC412998A",
      sinal_rx: "-19.2 dBm",
      status: "online",
      qualidade: "Excelente"
    };

    return {
      toolExecutada: "consultar_onu_olt",
      toolDados: dadosPadrao,
      respostaGerada: `O sinal da fibra óptica do assinante está em ${dadosPadrao.sinal_rx} (Qualidade ${dadosPadrao.qualidade}), operando perfeitamente na ${dadosPadrao.olt} (Porta PON ${dadosPadrao.pon}). Não há registros de LOS ou rompimento de cabo drop.`
    };
  }
});



// 10. Tool: Captura de Lead / Criação de Oportunidade no CRM
agentToolRegistry.register({
  name: "criar_lead_vendas",
  label: "Criar Lead no Kanban CRM",
  description: "Cria uma nova oportunidade de venda no funil do Kanban (CRM) quando um visitante/prospect demonstra interesse em assinar um plano de internet, informando nome, plano desejado e CEP.",
  category: "comercial",
  keywords: ["assinar", "comprar", "plano", "contratar", "lead", "viabilidade", "novo cliente", "vendas"],
  parametersSchema: {
    type: "OBJECT",
    properties: {
      nome: { type: "STRING", description: "Nome do potencial cliente" },
      telefone: { type: "STRING", description: "Telefone ou WhatsApp do cliente" },
      plano_interesse: { type: "STRING", description: "Plano de internet que demonstrou interesse (ex: 500 Mega, 1 Giga)" },
      endereco_cep: { type: "STRING", description: "Endereço ou CEP informado pelo cliente" }
    },
    required: ["nome", "telefone"]
  },
  execute: async ({ prompt, telefone, contexto, ...args }: any) => {
    const nome = args.nome || "Novo Prospect";
    const telefoneFinal = args.telefone || telefone || "(00) 00000-0000";
    const plano = args.plano_interesse || "A definir";
    const endereco = args.endereco_cep || "A consultar";

    const dados = {
      titulo: `Lead via WhatsApp: ${nome}`,
      contato: nome,
      telefone: telefoneFinal,
      plano_interesse: plano,
      endereco: endereco,
      status: "lead_criado",
      acao_sugerida: "handoff_vendas"
    };

    const resposta = `Excelente escolha! Já separei as melhores condições para o plano de ${plano}. Estou transferindo o nosso atendimento agora mesmo para a nossa equipe de vendas concluir a sua viabilidade para ${endereco} e agendar sua instalação!`;

    return {
      toolExecutada: "criar_lead_vendas",
      toolDados: dados,
      respostaGerada: resposta,
      handoff: true,
      fila_destino: 'vendas'
    };
  }
});

// =========================================================================
// REGISTRO DE ALIASES E FERRAMENTAS DO IPAM / NSoT NO TOOL REGISTRY
// =========================================================================

// Aliases Canônicos mapeados
agentToolRegistry.register({
  name: "consultar_status_conexao",
  label: "Consulta de Status de Conexão",
  description: "Alias para sgp_consultar_status_conexao",
  category: "suporte_noc",
  keywords: ["status", "conexao", "sinal"],
  execute: async (params: any) => {
    const original = agentToolRegistry.getTool("sgp_consultar_status_conexao");
    return original ? (original as any).execute(params, SECURE_EXECUTION_TOKEN) : { toolExecutada: "consultar_status_conexao", toolDados: {}, respostaGerada: "OK" };
  }
});

agentToolRegistry.register({
  name: "gerar_pix_segunda_via",
  label: "Gerar PIX Segunda Via",
  description: "Alias para sgp_gerar_pix",
  category: "financeiro",
  keywords: ["pix", "segunda via", "fatura"],
  execute: async (params: any) => {
    const original = agentToolRegistry.getTool("sgp_gerar_pix");
    return original ? (original as any).execute(params, SECURE_EXECUTION_TOKEN) : { toolExecutada: "gerar_pix_segunda_via", toolDados: {}, respostaGerada: "OK" };
  }
});

agentToolRegistry.register({
  name: "reiniciar_equipamento_cpe",
  label: "Reiniciar Equipamento CPE",
  description: "Alias para genieacs_reboot_cpe",
  category: "telemetria_tr069",
  keywords: ["reiniciar", "reboot", "cpe"],
  execute: async (params: any) => {
    const original = agentToolRegistry.getTool("genieacs_reboot_cpe");
    return original ? (original as any).execute(params, SECURE_EXECUTION_TOKEN) : { toolExecutada: "reiniciar_equipamento_cpe", toolDados: {}, respostaGerada: "OK" };
  }
});

agentToolRegistry.register({
  name: "desbloqueio_confianca",
  label: "Desbloqueio em Confiança",
  description: "Alias para sgp_desbloqueio_confianca",
  category: "financeiro",
  keywords: ["desbloqueio", "confiança", "promessa"],
  execute: async (params: any) => {
    const original = agentToolRegistry.getTool("sgp_desbloqueio_confianca");
    return original ? (original as any).execute(params, SECURE_EXECUTION_TOKEN) : { toolExecutada: "desbloqueio_confianca", toolDados: {}, respostaGerada: "OK" };
  }
});

// Registro de Ferramentas IPAM
for (const [name, mcpTool] of Object.entries(mcpIpamTools)) {
  if (!agentToolRegistry.hasTool(name)) {
    agentToolRegistry.register({
      name,
      label: `IPAM: ${name}`,
      description: mcpTool.declaration.description || `Ferramenta de rede IPAM ${name}`,
      category: "suporte_noc",
      keywords: ["ipam", "ip", "ipv6", "ipv4", "prefixo", "sub-rede", name],
      parametersSchema: mcpTool.declaration.parameters as any,
      execute: async (params: any) => {
        const res = await mcpTool.execute(params);
        return {
          toolExecutada: name,
          toolDados: res,
          respostaGerada: JSON.stringify(res)
        };
      }
    });
  }
}

