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
  concentradorOuOlt: string | null;
  clientesAfetadosAprox: number;
  status: "em_reparo" | "identificado" | "normalizado";
  previsaoRetorno: string;
  iniciadoEm: string;
  protocoloAnatel: string;
  descricao: string;
  autoInterceptarAtendimento: boolean;
  notificacoesEnviadas: number;
}

/**
 * Converte registro do banco PostgreSQL para a interface de domínio IncidenteRede
 */
function mapDbToIncidente(row: any): IncidenteRede {
  let regioes: string[] = [];
  try {
    regioes = typeof row.regioesAfetadas === 'string' ? JSON.parse(row.regioesAfetadas) : (row.regioesAfetadas || []);
  } catch {
    regioes = [row.regioesAfetadas || ''];
  }

  return {
    id: row.id,
    titulo: row.titulo,
    tipo: row.tipo as any,
    regioesAfetadas: regioes,
    concentradorOuOlt: row.concentradorOlt || null,
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

  // 1. Listar Incidentes (100% Persistente no PostgreSQL — BLOQUEADOR: ZERO Fallback Operacional em Memória)
  router.get('/incidentes', async (req, res) => {
    if (!isDatabaseConnected) {
      return res.status(503).json({
        sucesso: false,
        status: "database_unavailable",
        erro: "Banco de dados PostgreSQL indisponível. Operação cancelada para garantir integridade e rastreabilidade."
      });
    }

    try {
      const rows = await db.select().from(incidentes_rede).orderBy(desc(incidentes_rede.createdAt));
      const list = rows.map(mapDbToIncidente);
      return res.json({
        sucesso: true,
        total: list.length,
        incidentes: list
      });
    } catch (err: any) {
      console.error(`[NOC Incidentes] Erro ao consultar PostgreSQL: ${err.message}`);
      return res.status(503).json({
        sucesso: false,
        status: "database_unavailable",
        erro: `Falha na consulta de incidentes ao banco de dados: ${err.message}`
      });
    }
  });

  // 2. Criar novo Incidente (Persistência Exclusiva PostgreSQL com UUID Criptográfico)
  router.post('/incidentes', async (req, res) => {
    if (!isDatabaseConnected) {
      return res.status(503).json({
        sucesso: false,
        status: "database_unavailable",
        erro: "Banco de dados PostgreSQL indisponível. O registro de incidente exige persistência obrigatória."
      });
    }

    const { titulo, tipo, regioesAfetadas, concentradorOuOlt, clientesAfetadosAprox, previsaoRetorno, descricao } = req.body;
    
    // Identificador persistente e único gerado via UUID v4 — NÃO utilizar Date.now() slicing
    const incidentId = `INC-${crypto.randomUUID()}`;
    const protocolo = `ANT-${new Date().getFullYear()}-${crypto.randomInt(100000, 999999)}`;
    const iniciadoEm = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + " (Hoje)";
    const regioesArray = Array.isArray(regioesAfetadas) ? regioesAfetadas : (regioesAfetadas ? [String(regioesAfetadas)] : []);

    try {
      const [inserted] = await db.insert(incidentes_rede).values({
        id: incidentId,
        titulo: titulo || "Oscilação de Rede Detectada",
        tipo: tipo || "rompimento_fibra",
        regioesAfetadas: JSON.stringify(regioesArray),
        concentradorOlt: concentradorOuOlt || null,
        clientesAfetados: Number(clientesAfetadosAprox) || 0,
        status: "em_reparo",
        previsaoRetorno: previsaoRetorno || "Em até 2 horas",
        iniciadoEm,
        protocolo,
        descricao: descricao || "Manutenção corretiva em andamento.",
        autoInterceptar: true,
        notificacoesEnviadas: 0
      }).returning();

      const novoIncidente = mapDbToIncidente(inserted);

      if (registrarAuditoria) {
        registrarAuditoria({
          usuario: (req as any).user?.email || "operador_noc",
          modulo: "NOC & Incidentes",
          acao: `Registro de Incidente ${novoIncidente.id}`,
          detalhes: `Incidente registrado no PostgreSQL: ${novoIncidente.titulo}. Regiões: ${novoIncidente.regioesAfetadas.join(', ')}.`,
          categoria: "noc_zabbix",
          severidade: "alto",
          ip: req.ip || null,
          userAgent: (req.headers["user-agent"] as string) || null,
          payloadDepois: novoIncidente
        });
      }

      return res.status(201).json({ sucesso: true, incidente: novoIncidente });
    } catch (err: any) {
      console.error(`[NOC Incidentes] Falha ao persistir incidente no PostgreSQL: ${err.message}`);
      return res.status(503).json({
        sucesso: false,
        status: "database_unavailable",
        erro: `Falha ao gravar incidente no banco de dados: ${err.message}`
      });
    }
  });

  // 3. Atualizar Incidente (Persistência Exclusiva PostgreSQL)
  router.patch('/incidentes/:id', async (req, res) => {
    if (!isDatabaseConnected) {
      return res.status(503).json({
        sucesso: false,
        status: "database_unavailable",
        erro: "Banco de dados PostgreSQL indisponível. Operação de atualização cancelada."
      });
    }

    const { id } = req.params;
    const { status, previsaoRetorno, descricao, autoInterceptarAtendimento } = req.body;

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

      if (!updated) {
        return res.status(404).json({ sucesso: false, erro: "Incidente não encontrado no banco de dados." });
      }

      const incidenteAtualizado = mapDbToIncidente(updated);

      if (registrarAuditoria) {
        registrarAuditoria({
          usuario: (req as any).user?.email || "operador_noc",
          modulo: "NOC & Incidentes",
          acao: `Atualização de Incidente ${id}`,
          detalhes: `Status atualizado: ${status || 'inalterado'}. Previsão: ${previsaoRetorno || 'inalterada'}.`,
          categoria: "noc_zabbix",
          severidade: "medio",
          ip: req.ip || null,
          userAgent: (req.headers["user-agent"] as string) || null,
          payloadDepois: incidenteAtualizado
        });
      }

      return res.json({ sucesso: true, incidente: incidenteAtualizado });
    } catch (err: any) {
      return res.status(503).json({
        sucesso: false,
        status: "database_unavailable",
        erro: `Falha ao atualizar incidente no PostgreSQL: ${err.message}`
      });
    }
  });

  // 4. Disparo Real de Notificações com Seleção Geográfica Real e Status Individual
  // BLOQUEADORES: Clientes reais sem .limit() artificial; Status individual; WebPush sem fabricar providerMessageId.
  router.post('/incidentes/:id/notificar-massa', async (req, res) => {
    if (!isDatabaseConnected) {
      return res.status(503).json({
        sucesso: false,
        status: "database_unavailable",
        enviados: 0,
        motivo: "Banco de dados PostgreSQL indisponível. Disparo cancelado para preservar rastreabilidade."
      });
    }

    const { id } = req.params;
    let incidente: IncidenteRede | null = null;

    try {
      const [row] = await db.select().from(incidentes_rede).where(eq(incidentes_rede.id, id)).limit(1);
      if (!row) {
        return res.status(404).json({ sucesso: false, erro: "Incidente não encontrado no banco de dados." });
      }
      incidente = mapDbToIncidente(row);
    } catch (dbErr: any) {
      return res.status(503).json({
        sucesso: false,
        status: "database_unavailable",
        erro: `Falha ao carregar incidente: ${dbErr.message}`
      });
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

    // REGRA V7: Seleção baseada estritamente em dados reais do cadastro
    // Não selecionar artificialmente com LIMIT N. Validar se há critérios geográficos resolvíveis.
    const conditions: any[] = [];
    for (const reg of incidente.regioesAfetadas) {
      const cleanReg = (reg || '').trim();
      if (
        cleanReg &&
        cleanReg.length >= 3 &&
        cleanReg.toLowerCase() !== 'região geral' &&
        cleanReg.toLowerCase() !== 'todas' &&
        cleanReg.toLowerCase() !== 'geral'
      ) {
        const pattern = `%${cleanReg.toLowerCase()}%`;
        conditions.push(sql`LOWER(${clientes.bairro}) LIKE ${pattern}`);
        conditions.push(sql`LOWER(${clientes.cidade}) LIKE ${pattern}`);
        conditions.push(sql`LOWER(${clientes.endereco}) LIKE ${pattern}`);
        conditions.push(sql`LOWER(${clientes.cep}) LIKE ${pattern}`);
      }
    }

    // Se o incidente tiver concentrador/OLT especificado
    if (incidente.concentradorOuOlt && incidente.concentradorOuOlt.trim().length >= 3) {
      const oltPattern = `%${incidente.concentradorOuOlt.trim().toLowerCase()}%`;
      conditions.push(sql`LOWER(${clientes.endereco}) LIKE ${oltPattern}`);
    }

    // Se não há critérios de região específicos: retornar affected_clients_unresolved (NÃO inventar clientes)
    if (conditions.length === 0) {
      return res.status(422).json({
        sucesso: false,
        status: "affected_clients_unresolved",
        enviados: 0,
        falhas: 0,
        motivo: `Critérios geográficos e de infraestrutura insuficientes para determinar clientes afetados (${incidente.regioesAfetadas.join(', ')}). Nenhum envio executado para evitar notificações indevidas.`
      });
    }

    try {
      // Busca todos os clientes reais que coincidem com os critérios das regiões afetadas
      const clientesAlvo = await db.select({
        id: clientes.id,
        nome: clientes.nome,
        telefone: clientes.telefone,
        endereco: clientes.endereco,
        bairro: clientes.bairro,
        cidade: clientes.cidade
      }).from(clientes)
        .where(and(sql`${clientes.deletedAt} IS NULL`, sql`(${sql.join(conditions, sql` OR `)})`));

      if (clientesAlvo.length === 0) {
        return res.json({
          sucesso: false,
          status: "affected_clients_unresolved",
          enviados: 0,
          falhas: 0,
          motivo: `Nenhum cliente cadastrado no banco coincide com as regiões ou infraestrutura do incidente (${incidente.regioesAfetadas.join(', ')}).`,
          incidente
        });
      }

      let enviadosWhatsapp = 0;
      let aceitosWebPush = 0;
      let falhasReal = 0;
      const textoAlerta = `⚠️ COMUNICADO DE REDE [${incidente.id}]: Prezado cliente, identificamos uma oscilação na fibra óptica (${incidente.regioesAfetadas.join(', ')}). Equipe técnica no local. Previsão de normalização: ${incidente.previsaoRetorno}.`;

      for (const cliente of clientesAlvo) {
        const cleanPhone = (cliente.telefone || '').replace(/\D/g, "");

        // Canal 1: WhatsApp Oficial (WABA)
        if (hasWaba && cleanPhone && cleanPhone.length >= 10) {
          const [notif] = await db.insert(incident_notifications).values({
            incidentId: incidente.id,
            customerId: cliente.id,
            recipientType: "cliente",
            recipientId: cliente.id,
            channel: "whatsapp",
            status: "processing",
            requestedAt: new Date(),
            attemptedAt: new Date(),
            attemptCount: 1
          }).returning();

          try {
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
              enviadosWhatsapp++;
              await db.update(incident_notifications).set({
                status: "sent",
                acceptedAt: new Date(),
                sentAt: new Date(),
                deliveredAt: null,
                providerMessageId: providerId
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

        // Canal 2: WebPush Notification Real (se configurado e cliente ISP possuir subscrição ativa vinculada a cliente_id)
        // REGRA V8: NUNCA assumir clientes.id == users.id. Busca estritamente por push_subscriptions.clienteId.
        if (hasPush) {
          try {
            const customerPushSubs = await db.select().from(push_subscriptions)
              .where(and(eq(push_subscriptions.clienteId, cliente.id), eq(push_subscriptions.active, true)));

            for (const sub of customerPushSubs) {
              const [pushNotif] = await db.insert(incident_notifications).values({
                incidentId: incidente.id,
                customerId: cliente.id,
                recipientType: "cliente",
                recipientId: cliente.id,
                subscriptionId: sub.id,
                channel: "push",
                status: "processing",
                requestedAt: new Date(),
                attemptedAt: new Date(),
                attemptCount: 1
              }).returning();

              const pushRes = await webPushService.sendNotification(sub.endpoint, {
                title: `⚠️ COMUNICADO DE REDE [${incidente.id}]`,
                body: `Oscilação de rede detectada na sua região. Previsão de normalização: ${incidente.previsaoRetorno}.`,
                data: { incidentId: incidente.id, url: '/portal/suporte' }
              });

              if (pushRes.sucesso) {
                aceitosWebPush++;
                // REGRA V8: O envio do WebPush pelo servidor sem erro significa que o serviço/provedor aceitou a solicitação.
                // Isso NÃO comprova que o dispositivo recebeu ou exibiu. Portanto: status = "accepted",
                // providerMessageId = NULL e deliveredAt = NULL. Nunca utilizar sent=entregue nem delivered sem confirmação.
                await db.update(incident_notifications).set({
                  status: "accepted",
                  acceptedAt: new Date(),
                  sentAt: null,
                  deliveredAt: null,
                  providerMessageId: null
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

      const totalTransmitidos = enviadosWhatsapp + aceitosWebPush;

      // Atualiza o contador de notificações enviadas/aceitas no PostgreSQL
      await db.update(incidentes_rede)
        .set({
          notificacoesEnviadas: sql`${incidentes_rede.notificacoesEnviadas} + ${totalTransmitidos}`,
          updatedAt: new Date()
        })
        .where(eq(incidentes_rede.id, incidente.id));

      if (registrarAuditoria) {
        registrarAuditoria({
          usuario: (req as any).user?.email || "operador_noc",
          modulo: "NOC & Incidentes",
          acao: `Disparo de Alertas Incidente ${incidente.id}`,
          detalhes: `Disparo executado para clientes da região. WhatsApp transmitido: ${enviadosWhatsapp}, WebPush aceito pelo serviço: ${aceitosWebPush}, Falhas: ${falhasReal}.`,
          categoria: "disparo",
          severidade: "medio",
          ip: req.ip || null,
          userAgent: (req.headers["user-agent"] as string) || null,
          payloadDepois: { incidentId: incidente.id, enviadosWhatsapp, aceitosWebPush, falhas: falhasReal }
        });
      }

      return res.json({
        sucesso: true,
        status: "completed",
        enviados: totalTransmitidos,
        enviadosWhatsapp,
        aceitosWebPush,
        falhas: falhasReal,
        totalAlvos: clientesAlvo.length,
        mensagem: `Alerta processado: ${enviadosWhatsapp} envios confirmados via WhatsApp e ${aceitosWebPush} aceitos pelo serviço WebPush (${falhasReal} falhas). Nenhuma entrega física em dispositivo é presumida sem confirmação real do cliente.`,
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

  // 5. Verificar se determinado cliente ou endereço está sob impacto de Incidente Ativo (PostgreSQL)
  router.get('/incidentes/verificar-cliente', async (req, res) => {
    if (!isDatabaseConnected) {
      return res.status(503).json({
        sucesso: false,
        status: "database_unavailable",
        erro: "Banco de dados PostgreSQL indisponível para checagem de incidentes."
      });
    }

    const { bairro = "", cidade = "" } = req.query as { bairro?: string; cidade?: string };

    try {
      const rows = await db.select().from(incidentes_rede).where(eq(incidentes_rede.status, 'em_reparo'));
      const incidentesAtivos = rows.map(mapDbToIncidente);

      const incidenteAtivo = incidentesAtivos.find(inc => {
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

      return res.json({ sobImpacto: false });
    } catch (err: any) {
      return res.status(503).json({
        sucesso: false,
        status: "database_unavailable",
        erro: `Erro na consulta de incidentes: ${err.message}`
      });
    }
  });

  app.use('/api', router);
};
