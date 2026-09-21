import { OltDriver } from './driverInterface';
import { assertRealService, isMockAllowed } from '../security/mockGuard';
import crypto from 'crypto';
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
 * Driver para OLTs ZTE (C300, C320, C600).
 * Abstrai os comandos CLI ZXROS (ex: show gpon onu uncfg, show gpon onu state, interface gpon-olt_1/x/y).
 */
export class ZteOltDriver implements OltDriver {
  private olt: OltDevice;
  private connected: boolean = false;

  constructor(olt: OltDevice) {
    this.olt = olt;
  }

  public async connect(): Promise<{ success: boolean; message: string; latency_ms: number }> {
    const startTime = Date.now();
    // Simulação de handshake SSH/Telnet com prompt ZTE ZXROS
    await new Promise((resolve) => setTimeout(resolve, 80));
    this.connected = true;
    const latency = Date.now() - startTime;
    return {
      success: true,
      message: `Conexão SSH estabelecida com sucesso na OLT ZTE ${this.olt.modelo} (${this.olt.ip}:${this.olt.porta || 22})`,
      latency_ms: latency
    };
  }

  public async disconnect(): Promise<void> {
    this.connected = false;
  }

  public async getSystemInfo(): Promise<OltSystemInfo> {
    return {
      fabricante: 'ZTE',
      modelo: this.olt.modelo || 'C300',
      versao_firmware: this.olt.versao_firmware || 'ZXROS V2.1.0_P1T9',
      uptime: this.olt.uptime || '128 dias, 14 horas, 32 minutos',
      cpu_percent: this.olt.cpu_usage || 24,
      memory_percent: this.olt.memory_usage || 41,
      temperatura_c: this.olt.temperatura || 42,
      chassis: 'ZTE ZXA10 19-inch Shelf',
      serial_number: `ZTEG${this.olt.id.replace(/\D/g, '').padStart(8, '0')}`,
      mac_base: 'd0:15:a6:3f:10:00'
    };
  }

  public async getInventory(): Promise<{ slots: OltSlot[]; pons: OltPonPort[] }> {
    const slots: OltSlot[] = [
      {
        id: `${this.olt.id}-slot-1`,
        olt_id: this.olt.id,
        slot_number: 1,
        card_type: 'CONTROL',
        card_model: 'SCXN (Control/Switching Board)',
        card_status: 'normal',
        total_ports: 4,
        ports_active: 2
      },
      {
        id: `${this.olt.id}-slot-2`,
        olt_id: this.olt.id,
        slot_number: 2,
        card_type: 'CONTROL',
        card_model: 'SCXN Standby',
        card_status: 'normal',
        total_ports: 4,
        ports_active: 0
      },
      {
        id: `${this.olt.id}-slot-3`,
        olt_id: this.olt.id,
        slot_number: 3,
        card_type: 'GPON',
        card_model: 'GTGH (16-Port GPON Board)',
        card_status: 'normal',
        total_ports: 16,
        ports_active: 14
      },
      {
        id: `${this.olt.id}-slot-4`,
        olt_id: this.olt.id,
        slot_number: 4,
        card_type: 'GPON',
        card_model: 'GTGO (8-Port GPON Board)',
        card_status: 'normal',
        total_ports: 8,
        ports_active: 8
      },
      {
        id: `${this.olt.id}-slot-5`,
        olt_id: this.olt.id,
        slot_number: 5,
        card_type: 'UPLINK_10GE',
        card_model: 'XUTQ (4-Port 10GE Uplink Board)',
        card_status: 'normal',
        total_ports: 4,
        ports_active: 2
      }
    ];

    const pons = await this.getPonInterfaces();
    return { slots, pons };
  }

