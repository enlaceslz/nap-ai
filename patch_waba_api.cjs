const fs = require('fs');
let text = fs.readFileSync('server/waba.ts', 'utf8');

const fullChatsRoute = `
  app.get("/api/waba/chats-full", async (req, res) => {
    try {
      let chats = [];
      try {
        chats = await db.select().from(conversas).orderBy(desc(conversas.updatedAt));
      } catch (e) {
        chats = mockWabaChats;
      }
      
      const fullChats = [];
      for (const c of chats) {
        let chatMsgs = [];
        try {
          chatMsgs = await db.select().from(mensagens).where(eq(mensagens.conversaId, c.id)).orderBy(mensagens.createdAt);
        } catch (e) {
          chatMsgs = mockWabaMessages.filter(m => m.conversaId === c.id);
        }
        
        fullChats.push({
          ...c,
          nome_cliente: c.nomeCliente || c.nome_cliente || 'Desconhecido',
          mensagens: chatMsgs.map(m => ({
            id: m.id,
            conversa_id: m.conversaId || m.conversa_id,
            autor_tipo: m.remetente || m.autorTipo || 'sistema',
            conteudo: m.conteudo,
            enviada_em: m.createdAt ? new Date(m.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : (m.enviadaEm || '00:00'),
            status: m.status || 'entregue'
          }))
        });
      }
      res.json(fullChats);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
`;

if (!text.includes('/api/waba/chats-full')) {
  text = text.replace('app.get("/api/conversas"', fullChatsRoute + '\n  app.get("/api/conversas"');
  fs.writeFileSync('server/waba.ts', text, 'utf8');
  console.log('Added /api/waba/chats-full');
} else {
  console.log('/api/waba/chats-full already exists');
}
