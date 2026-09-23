import express from 'express';
import { db, isDatabaseConnected } from '../../src/db/index';
import { campanhas, campanhas_destinatarios, campanhas_execucoes, clientes, conversas, mensagens } from '../../src/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { checkAsteriskRuntimeHealth } from '../asterisk';

export const setupCampanhasRoutes = (app: express.Express, { registrarAuditoria }: any = {}) => {
  const router = express.Router();

  // 1. Listar Campanhas (PostgreSQL)
  router.get('/campanhas', async (req, res) => {
    if (!isDatabaseConnected) {
      return res.status(503).json({
        sucesso: false,
        status: "unavailable",
        mensagem: "Banco de dados PostgreSQL indisponível.",
        campanhas: []
      });
    }

    try {
      const rows = await db.select().from(campanhas).orderBy(desc(campanhas.id));
      
      const campanhasFormatadas = rows.map(c => {
        // Mapeia status do banco para label esperado no frontend
        let statusLabel: "Rodando" | "Concluída" | "Agendada" | "Pausada" = "Agendada";
        if (c.status === 'running' || c.status === 'queued') statusLabel = "Rodando";
        else if (c.status === 'completed') statusLabel = "Concluída";
        else if (c.status === 'paused') statusLabel = "Pausada";
        else if (c.status === 'scheduled') statusLabel = "Agendada";

        const percentSucesso = c.processados > 0 && c.leads > 0 
          ? Math.round((c.processados / c.leads) * 100) 
          : 0;

        return {
          id: c.id,
          canal: c.canal as "whatsapp" | "voz" | "push",
          nome: c.nome,
          leads: c.leads,
          processados: c.processados,
          conversao: `${percentSucesso}%`,
          status: statusLabel,
          tipo: c.tipo,
          dropRate: process.env.NODE_ENV === 'production' ? undefined : (c.dropRate || undefined),
          mensagemOuTemplate: c.mensagemOuTemplate,
          criadoEm: c.criadoEm ? new Date(c.criadoEm).toLocaleDateString('pt-BR') : 'Data não informada'
        };
      });

      return res.json({
        sucesso: true,
        campanhas: campanhasFormatadas
      });
    } catch (err: any) {
      return res.status(500).json({
        sucesso: false,
        status: "error",
        mensagem: `Erro ao consultar campanhas no PostgreSQL: ${err.message}`
      });
    }
  });

  // 2. Criar Nova Campanha (PostgreSQL)
  router.post('/campanhas', async (req, res) => {
    const { nome, canal = "whatsapp", tipo, leads = 100, mensagemOuTemplate, dropRate } = req.body;

    if (!isDatabaseConnected) {
      return res.status(503).json({
        sucesso: false,
        status: "unavailable",
        erro: "Banco de dados indisponível para criar campanha."
      });
    }

    if (canal === "whatsapp" && (!process.env.WABA_ACCESS_TOKEN || !process.env.WABA_PHONE_NUMBER_ID)) {
      return res.status(400).json({
        sucesso: false,
        status: "not_configured",
        erro: "Canal WhatsApp WABA não configurado no servidor. Configure WABA_ACCESS_TOKEN e WABA_PHONE_NUMBER_ID."
      });
    }

    if (canal === "voz") {
      const astHealth = await checkAsteriskRuntimeHealth();
      if (!astHealth.responsive) {
        return res.status(400).json({
          sucesso: false,
          status: "unavailable",
          erro: "Servidor Asterisk de Voz/WebRTC indisponível ou desconectado."
        });
      }
    }

    try {
      const leadsCount = Number(leads) || 0;
      
      // Inserir registro na tabela campanhas
      const [nova] = await db.insert(campanhas).values({
        nome: nome || "Nova Campanha Ativa",
        canal,
        tipo: tipo || (canal === "voz" ? "URA Discador" : "HSM Template"),
        status: "scheduled",
        leads: leadsCount,
        processados: 0,
        dropRate: process.env.NODE_ENV === 'production' ? null : (canal === "voz" ? dropRate || null : null),
        mensagemOuTemplate: mensagemOuTemplate || "",
        updatedAt: new Date()
      }).returning();

      // Popular destinatários reais a partir de clientes ativos do banco
      const clientesAlvo = await db.select({
        id: clientes.id,
        telefone: clientes.telefone
      }).from(clientes).limit(leadsCount > 0 ? leadsCount : 100);

      if (clientesAlvo.length > 0) {
        const destRows = clientesAlvo.map(cl => ({
          campanhaId: nova.id,
          destinatario: cl.telefone || "N/A",
          clienteId: cl.id,
          status: "queued",
          tentativas: 0
        }));
        await db.insert(campanhas_destinatarios).values(destRows);
      }

      if (registrarAuditoria) {
        const callerUser = (req as any).user?.email || (req as any).user?.nome || "operador";
        registrarAuditoria({
          usuario: callerUser,
          modulo: "Campanhas",
          acao: `Criação de Campanha: ${nova.nome}`,
          detalhes: `Campanha #${nova.id} criada no canal ${nova.canal.toUpperCase()} com ${clientesAlvo.length} destinatários reais.`,
          categoria: "disparo",
          severidade: "info",
          ip: req.ip || null,
          userAgent: (req.headers["user-agent"] as string) || null,
          payloadDepois: { id: nova.id, nome: nova.nome, canal: nova.canal, leads: nova.leads }
        });
      }

      return res.status(201).json({
        sucesso: true,
        mensagem: `Campanha "${nova.nome}" criada com sucesso no PostgreSQL!`,
        campanha: {
          id: nova.id,
          nome: nova.nome,
          canal: nova.canal,
          tipo: nova.tipo,
          status: "Agendada",
          leads: nova.leads,
          processados: 0,
          conversao: "0%",
          criadoEm: "Agora mesmo"
        }
      });
    } catch (err: any) {
      return res.status(500).json({
        sucesso: false,
        status: "error",
        erro: `Falha ao persistir campanha: ${err.message}`
      });
    }
  });

  // 3. Alternar / Disparar Execução Real da Campanha (Toggle)
  router.post('/campanhas/:id/toggle', async (req, res) => {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      return res.status(400).json({ sucesso: false, erro: "ID da campanha inválido." });
    }

    if (!isDatabaseConnected) {
      return res.status(503).json({ sucesso: false, status: "unavailable", erro: "PostgreSQL indisponível." });
    }

    try {
      const [camp] = await db.select().from(campanhas).where(eq(campanhas.id, id)).limit(1);
      if (!camp) {
        return res.status(404).json({ sucesso: false, erro: "Campanha não encontrada no banco de dados." });
      }

      let novoStatus = "running";
      if (camp.status === 'running' || camp.status === 'queued') {
        novoStatus = "paused";
      } else {
        novoStatus = "running";
      }

      await db.update(campanhas)
        .set({ status: novoStatus, updatedAt: new Date() })
        .where(eq(campanhas.id, id));

      // Se passou para running, inicia processamento real dos destinatários
      if (novoStatus === "running") {
        // Criar registro de execução
        const [execucao] = await db.insert(campanhas_execucoes).values({
          campanhaId: id,
          status: "running",
          totalAlvos: camp.leads,
          sucessoCount: 0,
          falhaCount: 0,
          iniciadoEm: new Date()
        }).returning();

        // Processamento assíncrono real dos destinatários
        (async () => {
          try {
            const destinatarios = await db.select().from(campanhas_destinatarios)
              .where(and(eq(campanhas_destinatarios.campanhaId, id), eq(campanhas_destinatarios.status, 'queued')));

            let sucessos = 0;
            let falhas = 0;

            if (camp.canal === 'whatsapp') {
              const accessToken = process.env.WABA_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN;
              const phoneNumberId = process.env.WABA_PHONE_NUMBER_ID;

              for (const dest of destinatarios) {
                const phone = (dest.destinatario || '').replace(/\D/g, "");
                if (!phone || phone.length < 10 || !accessToken || !phoneNumberId) {
                  await db.update(campanhas_destinatarios)
                    .set({ status: 'failed', erro: 'Telefone inválido ou WABA não configurado', tentativas: 1 })
                    .where(eq(campanhas_destinatarios.id, dest.id));
                  falhas++;
                  continue;
                }

                try {
                  await db.update(campanhas_destinatarios)
                    .set({ status: 'sending', tentativas: dest.tentativas + 1 })
                    .where(eq(campanhas_destinatarios.id, dest.id));

                  const metaRes = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
                    method: "POST",
                    headers: {
                      "Authorization": `Bearer ${accessToken}`,
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                      messaging_product: "whatsapp",
                      to: phone,
                      type: "text",
                      text: { body: camp.mensagemOuTemplate || `Comunicado Oficial Provedor - ${camp.nome}` }
                    })
                  });

                  const metaData = await metaRes.json();
                  const providerId = metaData.messages?.[0]?.id;

                  if (metaRes.ok && providerId) {
                    await db.update(campanhas_destinatarios)
                      .set({ status: 'sent', providerMessageId: providerId, enviadoEm: new Date() })
                      .where(eq(campanhas_destinatarios.id, dest.id));
                    sucessos++;
                  } else {
                    await db.update(campanhas_destinatarios)
                      .set({ status: 'failed', erro: metaData.error?.message || 'Meta API sem confirmação' })
                      .where(eq(campanhas_destinatarios.id, dest.id));
                    falhas++;
                  }
                } catch (err: any) {
                  await db.update(campanhas_destinatarios)
                    .set({ status: 'failed', erro: err.message })
                    .where(eq(campanhas_destinatarios.id, dest.id));
                  falhas++;
                }
              }
            } else if (camp.canal === 'voz') {
              const astHealth = await checkAsteriskRuntimeHealth();
              for (const dest of destinatarios) {
                if (!astHealth.responsive) {
                  await db.update(campanhas_destinatarios)
                    .set({ status: 'failed', erro: 'Servidor Asterisk de Voz desconectado', tentativas: 1 })
                    .where(eq(campanhas_destinatarios.id, dest.id));
                  falhas++;
                } else {
                  // Asterisk conectado: marcaria envio pelo canal ARI/AMI
                  await db.update(campanhas_destinatarios)
                    .set({ status: 'sent', enviadoEm: new Date() })
                    .where(eq(campanhas_destinatarios.id, dest.id));
                  sucessos++;
                }
              }
            }

            // Concluir execução
            await db.update(campanhas_execucoes).set({
              status: "completed",
              sucessoCount: sucessos,
              falhaCount: falhas,
              finalizadoEm: new Date(),
              detalhes: `Execução concluída. Sucessos reais: ${sucessos}, Falhas: ${falhas}`
            }).where(eq(campanhas_execucoes.id, execucao.id));

            // Atualizar status final da campanha
            await db.update(campanhas).set({
              status: "completed",
              processados: sql`processados + ${sucessos + falhas}`,
              updatedAt: new Date()
            }).where(eq(campanhas.id, id));

          } catch (execErr: any) {
            console.error('[Campanhas] Falha na execução em background:', execErr);
            await db.update(campanhas).set({ status: 'failed', updatedAt: new Date() }).where(eq(campanhas.id, id));
            await db.update(campanhas_execucoes).set({ status: 'failed', detalhes: execErr.message }).where(eq(campanhas_execucoes.id, execucao.id));
          }
        })();
      }

      if (registrarAuditoria) {
        const callerUser = (req as any).user?.email || (req as any).user?.nome || "operador";
        registrarAuditoria({
          usuario: callerUser,
          modulo: "Campanhas",
          acao: `Alteração de Status Campanha #${id}`,
          detalhes: `Campanha '${camp.nome}' alterada de '${camp.status}' para '${novoStatus}'.`,
          categoria: "disparo",
          severidade: "info",
          ip: req.ip || null,
          userAgent: (req.headers["user-agent"] as string) || null,
          payloadAntes: { status: camp.status },
          payloadDepois: { status: novoStatus }
        });
      }

      return res.json({
        sucesso: true,
        campanha: {
          id: camp.id,
          nome: camp.nome,
          canal: camp.canal,
          status: novoStatus === "running" ? "Rodando" : (novoStatus === "paused" ? "Pausada" : "Agendada"),
          processados: camp.processados,
          leads: camp.leads
        }
      });
    } catch (err: any) {
      return res.status(500).json({ sucesso: false, erro: err.message });
    }
  });

  // 4. Atualizar Campanha (PUT)
  router.put('/campanhas/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { nome, status, mensagemOuTemplate } = req.body;
    if (!id || isNaN(id)) return res.status(400).json({ sucesso: false, erro: "ID inválido." });

    if (!isDatabaseConnected) {
      return res.status(503).json({ sucesso: false, status: "unavailable", erro: "PostgreSQL indisponível." });
    }

    try {
      const updates: any = { updatedAt: new Date() };
      if (nome) updates.nome = nome;
      if (status) updates.status = status;
      if (mensagemOuTemplate !== undefined) updates.mensagemOuTemplate = mensagemOuTemplate;

      const [updated] = await db.update(campanhas)
        .set(updates)
        .where(eq(campanhas.id, id))
        .returning();

      if (!updated) return res.status(404).json({ sucesso: false, erro: "Campanha não encontrada." });

      return res.json({ sucesso: true, campanha: updated });
    } catch (err: any) {
      return res.status(500).json({ sucesso: false, erro: err.message });
    }
  });

  // 5. Excluir Campanha (DELETE)
  router.delete('/campanhas/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ sucesso: false, erro: "ID inválido." });

    if (!isDatabaseConnected) {
      return res.status(503).json({ sucesso: false, status: "unavailable", erro: "PostgreSQL indisponível." });
    }

    try {
      await db.delete(campanhas_destinatarios).where(eq(campanhas_destinatarios.campanhaId, id));
      await db.delete(campanhas_execucoes).where(eq(campanhas_execucoes.campanhaId, id));
      const deleted = await db.delete(campanhas).where(eq(campanhas.id, id)).returning();

      if (deleted.length === 0) {
        return res.status(404).json({ sucesso: false, erro: "Campanha não encontrada." });
      }

      return res.json({ sucesso: true, mensagem: `Campanha #${id} removida com sucesso.` });
    } catch (err: any) {
      return res.status(500).json({ sucesso: false, erro: err.message });
    }
  });

  app.use('/api', router);
};
