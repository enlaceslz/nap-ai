const fs = require('fs');
let text = fs.readFileSync('server.ts', 'utf8');

if (!text.includes('setupWabaRoutes(app,')) {
  text = text.replace(
    'import { setupFieldRoutes } from "./server/field/fieldRoutes";',
    'import { setupFieldRoutes } from "./server/field/fieldRoutes";\nimport { setupWabaRoutes } from "./server/waba";'
  );
  
  text = text.replace(
    'setupFieldRoutes(app, { registrarAuditoria });',
    'setupFieldRoutes(app, { registrarAuditoria });\nsetupWabaRoutes(app, mockWabaChats, mockWabaMessages);'
  );
  
  fs.writeFileSync('server.ts', text, 'utf8');
  console.log('Added setupWabaRoutes to server.ts');
} else {
  console.log('setupWabaRoutes already present');
}
