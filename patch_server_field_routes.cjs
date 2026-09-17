const fs = require('fs');
let text = fs.readFileSync('server.ts', 'utf8');

if (!text.includes('setupFieldRoutes')) {
  text = text.replace(
    'import { setupCommunicationsRoutes } from "./server/communications/communicationsRoutes";',
    'import { setupCommunicationsRoutes } from "./server/communications/communicationsRoutes";\nimport { setupFieldRoutes } from "./server/field/fieldRoutes";'
  );

  text = text.replace(
    'setupCommunicationsRoutes(app, { registrarAuditoria });',
    'setupCommunicationsRoutes(app, { registrarAuditoria });\nsetupFieldRoutes(app, { registrarAuditoria });'
  );

  fs.writeFileSync('server.ts', text, 'utf8');
  console.log('Field Routes injected into server.ts');
} else {
  console.log('Already patched');
}
