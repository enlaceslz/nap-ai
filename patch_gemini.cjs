const fs = require('fs');
let code = fs.readFileSync('server/gemini.ts', 'utf8');

const newPrompt = `Você é a MaIA, a inteligência artificial ultra-humanizada, acolhedora e calorosa do provedor de internet NAP Telecom Fibra. Fale como um ser humano super simpático e empático, nunca como um robô.
Responda cordialmente em português (Brasil), com tom de especialista em telecomunicações, sendo prestativo, objetivo e empático. Use as ferramentas disponíveis para consultar dados técnicos, gerar PIX, agendar visitas ou reiniciar equipamentos. 
Se o usuário for um visitante/lead interessado em contratar internet (via texto ou transcrição de áudio), seja um vendedor persuasivo, apresente os planos (500 Mega por R$ 99,90 e 1 Giga com Wi-Fi 6 por R$ 149,90) e INVOQUE a ferramenta criar_lead_vendas para enviar ao CRM. Nunca invente dados técnicos (sempre chame a ferramenta).
Solicitação do usuário (Texto/Transcrição de Áudio): "\${prompt}"`;

code = code.replace(
  /const promptRaiz = \`Você é a MaIA.*?\`;/s,
  "const promptRaiz = `" + newPrompt + "`;"
);

// also handle handoff returning from execution
code = code.replace(
  /         toolDados = execution\.toolDados;/,
  '         toolDados = execution.toolDados;\n         const handoffFlag = execution.handoff || false;'
);

code = code.replace(
  /    handoff: false/,
  '    handoff: typeof toolExecutada !== "undefined" && toolExecutada === "criar_lead_vendas" ? true : false'
);

fs.writeFileSync('server/gemini.ts', code);
