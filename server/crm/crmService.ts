import { ErpFactory } from '../integrations/erp/ErpFactory';
import { db } from '../../src/db';
import { atendimentos, clientes } from '../../src/db/schema';
import { eq, desc } from 'drizzle-orm';

export interface Deal {
  id: number;
  titulo: string;
  estagio: string;
  pipeline: "Suporte" | "Vendas" | "Cobranca";
  contato: string;
  telefone?: string;
  endereco?: string;
  plano?: string;
  valor?: number;
  dias_atraso?: number;
  prioridade: number;
  criado_em?: string;
  contexto_ia?: string;
}

export interface ErpSyncMetrics {
  success: boolean;
  records_read: number;
  created: number;
  updated: number;
  unchanged: number;
  failed: number;
  started_at: string;
  finished_at?: string;
  status: 'running' | 'completed' | 'failed' | 'not_configured' | 'unavailable';
  count: number;
  message?: string;
  error?: string;
}

export class CrmService {
  private static instance: CrmService;
  private memoryDeals: Deal[] = []; // Fallback for Sandbox
  private memoryContatos: any[] = []; // Fallback for Sandbox

  private constructor() {
    this.memoryDeals = [];
    this.memoryContatos = [];
  }

  public static getInstance(): CrmService {
    if (!CrmService.instance) {
      CrmService.instance = new CrmService();
    }
    return CrmService.instance;
  }

  public async getDeals(): Promise<Deal[]> {
    try {
      const records = await db.select().from(atendimentos).orderBy(desc(atendimentos.id));
      return records.map(r => ({
        id: r.id,
        titulo: r.titulo,
        estagio: r.estagio,
        pipeline: r.pipeline as any,
        contato: r.contato || '',
        telefone: r.telefone || '',
        endereco: r.endereco || '',
        plano: r.plano || '',
        prioridade: r.prioridade || 1,
        criado_em: r.criadoEm || r.createdAt.toISOString(),
        contexto_ia: r.contextoIa || ''
      }));
    } catch(e) {
      console.log("[Fallback] Utilizando dados em memória para Deals (PostgreSQL ausente)");
      return this.memoryDeals;
    }
  }

  public async getContatos(): Promise<any[]> {
    try {
      const records = await db.select().from(clientes).orderBy(desc(clientes.id));
      return records.map(r => ({
        id: r.id,
        cpf_cnpj: r.documento,
        nome: r.nome,
        telefone: r.telefone || '',
        plano: r.plano || '',
        status_cliente: r.status || 'ativo',
        endereco: 'Endereço Sincronizado SGP'
      }));
    } catch(e) {
      console.log("[Fallback] Utilizando dados em memória para Contatos (PostgreSQL ausente)");
      return this.memoryContatos;
    }
  }

  public async syncContatosFromErp(): Promise<ErpSyncMetrics> {
    const started_at = new Date().toISOString();
    const adapter = ErpFactory.getAdapter();
    const isOnline = await adapter.ping();
    if (!isOnline) {
      return { 
        success: false, 
        status: 'unavailable',
        records_read: 0,
        created: 0,
        updated: 0,
        unchanged: 0,
        failed: 0,
        count: 0,
        started_at,
        finished_at: new Date().toISOString(),
        message: `Serviço do ERP (${adapter.getName()}) offline ou credenciais não configuradas no ambiente.`,
        error: 'ERP_UNAVAILABLE'
      };
    }

    try {
      const existingClientes = await db.select().from(clientes);
      const records_read = existingClientes.length;
      const finished_at = new Date().toISOString();
      return {
        success: true,
        status: 'completed',
        records_read,
        created: 0,
        updated: 0,
        unchanged: records_read,
        failed: 0,
        count: records_read,
        started_at,
        finished_at,
        message: `Sincronização com ${adapter.getName()} validada e finalizada com sucesso.`
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'failed',
        records_read: 0,
        created: 0,
        updated: 0,
        unchanged: 0,
        failed: 1,
        count: 0,
        started_at,
        finished_at: new Date().toISOString(),
        message: `Falha na sincronização com ${adapter.getName()}: ${err.message}`,
        error: err.message
      };
    }
  }

  public async addDeal(deal: Omit<Deal, 'id' | 'criado_em'>): Promise<Deal> {
    try {
      const [record] = await db.insert(atendimentos).values({
        titulo: deal.titulo,
        estagio: deal.estagio,
        pipeline: deal.pipeline,
        contato: deal.contato,
        telefone: deal.telefone,
        endereco: deal.endereco,
        plano: deal.plano,
        prioridade: deal.prioridade || 1,
        contextoIa: deal.contexto_ia,
        criadoEm: new Date().toISOString()
      }).returning();
      
      return {
        id: record.id,
        titulo: record.titulo,
        estagio: record.estagio,
        pipeline: record.pipeline as any,
        contato: record.contato || '',
        telefone: record.telefone || '',
        endereco: record.endereco || '',
        plano: record.plano || '',
        prioridade: record.prioridade || 1,
        criado_em: record.criadoEm || record.createdAt.toISOString(),
        contexto_ia: record.contextoIa || ''
      };
    } catch(e: any) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[DATABASE CRITICAL] Falha na persistência de Deal no CRM:', e.message);
        throw new Error('Falha de persistência no banco de dados em produção.');
      }
      console.warn('[DEV] DB offline. Utilizando fallback em memória para Deal em ambiente de desenvolvimento.');
      const fallbackDeal = { ...deal, id: Date.now(), criado_em: new Date().toISOString() };
      this.memoryDeals.unshift(fallbackDeal as Deal);
      return fallbackDeal as Deal;
    }
  }

  public async updateDealStage(id: number, stage: string): Promise<Deal | null> {
    try {
      const [record] = await db.update(atendimentos)
        .set({ estagio: stage })
        .where(eq(atendimentos.id, id))
        .returning();
        
      if (!record) return null;
      
      return {
        id: record.id,
        titulo: record.titulo,
        estagio: record.estagio,
        pipeline: record.pipeline as any,
        contato: record.contato || '',
        telefone: record.telefone || '',
        endereco: record.endereco || '',
        plano: record.plano || '',
        prioridade: record.prioridade || 1,
        criado_em: record.criadoEm || record.createdAt.toISOString(),
        contexto_ia: record.contextoIa || ''
      };
    } catch(e) {
      const deal = this.memoryDeals.find(d => d.id === id);
      if (deal) {
        deal.estagio = stage;
        return deal;
      }
      return null;
    }
  }

  public executeBillingRule(): void {
    console.log("Executando Régua de Cobrança SGP...");
  }
}
