const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const hook = `// --- Motor Automático de Cobrança SGP (Daemon) ---`;

const endpoint = `
  // --- Integração Webchat (Captação de Novos Leads via PWA Login / Landing) ---
  app.post("/api/webchat/lead", (req, res) => {
    const { nome, telefone, mensagem } = req.body;
    
    // 1. Criar Chat na Caixa de Entrada Unificada (Inbox - Triagem IA)
    const newChatId = Date.now();
    const newLeadChat = {
       id: newChatId,
       canal: 'webchat',
       contato_id: newChatId,
       nome_cliente: nome || 'Lead PWA (Não Identificado)',
       telefone: telefone || 'Webchat Anônimo',
       status_conexao: null,
       status: 'fila',
       etiqueta: 'Vendas - Novo Lead',
       responsavel: 'Triagem IA',
       foto: 'https://api.dicebear.com/7.x/initials/svg?seed=Lead',
       cpf: 'Não informado',
       dataInicio: new Date().toISOString()
    };
    mockWabaChats.unshift(newLeadChat);

    // 2. Criar a primeira mensagem do Lead no Chat
    mockWabaMessages.push({
       conversaId: newChatId,
       remetente: 'cliente',
       conteudo: mensagem || "Olá, quero assinar a internet de vocês.",
       createdAt: new Date()
    });
    
    // Auto-resposta imediata da IA (MaIA) para o Webchat
    mockWabaMessages.push({
       conversaId: newChatId,
       remetente: 'sistema',
       conteudo: "Olá! Sou a MaIA, assistente virtual. Que ótimo que você quer ser nosso cliente! Já encaminhei sua solicitação para a nossa equipe comercial. Em instantes um consultor humano vai falar com você por aqui mesmo. Qual o seu CEP, por favor, para consultarmos a viabilidade?",
       createdAt: new Date()
    });

    // 3. Criar Card no Kanban de Vendas
    const novoCard = {
       id: Date.now() + 1,
       titulo: \`Lead Webchat - \${nome || 'Novo Assinante'}\`,
       estagio: 'Novo Lead',
       pipeline: 'Vendas',
       contato: nome || 'Lead PWA',
       telefone: telefone || 'Webchat',
       endereco: 'CEP a confirmar',
       plano: 'Interesse: Fibra Turbo',
       prioridade: 1, // Alta prioridade para vendas!
       criado_em: "Agora (Webchat)",
       contexto_ia: \`O lead entrou em contato pelo PWA (Tela Inicial). Mensagem: "\${mensagem}"\`
    };
    kanbanDeals.unshift(novoCard);
    
    console.log(\`[Webchat] Novo Lead Recebido! Chat criado (ID: \${newChatId}) e Kanban Atualizado.\`);

    res.json({ success: true, message: "Lead recebido e integrado ao Inbox/Kanban com sucesso.", chat_id: newChatId });
  });

  // --- Motor Automático de Cobrança SGP (Daemon) ---`;

code = code.replace(hook, endpoint);
fs.writeFileSync('server.ts', code);
console.log("Endpoint patched");
