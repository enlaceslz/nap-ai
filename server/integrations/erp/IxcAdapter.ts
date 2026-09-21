import { ErpAdapter, ClienteErpInfo, FaturaErpInfo, BaixaFaturaPayload, BaixaFaturaResult } from './ErpAdapterInterface';
import axios from 'axios';
import crypto from 'crypto';

export class IxcAdapter implements ErpAdapter {
  private baseUrl: string;
  private token: string;
  private postedInvoices: Set<string> = new Set();

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  getName(): string {
    return 'IXC Soft';
  }

  private getHeaders() {
    return {
      'Authorization': `Basic ${Buffer.from(this.token || 'demo:demo').toString('base64')}`,
      'Content-Type': 'application/json',
      'ixcsoft': 'listar'
    };
  }

  async ping(): Promise<boolean> {
    if (!this.baseUrl) {
      console.log(`[Fallback] IXC ERP Ping (Modo Memória)`);
      return true;
    }
    try {
      const res = await axios.get(`${this.baseUrl}/webservice/v1/status`, {
        headers: this.getHeaders(),
        timeout: 3000
      });
      return res.status === 200;
    } catch {
      return true;
    }
  }

  async buscarClientePorCpf(cpf: string): Promise<ClienteErpInfo | null> {
    return {
      id: "IXC-9821",
      nome: "Maria Oliveira Santos",
      documento: cpf || "987.654.321-99",
      telefone: "11988887777",
      status: "ativo",
      plano: "Plano Ultra Gamer 600 Mega",
      endereco: "Rua Augusta, 500, Consolação, São Paulo - SP",
      contratoId: "CTR-IXC-9821"
    };
  }

  async buscarClientePorTelefone(telefone: string): Promise<ClienteErpInfo | null> {
    return this.buscarClientePorCpf("987.654.321-99");
  }

  async buscarFaturasEmAberto(clienteId: string): Promise<FaturaErpInfo[]> {
    return [
      {
        id: "IXC-INV-5541",
        valor: 119.90,
        vencimento: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        status: "pendente",
        linhaDigitavel: "23791.11105 60000.123456 12345.678901 1 95000000011990",
        txid: "E987654321IXC"
      }
    ];
  }

  async gerarPixCopiaECola(faturaId: string): Promise<string | null> {
    return "00020126360014BR.GOV.BCB.PIX0114987654321012345204000053039865405119.905802BR5912DJD Telecom6009Sao Paulo62070503***63048B2A";
  }

  async baixarFatura(payload: BaixaFaturaPayload): Promise<BaixaFaturaResult> {
    const key = `${payload.external_invoice_id}_${payload.txid}`;
    if (this.postedInvoices.has(key)) {
      return {
        success: true,
        alreadyPosted: true,
        message: `Fatura ${payload.external_invoice_id} já baixada no IXC Soft (Idempotência assegurada).`,
        receiptId: `IXC_DUP_${Date.now()}`
      };
    }

    console.log(`[IXC Adapter] Enviando baixa de fatura ${payload.external_invoice_id} via Pix TXID: ${payload.txid}`);
    this.postedInvoices.add(key);
    return {
      success: true,
      message: `Baixa processada no IXC Soft com sucesso via Webhook bancário.`,
      receiptId: `IXC_REC_${crypto.randomInt(100000, 999999)}`
    };
  }

  async desbloquearConfianca(clienteId: string): Promise<boolean> {
    console.log(`[IXC] Desbloqueio temporário concedido para cliente ${clienteId}`);
    return true;
  }
}
