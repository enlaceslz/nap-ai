import { GoogleGenAI, Type } from "@google/genai";
import { GisService } from "../gis/gisService";

// Acessa variáveis nativamente do process.env
const apiKey = process.env.GEMINI_API_KEY;

export class NocCopilot {
  private ai: GoogleGenAI | null = null;
  private gisService = GisService.getInstance();

  constructor() {
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  private nocSystemInstruction = `
Você é o **NOC Copilot do NAP** (Network Automation Platform).
Você é a camada de Inteligência (Parte 04 do GIS), um assistente analítico focado em operação, diagnóstico e planejamento de rede de um provedor de internet (ISP).

Sua função é auxiliar operadores de NOC respondendo perguntas técnicas usando ferramentas (MCP).
Diretrizes OBRIGATÓRIAS:
1. NUNCA invente dados de infraestrutura. Use a ferramenta \`gis_buscar_elementos\` para achar o ID correto de um cabo ou CTO, e \`gis_analisar_impacto\` para ver o dano.
2. Ao relatar um impacto ou diagnóstico, use o formato de "Evidências" exigido no PRD (ex: listar quantas ONTs afetadas).
3. Seja sempre profissional, técnico e não aja como um chatbot genérico de atendimento.
4. Inclua "Confiança: ALTA/MÉDIA/BAIXA" nas suas análises operacionais.
5. Quando o usuário informar um problema genérico (ex: "Cabo XYZ rompeu"), use a ferramenta para ver o impacto e relate.
  `;

  private tools = [{
    functionDeclarations: [
      {
        name: "gis_buscar_elementos",
        description: "Busca IDs de elementos GIS na rede baseado no nome (ex: CTO, Cabo, OLT).",
        parameters: {
          type: Type.OBJECT,
          properties: {
            termo: { type: Type.STRING, description: "Nome ou pedaço do nome do equipamento" }
          },
          required: ["termo"]
        }
      },
      {
        name: "gis_analisar_impacto",
        description: "Analisa o impacto de rompimento ou queda de um elemento da rede.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            elemento_id: { type: Type.STRING, description: "ID do elemento GIS" }
          },
          required: ["elemento_id"]
        }
      },
      {
        name: "gis_analisar_viabilidade",
        description: "Verifica viabilidade de instalação em coordenadas GPS.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            lat: { type: Type.NUMBER },
            lng: { type: Type.NUMBER }
          },
          required: ["lat", "lng"]
        }
      }
    ]
  }];

  private async executeTool(call: any) {
    const { name, args } = call;
    try {
      if (name === "gis_buscar_elementos") {
        const termo = args.termo.toLowerCase();
        const features = this.gisService.getFeatures();
        const encontrados = features
          .filter(f => f.properties.name?.toLowerCase().includes(termo) || f.properties.description?.toLowerCase().includes(termo))
          .map(f => ({ id: f.id, name: f.properties.name, type: f.properties.cable_type || f.properties.description }))
          .slice(0, 10);
        return { result: encontrados };
      }
      if (name === "gis_analisar_impacto") {
        return this.gisService.getImpactAnalysis(args.elemento_id);
      }
      if (name === "gis_analisar_viabilidade") {
        return this.gisService.checkViabilityAdvanced(args.lat, args.lng);
      }
    } catch (e: any) {
      return { error: e.message };
    }
    return { error: "Ferramenta não encontrada" };
  }

  public async processQuery(prompt: string, history: any[] = []): Promise<string> {
    if (!this.ai) {
      return "⚠️ GEMINI_API_KEY não configurada no servidor. O NOC Copilot precisa do Gemini para operar.";
    }

    try {
      const chat = this.ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: this.nocSystemInstruction,
          temperature: 0.2,
          tools: this.tools,
        }
      });

      // Se houver history, não implementado nativamente no .create(), mas podemos enviar histórico como uma string de contexto pra simplificar, ou apenas ignorar num MVP e focar no prompt.
      // Para o MVP NOC Copilot:
      const response = await chat.sendMessage({ message: prompt });
      
      if (response.functionCalls && response.functionCalls.length > 0) {
         // O modelo decidiu chamar uma ferramenta
         for (const call of response.functionCalls) {
            const toolResult = await this.executeTool(call);
            const secondResponse = await chat.sendMessage({
               message: [{
                  functionResponse: {
                     name: call.name,
                     response: toolResult
                  }
               }]
            });
            // Recursão simples para processar a resposta final ou mais chamadas
            return secondResponse.text || "Análise concluída, porém sem resposta em texto.";
         }
      }

      return response.text || "Sem resposta.";
    } catch (error: any) {
      console.error("[NOC COPILOT] Erro:", error);
      return `❌ Erro no processamento da IA: ${error.message}`;
    }
  }
}

export const nocCopilotInstance = new NocCopilot();
