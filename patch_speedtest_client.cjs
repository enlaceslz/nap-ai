const fs = require('fs');
let code = fs.readFileSync('src/components/PortalSpeedtestModal.tsx', 'utf8');

code = code.replace(`
    // 4. Obter payload completo do backend
    try {
      const res = await fetch('/api/portal/speedtest', { method: 'POST' });`, `
    // 4. Obter payload completo do backend
    try {
      const res = await fetch('/api/portal/speedtest', { 
         method: 'POST', 
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ 
           velocidade: velocidadeNominal,
           simetrico: planoNome.toLowerCase().includes('simétrico') || planoNome.toLowerCase().includes('simetrico')
         })
      });`);

fs.writeFileSync('src/components/PortalSpeedtestModal.tsx', code);
console.log("Speedtest Client patched");
