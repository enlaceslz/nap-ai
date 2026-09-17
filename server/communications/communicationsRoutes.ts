import express from 'express';
import { CommunicationsService } from './communicationsService';

export const setupCommunicationsRoutes = (app: express.Express, { registrarAuditoria }: any) => {
  const router = express.Router();
  const commsService = CommunicationsService.getInstance();
  commsService.setAuditFunction(registrarAuditoria);

  // 1. Webhook endpoint para receber atualizações do Telegram
  router.post('/telegram/webhook', async (req, res) => {
    try {
      // Respond to Telegram immediately (200 OK) to prevent retries
      res.sendStatus(200);
      
      // Process update async
      await commsService.processWebhook(req.body);
    } catch (e) {
      console.error('[Communications Hub] Webhook Error:', e);
    }
  });

  // 2. Geração de código de vínculo (Utilizado pelo frontend do NAP)
  router.post('/telegram/bind', (req, res) => {
    try {
      const { userId, role } = req.body;
      if (!userId || !role) {
        return res.status(400).json({ error: 'Faltam parâmetros (userId, role)' });
      }

      const code = commsService.generateBindingCode(userId, role);
      res.json({ success: true, code });
    } catch (e) {
      res.status(500).json({ error: 'Erro interno ao gerar código' });
    }
  });

  // 3. Status e lista de vínculos (para Dashboard Admin)
  router.get('/telegram/status', (req, res) => {
    try {
      res.json({
        success: true,
        configured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
        bindings: commsService.getBindings()
      });
    } catch (e) {
      res.status(500).json({ error: 'Erro interno' });
    }
  });

  // 4. API Externa/Interna para disparo de notificações (consumido pelos módulos do NAP)
  router.post('/telegram/send', async (req, res) => {
    try {
      const { severity, message, requiredRoles } = req.body;
      await commsService.dispatchNotification({ severity, message, requiredRoles });
      res.json({ success: true, message: 'Notificação despachada' });
    } catch (e) {
      res.status(500).json({ error: 'Erro ao despachar notificação' });
    }
  });

  app.use('/api/communications', router);
};
