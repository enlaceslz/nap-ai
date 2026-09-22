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

    if (process.env.NODE_ENV === 'production') {
      const emptyData: OltDatabaseSchema = {
        olts: [],
        slots: [],
        pons: [],
        onus: [],
        unassigned: [],
        alarms: []
      };
      this.saveDatabase(emptyData);
      return emptyData;
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
    return {
      olts: [],
      slots: [],
      pons: [],
      onus: [],
      unassigned: [],
      alarms: []
    };
  }
}
