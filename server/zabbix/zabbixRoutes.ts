import express from 'express';
import { ZabbixService } from './zabbixService';
import { isMockAllowed } from '../security/mockGuard';
import crypto from 'crypto';

export const setupZabbixRoutes = (app: express.Express, { registrarAuditoria }: any) => {
  const router = express.Router();
  const zabbixService = ZabbixService.getInstance();

  router.get('/status', (req, res) => {
    try {
      res.json({
        hosts: zabbixService.getHosts(),
        problems: zabbixService.getProblems()
      });
    } catch (e) {
      res.status(500).json({ error: 'Erro ao buscar status do Zabbix' });
    }
  });

  router.get('/health', (req, res) => {
    res.json({
      server: {
        cpu: 12,
        ram: 34,
        disk: 45
      }
    });
  });

  router.post('/ack', (req, res) => {
    try {
      const { id, message, author } = req.body;
      if (!id || !message || !author) {
        return res.status(400).json({ error: 'Dados inválidos para ACK' });
      }

      const problem = zabbixService.acknowledgeProblem(Number(id), message, author);
      if (!problem) {
        return res.status(404).json({ error: 'Alarme não encontrado' });
      }

      // Mandatory Audit Trail for Zabbix ACK (AGENTS.md Rule)
      if (registrarAuditoria) {
        registrarAuditoria({
          usuario: author,
          modulo: "NOC & Telemetria",
          acao: "Reconhecimento de Alarme (ACK)",
          detalhes: `Alarme [${problem.severity.toUpperCase()}] no host '${problem.host}' reconhecido. Mensagem: ${message}`,
          categoria: "noc_zabbix",
          severidade: "medio",
          ip: req.ip || "127.0.0.1",
          userAgent: req.headers["user-agent"] || "Zabbix NOC Console"
        });
      }

      
      // MOCK: Dispatch via Communications Hub (Fase 4 - NOC PRD)
      if (req.body.severity === 'critical') {
         fetch('http://127.0.0.1:3000/api/communications/telegram/send', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             severity: 'critical',
             message: `[Alerta Zabbix Gerado] ${message}\nHost: ${problem.host}\nHora: ${problem.time}`,
             requiredRoles: ['noc', 'admin', 'engenharia']
           })
         }).catch(() => {});
      }
      
      res.json({ success: true, problem });
    } catch (e) {
      res.status(500).json({ error: 'Erro ao reconhecer alarme' });
    }
  });

  router.post('/test-trigger', (req, res) => {
    try {
      const { hostId, severity, message } = req.body;
      const problem = zabbixService.simulateTrigger(Number(hostId), severity, message);
      if (!problem) {
        return res.status(404).json({ error: 'Host não encontrado para simulação' });
      }
      res.json({ success: true, problem });
    } catch (e) {
      res.status(500).json({ error: 'Erro ao simular trigger' });
    }
  });

    router.get('/traffic', (req, res) => {
    const range = req.query.range || '24h';
    if (!isMockAllowed()) {
      return res.status(503).json({
        success: false,
        status: "unavailable",
        reason: "real_data_source_unavailable",
        range,
        points: []
      });
    }

    const points = [];
    const now = Date.now();
    
    // Simulate 24 data points (apenas em dev/preview)
    for (let i = 24; i >= 0; i--) {
      const time = new Date(now - i * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const inGbps = 8 + (crypto.randomInt(0, 600) / 100); // Range 8-14 Gbps
      const outGbps = 2 + (crypto.randomInt(0, 300) / 100); // Range 2-5 Gbps
      points.push({ time, in: inGbps.toFixed(2), out: outGbps.toFixed(2) });
    }
    
    res.json({
      success: true,
      range,
      peakGbps: 14.8,
      points
    });
  });

  app.use('/api/zabbix', router);
};
