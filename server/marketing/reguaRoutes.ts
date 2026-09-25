import express from 'express';
import fs from 'fs';
import path from 'path';
import { db, isDatabaseConnected } from '../../src/db/index';
import { faturas, clientes, mensagens, conversas, regua_execucoes, regua_disparos, users, push_subscriptions } from '../../src/db/schema';
import { eq, and, desc, sql, gte } from 'drizzle-orm';
import { webPushService } from '../push/webPushService';
import { requireAuth } from '../auth/rbacMiddleware';

const REGUA_CONFIG_PATH = path.resolve(process.cwd(), 'data', 'regua_config.json');

// Configuração estática padrão da régua de cobrança (Sem dados voláteis ou operacionais)
// BLOQUEADOR P1 V10: Estado operacional (execuções, disparos, estatísticas) reside 100% no PostgreSQL
interface ReguaStaticConfig {
  ativa: boolean;
  horarioInicio: string;
  horarioFim: string;
  descontoPontualidade: number;
  diasAntesVencimento: number;
  notificarDiaVencimento: boolean;
  diasAposVencimentoTolerancia: number;
  diasAposVencimentoBloqueio: number;
  canais: {
    whatsapp: boolean;
    sms: boolean;
    push: boolean;
    email: boolean;
  };
  templates: {
    d_menos_3: string;
    d_zero: string;
    d_mais_3: string;
    d_mais_7: string;
  };
}

const defaultReguaConfig: ReguaStaticConfig = {
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
  }
};