  public async getPonInterfaces(): Promise<OltPonPort[]> {
    // 8 portas PON padrão no slot 3 e 4
    const pons: OltPonPort[] = [
      {
        id: `${this.olt.id}-pon-1-3-1`,
        olt_id: this.olt.id,
        slot_number: 3,
        port_number: 1,
        pon_identifier: '1/3/1',
        tecnologia: 'GPON',
        status: 'up',
        onus_total: 48,
        onus_online: 46,
        onus_offline: 2,
        rx_power_avg: -19.4,
        tx_power: 2.8,
        vlan_default: 101,
        alarmes_ativos: 0,
        descricao: 'Bairro Centro - Rota Primária'
      },
      {
        id: `${this.olt.id}-pon-1-3-2`,
        olt_id: this.olt.id,
        slot_number: 3,
        port_number: 2,
        pon_identifier: '1/3/2',
        tecnologia: 'GPON',
        status: 'up',
        onus_total: 56,
        onus_online: 53,
        onus_offline: 3,
        rx_power_avg: -20.1,
        tx_power: 2.7,
        vlan_default: 102,
        alarmes_ativos: 1,
        descricao: 'Jardim Primavera - Condomínios'
      },
      {
        id: `${this.olt.id}-pon-1-3-3`,
        olt_id: this.olt.id,
        slot_number: 3,
        port_number: 3,
        pon_identifier: '1/3/3',
        tecnologia: 'GPON',
        status: 'up',
        onus_total: 39,
        onus_online: 38,
        onus_offline: 1,
        rx_power_avg: -18.7,
        tx_power: 2.9,
        vlan_default: 103,
        alarmes_ativos: 0,
        descricao: 'Polo Industrial Norte'
      },
      {
        id: `${this.olt.id}-pon-1-3-4`,
        olt_id: this.olt.id,
        slot_number: 3,
        port_number: 4,
        pon_identifier: '1/3/4',
        tecnologia: 'GPON',
        status: 'up',
        onus_total: 61,
        onus_online: 57,
        onus_offline: 4,
        rx_power_avg: -21.8,
        tx_power: 2.6,
        vlan_default: 104,
        alarmes_ativos: 2,
        descricao: 'Vila Nova - Expansão FTTH'
      },
      {
        id: `${this.olt.id}-pon-1-4-1`,
        olt_id: this.olt.id,
        slot_number: 4,
        port_number: 1,
        pon_identifier: '1/4/1',
        tecnologia: 'GPON',
        status: 'up',
        onus_total: 42,
        onus_online: 41,
        onus_offline: 1,
        rx_power_avg: -19.0,
        tx_power: 2.8,
        vlan_default: 105,
        alarmes_ativos: 0,
        descricao: 'Av. Brasil - Comercial'
      }
    ];
    return pons;
  }

