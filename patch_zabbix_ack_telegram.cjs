const fs = require('fs');
let text = fs.readFileSync('server/zabbix/zabbixRoutes.ts', 'utf8');

if (!text.includes('telegram/send') || text.match(/telegram\/send/g).length < 2) {
  const telegramAckStr = `
      // MOCK: Dispatch ACK notification to Hub
      fetch('http://127.0.0.1:3000/api/communications/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          severity: 'info',
          message: \`[Reconhecimento de Falha] O Incidente \${id} foi assumido por \${user}.\\nMensagem: \${message}\`,
          requiredRoles: ['noc', 'admin', 'tecnico']
        })
      }).catch(() => {});
  `;

  text = text.replace(
    'res.json({ success: true, message: \'Alarme reconhecido.\' });',
    telegramAckStr + '\n      res.json({ success: true, message: \'Alarme reconhecido.\' });'
  );

  fs.writeFileSync('server/zabbix/zabbixRoutes.ts', text, 'utf8');
  console.log('Zabbix ACK -> Telegram Integration Patched');
} else {
  console.log('Already patched');
}
