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

export class ZabbixService {
  private static instance: ZabbixService;
  private hosts: ZabbixHost[] = [];
  private problems: ZabbixProblem[] = [];
  private zabbixUrl = process.env.ZABBIX_URL || '';
  private zabbixToken = process.env.ZABBIX_TOKEN || '';

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

  public async syncWithZabbix(): Promise<boolean> {
    if (!this.zabbixUrl || !this.zabbixToken) {
      return false;
    }
    try {
      const response = await axios.post(
        `${this.zabbixUrl}/api_jsonrpc.php`,
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
}
