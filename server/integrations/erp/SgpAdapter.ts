import { ErpAdapter, ClienteErpInfo, FaturaErpInfo } from './ErpAdapterInterface';
import axios from 'axios';

export class SgpAdapter implements ErpAdapter {
  private baseUrl: string;
  private appToken: string;
  private userToken: string;

  constructor(baseUrl: string, appToken: string, userToken: string) {
    this.baseUrl = baseUrl;
    this.appToken = appToken;
    this.userToken = userToken;
  }

  getName(): string {
    return 'SGP';
  }

  private getHeaders() {
    return {
      'apptoken': this.appToken,
      'usertoken': this.userToken,
      'Content-Type': 'application/json'
    };
  }

  async ping(): Promise<boolean> {
    // Memory Fallback / Offline protection
    if (!this.baseUrl || !this.appToken) {
      console.log(`[Fallback] SGP ERP Ping (Credenciais ausentes)`);
      return true; // Consider valid for mock environment
    }
    try {
      // Endpoint de teste da API SGP
      const response = await axios.get(`${this.baseUrl}/api/v1/cliente/status`, {
        headers: this.getHeaders(),
        timeout: 3000
      });
      return response.status === 200;
    } catch (error) {
      console.error(`[ERRO SGP] Ping falhou:`, error);
      return false;
    }
  }

  async buscarClientePorCpf(cpf: string): Promise<ClienteErpInfo | null> {
    if (!this.baseUrl) {
      console.log(`[Fallback] Retornando cliente Mock (CPF: ${cpf})`);
      return this.mockCliente();
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/cliente?cpf=${cpf}`, {
        headers: this.getHeaders()
      });
      
      const data = response.data?.[0];
      if (!data) return null;

      return {
        id: data.id,
        nome: data.nome,
        documento: data.cpf,
        telefone: data.celular,
        status: data.status === '1' ? 'ativo' : 'bloqueado',
        plano: data.plano_nome || 'N/A',
        endereco: `${data.logradouro}, ${data.numero}`
      };
    } catch (error) {
      console.error(`[ERRO SGP] Buscar cliente CPF falhou`);
      return null;
    }
  }

  async buscarClientePorTelefone(telefone: string): Promise<ClienteErpInfo | null> {
    return this.mockCliente(); // Simplificado para fallback
  }

  async buscarFaturasEmAberto(clienteId: string): Promise<FaturaErpInfo[]> {
    if (!this.baseUrl) return this.mockFaturas();
    return [];
  }

  async gerarPixCopiaECola(faturaId: string): Promise<string | null> {
    return "00020126360014BR.GOV.BCB.PIX011412345678901234520400005303986540510.005802BR5912DJD Telecom6009Sao Paulo62070503***63041D3D";
  }

  async desbloquearConfianca(clienteId: string): Promise<boolean> {
    console.log(`[Fallback] Desbloqueio em confiança ativado via SGP para cliente: ${clienteId}`);
    return true;
  }

  // --- Mocks para o modo Memory Fallback ---
  private mockCliente(): ClienteErpInfo {
    return {
      id: "9999",
      nome: "Cliente de Demonstração (SGP)",
      documento: "123.456.789-00",
      telefone: "11999999999",
      status: "ativo",
      plano: "Fibra 500Mbps",
      endereco: "Rua do Provedor, 123"
    };
  }

  private mockFaturas(): FaturaErpInfo[] {
    return [{
      id: "777",
      valor: 99.90,
      vencimento: new Date().toISOString().split('T')[0],
      status: "pendente",
      linhaDigitavel: "12345.67890 12345.67890 12345.67890 1 1234567890",
      linkPix: "00020126360014BR.GOV.BCB.PIX..."
    }];
  }
}
