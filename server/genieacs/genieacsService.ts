export interface GenieAcsDevice {
  _id: string;
  serialNumber: string;
  mac: string;
  model: string;
  vendor: string;
  ip: string;
  status: 'online' | 'offline';
  uptime: string;
  ssid: string;
  wifiPassword?: string;
  wifiChannel: number;
  lanClients: number;
  firmwareVersion: string;
  rssi: number;
  tempLaser: string;
  vccVolts: string;
  lastInform: string;
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
   * Consulta dispositivos reais a partir da API NBI do GenieACS.
   * Se o GenieACS estiver inacessível ou não configurado, retorna lista vazia.
   */
  public async getDevices(): Promise<GenieAcsDevice[]> {
    const nbiUrl = process.env.GENIEACS_URL;
    if (!nbiUrl) {
      return [];
    }

    try {
      const user = process.env.GENIEACS_USER || "admin";
      const pass = process.env.GENIEACS_PASSWORD || "admin";
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
        return [];
      }

      const raw = await res.json() as any[];
      if (!Array.isArray(raw)) return [];

      return raw.map((d: any) => {
        const di = d['Device.DeviceInfo'] || d['InternetGatewayDevice.DeviceInfo'] || {};
        const wan = d['Device.WANDevice'] || d['InternetGatewayDevice.WANDevice'] || {};
        const optical = d['Device.Optical'] || {};
        const wlan = d['InternetGatewayDevice.LANDevice.1.WLANConfiguration.1'] || {};

        let rssi = -25;
        if (optical?.['OpticalSignalLevel']) rssi = parseFloat(optical['OpticalSignalLevel']) / 100;

        const isOnline = d._lastInform && (Date.now() - new Date(d._lastInform).getTime() < 900000);

        return {
          _id: d._id || '',
          serialNumber: di['SerialNumber'] || d._id || '',
          mac: di['MACAddress'] || 'Desconhecido',
          model: di['ModelName'] || di['ProductClass'] || 'Desconhecido',
          vendor: di['Manufacturer'] || 'Desconhecido',
          ip: wan['1.WANConnectionDevice.1.WANIPConnection.1.ExternalIPAddress'] || '0.0.0.0',
          status: isOnline ? 'online' : 'offline',
          uptime: di['UpTime'] ? `${Math.floor(parseInt(di['UpTime']) / 86400)} dias` : 'Desconhecido',
          ssid: wlan['SSID'] || 'N/A',
          wifiChannel: parseInt(wlan['Channel']) || 0,
          lanClients: 0,
          firmwareVersion: di['SoftwareVersion'] || 'N/A',
          rssi: rssi,
          tempLaser: optical['Temperature'] ? `${parseFloat(optical['Temperature']) / 100}°C` : 'N/A',
          vccVolts: optical['Voltage'] ? `${parseFloat(optical['Voltage']) / 1000}V` : 'N/A',
          lastInform: d._lastInform || new Date().toISOString(),
          rxBytes: parseInt(wan['1.WANCommonInterfaceConfig.TotalBytesReceived']) || 0,
          txBytes: parseInt(wan['1.WANCommonInterfaceConfig.TotalBytesSent']) || 0
        };
      });
    } catch {
      return [];
    }
  }
}
