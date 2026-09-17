const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const hook = `// --- Módulo TR-069 / GenieACS`;

const newCode = `
  // --- Motor Automático de Cobrança SGP (Daemon) ---
  app.post("/api/erp/cron/regua-cobranca", async (req, res) => {
    console.log("[SGP Daemon] Iniciando Régua de Cobrança e Bloqueio Automático...");
    
    // 1. Simular busca por faturas atrasadas há mais de 15 dias
    const clienteAlvo = mockWabaChats.find(c => c.contato_id === 9985) || mockWabaChats[1] || mockWabaChats[0];
    
    if (clienteAlvo) {
       console.log(\`[SGP Daemon] Cliente inadimplente encontrado: \${clienteAlvo.nome_cliente}\`);
       
       // 2. Disparar bloqueio no Radius / MikroTik (Simulado)
       console.log(\`[MikroTik / Radius] Bloqueio enviado para o PPPoE do cliente \${clienteAlvo.nome_cliente}\`);
       
       // 3. Atualizar status da conexão no Mock
       if (clienteAlvo.status_conexao) {
           clienteAlvo.status_conexao.status = 'alerta';
           clienteAlvo.status_conexao.uptime = '0d 0h 5m'; // Reautenticou na pool de bloqueio
       }
       
       // 4. Criar Card no Kanban de Cobrança
       const novoCard = {
         id: Date.now(),
         titulo: \`Bloqueio (Inadimplência) - \${clienteAlvo.nome_cliente}\`,
         estagio: 'Bloqueado (Corte)',
         pipeline: 'Cobranca',
         contato: clienteAlvo.nome_cliente,
         telefone: clienteAlvo.telefone,
         prioridade: 3,
         createdAt: new Date().toISOString()
       };
       kanbanDeals.unshift(novoCard);
       console.log(\`[SGP Daemon] Card criado no Kanban Financeiro para \${clienteAlvo.nome_cliente}\`);

       // 5. Enviar WABA de Notificação de Corte
       mockWabaMessages.push({
         conversaId: clienteAlvo.id,
         remetente: 'sistema',
         conteudo: \`⚠️ Aviso NAP: Identificamos que a sua fatura de internet encontra-se em atraso, e o seu acesso foi parcialmente bloqueado. Para restaurar imediatamente, realize o pagamento via PIX no seu App do banco ou responda esta mensagem para solicitar o Desbloqueio em Confiança de 24h.\`,
         createdAt: new Date()
       });
       console.log(\`[SGP Daemon] Disparo WABA (Aviso de Corte) executado.\`);
    }

    res.json({ 
       sucesso: true, 
       mensagem: "Régua de Cobrança executada com sucesso. Bloqueios realizados no Radius, Kanban atualizado e WABA disparado." 
    });
  });

  // --- Módulo TR-069 / GenieACS`;

code = code.replace(hook, newCode);
fs.writeFileSync('server.ts', code);
console.log("Billing patched");