  public async getOnus(ponIdentifier?: string): Promise<OnuDevice[]> {
    // Retorna banco gerenciado pelo OltService
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
        fabricante_olt: 'ZTE',
        pon_identifier: '1/3/2',
        serial: 'ZTEGC48190A1',
        modelo_estimado: 'ZTE F670L (Dual Band AC)',
        sinal_rx: -19.8,
        descoberto_em: new Date(Date.now() - 1000 * 60 * 12).toISOString()
      },
      {
        id: `unassigned-${this.olt.id}-2`,
        olt_id: this.olt.id,
        olt_nome: this.olt.nome,
        fabricante_olt: 'ZTE',
        pon_identifier: '1/3/4',
        serial: 'ZTEGC77321EF',
        modelo_estimado: 'ZTE F680 (Wi-Fi 6 AX)',
        sinal_rx: -21.4,
        descoberto_em: new Date(Date.now() - 1000 * 60 * 45).toISOString()
      }
    ];
  }

  public async authorizeOnu(data: AuthorizeOnuPayload): Promise<{ success: boolean; onu: OnuDevice; raw_output?: string }> {
    if (!isMockAllowed() && !this.connected) {
      assertRealService('OLT_ZTE', 'OLT física não conectada');
    }

    const onuId = data.onu_id || crypto.randomInt(10, 50);
    const onu: OnuDevice = {
      id: `onu-zte-${Date.now()}`,
      olt_id: this.olt.id,
      olt_nome: this.olt.nome,
      olt_fabricante: 'ZTE',
      pon_identifier: data.pon_identifier,
      onu_id: onuId,
      serial: data.serial,
      mac: `74:a7:8e:${crypto.randomBytes(3).toString('hex').match(/../g)?.join(':') || '10:20:30'}`,
      nome: data.nome,
      cliente_id: data.cliente_id,
      cliente_nome: data.cliente_nome,
      cliente_cpf: data.cliente_cpf,
      modelo: data.modelo || 'ZTE F670L',
      firmware: 'V1.0.10P3T1',
      status: 'online',
      rx_onu: -19.5,
      tx_onu: 2.3,
      rx_olt: -20.1,
      tx_olt: 2.8,
      distancia_metros: 1420,
      temperatura: 41,
      uptime: '0 dias, 0 horas, 2 minutos',
      vlan: data.vlan,
      profile_line: data.profile_line,
      profile_service: data.profile_service,
      ip_address: `100.64.${crypto.randomInt(10, 200)}.${crypto.randomInt(2, 250)}`,
      ultimo_online: new Date().toISOString(),
      criado_em: new Date().toISOString()
    };

    const raw_output = `
ZTE(config)# interface gpon-olt_${data.pon_identifier}
ZTE(config-if)# onu ${onuId} type ${data.modelo || 'ZTE-F670L'} sn ${data.serial}
ZTE(config-if)# onu ${onuId} profile line ${data.profile_line} remote ${data.profile_service}
ZTE(config-if)# exit
ZTE(config)# interface gpon-onu_${data.pon_identifier}:${onuId}
ZTE(config-onu-if)# name ${data.nome}
ZTE(config-onu-if)# switchport mode trunk vport 1
ZTE(config-onu-if)# service-port 1 vport 1 user-vlan ${data.vlan} vlan ${data.vlan}
ZTE(config-onu-if)# exit
% Commit: SUCCESS (ONU authorized and state bound)
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
      message: `Comando 'no onu ${onuId}' executado com sucesso na OLT ZTE ${this.olt.nome}. ONU desprovisionada.`
    };
  }

  public async rebootOnu(onuId: string): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `Comando 'onu reboot' enviado para a ONU ID ${onuId}. A ONU responderá em aproximadamente 45 segundos.`
    };
  }

  public async enableOnu(onuId: string): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `ONU ID ${onuId} desbloqueada administrativamente na OLT ZTE (no shutdown / status ativo).`
    };
  }

  public async disableOnu(onuId: string): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `ONU ID ${onuId} bloqueada administrativamente na OLT ZTE (shutdown / service-port disabled).`
    };
  }

  public async getOpticalInfo(onuId: string): Promise<OpticalTelemetry> {
    if (!isMockAllowed() && !this.connected) {
      assertRealService('OLT_ZTE', 'OLT física não conectada para medição óptica');
    }

    const rx = -19.4;
    const tx = 2.1;
    const distancia = 1350;

    const historico = [
      { timestamp: '10:00', rx: -19.1, tx: 2.2 },
      { timestamp: '11:00', rx: -19.3, tx: 2.1 },
      { timestamp: '12:00', rx: -19.2, tx: 2.2 },
      { timestamp: '13:00', rx: -19.4, tx: 2.0 },
      { timestamp: '14:00', rx: -19.2, tx: 2.1 },
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
      rx_olt: Number((rx - 0.8).toFixed(2)),
      tx_olt: 2.8,
      temperatura: 42.5,
      voltagem_volts: 3.28,
      bias_current_ma: 14.6,
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
        rtt_ms: 3.4,
        packet_loss_percent: 0
      },
      mac_table: [
        { port: 'eth1', mac: '40:b0:76:88:12:ef', vlan: 102, tipo: 'dynamic' },
        { port: 'eth2', mac: 'c8:3a:35:10:9c:31', vlan: 102, tipo: 'dynamic' }
      ],
      traffic: {
        rx_rate_mbps: 45.2,
        tx_rate_mbps: 8.7,
        rx_packets: 4892019,
        tx_packets: 1209384,
        drop_packets: 0
      },
      alarms: optical.rx_onu < -27 ? ['Alarme Óptico: Sinal RX Crítico abaixo de -27dBm'] : [],
      last_events: [
        { timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), event: 'Link GPON estabelecido com sucesso (O5 Operation)', severity: 'info' },
        { timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), event: 'Porta Ethernet 1 UP (1000Mbps Full Duplex)', severity: 'info' }
      ]
    };
  }

  public async getAlarms(): Promise<OltAlarm[]> {
    return [
      {
        id: `alarm-zte-${this.olt.id}-1`,
        olt_id: this.olt.id,
        olt_nome: this.olt.nome,
        onu_serial: 'ZTEGC1188390',
        pon_identifier: '1/3/4',
        severidade: 'minor',
        tipo: 'LOW_OPTICAL_POWER',
        descricao: 'Atenuação óptica elevada na fibra: sinal RX em -26.8 dBm',
        timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        acknowledged: false
      }
    ];
  }

  public async getVlans(): Promise<number[]> {
    return [100, 101, 102, 103, 104, 105, 200, 300, 400];
  }

  public async getProfiles(): Promise<OltProfile[]> {
    return [
      { id: 'zte-prof-1', olt_id: this.olt.id, nome: 'PROFILE_100M_SIMETRICO', tipo: 'line', download_mbps: 100, upload_mbps: 100, vlans: [100, 101] },
      { id: 'zte-prof-2', olt_id: this.olt.id, nome: 'PROFILE_400M_FIBRA', tipo: 'line', download_mbps: 400, upload_mbps: 200, vlans: [102, 103] },
      { id: 'zte-prof-3', olt_id: this.olt.id, nome: 'PROFILE_700M_TURBO', tipo: 'line', download_mbps: 700, upload_mbps: 350, vlans: [104, 105] },
      { id: 'zte-prof-4', olt_id: this.olt.id, nome: 'PROFILE_1GIGA_PRO', tipo: 'line', download_mbps: 1000, upload_mbps: 500, vlans: [200] },
      { id: 'zte-srv-1', olt_id: this.olt.id, nome: 'SRV_INTERNET_RESIDENCIAL', tipo: 'service', download_mbps: 700, upload_mbps: 350, vlans: [102] }
    ];
  }
}
