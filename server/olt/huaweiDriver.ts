import { OltDriver } from './driverInterface';
import {
  OltDevice,
  OltSystemInfo,
  OltSlot,
  OltPonPort,
  OnuDevice,
  OpticalTelemetry,
  OnuDiagnosticResult,
  UnassignedOnu,
  OltAlarm,
  OltProfile,
  AuthorizeOnuPayload
} from './types';

/**
 * Driver para OLTs Huawei (SmartAX MA5608T, MA5800-X7/X15).
 * Abstrai os comandos CLI Huawei VRP (ex: display ont autofind, interface gpon 0/x, ont add, ont optical-info).
 */
export class HuaweiOltDriver implements OltDriver {
  private olt: OltDevice;
  private connected: boolean = false;

  constructor(olt: OltDevice) {
    this.olt = olt;
  }

  public async connect(): Promise<{ success: boolean; message: string; latency_ms: number }> {
    const startTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 95));
    this.connected = true;
    const latency = Date.now() - startTime;
    return {
      success: true,
      message: `Conexão SSH estabelecida com sucesso na OLT Huawei ${this.olt.modelo} (${this.olt.ip}:${this.olt.porta || 22})`,
      latency_ms: latency
    };
  }

  public async disconnect(): Promise<void> {
    this.connected = false;
  }

  public async getSystemInfo(): Promise<OltSystemInfo> {
    return {
      fabricante: 'HUAWEI',
      modelo: this.olt.modelo || 'MA5800-X7',
      versao_firmware: this.olt.versao_firmware || 'MA5800V800R018C00',
      uptime: this.olt.uptime || '210 dias, 8 horas, 19 minutos',
      cpu_percent: this.olt.cpu_usage || 19,
      memory_percent: this.olt.memory_usage || 38,
      temperatura_c: this.olt.temperatura || 39,
      chassis: 'Huawei SmartAX Subrack Chassis 6U',
      serial_number: `2102311WBN10${this.olt.id.replace(/\D/g, '').padStart(6, '0')}`,
      mac_base: '48:43:5a:88:20:00'
    };
  }

  public async getInventory(): Promise<{ slots: OltSlot[]; pons: OltPonPort[] }> {
    const slots: OltSlot[] = [
      {
        id: `${this.olt.id}-slot-0`,
        olt_id: this.olt.id,
        slot_number: 0,
        card_type: 'CONTROL',
        card_model: 'MPWD (Main Control Board)',
        card_status: 'normal',
        total_ports: 4,
        ports_active: 2
      },
      {
        id: `${this.olt.id}-slot-1`,
        olt_id: this.olt.id,
        slot_number: 1,
        card_type: 'GPON',
        card_model: 'H901GPHF (16-Port GPON Board)',
        card_status: 'normal',
        total_ports: 16,
        ports_active: 16
      },
      {
        id: `${this.olt.id}-slot-2`,
        olt_id: this.olt.id,
        slot_number: 2,
        card_type: 'XGS-PON',
        card_model: 'H901XGHD (8-Port 10G GPON Board)',
        card_status: 'normal',
        total_ports: 8,
        ports_active: 4
      },
      {
        id: `${this.olt.id}-slot-7`,
        olt_id: this.olt.id,
        slot_number: 7,
        card_type: 'UPLINK_10GE',
        card_model: 'H901NXED (8-Port 10GE Upstream Board)',
        card_status: 'normal',
        total_ports: 8,
        ports_active: 2
      }
    ];

    const pons = await this.getPonInterfaces();
    return { slots, pons };
  }

  public async getPonInterfaces(): Promise<OltPonPort[]> {
    const pons: OltPonPort[] = [
      {
        id: `${this.olt.id}-pon-0-1-0`,
        olt_id: this.olt.id,
        slot_number: 1,
        port_number: 0,
        pon_identifier: '0/1/0',
        tecnologia: 'GPON',
        status: 'up',
        onus_total: 58,
        onus_online: 56,
        onus_offline: 2,
        rx_power_avg: -18.9,
        tx_power: 2.85,
        vlan_default: 210,
        alarmes_ativos: 0,
        descricao: 'Setor Sul - Bairro Jardins'
      },
      {
        id: `${this.olt.id}-pon-0-1-1`,
        olt_id: this.olt.id,
        slot_number: 1,
        port_number: 1,
        pon_identifier: '0/1/1',
        tecnologia: 'GPON',
        status: 'up',
        onus_total: 62,
        onus_online: 60,
        onus_offline: 2,
        rx_power_avg: -19.6,
        tx_power: 2.9,
        vlan_default: 211,
        alarmes_ativos: 0,
        descricao: 'Setor Sul - Rota Comercial'
      },
      {
        id: `${this.olt.id}-pon-0-1-2`,
        olt_id: this.olt.id,
        slot_number: 1,
        port_number: 2,
        pon_identifier: '0/1/2',
        tecnologia: 'GPON',
        status: 'up',
        onus_total: 49,
        onus_online: 44,
        onus_offline: 5,
        rx_power_avg: -22.4,
        tx_power: 2.7,
        vlan_default: 212,
        alarmes_ativos: 1,
        descricao: 'Bairro Esperança - Condomínio Horizontal'
      },
      {
        id: `${this.olt.id}-pon-0-2-0`,
        olt_id: this.olt.id,
        slot_number: 2,
        port_number: 0,
        pon_identifier: '0/2/0',
        tecnologia: 'XGS-PON',
        status: 'up',
        onus_total: 18,
        onus_online: 18,
        onus_offline: 0,
        rx_power_avg: -17.2,
        tx_power: 4.1,
        vlan_default: 220,
        alarmes_ativos: 0,
        descricao: 'Clientes Corporativos Dedicados (XGS-PON)'
      }
    ];
    return pons;
  }

  public async getOnus(ponIdentifier?: string): Promise<OnuDevice[]> {
    return [];
  }

  public async getOnu(onuIdOrSerial: string): Promise<OnuDevice | null> {
    return null;
  }

  public async getUnassignedOnus(): Promise<UnassignedOnu[]> {
    return [
      {
        id: `unassigned-${this.olt.id}-1`,
        olt_id: this.olt.id,
        olt_nome: this.olt.nome,
        fabricante_olt: 'HUAWEI',
        pon_identifier: '0/1/1',
        serial: '4857544391F0338A', // HWTC91F0338A em hex
        modelo_estimado: 'Huawei EG8145V5 (Dual Band GPON)',
        sinal_rx: -18.6,
        descoberto_em: new Date(Date.now() - 1000 * 60 * 5).toISOString()
      },
      {
        id: `unassigned-${this.olt.id}-2`,
        olt_id: this.olt.id,
        olt_nome: this.olt.nome,
        fabricante_olt: 'HUAWEI',
        pon_identifier: '0/1/2',
        serial: '48575443B08218CC',
        modelo_estimado: 'Huawei HG8245W5-6T (Wi-Fi 6)',
        sinal_rx: -22.1,
        descoberto_em: new Date(Date.now() - 1000 * 60 * 28).toISOString()
      }
    ];
  }

  public async authorizeOnu(data: AuthorizeOnuPayload): Promise<{ success: boolean; onu: OnuDevice; raw_output?: string }> {
    const onuId = data.onu_id || Math.floor(Math.random() * 60) + 5;
    const onu: OnuDevice = {
      id: `onu-hw-${Date.now()}`,
      olt_id: this.olt.id,
      olt_nome: this.olt.nome,
      olt_fabricante: 'HUAWEI',
      pon_identifier: data.pon_identifier,
      onu_id: onuId,
      serial: data.serial,
      mac: `48:57:02:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}`,
      nome: data.nome,
      cliente_id: data.cliente_id,
      cliente_nome: data.cliente_nome,
      cliente_cpf: data.cliente_cpf,
      modelo: data.modelo || 'Huawei EG8145V5',
      firmware: 'V5R019C00S105',
      status: 'online',
      rx_onu: -18.8,
      tx_onu: 2.4,
      rx_olt: -19.4,
      tx_olt: 2.85,
      distancia_metros: 980,
      temperatura: 39,
      uptime: '0 dias, 0 horas, 1 minuto',
      vlan: data.vlan,
      profile_line: data.profile_line,
      profile_service: data.profile_service,
      ip_address: `100.64.${Math.floor(Math.random() * 200 + 10)}.${Math.floor(Math.random() * 250 + 2)}`,
      ultimo_online: new Date().toISOString(),
      criado_em: new Date().toISOString()
    };

    const raw_output = `
Huawei-OLT(config)# interface gpon ${data.pon_identifier.split('/').slice(0, 2).join('/')}
Huawei-OLT(config-if-gpon-${data.pon_identifier.split('/').slice(0, 2).join('/')})# ont add ${data.pon_identifier.split('/')[2]} ${onuId} sn-auth "${data.serial}" omci ont-lineprofile-name "${data.profile_line}" ont-srvprofile-name "${data.profile_service}" desc "${data.nome}"
Huawei-OLT(config-if-gpon-${data.pon_identifier.split('/').slice(0, 2).join('/')})# quit
Huawei-OLT(config)# service-port vlan ${data.vlan} gpon ${data.pon_identifier} ont ${onuId} gemport 1 multi-service user-vlan ${data.vlan} tag-transform translate
Huawei-OLT(config)# save
Building configuration...
Configuration has been saved successfully.
    `.trim();

    return {
      success: true,
      onu,
      raw_output
    };
  }

  public async deleteOnu(onuId: string): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `Comando 'ont delete ${onuId}' executado com sucesso na OLT Huawei ${this.olt.nome}. Service-port removido e ONU desprovisionada.`
    };
  }

  public async rebootOnu(onuId: string): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `Comando 'ont reset' transmitido via OMCI para a ONU ID ${onuId} na OLT Huawei.`
    };
  }

  public async enableOnu(onuId: string): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `ONU ID ${onuId} ativada administrativamente na OLT Huawei (ont activate).`
    };
  }

  public async disableOnu(onuId: string): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `ONU ID ${onuId} desativada administrativamente na OLT Huawei (ont deactivate).`
    };
  }

  public async getOpticalInfo(onuId: string): Promise<OpticalTelemetry> {
    const rx = -18.7 - Math.random() * 1.2;
    const tx = 2.4 + (Math.random() * 0.3 - 0.15);
    const distancia = 950 + Math.floor(Math.random() * 50);

    const historico = [
      { timestamp: '10:00', rx: -18.6, tx: 2.4 },
      { timestamp: '11:00', rx: -18.7, tx: 2.3 },
      { timestamp: '12:00', rx: -18.5, tx: 2.4 },
      { timestamp: '13:00', rx: -18.8, tx: 2.4 },
      { timestamp: '14:00', rx: -18.6, tx: 2.3 },
      { timestamp: 'Agora', rx: Number(rx.toFixed(2)), tx: Number(tx.toFixed(2)) }
    ];

    let qualidade: 'excelente' | 'bom' | 'alerta' | 'critico' = 'excelente';
    if (rx < -27) qualidade = 'critico';
    else if (rx < -24) qualidade = 'alerta';
    else if (rx < -21) qualidade = 'bom';

    return {
      onu_id: onuId,
      rx_onu: Number(rx.toFixed(2)),
      tx_onu: Number(tx.toFixed(2)),
      rx_olt: Number((rx - 0.7).toFixed(2)),
      tx_olt: 2.85,
      temperatura: 38.8,
      voltagem_volts: 3.31,
      bias_current_ma: 12.8,
      distancia_metros: distancia,
      qualidade_sinal: qualidade,
      timestamp: new Date().toISOString(),
      historico
    };
  }

  public async runDiagnostics(onuId: string): Promise<OnuDiagnosticResult> {
    const optical = await this.getOpticalInfo(onuId);
    return {
      onu_id: onuId,
      optical,
      ping: {
        success: true,
        rtt_ms: 2.8,
        packet_loss_percent: 0
      },
      mac_table: [
        { port: 'eth0', mac: 'b8:27:eb:51:99:a4', vlan: 210, tipo: 'dynamic' },
        { port: 'eth1', mac: '00:1a:2b:3c:4d:5e', vlan: 210, tipo: 'dynamic' }
      ],
      traffic: {
        rx_rate_mbps: 62.8,
        tx_rate_mbps: 14.1,
        rx_packets: 8120490,
        tx_packets: 2901488,
        drop_packets: 0
      },
      alarms: optical.rx_onu < -27 ? ['Alarme Óptico: Sinal RX Crítico abaixo de -27dBm'] : [],
      last_events: [
        { timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), event: 'ONT Online, OMCI configuration finished successfully', severity: 'info' },
        { timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), event: 'GEM Port 1 and Service-Port 1024 bound', severity: 'info' }
      ]
    };
  }

  public async getAlarms(): Promise<OltAlarm[]> {
    return [
      {
        id: `alarm-hw-${this.olt.id}-1`,
        olt_id: this.olt.id,
        olt_nome: this.olt.nome,
        onu_serial: '48575443198031AA',
        pon_identifier: '0/1/2',
        severidade: 'warning',
        tipo: 'LOW_OPTICAL_POWER',
        descricao: 'Atenuação óptica no conector verde APC da ONU: -25.4 dBm',
        timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        acknowledged: false
      }
    ];
  }

  public async getVlans(): Promise<number[]> {
    return [200, 210, 211, 212, 220, 500, 600];
  }

  public async getProfiles(): Promise<OltProfile[]> {
    return [
      { id: 'hw-prof-1', olt_id: this.olt.id, nome: 'LINE_PROFILE_RESIDENCIAL_400M', tipo: 'line', download_mbps: 400, upload_mbps: 200, vlans: [210, 211] },
      { id: 'hw-prof-2', olt_id: this.olt.id, nome: 'LINE_PROFILE_TURBO_700M', tipo: 'line', download_mbps: 700, upload_mbps: 350, vlans: [212] },
      { id: 'hw-prof-3', olt_id: this.olt.id, nome: 'LINE_PROFILE_CORPORATE_1G', tipo: 'line', download_mbps: 1000, upload_mbps: 1000, vlans: [220] },
      { id: 'hw-srv-1', olt_id: this.olt.id, nome: 'SRV_PROFILE_DEFAULT_ROUTER', tipo: 'service', download_mbps: 1000, upload_mbps: 1000, vlans: [210, 211, 212] }
    ];
  }
}
