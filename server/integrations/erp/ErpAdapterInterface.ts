export interface ClienteErpInfo {
  id: string;
  nome: string;
  documento: string; // CPF/CNPJ
  telefone: string;
  status: 'ativo' | 'bloqueado' | 'cancelado' | 'lead';
  plano: string;
  endereco: string;
}

export interface FaturaErpInfo {
  id: string;
  valor: number;
  vencimento: string; // YYYY-MM-DD
  status: 'pendente' | 'pago' | 'vencido';
  linhaDigitavel: string;
  linkPix?: string;
  linkBoleto?: string;
}

export interface ErpAdapter {
  getName(): string;
  
  // Clientes
  buscarClientePorCpf(cpf: string): Promise<ClienteErpInfo | null>;
  buscarClientePorTelefone(telefone: string): Promise<ClienteErpInfo | null>;
  
  // Financeiro
  buscarFaturasEmAberto(clienteId: string): Promise<FaturaErpInfo[]>;
  gerarPixCopiaECola(faturaId: string): Promise<string | null>;
  
  // Operacional
  desbloquearConfianca(clienteId: string): Promise<boolean>;
  
  // Teste de Conexão
  ping(): Promise<boolean>;
}
