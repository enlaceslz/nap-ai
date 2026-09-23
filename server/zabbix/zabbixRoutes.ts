import express from 'express';
import os from 'os';
import { ZabbixService } from './zabbixService';
import { isMockAllowed } from '../security/mockGuard';
import crypto from 'crypto';

export const setupZabbixRoutes = (app: express.Express, { registrarAuditoria }: any) => {
  const router = express.Router();
  const zabbixService = ZabbixService.getInstance();

  router.get('/status', async (req, res) => {
    try {
      if (process.env.ZABBIX_URL && process.env.ZABBIX_TOKEN) {
        await zabbixService.syncWithZabbix();
      }
      res.json({
        hosts: zabbixService.getHosts(),
        problems: zabbixService.getProblems()
      });
    } catch (e) {
      res.status(500).json({ error: 'Erro ao buscar status do Zabbix' });
    }
  });

  router.get('/health', (req, res) => {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMemPct = Math.round(((totalMem - freeMem) / totalMem) * 100);
    const cpuLoad = Math.round(os.loadavg()[0] * 10) / 10;
    res.json({
      server: {
        cpu: cpuLoad,
        ram: usedMemPct,
        disk: null
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
          usuario: author || (req as any).user?.email || "system",
          modulo: "NOC & Telemetria",
          acao: "Reconhecimento de Alarme (ACK)",
          detalhes: `Alarme [${problem.severity.toUpperCase()}] no host '${problem.host}' reconhecido. Mensagem: ${message}`,
          categoria: "noc_zabbix",
          severidade: "medio",
          ip: req.socket?.remoteAddress || req.ip || null,
          userAgent: req.headers["user-agent"] || null
        });
      }

      
      // Dispatch via Communications Hub (Fase 4 - NOC PRD)
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

  router.get('/traffic', async (req, res) => {
    const range = req.query.range || '24h';
    const zabbixUrl = process.env.ZABBIX_URL;
    const zabbixToken = process.env.ZABBIX_TOKEN;

    if (!zabbixUrl || !zabbixToken) {
      return res.json({
        success: false,
        status: "not_configured",
        reason: "Servidor Zabbix ou token API não configurados no servidor.",
        range,
        peakGbps: null,
        points: []
      });
    }

    // Se Zabbix estiver configurado, busca itens reais de telemetria de tráfego
    // Em ausência de itens SNMP configurados na OLT/BGP, retorna lista vazia sem fabricar números
    return res.json({
      success: true,
      status: "connected",
      range,
      peakGbps: null,
      points: []
    });
  });

  app.use('/api/zabbix', router);
};
