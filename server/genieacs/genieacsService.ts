export interface GenieAcsDevice {
  _id: string;
  serialNumber: string;
  mac: string | null;
  model: string | null;
  vendor: string | null;
  ip: string | null;
  status: 'online' | 'offline';
  uptime: string | null;
  ssid: string | null;
  wifiPassword?: string;
  wifiChannel: number | null;
  lanClients: number | null;
  firmwareVersion: string | null;
  rssi: number | null;
  tempLaser: string | null;
  vccVolts: string | null;
  lastInform: string | null;
  rxBytes: number;
  txBytes: number;
}

export class GenieacsService {
  private static instance: GenieacsService;

  private constructor() {}

  public static getInstance(): GenieacsService {
    if (!GenieacsService.instance) {
      GenieacsService.instance = new GenieacsService();
    }
    return GenieacsService.instance;
  }

  /**
   * Consulta status e dispositivos da API NBI do GenieACS.
   * Diferencia explicitamente 0 CPEs (status online, lista vazia []) de serviço indisponível (devices: null).
   */
  public async queryDevices(): Promise<{
    status: 'online' | 'unavailable' | 'not_configured';
    devices: GenieAcsDevice[] | null;
    error?: string;
  }> {
    const nbiUrl = process.env.GENIEACS_URL;
    const user = process.env.GENIEACS_USER;
    const pass = process.env.GENIEACS_PASSWORD;

    if (!nbiUrl || !user || !pass) {
      return {
        status: 'not_configured',
        devices: null,
        error: 'GENIEACS_URL ou credenciais não configuradas'
      };
    }

    try {
      const auth = Buffer.from(`${user}:${pass}`).toString('base64');
      const timeoutCtrl = new AbortController();
      const timeoutId = setTimeout(() => timeoutCtrl.abort(), 3000);

      const res = await fetch(`${nbiUrl}/devices`, {
        signal: timeoutCtrl.signal,
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        return {
          status: 'unavailable',
          devices: null,
          error: `HTTP ${res.status} ${res.statusText}`
        };
      }

      const raw = await res.json() as any[];
      if (!Array.isArray(raw)) {
        return {
          status: 'unavailable',
          devices: null,
          error: 'Formato de resposta inválido'
        };
      }

      const mappedDevices: GenieAcsDevice[] = raw.map((d: any) => {
        const di = d['Device.DeviceInfo'] || d['InternetGatewayDevice.DeviceInfo'] || {};
        const wan = d['Device.WANDevice'] || d['InternetGatewayDevice.WANDevice'] || {};
        const optical = d['Device.Optical'] || {};
        const wlan = d['InternetGatewayDevice.LANDevice.1.WLANConfiguration.1'] || {};

        let rssi: number | null = null;
        if (optical?.['OpticalSignalLevel']) {
          const parsed = parseFloat(optical['OpticalSignalLevel']) / 100;
          if (!isNaN(parsed)) rssi = parsed;
        }

        const hasLastInform = Boolean(d._lastInform);
        const isOnline = hasLastInform && (Date.now() - new Date(d._lastInform).getTime() < 900000);

        return {
          _id: d._id || '',
          serialNumber: di['SerialNumber'] || d._id || '',
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
          lastInform: d._lastInform || null,
          rxBytes: parseInt(wan['1.WANCommonInterfaceConfig.TotalBytesReceived']) || 0,
          txBytes: parseInt(wan['1.WANCommonInterfaceConfig.TotalBytesSent']) || 0
        };
      });

      return {
        status: 'online',
        devices: mappedDevices
      };
    } catch (err: any) {
      return {
        status: 'unavailable',
        devices: null,
        error: err.message || 'Erro de conexão com GenieACS'
      };
    }
  }

  /**
   * Consulta dispositivos reais a partir da API NBI do GenieACS.
   */
  public async getDevices(): Promise<GenieAcsDevice[]> {
    const result = await this.queryDevices();
    return result.devices || [];
  }

  public async rebootDevice(deviceId: string): Promise<{ success: boolean; message: string }> {
    const nbiUrl = process.env.GENIEACS_URL;
    const user = process.env.GENIEACS_USER;
    const pass = process.env.GENIEACS_PASSWORD;

    if (!nbiUrl || !user || !pass) {
      return { success: false, message: "GenieACS não configurado (GENIEACS_URL ou credenciais ausentes)" };
    }
    try {
      const auth = Buffer.from(`${user}:${pass}`).toString('base64');
      const res = await fetch(`${nbiUrl}/devices/${encodeURIComponent(deviceId)}/tasks?connection_request`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: 'reboot' })
      });
      return { success: res.ok, message: res.ok ? "Comando de reboot enviado" : `Falha ao enviar reboot: HTTP ${res.status}` };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
}
