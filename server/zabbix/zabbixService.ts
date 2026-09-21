import { randomInt } from 'crypto';

export interface ZabbixHost {
  id: number;
  name: string;
  ip: string;
  vendor: 'Huawei' | 'ZTE' | 'Datacom' | 'Fiberhome' | 'MikroTik' | 'Juniper';
  model: string;
  location: string;
  cpu: number;
  ram: number;
  temp: number;
  uptime: string;
  status: 'online' | 'warning' | 'critical' | 'offline';
  ponPorts: number;
  activeOnus: number;
  powerSupply: string;
  fanRpm: number;
  uplinkCapacity: string;
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

  private constructor() {
    this.initMocks();
  }

  public static getInstance(): ZabbixService {
    if (!ZabbixService.instance) {
      ZabbixService.instance = new ZabbixService();
    }
    return ZabbixService.instance;
  }

  private initMocks() {
    this.hosts = [
      { id: 1001, name: 'OLT-HUAWEI-01 (Centro)', ip: '10.0.0.10', vendor: 'Huawei', model: 'MA5800-X7', location: 'POP Centro', cpu: 45, ram: 60, temp: 42, uptime: '45d 12h', status: 'critical', ponPorts: 16, activeOnus: 840, powerSupply: 'Redundante (A/B OK)', fanRpm: 4500, uplinkCapacity: '2x 10G SFP+' },
      { id: 1002, name: 'OLT-ZTE-02 (Norte)', ip: '10.0.0.11', vendor: 'ZTE', model: 'C300', location: 'POP Norte', cpu: 78, ram: 55, temp: 64, uptime: '12d 03h', status: 'online', ponPorts: 16, activeOnus: 1024, powerSupply: 'Normal (A OK, B Down)', fanRpm: 6000, uplinkCapacity: '1x 10G SFP+' },
      { id: 1003, name: 'OLT-DATACOM-03 (Sul)', ip: '10.0.0.12', vendor: 'Datacom', model: 'DM4610', location: 'POP Sul', cpu: 20, ram: 30, temp: 38, uptime: '110d 09h', status: 'online', ponPorts: 8, activeOnus: 320, powerSupply: 'Redundante (A/B OK)', fanRpm: 3200, uplinkCapacity: '1x 10G SFP+' },
      { id: 1004, name: 'CORE-MIKROTIK-CCR', ip: '10.0.0.1', vendor: 'MikroTik', model: 'CCR2216-1G-12XS-2XQ', location: 'Datacenter Principal', cpu: 80, ram: 40, temp: 45, uptime: '200d 14h', status: 'warning', ponPorts: 0, activeOnus: 0, powerSupply: 'Redundante (A/B OK)', fanRpm: 5500, uplinkCapacity: '2x 100G QSFP28' },
      { id: 1005, name: 'EDGE-JUNIPER', ip: '172.16.0.1', vendor: 'Juniper', model: 'MX204', location: 'Datacenter Principal', cpu: 30, ram: 30, temp: 35, uptime: '30d 01h', status: 'online', ponPorts: 0, activeOnus: 0, powerSupply: 'Redundante (A/B OK)', fanRpm: 4800, uplinkCapacity: '4x 100G QSFP28' }
    ];

    this.problems = [
      { id: 101, host: 'OLT-HUAWEI-01 (Centro)', severity: 'critical', message: 'PON 0/1/3 LOS (Loss of Signal)', time: 'Agora', timestamp: Date.now() - 600000, ack: false },
      { id: 102, host: 'CORE-MIKROTIK-CCR', severity: 'warning', message: 'CPU Load > 80% (últimos 5 min)', time: 'Há 15 min', timestamp: Date.now() - 900000, ack: false }
    ];
  }

  public getHosts(): ZabbixHost[] {
    return this.hosts;
  }

  public getProblems(): ZabbixProblem[] {
    return this.problems;
  }

  public acknowledgeProblem(id: number, message: string, author: string): ZabbixProblem | null {
    const problem = this.problems.find(p => p.id === id);
    if (problem) {
      problem.ack = true;
      problem.ackMessage = message;
      problem.ackAuthor = author;
      
      // Update the host status if it was critical and there are no other unacknowledged criticals
      const host = this.hosts.find(h => h.name === problem.host);
      if (host && problem.severity === 'critical') {
         host.status = 'warning';
      }
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
