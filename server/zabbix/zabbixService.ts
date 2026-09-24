import axios from 'axios';
import { randomInt } from 'crypto';

export interface ZabbixHost {
  id: number;
  name: string;
  ip: string | null;
  vendor: string | null;
  model: string | null;
  location: string | null;
  cpu: number | null;
  ram: number | null;
  temp: number | null;
  uptime: string | null;
  status: 'online' | 'warning' | 'critical' | 'offline' | 'unknown';
  ponPorts: number | null;
  activeOnus: number | null;
  powerSupply: string | null;
  fanRpm: number | null;
  uplinkCapacity: string | null;
}

export interface ZabbixProblem {
  id: number;
  host: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  time: string;
  timestamp: number;
  ack: boolean;
  ackMessage?: string;
  ackAuthor?: string;
}

export interface NocSecurityAlert {
  id: string;
  source: string; // 'zabbix'
  source_event_id: string; // ID real rastreável do evento no Zabbix
  source_problem_id?: string; // ID rastreável do problema no Zabbix
  host_id: string | null;
  host_name: string | null;
  severity: 'info' | 'warning' | 'average' | 'high' | 'disaster';
  category: 'ddos' | 'brute_force' | 'intrusion' | 'firewall' | 'port_scan' | 'authentication' | 'availability' | 'other';
  name: string;
  description: string;
  started_at: string;
  updated_at: string;
  resolved_at?: string;
  status: 'active' | 'resolved' | 'acknowledged';
  acknowledged: boolean;
}

export type ZabbixConnectionStatus = 'not_configured' | 'connecting' | 'connected' | 'unavailable' | 'authentication_failed' | 'error';

/**
 * CONTRATO OFICIAL DO NAP PARA ZABBIX_URL:
 * A convenção padrão recomendada é:
 *   ZABBIX_URL=http://<host>:<porta>/zabbix
 * ou a URL completa:
 *   ZABBIX_URL=http://<host>:<porta>/zabbix/api_jsonrpc.php
 *
 * A função normalizeZabbixApiUrl garante de forma idempotente que a URL resultante
 * termine estritamente com "/api_jsonrpc.php", sem duplicações e sem barras extras.
 */
export function normalizeZabbixApiUrl(rawUrl?: string): string {
  if (!rawUrl || !rawUrl.trim()) return '';
  const trimmed = rawUrl.trim().replace(/\/+$/, '');
  if (trimmed.endsWith('/api_jsonrpc.php')) {
    return trimmed;
  }
  return `${trimmed}/api_jsonrpc.php`;
}

export class ZabbixService {
  private static instance: ZabbixService;
  private hosts: ZabbixHost[] = [];
  private problems: ZabbixProblem[] = [];
  private _customUrl?: string;
  private _customToken?: string;
  private _lastVerifiedStatus: ZabbixConnectionStatus = 'not_configured';

  private constructor() {
    this.hosts = [];
    this.problems = [];
  }

  public static getInstance(): ZabbixService {
    if (!ZabbixService.instance) {
      ZabbixService.instance = new ZabbixService();
    }
    return ZabbixService.instance;
  }

  public configure(url?: string, token?: string) {
    this._customUrl = url;
    this._customToken = token;
  }

  private get zabbixUrl(): string {
    return this._customUrl !== undefined ? this._customUrl : (process.env.ZABBIX_URL || '');
  }

  private get zabbixToken(): string {
    return this._customToken !== undefined ? this._customToken : (process.env.ZABBIX_TOKEN || '');
  }

  public getConnectionStatus(): ZabbixConnectionStatus {
    if (!this.zabbixUrl && !this.zabbixToken) {
      return 'not_configured';
    }
    if (!this.zabbixUrl || !this.zabbixToken) {
      return 'not_configured';
    }
    return this._lastVerifiedStatus !== 'not_configured' ? this._lastVerifiedStatus : 'connecting';
  }

