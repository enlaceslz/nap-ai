import express from 'express';
import { db, isDatabaseConnected } from '../../src/db/index.js';
import { faturas, clientes, mensagens, conversas } from '../../src/db/schema.js';
import { eq, and, lte, gte } from 'drizzle-orm';
import { webPushService } from '../push/webPushService.js';

// Configuração persistente da régua de cobrança
let globalReguaConfig = {
  ativa: false,
  horarioInicio: "08:30",
  horarioFim: "19:30",
  descontoPontualidade: 0.00,
  diasAntesVencimento: 3,
  notificarDiaVencimento: true,
  diasAposVencimentoTolerancia: 3,
  diasAposVencimentoBloqueio: 7,
  canais: {
    whatsapp: true,
    sms: false,
    push: false,
    email: false
  },
  templates: {
    d_menos_3: "Olá, {{nome_cliente}}! 💙 Passando para lembrar que sua fatura de {{plano}} no valor de R$ {{valor_fatura}} vence em 3 dias ({{data_vencimento}}). Pague agora via PIX:\n\n🔑 PIX Copia-e-Cola:\n{{chave_pix}}\n\n📄 2ª Via em PDF: {{link_segunda_via}}",
    d_zero: "Olá, {{nome_cliente}}! 🚀 Sua mensalidade vence HOJE ({{data_vencimento}}). Para manter sua conexão rápida e sem interrupções, pague agora via PIX:\n\n🔑 PIX Copia-e-Cola:\n{{chave_pix}}\n\nPrecisa de 2ª via? Acesse: {{link_segunda_via}}",
    d_mais_3: "Olá, {{nome_cliente}}. Não localizamos o pagamento da sua fatura vencida em {{data_vencimento}}.\n\nCaso precise regularizar, você pode pagar com o PIX abaixo:\n\n🔑 PIX Copia-e-Cola:\n{{chave_pix}}",
    d_mais_7: "⚠️ AVISO URGENTE: Prezado(a) {{nome_cliente}}, sua fatura está com 7 dias de atraso. Evite a suspensão do serviço efetuando o pagamento via PIX:\n\n🔑 PIX:\n{{chave_pix}}"
  },
  estatisticas: {
    totalDisparadosHoje: 0,
    faturasRecuperadasPix: 0,
    valorRecuperadoHoje: 0.00,
    taxaConversaoPix: "0.0%"
  },
  historicoExecucoes: [] as Array<{
    id: string;
    fase: string;
    disparados: number;
    sucesso: number;
    falhas: number;
    data: string;
  }>
};

