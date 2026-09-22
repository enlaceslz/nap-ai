import { GoogleGenAI } from "@google/genai";
import { ZabbixService } from "../zabbix/zabbixService";
import { GenieacsService } from "../genieacs/genieacsService";
import { FieldService } from "../field/fieldService";

/**
 * AI GATEWAY / NOC COPILOT
 * Processa requisições de linguagem natural dos operadores (PRD #20 e #41).
 */
export class NocCopilot {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      this.ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
    }
  }

  // Define operational tools (MCP Mock logic)
  private getTools() {
    return [
      {
        functionDeclarations: [

          {
            name: "get_field_work_orders",
            description: "Consulta as Ordens de Serviço (OS) ativas para os técnicos de campo.",
            parameters: {
              type: "OBJECT",
              properties: {
                status_filter: {
                  type: "STRING",
                  description: "Filtrar por status (ex: pending, dispatched, en_route)",
                }
              }
            }
          },
          {
            name: "update_os_status",
            description: "Atualiza o status de uma Ordem de Serviço de campo. (Ação Operacional)",
            parameters: {
              type: "OBJECT",
              properties: {
                os_number: { type: "STRING" },
                new_status: { type: "STRING", description: "Novo status: en_route, on_site, resolved" }
              },
              required: ["os_number", "new_status"]
            }
          },
          {
            name: "get_active_incidents",
            description: "Lista todos os incidentes ativos no Zabbix (NOC).",
            parameters: {
              type: "OBJECT",
              properties: {
                severity_filter: {
                  type: "STRING",
                  description: "Filtrar por severidade (critical, warning). Opcional.",
                }
              }
            }
          },
          {
            name: "get_cpe_status",
            description: "Consulta o status atual de uma ONT/Roteador de um cliente no GenieACS/TR-069.",
            parameters: {
              type: "OBJECT",
              properties: {
                mac_or_serial: {
                  type: "STRING",
                  description: "MAC Address ou Serial Number da CPE",
                }
              },
              required: ["mac_or_serial"]
            }
          }
        ]
      }
    ];
  }

  private async executeTool(call: any): Promise<any> {
    const name = call.name;
    const args = call.args || {};

    try {
      if (name === "get_active_incidents") {
        const zabbix = ZabbixService.getInstance();
        const problems = zabbix.getProblems();
        if (args.severity_filter) {
          return problems.filter(p => p.severity === args.severity_filter);
        }
        return problems;
      }


      if (name === "get_field_work_orders") {
        const fieldService = FieldService.getInstance();
        let orders = fieldService.getWorkOrders();
        if (args.status_filter) orders = orders.filter(o => o.status === args.status_filter);
        return orders;
      }
      
      if (name === "update_os_status") {
        const fieldService = FieldService.getInstance();
        const updated = fieldService.updateOsStatus(args.os_number, args.new_status, "Telegram_User");
        if (updated) return { success: true, os: updated };
        return { error: "OS não encontrada." };
      }

      if (name === "get_cpe_status") {
        const genieacs = GenieacsService.getInstance();
        const devices = await genieacs.getDevices();
        // Simple search logic
        const query = (args.mac_or_serial || '').toLowerCase();
        const device = devices.find(d => 
          d.mac.toLowerCase().includes(query) || 
          d.serialNumber.toLowerCase().includes(query)
        );
        if (device) return device;
        return { error: "CPE não encontrada ou GenieACS indisponível." };
      }

      return { error: "Tool não reconhecida." };
    } catch (e: any) {
      return { error: e.message };
    }
  }

  public async ask(prompt: string, role: string, napUserId: string): Promise<string> {
    if (!this.ai) {
      return "⚠️ <b>AI Gateway Indisponível</b>\\nA chave do Gemini não está configurada no backend.";
    }

    const systemPrompt = `Você é o NAP Copilot, a Inteligência Artificial operacional da rede.
Você está conversando com um usuário autenticado via Telegram com o perfil: \${role}. 
Aja de forma técnica, objetiva e profissional (Anti-Slop). Não use jargões de marketing.
Use formatação HTML simples (<b>, <i>, <code>) suportada pelo Telegram.
Responda sempre em Português Brasileiro.
Deixe claro quando estiver afirmando com base nas ferramentas (ex: Fontes: Zabbix, GenieACS).
Se a solicitação for de risco (RED), informe que ações diretas pelo chat precisam de aprovação (PRD #12).

Pergunta do operador: "\${prompt}"`;

    try {
      const chat = this.ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: systemPrompt,
          tools: this.getTools() as any
        }
      });

      let response = await chat.sendMessage({ message: "Inicie a análise e chame ferramentas se necessário." });
      
      let loopCount = 0;
      while (response.functionCalls && response.functionCalls.length > 0 && loopCount < 3) {
        const call = response.functionCalls[0];
        const result = await this.executeTool(call);
        
        response = await chat.sendMessage({
          message: [{
            functionResponse: {
              name: call.name,
              response: { result }
            }
          }]
        } as any);
        loopCount++;
      }

      return response.text || "Sem resposta.";
    } catch (error) {
      console.error("[NOC Copilot] Erro:", error);
      return "🚨 Erro ao processar IA: Falha de comunicação com o modelo LLM.";
    }
  }
}
