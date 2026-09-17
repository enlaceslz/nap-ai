const fs = require('fs');
let text = fs.readFileSync('server/zabbix/zabbixRoutes.ts', 'utf8');

// Fix the undefined 'severity' variable inside the trigger POST handler
text = text.replace(
  "if (severity === 'critical') {",
  "if (req.body.severity === 'critical') {"
);

fs.writeFileSync('server/zabbix/zabbixRoutes.ts', text, 'utf8');
console.log('Fixed undefined severity reference in zabbixRoutes');
