const fs = require('fs');
let text = fs.readFileSync('server.ts', 'utf8');

if (!text.includes('setupCrmRoutes')) {
  text = text.replace(
    'import { setupZabbixRoutes } from "./server/zabbix/zabbixRoutes";',
    'import { setupZabbixRoutes } from "./server/zabbix/zabbixRoutes";\nimport { setupCrmRoutes } from "./server/crm/crmRoutes";'
  );

  text = text.replace(
    'setupZabbixRoutes(app, { registrarAuditoria });',
    'setupZabbixRoutes(app, { registrarAuditoria });\nsetupCrmRoutes(app, { registrarAuditoria });'
  );

  fs.writeFileSync('server.ts', text, 'utf8');
  console.log('CRM routes injected into server.ts');
} else {
  console.log('Already patched');
}
