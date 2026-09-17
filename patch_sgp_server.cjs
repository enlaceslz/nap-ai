const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldEndpoint = `  app.get("/api/sgp/busca", async (req, res) => {
    const { q } = req.query;
    
    // Simula tempo de resposta do ERP
    setTimeout(() => {
      if (!q || q.toString().trim() === '') {
        return res.json({ resultados: [] });
      }
      
      // Mock de resultados baseados na busca
      res.json({
        resultados: [
          {
            id: 9982,
            nome: "Maria Oliveira",
            cpf_cnpj: "123.456.789-00",
            status_cliente: "ativo",
            endereco: "Rua das Flores, 123 - Centro",
            conexao: {
              status: "online",
              uptime: "15d 2h 45m",
              ip: "177.45.2.19",
              mac: "AA:BB:CC:DD:EE:FF",
              plano: "Fibra 500MB",
              concentrador: "MikroTik-Core-01"
            },
            faturas: [
              { id: 101, vencimento: "2026-09-10", valor: 99.90, status: "pendente" },
              { id: 102, vencimento: "2026-08-10", valor: 99.90, status: "pago" },
              { id: 103, vencimento: "2026-07-10", valor: 99.90, status: "pago" }
            ]
          }
        ]
      });
    }, 800);
  });`;

const newEndpoint = `  // Workspace 360 do Cliente via SGP
  app.get("/api/sgp/busca", async (req, res) => {
    const { q } = req.query;
    
    // Simula latência
    setTimeout(() => {
      if (!q || q.toString().trim() === '') {
        return res.json({ resultados: [] });
      }
      
      res.json({
        resultados: [
          {
            id: 9982,
            nome: "Maria Oliveira",
            cpf_cnpj: "123.456.789-00",
            status_cliente: "bloqueado_parcial", // Para testar features de cobrança
            endereco: "Rua das Flores, 123 - Centro, São Paulo/SP",
            contato: { telefone: "11999998888", email: "maria.oliveira@email.com" },
            conexao: {
              status: "online",
              uptime: "15d 2h 45m",
              ip: "177.45.2.19",
              mac: "AA:BB:CC:DD:EE:FF",
              plano: "Fibra 500MB",
              concentrador: "MikroTik-Core-01",
              sinal_optico: "-19.5 dBm"
            },
            faturas: [
              { id: 101, vencimento: "2026-09-10", valor: 99.90, status: "atrasado", dias_atraso: 12, linha_digitavel: "00190.00009 00000.000000 00000.000000 1 00000000000000", pix_copia_cola: "00020126580014BR.GOV.BCB.PIX..." },
              { id: 102, vencimento: "2026-08-10", valor: 99.90, status: "pago", dias_atraso: 0 },
              { id: 103, vencimento: "2026-07-10", valor: 99.90, status: "pago", dias_atraso: 0 }
            ],
            planos_disponiveis: [
              { id: "p1", nome: "Fibra 1GB", valor: 149.90, tipo: "upgrade", destaque: true },
              { id: "p2", nome: "Fibra 750MB", valor: 119.90, tipo: "upgrade", destaque: false }
            ],
            chamados_recentes: [
              { id: 4402, data: "2026-08-20", assunto: "Lentidão à noite", status: "resolvido" }
            ],
            metricas: {
              consumo_mes_gb: 450,
              score_pagador: 9.2, // 0 a 10
              tempo_contrato_meses: 24
            }
          }
        ]
      });
    }, 800);
  });`;

if (code.includes('app.get("/api/sgp/busca", async (req, res) => {')) {
  // Regex to replace the function block safely
  const regex = /app\.get\("\/api\/sgp\/busca", async \(req, res\) => \{[\s\S]*?\}\);/m;
  code = code.replace(regex, newEndpoint.trim());
  fs.writeFileSync('server.ts', code);
  console.log('Server SGP mock expanded.');
} else {
  console.log('Could not find endpoint');
}
