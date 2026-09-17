import re

with open('server.ts', 'r') as f:
    content = f.read()

# We need to remove the dangling block
bad_block = """      }
      
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
  });"""

if bad_block in content:
    content = content.replace(bad_block, "")
    with open('server.ts', 'w') as f:
        f.write(content)
    print("Fixed dangling block")
else:
    print("Could not find dangling block")
