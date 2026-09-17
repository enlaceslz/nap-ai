const fs = require('fs');

const code = `import { db } from '../../src/db';
import { helpdesk_tickets, work_orders, work_order_tasks, work_order_evidence, helpdesk_audit } from '../../src/db/schema';
import { eq, desc } from 'drizzle-orm';
import { ZammadAdapter } from './zammadAdapter';
import { NapTicket, NapWorkOrder } from './domain';

export class HelpDeskService {
  private adapter: ZammadAdapter;
  private memoryTickets: any[] = [];
  private memoryWorkOrders: any[] = [];

  constructor() {
    this.adapter = new ZammadAdapter();
    // Seed memory with a fake ticket so it's not empty
    this.memoryTickets.push({
      id: 1,
      external_id: 'NAP-T-MOCK',
      backend_id: 'Z-MOCK',
      backend_type: 'zammad',
      title: 'Sistema operando em Fallback (Memória)',
      description: 'O banco de dados PostgreSQL não está acessível.',
      status: 'novo',
      priority: 'alta',
      source: 'manual',
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  // --- TICKETS ---
  async createTicket(data: Partial<NapTicket>, actorId: string = 'system') {
    let backendId = 'mock-zammad-id';
    try {
      // 1. Send to Zammad
      backendId = await this.adapter.createTicket({
        title: data.title || 'Sem Título',
        description: data.description || '',
        status: data.status || 'novo',
        priority: data.priority || 'normal',
        source: data.source || 'manual'
      });
    } catch(e) {
      console.warn("Zammad mock failed, continuing");
    }

    const newTicket = {
      external_id: \`NAP-T-\${Date.now()}\`,
      backend_id: backendId,
      backend_type: 'zammad',
      title: data.title || 'Sem Título',
      description: data.description || '',
      status: data.status || 'novo',
      priority: data.priority || 'normal',
      source: data.source || 'manual',
      incident_id: data.incidentId,
      created_at: new Date(),
      updated_at: new Date()
    };

    try {
      // 2. Save in NAP Database
      const [ticket] = await db.insert(helpdesk_tickets).values(newTicket as any).returning();
      await this.auditLog('ticket', String(ticket.id), 'create', actorId, null, JSON.stringify(ticket));
      return ticket;
    } catch(e) {
      console.warn("DB offline, using memory fallback for createTicket", e);
      const memTicket = { ...newTicket, id: Date.now() };
      this.memoryTickets.unshift(memTicket);
      return memTicket;
    }
  }

  async getTickets() {
    try {
      return await db.select().from(helpdesk_tickets).orderBy(desc(helpdesk_tickets.created_at));
    } catch(e) {
      console.warn("DB offline, using memory fallback for getTickets", e);
      return this.memoryTickets;
    }
  }

  async getTicketById(id: number) {
    try {
      const [ticket] = await db.select().from(helpdesk_tickets).where(eq(helpdesk_tickets.id, id));
      return ticket;
    } catch(e) {
      return this.memoryTickets.find(t => t.id === id);
    }
  }

  async closeTicket(id: number, actorId: string = 'system') {
    const ticket = await this.getTicketById(id);
    if (!ticket) throw new Error('Ticket not found');
    
    try {
      if (ticket.backend_id) {
        await this.adapter.closeTicket(ticket.backend_id);
      }
      const [updated] = await db.update(helpdesk_tickets)
        .set({ status: 'resolvido', closed_at: new Date() })
        .where(eq(helpdesk_tickets.id, id))
        .returning();
      await this.auditLog('ticket', String(id), 'close', actorId, ticket.status, 'resolvido');
      return updated;
    } catch(e) {
      console.warn("DB offline, memory closeTicket fallback");
      const memTicket = this.memoryTickets.find(t => t.id === id);
      if(memTicket) {
        memTicket.status = 'resolvido';
        memTicket.closed_at = new Date();
      }
      return memTicket;
    }
  }

  // --- WORK ORDERS ---
  async createWorkOrder(data: Partial<NapWorkOrder>, actorId: string = 'system') {
    const newWo = {
      ticket_id: data.ticketId!,
      incident_id: data.incidentId,
      status: data.status || 'ABERTA',
      priority: data.priority || 'NORMAL',
      latitude: data.latitude,
      longitude: data.longitude,
      created_at: new Date()
    };
    try {
      const [wo] = await db.insert(work_orders).values(newWo as any).returning();
      await this.auditLog('work_order', String(wo.id), 'create', actorId, null, JSON.stringify(wo));
      return wo;
    } catch(e) {
      const memWo = { ...newWo, id: Date.now() };
      this.memoryWorkOrders.unshift(memWo);
      return memWo;
    }
  }

  async getWorkOrders() {
    try {
      return await db.select().from(work_orders).orderBy(desc(work_orders.created_at));
    } catch(e) {
      return this.memoryWorkOrders;
    }
  }

  async updateWorkOrderStatus(id: number, status: string, actorId: string = 'system') {
    try {
      const [wo] = await db.select().from(work_orders).where(eq(work_orders.id, id));
      if (!wo) throw new Error('Work Order not found');
      
      const updateData: any = { status };
      if (status === 'EM EXECUÇÃO' && !wo.started_at) updateData.started_at = new Date();
      if (status === 'NO LOCAL' && !wo.arrived_at) updateData.arrived_at = new Date();
      if (status === 'RESOLVIDA') updateData.completed_at = new Date();
      if (status === 'ENCERRADA') updateData.closed_at = new Date();
      
      const [updated] = await db.update(work_orders).set(updateData).where(eq(work_orders.id, id)).returning();
      await this.auditLog('work_order', String(id), 'status_change', actorId, wo.status, status);
      return updated;
    } catch(e) {
      const memWo = this.memoryWorkOrders.find(w => w.id === id);
      if(memWo) {
        memWo.status = status;
        if (status === 'EM EXECUÇÃO' && !memWo.started_at) memWo.started_at = new Date();
        if (status === 'NO LOCAL' && !memWo.arrived_at) memWo.arrived_at = new Date();
        if (status === 'RESOLVIDA') memWo.completed_at = new Date();
        if (status === 'ENCERRADA') memWo.closed_at = new Date();
      }
      return memWo;
    }
  }

  // --- AUDIT ---
  async auditLog(entity: string, entityId: string, action: string, actorId: string, oldValue: string | null, newValue: string | null) {
    try {
      await db.insert(helpdesk_audit).values({
        entity,
        entity_id: entityId,
        action,
        actor_id: actorId,
        old_value: oldValue,
        new_value: newValue,
      });
    } catch(e) {
      console.warn("Audit Log memory fallback");
    }
  }
}
`;
fs.writeFileSync('server/helpdesk/service.ts', code, 'utf8');
console.log('Helpdesk fallback applied');
