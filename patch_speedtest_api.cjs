const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(`
  // --- SERVIDOR DE TESTE DE VELOCIDADE (SPEEDTEST ISP LOCAL / PTT) ---
  app.post("/api/portal/speedtest", async (req, res) => {
    // Simula cálculo de latência e rota com servidor local de PTT
    await new Promise(r => setTimeout(r, 600));

    // Pequena variação para realismo dinâmico
    const variacaoDown = (Math.random() * 18 - 6);
    const variacaoUp = (Math.random() * 12 - 5);
    const download = +(508.4 + variacaoDown).toFixed(1);
    const upload = +(256.2 + variacaoUp).toFixed(1);
    const ping = +(3.2 + Math.random() * 1.5).toFixed(1);
    const jitter = +(0.6 + Math.random() * 0.5).toFixed(1);`, `
  // --- SERVIDOR DE TESTE DE VELOCIDADE (SPEEDTEST ISP LOCAL / PTT) ---
  app.post("/api/portal/speedtest", async (req, res) => {
    const { velocidade = 500, simetrico = false } = req.body || {};
    // Simula cálculo de latência e rota com servidor local de PTT
    await new Promise(r => setTimeout(r, 600));

    // Pequena variação para realismo dinâmico
    const variacaoDown = (Math.random() * (velocidade * 0.05)) - (velocidade * 0.02);
    const uploadBase = simetrico ? velocidade : velocidade * 0.5;
    const variacaoUp = (Math.random() * (uploadBase * 0.05)) - (uploadBase * 0.02);
    
    const download = +(velocidade + variacaoDown).toFixed(1);
    const upload = +(uploadBase + variacaoUp).toFixed(1);
    const ping = +(3.2 + Math.random() * 1.5).toFixed(1);
    const jitter = +(0.6 + Math.random() * 0.5).toFixed(1);`);

fs.writeFileSync('server.ts', code);
console.log("Speedtest API patched");
