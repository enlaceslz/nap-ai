const fs = require('fs');

let code = `import express from 'express';
import { CrmService } from './crmService';

export const setupCrmRoutes = (app: express.Express, { registrarAuditoria }: any) => {
  const router = express.Router();
  const crmService = CrmService.getInstance();

  router.get('/deals', async (req, res) => {
    try {
      const deals = await crmService.getDeals();
      res.json(deals);
    } catch (e) {
      res.status(500).json({ error: 'Erro ao buscar deals' });
    }
  });

  router.post('/deals', async (req, res) => {
    try {
      const newDeal = await crmService.addDeal(req.body);
      
      if (registrarAuditoria) {
        registrarAuditoria({
          usuario: "Operador (API)",
          modulo: "CRM 360",
          acao: "Criação de Deal",
          detalhes: \`Novo card criado no pipeline \${newDeal.pipeline}: \${newDeal.titulo}\`,
          categoria: "sgp_crm",
          severidade: "info",
          ip: req.ip || "127.0.0.1",
          userAgent: req.headers["user-agent"] || "CRM"
        });
      }

      res.json(newDeal);
    } catch (e) {
      res.status(500).json({ error: 'Erro ao criar deal' });
    }
  });

  router.patch('/deals/:id', async (req, res) => {
    try {
      const { estagio } = req.body;
      const deal = await crmService.updateDealStage(Number(req.params.id), estagio);
      if (!deal) return res.status(404).json({ error: 'Deal não encontrado' });
      res.json(deal);
    } catch (e) {
      res.status(500).json({ error: 'Erro ao atualizar deal' });
    }
  });

  router.post('/deals/:id/waba-trigger', (req, res) => {
    try {
      const { template, template_nome } = req.body;
      
      if (registrarAuditoria) {
        registrarAuditoria({
          usuario: "WABA System",
          modulo: "CRM 360",
          acao: "Disparo de Template WABA",
          detalhes: \`Template WABA disparado para Deal #\${req.params.id}.\`,
          categoria: "waba",
          severidade: "info",
          ip: "127.0.0.1",
          userAgent: "WABA Backend"
        });
      }
      res.json({ success: true, message: 'Disparo WABA realizado' });
    } catch (e) {
      res.status(500).json({ error: 'Erro ao disparar WABA' });
    }
  });

  // Régua de Cobrança SGP
  router.post('/erp/cron/regua-cobranca', (req, res) => {
    crmService.executeBillingRule();
    if (registrarAuditoria) {
      registrarAuditoria({
        usuario: "SGP System (CRON)",
        modulo: "SGP Cobrança",
        acao: "Execução Régua de Cobrança",
        detalhes: "Rotina executada para bloqueios por atraso > 15 dias.",
        categoria: "sgp_crm",
        severidade: "medio",
        ip: "127.0.0.1",
        userAgent: "SGP Backend"
      });
    }
    res.json({ success: true, message: 'Régua de cobrança executada' });
  });

  // Handoff Inbox -> CRM
  router.post('/waba/handoff', async (req, res) => {
    const { protocolo, numero, nome, resumo_ia } = req.body;
    
    const newDeal = await crmService.addDeal({
      titulo: \`Handoff: \${protocolo}\`,
      contato: nome || 'Cliente WABA',
      telefone: numero,
      estagio: 'Novo Chamado',
      pipeline: 'Suporte',
      prioridade: 2,
      contexto_ia: resumo_ia || 'Handoff gerado pela IA (WABA).'
    });

    if (registrarAuditoria) {
      registrarAuditoria({
        usuario: "Gemini AI",
        modulo: "WABA Inbox",
        acao: "Handoff IA -> Humano",
        detalhes: \`Handoff realizado para o ticket \${newDeal.id} (\${nome}).\`,
        categoria: "waba",
        severidade: "info",
        ip: req.ip || "127.0.0.1",
        userAgent: req.headers["user-agent"] || "WABA Backend"
      });
    }

    res.json({ success: true, dealId: newDeal.id });
  });

  app.use('/api', router);
};
`;
fs.writeFileSync('server/crm/crmRoutes.ts', code, 'utf8');
console.log('crmRoutes.ts updated for async db functions');
