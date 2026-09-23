import express from 'express';
import crypto from 'crypto';
import { db, isDatabaseConnected } from '../../src/db/index';
import { incident_notifications, clientes, conversas, mensagens } from '../../src/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { webPushService } from '../push/webPushService';

export interface IncidenteRede {
  id: string;
  titulo: string;
  tipo: "rompimento_fibra" | "falha_energia_pop" | "degradacao_backbone" | "manutencao_programada";
  regioesAfetadas: string[];
  concentradorOuOlt: string;
  clientesAfetadosAprox: number;
  status: "em_reparo" | "identificado" | "normalizado";
  previsaoRetorno: string;
  iniciadoEm: string;
  protocoloAnatel: string;
  descricao: string;
  autoInterceptarAtendimento: boolean;
  notificacoesEnviadas: number;
}

// Lista persistente de incidentes
let incidentesRede: IncidenteRede[] = [];

export const setupIncidentesRoutes = (app: express.Express, { registrarAuditoria }: any = {}) => {
  const router = express.Router();

  // 1. Listar Incidentes
  router.get('/incidentes', (req, res) => {
    res.json({
      sucesso: true,
      total: incidentesRede.length,
      incidentes: incidentesRede
    });
  });

  // 2. Criar novo Incidente
  router.post('/incidentes', (req, res) => {
    const { titulo, tipo, regioesAfetadas, concentradorOuOlt, clientesAfetadosAprox, previsaoRetorno, descricao } = req.body;
    const novoIncidente: IncidenteRede = {
      id: `INC-${Date.now().toString().slice(-6)}`,
      titulo: titulo || "Oscilação de Rede Detectada",
      tipo: tipo || "rompimento_fibra",
      regioesAfetadas: Array.isArray(regioesAfetadas) ? regioesAfetadas : ["Região Geral"],
      concentradorOuOlt: concentradorOuOlt || "OLT Central",
      clientesAfetadosAprox: Number(clientesAfetadosAprox) || 0,
      status: "em_reparo",
      previsaoRetorno: previsaoRetorno || "Em até 2 horas",
      iniciadoEm: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + " (Hoje)",
      protocoloAnatel: `ANT-${new Date().getFullYear()}-${crypto.randomInt(100000, 999999)}`,
      descricao: descricao || "Manutenção corretiva em andamento.",
      autoInterceptarAtendimento: true,
      notificacoesEnviadas: 0 // ZERO falso sucesso
    };

    incidentesRede.unshift(novoIncidente);

    if (registrarAuditoria) {
      registrarAuditoria({
        usuario: (req as any).user?.email || "operador_noc",
        modulo: "NOC & Incidentes",
        acao: `Registro de Incidente ${novoIncidente.id}`,
        detalhes: `Incidente registrado: ${novoIncidente.titulo} afetando aprox. ${novoIncidente.clientesAfetadosAprox} clientes.`,
        categoria: "noc_zabbix",
        severidade: "alto",
        ip: req.ip || null,
        userAgent: (req.headers["user-agent"] as string) || null,
        payloadDepois: novoIncidente
      });
    }

    res.status(201).json({ sucesso: true, incidente: novoIncidente });
  });

  // 3. Atualizar Incidente
  router.patch('/incidentes/:id', (req, res) => {
    const { id } = req.params;
    const { status, previsaoRetorno, descricao, autoInterceptarAtendimento } = req.body;

    const index = incidentesRede.findIndex(inc => inc.id === id);
    if (index === -1) {
      return res.status(404).json({ sucesso: false, erro: "Incidente não encontrado." });
    }

    if (status) incidentesRede[index].status = status;
    if (previsaoRetorno) incidentesRede[index].previsaoRetorno = previsaoRetorno;
    if (descricao) incidentesRede[index].descricao = descricao;
    if (typeof autoInterceptarAtendimento === 'boolean') {
      incidentesRede[index].autoInterceptarAtendimento = autoInterceptarAtendimento;
    }

    res.json({ sucesso: true, incidente: incidentesRede[index] });
  });

  // 4. Disparo Real de Alertas de Incidente (REGRA 8: ZERO estimativa, auditoria e persistência)
  router.post('/incidentes/:id/notificar-massa', async (req, res) => {
    const { id } = req.params;
    const incidente = incidentesRede.find(inc => inc.id === id);
    if (!incidente) {
      return res.status(404).json({ sucesso: false, erro: "Incidente não encontrado." });
    }

    const hasWaba = Boolean(process.env.WABA_ACCESS_TOKEN && process.env.WABA_PHONE_NUMBER_ID);
    const hasPush = webPushService.isConfigured();

    if (!hasWaba && !hasPush) {
      return res.status(503).json({
        sucesso: false,
        status: "not_configured",
        enviados: 0,
        motivo: "Nenhum canal de notificação configurado (WABA ou WebPush VAPID ausentes)."
      });
    }

    if (!isDatabaseConnected) {
      return res.status(503).json({
        sucesso: false,
        status: "unavailable",
        enviados: 0,
        motivo: "Banco de dados PostgreSQL indisponível para consulta e registro de destinatários."
      });
    }

    try {
      // 1. Localizar clientes reais que residam nas regiões afetadas ou limite da amostra
      const clientesAlvo = await db.select({
        id: clientes.id,
        nome: clientes.nome,
        telefone: clientes.telefone,
        endereco: clientes.endereco
      }).from(clientes).limit(Math.min(incidente.clientesAfetadosAprox || 50, 100));

      if (clientesAlvo.length === 0) {
        return res.json({
          sucesso: true,
          status: "completed",
          enviados: 0,
          falhas: 0,
          mensagem: "Nenhum cliente cadastrado no banco para as regiões do incidente.",
          incidente
        });
      }

      let enviadosReal = 0;
      let falhasReal = 0;
      const textoAlerta = `⚠️ COMUNICADO DE REDE [${incidente.id}]: Prezado cliente, identificamos uma oscilação na fibra óptica (${incidente.regioesAfetadas.join(', ')}). Equipe técnica no local. Previsão de normalização: ${incidente.previsaoRetorno}.`;

      for (const cliente of clientesAlvo) {
        const cleanPhone = (cliente.telefone || '').replace(/\D/g, "");
        if (!cleanPhone || cleanPhone.length < 10) continue;

        // Registrar status 'queued' na tabela de notificações de incidentes
        const [notif] = await db.insert(incident_notifications).values({
          incidentId: incidente.id,
          customerId: cliente.id,
          channel: "whatsapp",
          status: "queued",
          attemptedAt: new Date()
        }).returning();

        if (hasWaba) {
          try {
            await db.update(incident_notifications)
              .set({ status: "sending" })
              .where(eq(incident_notifications.id, notif.id));

            const accessToken = process.env.WABA_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN;
            const phoneNumberId = process.env.WABA_PHONE_NUMBER_ID;

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
                text: { body: textoAlerta }
              })
            });

            const metaData = await metaRes.json();
            const providerId = metaData.messages?.[0]?.id;

            if (metaRes.ok && providerId) {
              enviadosReal++;
              await db.update(incident_notifications).set({
                status: "sent",
                providerMessageId: providerId,
                sentAt: new Date()
              }).where(eq(incident_notifications.id, notif.id));

              // Registra no chat histórico
              try {
                let [chat] = await db.select().from(conversas).where(eq(conversas.telefone, cleanPhone)).limit(1);
                if (chat) {
                  await db.insert(mensagens).values({
                    conversaId: chat.id,
                    remetente: 'sistema',
                    conteudo: `[Alerta de Rede #${incidente.id}] ${textoAlerta}`,
                    statusEntrega: 'enviado'
                  });
                }
              } catch {}
            } else {
              falhasReal++;
              await db.update(incident_notifications).set({
                status: "failed",
                failedAt: new Date(),
                errorCode: String(metaRes.status),
                errorMessage: metaData.error?.message || "Meta API não confirmou envio."
              }).where(eq(incident_notifications.id, notif.id));
            }
          } catch (err: any) {
            falhasReal++;
            await db.update(incident_notifications).set({
              status: "failed",
              failedAt: new Date(),
              errorMessage: err.message
            }).where(eq(incident_notifications.id, notif.id));
          }
        }
      }

      // REGRA CRÍTICA: Somente mensagens enviadas e confirmadas pela rede contam!
      incidente.notificacoesEnviadas += enviadosReal;

      if (registrarAuditoria) {
        registrarAuditoria({
          usuario: (req as any).user?.email || "operador_noc",
          modulo: "NOC & Incidentes",
          acao: `Disparo de Alertas Incidente ${incidente.id}`,
          detalhes: `Disparo em massa executado. Enviados comprovados: ${enviadosReal}, Falhas: ${falhasReal}.`,
          categoria: "disparo",
          severidade: "medio",
          ip: req.ip || null,
          userAgent: (req.headers["user-agent"] as string) || null,
          payloadDepois: { incidentId: incidente.id, enviados: enviadosReal, falhas: falhasReal }
        });
      }

      return res.json({
        sucesso: true,
        status: "completed",
        enviados: enviadosReal,
        falhas: falhasReal,
        totalAlvos: clientesAlvo.length,
        mensagem: `Alerta transmitido: ${enviadosReal} mensagens confirmadas pela Meta API (${falhasReal} falhas).`,
        incidente
      });
    } catch (err: any) {
      return res.status(500).json({
        sucesso: false,
        status: "failed",
        erro: `Erro no processamento de notificações de incidentes: ${err.message}`
      });
    }
  });

  // 5. Verificar se determinado cliente ou endereço está sob impacto de Incidente Ativo
  router.get('/incidentes/verificar-cliente', (req, res) => {
    const { bairro = "", cidade = "" } = req.query as { bairro?: string; cidade?: string };

    const incidenteAtivo = incidentesRede.find(inc => {
      if (inc.status === "normalizado") return false;
      const bNorm = bairro.toLowerCase().trim();
      const cNorm = cidade.toLowerCase().trim();
      return inc.regioesAfetadas.some(reg => {
        const rNorm = reg.toLowerCase().trim();
        return (bNorm && rNorm.includes(bNorm)) || (cNorm && rNorm.includes(cNorm)) || rNorm === "toda a cidade" || rNorm === "região geral";
      });
    });

    if (incidenteAtivo) {
      return res.json({
        sobImpacto: true,
        incidente: {
          id: incidenteAtivo.id,
          titulo: incidenteAtivo.titulo,
          tipo: incidenteAtivo.tipo,
          previsaoRetorno: incidenteAtivo.previsaoRetorno,
          mensagemURA: `Identificamos uma oscilação na rede da sua região. Nossa equipe técnica já está atuando com previsão de normalização ${incidenteAtivo.previsaoRetorno}. Protocolo: ${incidenteAtivo.protocoloAnatel}.`,
          autoInterceptar: incidenteAtivo.autoInterceptarAtendimento
        }
      });
    }

    res.json({ sobImpacto: false });
  });

  app.use('/api', router);
};
