const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regexKick = /app\.post\("\/api\/network\/kick-radius\/:ip", async \(req, res\) => {[\s\S]*?}\);/g;
const regexUnlock = /app\.post\("\/api\/erp\/desbloqueio-confianca\/:id", async \(req, res\) => {[\s\S]*?}\);/g;

const newKick = `app.post("/api/network/kick-radius/:ip", async (req, res) => {
    const { ip } = req.params;
    // Simula envio de pacote PoD (Packet of Disconnect) porta 3799 para o concentrador
    await new Promise(r => setTimeout(r, 400));
    console.log(\`[MikroTik / Radius] Disconnect (PoD) enviado para IP \${ip}\`);
    res.json({ success: true, message: \`Sessão PPPoE (\${ip}) derrubada com sucesso no BNG/MikroTik.\` });
  });`;

const newUnlock = `app.post("/api/erp/desbloqueio-confianca/:id", async (req, res) => {
    const { id } = req.params;
    // Localizar no ERP Mock
    const clienteId = Number(id);
    let telefone = "5511999999999";
    let nome = "Cliente";
    
    // Simula alteração no ERP e liberação no Radius
    await new Promise(r => setTimeout(r, 600));
    
    console.log(\`[SGP ERP] Cliente \${id} liberado no Radius por 24 horas (Desbloqueio em Confiança).\`);

    // Atualiza status no WABA Mock
    let chat = mockWabaChats.find(c => c.contato_id === clienteId || c.id === clienteId);
    if (chat) {
       telefone = chat.telefone || telefone;
       nome = chat.nome_cliente || nome;
       
       const msgId = Date.now();
       mockWabaMessages.push({
         conversaId: chat.id,
         remetente: 'sistema',
         conteudo: \`🔓 Olá \${nome}! O seu Desbloqueio em Confiança foi ativado com sucesso no SGP. A sua conexão com a internet já foi restabelecida. Lembre-se de realizar o pagamento da fatura em até 24 horas para evitar um novo bloqueio no MikroTik.\`,
         createdAt: new Date()
       });
       console.log(\`[WABA Bot] Notificação de Desbloqueio enviada para \${telefone}\`);
    }

    res.json({ success: true, message: \`Cliente \${id} desbloqueado por 24 horas.\` });
  });`;

if (code.match(regexKick)) code = code.replace(regexKick, newKick);
if (code.match(regexUnlock)) code = code.replace(regexUnlock, newUnlock);

fs.writeFileSync('server.ts', code);
console.log("ERP Patched");
