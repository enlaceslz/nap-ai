const fs = require('fs');

// Patch 1: server/communications/communicationsService.ts
let svcText = fs.readFileSync('server/communications/communicationsService.ts', 'utf8');
svcText = svcText.replace(
  /await this\.gateway\.sendMessage\(target\.telegramChatId, msg, buttons\);/,
  'await this.gateway.sendMessage(msg, target.telegramChatId.toString(), "HTML");'
);
fs.writeFileSync('server/communications/communicationsService.ts', svcText, 'utf8');
console.log('Fixed communicationsService.ts');

// Patch 2: src/pages/TecnicoCampo.tsx
let uiText = fs.readFileSync('src/pages/TecnicoCampo.tsx', 'utf8');
uiText = uiText.replace(
  /setOsList\(\[\s*\{\s*id: item\.id\.toString\(\),/g,
  'setOsList([ { horario_agendado: item.data_agendamento || "Hoje", id: item.id.toString(),'
);
uiText = uiText.replace(
  /setSelectedOS\(\{\s*id: item\.id\.toString\(\),/g,
  'setSelectedOS({ horario_agendado: item.data_agendamento || "Hoje", id: item.id.toString(),'
);
fs.writeFileSync('src/pages/TecnicoCampo.tsx', uiText, 'utf8');
console.log('Fixed TecnicoCampo.tsx');
