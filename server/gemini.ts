import { GoogleGenAI } from "@google/genai";
import { agentToolRegistry } from "./agent/toolRegistry";

export async function processGeminiAgentRun(reqBody: any) {
  const { prompt = "", cliente_cpf, telefone, contexto } = reqBody;
  
  let toolExecutada: string | undefined = undefined;
  let toolDados: any = null;
  let respostaGerada = "";

  if (process.env.GEMINI_API_KEY) {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const tools = [{ functionDeclarations: agentToolRegistry.toGeminiFunctionDeclarations() }];
    
    // Contexto raiz
    const promptRaiz = `Você é a MaIA, a inteligência artificial ultra-humanizada, acolhedora e calorosa do provedor de internet NAP Telecom Fibra. Fale como um ser humano super simpático e empático, nunca como um robô.
Responda cordialmente em português (Brasil), com tom de especialista em telecomunicações, sendo prestativo, objetivo e empático. Use as ferramentas disponíveis para consultar dados técnicos, gerar PIX, agendar visitas ou reiniciar equipamentos. 
Se o usuário for um visitante/lead interessado em contratar internet (via texto ou transcrição de áudio), seja um vendedor persuasivo, apresente os planos (500 Mega por R$ 99,90 e 1 Giga com Wi-Fi 6 por R$ 149,90) e INVOQUE a ferramenta criar_lead_vendas para enviar ao CRM. Nunca invente dados técnicos (sempre chame a ferramenta).
Solicitação do usuário (Texto/Transcrição de Áudio): "${prompt}"`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: promptRaiz,
      config: {
        tools: tools
      }
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const functionCall = response.functionCalls[0];
      console.log(`[Gemini Agent] Decisão Autônoma - Invocando Tool: ${functionCall.name}`, functionCall.args);
      
      try {
         // Executa a função local na nossa infraestrutura
         const execution = await agentToolRegistry.executeTool(functionCall.name, { 
           prompt, 
           cliente_cpf, 
           telefone, 
           contexto, 
           ...functionCall.args 
         });
         
         toolExecutada = execution.toolExecutada;
         toolDados = execution.toolDados;
         const handoffFlag = (execution as any).handoff || false;
         
         // Envia o resultado de volta para o Gemini formatar uma resposta humanizada
         const secondPrompt = `O sistema executou a ferramenta ${toolExecutada} com o seguinte resultado em JSON: ${JSON.stringify(toolDados)}. Baseado nisso, dê a resposta final ao cliente de forma ultra-humanizada.`;
         
         const finalResponse = await ai.models.generateContent({
           model: "gemini-2.5-flash",
           contents: [
             { role: "user", parts: [{ text: promptRaiz }] },
             { role: "model", parts: [{ functionCall: functionCall }] },
             { role: "function", parts: [{ functionResponse: { name: functionCall.name, response: { result: toolDados } } }] },
             { role: "user", parts: [{ text: secondPrompt }] }
           ]
         });
         
         respostaGerada = finalResponse.text || execution.respostaGerada;
      } catch (toolErr: any) {
        console.error("[Gemini Agent] Erro ao executar tool:", toolErr);
        respostaGerada = `Desculpe, tentei consultar essa informação (${functionCall.name}) mas ocorreu um erro no sistema.`;
      }
    } else {
      respostaGerada = response.text || "";
    }
  } else {
    // Fallback sem IA
    respostaGerada = "Modo Fallback: A chave GEMINI_API_KEY não está configurada.";
  }

  return {
    sucesso: true,
    resposta: respostaGerada,
    tool_executada: toolExecutada,
    tool_dados: toolDados,
    handoff: typeof toolExecutada !== "undefined" && toolExecutada === "criar_lead_vendas" ? true : false
  };
}
