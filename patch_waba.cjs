const fs = require('fs');
let code = fs.readFileSync('server/waba.ts', 'utf8');

const handoffLogic = `
             // Adiciona a "memória do sistema" se uma ferramenta foi invocada
             if (agentResult.tool_executada) {
                await db.insert(mensagens).values({
                  conversaId: chatId,
                  remetente: 'sistema',
                  conteudo: \`[WABA LOG] Ferramenta executada: \${agentResult.tool_executada}\`,
                  tipo: 'interno'
                });

                if (agentResult.handoff) {
                   await db.update(conversas).set({ fila: agentResult.tool_dados?.fila_destino || 'vendas', updatedAt: new Date() }).where(eq(conversas.id, chatId));
                   await db.insert(mensagens).values({
                     conversaId: chatId,
                     remetente: 'sistema',
                     conteudo: \`[HANDOFF IA] Transferido para a fila de vendas. Novo Lead Prospect: \${agentResult.tool_dados?.plano_interesse}\`,
                     tipo: 'interno'
                   });

                   try {
                     const { CrmService } = require('./crm/crmService');
                     const crmService = CrmService.getInstance();
                     await crmService.addDeal({
                       titulo: agentResult.tool_dados?.titulo || 'Novo Lead Handoff IA',
                       contato: agentResult.tool_dados?.contato || nome_cliente,
                       telefone: agentResult.tool_dados?.telefone || telefone,
                       estagio: 'Nova Oportunidade',
                       pipeline: 'Vendas',
                       prioridade: 1,
                       valor: agentResult.tool_dados?.plano_interesse?.includes('1 Giga') ? 149.9 : 99.9,
                       contexto_ia: \`Handoff automático gerado via Áudio/Texto. Plano desejado: \${agentResult.tool_dados?.plano_interesse}. Endereço: \${agentResult.tool_dados?.endereco}\`
                     });
                   } catch (crmErr) {
                     console.error('Erro ao integrar Lead no CRM:', crmErr);
                   }
                }
             }
`;

code = code.replace(
  /             \/\/ Adiciona a "memória do sistema" se uma ferramenta foi invocada\n             if \(agentResult\.tool_executada\) \{\n                await db\.insert\(mensagens\)\.values\(\{\n                  conversaId: chatId,\n                  remetente: 'sistema',\n                  conteudo: \`\[WABA LOG\] Ferramenta executada: \$\{agentResult\.tool_executada\}\`,\n                  tipo: 'interno'\n                \}\);\n             \}/g,
  handoffLogic
);

fs.writeFileSync('server/waba.ts', code);