function loadReguaConfig(): ReguaStaticConfig {
  try {
    if (fs.existsSync(REGUA_CONFIG_PATH)) {
      const raw = fs.readFileSync(REGUA_CONFIG_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      // Extrai estritamente as propriedades estáticas válidas, descartando resquícios operacionais legados
      const { estatisticas, historicoExecucoes, ...pureConfig } = parsed;
      return { ...defaultReguaConfig, ...pureConfig };
    }
  } catch (err: any) {
    console.warn('[Régua Cobrança] Falha ao carregar data/regua_config.json, usando padrão:', err.message);
  }
  return { ...defaultReguaConfig };
}

function persistReguaConfig(config: ReguaStaticConfig): void {
  try {
    const dir = path.dirname(REGUA_CONFIG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    // Salva estritamente a configuração sem misturar dados operacionais
    const { ...pureConfig } = config;
    delete (pureConfig as any).estatisticas;
    delete (pureConfig as any).historicoExecucoes;
    fs.writeFileSync(REGUA_CONFIG_PATH, JSON.stringify(pureConfig, null, 2), 'utf-8');
  } catch (err: any) {
    console.warn('[Régua Cobrança] Falha ao persistir data/regua_config.json:', err.message);
  }
}

let globalReguaConfig = loadReguaConfig();

export const setupReguaRoutes = (app: express.Express, { registrarAuditoria }: any = {}) => {
  const router = express.Router();

  // 1. Obter Parâmetros da Régua de Cobrança (Configuração do arquivo + Estado Operacional 100% PostgreSQL)
  // BLOQUEADOR CRÍTICO V9: Eliminação de fallback operacional em memória. Se PostgreSQL indisponível -> 503 OPERATIONAL_DATA_UNAVAILABLE
  router.get('/regua', async (req, res) => {
    if (!isDatabaseConnected) {
      return res.status(503).json({
        success: false,
        status: "unavailable",
        code: "OPERATIONAL_DATA_UNAVAILABLE",
        erro: "Banco de dados PostgreSQL indisponível. Dados operacionais, execuções e estatísticas da régua não podem ser carregados."
      });
    }

    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const execRows = await db.select().from(regua_execucoes)
        .orderBy(desc(regua_execucoes.iniciadoEm))
        .limit(20);

      const historicoPostgres = execRows.map(e => ({
        id: `exec-${e.id}`,
        fase: e.fase,
        disparados: e.disparados,
        sucesso: e.sucesso,
        falhas: e.falhas,
        data: e.iniciadoEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      }));

      const dispHoje = await db.select({ count: sql<number>`count(*)` })
        .from(regua_disparos)
        .where(and(eq(regua_disparos.status, 'enviado'), gte(regua_disparos.disparadoEm, startOfDay)));

      const totalHoje = Number(dispHoje[0]?.count || 0);

      const pagasHoje = await db.select({
        count: sql<number>`count(*)`,
        total: sql<number>`COALESCE(SUM(CAST(${faturas.valor} AS numeric)), 0)`
      }).from(faturas).where(and(eq(faturas.status, 'paga'), gte(faturas.dataPagamento, startOfDay)));

      const faturasRecup = Number(pagasHoje[0]?.count || 0);
      const valorRecup = Number(pagasHoje[0]?.total || 0);
      const taxaConv = totalHoje > 0 ? `${((faturasRecup / totalHoje) * 100).toFixed(1)}%` : "0.0%";

      const estatisticasPostgres = {
        totalDisparadosHoje: totalHoje,
        faturasRecuperadasPix: faturasRecup,
        valorRecuperadoHoje: valorRecup,
        taxaConversaoPix: taxaConv
      };

      res.json({
        success: true,
        config: {
          ...globalReguaConfig,
          estatisticas: estatisticasPostgres,
          historicoExecucoes: historicoPostgres
        }
      });
    } catch (err: any) {
      console.warn('[Régua Cobrança] Erro ao carregar dados operacionais do PostgreSQL:', err.message);
      return res.status(503).json({
        success: false,
        status: "unavailable",
        code: "OPERATIONAL_DATA_UNAVAILABLE",
        erro: `Falha na consulta ao banco de dados PostgreSQL: ${err.message}`
      });
    }
  });

  // 2. Atualizar Parâmetros da Régua de Cobrança
  router.put('/regua', requireAuth, (req, res) => {
    const { ativa, horarioInicio, horarioFim, descontoPontualidade, diasAntesVencimento, notificarDiaVencimento, diasAposVencimentoTolerancia, diasAposVencimentoBloqueio, canais, templates } = req.body;
    
    if (typeof ativa === 'boolean') globalReguaConfig.ativa = ativa;
    if (horarioInicio) globalReguaConfig.horarioInicio = horarioInicio;
    if (horarioFim) globalReguaConfig.horarioFim = horarioFim;
    if (descontoPontualidade !== undefined) globalReguaConfig.descontoPontualidade = Number(descontoPontualidade);
    if (diasAntesVencimento !== undefined) globalReguaConfig.diasAntesVencimento = Number(diasAntesVencimento);
    if (typeof notificarDiaVencimento === 'boolean') globalReguaConfig.notificarDiaVencimento = notificarDiaVencimento;
    if (diasAposVencimentoTolerancia !== undefined) globalReguaConfig.diasAposVencimentoTolerancia = Number(diasAposVencimentoTolerancia);
    if (diasAposVencimentoBloqueio !== undefined) globalReguaConfig.diasAposVencimentoBloqueio = Number(diasAposVencimentoBloqueio);
    if (canais) globalReguaConfig.canais = { ...globalReguaConfig.canais, ...canais };
    if (templates) globalReguaConfig.templates = { ...globalReguaConfig.templates, ...templates };

    persistReguaConfig(globalReguaConfig);

    if (registrarAuditoria) {
      registrarAuditoria({
        usuario: (req as any).user?.email || "system",
        modulo: "Campanhas ISP",
        acao: "Atualização da Régua de Cobrança",
        detalhes: "Parâmetros operacionais e templates da régua atualizados e persistidos.",
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
    const { telefone = "", fase = "d_menos_3", executarEnvioReal = false } = req.body;
    const template = globalReguaConfig.templates[fase as keyof typeof globalReguaConfig.templates] || "";
    const portalUrl = process.env.PORTAL_URL || process.env.BASE_URL || "";
    
    const mensagemRenderizada = template
      .replace(/{{nome_cliente}}/g, "Assinante")
      .replace(/{{plano}}/g, "[Nome do Plano Contratado]")
      .replace(/{{valor_fatura}}/g, "[Valor da Fatura]")
      .replace(/{{data_vencimento}}/g, new Date().toLocaleDateString('pt-BR'))
      .replace(/{{desconto_pontualidade}}/g, Number(globalReguaConfig.descontoPontualidade || 0).toFixed(2).replace('.', ','))
      .replace(/{{chave_pix}}/g, "[Chave PIX da Fatura / Boleto]")
      .replace(/{{link_segunda_via}}/g, portalUrl ? `${portalUrl}/faturas` : "/portal/faturas");

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

    const cleanPhone = telefone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return res.status(400).json({
        success: false,
        status: "failed",
        error: "Número de telefone inválido para envio WhatsApp."
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
          to: cleanPhone,
          type: "text",
          text: { body: mensagemRenderizada }
        })
      });

      const metaData = await metaRes.json();
      const messageId = metaData.messages?.[0]?.id;

      if (!metaRes.ok || !messageId) {
        return res.status(metaRes.ok ? 502 : metaRes.status).json({
          success: false,
          status: "failed",
          error: metaData.error?.message || "Meta API não retornou confirmation message_id."
        });
      }

      return res.json({
        success: true,
        status: "sent",
        providerMessageId: messageId,
        to: telefone,
        timestamp: new Date().toISOString(),
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

  // 4. Executar Disparo em Lote da Régua (REGRA ABSOLUTA: Execução Real com message_id ou falha)
  router.post('/regua/executar', requireAuth, async (req, res) => {
    const { fase = "d_menos_3" } = req.body;

    const accessToken = process.env.WABA_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WABA_PHONE_NUMBER_ID;

    // Regra Estrita: Se WABA não configurado, assume explicitamente e NUNCA finge sucesso
    if (!accessToken || !phoneNumberId) {
      return res.status(503).json({
        success: false,
        status: "not_configured",
        reason: "WhatsApp WABA credentials missing (WABA_ACCESS_TOKEN e WABA_PHONE_NUMBER_ID ausentes)."
      });
    }

    if (!isDatabaseConnected) {
      return res.status(503).json({
        success: false,
        status: "unavailable",
        reason: "Banco de dados PostgreSQL indisponível para consulta de faturas elegíveis."
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

      // Registra início da execução no PostgreSQL (Fonte de Verdade Operacional)
      const [execRow] = await db.insert(regua_execucoes).values({
        fase,
        totalFaturas: pendingFaturas.length,
        disparados: 0,
        sucesso: 0,
        falhas: 0,
        status: 'running',
        iniciadoEm: new Date()
      }).returning();

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

          const linkSegundaVia = (fatura as any).linkBoleto || (process.env.PORTAL_URL ? `${process.env.PORTAL_URL}/faturas/${fatura.id}` : `/portal/faturas/${fatura.id}`);
          const planoDescricao = cliente.plano || "plano ausente";

          const textoFinal = template
            .replace(/{{nome_cliente}}/g, cliente.nome)
            .replace(/{{plano}}/g, planoDescricao)
            .replace(/{{valor_fatura}}/g, Number(fatura.valor || 0).toFixed(2).replace('.', ','))
            .replace(/{{data_vencimento}}/g, fatura.vencimento ? new Date(fatura.vencimento).toLocaleDateString('pt-BR') : 'A vencer')
            .replace(/{{chave_pix}}/g, fatura.pixCopiaECola || 'Chave PIX no boleto bancário')
            .replace(/{{link_segunda_via}}/g, linkSegundaVia);

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
          const providerId = metaData.messages?.[0]?.id;

          if (metaRes.ok && providerId) {
            disparados++;

            // Persiste disparo bem-sucedido no PostgreSQL
            await db.insert(regua_disparos).values({
              execucaoId: execRow.id,
              faturaId: fatura.id,
              clienteId: fatura.clienteId,
              fase,
              canal: 'whatsapp',
              destinatario: telefoneLimpo,
              status: 'enviado',
              providerMessageId: providerId,
              valor: String(fatura.valor || '0.00'),
              disparadoEm: new Date()
            });

            // Registrar mensagem no histórico real do chat
            try {
              let [chat] = await db.select().from(conversas).where(eq(conversas.telefone, telefoneLimpo)).limit(1);
              if (chat) {
                await db.insert(mensagens).values({
                  conversaId: chat.id,
                  remetente: 'sistema',
                  conteudo: `[Régua de Cobrança - ${fase} | MsgID: ${providerId}] ${textoFinal}`,
                  statusEntrega: 'enviado'
                });
              }
            } catch {}
          } else {
            falhas++;
            // Persiste falha do disparo no PostgreSQL
            await db.insert(regua_disparos).values({
              execucaoId: execRow.id,
              faturaId: fatura.id,
              clienteId: fatura.clienteId,
              fase,
              canal: 'whatsapp',
              destinatario: telefoneLimpo,
              status: 'falha',
              erro: metaData.error?.message || 'Meta API não confirmou envio',
              valor: String(fatura.valor || '0.00'),
              disparadoEm: new Date()
            });
          }
        } catch (errDisparo: any) {
          falhas++;
          await db.insert(regua_disparos).values({
            execucaoId: execRow.id,
            faturaId: fatura.id,
            clienteId: fatura.clienteId,
            fase,
            canal: 'whatsapp',
            destinatario: (fatura as any).clienteId ? String((fatura as any).clienteId) : 'desconhecido',
            status: 'falha',
            erro: errDisparo.message,
            valor: String(fatura.valor || '0.00'),
            disparadoEm: new Date()
          });
        }
      }

      // Conclui execução no PostgreSQL com métricas finais
      await db.update(regua_execucoes).set({
        disparados,
        sucesso: disparados,
        falhas,
        status: 'concluida',
        finalizadoEm: new Date()
      }).where(eq(regua_execucoes.id, execRow.id));

      if (registrarAuditoria) {
        registrarAuditoria({
          usuario: (req as any).user?.email || "sistema",
          modulo: "Campanhas ISP",
          acao: `Execução Régua de Cobrança - ${fase}`,
          detalhes: `Disparo real da régua concluído via WABA. Disparados com sucesso: ${disparados}, falhas: ${falhas}.`,
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
        status: "failed",
        error: `Erro interno no processamento da régua: ${err.message}`
      });
    }
  });

  // 5. Disparo Individual Real de Régua de Cobrança (sem falsos sucessos)
  router.post('/regua/disparar-individual', requireAuth, async (req, res) => {
    const { faturaId, id, fase = "d_menos_3" } = req.body;
    const targetId = Number(faturaId || id);

    if (!targetId || isNaN(targetId)) {
      return res.status(400).json({
        success: false,
        status: "failed",
        mensagem: "Parâmetro faturaId ou id é obrigatório para disparo individual."
      });
    }

    const accessToken = process.env.WABA_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WABA_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
      return res.status(503).json({
        success: false,
        status: "not_configured",
        mensagem: "WhatsApp WABA não configurado (WABA_ACCESS_TOKEN e WABA_PHONE_NUMBER_ID ausentes)."
      });
    }

    if (!isDatabaseConnected) {
      return res.status(503).json({
        success: false,
        status: "unavailable",
        mensagem: "PostgreSQL indisponível para consulta da fatura."
      });
    }

    try {
      const [fatura] = await db.select().from(faturas).where(eq(faturas.id, targetId)).limit(1);
      if (!fatura) {
        return res.status(404).json({
          success: false,
          status: "failed",
          mensagem: `Fatura ID ${targetId} não encontrada no banco de dados.`
        });
      }

      const [cliente] = await db.select().from(clientes).where(eq(clientes.id, fatura.clienteId)).limit(1);
      if (!cliente || !cliente.telefone) {
        return res.status(404).json({
          success: false,
          status: "failed",
          mensagem: "Cliente ou telefone cadastrado não encontrado para esta fatura."
        });
      }

      const cleanPhone = cliente.telefone.replace(/\D/g, "");
      if (cleanPhone.length < 10) {
        return res.status(400).json({
          success: false,
          status: "failed",
          mensagem: "Telefone do cliente inválido para envio WhatsApp."
        });
      }

      const linkSegundaVia = (fatura as any).linkBoleto || (process.env.PORTAL_URL ? `${process.env.PORTAL_URL}/faturas/${fatura.id}` : `/portal/faturas/${fatura.id}`);
      const planoDescricao = cliente.plano || "plano ausente";
      const template = globalReguaConfig.templates[fase as keyof typeof globalReguaConfig.templates] || globalReguaConfig.templates.d_menos_3;
      const textoFinal = template
        .replace(/{{nome_cliente}}/g, cliente.nome)
        .replace(/{{plano}}/g, planoDescricao)
        .replace(/{{valor_fatura}}/g, Number(fatura.valor || 0).toFixed(2).replace('.', ','))
        .replace(/{{data_vencimento}}/g, fatura.vencimento ? new Date(fatura.vencimento).toLocaleDateString('pt-BR') : 'A vencer')
        .replace(/{{chave_pix}}/g, fatura.pixCopiaECola || 'Chave PIX no boleto bancário')
        .replace(/{{link_segunda_via}}/g, linkSegundaVia);

      // Chamada real HTTPS à Meta
      const metaRes = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanPhone,
          type: "text",
          text: { body: textoFinal }
        })
      });

      const metaData = await metaRes.json();
      const providerId = metaData.messages?.[0]?.id;

      if (!metaRes.ok || !providerId) {
        // Registra falha no PostgreSQL
        try {
          await db.insert(regua_disparos).values({
            faturaId: fatura.id,
            clienteId: fatura.clienteId,
            fase,
            canal: 'whatsapp',
            destinatario: cleanPhone,
            status: 'falha',
            erro: metaData.error?.message || "Meta API não retornou confirmação de entrega.",
            valor: String(fatura.valor || '0.00'),
            disparadoEm: new Date()
          });
        } catch {}

        return res.status(metaRes.ok ? 502 : metaRes.status).json({
          success: false,
          status: "failed",
          mensagem: metaData.error?.message || "Meta API não retornou confirmação de entrega.",
          detalhes: metaData
        });
      }

      // Sucesso comprovado pela Meta — Persiste disparo no PostgreSQL
      try {
        await db.insert(regua_disparos).values({
          faturaId: fatura.id,
          clienteId: fatura.clienteId,
          fase,
          canal: 'whatsapp',
          destinatario: cleanPhone,
          status: 'enviado',
          providerMessageId: providerId,
          valor: String(fatura.valor || '0.00'),
          disparadoEm: new Date()
        });
      } catch (dbErr: any) {
        console.warn('[Régua Cobrança] Erro ao gravar disparo individual no PostgreSQL:', dbErr.message);
      }

      // Registrar mensagem no histórico real
      try {
        let [chat] = await db.select().from(conversas).where(eq(conversas.telefone, cleanPhone)).limit(1);
        if (chat) {
          await db.insert(mensagens).values({
            conversaId: chat.id,
            remetente: 'sistema',
            conteudo: `[Régua Individual - Fatura #${fatura.id} | MsgID: ${providerId}] ${textoFinal}`,
            statusEntrega: 'enviado'
          });
        }
      } catch {}

      if (registrarAuditoria) {
        registrarAuditoria({
          usuario: (req as any).user?.email || "operador",
          modulo: "Campanhas ISP",
          acao: "Disparo Individual Régua WABA",
          detalhes: `Notificação enviada com sucesso para cliente ${cliente.nome} (${cleanPhone}). MsgID: ${providerId}`,
          categoria: "marketing",
          severidade: "info",
          ip: req.ip || null,
          userAgent: req.headers["user-agent"] || null
        });
      }

      return res.json({
        success: true,
        status: "sent",
        providerMessageId: providerId,
        telefone: cleanPhone,
        faturaId: fatura.id,
        mensagem: `Notificação WhatsApp com PIX transmitida e confirmada pela Meta para ${cliente.nome} (${cleanPhone})!`
      });
    } catch (err: any) {
      return res.status(502).json({
        success: false,
        status: "failed",
        mensagem: `Erro de comunicação com a Meta API: ${err.message}`
      });
    }
  });

  // 6. Status Real do WebPush VAPID
  router.get('/push/status', async (req, res) => {
    const isConfigured = webPushService.isConfigured();
    const count = await webPushService.getSubscriptionsCount();
    res.json({
      active: isConfigured,
      status: isConfigured ? "configured" : "not_configured",
      subscriptions: count,
      publicKey: webPushService.getPublicKey()
    });
  });

  // 7. Envio Real de WebPush com Autorização Estrita (BLOQUEADOR CRÍTICO V9)
  // Regras obrigatórias:
  // - Usuário interno (user_id): autenticado, RBAC (se outro usuário, exige ADMIN/SUPERADMIN), existência do usuário, subscrição pertencente ao usuário.
  // - Cliente/assinante (cliente_id): permissão de notificar cliente (ADMIN/SUPERADMIN/OPERADOR/SUPORTE/FINANCEIRO), existência do cliente, subscrição pertencente a cliente_id, NUNCA users.id.
  // - Endpoint arbitrário: REJEIÇÃO com 403 Forbidden. Nunca aceitar endpoint como prova de identidade.
  // - Falha de autorização ou recurso não encontrado -> 403 Forbidden ou 404 Not Found. NUNCA 200 success.
  router.post('/push/send', requireAuth, async (req, res) => {
    const { target, target_type, user_id, cliente_id, title, body, data } = req.body;

    if (!webPushService.isConfigured()) {
      return res.status(503).json({
        sucesso: false,
        status: "not_configured",
        mensagem: "Serviço WebPush VAPID não configurado. Defina VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY."
      });
    }

    if (!title || !body) {
      return res.status(400).json({
        sucesso: false,
        status: "failed",
        mensagem: "Campos obrigatórios: title, body."
      });
    }

    // Validação de Endpoint Arbitrário: Nunca aceitar endpoint arbitrário como prova de identidade
    if (typeof target === 'string' && (target.startsWith('http://') || target.startsWith('https://'))) {
      return res.status(403).json({
        sucesso: false,
        status: "forbidden",
        mensagem: "Endpoints Push arbitrários não são aceitos como autorização de identidade. O envio deve ser direcionado para user_id ou cliente_id autorizado no banco."
      });
    }

    const currentUser = (req as any).user;
    const userRole = (currentUser?.cargo || currentUser?.role || '').toUpperCase();
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN';

    // Determinar destino: Cliente ISP ou Usuário interno
    const isClienteTarget = Boolean(cliente_id || target_type === 'cliente' || (typeof target === 'string' && target.startsWith('cliente:')));
    const isUserTarget = Boolean(user_id || target_type === 'user' || (typeof target === 'string' && target.startsWith('user:')));

    if (!isClienteTarget && !isUserTarget && !target) {
      return res.status(400).json({
        sucesso: false,
        status: "failed",
        mensagem: "Destinatário não especificado. Forneça cliente_id ou user_id autorizado."
      });
    }

    if (isClienteTarget) {
      // 1. Destino: Cliente ISP (clientes.id)
      const allowedRoles = ['ADMIN', 'SUPERADMIN', 'OPERADOR', 'SUPORTE', 'FINANCEIRO'];
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          sucesso: false,
          status: "forbidden",
          mensagem: "Perfil de usuário sem permissão RBAC para notificar clientes via Push."
        });
      }

      let targetClienteId: number;
      if (cliente_id) {
        targetClienteId = Number(cliente_id);
      } else if (typeof target === 'string' && target.startsWith('cliente:')) {
        targetClienteId = Number(target.replace('cliente:', ''));
      } else {
        targetClienteId = Number(target);
      }

      if (isNaN(targetClienteId) || targetClienteId <= 0) {
        return res.status(400).json({
          sucesso: false,
          status: "invalid_target",
          mensagem: "Identificador cliente_id deve ser um número válido."
        });
      }

      // Validar existência do cliente no PostgreSQL
      const clienteRows = await db.select().from(clientes)
        .where(and(eq(clientes.id, targetClienteId), sql`${clientes.deletedAt} IS NULL`))
        .limit(1);

      if (clienteRows.length === 0) {
        return res.status(404).json({
          sucesso: false,
          status: "cliente_not_found",
          mensagem: `Cliente ISP #${targetClienteId} não encontrado no cadastro.`
        });
      }

      // Validar existência de subscrição ativa vinculada EXCLUSIVAMENTE ao cliente_id (NUNCA users.id)
      const subRows = await db.select().from(push_subscriptions)
        .where(and(eq(push_subscriptions.clienteId, targetClienteId), eq(push_subscriptions.active, true)))
        .orderBy(desc(push_subscriptions.updatedAt))
        .limit(1);

      if (subRows.length === 0) {
        return res.status(404).json({
          sucesso: false,
          status: "subscription_not_found",
          mensagem: `Nenhuma subscrição WebPush ativa encontrada para o cliente ISP #${targetClienteId}.`
        });
      }

      const pushRes = await webPushService.sendToCliente(targetClienteId, { title, body, data });
      return res.status(pushRes.sucesso ? 200 : (pushRes.status === 'subscription_not_found' ? 404 : 400)).json(pushRes);
    } else {
      // 2. Destino: Usuário Interno (users.id)
      let targetUserId: number;
      if (user_id) {
        targetUserId = Number(user_id);
      } else if (typeof target === 'string' && target.startsWith('user:')) {
        targetUserId = Number(target.replace('user:', ''));
      } else {
        targetUserId = Number(target);
      }

      if (isNaN(targetUserId) || targetUserId <= 0) {
        return res.status(400).json({
          sucesso: false,
          status: "invalid_target",
          mensagem: "Identificador user_id deve ser um número válido."
        });
      }

      // Validar se o usuário está enviando para si mesmo ou se possui perfil ADMIN
      const currentUserId = Number(currentUser?.id);
      if (targetUserId !== currentUserId && !isAdmin) {
        return res.status(403).json({
          sucesso: false,
          status: "forbidden",
          mensagem: "Acesso negado: apenas administradores com perfil RBAC podem enviar notificações Push para outros usuários."
        });
      }

      // Validar existência do usuário no PostgreSQL
      const userRows = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
      if (userRows.length === 0) {
        return res.status(404).json({
          sucesso: false,
          status: "user_not_found",
          mensagem: `Usuário operador #${targetUserId} não encontrado.`
        });
      }

      // Validar subscrição pertencente ao usuário
      const subRows = await db.select().from(push_subscriptions)
        .where(and(eq(push_subscriptions.userId, targetUserId), eq(push_subscriptions.active, true)))
        .orderBy(desc(push_subscriptions.updatedAt))
        .limit(1);

      if (subRows.length === 0) {
        return res.status(404).json({
          sucesso: false,
          status: "subscription_not_found",
          mensagem: `Nenhuma subscrição WebPush ativa encontrada para o usuário #${targetUserId}.`
        });
      }

      const pushRes = await webPushService.sendToUser(targetUserId, { title, body, data });
      return res.status(pushRes.sucesso ? 200 : (pushRes.status === 'subscription_not_found' ? 404 : 400)).json(pushRes);
    }
  });

  app.use('/api/cobranca', router);
};
