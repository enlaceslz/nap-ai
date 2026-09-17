const fs = require('fs');
let code = `import { db } from '../../src/db';
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

  private constructor() {}

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
        prioridade: r.prioridade,
        criado_em: r.criadoEm || r.createdAt.toISOString(),
        contexto_ia: r.contextoIa || ''
      }));
    } catch(e) {
      console.error("DB error in getDeals, using empty array", e);
      return [];
    }
  }

  public async addDeal(deal: Omit<Deal, 'id' | 'criado_em'>): Promise<Deal> {
    const [record] = await db.insert(atendimentos).values({
      titulo: deal.titulo,
      estagio: deal.estagio,
      pipeline: deal.pipeline,
      contato: deal.contato,
      telefone: deal.telefone,
      endereco: deal.endereco,
      plano: deal.plano,
      prioridade: deal.prioridade,
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
      prioridade: record.prioridade,
      criado_em: record.criadoEm || record.createdAt.toISOString(),
      contexto_ia: record.contextoIa || ''
    };
  }

  public async updateDealStage(id: number, stage: string): Promise<Deal | null> {
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
      prioridade: record.prioridade,
      criado_em: record.criadoEm || record.createdAt.toISOString(),
      contexto_ia: record.contextoIa || ''
    };
  }

  public executeBillingRule(): void {
    // A complex query to automatically block overdue accounts could be implemented here
    // Leaving as a stub for now as this requires fetching faturas
    console.log("Executando Régua de Cobrança SGP...");
  }
}
`;
fs.writeFileSync('server/crm/crmService.ts', code, 'utf8');
console.log('crmService.ts updated to use Drizzle ORM');
