import fs from 'fs';
import path from 'path';
import {
  OltDevice,
  OltSlot,
  OltPonPort,
  OnuDevice,
  OpticalTelemetry,
  OnuDiagnosticResult,
  UnassignedOnu,
  OltAlarm,
  OltProfile,
  AuthorizeOnuPayload,
  BatchOnuOperationPayload
} from './types';
import { OltDriver } from './driverInterface';
import { ZteOltDriver } from './zteDriver';
import { HuaweiOltDriver } from './huaweiDriver';
import { VsolDriver } from './vsolDriver';

interface OltDatabaseSchema {
  olts: OltDevice[];
  slots: OltSlot[];
  pons: OltPonPort[];
  onus: OnuDevice[];
  unassigned: UnassignedOnu[];
  alarms: OltAlarm[];
}

export class OltService {
  private static instance: OltService;
  private dbPath: string;
  private data: OltDatabaseSchema;

  private constructor() {
    this.dbPath = path.join(process.cwd(), 'data', 'olts_database.json');
    this.data = this.loadDatabase();
  }

  public static getInstance(): OltService {
    if (!OltService.instance) {
      OltService.instance = new OltService();
    }
    return OltService.instance;
  }

  private loadDatabase(): OltDatabaseSchema {
    try {
      if (fs.existsSync(this.dbPath)) {
        const content = fs.readFileSync(this.dbPath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (e) {
      console.warn('[OLT Manager] Falha ao carregar banco JSON local, inicializando dados padrão:', e);
    }

    const initialData = this.getInitialSeedData();
    this.saveDatabase(initialData);
    return initialData;
  }

  private saveDatabase(dataToSave?: OltDatabaseSchema): void {
    try {
      const targetData = dataToSave || this.data;
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dbPath, JSON.stringify(targetData, null, 2), 'utf-8');
    } catch (e) {
      console.error('[OLT Manager] Erro ao salvar banco JSON:', e);
    }
  }

  public getDriver(olt: OltDevice): OltDriver {
    if (olt.fabricante === 'ZTE') {
      return new ZteOltDriver(olt);
    } else if (olt.fabricante === 'HUAWEI') {
      return new HuaweiOltDriver(olt);
    } else if (olt.fabricante === 'VSOL') {
      return new VsolDriver(olt);
    }
    // Fallback padrão se for ZTE compatível
    return new ZteOltDriver(olt);
  }

  // ==================== OLT CRUD & METRICS ====================

  public getOlts(): OltDevice[] {
    // Atualiza contadores dinâmicos de ONUs
    return this.data.olts.map((olt) => {
      const onus = this.data.onus.filter((o) => o.olt_id === olt.id);
      const online = onus.filter((o) => o.status === 'online').length;
      const offline = onus.filter((o) => o.status !== 'online').length;
      const pons = this.data.pons.filter((p) => p.olt_id === olt.id);

      // Remove senha de payloads públicos
      const { senha, ...safeOlt } = olt;
      return {
        ...safeOlt,
        total_pons: pons.length,
        total_onus: onus.length,
        onus_online: online,
        onus_offline: offline
      } as OltDevice;
    });
  }

  public getOltById(id: string): OltDevice | null {
    const olt = this.data.olts.find((o) => o.id === id);
    if (!olt) return null;
    const { senha, ...safeOlt } = olt;
    return safeOlt as OltDevice;
  }

  public async createOlt(payload: Partial<OltDevice>): Promise<OltDevice> {
    const id = `olt-${Date.now()}`;
    const newOlt: OltDevice = {
      id,
      nome: payload.nome || 'Nova OLT',
      fabricante: payload.fabricante || 'ZTE',
      modelo: payload.modelo || (payload.fabricante === 'HUAWEI' ? 'MA5800-X7' : 'C300'),
      ip: payload.ip || '10.0.0.10',
      porta: payload.porta || 22,
      protocolo: payload.protocolo || 'SSH',
      usuario: payload.usuario || 'admin',
      senha: payload.senha ? '********' : undefined,
      snmp_community: payload.snmp_community || 'public_nap',
      versao_firmware: payload.fabricante === 'HUAWEI' ? 'MA5800V800R018C00' : 'ZXROS V2.1.0',
      uptime: '1 dia, 0 horas, 0 min',
      cpu_usage: 18,
      memory_usage: 35,
      temperatura: 38,
      pop: payload.pop || 'POP Central',
      localizacao: payload.localizacao || 'Rack 01 - POP Principal',
      descricao: payload.descricao || 'Cadastrada pelo NAP OLT Manager',
      status: 'online',
      ultima_comunicacao: new Date().toISOString(),
      versao_driver: '1.0.0-native',
      criado_em: new Date().toISOString(),
      zabbix_hostid: payload.zabbix_hostid
    };

    this.data.olts.push(newOlt);

    // Executa descoberta inicial de slots e pons para a nova OLT
    const driver = this.getDriver(newOlt);
    const { slots, pons } = await driver.getInventory();
    this.data.slots.push(...slots);
    this.data.pons.push(...pons);

    this.saveDatabase();
    return this.getOltById(id)!;
  }

  public updateOlt(id: string, payload: Partial<OltDevice>): OltDevice | null {
    const index = this.data.olts.findIndex((o) => o.id === id);
    if (index === -1) return null;

    this.data.olts[index] = {
      ...this.data.olts[index],
      ...payload,
      id // Imutável
    };
    this.saveDatabase();
    return this.getOltById(id);
  }

  public deleteOlt(id: string): boolean {
    const initialLen = this.data.olts.length;
    this.data.olts = this.data.olts.filter((o) => o.id !== id);
    this.data.slots = this.data.slots.filter((s) => s.olt_id !== id);
    this.data.pons = this.data.pons.filter((p) => p.olt_id !== id);
    this.data.onus = this.data.onus.filter((o) => o.olt_id !== id);
    this.data.unassigned = this.data.unassigned.filter((u) => u.olt_id !== id);
    this.data.alarms = this.data.alarms.filter((a) => a.olt_id !== id);

    this.saveDatabase();
    return this.data.olts.length < initialLen;
  }

  public async testConnection(oltId: string): Promise<{ success: boolean; latency_ms: number; message: string; system_info?: any }> {
    const olt = this.data.olts.find((o) => o.id === oltId);
    if (!olt) throw new Error('OLT não encontrada');

    const driver = this.getDriver(olt);
    const conn = await driver.connect();
    const system = await driver.getSystemInfo();

    // Atualiza status e timestamp
    olt.status = conn.success ? 'online' : 'unreachable';
    olt.ultima_comunicacao = new Date().toISOString();
    olt.cpu_usage = system.cpu_percent;
    olt.memory_usage = system.memory_percent;
    olt.temperatura = system.temperatura_c;
    this.saveDatabase();

    return {
      success: conn.success,
      latency_ms: conn.latency_ms,
      message: conn.message,
      system_info: system
    };
  }

  public async runDiscovery(oltId: string): Promise<{ slots: OltSlot[]; pons: OltPonPort[]; onus_count: number }> {
    const olt = this.data.olts.find((o) => o.id === oltId);
    if (!olt) throw new Error('OLT não encontrada');

    const driver = this.getDriver(olt);
    const { slots, pons } = await driver.getInventory();

    // Atualiza slots e pons
    this.data.slots = this.data.slots.filter((s) => s.olt_id !== oltId).concat(slots);
    this.data.pons = this.data.pons.filter((p) => p.olt_id !== oltId).concat(pons);

    olt.ultima_comunicacao = new Date().toISOString();
    this.saveDatabase();

    const onusCount = this.data.onus.filter((o) => o.olt_id === oltId).length;
    return { slots, pons, onus_count: onusCount };
  }

  // ==================== INVENTORY & PONS ====================

  public getSlots(oltId: string): OltSlot[] {
    return this.data.slots.filter((s) => s.olt_id === oltId);
  }

  public getPons(oltId?: string): OltPonPort[] {
    let pons = this.data.pons;
    if (oltId) {
      pons = pons.filter((p) => p.olt_id === oltId);
    }
    // Sincroniza contadores de ONUs
    return pons.map((p) => {
      const onus = this.data.onus.filter((o) => o.olt_id === p.olt_id && o.pon_identifier === p.pon_identifier);
      const online = onus.filter((o) => o.status === 'online').length;
      return {
        ...p,
        onus_total: onus.length,
        onus_online: online,
        onus_offline: onus.length - online
      };
    });
  }

  // ==================== ONUS & CLIENTES ÓPTICOS ====================

  public getOnus(filters?: { olt_id?: string; pon_identifier?: string; status?: string; search?: string }): OnuDevice[] {
    let result = [...this.data.onus];

    if (filters?.olt_id) {
      result = result.filter((o) => o.olt_id === filters.olt_id);
    }
    if (filters?.pon_identifier) {
      result = result.filter((o) => o.pon_identifier === filters.pon_identifier);
    }
    if (filters?.status && filters.status !== 'all') {
      result = result.filter((o) => o.status === filters.status);
    }
    if (filters?.search) {
      const query = filters.search.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.serial.toLowerCase().includes(query) ||
          (o.mac && o.mac.toLowerCase().includes(query)) ||
          o.nome.toLowerCase().includes(query) ||
          (o.cliente_nome && o.cliente_nome.toLowerCase().includes(query)) ||
          (o.cliente_cpf && o.cliente_cpf.includes(query)) ||
          o.pon_identifier.toLowerCase().includes(query) ||
          (o.olt_nome && o.olt_nome.toLowerCase().includes(query)) ||
          String(o.onu_id) === query ||
          String(o.vlan) === query
      );
    }

    return result;
  }

  public getOnuById(id: string): OnuDevice | null {
    return this.data.onus.find((o) => o.id === id) || null;
  }

  public async authorizeOnu(payload: AuthorizeOnuPayload): Promise<{ success: boolean; onu: OnuDevice; raw_output?: string }> {
    const olt = this.data.olts.find((o) => o.id === payload.olt_id);
    if (!olt) throw new Error('OLT especificada não encontrada');

    const driver = this.getDriver(olt);
    const result = await driver.authorizeOnu(payload);

    if (result.success && result.onu) {
      // Remove da lista de descobertas não autorizadas se constar
      this.data.unassigned = this.data.unassigned.filter((u) => u.serial !== payload.serial);
      // Adiciona na lista de ONUs provisionadas
      this.data.onus.push(result.onu);
      this.saveDatabase();
    }

    return result;
  }

  public async rebootOnu(onuId: string): Promise<{ success: boolean; message: string }> {
    const onu = this.data.onus.find((o) => o.id === onuId);
    if (!onu) throw new Error('ONU não encontrada');

    const olt = this.data.olts.find((o) => o.id === onu.olt_id);
    const driver = this.getDriver(olt || this.data.olts[0]);
    const res = await driver.rebootOnu(String(onu.onu_id));

    // Atualiza uptime da ONU
    onu.uptime = '0 dias, 0 horas, 1 minuto (Recém reiniciada)';
    this.saveDatabase();
    return res;
  }

  public async enableOnu(onuId: string): Promise<{ success: boolean; message: string }> {
    const onu = this.data.onus.find((o) => o.id === onuId);
    if (!onu) throw new Error('ONU não encontrada');

    const olt = this.data.olts.find((o) => o.id === onu.olt_id);
    const driver = this.getDriver(olt || this.data.olts[0]);
    const res = await driver.enableOnu(String(onu.onu_id));

    onu.status = 'online';
    this.saveDatabase();
    return res;
  }

  public async disableOnu(onuId: string): Promise<{ success: boolean; message: string }> {
    const onu = this.data.onus.find((o) => o.id === onuId);
    if (!onu) throw new Error('ONU não encontrada');

    const olt = this.data.olts.find((o) => o.id === onu.olt_id);
    const driver = this.getDriver(olt || this.data.olts[0]);
    const res = await driver.disableOnu(String(onu.onu_id));

    onu.status = 'blocked';
    this.saveDatabase();
    return res;
  }

  public async deleteOnu(onuId: string): Promise<{ success: boolean; message: string }> {
    const onuIndex = this.data.onus.findIndex((o) => o.id === onuId);
    if (onuIndex === -1) throw new Error('ONU não encontrada');

    const onu = this.data.onus[onuIndex];
    const olt = this.data.olts.find((o) => o.id === onu.olt_id);
    const driver = this.getDriver(olt || this.data.olts[0]);
    const res = await driver.deleteOnu(String(onu.onu_id));

    this.data.onus.splice(onuIndex, 1);
    this.saveDatabase();
    return res;
  }

  public async getOpticalInfo(onuId: string): Promise<OpticalTelemetry> {
    const onu = this.data.onus.find((o) => o.id === onuId);
    if (!onu) throw new Error('ONU não encontrada');

    const olt = this.data.olts.find((o) => o.id === onu.olt_id);
    const driver = this.getDriver(olt || this.data.olts[0]);
    const tele = await driver.getOpticalInfo(String(onu.onu_id));

    // Atualiza na ONU os valores mais recentes
    onu.rx_onu = tele.rx_onu;
    onu.tx_onu = tele.tx_onu;
    this.saveDatabase();

    return tele;
  }

  public async runDiagnostics(onuId: string): Promise<OnuDiagnosticResult> {
    const onu = this.data.onus.find((o) => o.id === onuId);
    if (!onu) throw new Error('ONU não encontrada');

    const olt = this.data.olts.find((o) => o.id === onu.olt_id);
    const driver = this.getDriver(olt || this.data.olts[0]);
    return await driver.runDiagnostics(String(onu.onu_id));
  }

  public getUnassignedOnus(oltId?: string): UnassignedOnu[] {
    if (oltId) {
      return this.data.unassigned.filter((u) => u.olt_id === oltId);
    }
    return this.data.unassigned;
  }

  public async executeBatchOperation(payload: BatchOnuOperationPayload): Promise<{ success: number; failed: number; details: any[] }> {
    let success = 0;
    let failed = 0;
    const details: any[] = [];

    for (const onuId of payload.onu_ids) {
      const onu = this.data.onus.find((o) => o.id === onuId);
      if (!onu) {
        failed++;
        details.push({ onuId, status: 'error', message: 'ONU não encontrada' });
        continue;
      }

      try {
        if (payload.action === 'reboot') {
          await this.rebootOnu(onuId);
        } else if (payload.action === 'disable') {
          await this.disableOnu(onuId);
        } else if (payload.action === 'enable') {
          await this.enableOnu(onuId);
        } else if (payload.action === 'change_vlan' && payload.params?.vlan) {
          onu.vlan = payload.params.vlan;
        } else if (payload.action === 'change_profile') {
          if (payload.params?.profile_line) onu.profile_line = payload.params.profile_line;
          if (payload.params?.profile_service) onu.profile_service = payload.params.profile_service;
        }
        success++;
        details.push({ onuId, serial: onu.serial, status: 'success' });
      } catch (err: any) {
        failed++;
        details.push({ onuId, serial: onu?.serial, status: 'error', message: err.message });
      }
    }

    this.saveDatabase();
    return { success, failed, details };
  }

  // ==================== ALARMES & DASHBOARD ====================

  public getAlarms(oltId?: string): OltAlarm[] {
    if (oltId) {
      return this.data.alarms.filter((a) => a.olt_id === oltId);
    }
    return this.data.alarms;
  }

  public acknowledgeAlarm(alarmId: string): boolean {
    const alarm = this.data.alarms.find((a) => a.id === alarmId);
    if (alarm) {
      alarm.acknowledged = true;
      this.saveDatabase();
      return true;
    }
    return false;
  }

  public async getProfiles(oltId?: string): Promise<OltProfile[]> {
    const targetOlt = oltId ? this.data.olts.find((o) => o.id === oltId) : this.data.olts[0];
    if (!targetOlt) return [];
    const driver = this.getDriver(targetOlt);
    return await driver.getProfiles();
  }

  public getDashboardMetrics() {
    const olts = this.getOlts();
    const oltsOnline = olts.filter((o) => o.status === 'online').length;
    const oltsDown = olts.length - oltsOnline;

    const totalOnus = this.data.onus.length;
    const onusOnline = this.data.onus.filter((o) => o.status === 'online').length;
    const onusOffline = totalOnus - onusOnline;

    const alarms = this.data.alarms;
    const criticalAlarms = alarms.filter((a) => a.severidade === 'critical' && !a.acknowledged).length;
    const warningAlarms = alarms.filter((a) => (a.severidade === 'major' || a.severidade === 'warning') && !a.acknowledged).length;

    const unassignedCount = this.data.unassigned.length;

    return {
      olts: {
        total: olts.length,
        online: oltsOnline,
        down: oltsDown
      },
      onus: {
        total: totalOnus,
        online: onusOnline,
        offline: onusOffline
      },
      alarms: {
        total: alarms.length,
        critical: criticalAlarms,
        warning: warningAlarms
      },
      unassigned_count: unassignedCount
    };
  }

  // ==================== SEED INICIAL REALISTA ====================

  private getInitialSeedData(): OltDatabaseSchema {
    const oltZteId = 'olt-zte-pop01';
    const oltVsolId = 'olt-vsol-pop03';
    const oltHwId = 'olt-hw-pop02';

    const olts: OltDevice[] = [
      {
        id: oltVsolId,
        nome: 'OLT-VSOL-POP-LESTE',
        fabricante: 'VSOL',
        modelo: 'V1600G2-B',
        ip: '10.200.3.10',
        porta: 161,
        protocolo: 'SNMP',
        usuario: 'nap_admin_vsol',
        versao_firmware: 'V1.0.9_221028',
        uptime: '45 dias, 3 horas',
        cpu_usage: 12,
        memory_usage: 28,
        temperatura: 35,
        pop: 'POP Zona Leste',
        localizacao: 'Rack D, Unidade 5-7U',
        descricao: 'OLT VSOL para expansão de novos bairros.',
        status: 'online',
        ultima_comunicacao: new Date().toISOString(),
        versao_driver: '1.0.0-native',
        criado_em: '2026-03-20T08:00:00Z',
        zabbix_hostid: '10544'
      },
      {
        id: oltZteId,
        nome: 'OLT-ZTE-POP-CENTRO',
        fabricante: 'ZTE',
        modelo: 'C300',
        ip: '10.200.1.10',
        porta: 22,
        protocolo: 'SSH',
        usuario: 'nap_admin_zte',
        versao_firmware: 'ZXROS V2.1.0_P1T9',
        uptime: '142 dias, 6 horas',
        cpu_usage: 24,
        memory_usage: 42,
        temperatura: 41,
        pop: 'POP Centro (Datacenter Primário)',
        localizacao: 'Rack 02, Unidade 24-30U',
        descricao: 'OLT de alta densidade atendendo região central e polos comerciais.',
        status: 'online',
        ultima_comunicacao: new Date().toISOString(),
        versao_driver: '1.0.0-native',
        criado_em: '2026-01-10T10:00:00Z',
        zabbix_hostid: '10542'
      },
      {
        id: oltHwId,
        nome: 'OLT-HUAWEI-POP-SUL',
        fabricante: 'HUAWEI',
        modelo: 'MA5800-X7',
        ip: '10.200.2.10',
        porta: 22,
        protocolo: 'SSH',
        usuario: 'nap_admin_hw',
        versao_firmware: 'MA5800V800R018C00',
        uptime: '89 dias, 12 horas',
        cpu_usage: 19,
        memory_usage: 37,
        temperatura: 39,
        pop: 'POP Zona Sul',
        localizacao: 'Rack B, Unidade 12-18U',
        descricao: 'OLT Next-Gen GPON e XGS-PON atendendo condomínios e clientes corporativos.',
        status: 'online',
        ultima_comunicacao: new Date().toISOString(),
        versao_driver: '1.0.0-native',
        criado_em: '2026-02-15T14:30:00Z',
        zabbix_hostid: '10543'
      }
    ];

    const slots: OltSlot[] = [
      { id: `${oltVsolId}_S1`, olt_id: oltVsolId, slot_number: 1, card_type: 'CONTROL', card_model: 'VSOL-CTRL', card_status: 'normal', total_ports: 4, ports_active: 4 },
      { id: `${oltVsolId}_S2`, olt_id: oltVsolId, slot_number: 2, card_type: 'GPON', card_model: 'VSOL-16G', card_status: 'normal', total_ports: 16, ports_active: 16 },
      { id: `${oltZteId}-s1`, olt_id: oltZteId, slot_number: 1, card_type: 'CONTROL', card_model: 'SCXN (Switch Fabric)', card_status: 'normal', total_ports: 4, ports_active: 2 },
      { id: `${oltZteId}-s3`, olt_id: oltZteId, slot_number: 3, card_type: 'GPON', card_model: 'GTGH (16-Port GPON)', card_status: 'normal', total_ports: 16, ports_active: 14 },
      { id: `${oltHwId}-s0`, olt_id: oltHwId, slot_number: 0, card_type: 'CONTROL', card_model: 'MPWD (Main Control)', card_status: 'normal', total_ports: 4, ports_active: 2 },
      { id: `${oltHwId}-s1`, olt_id: oltHwId, slot_number: 1, card_type: 'GPON', card_model: 'H901GPHF (16-Port GPON)', card_status: 'normal', total_ports: 16, ports_active: 16 },
      { id: `${oltHwId}-s2`, olt_id: oltHwId, slot_number: 2, card_type: 'XGS-PON', card_model: 'H901XGHD (8-Port XGS-PON)', card_status: 'normal', total_ports: 8, ports_active: 4 }
    ];

    const pons: OltPonPort[] = [
      { id: `${oltVsolId}_PON1`, olt_id: oltVsolId, slot_number: 2, port_number: 1, pon_identifier: '0/0/1', tecnologia: 'GPON', status: 'up', onus_total: 58, onus_online: 55, onus_offline: 3, rx_power_avg: -22.5, tx_power: 2.1, vlan_default: 1, alarmes_ativos: 0 },
      { id: `${oltVsolId}_PON2`, olt_id: oltVsolId, slot_number: 2, port_number: 2, pon_identifier: '0/0/2', tecnologia: 'GPON', status: 'up', onus_total: 42, onus_online: 40, onus_offline: 2, rx_power_avg: -21.8, tx_power: 2.0, vlan_default: 1, alarmes_ativos: 1 },
      { id: 'pon-zte-1-3-1', olt_id: oltZteId, slot_number: 3, port_number: 1, pon_identifier: '1/3/1', tecnologia: 'GPON', status: 'up', onus_total: 48, onus_online: 46, onus_offline: 2, rx_power_avg: -19.4, tx_power: 2.8, vlan_default: 101, alarmes_ativos: 0, descricao: 'Bairro Centro - Rota Primária' },
      { id: 'pon-zte-1-3-2', olt_id: oltZteId, slot_number: 3, port_number: 2, pon_identifier: '1/3/2', tecnologia: 'GPON', status: 'up', onus_total: 56, onus_online: 53, onus_offline: 3, rx_power_avg: -20.1, tx_power: 2.7, vlan_default: 102, alarmes_ativos: 1, descricao: 'Jardim Primavera - Condomínios' },
      { id: 'pon-hw-0-1-0', olt_id: oltHwId, slot_number: 1, port_number: 0, pon_identifier: '0/1/0', tecnologia: 'GPON', status: 'up', onus_total: 58, onus_online: 56, onus_offline: 2, rx_power_avg: -18.9, tx_power: 2.85, vlan_default: 210, alarmes_ativos: 0, descricao: 'Setor Sul - Bairro Jardins' },
      { id: 'pon-hw-0-1-1', olt_id: oltHwId, slot_number: 1, port_number: 1, pon_identifier: '0/1/1', tecnologia: 'GPON', status: 'up', onus_total: 62, onus_online: 60, onus_offline: 2, rx_power_avg: -19.6, tx_power: 2.9, vlan_default: 211, alarmes_ativos: 0, descricao: 'Setor Sul - Rota Comercial' }
    ];

    const onus: OnuDevice[] = [
      {
        id: 'onu-vsol-1', olt_id: oltVsolId, pon_identifier: '0/0/1', onu_id: 1, serial: 'VSOL12345678', nome: 'Cliente VSOL 1', modelo: 'V2801SG', status: 'online', rx_onu: -21.3, tx_onu: 2.4, rx_olt: -22.1, tx_olt: 2.5, distancia_metros: 1250, vlan: 100, profile_line: 'LINE_500M', profile_service: 'SRV_INTERNET', criado_em: new Date().toISOString(), temperatura: 39, uptime: '10 dias'
      },
      {
        id: 'onu-vsol-2', olt_id: oltVsolId, pon_identifier: '0/0/1', onu_id: 2, serial: 'VSOL87654321', nome: 'Cliente VSOL 2', modelo: 'V2801SG', status: 'offline', rx_onu: -28.9, tx_onu: 1.1, rx_olt: -29.2, tx_olt: 2.5, distancia_metros: 3400, vlan: 200, profile_line: 'LINE_1G', profile_service: 'SRV_INTERNET', criado_em: new Date().toISOString(), temperatura: 42, uptime: '0'
      },
      {
        id: 'onu-01',
        olt_id: oltZteId,
        olt_nome: 'OLT-ZTE-POP-CENTRO',
        olt_fabricante: 'ZTE',
        pon_identifier: '1/3/1',
        onu_id: 12,
        serial: 'ZTEGC412998A',
        mac: '74:a7:8e:41:29:98',
        nome: 'Carlos Eduardo Mendes',
        cliente_id: 1001,
        cliente_nome: 'Carlos Eduardo Mendes',
        cliente_cpf: '123.456.789-00',
        modelo: 'ZTE F670L',
        firmware: 'V1.0.10P3T1',
        status: 'online',
        rx_onu: -19.2,
        tx_onu: 2.4,
        rx_olt: -19.9,
        tx_olt: 2.8,
        distancia_metros: 890,
        temperatura: 41.2,
        uptime: '34 dias, 5 horas',
        vlan: 101,
        profile_line: 'PROFILE_700M_TURBO',
        profile_service: 'SRV_INTERNET_RESIDENCIAL',
        ip_address: '100.64.12.45',
        ultimo_online: new Date().toISOString(),
        criado_em: '2026-03-01T10:00:00Z',
        cpe_tr069_id: 'ZTE-F670L-ZTEGC412998A'
      },
      {
        id: 'onu-02',
        olt_id: oltZteId,
        olt_nome: 'OLT-ZTE-POP-CENTRO',
        olt_fabricante: 'ZTE',
        pon_identifier: '1/3/1',
        onu_id: 23,
        serial: 'ZTEGC1188390',
        mac: '74:a7:8e:11:88:39',
        nome: 'Mariana Souza Santos',
        cliente_id: 1002,
        cliente_nome: 'Mariana Souza Santos',
        cliente_cpf: '234.567.890-11',
        modelo: 'ZTE F680',
        firmware: 'V1.1.20P1',
        status: 'online',
        rx_onu: -26.8, // Sinal em alerta
        tx_onu: 2.1,
        rx_olt: -27.6,
        tx_olt: 2.8,
        distancia_metros: 2150,
        temperatura: 43.5,
        uptime: '12 dias, 2 horas',
        vlan: 101,
        profile_line: 'PROFILE_400M_FIBRA',
        profile_service: 'SRV_INTERNET_RESIDENCIAL',
        ip_address: '100.64.12.78',
        ultimo_online: new Date().toISOString(),
        criado_em: '2026-03-12T11:20:00Z',
        cpe_tr069_id: 'ZTE-F680-ZTEGC1188390'
      },
      {
        id: 'onu-03',
        olt_id: oltHwId,
        olt_nome: 'OLT-HUAWEI-POP-SUL',
        olt_fabricante: 'HUAWEI',
        pon_identifier: '0/1/0',
        onu_id: 8,
        serial: '4857544391F0221A',
        mac: '48:57:02:91:f0:22',
        nome: 'João Silva Oliveira',
        cliente_id: 1003,
        cliente_nome: 'João Silva Oliveira',
        cliente_cpf: '345.678.901-22',
        modelo: 'Huawei EG8145V5',
        firmware: 'V5R019C00S105',
        status: 'online',
        rx_onu: -18.5,
        tx_onu: 2.5,
        rx_olt: -19.1,
        tx_olt: 2.85,
        distancia_metros: 620,
        temperatura: 38.0,
        uptime: '52 dias, 14 horas',
        vlan: 210,
        profile_line: 'LINE_PROFILE_RESIDENCIAL_400M',
        profile_service: 'SRV_PROFILE_DEFAULT_ROUTER',
        ip_address: '100.64.20.102',
        ultimo_online: new Date().toISOString(),
        criado_em: '2026-02-20T16:40:00Z',
        cpe_tr069_id: 'HWTC-EG8145V5-91F0221A'
      },
      {
        id: 'onu-04',
        olt_id: oltHwId,
        olt_nome: 'OLT-HUAWEI-POP-SUL',
        olt_fabricante: 'HUAWEI',
        pon_identifier: '0/1/1',
        onu_id: 19,
        serial: '48575443B08218CC',
        mac: '48:57:02:b0:82:18',
        nome: 'Padaria & Confeitaria Estrela LTDA',
        cliente_id: 1004,
        cliente_nome: 'Padaria Estrela LTDA',
        cliente_cpf: '12.345.678/0001-90',
        modelo: 'Huawei HG8245W5-6T',
        firmware: 'V5R020C10S120',
        status: 'offline', // LOS ou desligada
        rx_onu: -40.0,
        tx_onu: 0.0,
        rx_olt: -40.0,
        tx_olt: 2.9,
        distancia_metros: 1100,
        temperatura: 34.0,
        uptime: '0 dias',
        vlan: 211,
        profile_line: 'LINE_PROFILE_CORPORATE_1G',
        profile_service: 'SRV_PROFILE_DEFAULT_ROUTER',
        ultimo_offline: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
        criado_em: '2026-03-05T09:15:00Z'
      }
    ];

    const unassigned: UnassignedOnu[] = [
      {
        id: 'unassigned-zte-1',
        olt_id: oltZteId,
        olt_nome: 'OLT-ZTE-POP-CENTRO',
        fabricante_olt: 'ZTE',
        pon_identifier: '1/3/2',
        serial: 'ZTEGC48190A1',
        modelo_estimado: 'ZTE F670L (Dual Band AC)',
        sinal_rx: -19.8,
        descoberto_em: new Date(Date.now() - 1000 * 60 * 12).toISOString()
      },
      {
        id: 'unassigned-hw-1',
        olt_id: oltHwId,
        olt_nome: 'OLT-HUAWEI-POP-SUL',
        fabricante_olt: 'HUAWEI',
        pon_identifier: '0/1/1',
        serial: '4857544391F0338A',
        modelo_estimado: 'Huawei EG8145V5 (Dual Band GPON)',
        sinal_rx: -18.6,
        descoberto_em: new Date(Date.now() - 1000 * 60 * 5).toISOString()
      }
    ];

    const alarms: OltAlarm[] = [
      {
        id: 'alarm-01',
        olt_id: oltZteId,
        olt_nome: 'OLT-ZTE-POP-CENTRO',
        onu_id: 'onu-02',
        onu_serial: 'ZTEGC1188390',
        pon_identifier: '1/3/1',
        severidade: 'minor',
        tipo: 'LOW_OPTICAL_POWER',
        descricao: 'Atenuação óptica elevada: Sinal RX da ONU em -26.8 dBm (limite recomendado: -24 dBm).',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        acknowledged: false
      },
      {
        id: 'alarm-02',
        olt_id: oltHwId,
        olt_nome: 'OLT-HUAWEI-POP-SUL',
        onu_id: 'onu-04',
        onu_serial: '48575443B08218CC',
        pon_identifier: '0/1/1',
        severidade: 'critical',
        tipo: 'LOS',
        descricao: 'Loss of Signal (LOS) detectado na porta PON 0/1/1 ONU 19. Cabo drop ou conector rompido.',
        timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
        acknowledged: false
      }
    ];

    return { olts, slots, pons, onus, unassigned, alarms };
  }
}
