import { ErpFactory } from './integrations/erp/ErpFactory';
import { GoogleGenAI } from "@google/genai";
import { agentToolRegistry } from "./agent/toolRegistry";
import { aiAlerts } from "./ai_state.js";
import fetch from "node-fetch";

export async function processGeminiAgentRun(reqBody: any, configOverride?: any) {
  const { prompt = "", cliente_cpf, telefone, contexto } = reqBody;
  
  let toolExecutada: string | undefined = undefined;
  let toolDados: any = null;
  let respostaGerada = "";

  // Dynamic API keys and settings from in-memory config or override
  let dynamicApiKey = configOverride?.apiKey || "";
  let dynamicBaseUrl = configOverride?.baseUrl || "";
  let dynamicProvedorGateway = configOverride?.provedorGateway || "";

  // Fallback to process.env if UI is not configured
  const apiKey = dynamicApiKey || process.env.GEMINI_API_KEY;
  const baseUrl = dynamicBaseUrl || process.env.GEMINI_BASE_URL || "https://9router.enlace.slz.br";
  const use9Router = dynamicProvedorGateway === "9router" || (process.env.GEMINI_USE_9ROUTER === 'true' && dynamicProvedorGateway !== 'direct');
  
  if (apiKey) {
    // Para usar o SDK Oficial do Gemini passando por um proxy/gateway (como o 9router)
    // Precisamos ajustar o baseURL do cliente, ou fazer fetch direto. 
    // Como o SDK @google/genai (v0.1.1+) suporta baseUrl, vamos tentar injetar.
    
    let response;
    
    const promptRaiz = `Você é a MaIA, a inteligência artificial ultra-humanizada, acolhedora e calorosa do provedor de internet DJD Telecom. Fale como um ser humano super simpático e empático, nunca como um robô. Os dados oficiais da empresa são: Razão Social: D.J.D. TELECOM LTDA, CNPJ: 36.954.827/0001-81, Endereço: Av. Mal. Castelo Branco, 148, Sala 207, São Francisco, São Luís - MA, CEP: 65076-090.
Responda cordialmente em português (Brasil), com tom de especialista em telecomunicações, sendo prestativo, objetivo e empático. Use as ferramentas disponíveis para consultar dados técnicos, gerar PIX, agendar visitas ou reiniciar equipamentos. Se o usuário for um visitante/lead interessado em contratar internet (via texto ou transcrição de áudio), seja um vendedor persuasivo, apresente os planos (500 Mega por R$ 99,90 e 1 Giga com Wi-Fi 6 por R$ 149,90) e INVOQUE a ferramenta criar_lead_vendas para enviar ao CRM. Nunca invente dados técnicos (sempre chame a ferramenta).
Solicitação do usuário (Texto/Transcrição de Áudio): "${prompt}"`;
    
    try {
      // Tentativa de usar o proxy via REST call direto se houver BASE_URL configurado (ex: 9router)
      if (use9Router) {
         console.log("[Gemini] Usando Gateway customizado:", baseUrl);
         
         const toolsParam = [{ functionDeclarations: agentToolRegistry.toGeminiFunctionDeclarations() }];
         
         const reqPayload = {
            contents: [{ parts: [{ text: promptRaiz }] }],
            tools: toolsParam
         };

         // Supondo API Rest compatível com o Vertex AI ou Gemini API v1beta
         const res = await fetch(`${baseUrl}/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reqPayload)
         });
         
         if (!res.ok) {
            throw new Error(`Gateway Error: ${res.statusText}`);
         }
         
         const data = await res.json();
         // Parse básico da resposta do gateway (padrão Gemini)
         const candidate = data.candidates?.[0];
         if (candidate?.content?.parts?.[0]?.functionCall) {
            const fc = candidate.content.parts[0].functionCall;
            const functionName = fc.name;
            const functionArgs = fc.args;
            toolExecutada = functionName;
            
            console.log(`[Gateway Gemini] Ferramenta detectada: ${functionName}`, functionArgs);
            if (agentToolRegistry.hasTool(functionName)) {
               toolDados = await agentToolRegistry.executeTool(functionName, functionArgs);
               const promptFollowup = `A ferramenta ${functionName} retornou o seguinte JSON: ${JSON.stringify(toolDados)}. Responda ao usuário baseando-se NESTES DADOS, sem inventar nada. Seja humano.`;
               
               const reqPayload2 = {
                 contents: [{ parts: [{ text: promptRaiz + "\n" + promptFollowup }] }]
               };
               
               const res2 = await fetch(`${baseUrl}/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify(reqPayload2)
               });
               
               const data2 = await res2.json();
               respostaGerada = data2.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, ocorreu um erro ao analisar os dados do sistema.";
            } else {
               respostaGerada = `Eu detectei a necessidade de usar a ferramenta ${functionName}, mas ela não está ativa.`;
            }
         } else {
            respostaGerada = candidate?.content?.parts?.[0]?.text || "Desculpe, não consegui gerar uma resposta pelo gateway.";
         }
      } else {
        // Uso padrão do SDK do Google
        const ai = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });
        const tools = [{ functionDeclarations: agentToolRegistry.toGeminiFunctionDeclarations() }];
        
        const callPromise = ai.models.generateContent({
          model: "gemini-flash-latest",
          contents: promptRaiz,
          config: {
            tools: tools
          }
        });
        const timeoutCall = new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Timeout Gemini 1st turn")), 5000));
        response = await Promise.race([callPromise, timeoutCall]);

        if (response.functionCalls && response.functionCalls.length > 0) {
          const functionCall = response.functionCalls[0];
          toolExecutada = functionCall.name;
          const args = functionCall.args;
          
          console.log(`[Gemini SDK] Tool Call detectado: ${toolExecutada}`, args);
          
          if (agentToolRegistry.hasTool(toolExecutada)) {
            const execResult = await agentToolRegistry.executeTool(toolExecutada, { ...args, cliente_cpf, telefone, contexto } as any);
            toolDados = execResult.toolDados || execResult;
            
            try {
              const promptFollowup = `A ferramenta ${toolExecutada} retornou os seguintes dados: ${JSON.stringify(toolDados)}. Responda ao assinante de forma acolhedora, humana e objetiva baseando-se nestes dados (por exemplo, informando o código PIX Copia e Cola, valor e vencimento). Nunca invente dados e nunca mencione a palavra JSON.`;
              
              const followupPromise = ai.models.generateContent({
                model: "gemini-flash-latest",
                contents: promptRaiz + "\n\n" + promptFollowup
              });
              const timeoutPromise = new Promise<null>((_, reject) => setTimeout(() => reject(new Error("Timeout followup")), 4000));
              const responseFollowup: any = await Promise.race([followupPromise, timeoutPromise]);
              respostaGerada = responseFollowup?.text || execResult.respostaGerada || "Prontinho! Solicitação processada com sucesso.";
            } catch (followupErr) {
              console.log("[Gemini SDK] Usando resposta direta da ferramenta:", followupErr);
              respostaGerada = execResult.respostaGerada || "Prontinho! Solicitação processada com sucesso no sistema.";
            }
          }
        } else {
          respostaGerada = response.text || "Desculpe, não consegui entender o contexto.";
        }
      }
    } catch (e: any) {
      console.error("[Gemini] Erro de API (Cota ou Autenticação):", e.message);
      
      const isHighDemandOrQuota = e.message?.includes('429') || 
                                  e.message?.includes('503') ||
                                  e.message?.toLowerCase().includes('quota') || 
                                  e.message?.toLowerCase().includes('resource_exhausted') ||
                                  e.message?.toLowerCase().includes('high demand') ||
                                  e.message?.toLowerCase().includes('timeout');

      if (isHighDemandOrQuota) {
        // Registrar alerta no sistema operacional
        if (!aiAlerts.some((a: any) => a.type === 'QUOTA_EXHAUSTED')) {
          aiAlerts.push({
            id: `auto_${Date.now()}`,
            type: 'QUOTA_EXHAUSTED',
            message: 'Limite de cota ou alta demanda da IA detectada (Erro 429/503). Contingência local ativa.',
            provider: use9Router ? '9router Gateway' : 'Google Gemini (Flash)',
            details: e.message,
            timestamp: new Date().toISOString()
          });
        }

         // Tentar failover automático para o 9router Enterprise se não estiver usando
         if (!use9Router && baseUrl) {
           console.log("[Gemini Failover] Tentando failover automático para 9router:", baseUrl);
           try {
             const toolsParam = [{ functionDeclarations: agentToolRegistry.toGeminiFunctionDeclarations() }];
             const reqPayload = {
               contents: [{ parts: [{ text: promptRaiz }] }],
               tools: toolsParam
             };
             const resFailover = await fetch(`${baseUrl}/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(reqPayload)
             });
             if (resFailover.ok) {
               const dataFailover: any = await resFailover.json();
               const candidateFailover = dataFailover.candidates?.[0];
               if (candidateFailover?.content?.parts?.[0]?.text) {
                 return {
                   resposta: candidateFailover.content.parts[0].text,
                   toolExecutada: "FAILOVER_9ROUTER",
                   toolDados: { provedor: "9router Gateway (Failover Automático)" }
                 };
               }
             }
           } catch (failoverErr) {
             console.error("[Gemini Failover Error]", failoverErr);
           }
         }

         // Se o cliente solicitou uma operação de autoatendimento (PIX, fatura, teste de sinal, etc.),
         // executamos via ferramenta nativa para que o assinante não fique desassistido.
         const matchedTool = agentToolRegistry.matchTool(prompt);
         if (matchedTool) {
           try {
             const execResult = await matchedTool.execute({ prompt, cliente_cpf, telefone, contexto });
             return {
               resposta: execResult.respostaGerada,
               toolExecutada: execResult.toolExecutada,
               toolDados: execResult.toolDados
             };
           } catch (mErr) {
             console.error("[Contingency Tool Error]", mErr);
           }
         }

         // Caso seja uma conversa aberta sem tool correspondente, forçamos o handoff
         respostaGerada = "Desculpe, meu cérebro de conversação livre está em alta demanda no momento. Estou transferindo você para a nossa equipe de atendimento humano.";
         return {
            resposta: respostaGerada,
            toolExecutada: "QUOTA_EXHAUSTED",
            toolDados: { erro: e.message }
         };
      }
      
      if (!respostaGerada) {
        const matchedTool = agentToolRegistry.matchTool(prompt);
        if (matchedTool) {
          try {
            const execResult = await matchedTool.execute({ prompt, cliente_cpf, telefone, contexto });
            toolExecutada = execResult.toolExecutada;
            toolDados = execResult.toolDados;
            respostaGerada = execResult.respostaGerada;
          } catch (mErr) {
            respostaGerada = "Olá! Sou a MaIA da DJD Telecom. Estou consultando os sistemas da operadora para você.";
          }
        } else {
          respostaGerada = "Olá! Sou a MaIA, assistente virtual da DJD Telecom. Posso emitir sua 2ª via de fatura PIX, verificar o sinal da sua fibra ou agendar um suporte técnico. Como posso te ajudar hoje?";
        }
      }
    }
  } else {
    respostaGerada = "[Fallback] Chave API não configurada no servidor (.env). Fale com o Administrador.";
  }

  return {
    resposta: respostaGerada,
    toolExecutada,
    toolDados
  };
}
