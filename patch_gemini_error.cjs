const fs = require('fs');

const file = 'server/gemini.ts';
let content = fs.readFileSync(file, 'utf8');

const targetCatch = `catch (e: any) {
      console.error("[Gemini] Erro de API (Cota ou Autenticação):", e.message);
      respostaGerada = "[Fallback Offline] Olá! No momento minha inteligência em nuvem está com instabilidade (Possível limite de cota). Sou a MaIA da DJD Telecom, como posso anotar seu recado?";
    }`;

const replacementCatch = `catch (e: any) {
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
    }`;

content = content.replace(targetCatch, replacementCatch);

fs.writeFileSync(file, content);
console.log('Updated gemini.ts with error handler');
