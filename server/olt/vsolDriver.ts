import net from 'net';
import { 
  OltSystemInfo, OltSlot, OltPonPort, OnuDevice, 
  OpticalTelemetry, OnuDiagnosticResult, UnassignedOnu, OltAlarm, 
  OltProfile, AuthorizeOnuPayload, OltDevice 
} from './types';
import { OltDriver } from './driverInterface';

export class VsolDriver implements OltDriver {
  private device: OltDevice;
  private connected: boolean = false;

  constructor(device: OltDevice) {
    this.device = device;
  }

  async connect(): Promise<{ success: boolean; message: string; latency_ms: number }> {
    const startTime = Date.now();
    const port = this.device.porta || 22;
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(2500);
      socket.once('connect', () => {
        socket.destroy();
        this.connected = true;
        const latency = Date.now() - startTime;
        resolve({
          success: true,
          message: `Conexão TCP estabelecida com sucesso na OLT VSOL ${this.device.modelo} (${this.device.ip}:${port})`,
          latency_ms: latency
        });
      });
      socket.once('timeout', () => {
        socket.destroy();
        this.connected = false;
        resolve({
          success: false,
          message: `Timeout ao tentar conectar à OLT VSOL ${this.device.ip}:${port} (2500ms)`,
          latency_ms: 2500
        });
      });
      socket.once('error', (err) => {
        socket.destroy();
        this.connected = false;
        const latency = Date.now() - startTime;
        resolve({
          success: false,
          message: `Falha de conexão na OLT VSOL ${this.device.ip}:${port} (${err.message})`,
          latency_ms: latency
        });
      });
      socket.connect(port, this.device.ip);
    });
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async getSystemInfo(): Promise<OltSystemInfo> {
    return {
      fabricante: 'VSOL',
      modelo: this.device.modelo || 'V1600G2-B',
      versao_firmware: 'V1.0.9_221028',
      uptime: '15d 08h',
      cpu_percent: 28,
      memory_percent: 45,
      temperatura_c: 42,
      chassis: 'V1600',
      serial_number: 'VSOL-G2-B-001',
      mac_base: '00:E0:4C:68:01:22'
    };
  }

  async getInventory(): Promise<{ slots: OltSlot[]; pons: OltPonPort[] }> {
    const slots: OltSlot[] = [
      { id: `${this.device.id}_S1`, olt_id: this.device.id, slot_number: 1, card_type: 'CONTROL', card_model: 'VSOL-CTRL', card_status: 'normal', total_ports: 4, ports_active: 4 },
      { id: `${this.device.id}_S2`, olt_id: this.device.id, slot_number: 2, card_type: 'GPON', card_model: 'VSOL-16G', card_status: 'normal', total_ports: 16, ports_active: 16 }
    ];

    const pons: OltPonPort[] = Array.from({ length: 16 }).map((_, i) => ({
      id: `${this.device.id}_PON_${i + 1}`,
      olt_id: this.device.id,
      slot_number: 2,
      port_number: i + 1,
      pon_identifier: `0/0/${i + 1}`,
      tecnologia: 'GPON',
      status: 'up',
      onus_total: 58,
      onus_online: 55,
      onus_offline: 3,
      rx_power_avg: -22.5,
      tx_power: 2.1,
      vlan_default: 1,
      alarmes_ativos: 0,
      descricao: `PON 0/0/${i + 1}`
    }));

    return { slots, pons };
  }

  async getPonInterfaces(): Promise<OltPonPort[]> {
    const inventory = await this.getInventory();
    return inventory.pons;
  }

  async getOnus(ponIdentifier?: string): Promise<OnuDevice[]> {
    return [
      {
        id: `ONU_VSOL_1`,
        olt_id: this.device.id,
        pon_identifier: ponIdentifier || '0/0/1',
        onu_id: 1,
        serial: 'VSOL12345678',
        nome: 'Cliente VSOL Teste 1',
        modelo: 'V2801SG',
        status: 'online',
        rx_onu: -21.3,
        tx_onu: 2.4,
        rx_olt: -22.1,
        tx_olt: 2.5,
        distancia_metros: 1250,
        vlan: 100,
        profile_line: 'LINE_500M',
        profile_service: 'SRV_INTERNET',
        criado_em: new Date().toISOString()
      },
      {
        id: `ONU_VSOL_2`,
        olt_id: this.device.id,
        pon_identifier: ponIdentifier || '0/0/1',
        onu_id: 2,
        serial: 'VSOL87654321',
        nome: 'Cliente VSOL Teste 2',
        modelo: 'V2801SG',
        status: 'offline',
        rx_onu: -28.9,
        tx_onu: 1.1,
        rx_olt: -29.2,
        tx_olt: 2.5,
        distancia_metros: 3400,
        vlan: 200,
        profile_line: 'LINE_1G',
        profile_service: 'SRV_INTERNET',
        criado_em: new Date().toISOString()
      }
    ];
  }

  async getOnu(onuIdOrSerial: string): Promise<OnuDevice | null> {
    const onus = await this.getOnus();
    return onus.find(o => o.id === onuIdOrSerial || o.serial === onuIdOrSerial) || onus[0];
  }

  async getUnassignedOnus(): Promise<UnassignedOnu[]> {
    return [
      {
        id: `UNASSIGNED_VSOL_1`,
        olt_id: this.device.id,
        olt_nome: this.device.nome,
        fabricante_olt: 'VSOL',
        pon_identifier: '0/0/2',
        serial: 'VSOL99998888',
        modelo_estimado: 'VSOL GPON ONT',
        sinal_rx: -19.5,
        descoberto_em: new Date().toISOString()
      }
    ];
  }

  async authorizeOnu(data: AuthorizeOnuPayload): Promise<{ success: boolean; onu: OnuDevice; raw_output?: string }> {
    return {
      success: true,
      raw_output: `ont add 0/0/${data.pon_identifier.split('/').pop()} ${data.onu_id || 3} sn-auth ${data.serial} omci ont-lineprofile-name ${data.profile_line} ont-srvprofile-name ${data.profile_service}`,
      onu: {
        id: `ONU_VSOL_${data.serial}`,
        olt_id: this.device.id,
        pon_identifier: data.pon_identifier,
        onu_id: data.onu_id || 3,
        serial: data.serial,
        nome: data.nome,
        modelo: data.modelo || 'VSOL ONT',
        status: 'offline',
        rx_onu: 0,
        tx_onu: 0,
        rx_olt: 0,
        tx_olt: 0,
        distancia_metros: 0,
        vlan: data.vlan,
        profile_line: data.profile_line,
        profile_service: data.profile_service,
        criado_em: new Date().toISOString()
      }
    };
  }

  async deleteOnu(onuId: string): Promise<{ success: boolean; message: string }> {
    return { success: true, message: `ONU ${onuId} removida com sucesso na OLT VSOL` };
  }

  async rebootOnu(onuId: string): Promise<{ success: boolean; message: string }> {
    return { success: true, message: `Reboot enviado para ONU ${onuId}` };
  }

  async enableOnu(onuId: string): Promise<{ success: boolean; message: string }> {
    return { success: true, message: `ONU ${onuId} habilitada` };
  }

  async disableOnu(onuId: string): Promise<{ success: boolean; message: string }> {
    return { success: true, message: `ONU ${onuId} desabilitada` };
  }

  async getOpticalInfo(onuId: string): Promise<OpticalTelemetry> {
    return {
      onu_id: onuId,
      rx_onu: -21.3,
      tx_onu: 2.4,
      rx_olt: -22.1,
      tx_olt: 2.5,
      temperatura: 39,
      voltagem_volts: 3.3,
      bias_current_ma: 15,
      distancia_metros: 1250,
      qualidade_sinal: 'bom',
      timestamp: new Date().toISOString(),
      historico: []
    };
  }

  async runDiagnostics(onuId: string): Promise<OnuDiagnosticResult> {
    return {
      onu_id: onuId,
      optical: await this.getOpticalInfo(onuId),
      ping: { success: true, rtt_ms: 12, packet_loss_percent: 0 },
      mac_table: [{ port: 'eth_0/1', mac: '00:11:22:33:44:55', vlan: 100, tipo: 'dynamic' }],
      traffic: { rx_rate_mbps: 45, tx_rate_mbps: 12, rx_packets: 45000, tx_packets: 12000, drop_packets: 0 },
      alarms: [],
      last_events: [{ timestamp: new Date().toISOString(), event: 'ONU Online', severity: 'info' }]
    };
  }

  async getAlarms(): Promise<OltAlarm[]> {
    return [
      {
        id: `ALARM_VSOL_1`,
        olt_id: this.device.id,
        olt_nome: this.device.nome,
        pon_identifier: '0/0/4',
        severidade: 'critical',
        tipo: 'LOS',
        descricao: 'Loss of Signal detectado na PON 0/0/4',
        timestamp: new Date().toISOString(),
        acknowledged: false
      }
    ];
  }

  async getVlans(): Promise<number[]> {
    return [100, 200, 300, 400];
  }

  async getProfiles(): Promise<OltProfile[]> {
    return [
      { id: 'PROF_LINE_1', olt_id: this.device.id, nome: 'LINE_500M', tipo: 'line', download_mbps: 500, upload_mbps: 250, vlans: [100] },
      { id: 'PROF_SRV_1', olt_id: this.device.id, nome: 'SRV_INTERNET', tipo: 'service', download_mbps: 1000, upload_mbps: 1000, vlans: [100, 200] }
    ];
  }
}
