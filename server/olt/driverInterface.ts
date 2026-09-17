import {
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
 * Driver SDK: Interface comum padronizada para abstração multivendor de OLTs.
 * Qualquer fabricante (ZTE, Huawei, Nokia, FiberHome, Datacom) implementa
 * este contrato sem que o Core do NAP conheça particularidades de sintaxe ou CLI.
 */
export interface OltDriver {
  /**
   * Estabelece conexão com a OLT (SSH/Telnet/SNMP/REST) e valida credenciais.
   */
  connect(): Promise<{ success: boolean; message: string; latency_ms: number }>;

  /**
   * Encerra a sessão aberta.
   */
  disconnect(): Promise<void>;

  /**
   * Obtém informações gerais de sistema e telemetria básica da OLT.
   */
  getSystemInfo(): Promise<OltSystemInfo>;

  /**
   * Executa descoberta e retorna inventário lógico da OLT (Chassis, Slots, Placas, Portas PON).
   */
  getInventory(): Promise<{ slots: OltSlot[]; pons: OltPonPort[] }>;

  /**
   * Consulta a lista de interfaces PON com contadores agregados e potências.
   */
  getPonInterfaces(): Promise<OltPonPort[]>;

  /**
   * Consulta ONUs cadastradas na OLT ou filtradas por porta PON.
   */
  getOnus(ponIdentifier?: string): Promise<OnuDevice[]>;

  /**
   * Consulta os dados detalhados de uma ONU específica por ID ou Serial.
   */
  getOnu(onuIdOrSerial: string): Promise<OnuDevice | null>;

  /**
   * Consulta ONUs detectadas na rede óptica que ainda não foram autorizadas/provisionadas.
   */
  getUnassignedOnus(): Promise<UnassignedOnu[]>;

  /**
   * Provisiona/autoriza uma ONU na interface PON especificada com seus perfis e VLANs.
   */
  authorizeOnu(data: AuthorizeOnuPayload): Promise<{ success: boolean; onu: OnuDevice; raw_output?: string }>;

  /**
   * Desprovisiona/remove a ONU da configuração da OLT.
   */
  deleteOnu(onuId: string): Promise<{ success: boolean; message: string }>;

  /**
   * Envia comando de reinicialização remota para a ONU (Dying Gasp / Reboot GPON).
   */
  rebootOnu(onuId: string): Promise<{ success: boolean; message: string }>;

  /**
   * Desbloqueia a porta/serviço da ONU.
   */
  enableOnu(onuId: string): Promise<{ success: boolean; message: string }>;

  /**
   * Bloqueia administrativamente o tráfego da ONU (Admin Down).
   */
  disableOnu(onuId: string): Promise<{ success: boolean; message: string }>;

  /**
   * Consulta telemetria óptica em tempo real (RX/TX da ONU e da OLT, temperatura, bias).
   */
  getOpticalInfo(onuId: string): Promise<OpticalTelemetry>;

  /**
   * Executa bateria completa de diagnóstico na ONU (sinal, ping, MACs aprendidos, tráfego).
   */
  runDiagnostics(onuId: string): Promise<OnuDiagnosticResult>;

  /**
   * Consulta alarmes ativos reportados pela OLT e suas portas PON.
   */
  getAlarms(): Promise<OltAlarm[]>;

  /**
   * Consulta VLANs configuradas e disponíveis na OLT.
   */
  getVlans(): Promise<number[]>;

  /**
   * Consulta perfis de linha (line-profile) e serviço (service-profile) cadastrados na OLT.
   */
  getProfiles(): Promise<OltProfile[]>;
}
