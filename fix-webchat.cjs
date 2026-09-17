const fs = require('fs');
let code = fs.readFileSync('src/components/WebchatWidget.tsx', 'utf8');

code = code.replace(
`        body: JSON.stringify({ 
          prompt: userMsg,
          clientContext: {
            nome: "Assinante Webchat",
            plano: "Fibra 500MB Simétrico",
            status: "ativo"
          }
        })`,
`        body: JSON.stringify({ 
          prompt: userMsg,
          history: messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'model', parts: [{ text: m.text }] })),
          clientContext: {
            nome: "Assinante Webchat",
            plano: "Fibra 500MB Simétrico",
            status: "ativo"
          }
        })`);

fs.writeFileSync('src/components/WebchatWidget.tsx', code);
