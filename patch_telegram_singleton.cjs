const fs = require('fs');
let text = fs.readFileSync('server/communications/telegramGateway.ts', 'utf8');

if (!text.includes('getInstance()')) {
  text = text.replace(
    'export class TelegramGateway {',
    'export class TelegramGateway {\n  private static instance: TelegramGateway;\n\n  public static getInstance(): TelegramGateway {\n    if (!TelegramGateway.instance) {\n      TelegramGateway.instance = new TelegramGateway();\n    }\n    return TelegramGateway.instance;\n  }\n'
  );
  fs.writeFileSync('server/communications/telegramGateway.ts', text, 'utf8');
  console.log('Added getInstance to TelegramGateway');
} else {
  console.log('getInstance already present');
}
