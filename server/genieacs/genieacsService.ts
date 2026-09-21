import { isMockAllowed } from '../security/mockGuard';

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
  private mockDevices: GenieAcsDevice[] = [];

  private constructor() {
    this.initMocks();
  }

  public static getInstance(): GenieacsService {
    if (!GenieacsService.instance) {
      GenieacsService.instance = new GenieacsService();
    }
    return GenieacsService.instance;
  }

  private initMocks() {
    this.mockDevices = [
      {
        _id: 'huawei-h8546m-1234',
        serialNumber: 'HWTC4A12B34C',
        mac: '00:1E:A6:4A:2B:3C',
        model: 'HG8546M',
        vendor: 'Huawei',
        ip: '10.10.1.100',
        status: 'online',
        uptime: '45 dias',
        ssid: 'WIFI_CASA_ALMEIDA',
        wifiPassword: 'senha_segura123',
        wifiChannel: 6,
        lanClients: 4,
        firmwareVersion: 'V3R017C10S105',
        rssi: -19.5,
        tempLaser: '42.1°C',
        vccVolts: '3.3V',
        lastInform: new Date(Date.now() - 300000).toISOString(),
        rxBytes: 120500400,
        txBytes: 45030200
      },
      {
        _id: 'zte-f670L-5678',
        serialNumber: 'ZTEGC1234567',
        mac: '08:2A:B4:7C:9D:1E',
        model: 'F670L',
        vendor: 'ZTE',
        ip: '10.10.1.101',
        status: 'online',
        uptime: '12 dias',
        ssid: 'ZTE_2G_SILVA',
        wifiChannel: 11,
        lanClients: 2,
        firmwareVersion: 'V2.0.10P2T3',
        rssi: -22.1,
        tempLaser: '38.5°C',
        vccVolts: '3.2V',
        lastInform: new Date(Date.now() - 150000).toISOString(),
        rxBytes: 88500200,
        txBytes: 12010100
      },
      {
        _id: 'datacom-dm984-9012',
        serialNumber: 'DM984C789012',
        mac: '5C:83:8F:1A:2B:3C',
        model: 'DM984-422',
        vendor: 'Datacom',
        ip: '10.10.1.102',
        status: 'offline',
        uptime: '0 dias',
        ssid: 'DATACOM_FIBRA',
        wifiChannel: 1,
        lanClients: 0,
        firmwareVersion: 'v4.1.2',
        rssi: -28.9,
        tempLaser: 'N/A',
        vccVolts: '0.0V',
        lastInform: new Date(Date.now() - 86400000).toISOString(),
        rxBytes: 0,
        txBytes: 0
      }
    ];
  }

  public getMockDevices(): GenieAcsDevice[] {
    if (!isMockAllowed()) {
      throw new Error("Mock data is disabled in production");
    }
    return this.mockDevices;
  }
}
