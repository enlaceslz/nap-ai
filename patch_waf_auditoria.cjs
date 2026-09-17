const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const hook = `      nocAlerts.unshift(novoAlerta);
      // Limita a 50 alertas na memória
      if (nocAlerts.length > 50) nocAlerts.pop();`;

const inject = `      nocAlerts.unshift(novoAlerta);
      // Limita a 50 alertas na memória
      if (nocAlerts.length > 50) nocAlerts.pop();

      // Registra na Auditoria Formal
      try {
        if (typeof registrarAuditoria === 'function') {
           registrarAuditoria({
              usuario: 'WAF Automático',
              usuarioRole: 'system',
              modulo: 'Segurança / Firewall',
              acao: 'Bloqueio de IP - Anti-Brute Force',
              detalhes: \`IP \${ip} bloqueado temporariamente por 5 minutos devido ao limite excedido (\${cache.count} reqs/min). \${origemDetalhada}\`,
              categoria: 'seguranca',
              severidade: 'critico',
              status: 'sucesso',
              ip: ip
           });
        }
      } catch (e) { console.error('Erro ao auditar WAF', e); }`;

code = code.replace(hook, inject);

fs.writeFileSync('server.ts', code);
console.log("WAF Auditoria patched");
