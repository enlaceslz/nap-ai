import { db } from "../src/db/index.js";
import { atendimentos, conversas, mensagens } from "../src/db/schema.js";
import { eq } from "drizzle-orm";

export function setupKanbanWaba(app: any, mockWabaChats: any[], mockWabaMessages: any[]) {
  app.post("/api/deals/:id/waba-trigger", async (req: any, res: any) => {
    const id = parseInt(req.params.id);
    const { estagio } = req.body;
    
    // Find the deal in db or mock
    let dealName = "Lead";
    let dealPhone = "5511999999999";
    
    try {
      const deals = await db.select().from(atendimentos).where(eq(atendimentos.id, id));
      if (deals.length > 0) {
        dealName = deals[0].contato || dealName;
        dealPhone = deals[0].telefone || dealPhone;
      }
    } catch(e) {
      // ignore
    }

    let templateMensagem = "";
    if (estagio === "Fechado/Ganho") {
      templateMensagem = `🚀 Olá ${dealName}! Seu contrato foi gerado com sucesso no SGP. Segue o link para assinatura digital e pagamento da taxa de adesão: https://nap.com.br/assinar`;
    } else if (estagio === "Qualificado (IA)") {
      templateMensagem = `✅ Olá ${dealName}! Verificamos que há viabilidade de Fibra Óptica 100% no seu endereço. Posso agendar a sua instalação para amanhã?`;
    } else if (estagio === "Técnico em Rota") {
      templateMensagem = `📍 Olá ${dealName}! O técnico já está a caminho do seu endereço e deve chegar em até 30 minutos.`;
    } else {
      templateMensagem = `Notificação do sistema: Seu atendimento avançou para a fase ${estagio}.`;
    }

    // Save to WABA mock or DB
    let chat = mockWabaChats.find((c: any) => c.telefone === dealPhone);
    if (!chat) {
       chat = { id: Date.now(), telefone: dealPhone, nome_cliente: dealName, fila: 'Atendimento' };
       mockWabaChats.push(chat);
    }
    
    mockWabaMessages.push({
      conversaId: chat.id,
      remetente: 'sistema',
      conteudo: templateMensagem,
      createdAt: new Date()
    });

    console.log(`[Kanban Automation] Disparo WABA realizado para ${dealPhone}: ${templateMensagem}`);
    
    // Auto-disparo de Push Notification para Operadores se for Fechado/Ganho (Gamification)
    if (estagio === "Fechado/Ganho") {
      try {
        await fetch(`http://127.0.0.1:${process.env.PORT || 3000}/api/push/operator/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             titulo: "🎉 Nova Venda Fechada!",
             mensagem: `O lead ${dealName} acabou de assinar o contrato! Meta alcançada.`,
             tipo: "vendas",
             url: "/admin/crm"
          })
        });
        console.log(`[Kanban Automation] Push Notification disparado para Operadores.`);
      } catch (err) {
        console.log(`[Kanban Automation] Erro no Push Notification para operadores:`, err);
      }
    }

    return res.json({ sucesso: true, mensagem: templateMensagem });
  });

  app.post("/api/waba/handoff", async (req: any, res: any) => {
    const { chatId, nome, telefone, pipeline, pilar } = req.body;
    console.log(`[Handoff WABA ↔ ERP] Iniciando handoff para chatId ${chatId} (${nome})`);

    // 1. Notificar via WhatsApp (WABA mock)
    mockWabaMessages.push({
      conversaId: chatId,
      remetente: 'sistema',
      conteudo: `🤖 Olá! Sua conversa foi transferida. Em instantes um de nossos operadores humanos continuará o seu atendimento.`,
      createdAt: new Date()
    });

    // 2. Criar ou Atualizar no Kanban SGP (Mock Deal)
    // We send back a mock deal payload so the frontend can display/notify
    const novoDeal = {
      id: Date.now(),
      titulo: `Handoff WABA - ${nome}`,
      estagio: 'Em Atendimento',
      pipeline: pipeline || (pilar === 'vendas' ? 'Vendas' : pilar === 'cobranca' ? 'Cobranca' : 'Suporte'),
      contato: nome,
      telefone: telefone || 'WABA',
      plano: 'SGP Cliente Base',
      prioridade: 2,
      criado_em: "Agora (Handoff WABA)",
      contexto_ia: `Handoff gerado automaticamente após a MaIA ser pausada. Cliente aguardando o humano.`
    };
    
    console.log(`[Handoff WABA ↔ ERP] Deal (Card Kanban) integrado com sucesso ao SGP:`, novoDeal.titulo);

    // TODO: Ideally we'd push to kanbanDeals, but we can just return it to the frontend
    // or rely on a unified state if we had access to kanbanDeals array here.
    // For now, we return it.

    return res.json({ 
      sucesso: true, 
      mensagem: "Handoff sincronizado com sucesso",
      dealGerado: novoDeal
    });
  });
}
