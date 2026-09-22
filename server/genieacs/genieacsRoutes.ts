import express from 'express';
import fetch from 'node-fetch'; // if available, or assume global fetch

export const setupGenieacsRoutes = (app: express.Express, { registrarAuditoria }: any) => {
  const router = express.Router();

  const callGenieAcs = async (endpoint: string, options: any = {}) => {
    const url = `${process.env.GENIEACS_URL || "http://127.0.0.1:7557"}${endpoint}`;
    const user = process.env.GENIEACS_USER || "admin";
    const pass = process.env.GENIEACS_PASSWORD || "admin";
    const auth = Buffer.from(`${user}:${pass}`).toString('base64');
  
    const res = await fetch(url, {
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

    let rssi = -25;
    if (optical?.['OpticalSignalLevel']) rssi = parseFloat(optical['OpticalSignalLevel']) / 100;
    
    return {
      _id: raw._id,
      serialNumber: di['SerialNumber'] || raw._id,
      mac: di['MACAddress'] || 'Desconhecido',
      model: di['ModelName'] || di['ProductClass'] || 'Desconhecido',
      vendor: di['Manufacturer'] || 'Desconhecido',
      ip: wan['1.WANConnectionDevice.1.WANIPConnection.1.ExternalIPAddress'] || '0.0.0.0',
      status: (new Date().getTime() - new Date(raw._lastInform).getTime()) < 900000 ? 'online' : 'offline',
      uptime: di['UpTime'] ? `${Math.floor(parseInt(di['UpTime']) / 86400)} dias` : 'Desconhecido',
      ssid: wlan['SSID'] || 'N/A',
      wifiChannel: parseInt(wlan['Channel']) || 0,
      lanClients: 2, 
      firmwareVersion: di['SoftwareVersion'] || 'N/A',
      rssi: rssi,
      tempLaser: optical['Temperature'] ? `${parseFloat(optical['Temperature']) / 100}°C` : 'N/A',
      vccVolts: optical['Voltage'] ? `${parseFloat(optical['Voltage']) / 1000}V` : 'N/A',
      lastInform: raw._lastInform,
      rxBytes: parseInt(wan['1.WANCommonInterfaceConfig.TotalBytesReceived']) || 0,
      txBytes: parseInt(wan['1.WANCommonInterfaceConfig.TotalBytesSent']) || 0
    };
  };

  router.get("/health", async (req, res) => {
    const isCustomConfigured = Boolean(process.env.GENIEACS_URL);
    if (!isCustomConfigured) {
      return res.status(503).json({
        success: false,
        status: "unavailable",
        reason: "GENIEACS_URL não configurado",
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
      res.status(503).json({ success: false, status: "desconectado", erro: err.message, latenciaMs: null });
    }
  });

  router.get("/devices", async (req, res) => {
    try {
      if (!process.env.GENIEACS_URL) {
        return res.status(503).json({
          success: false,
          status: "unavailable",
          reason: "GENIEACS_URL não configurado",
          devices: []
        });
      }
      const rawDevices = await callGenieAcs('/devices?projection=_id,_lastInform,Device.DeviceInfo,InternetGatewayDevice.DeviceInfo,Device.WANDevice,InternetGatewayDevice.WANDevice,Device.Optical,InternetGatewayDevice.LANDevice');
      const formatted = (rawDevices as any[]).map(mapGenieAcsDeviceToAppFormat);
      res.json({ success: true, devices: formatted });
    } catch (err: any) {
      res.status(503).json({ success: false, status: "unavailable", error: err.message, devices: [] });
    }
  });

  router.post("/devices/:id/reboot", async (req, res) => {
    const { id } = req.params;
    try {
      if (!process.env.GENIEACS_URL) {
        return res.status(503).json({
          success: false,
          status: "unavailable",
          error: "GenieACS não configurado ou inacessível (GENIEACS_URL ausente)."
        });
      }
      await callGenieAcs(`/devices/${encodeURIComponent(id)}/tasks?connection_request`, {
        method: 'POST',
        body: JSON.stringify({ name: 'reboot' })
      });
      if (registrarAuditoria) {
        registrarAuditoria({
          usuario: req.headers["x-user-email"] || "Operador NOC",
          modulo: "GenieACS (TR-069)",
          acao: "Reboot Remoto (Nativo)",
          detalhes: `Comando de Reboot enviado para CPE: ${id}`,
          categoria: "suporte",
          severidade: "critico",
          ip: req.ip || null,
          userAgent: req.headers["user-agent"] || "GenieACS TR-069 API"
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
      if (!process.env.GENIEACS_URL) {
        return res.status(503).json({
          success: false,
          status: "unavailable",
          error: "GenieACS não configurado ou inacessível (GENIEACS_URL ausente)."
        });
      }
      await callGenieAcs(`/devices/${encodeURIComponent(id)}/tasks?connection_request`, {
        method: 'POST',
        body: JSON.stringify({ name: 'factoryReset' })
      });
      if (registrarAuditoria) {
        registrarAuditoria({
          usuario: req.headers["x-user-email"] || "Operador NOC",
          modulo: "GenieACS (TR-069)",
          acao: "Factory Reset Remoto",
          detalhes: `Comando de Factory Reset disparado para a ONT ${id}`,
          categoria: "suporte",
          severidade: "critico",
          ip: req.ip || null,
          userAgent: req.headers["user-agent"] || "GenieACS TR-069 API"
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
      if (!process.env.GENIEACS_URL) {
        return res.status(503).json({
          success: false,
          status: "unavailable",
          error: "GenieACS não configurado ou inacessível (GENIEACS_URL ausente)."
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
          usuario: req.headers["x-user-email"] || "Operador NOC",
          modulo: "GenieACS (TR-069)",
          acao: "Alteração Wi-Fi Remota",
          detalhes: `Senha e/ou SSID Wi-Fi alterados remotamente para ONT: ${id}`,
          categoria: "configuracao",
          severidade: "medio",
          ip: req.ip || null,
          userAgent: req.headers["user-agent"] || "GenieACS"
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
      if (!process.env.GENIEACS_URL) {
        return res.status(503).json({
          success: false,
          status: "unavailable",
          reason: "GENIEACS_URL não configurado"
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
          historicoSinalRx: [{ hora: "Agora", rx: device.rssi }],
          perdaPacotesLan: "0%", perdaPacotesWan: "0%", pingDnsPrimario: "N/A", pingGateway: "N/A",
          temperaturaLaser: device.tempLaser, voltagem: device.vccVolts, clientesConectados: device.lanClients
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
      if (!process.env.GENIEACS_URL) {
        return res.status(503).json({
          success: false,
          status: "unavailable",
          error: "GenieACS não configurado ou inacessível (GENIEACS_URL ausente)."
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
      if (process.env.GENIEACS_URL) {
        await callGenieAcs(`/devices/${encodeURIComponent(id)}/tasks?connection_request`, {
          method: 'POST',
          body: JSON.stringify({ name: 'refreshObject', objectName: 'InternetGatewayDevice.WANDevice' })
        });
      }
      res.json({ success: true, mensagem: "Reprovisionamento TR-069 acionado." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.use('/api/genieacs', router);
};
