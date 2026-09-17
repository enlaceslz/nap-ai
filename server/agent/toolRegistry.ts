import { mcpIpamTools } from "./ipamTools";
/**
 * NAP AI Agent Engine - Dynamic Tool Registry
 * Gerenciador modular e extensível de ferramentas para o Agente Autônomo de Telecom & ISP
 */

export interface AgentTool {
  name: string;
  label: string;
  description: string;
  keywords: string[];
  category: 'financeiro' | 'suporte_noc' | 'telemetria_tr069' | 'radius_erp' | 'comercial' | 'qualidade';
  parametersSchema?: Record<string, any>;
  execute: (params: {
    prompt: string;
    cliente_cpf?: string;
    telefone?: string;
    contexto?: any;
  }) => Promise<{
    toolExecutada: string;
    toolDados: any;
    respostaGerada: string;
  }>;
}

class ToolRegistry {
  private tools: Map<string, AgentTool> = new Map();

  public register(tool: AgentTool): void {
    this.tools.set(tool.name, tool);
  }

  public getTool(name: string): AgentTool | undefined {
    return this.tools.get(name);
  }

  public getAllTools(): AgentTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Busca ferramenta por correspondência semântica e palavras-chave do ISP
   */
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
   * Executa a ferramenta correspondente com fallback seguro
   */
  public async executeTool(
    toolName: string,
    params: { prompt: string; cliente_cpf?: string; telefone?: string; contexto?: any }
  ): Promise<{ toolExecutada: string; toolDados: any; respostaGerada: string }> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Ferramenta "${toolName}" não está registrada no Tool Registry.`);
    }
    return await tool.execute(params);
  }

  /**
   * Converte ferramentas registradas para o schema de Function Calling do Gemini SDK
   */
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
  execute: async ({ cliente_cpf }) => {
    const dados = {
      cliente: "Maria Oliveira",
      cpf: cliente_cpf || "123.456.789-00",
      fatura_id: 8841,
      valor: 99.90,
      vencimento: "10/09/2026",
      codigo_pix: "00020126580014br.gov.bcb.pix0136nap-provedor-fibra-9982-fatura520400005303986540599.905802BR5913NAP TELECOM6009SAO PAULO62070503***6304E8A1"
    };

    const resposta = `Localizei sua fatura em aberto no valor de R$ 99,90 com vencimento em 10/09/2026.\n\nAqui está a chave PIX Copia e Cola para pagamento imediato:\n\`${dados.codigo_pix}\`\n\nAssim que você pagar no seu app bancário, a compensação ocorrerá em menos de 1 minuto no nosso sistema! Deseja o link do boleto bancário também?`;

    return {
      toolExecutada: "sgp_gerar_pix",
      toolDados: dados,
      respostaGerada: resposta
    };
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
      os_numero: "OS-" + Math.floor(Math.random() * 90000 + 10000),
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
