export interface ClienteErpInfo {
  id: string;
  nome: string;
  documento: string; // CPF/CNPJ
  telefone: string;
  status: 'ativo' | 'bloqueado' | 'cancelado' | 'lead';
  plano: string;
  endereco: string;
  contratoId?: string;
}

export interface FaturaErpInfo {
  id: string;
  valor: number;
  vencimento: string; // YYYY-MM-DD
  status: 'pendente' | 'pago' | 'vencido';
  linhaDigitavel: string;
  linkPix?: string;
  linkBoleto?: string;
  txid?: string;
}

export interface BaixaFaturaPayload {
  external_invoice_id: string;
  amount: number;
  payment_date: string;
  method: string;
  txid: string;
  transaction_id: string;
}

export interface BaixaFaturaResult {
  success: boolean;
  message: string;
  receiptId?: string;
  alreadyPosted?: boolean;
}

export interface ErpAdapter {
  getName(): string;
  
  // Clientes
  buscarClientePorCpf(cpf: string): Promise<ClienteErpInfo | null>;
  buscarClientePorTelefone(telefone: string): Promise<ClienteErpInfo | null>;
  
  // Financeiro
  buscarFaturasEmAberto(clienteId: string): Promise<FaturaErpInfo[]>;
  gerarPixCopiaECola(faturaId: string): Promise<string | null>;
  baixarFatura(payload: BaixaFaturaPayload): Promise<BaixaFaturaResult>;
  
  // Operacional
  desbloquearConfianca(clienteId: string): Promise<boolean>;
  
  // Teste de Conexão
  ping(): Promise<boolean>;
}
