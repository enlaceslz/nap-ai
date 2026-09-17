export type OltVendor = 'ZTE' | 'HUAWEI' | 'NOKIA' | 'FIBERHOME' | 'DATACOM' | 'VSOL';

export type OltProtocol = 'SSH' | 'TELNET' | 'SNMP' | 'REST';

export type OltStatus = 'online' | 'offline' | 'warning' | 'unreachable';

export type OnuStatus = 'online' | 'offline' | 'los' | 'dying_gasp' | 'blocked' | 'unauthorized';

export type OltCardType = 'GPON' | 'XG-PON' | 'XGS-PON' | 'UPLINK_GE' | 'UPLINK_10GE' | 'CONTROL';

export interface OltDevice {
  id: string;
  nome: string;
  fabricante: OltVendor;
  modelo: string;
  ip: string;
  porta: number;
  protocolo: OltProtocol;
  usuario: string;
  senha?: string; // Nunca retornado puro no frontend
  snmp_community?: string;
  versao_firmware?: string;
  uptime?: string;
  cpu_usage?: number;
  memory_usage?: number;
  temperatura?: number;
  pop: string;
  localizacao?: string;
  descricao?: string;
  status: OltStatus;
  ultima_comunicacao: string;
  versao_driver: string;
  criado_em: string;
  zabbix_hostid?: string;
  total_pons?: number;
  total_onus?: number;
  onus_online?: number;
  onus_offline?: number;
}

export interface OltSlot {
  id: string;
  olt_id: string;
  slot_number: number;
  card_type: OltCardType;
  card_model: string;
  card_status: 'normal' | 'faulty' | 'empty';
  total_ports: number;
  ports_active: number;
}

export interface OltPonPort {
  id: string;
  olt_id: string;
  slot_number: number;
  port_number: number;
  pon_identifier: string; // Ex: "1/1/1" ou "0/1/4"
  tecnologia: 'GPON' | 'XG-PON' | 'XGS-PON';
  status: 'up' | 'down' | 'degraded';
  onus_total: number;
  onus_online: number;
  onus_offline: number;
  rx_power_avg: number; // dBm
  tx_power: number; // dBm
  vlan_default: number;
  alarmes_ativos: number;
  descricao?: string;
}

export interface OnuDevice {
  id: string;
  olt_id: string;
  olt_nome?: string;
  olt_fabricante?: OltVendor;
  pon_identifier: string;
  onu_id: number;
  serial: string;
  mac?: string;
  loid?: string;
  nome: string;
  cliente_id?: number | string;
  cliente_nome?: string;
  cliente_cpf?: string;
  modelo: string;
  firmware?: string;
  status: OnuStatus;
  rx_onu: number; // dBm (Potência recebida na ONU)
  tx_onu: number; // dBm (Potência transmitida da ONU)
  rx_olt: number; // dBm (Potência que a OLT recebe da ONU)
  tx_olt: number; // dBm (Potência da porta PON OLT)
  distancia_metros: number;
  temperatura?: number;
  uptime?: string;
  vlan: number;
  profile_line: string;
  profile_service: string;
  ip_address?: string;
  ultimo_online?: string;
  ultimo_offline?: string;
  criado_em: string;
  cpe_tr069_id?: string; // Referência com GenieACS
}

export interface OpticalTelemetry {
  onu_id: string;
  rx_onu: number;
  tx_onu: number;
  rx_olt: number;
  tx_olt: number;
  temperatura: number;
  voltagem_volts: number;
  bias_current_ma: number;
  distancia_metros: number;
  qualidade_sinal: 'excelente' | 'bom' | 'alerta' | 'critico';
  timestamp: string;
  historico: {
    timestamp: string;
    rx: number;
    tx: number;
  }[];
}

export interface OnuDiagnosticResult {
  onu_id: string;
  optical: OpticalTelemetry;
  ping: {
    success: boolean;
    rtt_ms: number;
    packet_loss_percent: number;
  };
  mac_table: {
    port: string;
    mac: string;
    vlan: number;
    tipo: 'dynamic' | 'static';
  }[];
  traffic: {
    rx_rate_mbps: number;
    tx_rate_mbps: number;
    rx_packets: number;
    tx_packets: number;
    drop_packets: number;
  };
  alarms: string[];
  last_events: {
    timestamp: string;
    event: string;
    severity: 'info' | 'warning' | 'critical';
  }[];
}

export interface UnassignedOnu {
  id: string;
  olt_id: string;
  olt_nome: string;
  fabricante_olt: OltVendor;
  pon_identifier: string;
  serial: string;
  modelo_estimado: string;
  sinal_rx: number;
  descoberto_em: string;
}

export interface OltAlarm {
  id: string;
  olt_id: string;
  olt_nome: string;
  onu_id?: string;
  onu_serial?: string;
  pon_identifier?: string;
  severidade: 'critical' | 'major' | 'minor' | 'warning';
  tipo: 'LOS' | 'LOF' | 'DYING_GASP' | 'LOW_OPTICAL_POWER' | 'HIGH_OPTICAL_POWER' | 'PON_DOWN' | 'HIGH_TEMPERATURE' | 'COMMUNICATION_FAIL';
  descricao: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface OltProfile {
  id: string;
  olt_id: string;
  nome: string;
  tipo: 'line' | 'service' | 'dba';
  download_mbps: number;
  upload_mbps: number;
  vlans: number[];
}

export interface OltSystemInfo {
  fabricante: OltVendor;
  modelo: string;
  versao_firmware: string;
  uptime: string;
  cpu_percent: number;
  memory_percent: number;
  temperatura_c: number;
  chassis: string;
  serial_number: string;
  mac_base: string;
}

export interface AuthorizeOnuPayload {
  olt_id: string;
  pon_identifier: string;
  serial: string;
  onu_id?: number;
  nome: string;
  modelo?: string;
  vlan: number;
  profile_line: string;
  profile_service: string;
  cliente_id?: number | string;
  cliente_nome?: string;
  cliente_cpf?: string;
}

export interface BatchOnuOperationPayload {
  onu_ids: string[];
  action: 'reboot' | 'disable' | 'enable' | 'change_vlan' | 'change_profile';
  params?: {
    vlan?: number;
    profile_line?: string;
    profile_service?: string;
  };
}
