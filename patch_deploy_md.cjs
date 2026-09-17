const fs = require('fs');
let text = fs.readFileSync('DEPLOY.md', 'utf8');

const additionalEnv = `
  - \`TELEGRAM_BOT_TOKEN\`: Token do bot do Telegram gerado no BotFather para o Communications Hub.
  - \`GEMINI_API_KEY\`: Chave da API do Google GenAI para orquestração de IA, voz, Copilot NOC e Agent Functions.`;

text = text.replace(
  '- `GEMINI_API_KEY`: Chave da API do Google GenAI para orquestração de IA e voz.',
  additionalEnv
);

fs.writeFileSync('DEPLOY.md', text, 'utf8');
console.log('DEPLOY.md updated.');
