const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const n8nEndpoint = `
  // n8n Webhook Proxy (Execução de Automações)
  app.post("/api/n8n/webhook/:webhookId", async (req, res) => {
    const { webhookId } = req.params;
    const payload = req.body;
    
    console.log(\`[n8n Proxy] Triggering webhook \${webhookId} with payload:\`, payload);
    
    // Simula a latência de comunicação com a instância externa do n8n
    setTimeout(() => {
      res.json({
        success: true,
        message: \`Webhook \${webhookId} disparado com sucesso no n8n.\`,
        execution_id: "exec_" + Math.random().toString(36).substring(2, 9),
        delivered_payload: payload
      });
    }, 1200);
  });
`;

if (!code.includes('/api/n8n/webhook/:webhookId')) {
  code = code.replace(
    'app.get("/api/sgp/ura/cliente", async (req, res) => {',
    n8nEndpoint + '\n  app.get("/api/sgp/ura/cliente", async (req, res) => {'
  );
  fs.writeFileSync('server.ts', code);
  console.log('Server n8n webhook proxy added.');
} else {
  console.log('n8n proxy already exists.');
}
