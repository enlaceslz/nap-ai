const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const searchEndpoint = `
  // Busca SGP em tempo real (Operador)
  app.get("/api/sgp/busca", async (req, res) => {
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
  });
`;

code = code.replace(
  'app.get("/api/sgp/ura/cliente", async (req, res) => {',
  searchEndpoint + '\n  app.get("/api/sgp/ura/cliente", async (req, res) => {'
);

fs.writeFileSync('server.ts', code);
console.log('Server SGP search endpoint added.');
