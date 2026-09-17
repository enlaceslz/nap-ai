const fs = require('fs');

const file = 'server/waba.ts';
let content = fs.readFileSync(file, 'utf8');

const targetWaba = `const agentResult = await processGeminiAgentRun({
                prompt: texto,
                telefone: telefone,
                contexto: \`O cliente se chama \${nome_cliente}. Analise a intenção e resolva com as ferramentas.\`
             });
             
             let respostaDefinitiva = agentResult.resposta;`;

const replacementWaba = `const agentResult = await processGeminiAgentRun({
                prompt: texto,
                telefone: telefone,
                contexto: \`O cliente se chama \${nome_cliente}. Analise a intenção e resolva com as ferramentas.\`
             });
             
             let respostaDefinitiva = agentResult.resposta;
             
             // Detecta se a IA falhou por cota (Resource Exhausted)
             if (agentResult.toolExecutada === "QUOTA_EXHAUSTED") {
                 // Força o transbordo para a fila de atendimento humano
                 try {
                     await db.update(conversas)
                         .set({ fila: 'atendimento_humano', unread: 1 })
                         .where(eq(conversas.telefone, telefone));
                         
                     // Simula uma notificação de sistema para o operador no painel
                     // usando a mesma tabela de mensagens, mas com uma flag de erro interno.
                     const erroMsg = \`[SISTEMA - ALERTA CRÍTICO] A cota da API da Inteligência Artificial (Gemini) foi atingida (Resource Exhausted 429). O cliente foi transferido automaticamente para esta fila humana. Se você for o Administrador, ative a chave do 9router na aba Inteligência Artificial em Configurações para realizar o bypass.\`;
                     await db.insert(mensagens).values({
                         conversaId: chat[0]?.id || 1,
                         remetente: 'sistema',
                         texto: erroMsg,
                         timestamp: new Date().toISOString(),
                         status: 'sent'
                     });
                 } catch(err) {
                     console.error("Erro ao transferir cliente por cota", err);
                 }
             }`;

// Only patch if we haven't already
if (!content.includes("QUOTA_EXHAUSTED")) {
    content = content.replace(targetWaba, replacementWaba);
    fs.writeFileSync(file, content);
    console.log('Updated waba.ts with handoff logic');
}
