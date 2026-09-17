import { Router } from 'express';
import { IPAMService } from './service';

export function setupIpamRoutes() {
  const router = Router();
  const service = new IPAMService();

  // PREFIXES
  router.post('/prefixes', async (req, res) => {
    try {
      const result = await service.createPrefix(req.body, req.headers['x-user-id'] as string || 'api');
      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/prefixes/delegate', async (req, res) => {
    try {
      const { parentPrefixId, customerId, prefixLength } = req.body;
      const result = await service.delegateIPv6Prefix(parentPrefixId, customerId, prefixLength, req.headers['x-user-id'] as string || 'api');
      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ADDRESSES
  router.post('/addresses/allocate', async (req, res) => {
    try {
      const { prefixId, address, customerId } = req.body;
      const result = await service.allocateIP(prefixId, address, customerId, req.headers['x-user-id'] as string || 'api');
      res.status(201).json({ success: true, reservation: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/addresses/allocate-next', async (req, res) => {
    try {
      const { prefixId, customerId, purpose } = req.body;
      const result = await service.allocateNextAvailableIP(prefixId, customerId, purpose, req.headers['x-user-id'] as string || 'api');
      res.status(201).json({ success: true, reservation: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // VLANS & VRFS
  router.post('/vlans', async (req, res) => {
    try {
      const result = await service.createVlan(req.body, req.headers['x-user-id'] as string || 'api');
      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/vrfs', async (req, res) => {
    try {
      const result = await service.createVrf(req.body, req.headers['x-user-id'] as string || 'api');
      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // DEVICES & INTERFACES
  router.post('/devices', async (req, res) => {
    try {
      const result = await service.createDevice(req.body, req.headers['x-user-id'] as string || 'api');
      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/interfaces', async (req, res) => {
    try {
      const result = await service.createInterface(req.body, req.headers['x-user-id'] as string || 'api');
      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // INTERNET (ASN, BGP, CIRCUITS)
  router.post('/asn', async (req, res) => {
    try {
      const result = await service.createASN(req.body, req.headers['x-user-id'] as string || 'api');
      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/bgp', async (req, res) => {
    try {
      const result = await service.createBGP(req.body, req.headers['x-user-id'] as string || 'api');
      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/circuits', async (req, res) => {
    try {
      const result = await service.createCircuit(req.body, req.headers['x-user-id'] as string || 'api');
      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // NAUTOBOT WEBHOOKS
  router.post('/webhooks/nautobot', async (req, res) => {
    console.log('[NAUTOBOT WEBHOOK] Payload recebido:', req.body);
    res.json({ success: true, message: 'Webhook received' });
  });

  return router;
}