export const setupReguaRoutes = (app: express.Express, { registrarAuditoria }: any) => {
  const router = express.Router();

  // 1. Obter Parâmetros da Régua de Cobrança
  router.get('/regua', (req, res) => {
    res.json({ success: true, config: globalReguaConfig });
  });

  // 2. Atualizar Parâmetros da Régua de Cobrança
  router.put('/regua', (req, res) => {
    globalReguaConfig = { ...globalReguaConfig, ...req.body };
    if (registrarAuditoria) {
      registrarAuditoria({
        usuario: (req as any).user?.email || "system",
        modulo: "Campanhas ISP",
        acao: "Atualização da Régua de Cobrança",
        detalhes: "Parâmetros operacionais e templates da régua atualizados.",
        categoria: "marketing",
        severidade: "info",
        ip: req.socket?.remoteAddress || req.ip || null,
        userAgent: req.headers["user-agent"] || null
      });
    }
    res.json({ success: true, config: globalReguaConfig });
  });

  // 3. Renderização de Preview ou Teste Real de Template
  router.post('/regua/simular-teste', async (req, res) => {
    const { telefone = "(11) 99999-9999", fase = "d_menos_3", executarEnvioReal = false } = req.body;
    const template = globalReguaConfig.templates[fase as keyof typeof globalReguaConfig.templates] || "";
    
    const mensagemRenderizada = template
      .replace(/{{nome_cliente}}/g, "Cliente Teste")
      .replace(/{{plano}}/g, "Fibra Óptica")
      .replace(/{{valor_fatura}}/g, "99,90")
      .replace(/{{data_vencimento}}/g, new Date().toLocaleDateString('pt-BR'))
      .replace(/{{desconto_pontualidade}}/g, Number(globalReguaConfig.descontoPontualidade || 0).toFixed(2).replace('.', ','))
      .replace(/{{chave_pix}}/g, "00020126580014BR.GOV.BCB.PIX0136pix-cobranca@nap.local520400005303986540599.905802BR5910NAP FIBRA6009SAO PAULO62070503***6304E8A1")
      .replace(/{{link_segunda_via}}/g, "https://isp.provedor.com.br/faturas/exemplo");

    // Se o operador não solicitou disparo de rede, retorna apenas a renderização sem fingir envio
    if (!executarEnvioReal) {
      return res.json({
        success: true,
        previewOnly: true,
        fase,
        mensagemRenderizada,
        mensagem: "Pré-visualização do modelo gerada com sucesso."
      });
    }

    // Se solicitou envio de teste real para o número informado:
    const accessToken = process.env.WABA_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WABA_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
      return res.status(503).json({
        success: false,
        status: "not_configured",
        reason: "WhatsApp WABA credentials missing (WABA_ACCESS_TOKEN e WABA_PHONE_NUMBER_ID não configurados)."
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
          to: telefone.replace(/\D/g, ""),
          type: "text",
          text: { body: mensagemRenderizada }
        })
      });

      const metaData = await metaRes.json();
      if (!metaRes.ok) {
        return res.status(metaRes.status).json({
          success: false,
          status: "failed",
          error: metaData.error?.message || "Erro retornado pela Meta API no envio de teste."
        });
      }

      return res.json({
        success: true,
        status: "sent",
        message_id: metaData.messages?.[0]?.id,
        to: telefone,
        mensagemRenderizada,
        mensagem: `Disparo de teste realizado com sucesso para ${telefone} via WhatsApp Oficial.`
      });
    } catch (err: any) {
      return res.status(502).json({
        success: false,
        status: "failed",
        error: `Falha de rede ao conectar à Meta API: ${err.message}`
      });
    }
  });

  // 4. Executar Disparo em Lote da Régua (REGRA ABSOLUTA: Execução Real ou not_configured)
  router.post('/regua/executar', async (req, res) => {
    const { fase = "d_menos_3" } = req.body;

    const accessToken = process.env.WABA_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WABA_PHONE_NUMBER_ID;

    // Regra Estrita: Se WABA não configurado, assume explicitamente e NUNCA finge sucesso
    if (!accessToken || !phoneNumberId) {
      return res.status(503).json({
        success: false,
        status: "not_configured",
        reason: "WhatsApp WABA credentials missing"
      });
    }

    if (!isDatabaseConnected) {
      return res.status(503).json({
        success: false,
        status: "unavailable",
        reason: "Banco de dados indisponível para consulta de faturas elegíveis."
      });
    }

    try {
      // 1. Buscar faturas reais pendentes no banco
      const pendingFaturas = await db.select().from(faturas).where(eq(faturas.status, 'pendente'));

      if (pendingFaturas.length === 0) {
        return res.json({
          success: true,
          status: "completed",
          fase,
          totalAlvos: 0,
          disparados: 0,
          falhas: 0,
          mensagem: "Nenhuma fatura pendente elegível para a fase selecionada."
        });
      }

      let disparados = 0;
      let falhas = 0;
      const template = globalReguaConfig.templates[fase as keyof typeof globalReguaConfig.templates] || "";

      for (const fatura of pendingFaturas) {
        try {
          // Buscar cliente associado
          const [cliente] = await db.select().from(clientes).where(eq(clientes.id, fatura.clienteId)).limit(1);
          if (!cliente || !cliente.telefone) continue;

          const telefoneLimpo = cliente.telefone.replace(/\D/g, "");
          if (telefoneLimpo.length < 10) continue;

          const textoFinal = template
            .replace(/{{nome_cliente}}/g, cliente.nome)
            .replace(/{{plano}}/g, cliente.plano || "Fibra Óptica")
            .replace(/{{valor_fatura}}/g, Number(fatura.valor || 0).toFixed(2).replace('.', ','))
            .replace(/{{data_vencimento}}/g, fatura.vencimento ? new Date(fatura.vencimento).toLocaleDateString('pt-BR') : 'A vencer')
            .replace(/{{chave_pix}}/g, fatura.pixCopiaECola || 'Chave PIX no boleto bancário')
            .replace(/{{link_segunda_via}}/g, `https://isp.provedor.com.br/faturas/${fatura.id}`);

          // Disparo real via API do WhatsApp / Meta
          const metaRes = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: telefoneLimpo,
              type: "text",
              text: { body: textoFinal }
            })
          });

          const metaData = await metaRes.json();
          if (metaRes.ok && metaData.messages?.[0]?.id) {
            disparados++;
            // Registrar mensagem no histórico real
            try {
              let [chat] = await db.select().from(conversas).where(eq(conversas.telefone, telefoneLimpo)).limit(1);
              if (chat) {
                await db.insert(mensagens).values({
                  conversaId: chat.id,
                  remetente: 'sistema',
                  conteudo: `[Régua de Cobrança - ${fase}] ${textoFinal}`,
                  statusEntrega: 'enviado'
                });
              }
            } catch {}
          } else {
            falhas++;
          }
        } catch {
          falhas++;
        }
      }

      // Atualizar métricas apenas com os números reais
      globalReguaConfig.estatisticas.totalDisparadosHoje += disparados;
      globalReguaConfig.historicoExecucoes.unshift({
        id: `exec-${Date.now()}`,
        fase,
        disparados,
        sucesso: disparados,
        falhas,
        data: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      });

      if (registrarAuditoria) {
        registrarAuditoria({
          usuario: req.headers["x-user-email"] || "sistema",
          modulo: "Campanhas ISP",
          acao: `Execução Régua de Cobrança - ${fase}`,
          detalhes: `Disparo real da régua de cobrança concluído. Disparados com sucesso: ${disparados}, falhas: ${falhas}.`,
          categoria: "marketing",
          severidade: disparados > 0 ? "medio" : "baixo",
          ip: req.ip || null,
          userAgent: req.headers["user-agent"] || "CRON Engine"
        });
      }

      return res.json({
        success: true,
        status: "completed",
        fase,
        totalAlvos: pendingFaturas.length,
        disparados,
        falhas,
        mensagem: `Disparo concluído: ${disparados} mensagens enviadas com sucesso via WABA, ${falhas} falhas registradas.`
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        status: "error",
        error: `Erro interno no processamento da régua: ${err.message}`
      });
    }
  });

  // 5. Status Real do WebPush VAPID
  router.get('/push/status', (req, res) => {
    const isConfigured = webPushService.isConfigured();
    res.json({
      active: isConfigured,
      status: isConfigured ? "configured" : "not_configured",
      subscriptions: webPushService.getSubscriptionsCount(),
      publicKey: webPushService.getPublicKey()
    });
  });

  // 6. Envio Real de WebPush (NUNCA fingir sucesso se não configurado)
  router.post('/push/send', async (req, res) => {
    const { target, title, body, data } = req.body;

    if (!webPushService.isConfigured()) {
      return res.status(503).json({
        sucesso: false,
        status: "not_configured",
        mensagem: "Serviço WebPush VAPID não configurado. Defina VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY."
      });
    }

    if (!target || !title || !body) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Campos obrigatórios: target, title, body."
      });
    }

    const result = await webPushService.sendNotification(target, { title, body, data });
    return res.status(result.sucesso ? 200 : 400).json(result);
  });

  app.use('/api/cobranca', router);
};
