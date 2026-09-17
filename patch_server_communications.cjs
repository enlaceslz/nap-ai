const fs = require('fs');
let text = fs.readFileSync('server.ts', 'utf8');

if (!text.includes('setupCommunicationsRoutes')) {
  text = text.replace(
    'import { setupGenieacsRoutes } from "./server/genieacs/genieacsRoutes";',
    'import { setupGenieacsRoutes } from "./server/genieacs/genieacsRoutes";\nimport { setupCommunicationsRoutes } from "./server/communications/communicationsRoutes";'
  );

  text = text.replace(
    'setupGenieacsRoutes(app, { registrarAuditoria });',
    'setupGenieacsRoutes(app, { registrarAuditoria });\nsetupCommunicationsRoutes(app, { registrarAuditoria });'
  );

  fs.writeFileSync('server.ts', text, 'utf8');
  console.log('Communications routes injected into server.ts');
} else {
  console.log('Already patched');
}
