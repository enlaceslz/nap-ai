const fs = require('fs');
let text = fs.readFileSync('server/zabbix/zabbixRoutes.ts', 'utf8');

if (!text.includes('/api/communications/telegram/send')) {
  // We simulate fetching from the communications API when Zabbix generates a critical alert
  const telegramDispatchStr = `
      // MOCK: Dispatch via Communications Hub (Fase 4 - NOC PRD)
      if (severity === 'critical') {
         fetch('http://127.0.0.1:3000/api/communications/telegram/send', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             severity: 'critical',
             message: \`[Alerta Zabbix Gerado] \${message}\\nHost: \${problem.host}\\nHora: \${problem.time}\`,
             requiredRoles: ['noc', 'admin', 'engenharia']
           })
         }).catch(() => {});
      }
      `;

  text = text.replace(
    'res.json({ success: true, problem });',
    telegramDispatchStr + '\n      res.json({ success: true, problem });'
  );

  fs.writeFileSync('server/zabbix/zabbixRoutes.ts', text, 'utf8');
  console.log('Zabbix -> Telegram Event Integration Patched');
} else {
  console.log('Already patched');
}
