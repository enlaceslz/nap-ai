export type OltFabricante = 'ZTE' | 'HUAWEI' | 'DATACOM' | 'FIBERHOME' | 'VSOL';
export type OltProtocolo = 'SSH' | 'TELNET' | 'SNMP' | 'NETCONF';
export type OnuStatus = 'online' | 'offline' | 'los' | 'power_fail' | 'blocked';
export type AlarmSeverity = 'critical' | 'major' | 'minor' | 'warning' | 'info';

export interface OltDevice {
  id: string;
  nome: string;
  fabricante: OltFabricante;
  modelo: string;
  ip: string;
  porta: number;
  protocolo: OltProtocolo;
  usuario?: string;
  senha?: string;
  snmp_community?: string;
  versao_firmware?: string;
  uptime?: string;
  cpu_usage?: number;
  memory_usage?: number;
  temperatura?: number;
  pop?: string;
  localizacao?: string;
  descricao?: string;
  status: 'online' | 'offline' | 'unreachable' | 'warning';
  ultima_comunicacao?: string;
  total_pons?: number;
  total_onus?: number;
  onus_online?: number;
  onus_offline?: number;
  versao_driver?: string;
  criado_em?: string;
  zabbix_hostid?: string;
}

export interface OltSlot {
  id: string;
  olt_id: string;
  slot_number: number;
  card_type: 'CONTROL' | 'GPON' | 'XGS-PON' | 'EPON' | 'UPLINK' | 'POWER';
  card_model: string;
  card_status: 'normal' | 'fault' | 'offline' | 'standby';
  total_ports: number;
  ports_active: number;
}

export interface OltPonPort {
  id: string;
  olt_id: string;
  slot_number: number;
  port_number: number;
  pon_identifier: string;
  tecnologia: 'GPON' | 'XGS-PON' | 'EPON';
  status: 'up' | 'down' | 'degraded';
  onus_total: number;
  onus_online: number;
  onus_offline: number;
  rx_power_avg?: number;
  tx_power?: number;
  vlan_default?: number;
  alarmes_ativos?: number;
  descricao?: string;
}

export interface OnuDevice {
  id: string;
  olt_id: string;
  olt_nome?: string;
  olt_fabricante?: OltFabricante;
  pon_identifier: string;
  onu_id: number;
  serial: string;
  mac?: string;
  nome: string;
  cliente_id?: number;
  cliente_nome?: string;
  cliente_cpf?: string;
  modelo?: string;
  firmware?: string;
  status: OnuStatus;
  rx_onu: number;
  tx_onu: number;
  rx_olt: number;
  tx_olt: number;
  distancia_metros: number;
  temperatura: number;
  uptime: string;
  vlan: number;
  profile_line?: string;
  profile_service?: string;
  ip_address?: string;
  ultimo_offline?: string;
  ultimo_online?: string;
  criado_em: string;
  cpe_tr069_id?: string;
}

export interface OpticalTelemetry {
  rx_onu: number;
  tx_onu: number;
  rx_olt: number;
  tx_olt: number;
  distancia_metros: number;
  temperatura: number;
  voltagem_v: number;
  corrente_bias_ma: number;
  qualidade_sinal: 'excelente' | 'bom' | 'alerta' | 'critico';
  timestamp: string;
}

export interface OnuDiagnosticResult {
  onu_id: string;
  serial: string;
  ping_ok: boolean;
  latencia_ms: number;
  perda_pacotes_percent: number;
  optical: OpticalTelemetry;
  tr069_vinculado: boolean;
  cpe_serial?: string;
  sugestao_ia?: string;
  historico_potencia: Array<{ data: string; rx: number; tx: number }>;
}

export interface UnassignedOnu {
  id: string;
  olt_id: string;
  olt_nome: string;
  fabricante_olt: OltFabricante;
  pon_identifier: string;
  serial: string;
  modelo_estimado?: string;
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
  severidade: AlarmSeverity;
  tipo: 'LOS' | 'LOF' | 'LOW_OPTICAL_POWER' | 'HIGH_TEMP' | 'DYING_GASP' | 'SLOT_FAULT' | 'CPU_HIGH';
  descricao: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface OltProfile {
  id: string;
  nome: string;
  tipo: 'line' | 'service' | 'traffic';
  banda_down_mbps?: number;
  banda_up_mbps?: number;
  descricao?: string;
}

export interface AuthorizeOnuPayload {
  olt_id: string;
  pon_identifier: string;
  serial: string;
  cliente_nome: string;
  cliente_cpf?: string;
  vlan: number;
  profile_line: string;
  profile_service: string;
  modelo?: string;
  mac?: string;
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

export interface OltDashboardMetrics {
  olts: {
    total: number;
    online: number;
    down: number;
  };
  onus: {
    total: number;
    online: number;
    offline: number;
  };
  alarms: {
    total: number;
    critical: number;
    warning: number;
  };
  unassigned_count: number;
}
