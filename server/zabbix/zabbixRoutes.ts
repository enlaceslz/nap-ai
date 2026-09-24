import express from 'express';
import os from 'os';
import axios from 'axios';
import { ZabbixService, normalizeZabbixApiUrl } from './zabbixService';
import { requireAuth } from '../auth/rbacMiddleware';

export const setupZabbixRoutes = (app: express.Express, { registrarAuditoria }: any = {}) => {
  const router = express.Router();
  const zabbixService = ZabbixService.getInstance();

  // Status de Conexão Real (Estados: not_configured, connecting, connected, unavailable, authentication_failed, error)
  router.get('/connection-status', async (req, res) => {
    try {
      const realStatus = await zabbixService.checkRealConnectionStatus();
      return res.json({
        sucesso: realStatus.status === 'connected',
        ...realStatus
      });
    } catch (e: any) {
      return res.status(500).json({
        sucesso: false,
        status: 'error',
        details: e.message
      });
    }
  });

  router.get('/status', async (req, res) => {
    try {
      const connection = await zabbixService.checkRealConnectionStatus();
      if (connection.status === 'connected') {
        await zabbixService.syncWithZabbix();
      }
      res.json({
        connectionStatus: connection.status,
        connectionDetails: connection.details,
        version: connection.version,
        hosts: zabbixService.getHosts(),
        problems: zabbixService.getProblems()
      });
    } catch (e: any) {
      res.status(500).json({ error: 'Erro ao buscar status do Zabbix', details: e.message });
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

  router.post('/ack', async (req, res) => {
    try {
      const { id, message, author } = req.body;
      if (!id || !message || !author) {
        return res.status(400).json({ error: 'Dados inválidos para ACK' });
      }

      const problem = zabbixService.acknowledgeProblem(Number(id), message, author);
      if (!problem) {
        return res.status(404).json({ error: 'Alarme não encontrado' });
      }

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
    } catch (e: any) {
      res.status(500).json({ error: 'Erro ao reconhecer alarme', details: e.message });
    }
  });

  // BLOQUEADOR 6: Simulação de Triggers TERMINANTEMENTE PROIBIDA em Produção
  router.post('/test-trigger', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Simulação de trigger desabilitada em ambiente de produção (NODE_ENV=production).',
        code: 'TRIGGER_SIMULATION_FORBIDDEN',
        status: 'forbidden'
      });
    }

    try {
      const { hostId, severity, message } = req.body;
      const problem = zabbixService.simulateTrigger(Number(hostId), severity, message);
      if (!problem) {
        return res.status(404).json({ error: 'Host não encontrado para simulação' });
      }
      res.json({ success: true, problem });
    } catch (e: any) {
      res.status(500).json({ error: 'Erro ao simular trigger', details: e.message });
    }
  });

  // BLOQUEADOR 6 & REGRA 17: Telemetria de Tráfego Semântica
  router.get('/traffic', async (req, res) => {
    const range = req.query.range || '24h';
    const zabbixUrl = process.env.ZABBIX_URL;
    const zabbixToken = process.env.ZABBIX_TOKEN;

    if (!zabbixUrl || !zabbixToken) {
      return res.json({
        success: false,
        status: "not_configured",
        telemetry: "telemetry_unavailable",
        reason: "Servidor Zabbix ou token API não configurados no ambiente.",
        range,
        peakGbps: null,
        points: []
      });
    }

    try {
      // Testar conectividade com o Zabbix JSON-RPC usando URL normalizada
      const apiUrl = normalizeZabbixApiUrl(zabbixUrl);
      const checkRes = await axios.post(
        apiUrl,
        {
          jsonrpc: '2.0',
          method: 'apiinfo.version',
          params: [],
          id: 1
        },
        { timeout: 3000 }
      );

      if (!checkRes.data || checkRes.data.error) {
        return res.json({
          success: false,
          status: "unavailable",
          telemetry: "telemetry_unavailable",
          reason: `Zabbix API retornou erro: ${checkRes.data?.error?.data || 'Falha de autenticação'}`,
          range,
          peakGbps: null,
          points: []
        });
      }

      // Conectado com sucesso ao Zabbix. Como não há itens SNMP de histórico configurados para o gráfico agregado:
      return res.json({
        success: true,
        status: "connected",
        telemetry: "telemetry_unavailable",
        reason: "Zabbix conectado. Nenhum item SNMP de tráfego agregado configurado para o intervalo.",
        range,
        peakGbps: null,
        points: []
      });
    } catch (err: any) {
      return res.json({
        success: false,
        status: "unavailable",
        telemetry: "telemetry_unavailable",
        reason: `Falha ao conectar no host Zabbix (${zabbixUrl}): ${err.message}`,
        range,
        peakGbps: null,
        points: []
      });
    }
  });

  app.use('/api/zabbix', router);
};
