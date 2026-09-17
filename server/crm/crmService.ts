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

export class CrmService {
  private static instance: CrmService;
  private memoryDeals: Deal[] = []; // Fallback for Sandbox
  private memoryContatos: any[] = []; // Fallback for Sandbox

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

    this.memoryContatos = [
      {
        id: 1,
        cpf_cnpj: '12345678900',
        nome: 'João Silva (Local)',
        telefone: '5511999990001',
        plano: 'Fibra 500MB',
        status_cliente: 'ativo',
        endereco: 'Rua das Flores, 123'
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

  public async syncContatosFromErp(): Promise<{ success: boolean, count: number }> {
    console.log("[SGP Sync] Iniciando sincronização simulada do ERP...");
    
    // Simula uma resposta do SGP (ERP)
    const mockSgpData = [
      { nome: 'Empresa Alpha Ltda', documento: '11111111000199', telefone: '11999990001', plano: 'Fibra 1GB Corp', status: 'ativo' },
      { nome: 'Carlos Eduardo', documento: '22222222222', telefone: '11999990002', plano: 'Fibra 500MB', status: 'ativo' },
      { nome: 'Ana Beatriz', documento: '33333333333', telefone: '11999990003', plano: 'Fibra 300MB', status: 'bloqueado' },
      { nome: 'Farmácia Central', documento: '44444444000188', telefone: '11999990004', plano: 'Fibra 500MB', status: 'ativo' },
      { nome: 'Julio Cesar', documento: '55555555555', telefone: '11999990005', plano: 'Fibra 200MB', status: 'cancelado' },
      { nome: 'Padaria Doce Pão', documento: '66666666000177', telefone: '11999990006', plano: 'Fibra 300MB Corp', status: 'ativo' },
      { nome: 'Roberto Alves', documento: '77777777777', telefone: '11999990007', plano: 'Fibra 100MB', status: 'bloqueado' },
      { nome: 'Clinica Saúde+', documento: '88888888000166', telefone: '11999990008', plano: 'Fibra 1GB Corp', status: 'ativo' }
    ];

    try {
      let count = 0;
      for (const cliente of mockSgpData) {
        await db.insert(clientes).values({
          nome: cliente.nome,
          documento: cliente.documento,
          telefone: cliente.telefone,
          plano: cliente.plano,
          status: cliente.status
        }).onConflictDoUpdate({
          target: clientes.documento,
          set: {
            nome: cliente.nome,
            telefone: cliente.telefone,
            plano: cliente.plano,
            status: cliente.status
          }
        });
        count++;
      }
      return { success: true, count };
    } catch(e) {
      console.log("[Info] Sincronização SGP via Fallback (Memória)");
      mockSgpData.forEach((c, idx) => {
        const index = this.memoryContatos.findIndex(m => m.cpf_cnpj === c.documento);
        if (index > -1) {
          this.memoryContatos[index] = { ...this.memoryContatos[index], ...c, cpf_cnpj: c.documento, status_cliente: c.status };
        } else {
          this.memoryContatos.push({
            id: 1000 + idx,
            nome: c.nome,
            cpf_cnpj: c.documento,
            telefone: c.telefone,
            plano: c.plano,
            status_cliente: c.status as any,
            endereco: 'Endereço Sincronizado SGP'
          });
        }
      });
      return { success: true, count: mockSgpData.length };
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
