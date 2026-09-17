const fs = require('fs');
let text = fs.readFileSync('server/zabbix/zabbixRoutes.ts', 'utf8');

// The previous patch failed to match `res.json({ success: true, message: 'Alarme reconhecido.' });` 
// because the actual code for ACK returns `res.json({ success: true, problem });`
// Let's implement the robust Event Driven ACK properly.

if (text.includes('// MOCK: Dispatch ACK notification to Hub')) {
  console.log('ACK already patched (or partially patched)');
} else {
  const ackDispatchCode = `
      // MOCK: Dispatch ACK notification to Hub (Fase 4 - NOC PRD)
      if (problem) {
         fetch('http://127.0.0.1:3000/api/communications/telegram/send', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             severity: 'info',
             message: \`✅ [ACK NOC] O Incidente \${id} no host \${problem.host} foi reconhecido por \${author}.\\nNota Técnica: \${message}\`,
             requiredRoles: ['noc', 'admin', 'tecnico', 'engenharia']
           })
         }).catch(() => {});
      }
      res.json({ success: true, problem });
  `;

  // We find the ACK block which ends with `res.json({ success: true, problem });` and inject before it.
  // Be careful not to replace all instances, just the one inside router.post('/ack', ...)
  
  // A safer regex replace for the ACK response:
  text = text.replace(/res\.json\(\{\s*success:\s*true,\s*problem\s*\}\);/g, (match, offset, fullText) => {
    // Only replace if it's near the ACK audit log
    if (fullText.substring(offset - 200, offset).includes('Reconhecimento de Alarme (ACK)')) {
       return ackDispatchCode;
    }
    return match;
  });

  fs.writeFileSync('server/zabbix/zabbixRoutes.ts', text, 'utf8');
  console.log('Zabbix ACK -> Hub Integration properly applied');
}
