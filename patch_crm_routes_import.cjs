const fs = require('fs');
let text = fs.readFileSync('server/crm/crmRoutes.ts', 'utf8');

text = text.replace(
  "import { registrarAuditoria } from '../../src/lib/audit';",
  "// No direct import needed, we use dependency injection from server.ts"
);

fs.writeFileSync('server/crm/crmRoutes.ts', text, 'utf8');
console.log('Fixed audit import in crmRoutes');
