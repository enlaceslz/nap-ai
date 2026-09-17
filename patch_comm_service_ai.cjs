const fs = require('fs');
let text = fs.readFileSync('server/communications/communicationsService.ts', 'utf8');

// 1. Add import
if (!text.includes('NocCopilot')) {
  text = text.replace(
    "import { randomBytes } from 'crypto';",
    "import { randomBytes } from 'crypto';\nimport { NocCopilot } from './nocCopilot';"
  );
}

// 2. Add instance
if (!text.includes('copilot: NocCopilot')) {
  text = text.replace(
    'private gateway: TelegramGateway;',
    'private gateway: TelegramGateway;\n  private copilot: NocCopilot;'
  );
  text = text.replace(
    'this.gateway = TelegramGateway.getInstance();',
    'this.gateway = TelegramGateway.getInstance();\n    this.copilot = new NocCopilot();'
  );
}

// 3. Replace the mock AI response
const mockAiRegex = /\/\/ MOCK AI Response[\s\S]*?\}, 1500\);/m;
const realAiCall = `// AI Gateway & RAG Integration (Fase 6 - PRD #41)
        try {
          const aiResponse = await this.copilot.ask(text, activeUser.napRole, activeUser.napUserId);
          await this.gateway.sendMessage(chatId, aiResponse);
          this.audit("Consulta IA Telegram", \`User perguntou: "\${text}"\`, activeUser.napUserId);
        } catch (e) {
          await this.gateway.sendMessage(chatId, "⚠️ Erro interno no Copilot.");
        }`;

text = text.replace(mockAiRegex, realAiCall);

fs.writeFileSync('server/communications/communicationsService.ts', text, 'utf8');
console.log('Communications Hub now integrated with Gemini NocCopilot');
