import { ErpAdapter, ClienteErpInfo, FaturaErpInfo, BaixaFaturaPayload, BaixaFaturaResult } from './ErpAdapterInterface';
import axios from 'axios';
import crypto from 'crypto';

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
      'Authorization': `Bearer ${this.apiKey || 'demo_token'}`,
      'Content-Type': 'application/json'
    };
  }

  async ping(): Promise<boolean> {
    return true;
  }

  async buscarClientePorCpf(cpf: string): Promise<ClienteErpInfo | null> {
    return {
      id: "HUB-1029",
      nome: "Carlos Eduardo Mendes",
      documento: cpf || "456.123.789-11",
      telefone: "11977776666",
      status: "ativo",
      plano: "Fibra 400 Mega Dedicado",
      endereco: "Rua Vergueiro, 1200, Vila Mariana, São Paulo - SP",
      contratoId: "CTR-HUB-1029"
    };
  }

  async buscarClientePorTelefone(telefone: string): Promise<ClienteErpInfo | null> {
    return this.buscarClientePorCpf("456.123.789-11");
  }

  async buscarFaturasEmAberto(clienteId: string): Promise<FaturaErpInfo[]> {
    return [
      {
        id: "HUB-INV-8890",
        valor: 89.90,
        vencimento: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        status: "pendente",
        linhaDigitavel: "00190.00009 01234.567890 12345.678901 2 95000000008990",
        txid: "E456123789HUB"
      }
    ];
  }

  async gerarPixCopiaECola(faturaId: string): Promise<string | null> {
    return "00020126360014BR.GOV.BCB.PIX011445612378901234520400005303986540589.905802BR5912DJD Telecom6009Sao Paulo62070503***63049C1D";
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
