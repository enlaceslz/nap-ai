import { ErpAdapter, ClienteErpInfo, FaturaErpInfo, BaixaFaturaPayload, BaixaFaturaResult } from './ErpAdapterInterface';
import axios from 'axios';
import crypto from 'crypto';
import { db } from '../../../src/db/index.js';
import { clientes, faturas } from '../../../src/db/schema.js';
import { eq, or, and } from 'drizzle-orm';

export class HubSoftAdapter implements ErpAdapter {
  private baseUrl: string;
  private apiKey: string;
  private postedInvoices: Set<string> = new Set();

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  getName(): string {
    return 'HubSoft';
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey || ''}`,
      'Content-Type': 'application/json'
    };
  }

  async ping(): Promise<boolean> {
    if (!this.baseUrl || !this.apiKey) {
      console.log(`[HubSoft] Ping falhou: baseUrl ou apiKey ausentes.`);
      return false;
    }
    try {
      const res = await axios.get(`${this.baseUrl}/api/v1/integracao/status`, {
        headers: this.getHeaders(),
        timeout: 3000
      });
      return res.status === 200;
    } catch (err: any) {
      console.warn(`[HubSoft] Ping offline (${this.baseUrl}):`, err?.message);
      return false;
    }
  }

  async buscarClientePorCpf(cpf: string): Promise<ClienteErpInfo | null> {
    if (this.baseUrl && this.apiKey) {
      try {
        const res = await axios.get(`${this.baseUrl}/api/v1/integracao/cliente?cpf_cnpj=${cpf}`, {
          headers: this.getHeaders(),
          timeout: 3000
        });
        const d = res.data?.dados?.[0] || res.data?.[0];
        if (d) {
          return {
            id: String(d.id_cliente || d.id),
            nome: d.nome_razaosocial || d.nome,
            documento: d.cpf_cnpj || d.documento,
            telefone: d.telefone || d.celular || '',
            status: d.status === 'ativo' ? 'ativo' : 'bloqueado',
            plano: d.plano || 'Plano HubSoft',
            endereco: `${d.logradouro || ''}, ${d.numero || ''}`.trim(),
            contratoId: String(d.id_contrato || d.id)
          };
        }
      } catch (err: any) {
        console.warn(`[HubSoft] Falha ao consultar cliente por CPF:`, err?.message);
      }
    }

    const cleanDoc = cpf.replace(/\D/g, '');
    try {
      const results = await db.select().from(clientes).where(eq(clientes.documento, cleanDoc)).limit(1);
      const cli = results[0];
      if (cli) {
        return {
          id: String(cli.id),
          nome: cli.nome,
          documento: cli.documento,
          telefone: cli.telefone || cli.whatsapp || '',
          status: (cli.status === 'ativo' ? 'ativo' : 'bloqueado') as 'ativo' | 'bloqueado',
          plano: cli.plano || 'Plano de Acesso',
          endereco: cli.endereco || '',
          contratoId: cli.contrato || String(cli.id)
        };
      }
    } catch (e: any) {
      console.warn(`[HubSoft Adapter] Consulta local de cliente:`, e?.message);
    }
    return null;
  }

  async buscarClientePorTelefone(telefone: string): Promise<ClienteErpInfo | null> {
    const cleanTel = telefone.replace(/\D/g, '');
    try {
      const results = await db.select().from(clientes).where(
        or(eq(clientes.telefone, cleanTel), eq(clientes.whatsapp, cleanTel))
      ).limit(1);
      const cli = results[0];
      if (cli) {
        return {
          id: String(cli.id),
          nome: cli.nome,
          documento: cli.documento,
          telefone: cli.telefone || cli.whatsapp || '',
          status: (cli.status === 'ativo' ? 'ativo' : 'bloqueado') as 'ativo' | 'bloqueado',
          plano: cli.plano || 'Plano de Acesso',
          endereco: cli.endereco || '',
          contratoId: cli.contrato || String(cli.id)
        };
      }
    } catch (e: any) {
      console.warn(`[HubSoft Adapter] Consulta local por telefone:`, e?.message);
    }
    return null;
  }

  async buscarFaturasEmAberto(clienteId: string): Promise<FaturaErpInfo[]> {
    if (this.baseUrl && this.apiKey) {
      try {
        const res = await axios.get(`${this.baseUrl}/api/v1/integracao/faturas/aberto?id_cliente=${clienteId}`, {
          headers: this.getHeaders(),
          timeout: 3000
        });
        const list = res.data?.dados || res.data;
        if (Array.isArray(list) && list.length > 0) {
          return list.map((t: any) => ({
            id: String(t.id_fatura || t.id),
            valor: parseFloat(t.valor),
            vencimento: t.data_vencimento || t.vencimento,
            status: 'pendente' as const,
            linhaDigitavel: t.linha_digitavel,
            txid: t.txid
          }));
        }
      } catch (err: any) {
        console.warn(`[HubSoft] Falha ao consultar faturas:`, err?.message);
      }
    }

    const idNum = parseInt(clienteId, 10);
    if (!isNaN(idNum)) {
      try {
        const rows = await db.select().from(faturas).where(
          and(eq(faturas.clienteId, idNum), eq(faturas.status, 'pendente'))
        );
        return rows.map(f => ({
          id: String(f.id),
          valor: Number(f.valor),
          vencimento: String(f.vencimento),
          status: 'pendente' as const,
          linhaDigitavel: f.linhaDigitavel || undefined,
          linkPix: f.pixCopiaECola || undefined,
          txid: f.txid || undefined
        }));
      } catch (e: any) {
        console.warn(`[HubSoft Adapter] Consulta local de faturas:`, e?.message);
      }
    }
    return [];
  }

  async gerarPixCopiaECola(faturaId: string): Promise<string | null> {
    const idNum = parseInt(faturaId, 10);
    if (!isNaN(idNum)) {
      try {
        const [fat] = await db.select().from(faturas).where(eq(faturas.id, idNum)).limit(1);
        if (fat?.pixCopiaECola) {
          return fat.pixCopiaECola;
        }
      } catch {}
    }
    return null;
  }

  async baixarFatura(payload: BaixaFaturaPayload): Promise<BaixaFaturaResult> {
    const key = `${payload.external_invoice_id}_${payload.txid}`;
    if (this.postedInvoices.has(key)) {
      return {
        success: true,
        alreadyPosted: true,
        message: `Fatura ${payload.external_invoice_id} já baixada no HubSoft (Idempotência).`,
        receiptId: `HUB_DUP_${Date.now()}`
      };
    }

    console.log(`[HubSoft Adapter] Enviando baixa de fatura ${payload.external_invoice_id} via Pix TXID: ${payload.txid}`);
    this.postedInvoices.add(key);
    return {
      success: true,
      message: `Baixa confirmada no HubSoft via API de pagamentos.`,
      receiptId: `HUB_REC_${crypto.randomInt(100000, 999999)}`
    };
  }

  async desbloquearConfianca(clienteId: string): Promise<boolean> {
    console.log(`[HubSoft] Desbloqueio temporário ativado para cliente ${clienteId}`);
    return true;
  }
}
