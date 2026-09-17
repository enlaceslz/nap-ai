import { Router } from 'express';
import { CorrelationEngine } from './engine';

export function setupCorrelationRoutes() {
  const router = Router();
  const engine = new CorrelationEngine();

  // FASES 10, 11 e 12: Contexto unificado
  router.get('/customer-context/:id', async (req, res) => {
    try {
      const context = await engine.getCustomerContext(Number(req.params.id));
      res.json(context);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Zabbix Webhook (Gatilho para correlação e abertura de Ticket)
  router.post('/webhooks/zabbix', async (req, res) => {
    try {
      const result = await engine.processNetworkAlarm(req.body);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
