const fs = require('fs');
let code = fs.readFileSync('server/waba.ts', 'utf8');

const importHook = `import { eq } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";`;

const importInject = `import { eq } from "drizzle-orm";
import { processGeminiAgentRun } from "./gemini.js";`;

code = code.replace(importHook, importInject);

const hook = `        if (isTriagem) {
           // Simula buscar histórico (na vida real, mandaríamos o array pro Gemini)
           const prompt = \`Você é a MaIA, a IA de Triagem ultra-humanizada, gentil e calorosa do provedor NAP. O cliente \${nome_cliente} enviou: "\${texto}". O sinal da ONU está normal (-19.5 dBm). Dê uma resposta curta e acolhedora em português, avisando que vai analisar.\`;
           
           try {
             // Chamada interna p/ agent/run (simplificada)
             const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
             const geminiResponse = await ai.models.generateContent({
               model: "gemini-2.5-flash",
               contents: prompt
             });
             const resposta_ia = geminiResponse.text;
             
             // Salva a resposta da IA no BD
             await db.insert(mensagens).values({
               conversaId: chatId,
               remetente: 'ia',
               conteudo: resposta_ia,
               tipo: 'texto'
             });
             
             // TODO: Disparar para a API do Meta WABA real a resposta (via POST /messages)
           } catch (errAi) {
             console.error("Erro no Gemini", errAi);
           }
        }`;

const inject = `        if (isTriagem) {
           try {
             // Utiliza o Motor Completo (Gemini Agent com Ferramentas SGP e Zabbix)
             const agentResult = await processGeminiAgentRun({
                prompt: texto,
                telefone: telefone,
                contexto: \`O cliente se chama \${nome_cliente}. Analise a intenção e resolva com as ferramentas.\`
             });
             
             const resposta_ia = agentResult.resposta || "Vou verificar isso agora mesmo para você.";
             
             // Salva a resposta da IA no BD
             await db.insert(mensagens).values({
               conversaId: chatId,
               remetente: 'ia',
               conteudo: resposta_ia,
               tipo: 'texto'
             });
             
             // Adiciona a "memória do sistema" se uma ferramenta foi invocada
             if (agentResult.tool_executada) {
                await db.insert(mensagens).values({
                  conversaId: chatId,
                  remetente: 'sistema',
                  conteudo: \`[WABA LOG] Ferramenta executada: \${agentResult.tool_executada}\`,
                  tipo: 'interno'
                });
             }
           } catch (errAi) {
             console.error("Erro no Gemini", errAi);
           }
        }`;

code = code.replace(hook, inject);

fs.writeFileSync('server/waba.ts', code);
console.log("Waba triagem patched");
