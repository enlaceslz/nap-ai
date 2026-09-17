import { Router } from 'express';
import { HelpDeskService } from './service';

export function setupHelpDeskRoutes() {
  const router = Router();
  const service = new HelpDeskService();

  // TICKETS
  router.post('/tickets', async (req, res) => {
    try {
      const ticket = await service.createTicket(req.body, req.headers['x-user-id'] as string || 'api');
      res.status(201).json({ success: true, ticket });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get('/tickets', async (req, res) => {
    try {
      const tickets = await service.getTickets();
      res.json({ success: true, tickets });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/tickets/:id/close', async (req, res) => {
    try {
      const ticket = await service.closeTicket(Number(req.params.id), req.headers['x-user-id'] as string || 'api');
      res.json({ success: true, ticket });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // WORK ORDERS
  router.post('/work-orders', async (req, res) => {
    try {
      const wo = await service.createWorkOrder(req.body, req.headers['x-user-id'] as string || 'api');
      res.status(201).json({ success: true, workOrder: wo });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get('/work-orders', async (req, res) => {
    try {
      const wos = await service.getWorkOrders();
      res.json({ success: true, workOrders: wos });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/work-orders/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      const wo = await service.updateWorkOrderStatus(Number(req.params.id), status, req.headers['x-user-id'] as string || 'api');
      res.json({ success: true, workOrder: wo });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // WEBHOOK ZAMMAD
  router.post('/webhooks/zammad', async (req, res) => {
    // 1. Validar origem / token
    // 2. Atualizar DB NAP local
    console.log('[ZAMMAD WEBHOOK] Payload recebido:', req.body);
    res.json({ success: true, message: 'Webhook received' });
  });

  return router;
}
