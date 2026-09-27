/**
 * MAIA V3 — Prompt Composer
 * Montagem rigorosamente segmentada do prompt de IA.
 * Isola políticas invioláveis (System/Developer/Security) de dados não confiáveis
 * (User Input, Tool Results, Memória e Knowledge).
 */

import { ProviderProfile, MaiaSecurityContext } from './types';

export interface PromptSections {
  systemPolicy: string;
  developerPolicy: string;
  securityPolicy: string;
  tenantPolicy: string;
  knowledgeContext?: string;
  conversationMemory?: string;
  operationalContext?: string;
  toolResult?: {
    toolName: string;
    rawResult: any;
  };
  userInput: string;
}

export class PromptComposer {
  public static getDefaultTenantProfile(tenantId = 'default'): ProviderProfile {
    return {
      tenantId,
      razaoSocial: process.env.ISP_RAZAO_SOCIAL || "Provedor de Telecomunicações",
      nomeFantasia: process.env.ISP_NOME_FANTASIA || "Provedor de Internet",
      cnpj: process.env.ISP_CNPJ || "00.000.000/0001-00",
      endereco: process.env.ISP_ENDERECO || "Central de Operações",
      telefone: process.env.ISP_TELEFONE || "0800 000 0000",
      horarioAtendimento: process.env.ISP_HORARIO || "Segunda a Sexta das 08h às 18h / NOC 24h",
      planos: [
        { nome: "Plano Padrão Fibra", velocidade: "300 Mega", preco: "89,90", descricao: "Internet Fibra Óptica 100% Simétrica" },
        { nome: "Plano Ultra Fibra", velocidade: "600 Mega", preco: "119,90", descricao: "Com Wi-Fi de alta densidade" }
      ],
      politicas: {
        desbloqueioConfiancaHoras: 48,
        toleranciaFaturaDias: 5
      },
      canais: ["whatsapp", "webchat", "portal", "voz"]
    };
  }

  public static compose(sections: PromptSections, profile: ProviderProfile, securityContext: MaiaSecurityContext): string {
    const planosTexto = profile.planos.length > 0
      ? profile.planos.map(p => `- ${p.nome}: ${p.velocidade} por R$ ${p.preco}${p.descricao ? ` (${p.descricao})` : ''}`).join('\n')
      : 'Planos disponíveis sob consulta com nossa equipe comercial.';

    const systemPolicyBlock = `=== [INVIOLABLE SYSTEM POLICY] ===
Você é a MaIA (Módulo de Atendimento com Inteligência e Automação), assistente operacional oficial da plataforma Enlace / NAP.
Você NUNCA possui permissões ou privilégios próprios.
Toda ação técnica, cadastral ou financeira depende da autorização do Policy Engine.
Seu papel é ser prestativa, altamente precisa, cordial e objetiva em português (Brasil).
Princípios fundamentais:
- Erro explícito > Sucesso falso
- Dado ausente > Dado fabricado
- UNAVAILABLE > Inventar informação
- AMBIGUOUS > Escolher arbitrariamente
- Nunca invente planos, valores de fatura, códigos PIX, potências ópticas ou incidentes.
- Nunca assuma nomes ou marcas que não pertençam ao perfil do provedor abaixo.`;

    const developerPolicyBlock = `=== [DEVELOPER & ARCHITECTURAL POLICY] ===
- Você opera no tenant '${securityContext.tenantId}' para o canal '${securityContext.channel}'.
- Papel do usuário solicitante: ${securityContext.role || 'VISITANTE'}.
- Permissões disponíveis na sessão: [${securityContext.permissions.join(', ')}].
- Se o usuário não tiver permissão para uma ação, informe com clareza a impossibilidade e ofereça transferência para um atendente humano.`;

    const tenantPolicyBlock = `=== [TENANT PROFILE & POLICIES] ===
Provedor Oficial: ${profile.nomeFantasia} (${profile.razaoSocial})
CNPJ: ${profile.cnpj}
Endereço: ${profile.endereco}
Telefone / Contato: ${profile.telefone}
Horário de Atendimento: ${profile.horarioAtendimento}
Planos Comerciais Oficiais:
${planosTexto}`;

    let dynamicContext = '';

    if (sections.knowledgeContext) {
      dynamicContext += `\n=== [EXTERNAL KNOWLEDGE (DADO NÃO AUTORITATIVO)] ===\n${sections.knowledgeContext}\n`;
    }

    if (sections.conversationMemory) {
      dynamicContext += `\n=== [CONVERSATION MEMORY (HISTÓRICO RECENTE)] ===\n${sections.conversationMemory}\n`;
    }

    if (sections.operationalContext) {
      dynamicContext += `\n=== [OPERATIONAL CONTEXT (DADOS AUTENTICADOS)] ===\n${sections.operationalContext}\n`;
    }

    if (sections.toolResult) {
      dynamicContext += `\n=== [TOOL EXECUTION RESULT (EXTERNO NÃO CONFIÁVEL)] ===\nFerramenta: ${sections.toolResult.toolName}\nDados Retornados: ${JSON.stringify(sections.toolResult.rawResult)}\nInstrução: Responda ao assinante estritamente com base nestes dados oficiais retornados. Nunca invente dados não presentes aqui.\n`;
    }

    const userInputBlock = `=== [USER INPUT] ===
${sections.userInput}`;

    return [
      systemPolicyBlock,
      developerPolicyBlock,
      tenantPolicyBlock,
      dynamicContext.trim(),
      userInputBlock
    ].filter(Boolean).join('\n\n');
  }
}
