import express from 'express';
import { FieldService } from './fieldService';

export const setupFieldRoutes = (app: express.Express, { registrarAuditoria }: any) => {
  const router = express.Router();
  const fieldService = FieldService.getInstance();

  // List all Work Orders (used by both N1/NOC and Field Techs PWA)
  router.get('/os', (req, res) => {
    try {
      const orders = fieldService.getWorkOrders();
      res.json({ success: true, workOrders: orders });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Create a new OS (Usually triggered by NOC or CRM)
  router.post('/os', (req, res) => {
    try {
      const newOs = fieldService.createOS(req.body);
      
      if (registrarAuditoria) {
         registrarAuditoria({
            usuario: req.body.assignedTo || "Sistema",
            modulo: "Field Service / SGP",
            acao: "Criação de OS",
            detalhes: `OS ${newOs.osNumber} criada. Problema: ${newOs.problem}`,
            categoria: "suporte",
            severidade: newOs.priority === 'critical' ? 'critico' : 'normal',
            ip: req.ip || "127.0.0.1",
            userAgent: req.headers["user-agent"]
         });
      }

      res.json({ success: true, os: newOs });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Update OS Status (Typically triggered by Field Tech PWA or Telegram)
  router.patch('/os/:id/status', (req, res) => {
    try {
      const { id } = req.params;
      const { status, userId, comment } = req.body;
      
      const updated = fieldService.updateOsStatus(id, status, userId || 'Desconhecido', comment);
      
      if (!updated) {
        return res.status(404).json({ error: 'Ordem de serviço não encontrada.' });
      }

      if (registrarAuditoria) {
         registrarAuditoria({
            usuario: userId || "Técnico",
            modulo: "Field Service / SGP",
            acao: "Atualização de OS",
            detalhes: `A OS ${updated.osNumber} mudou para o status [${status}]. Comentário: ${comment || 'N/A'}`,
            categoria: "suporte",
            severidade: "medio",
            ip: req.ip || "127.0.0.1",
            userAgent: req.headers["user-agent"]
         });
      }

      // Despacho Automático de evento para o Communications Hub (Notificando o NOC de que a OS andou)
      fetch('http://127.0.0.1:3000/api/communications/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           severity: 'info',
           message: `🔧 <b>[Update de OS em Campo]</b>\nA Ordem de Serviço ${updated.osNumber} foi atualizada para o status: <b>${status.toUpperCase()}</b>.\nNota: ${comment || 'Sem nota.'}`,
           requiredRoles: ['noc', 'admin', 'engenharia']
        })
      }).catch(() => {}); // fire and forget

      res.json({ success: true, os: updated });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.use('/api/field', router);
};