  /**
   * Chamada REAL à API do Zabbix para verificar a disponibilidade e autenticação
   * Estados retornados: not_configured, connecting, connected, unavailable, authentication_failed, error
   */
  public async checkRealConnectionStatus(): Promise<{
    status: ZabbixConnectionStatus;
    version?: string;
    details?: string;
  }> {
    if (!this.zabbixUrl || !this.zabbixToken) {
      this._lastVerifiedStatus = 'not_configured';
      return { status: 'not_configured', details: 'URL ou Token do Zabbix não configurados no servidor.' };
    }

    const apiUrl = normalizeZabbixApiUrl(this.zabbixUrl);

    try {
      // 1. Testa conectividade da API com o endpoint do Zabbix
      const verRes = await axios.post(
        apiUrl,
        {
          jsonrpc: '2.0',
          method: 'apiinfo.version',
          params: [],
          id: 1
        },
        { timeout: 3500 }
      );

      const version = verRes.data?.result;

      if (!verRes.data || verRes.data.error) {
        this._lastVerifiedStatus = 'error';
        return {
          status: 'error',
          details: verRes.data?.error?.data || verRes.data?.error?.message || 'Erro retornado pela API Zabbix'
        };
      }

      // 2. Valida se o Token configurado é aceito pelo Zabbix (consulta simples com auth)
      const authRes = await axios.post(
        apiUrl,
        {
          jsonrpc: '2.0',
          method: 'host.get',
          params: {
            output: ['hostid'],
            limit: 1
          },
          auth: this.zabbixToken,
          id: 2
        },
        { timeout: 3500 }
      );

      if (authRes.data?.error) {
        const errData = authRes.data.error;
        const errCode = errData.code;
        const errMsg = String(errData.data || errData.message || '');
        if (errCode === -32500 || errMsg.toLowerCase().includes('auth') || errMsg.toLowerCase().includes('session') || errMsg.toLowerCase().includes('not authorised')) {
          this._lastVerifiedStatus = 'authentication_failed';
          return { status: 'authentication_failed', details: `Token do Zabbix inválido ou não autorizado: ${errMsg}`, version };
        }
        this._lastVerifiedStatus = 'error';
        return { status: 'error', details: errMsg, version };
      }

      this._lastVerifiedStatus = 'connected';
      return {
        status: 'connected',
        version: String(version || '7.0 LTS'),
        details: 'Conexão com servidor Zabbix estabelecida e autenticada com sucesso.'
      };
    } catch (err: any) {
      const code = err.code;
      const msg = err.message || '';
      if (code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'ETIMEDOUT' || code === 'ECONNABORTED' || code === 'EHOSTUNREACH') {
        this._lastVerifiedStatus = 'unavailable';
        return { status: 'unavailable', details: `Host Zabbix inacessível ou fora do ar: ${msg}` };
      }
      if (err.response?.status === 401 || err.response?.status === 403) {
        this._lastVerifiedStatus = 'authentication_failed';
        return { status: 'authentication_failed', details: `Falha de autenticação HTTP ${err.response.status}` };
      }
      this._lastVerifiedStatus = 'error';
      return { status: 'error', details: msg };
    }
  }

  public async syncWithZabbix(): Promise<boolean> {
    if (!this.zabbixUrl || !this.zabbixToken) {
      return false;
    }
    try {
      const apiUrl = normalizeZabbixApiUrl(this.zabbixUrl);
      const response = await axios.post(
        apiUrl,
        {
          jsonrpc: '2.0',
          method: 'host.get',
          params: {
            output: ['hostid', 'host', 'name', 'status'],
            selectInterfaces: ['ip']
          },
          auth: this.zabbixToken,
          id: 1
        },
        { timeout: 4000 }
      );
      if (response.data?.result && Array.isArray(response.data.result)) {
        this.hosts = response.data.result.map((h: any) => ({
          id: Number(h.hostid),
          name: h.name || h.host,
          ip: h.interfaces?.[0]?.ip || null,
          vendor: null,
          model: null,
          location: null,
          cpu: null,
          ram: null,
          temp: null,
          uptime: null,
          status: h.status === '0' ? 'online' : (h.status === '1' ? 'offline' : 'unknown'),
          ponPorts: null,
          activeOnus: null,
          powerSupply: null,
          fanRpm: null,
          uplinkCapacity: null
        }));
        return true;
      }
    } catch (e: any) {
      console.warn('[ZabbixService] Falha ao sincronizar com Zabbix:', e?.message);
    }
    return false;
  }

