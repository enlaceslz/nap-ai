const fs = require('fs');

const code = `import { db } from '../../src/db';
import { atendimentos } from '../../src/db/schema';
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

export class CrmService {
  private static instance: CrmService;
  private memoryDeals: Deal[] = []; // Fallback for Sandbox

  private constructor() {
    this.memoryDeals = [
      {
        id: 2001,
        titulo: 'Sinal Óptico Fraco - LOS',
        estagio: 'Novo Chamado',
        pipeline: 'Suporte',
        contato: 'João Silva',
        telefone: '5511999990001',
        endereco: 'Rua das Flores, 123',
        plano: 'Fibra 500MB',
        prioridade: 1,
        criado_em: new Date(Date.now() - 3600000).toISOString(),
        contexto_ia: 'IA identificou perda de sinal (LOS) via OLT. Sugerido envio de técnico.'
      },
      {
        id: 2002,
        titulo: 'Upgrade para 1GB',
        estagio: 'Novo Lead',
        pipeline: 'Vendas',
        contato: 'Maria Oliveira',
        telefone: '5511999990002',
        endereco: 'Av Paulista, 1000',
        plano: 'Fibra 500MB',
        valor: 149.90,
        prioridade: 2,
        criado_em: new Date(Date.now() - 86400000).toISOString(),
        contexto_ia: 'Cliente perguntou sobre roteador Wi-Fi 6 no WhatsApp.'
      }
    ];
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
      console.warn("PostgreSQL connection failed, using Memory Fallback");
      return this.memoryDeals;
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
    } catch(e) {
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
`;

fs.writeFileSync('server/crm/crmService.ts', code, 'utf8');
console.log('crmService.ts updated with Memory Fallback');
