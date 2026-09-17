const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const anchor = '  // Generate Boleto PDF (Real ou Mock)';
const newEndpoints = `  // Ações de Rede (MikroTik / Radius)
  app.post("/api/network/kick-radius/:ip", async (req, res) => {
    const { ip } = req.params;
    // Simula envio de pacote PoD (Packet of Disconnect) porta 3799 para o concentrador
    await new Promise(r => setTimeout(r, 400));
    res.json({ success: true, message: \`Sessão PPPoE (\${ip}) derrubada com sucesso no BNG/MikroTik.\` });
  });

  // Desbloqueio em Confiança SGP
  app.post("/api/sgp/desbloqueio-confianca/:id", async (req, res) => {
    const { id } = req.params;
    // Simula alteração no ERP e liberação no Radius
    await new Promise(r => setTimeout(r, 600));
    res.json({ success: true, message: \`Cliente \${id} desbloqueado por 48 horas.\` });
  });

`;

code = code.replace(anchor, newEndpoints + anchor);
fs.writeFileSync('server.ts', code);
