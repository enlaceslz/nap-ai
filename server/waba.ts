import { db, isDatabaseConnected } from "../src/db/index.js";
import { conversas, mensagens } from "../src/db/schema.js";
import { eq, desc } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import { processGeminiAgentRun } from "./gemini.js";

export function setupWabaRoutes(app: any) {
// --- WhatsApp Cloud API (WABA) Webhook & Endpoints ---
  
  // 1. Verificação do Webhook pela Meta
  app.get("/api/webhooks/waba/incoming", (req, res) => {
    const verify_token = process.env.WABA_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN;
    if (!verify_token) {
      return res.status(500).json({ error: "WABA_VERIFY_TOKEN não configurado no servidor" });
    }
    let mode = req.query["hub.mode"];
    let token = req.query["hub.verify_token"];
    let challenge = req.query["hub.challenge"];
    
    if (mode && token) {
      if (mode === "subscribe" && token === verify_token) {
        console.log("WABA Webhook verificado!");
        return res.status(200).send(challenge);
      } else {
        return res.sendStatus(403);
      }
    }
    return res.status(400).json({ error: "Parâmetros inválidos" });
  });

  // 2. Recebimento de mensagens (Eventos WABA) e Copiloto Gemini (Triagem IA)
  app.post("/api/webhooks/waba/incoming", async (req, res) => {
    try {
      const body = req.body;
      if (!body.entry || !body.entry[0].changes || !body.entry[0].changes[0].value.messages) {
        return res.sendStatus(200); // Outros eventos
      }
      
      const messageData = body.entry[0].changes[0].value.messages[0];
      const wabaMessageId = messageData.id; // Unique ID from Meta
      
      // Idempotency Check (In a real DB, check if wabaMessageId exists)
      // if (await db.query.waba_webhooks.findFirst({ where: eq(waba_webhooks.id, wabaMessageId) })) return res.sendStatus(200);
      console.log(`[WABA Webhook] Processando Mensagem ID: ${wabaMessageId}`);
      const contactData = body.entry[0].changes[0].value.contacts?.[0];
      const telefone = messageData.from;
      const texto = messageData.text?.body || "(Áudio/Mídia Recebida)";
      const nome_cliente = contactData?.profile?.name || "Cliente ERP";
      
      console.log(`[WABA] Msg de ${telefone} (${nome_cliente}): ${texto}`);
      
      // Upsert Conversa
      let chatId = null;
      try {
        let chat = await db.select().from(conversas).where(eq(conversas.telefone, telefone)).limit(1);
        if (chat.length === 0) {
           const newChat = await db.insert(conversas).values({
             telefone,
             nomeCliente: nome_cliente,
             fila: 'triagem_ia',
             statusConexao: '{"uptime":"2 dias", "sinal_onu":"-19.5 dBm", "status":"conectado"}'
           }).returning();
           chatId = newChat[0].id;
        } else {
           chatId = chat[0].id;
           // Atualiza data
           await db.update(conversas).set({ updatedAt: new Date() }).where(eq(conversas.id, chatId));
        }
        
        // Salva a mensagem do cliente
        await db.insert(mensagens).values({
          conversaId: chatId,
          remetente: 'cliente',
          conteudo: texto,
          tipo: messageData.type === 'audio' ? 'audio' : 'texto'
        });
        
        // --- TRIAGEM IA (Gemini Auto-Resposta) ---
        // Se a conversa estiver na fila "triagem_ia", a IA responde.
        let isTriagem = false;
        if(chat.length === 0 || chat[0].fila === 'triagem_ia') isTriagem = true;
        
        if (isTriagem) {
           try {
             // Utiliza o Motor Completo (Gemini Agent com Ferramentas SGP e Zabbix)
             const agentResult: any = await processGeminiAgentRun({
                prompt: texto,
                telefone: telefone,
                contexto: `O cliente se chama ${nome_cliente}. Analise a intenção e resolva com as ferramentas.`
             });
             
             const resposta_ia = agentResult.resposta || "Vou verificar isso agora mesmo para você.";
             
             // Salva a resposta da IA no BD
             await db.insert(mensagens).values({
               conversaId: chatId,
               remetente: 'ia',
               conteudo: resposta_ia,
               tipo: 'texto'
             });
             

             // Adiciona a "memória do sistema" se uma ferramenta foi invocada
             if (agentResult.tool_executada) {
                await db.insert(mensagens).values({
                  conversaId: chatId,
                  remetente: 'sistema',
                  conteudo: `[WABA LOG] Ferramenta executada: ${agentResult.tool_executada}`,
                  tipo: 'interno'
                });

                if (agentResult.handoff) {
                   await db.update(conversas).set({ fila: agentResult.tool_dados?.fila_destino || 'vendas', updatedAt: new Date() }).where(eq(conversas.id, chatId));
                   await db.insert(mensagens).values({
                     conversaId: chatId,
                     remetente: 'sistema',
                     conteudo: `[HANDOFF IA] Transferido para a fila de vendas. Novo Lead Prospect: ${agentResult.tool_dados?.plano_interesse}`,
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
                       contexto_ia: `Handoff automático gerado via Áudio/Texto. Plano desejado: ${agentResult.tool_dados?.plano_interesse}. Endereço: ${agentResult.tool_dados?.endereco}`
                     });
                   } catch (crmErr) {
                     console.error('Erro ao integrar Lead no CRM:', crmErr);
                   }
                }
             }

           } catch (errAi) {
             console.error("Erro no Gemini", errAi);
           }
        }
      } catch (dbErr: any) {
        console.error("[WABA Webhook DB Error] Falha ao persistir mensagem no banco:", dbErr?.message);
      }

      res.status(200).send("EVENT_RECEIVED");
    } catch (e) {
      console.error("[WABA Webhook Error]", e);
      res.sendStatus(500);
    }
  });

  
  // --- Webchat PWA (Cliente -> IA) ---
  app.post("/api/webchat/send", async (req, res) => {
    const { telefone, nome, texto } = req.body;
    
    try {
      const isSolicitacaoHumano = /humano|atendente|pessoa|operador|falar com alguem/i.test(texto);
      let chatId = null;
      let chat = await db.select().from(conversas).where(eq(conversas.telefone, telefone)).limit(1);
      
      if (chat.length === 0) {
        const newChat = await db.insert(conversas).values({
          telefone,
          nomeCliente: nome || "Cliente Webchat",
          fila: isSolicitacaoHumano ? 'handoff' : 'triagem_ia',
          statusConexao: '{"uptime":"2 dias", "sinal_onu":"-19.5 dBm", "status":"conectado"}'
        }).returning();
        chatId = newChat[0].id;
      } else {
        chatId = chat[0].id;
        await db.update(conversas).set({ 
          updatedAt: new Date(),
          fila: isSolicitacaoHumano ? 'handoff' : chat[0].fila
        }).where(eq(conversas.id, chatId));
      }
      
      // Salva mensagem do cliente
      await db.insert(mensagens).values({
        conversaId: chatId,
        remetente: 'cliente',
        conteudo: texto,
        tipo: 'texto'
      });
      
      // Resposta IA ou Transbordo Humano
      let resposta_ia = "";
      if (isSolicitacaoHumano) {
        resposta_ia = `👤 Entendido, ${nome || 'Assinante'}! Estou pausando a automação e transferindo sua solicitação diretamente para nossos operadores humanos no Inbox Unificado. Um atendente estará com você em instantes.`;
      } else {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `Você é a MaIA, assistente de suporte ultra-humanizada e gentil do provedor DJD Telecom. O cliente ${nome} (${telefone}) enviou no Webchat: "${texto}". O sinal da ONU dele está normal (-19.5 dBm). Responda de forma curta, prestativa e em português. Lembre-o que se desejar falar com um humano, basta solicitar a qualquer momento.`;
        
        const geminiResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt
        });
        resposta_ia = geminiResponse.text;
      }
      
      // Salva resposta IA / Sistema
      await db.insert(mensagens).values({
        conversaId: chatId,
        remetente: isSolicitacaoHumano ? 'sistema' : 'ia',
        conteudo: resposta_ia,
        tipo: 'texto'
      });
      
      res.json({ sucesso: true, resposta: resposta_ia, handoff: isSolicitacaoHumano });
      
    } catch (dbErr: any) {
      console.error("[Webchat Error] Falha no processamento do atendimento:", dbErr?.message);
      return res.status(503).json({
        sucesso: false,
        error: "Serviço de atendimento temporariamente indisponível. Tente novamente mais tarde.",
        status: "unavailable"
      });
    }
  });

  // 3. API do Front para Listar Conversas e Mensagens
  
  app.get("/api/waba/chats-full", async (req, res) => {
    try {
      if (!isDatabaseConnected) {
        return res.status(503).json({ error: "Banco de dados indisponível", status: "unavailable", chats: [] });
      }
      const chats = await db.select().from(conversas).orderBy(desc(conversas.updatedAt));
      const fullChats = [];
      for (const c of chats) {
        const chatMsgs = await db.select().from(mensagens).where(eq(mensagens.conversaId, c.id)).orderBy(mensagens.createdAt);
        fullChats.push({
          ...c,
          nome_cliente: c.nomeCliente || 'Desconhecido',
          mensagens: chatMsgs.map((m: any) => ({
            id: m.id,
            conversa_id: m.conversaId || m.conversa_id,
            autor_tipo: m.remetente || m.autorTipo || m.autor_tipo || 'sistema',
            conteudo: m.conteudo,
            enviada_em: m.createdAt ? new Date(m.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : (m.enviadaEm || m.enviada_em || '00:00'),
            status: m.status || 'entregue'
          }))
        });
      }
      return res.json(fullChats);
    } catch (e: any) {
      return res.status(503).json({ error: "Banco de dados indisponível", status: "unavailable", chats: [] });
    }
  });

  app.get("/api/conversas", async (req, res) => {
    try {
      if (!isDatabaseConnected) {
        return res.status(503).json({ success: false, error: 'Banco de dados indisponível.', conversas: [] });
      }
      const chats = await db.select().from(conversas).orderBy(desc(conversas.updatedAt));
      return res.json(chats);
    } catch (e: any) {
      return res.status(503).json({ success: false, error: 'Banco de dados indisponível.', conversas: [] });
    }
  });

  app.get("/api/conversas/:id/mensagens", async (req, res) => {
    try {
      const convId = parseInt(req.params.id);
      if (!isDatabaseConnected) {
        return res.status(503).json({ success: false, error: 'Banco de dados indisponível.', mensagens: [] });
      }
      const msgs = await db.select().from(mensagens).where(eq(mensagens.conversaId, convId)).orderBy(mensagens.createdAt);
      return res.json(msgs);
    } catch (e: any) {
      return res.status(503).json({ success: false, error: 'Banco de dados indisponível.', mensagens: [] });
    }
  });

  // --- WhatsApp Cloud API (WABA) - Gestão de Templates HSM & Validação Meta ---

  const ISP_WABA_APPROVED_TEMPLATES = [
    {
      id: 'fatura_pix_isp',
      name: 'fatura_pix_isp',
      category: 'UTILITY',
      language: 'pt_BR',
      status: 'APPROVED',
      quality_score: 'GREEN',
      components: [
        { type: 'HEADER', format: 'TEXT', text: 'Sua Fatura de Internet Chegou!' },
        {
          type: 'BODY',
          text: 'Olá, {{1}}! Segue a sua fatura deste mês da conexão de fibra óptica.\n\nVocê pode pagar instantaneamente usando o código PIX Copia e Cola abaixo:\n\n{{2}}\n\n*Valor:* {{3}}\n*Vencimento:* {{4}}\n\nAgradecemos por manter sua mensalidade em dia e garantir a velocidade máxima da sua conexão!'
        },
        { type: 'FOOTER', text: 'Provedor de Internet • Atendimento oficial via WABA' },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', text: 'Já efetuei o pagamento' },
            { type: 'URL', text: 'Ver Fatura Completa (PDF)', url: 'https://cliente.djdtelecom.com.br/fatura/{{1}}' }
          ]
        }
      ]
    },
    {
      id: 'aviso_manutencao_fibra',
      name: 'aviso_manutencao_fibra',
      category: 'UTILITY',
      language: 'pt_BR',
      status: 'APPROVED',
      quality_score: 'GREEN',
      components: [
        { type: 'HEADER', format: 'TEXT', text: 'Aviso Importante: Manutenção de Rede' },
        {
          type: 'BODY',
          text: 'Prezado(a) assinante {{1}}, informamos que nossa equipe de engenharia está executando serviços de infraestrutura óptica na região de {{2}}.\n\n*Motivo:* {{3}}\n*Previsão de normalização:* {{4}}\n\nDurante este intervalo, a conexão poderá apresentar instabilidade momentânea. Nossos técnicos já estão no local finalizando os reparos.'
        },
        { type: 'FOOTER', text: 'NOC / Engenharia de Redes' },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', text: 'Acompanhar no Portal' },
            { type: 'QUICK_REPLY', text: 'Falar com Suporte Técnico' }
          ]
        }
      ]
    },
    {
      id: 'confirmacao_visita_tecnica',
      name: 'confirmacao_visita_tecnica',
      category: 'UTILITY',
      language: 'pt_BR',
      status: 'APPROVED',
      quality_score: 'GREEN',
      components: [
        { type: 'HEADER', format: 'TEXT', text: 'Agendamento de Visita Técnica' },
        {
          type: 'BODY',
          text: 'Olá, {{1}}! Sua visita técnica foi agendada com sucesso.\n\n*Serviço:* {{2}}\n*Horário Previsto:* {{3}}\n*Técnico Responsável:* {{4}}\n\nPara sua segurança, todos os nossos técnicos comparecem uniformizados e com crachá de identificação oficial. Por favor, certifique-se de que haverá um maior de 18 anos no local.'
        },
        { type: 'FOOTER', text: 'Central de Operações de Campo' },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', text: 'Confirmar Presença' },
            { type: 'QUICK_REPLY', text: 'Preciso Reagendar' }
          ]
        }
      ]
    },
    {
      id: 'codigo_acesso_portal',
      name: 'codigo_acesso_portal',
      category: 'AUTHENTICATION',
      language: 'pt_BR',
      status: 'APPROVED',
      quality_score: 'GREEN',
      components: [
        {
          type: 'BODY',
          text: 'Seu código de segurança para acessar o Portal do Assinante é {{1}}. Não compartilhe este código com ninguém. Ele expira em 5 minutos.'
        },
        { type: 'FOOTER', text: 'Segurança de Acesso' },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'COPY_CODE', text: 'Copiar Código de Segurança' }
          ]
        }
      ]
    }
  ];

  // Listar templates WABA oficiais
  app.get("/api/waba/templates", (req, res) => {
    res.json({
      success: true,
      count: ISP_WABA_APPROVED_TEMPLATES.length,
      templates: ISP_WABA_APPROVED_TEMPLATES
    });
  });

  // Validador de conformidade com os requisitos da Meta
  app.post("/api/waba/templates/validate", (req, res) => {
    const { name, category, body_text = "", buttons = [] } = req.body;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Regra 1: Nome
    if (!name || !/^[a-z0-9_]+$/.test(name)) {
      errors.push("O nome deve conter apenas caracteres alfanuméricos minúsculos e sublinhados (_).");
    }

    // Regra 2: Variável no início
    if (body_text.trim().startsWith("{{")) {
      errors.push("O corpo não pode iniciar com variável (regra de ouro da Meta). Adicione uma palavra ou saudação antes.");
    }

    // Regra 3: Variável no final
    if (body_text.trim().endsWith("}}")) {
      errors.push("O corpo não pode terminar com variável (regra de ouro da Meta). Adicione pontuação ou texto final.");
    }

    // Regra 4: Variáveis consecutivas
    if (/\{\{\d+\}\}\s*\{\{\d+\}\}/.test(body_text)) {
      errors.push("Variáveis consecutivas (ex: {{1}} {{2}}) são rejeitadas. Insira texto descritivo intermediário.");
    }

    // Regra 5: Encurtadores de link
    const shorteners = ["bit.ly", "tinyurl.com", "t.co", "cutt.ly", "is.gd"];
    if (shorteners.some(s => body_text.toLowerCase().includes(s))) {
      errors.push("Encurtadores de URL são proibidos pela Meta por risco de phishing. Use o domínio institucional.");
    }

    // Regra 6: Opt-out em marketing
    if (category === "MARKETING") {
      const hasOptOut = buttons.some((b: any) =>
        (b.text || "").toLowerCase().includes("cancelar") ||
        (b.text || "").toLowerCase().includes("parar") ||
        (b.text || "").toLowerCase().includes("sair")
      );
      if (!hasOptOut) {
        warnings.push("Modelos de MARKETING devem obrigatoriamente fornecer uma opção explícita de descadastro (Opt-out).");
      }
    }

    const isValid = errors.length === 0;
    res.json({
      valid: isValid,
      score: isValid ? (warnings.length > 0 ? 85 : 100) : 40,
      errors,
      warnings,
      checkedAt: new Date().toISOString()
    });
  });

  // Submeter template para homologação na Meta
  app.post("/api/waba/templates/submit", async (req, res) => {
    const { name, category, language = "pt_BR", components = [] } = req.body;
    const accessToken = process.env.WABA_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN;
    const wabaId = process.env.WABA_BUSINESS_ID || process.env.WABA_ID;

    if (!accessToken || !wabaId) {
      return res.status(400).json({
        success: false,
        error: "WABA_ACCESS_TOKEN ou WABA_BUSINESS_ID não configurados no servidor."
      });
    }

    try {
      const metaRes = await fetch(`https://graph.facebook.com/v19.0/${wabaId}/message_templates`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          category,
          language,
          components
        })
      });
      const data = await metaRes.json();
      if (!metaRes.ok) {
        return res.status(metaRes.status).json({ success: false, error: data.error?.message || "Erro retornado pela Meta API" });
      }
      return res.json({
        success: true,
        id: data.id,
        status: data.status || "PENDING",
        name,
        category,
        language
      });
    } catch (err: any) {
      return res.status(502).json({ success: false, error: err.message });
    }
  });

  // Disparar envio de teste de template
  app.post("/api/waba/templates/send-test", async (req, res) => {
    const { template_name, telefone } = req.body;
    const accessToken = process.env.WABA_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WABA_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
      return res.status(400).json({
        success: false,
        error: "WABA_ACCESS_TOKEN ou WABA_PHONE_NUMBER_ID não configurados no servidor."
      });
    }

    try {
      const metaRes = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: telefone,
          type: "template",
          template: {
            name: template_name,
            language: { code: "pt_BR" }
          }
        })
      });
      const data = await metaRes.json();
      if (!metaRes.ok) {
        return res.status(metaRes.status).json({ success: false, error: data.error?.message || "Erro retornado pela Meta API ao enviar mensagem" });
      }
      return res.json({
        success: true,
        message_id: data.messages?.[0]?.id,
        template: template_name,
        to: telefone,
        status: "sent",
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      return res.status(502).json({ success: false, error: err.message });
    }
  });

  // --- Webhook WhatsApp Cloud API (Meta Oficial) ---
  // 1. Verificação de Handshake da Meta (GET)
  app.get("/api/webhooks/whatsapp", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const EXPECTED_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || process.env.WABA_VERIFY_TOKEN;
    if (!EXPECTED_TOKEN) {
      return res.status(500).json({ error: "Token de verificação WABA não configurado no servidor" });
    }

    if (mode === "subscribe" && token === EXPECTED_TOKEN) {
      console.log("[WABA Webhook] Handshake da Meta verificado com sucesso!");
      return res.status(200).send(challenge);
    }
    return res.status(403).json({ error: "Token de verificação inválido" });
  });

  // 2. Recebimento de Mensagens e Atendimento 24h Lia (POST)
  app.post("/api/webhooks/whatsapp", async (req, res) => {
    try {
      const { entry } = req.body;
      if (!entry || !Array.isArray(entry)) {
        return res.status(200).json({ status: "ignored_not_waba" });
      }

      for (const e of entry) {
        const changes = e.changes || [];
        for (const change of changes) {
          const value = change.value || {};
          const messages = value.messages || [];
          const contacts = value.contacts || [];

          for (const msg of messages) {
            const senderPhone = msg.from;
            const msgText = msg.text?.body || "";
            const contactName = contacts[0]?.profile?.name || "Cliente WhatsApp";

            console.log(`[WABA 24h] Mensagem recebida de ${senderPhone} (${contactName}): "${msgText}"`);

            // Se for pedido de atendente humano, aciona transbordo imediato
            const isSolicitacaoHumano = /humano|atendente|pessoa|operador|falar com alguem/i.test(msgText);

            let respostaIA = "";
            if (isSolicitacaoHumano) {
              respostaIA = `Entendido, ${contactName}! Estou pausando o atendimento automático e transferindo você imediatamente para um de nossos operadores humanos. Um momento, por favor...`;
            } else {
              respostaIA = `Olá, ${contactName}! Sou a MaIA, assistente virtual do DJD Telecom de internet. Recebi sua mensagem: "${msgText}". Como posso te ajudar hoje? Se precisar de suporte na sua fibra, segunda via ou falar com nossa equipe, estou à disposição 24h!`;
            }

            if (isDatabaseConnected) {
              try {
                let [chat] = await db.select().from(conversas).where(eq(conversas.telefone, senderPhone)).limit(1);
                if (!chat) {
                  const [newChat] = await db.insert(conversas).values({
                    telefone: senderPhone,
                    nomeCliente: contactName,
                    fila: isSolicitacaoHumano ? 'handoff' : 'triagem_ia'
                  }).returning();
                  chat = newChat;
                } else if (isSolicitacaoHumano) {
                  await db.update(conversas).set({ fila: 'handoff', updatedAt: new Date() }).where(eq(conversas.id, chat.id));
                }
                if (chat) {
                  await db.insert(mensagens).values([
                    { conversaId: chat.id, remetente: 'cliente', conteudo: msgText, statusEntrega: 'entregue' },
                    { conversaId: chat.id, remetente: isSolicitacaoHumano ? 'sistema' : 'ia', conteudo: respostaIA, statusEntrega: 'entregue' }
                  ]);
                }
              } catch (dbErr: any) {
                console.error("[WABA 24h DB Error] Falha ao persistir evento no banco:", dbErr?.message);
              }
            }
          }
        }
      }

      return res.status(200).json({ status: "success", processed: true });
    } catch (err: any) {
      console.error("[WABA Webhook Error]", err);
      return res.status(200).json({ status: "error", message: err.message });
    }
  });

  
}
