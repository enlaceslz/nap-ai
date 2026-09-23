import express from 'express';
import fetch from 'node-fetch'; // if available, or assume global fetch

export const setupGenieacsRoutes = (app: express.Express, { registrarAuditoria }: any) => {
  const router = express.Router();

  const callGenieAcs = async (endpoint: string, options: any = {}) => {
    const url = process.env.GENIEACS_URL;
    const user = process.env.GENIEACS_USER;
    const pass = process.env.GENIEACS_PASSWORD;

    if (!url) {
      throw new Error("GenieACS URL não configurada (GENIEACS_URL ausente)");
    }
    if (!user || !pass) {
      throw new Error("Credenciais do GenieACS não configuradas (GENIEACS_USER/GENIEACS_PASSWORD ausentes)");
    }

    const fullUrl = `${url.replace(/\/$/, '')}${endpoint}`;
    const auth = Buffer.from(`${user}:${pass}`).toString('base64');
  
    const res = await fetch(fullUrl, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) throw new Error(`GenieACS API erro: ${res.status} ${res.statusText}`);
    return res.json();
  };

  const mapGenieAcsDeviceToAppFormat = (raw: any) => {
    const di = raw['Device.DeviceInfo'] || raw['InternetGatewayDevice.DeviceInfo'] || {};
    const wan = raw['Device.WANDevice'] || raw['InternetGatewayDevice.WANDevice'] || {};
    const optical = raw['Device.Optical'] || {};
    const wlan = raw['InternetGatewayDevice.LANDevice.1.WLANConfiguration.1'] || {};

    let rssi: number | null = null;
    if (optical?.['OpticalSignalLevel']) {
      const parsed = parseFloat(optical['OpticalSignalLevel']) / 100;
      if (!isNaN(parsed)) rssi = parsed;
    }
    
    const hasLastInform = Boolean(raw._lastInform);
    const isOnline = hasLastInform && (Date.now() - new Date(raw._lastInform).getTime()) < 900000;

    return {
      _id: raw._id || '',
      serialNumber: di['SerialNumber'] || raw._id || '',
      mac: di['MACAddress'] || null,
      model: di['ModelName'] || di['ProductClass'] || null,
      vendor: di['Manufacturer'] || null,
      ip: wan['1.WANConnectionDevice.1.WANIPConnection.1.ExternalIPAddress'] || null,
      status: isOnline ? 'online' : 'offline',
      uptime: di['UpTime'] ? `${Math.floor(parseInt(di['UpTime']) / 86400)} dias` : null,
      ssid: wlan['SSID'] || null,
      wifiChannel: wlan['Channel'] ? parseInt(wlan['Channel']) : null,
      lanClients: null, 
      firmwareVersion: di['SoftwareVersion'] || null,
      rssi: rssi,
      tempLaser: optical['Temperature'] ? `${parseFloat(optical['Temperature']) / 100}°C` : null,
      vccVolts: optical['Voltage'] ? `${parseFloat(optical['Voltage']) / 1000}V` : null,
      lastInform: raw._lastInform || null,
      rxBytes: parseInt(wan['1.WANCommonInterfaceConfig.TotalBytesReceived']) || 0,
      txBytes: parseInt(wan['1.WANCommonInterfaceConfig.TotalBytesSent']) || 0
    };
  };

  router.get("/health", async (req, res) => {
    const isCustomConfigured = Boolean(process.env.GENIEACS_URL && process.env.GENIEACS_USER && process.env.GENIEACS_PASSWORD);
    if (!isCustomConfigured) {
      return res.status(503).json({
        success: false,
        status: "not_configured",
        reason: "GENIEACS_URL ou credenciais não configuradas",
        latenciaMs: null,
        modo: "desconectado"
      });
    }

    try {
      const start = Date.now();
      await callGenieAcs('/devices?limit=1');
      const latenciaMs = Date.now() - start;
      res.json({ success: true, status: "conectado", latenciaMs, modo: "Nativo API" });
    } catch (err: any) {
      res.status(503).json({ success: false, status: "unavailable", erro: err.message, latenciaMs: null });
    }
  });

  router.get("/devices", async (req, res) => {
    try {
      if (!process.env.GENIEACS_URL || !process.env.GENIEACS_USER || !process.env.GENIEACS_PASSWORD) {
        return res.status(503).json({
          success: false,
          status: "not_configured",
          reason: "GENIEACS_URL ou credenciais não configuradas",
          devices: null
        });
      }
      const rawDevices = await callGenieAcs('/devices?projection=_id,_lastInform,Device.DeviceInfo,InternetGatewayDevice.DeviceInfo,Device.WANDevice,InternetGatewayDevice.WANDevice,Device.Optical,InternetGatewayDevice.LANDevice');
      if (!Array.isArray(rawDevices)) {
        return res.status(502).json({
          success: false,
          status: "unavailable",
          error: "Resposta inválida da API NBI",
          devices: null
        });
      }
      const formatted = rawDevices.map(mapGenieAcsDeviceToAppFormat);
      res.json({ success: true, status: "online", devices: formatted });
    } catch (err: any) {
      res.status(503).json({ success: false, status: "unavailable", error: err.message, devices: null });
    }
  });

  router.post("/devices/:id/reboot", async (req, res) => {
    const { id } = req.params;
    try {
      if (!process.env.GENIEACS_URL || !process.env.GENIEACS_USER || !process.env.GENIEACS_PASSWORD) {
        return res.status(503).json({
          success: false,
          status: "not_configured",
          error: "GenieACS não configurado ou credenciais ausentes."
        });
      }
      await callGenieAcs(`/devices/${encodeURIComponent(id)}/tasks?connection_request`, {
        method: 'POST',
        body: JSON.stringify({ name: 'reboot' })
      });
      if (registrarAuditoria) {
        registrarAuditoria({
          usuario: (req as any).user?.email || req.headers["x-user-email"] || null,
          modulo: "GenieACS (TR-069)",
          acao: "Reboot Remoto (Nativo)",
          detalhes: `Comando de Reboot enviado para CPE: ${id}`,
          categoria: "suporte",
          severidade: "critico",
          ip: req.ip || req.socket.remoteAddress || null,
          userAgent: req.headers["user-agent"] || null
        });
      }
      res.json({ success: true, mensagem: "Comando de Reboot transmitido com sucesso." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/devices/:id/factory-reset", async (req, res) => {
    const { id } = req.params;
    try {
      if (!process.env.GENIEACS_URL || !process.env.GENIEACS_USER || !process.env.GENIEACS_PASSWORD) {
        return res.status(503).json({
          success: false,
          status: "not_configured",
          error: "GenieACS não configurado ou credenciais ausentes."
        });
      }
      await callGenieAcs(`/devices/${encodeURIComponent(id)}/tasks?connection_request`, {
        method: 'POST',
        body: JSON.stringify({ name: 'factoryReset' })
      });
      if (registrarAuditoria) {
        registrarAuditoria({
          usuario: (req as any).user?.email || req.headers["x-user-email"] || null,
          modulo: "GenieACS (TR-069)",
          acao: "Factory Reset Remoto",
          detalhes: `Comando de Factory Reset disparado para a ONT ${id}`,
          categoria: "suporte",
          severidade: "critico",
          ip: req.ip || req.socket.remoteAddress || null,
          userAgent: req.headers["user-agent"] || null
        });
      }
      res.json({ success: true, mensagem: "Comando Factory Reset transmitido com sucesso." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/devices/:id/wifi", async (req, res) => {
    const { id } = req.params;
    const { ssid, wifiPassword, wifiChannel } = req.body;
    try {
      if (!process.env.GENIEACS_URL || !process.env.GENIEACS_USER || !process.env.GENIEACS_PASSWORD) {
        return res.status(503).json({
          success: false,
          status: "not_configured",
          error: "GenieACS não configurado ou credenciais ausentes."
        });
      }
      const parameterValues = [];
      if (ssid) parameterValues.push(["InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID", ssid, "xsd:string"]);
      if (wifiPassword) parameterValues.push(["InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.KeyPassphrase", wifiPassword, "xsd:string"]);
      if (wifiChannel) parameterValues.push(["InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.Channel", wifiChannel, "xsd:unsignedInt"]);
      await callGenieAcs(`/devices/${id}/tasks?connection_request`, {
        method: 'POST',
        body: JSON.stringify({ name: 'setParameterValues', parameterValues })
      });
      if (registrarAuditoria) {
        registrarAuditoria({
          usuario: (req as any).user?.email || req.headers["x-user-email"] || null,
          modulo: "GenieACS (TR-069)",
          acao: "Alteração Wi-Fi Remota",
          detalhes: `Senha e/ou SSID Wi-Fi alterados remotamente para ONT: ${id}`,
          categoria: "configuracao",
          severidade: "medio",
          ip: req.ip || req.socket.remoteAddress || null,
          userAgent: req.headers["user-agent"] || null
        });
      }
      res.json({ success: true, mensagem: "Configurações Wi-Fi aplicadas via TR-069" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/devices/:id/diagnostics", async (req, res) => {
    const { id } = req.params;
    try {
      if (!process.env.GENIEACS_URL || !process.env.GENIEACS_USER || !process.env.GENIEACS_PASSWORD) {
        return res.status(503).json({
          success: false,
          status: "not_configured",
          reason: "GENIEACS_URL ou credenciais não configuradas"
        });
      }
      const rawDevices = await callGenieAcs(`/devices?query=${encodeURIComponent(JSON.stringify({_id: id}))}`);
      const rawDevice = rawDevices && (rawDevices as any[]).length > 0 ? (rawDevices as any[])[0] : null;
      if (!rawDevice) return res.status(404).json({ error: "CPE não encontrado" });
      const device = mapGenieAcsDeviceToAppFormat(rawDevice);
      res.json({
        success: true,
        device,
        telemetria: {
          historicoSinalRx: device.rssi !== null ? [{ hora: "Agora", rx: device.rssi }] : [],
          perdaPacotesLan: null,
          perdaPacotesWan: null,
          pingDnsPrimario: null,
          pingGateway: null,
          temperaturaLaser: device.tempLaser,
          voltagem: device.vccVolts,
          clientesConectados: device.lanClients
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/devices/:id/ping", async (req, res) => {
    const { id } = req.params;
    const host = req.body.host || "8.8.8.8";
    try {
      if (!process.env.GENIEACS_URL || !process.env.GENIEACS_USER || !process.env.GENIEACS_PASSWORD) {
        return res.status(503).json({
          success: false,
          status: "not_configured",
          error: "GenieACS não configurado ou credenciais ausentes."
        });
      }
      await callGenieAcs(`/devices/${encodeURIComponent(id)}/tasks?connection_request`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'setParameterValues',
          parameterValues: [
            ['InternetGatewayDevice.IPPingDiagnostics.Host', host, 'xsd:string'],
            ['InternetGatewayDevice.IPPingDiagnostics.DiagnosticsState', 'Requested', 'xsd:string']
          ]
        })
      });
      res.json({
        success: true,
        mensagem: "Diagnóstico de Ping TR-069 solicitado com sucesso.",
        host
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/devices/:id/provision", async (req, res) => {
    const { id } = req.params;
    try {
      if (process.env.GENIEACS_URL && process.env.GENIEACS_USER && process.env.GENIEACS_PASSWORD) {
        await callGenieAcs(`/devices/${encodeURIComponent(id)}/tasks?connection_request`, {
          method: 'POST',
          body: JSON.stringify({ name: 'refreshObject', objectName: 'InternetGatewayDevice.WANDevice' })
        });
        res.json({ success: true, mensagem: "Reprovisionamento TR-069 acionado." });
      } else {
        res.status(503).json({ success: false, status: "not_configured", error: "GenieACS não configurado" });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.use('/api/genieacs', router);
};