  public getHosts(): ZabbixHost[] {
    return this.hosts;
  }

  public getProblems(): ZabbixProblem[] {
    return this.problems;
  }

  public addProblem(problem: ZabbixProblem) {
    this.problems.unshift(problem);
  }

  public acknowledgeProblem(id: number, message: string, author: string): ZabbixProblem | null {
    const problem = this.problems.find(p => p.id === id);
    if (problem) {
      problem.ack = true;
      problem.ackMessage = message;
      problem.ackAuthor = author;
      return problem;
    }
    return null;
  }

  public simulateTrigger(hostId: number, severity: 'critical' | 'warning', message: string): ZabbixProblem | null {
    if (process.env.NODE_ENV === 'production') {
      return null;
    }
    const host = this.hosts.find(h => h.id === hostId);
    if (!host) return null;

    const newProblem: ZabbixProblem = {
      id: randomInt(1000, 99999),
      host: host.name,
      severity,
      message,
      time: 'Agora',
      timestamp: Date.now(),
      ack: false
    };

    this.problems.unshift(newProblem);
    host.status = severity;
    return newProblem;
  }

  /**
   * Classifica eventos reais obtidos do Zabbix nas categorias homologadas de segurança do NAP.
   * Não fabrica eventos: apenas classifica ocorrências que contenham termos comprováveis.
   */
  private classifySecurityEvent(name: string, tags: any[] = []): 'ddos' | 'brute_force' | 'intrusion' | 'firewall' | 'port_scan' | 'authentication' | 'availability' | 'other' | null {
    const text = `${name} ${tags.map(t => `${t.tag}:${t.value}`).join(' ')}`.toLowerCase();

    if (text.includes('ddos') || text.includes('flood') || text.includes('syn-flood') || text.includes('udp flood') || text.includes('icmp flood')) {
      return 'ddos';
    }
    if (text.includes('brute') || text.includes('ssh brute') || text.includes('failed password') || text.includes('tentativas de login') || text.includes('bruteforce')) {
      return 'brute_force';
    }
    if (text.includes('intrusion') || text.includes('snort') || text.includes('suricata') || text.includes('malware') || text.includes('exploit')) {
      return 'intrusion';
    }
    if (text.includes('firewall') || text.includes('drop') || text.includes('wan reject') || text.includes('iptables') || text.includes('nftables') || text.includes('bloqueio')) {
      return 'firewall';
    }
    if (text.includes('port scan') || text.includes('portscan') || text.includes('nmap') || text.includes('varredura')) {
      return 'port_scan';
    }
    if (text.includes('auth') || text.includes('unauthorized') || text.includes('permissao') || text.includes('radius failure') || text.includes('autenticacao')) {
      return 'authentication';
    }
    if (text.includes('unreachable') || text.includes('link down') || text.includes('host down') || text.includes('interface down') || text.includes('bgp down')) {
      return 'availability';
    }

    // Se possui tag explícita de segurança
    if (tags.some(t => (t.tag || '').toLowerCase() === 'security' || (t.tag || '').toLowerCase() === 'seguranca')) {
      return 'other';
    }

    return null;
  }

  private mapZabbixSeverity(sev: string | number): 'info' | 'warning' | 'average' | 'high' | 'disaster' {
    const n = Number(sev);
    switch (n) {
      case 5: return 'disaster';
      case 4: return 'high';
      case 3: return 'average';
      case 2: return 'warning';
      default: return 'info';
    }
  }

