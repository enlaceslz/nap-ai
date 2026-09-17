const fs = require('fs');

let code = `import { Router } from 'express';
import { CommunicationsHub } from './hub';
import { CommunicationsService } from './communicationsService';

export function setupCommunicationRoutes() {
  const router = Router();
  const hub = new CommunicationsHub();
  const commsService = CommunicationsService.getInstance();

  router.post('/events', async (req, res) => {
    try {
      const { source, payload } = req.body;
      if (!source || !payload) {
        return res.status(400).json({ success: false, error: 'Source and payload required' });
      }
      const result = await hub.routeEvent(source, payload);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Webhook direto do Telegram (para o NocCopilot receber mensagens)
  router.post('/webhooks/telegram', async (req, res) => {
    console.log('[TELEGRAM BOT INCOMING]', req.body);
    try {
      res.status(200).send('OK');
      await commsService.processWebhook(req.body);
    } catch (e) {
      console.error('[Communications Hub] Webhook Error:', e);
    }
  });

  // Geração de código de vínculo (Utilizado pelo frontend do NAP)
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

  // Status e lista de vínculos (para Dashboard Admin)
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

  // API Externa/Interna para disparo de notificações (consumido pelos módulos do NAP)
  router.post('/telegram/send', async (req, res) => {
    try {
      const { severity, message, requiredRoles } = req.body;
      await commsService.dispatchNotification({ severity, message, requiredRoles });
      res.json({ success: true, message: 'Notificação despachada' });
    } catch (e) {
      res.status(500).json({ error: 'Erro ao despachar notificação' });
    }
  });

  return router;
}
`;

fs.writeFileSync('server/communications/routes.ts', code, 'utf8');
console.log('communications routes patched');
