const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  'systemInstruction = "Você é um assistente técnico do NAP. Use o seguinte contexto da base de conhecimento BookStack para responder: " + bookstackContext + " Responda de forma curta e empática.";',
  'systemInstruction = (systemConfig.ia?.promptSuporte || "Você é um assistente técnico do NAP.") + "\\n\\n[Base de Conhecimento]: " + bookstackContext;'
);

code = code.replace(
  'systemInstruction = "Você é um consultor de vendas do NAP. Use este contexto do BookStack: " + bookstackContext + " Seja persuasivo, simpático e conciso.";',
  'systemInstruction = (systemConfig.ia?.promptVendas || "Você é um consultor comercial.") + "\\n\\n[Base de Conhecimento]: " + bookstackContext;'
);

code = code.replace(
  'systemInstruction = "Você é um agente de cobrança do NAP. Use este contexto do BookStack: " + bookstackContext + " Seja educado e focado na solução.";',
  'systemInstruction = (systemConfig.ia?.promptCobranca || "Você atua no setor financeiro.") + "\\n\\n[Base de Conhecimento]: " + bookstackContext;'
);

fs.writeFileSync('server.ts', code);