  /**
   * BLOQUEADOR CRÍTICO 02: Consulta Real de Alertas de Segurança via API Zabbix 7.0 LTS (problem.get)
   * Regras:
   * 1. Zabbix API é a fonte exclusiva. Não fabrica alertas.
   * 2. Rastreabilidade com source_event_id.
   * 3. Diferenciação semântica: not_configured, connected, unavailable, error.
   * 4. Se conectado e sem alertas de segurança: status "connected" com alerts [].
   */
  public async getSecurityAlertsReal(): Promise<{
    status: ZabbixConnectionStatus;
    alerts: NocSecurityAlert[];
    error?: string;
  }> {
    if (!this.zabbixUrl || !this.zabbixToken) {
      return { status: 'not_configured', alerts: [] };
    }

    try {
      const apiUrl = normalizeZabbixApiUrl(this.zabbixUrl);
      const response = await axios.post(
        apiUrl,
        {
          jsonrpc: '2.0',
          method: 'problem.get',
          params: {
            output: ['eventid', 'name', 'severity', 'clock', 'r_clock', 'acknowledged'],
            selectHosts: ['hostid', 'name', 'host'],
            selectAcknowledges: ['clock', 'message', 'alias'],
            selectTags: 'extend',
            recent: true,
            sortfield: ['eventid'],
            sortorder: 'DESC',
            limit: 100
          },
          auth: this.zabbixToken,
          id: Date.now()
        },
        { timeout: 4500 }
      );

      if (response.data?.error) {
        console.warn('[ZabbixService] Erro retornado pela API Zabbix:', response.data.error);
        return {
          status: 'error',
          alerts: [],
          error: response.data.error.data || response.data.error.message || 'Erro na API Zabbix'
        };
      }

      const problems = response.data?.result;
      if (!Array.isArray(problems)) {
        return { status: 'error', alerts: [], error: 'Formato de resposta inesperado do Zabbix' };
      }

      const securityAlerts: NocSecurityAlert[] = [];

      for (const p of problems) {
        const category = this.classifySecurityEvent(p.name || '', p.tags || []);
        if (!category) {
          // Ignora problemas que não são de segurança operacional
          continue;
        }

        const startedAt = p.clock ? new Date(Number(p.clock) * 1000).toISOString() : new Date().toISOString();
        const resolvedAt = p.r_clock && Number(p.r_clock) > 0 ? new Date(Number(p.r_clock) * 1000).toISOString() : undefined;
        const updatedAt = resolvedAt || startedAt;
        const isAck = p.acknowledged === '1' || p.acknowledged === true;
        const isResolved = Boolean(resolvedAt);

        // Host real retornado pelo Zabbix. Se ausente, usar null e registrar a limitação.
        const realHost = Array.isArray(p.hosts) && p.hosts.length > 0 ? p.hosts[0] : null;
        const hostId = realHost?.hostid ? String(realHost.hostid) : (p.hostid ? String(p.hostid) : null);
        const hostName = realHost?.name || realHost?.host || (this.hosts.find(h => String(h.id) === String(p.hostid))?.name) || p.hostname || null;

        if (!hostId || !hostName) {
          console.log(`[ZabbixService] Alerta de segurança [EventID #${p.eventid}] sem host associado retornado pela API Zabbix. host_id e host_name definidos como null.`);
        }

        securityAlerts.push({
          id: `sec_${p.eventid}`,
          source: 'zabbix',
          source_event_id: String(p.eventid),
          source_problem_id: p.problemid ? String(p.problemid) : String(p.eventid),
          host_id: hostId,
          host_name: hostName,
          severity: this.mapZabbixSeverity(p.severity),
          category,
          name: p.name,
          description: `Evento real registrado no Zabbix [EventID #${p.eventid}]. Severidade: ${p.severity}`,
          started_at: startedAt,
          updated_at: updatedAt,
          resolved_at: resolvedAt,
          status: isResolved ? 'resolved' : (isAck ? 'acknowledged' : 'active'),
          acknowledged: isAck
        });
      }

      return {
        status: 'connected',
        alerts: securityAlerts
      };
    } catch (err: any) {
      console.warn(`[ZabbixService] Indisponibilidade de conexão com Zabbix em ${this.zabbixUrl}: ${err.message}`);
      return {
        status: 'unavailable',
        alerts: [],
        error: `Servidor Zabbix inacessível: ${err.message}`
      };
    }
  }

  // Método síncrono mantido para compatibilidade, direcionando para o status real
  public getSecurityAlerts(): { status: string; alerts: any[] } {
    if (!this.zabbixUrl || !this.zabbixToken) {
      return { status: "not_configured", alerts: [] };
    }
    return { status: "unavailable", alerts: [] };
  }
}
