import express from 'express';
import crypto from 'crypto';
import { db, isDatabaseConnected } from '../../src/db/index';
import { incident_notifications, incidentes_rede, clientes, conversas, mensagens, push_subscriptions } from '../../src/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
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

// Fallback resiliente em memória caso o PostgreSQL esteja offline
let incidentesRedeMemoria: IncidenteRede[] = [];

/**
 * Converte registro do banco PostgreSQL para a interface de domínio IncidenteRede
 */
function mapDbToIncidente(row: any): IncidenteRede {
  let regioes: string[] = [];
  try {
    regioes = typeof row.regioesAfetadas === 'string' ? JSON.parse(row.regioesAfetadas) : (row.regioesAfetadas || []);
  } catch {
    regioes = [row.regioesAfetadas || 'Região Geral'];
  }

  return {
    id: row.id,
    titulo: row.titulo,
    tipo: row.tipo as any,
    regioesAfetadas: regioes,
    concentradorOuOlt: row.concentradorOlt || 'OLT Central',
    clientesAfetadosAprox: row.clientesAfetados || 0,
    status: row.status as any,
    previsaoRetorno: row.previsaoRetorno || 'Em até 2 horas',
    iniciadoEm: row.iniciadoEm,
    protocoloAnatel: row.protocolo,
    descricao: row.descricao || '',
    autoInterceptarAtendimento: row.autoInterceptar ?? true,
    notificacoesEnviadas: row.notificacoesEnviadas || 0
  };
}

