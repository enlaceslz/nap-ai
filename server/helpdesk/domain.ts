export interface NapTicket {
  id?: number;
  title: string;
  description: string;
  customerId?: number;
  status: string;
  priority: string;
  queueId?: number;
  slaId?: number;
  incidentId?: string;
  source: string;
  backendId?: string;
  backendType?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NapWorkOrder {
  id?: number;
  ticketId: number;
  incidentId?: string;
  customerId?: number;
  technicianId?: number;
  teamId?: string;
  status: string;
  priority: string;
  latitude?: string;
  longitude?: string;
  createdAt?: Date;
  scheduledAt?: Date;
  startedAt?: Date;
  arrivedAt?: Date;
  completedAt?: Date;
  closedAt?: Date;
}

export interface NapComment {
  ticketId: number;
  authorId: string;
  body: string;
  isInternal: boolean;
  createdAt?: Date;
}
