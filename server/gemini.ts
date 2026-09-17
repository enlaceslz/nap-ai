import { ErpFactory } from './integrations/erp/ErpFactory';
import { GoogleGenAI } from "@google/genai";
import { agentToolRegistry } from "./agent/toolRegistry";
import fetch from "node-fetch";

export async function processGeminiAgentRun(reqBody: any) {
  const { prompt = "", cliente_cpf, telefone, contexto } = reqBody;
  
  let toolExecutada: string | undefined = undefined;
  let toolDados: any = null;
  let respostaGerada = "";

  // Fetch system config to get dynamic API keys from the UI
  let dynamicApiKey = "";
  let dynamicBaseUrl = "";
  let dynamicProvedorGateway = "";

  try {
    const fetch = (await import('node-fetch')).default;
    const configRes = await fetch('http://127.0.0.1:3000/api/configuracoes');
    if (configRes.ok) {
      const config = await configRes.json();
      if (config.ia) {
        dynamicApiKey = config.ia.apiKey;
        dynamicBaseUrl = config.ia.baseUrl;
        dynamicProvedorGateway = config.ia.provedorGateway;
      }
    }
  } catch (e) {
    console.error("Failed to fetch system config in gemini", e.message);
  }

  // Fallback to process.env if UI is not configured
  const apiKey = dynamicApiKey || process.env.GEMINI_API_KEY;
  const baseUrl = dynamicBaseUrl || process.env.GEMINI_BASE_URL || "https://9router.enlace.slz.br";
  const use9Router = dynamicProvedorGateway === "9router" || process.env.GEMINI_USE_9ROUTER === 'true' || process.env.GEMINI_BASE_URL;
  
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
        
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: promptRaiz,
          config: {
            tools: tools
          }
        });

        if (response.functionCalls && response.functionCalls.length > 0) {
          const functionCall = response.functionCalls[0];
          toolExecutada = functionCall.name;
          const args = functionCall.args;
          
          console.log(`[Gemini SDK] Tool Call detectado: ${toolExecutada}`, args);
          
          if (agentToolRegistry.hasTool(toolExecutada)) {
            toolDados = await agentToolRegistry.executeTool(toolExecutada, args as any);
            const promptFollowup = `A ferramenta ${toolExecutada} retornou o seguinte JSON: ${JSON.stringify(toolDados)}. Responda ao usuário de forma natural baseando-se NESTES DADOS. Nunca mencione o JSON.`;
            
            const responseFollowup = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: promptRaiz + "\n\n" + promptFollowup
            });
            respostaGerada = responseFollowup.text || "Desculpe, não consegui formular uma resposta com os dados obtidos.";
          }
        } else {
          respostaGerada = response.text || "Desculpe, não consegui entender o contexto.";
        }
      }
    } catch (e: any) {
      console.error("[Gemini] Erro de API (Cota ou Autenticação):", e.message);
      
      if (e.message?.includes('429') || e.message?.toLowerCase().includes('quota') || e.message?.toLowerCase().includes('resource_exhausted')) {
         // O erro é claramente limite de cota.
         respostaGerada = "Desculpe, meu cérebro principal está sobrecarregado (Cota do Gemini Excedida). Por favor, aguarde enquanto um humano assume o atendimento.";
         // Forçamos o handoff (transbordo) enviando uma flag especial no retorno,
         // para que o waba.ts saiba que a IA caiu por cota.
         return {
            resposta: respostaGerada,
            toolExecutada: "QUOTA_EXHAUSTED",
            toolDados: { erro: e.message }
         };
      }
      
      respostaGerada = "[Fallback Offline] Olá! No momento minha inteligência em nuvem está com instabilidade. Sou a MaIA da DJD Telecom, como posso anotar seu recado?";
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