export const setupIncidentesRoutes = (app: express.Express, { registrarAuditoria }: any = {}) => {
  const router = express.Router();

  // 1. Listar Incidentes (PostgreSQL com fallback em memória)
  router.get('/incidentes', async (req, res) => {
    if (isDatabaseConnected) {
      try {
        const rows = await db.select().from(incidentes_rede).orderBy(desc(incidentes_rede.createdAt));
        const list = rows.map(mapDbToIncidente);
        return res.json({
          sucesso: true,
          total: list.length,
          incidentes: list
        });
      } catch (err: any) {
        console.warn(`[NOC Incidentes] Falha ao consultar incidentes no PostgreSQL: ${err.message}. Utilizando fallback em memória.`);
      }
    }

    res.json({
      sucesso: true,
      total: incidentesRedeMemoria.length,
      incidentes: incidentesRedeMemoria
    });
  });

  // 2. Criar novo Incidente (Persistência PostgreSQL)
  router.post('/incidentes', async (req, res) => {
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
      notificacoesEnviadas: 0
    };

    // 1. Persistência PostgreSQL
    if (isDatabaseConnected) {
      try {
        await db.insert(incidentes_rede).values({
          id: novoIncidente.id,
          titulo: novoIncidente.titulo,
          tipo: novoIncidente.tipo,
          regioesAfetadas: JSON.stringify(novoIncidente.regioesAfetadas),
          concentradorOlt: novoIncidente.concentradorOuOlt,
          clientesAfetados: novoIncidente.clientesAfetadosAprox,
          status: novoIncidente.status,
          previsaoRetorno: novoIncidente.previsaoRetorno,
          iniciadoEm: novoIncidente.iniciadoEm,
          protocolo: novoIncidente.protocoloAnatel,
          descricao: novoIncidente.descricao,
          autoInterceptar: novoIncidente.autoInterceptarAtendimento,
          notificacoesEnviadas: 0
        });
      } catch (err: any) {
        console.warn(`[NOC Incidentes] Falha ao gravar incidente no PostgreSQL: ${err.message}`);
      }
    }

    // 2. Cache em memória resiliente
    incidentesRedeMemoria.unshift(novoIncidente);

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

  // 3. Atualizar Incidente (Persistência PostgreSQL)
  router.patch('/incidentes/:id', async (req, res) => {
    const { id } = req.params;
    const { status, previsaoRetorno, descricao, autoInterceptarAtendimento } = req.body;

    let incidenteAtualizado: IncidenteRede | null = null;

    if (isDatabaseConnected) {
      try {
        const updateData: any = { updatedAt: new Date() };
        if (status) updateData.status = status;
        if (previsaoRetorno) updateData.previsaoRetorno = previsaoRetorno;
        if (descricao) updateData.descricao = descricao;
        if (typeof autoInterceptarAtendimento === 'boolean') updateData.autoInterceptar = autoInterceptarAtendimento;

        const [updated] = await db.update(incidentes_rede)
          .set(updateData)
          .where(eq(incidentes_rede.id, id))
          .returning();

        if (updated) {
          incidenteAtualizado = mapDbToIncidente(updated);
        }
      } catch (err: any) {
        console.warn(`[NOC Incidentes] Falha ao atualizar incidente no PostgreSQL: ${err.message}`);
      }
    }

    // Atualiza também no cache em memória
    const index = incidentesRedeMemoria.findIndex(inc => inc.id === id);
    if (index !== -1) {
      if (status) incidentesRedeMemoria[index].status = status;
      if (previsaoRetorno) incidentesRedeMemoria[index].previsaoRetorno = previsaoRetorno;
      if (descricao) incidentesRedeMemoria[index].descricao = descricao;
      if (typeof autoInterceptarAtendimento === 'boolean') {
        incidentesRedeMemoria[index].autoInterceptarAtendimento = autoInterceptarAtendimento;
      }
      if (!incidenteAtualizado) {
        incidenteAtualizado = incidentesRedeMemoria[index];
      }
    }

    if (!incidenteAtualizado) {
      return res.status(404).json({ sucesso: false, erro: "Incidente não encontrado." });
    }

    res.json({ sucesso: true, incidente: incidenteAtualizado });
  });

  // 4. Disparo Real de Alertas de Incidente com Seleção Geográfica Estrita
  router.post('/incidentes/:id/notificar-massa', async (req, res) => {
    const { id } = req.params;
    let incidente: IncidenteRede | null = null;

    if (isDatabaseConnected) {
      try {
        const [row] = await db.select().from(incidentes_rede).where(eq(incidentes_rede.id, id)).limit(1);
        if (row) {
          incidente = mapDbToIncidente(row);
        }
      } catch (dbErr: any) {
        console.warn(`[NOC Incidentes] Aviso ao ler incidente no PostgreSQL: ${dbErr.message}`);
      }
    }

    if (!incidente) {
      incidente = incidentesRedeMemoria.find(inc => inc.id === id) || null;
    }

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
        motivo: "Nenhum canal de notificação configurado (WABA ou WebPush VAPID ausentes no servidor)."
      });
    }

    if (!isDatabaseConnected) {
      return res.status(503).json({
        sucesso: false,
        status: "unavailable",
        enviados: 0,
        motivo: "Banco de dados PostgreSQL indisponível para consulta e filtragem de clientes por região."
      });
    }

    try {
      // REGRA V6 - PONTO 10: Seleção baseada em dados reais de localização do cadastro
      // Não executar SELECT clientes LIMIT N. Filtrar estritamente por bairro/cidade/endereço/cep.
      const conditions: any[] = [];
      for (const reg of incidente.regioesAfetadas) {
        const cleanReg = (reg || '').trim();
        if (
          cleanReg &&
          cleanReg.length >= 3 &&
          cleanReg.toLowerCase() !== 'região geral' &&
          cleanReg.toLowerCase() !== 'todas'
        ) {
          const pattern = `%${cleanReg.toLowerCase()}%`;
          conditions.push(sql`LOWER(${clientes.bairro}) LIKE ${pattern}`);
          conditions.push(sql`LOWER(${clientes.cidade}) LIKE ${pattern}`);
          conditions.push(sql`LOWER(${clientes.endereco}) LIKE ${pattern}`);
          conditions.push(sql`LOWER(${clientes.cep}) LIKE ${pattern}`);
        }
      }

      // Se não há critérios de região específicos: não inventar dados e retornar insufficient_data
      if (conditions.length === 0) {
        return res.status(422).json({
          sucesso: false,
          status: "insufficient_data",
          enviados: 0,
          falhas: 0,
          motivo: `Critérios geográficos insuficientes para filtrar clientes afetados no cadastro (${incidente.regioesAfetadas.join(', ')}). Nenhum envio executado para evitar notificações indevidas.`
        });
      }

      const clientesAlvo = await db.select({
        id: clientes.id,
        nome: clientes.nome,
        telefone: clientes.telefone,
        endereco: clientes.endereco,
        bairro: clientes.bairro,
        cidade: clientes.cidade
      }).from(clientes)
        .where(and(sql`${clientes.deletedAt} IS NULL`, sql`(${sql.join(conditions, sql` OR `)})`))
        .limit(Math.min(incidente.clientesAfetadosAprox || 50, 100));

      if (clientesAlvo.length === 0) {
        return res.json({
          sucesso: false,
          status: "insufficient_data",
          enviados: 0,
          falhas: 0,
          motivo: `Nenhum cliente cadastrado no banco coincide com as regiões afetadas pelo incidente (${incidente.regioesAfetadas.join(', ')}).`,
          incidente
        });
      }

      let enviadosReal = 0;
      let falhasReal = 0;
      const textoAlerta = `⚠️ COMUNICADO DE REDE [${incidente.id}]: Prezado cliente, identificamos uma oscilação na fibra óptica (${incidente.regioesAfetadas.join(', ')}). Equipe técnica no local. Previsão de normalização: ${incidente.previsaoRetorno}.`;

      for (const cliente of clientesAlvo) {
        const cleanPhone = (cliente.telefone || '').replace(/\D/g, "");

        // Canal 1: WhatsApp Oficial (se WABA configurado e telefone válido)
        if (hasWaba && cleanPhone && cleanPhone.length >= 10) {
          const [notif] = await db.insert(incident_notifications).values({
            incidentId: incidente.id,
            customerId: cliente.id,
            channel: "whatsapp",
            status: "queued",
            attemptedAt: new Date()
          }).returning();

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

        // Canal 2: WebPush Notification Real (se configurado e cliente possuir subscrição ativa)
        if (hasPush) {
          try {
            const customerPushSubs = await db.select().from(push_subscriptions)
              .where(and(eq(push_subscriptions.userId, cliente.id), eq(push_subscriptions.active, true)));

            for (const sub of customerPushSubs) {
              const [pushNotif] = await db.insert(incident_notifications).values({
                incidentId: incidente.id,
                customerId: cliente.id,
                channel: "push",
                status: "queued",
                attemptedAt: new Date()
              }).returning();

              await db.update(incident_notifications)
                .set({ status: "sending" })
                .where(eq(incident_notifications.id, pushNotif.id));

              const pushRes = await webPushService.sendNotification(sub.endpoint, {
                title: `⚠️ COMUNICADO DE REDE [${incidente.id}]`,
                body: `Oscilação de rede detectada na sua região. Previsão de normalização: ${incidente.previsaoRetorno}.`,
                data: { incidentId: incidente.id, url: '/portal/suporte' }
              });

              if (pushRes.sucesso) {
                enviadosReal++;
                await db.update(incident_notifications).set({
                  status: "sent",
                  providerMessageId: `push_${Date.now()}`,
                  sentAt: new Date()
                }).where(eq(incident_notifications.id, pushNotif.id));
              } else {
                falhasReal++;
                await db.update(incident_notifications).set({
                  status: "failed",
                  failedAt: new Date(),
                  errorCode: pushRes.status,
                  errorMessage: pushRes.mensagem
                }).where(eq(incident_notifications.id, pushNotif.id));
              }
            }
          } catch (pushErr: any) {
            console.warn(`[NOC Incidentes] Falha ao processar push para cliente #${cliente.id}:`, pushErr.message);
          }
        }
      }

      // Atualiza o contador de notificações enviadas no banco e memória
      incidente.notificacoesEnviadas += enviadosReal;

      if (isDatabaseConnected) {
        try {
          await db.update(incidentes_rede)
            .set({
              notificacoesEnviadas: sql`${incidentes_rede.notificacoesEnviadas} + ${enviadosReal}`,
              updatedAt: new Date()
            })
            .where(eq(incidentes_rede.id, incidente.id));
        } catch (dbUpErr: any) {
          console.warn(`[NOC Incidentes] Falha ao atualizar contador no PostgreSQL: ${dbUpErr.message}`);
        }
      }

      // Atualiza na memória
      const memIdx = incidentesRedeMemoria.findIndex(i => i.id === incidente!.id);
      if (memIdx !== -1) {
        incidentesRedeMemoria[memIdx].notificacoesEnviadas += enviadosReal;
      }

      if (registrarAuditoria) {
        registrarAuditoria({
          usuario: (req as any).user?.email || "operador_noc",
          modulo: "NOC & Incidentes",
          acao: `Disparo de Alertas Incidente ${incidente.id}`,
          detalhes: `Disparo executado para clientes da região. Enviados comprovados: ${enviadosReal}, Falhas: ${falhasReal}.`,
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
        mensagem: `Alerta transmitido: ${enviadosReal} notificações comprovadamente entregues (${falhasReal} falhas).`,
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
  router.get('/incidentes/verificar-cliente', async (req, res) => {
    const { bairro = "", cidade = "" } = req.query as { bairro?: string; cidade?: string };

    let incidentesParaChecagem: IncidenteRede[] = incidentesRedeMemoria;
    if (isDatabaseConnected) {
      try {
        const rows = await db.select().from(incidentes_rede).where(eq(incidentes_rede.status, 'em_reparo'));
        if (rows.length > 0) {
          incidentesParaChecagem = rows.map(mapDbToIncidente);
        }
      } catch {}
    }

    const incidenteAtivo = incidentesParaChecagem.find(inc => {
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
