const fs = require('fs');
let code = fs.readFileSync('src/components/WebchatWidget.tsx', 'utf8');

// Modificar state inicial para visitantes
code = code.replace(`
  // Obter contexto do assinante logado no Portal PWA
  const authData = localStorage.getItem('@nap_client_auth');
  const clientData = authData ? JSON.parse(authData) : { nome: "João Silva", telefone: "5511999998888", contrato: "CTR-2026-8894" };
  const clientNome = clientData.nome || "Assinante";
  const clientTelefone = clientData.telefone || "5511999998888";

  const [messages, setMessages] = useState<{id: number, text: string, sender: 'user' | 'ia' | 'sistema'}[]>([
    { 
      id: 1, 
      text: \`Olá, \${clientNome}! Sou a MaIA, assistente virtual 24h do seu provedor. Posso ajudar com faturas, PIX, teste de conexão ou transferir para um atendente humano a qualquer momento. Como posso ajudar?\`, 
      sender: 'ia' 
    }
  ]);`, `
  // Obter contexto do assinante logado no Portal PWA
  const authData = localStorage.getItem('@nap_client_auth');
  const isProspect = !authData;
  const clientData = authData ? JSON.parse(authData) : { nome: "Visitante", telefone: "PROSPECT-" + Math.floor(Math.random()*10000) };
  const clientNome = isProspect ? "Visitante" : (clientData.nome || "Assinante");
  const clientTelefone = clientData.telefone || "5511999998888";

  const [messages, setMessages] = useState<{id: number, text: string, sender: 'user' | 'ia' | 'sistema'}[]>([
    { 
      id: 1, 
      text: isProspect 
        ? "Olá! Sou a MaIA, assistente virtual da NAP Fibra! Que ótimo ter você por aqui. Quer conhecer nossos planos com Wi-Fi 6 ou precisa falar com a equipe de vendas?" 
        : \`Olá, \${clientNome}! Sou a MaIA, assistente virtual 24h do seu provedor. Posso ajudar com faturas, PIX, teste de conexão ou transferir para um atendente humano a qualquer momento. Como posso ajudar?\`, 
      sender: 'ia' 
    }
  ]);`);

// Mudar sugestões rápidas para visitantes
code = code.replace(`
            {!isHandoff && (
              <button 
                onClick={() => sendQuery("Gostaria de falar com um atendente humano")}
                className="text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-full px-2.5 py-1 transition-all shrink-0 flex items-center gap-1 shadow-2xs"
              >
                <Headphones size={12} className="text-blue-600" /> Falar com Humano
              </button>
            )}
            <button 
              onClick={() => sendQuery("Preciso da 2ª via da fatura e chave PIX")}
              className="text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-full px-2.5 py-1 transition-all shrink-0 shadow-2xs"
            >
              💳 Fatura & PIX
            </button>
            <button 
              onClick={() => sendQuery("Como está o sinal da minha fibra ótica?")}
              className="text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-full px-2.5 py-1 transition-all shrink-0 shadow-2xs"
            >
              📶 Sinal da Fibra
            </button>`, `
            {!isHandoff && (
              <button 
                onClick={() => sendQuery("Gostaria de falar com um atendente humano")}
                className="text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-full px-2.5 py-1 transition-all shrink-0 flex items-center gap-1 shadow-2xs"
              >
                <Headphones size={12} className="text-blue-600" /> Falar com Humano
              </button>
            )}
            {isProspect ? (
              <>
                <button 
                  onClick={() => sendQuery("Quero assinar a NAP Fibra! Tenho interesse.")}
                  className="text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-full px-2.5 py-1 transition-all shrink-0 shadow-2xs"
                >
                  ✨ Quero Assinar
                </button>
                <button 
                  onClick={() => sendQuery("Quais os planos de internet disponíveis?")}
                  className="text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-full px-2.5 py-1 transition-all shrink-0 shadow-2xs"
                >
                  🚀 Ver Planos
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => sendQuery("Preciso da 2ª via da fatura e chave PIX")}
                  className="text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-full px-2.5 py-1 transition-all shrink-0 shadow-2xs"
                >
                  💳 Fatura & PIX
                </button>
                <button 
                  onClick={() => sendQuery("Como está o sinal da minha fibra ótica?")}
                  className="text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-full px-2.5 py-1 transition-all shrink-0 shadow-2xs"
                >
                  📶 Sinal da Fibra
                </button>
              </>
            )}`);

// Endpoint: Se for isProspect, manda para /api/webchat/lead para gerar card no Kanban
code = code.replace(`
      const res = await fetch('/api/webchat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          telefone: clientTelefone,
          nome: clientNome,
          texto
        })
      });`, `
      const endpoint = isProspect ? '/api/webchat/lead' : '/api/webchat/send';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          telefone: clientTelefone,
          nome: clientNome,
          texto,
          mensagem: texto
        })
      });`);

// Tratar a resposta da IA do endpoint lead 
code = code.replace(`
      if (data.handoff) {
        setIsHandoff(true);
      }

      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: data.resposta || 'Recebemos sua mensagem! Nossa equipe já está acompanhando.', 
        sender: data.handoff ? 'sistema' : 'ia' 
      }]);`, `
      if (data.handoff || isProspect) {
        setIsHandoff(true);
      }

      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: data.resposta || (isProspect ? 'Sua solicitação foi encaminhada para a nossa equipe comercial. Em instantes um consultor humano vai assumir o chat!' : 'Recebemos sua mensagem! Nossa equipe já está acompanhando.'), 
        sender: (data.handoff || isProspect) ? 'sistema' : 'ia' 
      }]);`);

fs.writeFileSync('src/components/WebchatWidget.tsx', code);
console.log("WebchatWidget patched");
