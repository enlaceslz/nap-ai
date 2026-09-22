import { HelpDeskAdapter } from './adapter';
import { NapTicket, NapComment } from './domain';

export class ZammadAdapter implements HelpDeskAdapter {
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = process.env.ZAMMAD_URL || '';
    this.token = process.env.ZAMMAD_TOKEN || '';
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    if (!this.baseUrl || !this.token) {
      throw new Error("Integração Zammad não configurada (ZAMMAD_URL ou ZAMMAD_TOKEN ausente).");
    }
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Token token=${this.token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      throw new Error(`Zammad API error on ${endpoint}: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  async createTicket(ticket: NapTicket): Promise<string> {
    if (!this.baseUrl || !this.token) {
      throw new Error("Integração Zammad não configurada.");
    }
    // Zammad expects specific fields (title, group, customer, article for description)
    const payload = {
      title: ticket.title,
      group: 'Users', // Default group or map from queueId
      customer: 'customer@example.com', // Map from customerId
      article: {
        subject: ticket.title,
        body: ticket.description,
        type: 'note',
        internal: false
      }
    };

    const res = await this.request('/tickets', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res?.id) {
      throw new Error("Falha ao obter ID do ticket criado no Zammad.");
    }
    return String(res.id);
  }

  async updateTicket(backendId: string, updates: Partial<NapTicket>): Promise<void> {
    if (!this.baseUrl || !this.token) return;
    const payload: any = {};
    if (updates.title) payload.title = updates.title;
    // Map NAP status to Zammad state
    if (updates.status) payload.state = updates.status; 
    
    await this.request(`/tickets/${backendId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  async getTicket(backendId: string): Promise<NapTicket> {
    if (!this.baseUrl || !this.token) {
      throw new Error("Integração Zammad não configurada.");
    }
    const res = await this.request(`/tickets/${backendId}`);
    return {
      title: res.title,
      description: '', // Zammad stores this in articles
      status: res.state,
      priority: 'normal',
      source: 'zammad',
      backendId: String(res.id),
      backendType: 'zammad'
    };
  }

  async closeTicket(backendId: string): Promise<void> {
    await this.updateTicket(backendId, { status: 'closed' });
  }

  async reopenTicket(backendId: string): Promise<void> {
    await this.updateTicket(backendId, { status: 'open' });
  }

  async createComment(backendId: string, comment: NapComment): Promise<string> {
    if (!this.baseUrl || !this.token) {
      throw new Error("Integração Zammad não configurada.");
    }
    const payload = {
      ticket_id: backendId,
      subject: 'Comment',
      body: comment.body,
      type: 'note',
      internal: comment.isInternal
    };
    const res = await this.request('/ticket_articles', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res?.id) {
      throw new Error("Falha ao registrar comentário no Zammad.");
    }
    return String(res.id);
  }

  async addAttachment(backendId: string, fileData: Buffer, fileName: string): Promise<string> {
    // Zammad requires base64 encoding inside the article payload
    return 'ATT-1';
  }

  async assignTicket(backendId: string, agentBackendId: string): Promise<void> {
    if (!this.baseUrl || !this.token) return;
    await this.request(`/tickets/${backendId}`, {
      method: 'PUT',
      body: JSON.stringify({ owner_id: agentBackendId })
    });
  }

  async changePriority(backendId: string, priority: string): Promise<void> {
    // Logic to map priority
  }

  async changeStatus(backendId: string, status: string): Promise<void> {
    await this.updateTicket(backendId, { status });
  }

  async createUser(userData: any): Promise<string> {
    return 'USER-1';
  }

  async updateUser(backendId: string, userData: any): Promise<void> {}

  async getSLA(): Promise<any[]> { return []; }
  async getQueues(): Promise<any[]> { return []; }
}
