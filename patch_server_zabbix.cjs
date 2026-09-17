const fs = require('fs');
let text = fs.readFileSync('server.ts', 'utf8');

if (!text.includes('setupZabbixRoutes')) {
  text = text.replace(
    'import aiRoutes from "./server/ai/aiRoutes";',
    'import aiRoutes from "./server/ai/aiRoutes";\nimport { setupZabbixRoutes } from "./server/zabbix/zabbixRoutes";'
  );

  text = text.replace(
    'setupOltRoutes(app, { registrarAuditoria });',
    'setupOltRoutes(app, { registrarAuditoria });\nsetupZabbixRoutes(app, { registrarAuditoria });'
  );

  fs.writeFileSync('server.ts', text, 'utf8');
  console.log('Zabbix routes injected');
} else {
  console.log('Already patched');
}
