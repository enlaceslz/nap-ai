import { randomUUID, randomInt } from 'crypto';

export interface WorkOrder {
  id: string;
  osNumber: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  status: 'pending' | 'dispatched' | 'en_route' | 'on_site' | 'resolved' | 'failed';
  problem: string;
  location: { lat: number; lng: number; address: string };
  assignedTo?: string; // NAP User ID
  evidenceUrl?: string[];
  createdAt: string;
  updatedAt: string;
}

export class FieldService {
  private static instance: FieldService;
  private workOrders: WorkOrder[] = [];

  private constructor() {
    this.workOrders = [];
  }

  public static getInstance(): FieldService {
    if (!FieldService.instance) {
      FieldService.instance = new FieldService();
    }
    return FieldService.instance;
  }

  public getWorkOrders(): WorkOrder[] {
    return this.workOrders;
  }

  public createOS(data: Partial<WorkOrder>): WorkOrder {
    const newOs: WorkOrder = {
      id: randomUUID(),
      osNumber: `OS-000${randomInt(100, 999)}`,
      priority: data.priority || 'normal',
      status: 'pending',
      problem: data.problem || 'Atividade não especificada',
      location: data.location || { lat: 0, lng: 0, address: 'N/A' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.workOrders.push(newOs);
    return newOs;
  }

  public updateOsStatus(id: string, status: WorkOrder['status'], userId: string, comment?: string): WorkOrder | null {
    const os = this.workOrders.find(o => o.id === id || o.osNumber === id);
    if (!os) return null;

    os.status = status;
    os.updatedAt = new Date().toISOString();
    return os;
  }
}
