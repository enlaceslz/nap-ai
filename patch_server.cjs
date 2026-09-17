const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('setupReguaRoutes')) {
  // Insert import
  code = code.replace(
    /import \{ setupCrmRoutes \} from "\.\/server\/crm\/crmRoutes";/,
    'import { setupCrmRoutes } from "./server/crm/crmRoutes";\nimport { setupReguaRoutes } from "./server/marketing/reguaRoutes";'
  );
  
  // Insert initialization
  code = code.replace(
    /setupCrmRoutes\(app, \{ registrarAuditoria \}\);/,
    'setupCrmRoutes(app, { registrarAuditoria });\nsetupReguaRoutes(app, { registrarAuditoria });'
  );

  fs.writeFileSync('server.ts', code);
}
