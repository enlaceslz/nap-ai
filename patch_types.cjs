const fs = require('fs');
let code = fs.readFileSync('server/agent/toolRegistry.ts', 'utf8');

code = code.replace(
  /execute: async \(\{ prompt, telefone, contexto, \.\.\.args \}\) => \{/g,
  'execute: async ({ prompt, telefone, contexto, ...args }: any) => {'
);
fs.writeFileSync('server/agent/toolRegistry.ts', code);

let geminiCode = fs.readFileSync('server/gemini.ts', 'utf8');
geminiCode = geminiCode.replace(
  /const handoffFlag = execution\.handoff \|\| false;/g,
  'const handoffFlag = (execution as any).handoff || false;'
);
fs.writeFileSync('server/gemini.ts', geminiCode);
