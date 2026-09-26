export interface Operador {
 id: number;
 nome: string;
 role: "operator" | "admin_operator" | "super_admin";
 status: "online" | "pausa" | "offline";
}

export interface Contato {
 id: number;
 cpf_cnpj: string;
 nome: string;
 telefone: string;
 plano?: string;
 status_cliente: "ativo" | "bloqueado" | "cancelado";
 endereco?: string;
 logradouro?: string;
 numero?: string;
 complemento?: string;
 bairro?: string;
 cidade?: string;
 uf?: string;
 cep?: string;
 ponto_referencia?: string;
 coordenadas?: {
 lat: number;
 lng: number;
 };
}

export interface Conversa {
 id: number;
 canal: "whatsapp" | "webchat" | "telefone";
 contato_id: number;
 nome_cliente?: string;
 telefone?: string;
 cpf?: string;
 plano?: string;
 protocolo?: string;
 tempo_espera?: string;
 fila?: string;
 operador_id?: number;
 status: "aberta" | "fechada" | "triagem_ia";
 prioridade: number;
 mensagens: Mensagem[];
}

export interface Mensagem {
 id: number;
 conversa_id: number;
 autor_tipo: "cliente" | "ia" | "operador";
 tipo?: "texto" | "nota_interna" | "audio" | "arquivo";
 conteudo: string;
 enviada_em: string;
 status?: "enviando" | "enviado" | "entregue" | "lido";
 duracao_audio?: string;
}

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

export interface AuditLogEntry {
 id: string;
 timestamp: string;
 usuario: string;
 usuarioEmail?: string;
 usuarioRole?: string;
 modulo: 'Acessos' | 'SGP / ERP' | 'GenieACS (TR-069)' | 'NOC / Zabbix' | 'Campanhas' | 'Segurança' | 'Configurações' | 'Sistema';
 acao: string;
 detalhes: string;
 categoria?: 'acesso' | 'configuracao' | 'disparo' | 'comando' | 'seguranca';
 severidade: 'info' | 'atencao' | 'critico';
 ip: string;
 userAgent?: string;
 payloadAntes?: any;
 payloadDepois?: any;
 status: 'sucesso' | 'falha';
 data?: string;
}


// --- PRD CUSTOMER 360 & ENLACE-PAY TYPES ---
export interface NapExternalReference {
  externalSystem: 'sgp' | 'ixc' | 'hubsoft';
  externalCustomerId: string;
  externalContractId: string;
  lastSyncAt: string;
  syncStatus: 'synced' | 'syncing' | 'pending' | 'error';
}

export interface NapInvoice {
  id: number;
  napInvoiceId: string;
  externalInvoiceId: string;
  externalSystem: string;
  amount: number;
  dueDate: string;
  status: 'open' | 'paid' | 'canceled' | 'divergent' | 'expired';
  paymentChargeId?: string;
  txid?: string;
  pixCopiaECola?: string;
  qrCodeBase64?: string;
  paidAt?: string;
  erpBaixaStatus?: 'posted' | 'pending_queue' | 'failed';
  erpBaixaId?: string;
}

export interface NapPaymentTransaction {
  id: string;
  txid: string;
  invoiceId: number;
  amount: number;
  method: string;
  bank: string;
  transactionId?: string;
  source: string;
  status: 'confirmed' | 'reconciled' | 'divergent';
  receivedAt: string;
  reconciledAt?: string;
  divergenceReason?: string;
}

export interface NapCustomerEvent {
  id: string;
  customerId: number;
  eventType: 
    | 'CUSTOMER_CREATED'
    | 'CUSTOMER_UPDATED'
    | 'CONTRACT_SYNCED'
    | 'INVOICE_CREATED'
    | 'PIX_CREATED'
    | 'WHATSAPP_SENT'
    | 'WHATSAPP_DELIVERED'
    | 'EMAIL_SENT'
    | 'LINK_OPENED'
    | 'QR_VIEWED'
    | 'PAYMENT_RECEIVED'
    | 'PAYMENT_CONFIRMED'
    | 'ERP_PAYMENT_POSTED'
    | 'ERP_SYNC_FAILED'
    | 'RECONCILED'
    | 'TICKET_CREATED'
    | 'TICKET_CLOSED'
    | 'CALL_STARTED'
    | 'CALL_ENDED'
    | 'ONU_OFFLINE'
    | 'ONU_ONLINE'
    | 'ZABBIX_ALERT'
    | 'TECHNICIAN_VISIT';
  source: string;
  referenceId?: string;
  metadata?: Record<string, any>;
  occurredAt: string;
}

export interface NapCustomer360 {
  id: number;
  napCustomerId: string; // cus_01JXXXXXXX
  name: string;
  document: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  status: 'active' | 'blocked' | 'canceled' | 'installing';
  createdAt: string;
  externalReferences: NapExternalReference[];
  contract: {
    contractId: string;
    planName: string;
    speedDown: string;
    speedUp: string;
    installDate: string;
    status: string;
    installAddress: string;
    equipment: string;
    monthlyPrice: number;
  };
  technical: {
    olt: string;
    pon: string;
    onuSerial: string;
    onuMac: string;
    vlan: number;
    ipPppoe: string;
    pppoeUser: string;
    opticalPowerRx: string;
    opticalPowerTx: string;
    onuState: 'online' | 'offline' | 'los';
    uptime: string;
    lastDisconnectReason?: string;
    genieAcsDeviceId?: string;
  };
  financial: {
    invoices: NapInvoice[];
    totalPending: number;
    totalPaid: number;
    defaultRisk: 'baixo' | 'medio' | 'alto';
  };
  support: {
    tickets: Array<{
      id: string;
      title: string;
      status: 'aberto' | 'em_andamento' | 'resolvido' | 'fechado';
      priority: 'baixa' | 'normal' | 'alta' | 'urgente';
      openedAt: string;
      assignedTo?: string;
    }>;
    callsCount: number;
    whatsappInteractionsCount: number;
    lastInteractionDate: string;
  };
  noc: {
    availabilityPercent: number;
    activeAlerts: number;
    lastOutage?: string;
    latencyMs: number;
    packetLossPercent: number;
    zabbixHostId?: string;
  };
  timeline: NapCustomerEvent[];
}

export interface DomainAuthorityRule {
  domain: string;
  description: string;
  primarySource: string;
  secondarySource: string;
  syncMode: 'webhook' | 'event_driven' | 'scheduled' | 'manual';
  lastSyncAt: string;
  status: 'active' | 'degraded' | 'syncing';
}

export interface C6BankConfig {
  id: string;
  bankName: string;
  ispName: string;
  pixKey: string;
  pixKeyType: 'cnpj' | 'email' | 'aleatoria' | 'telefone';
  clientId: string;
  clientSecretMasked: string;
  webhookUrl: string;
  mtlsCertificateUploaded: boolean;
  mtlsCertificateName?: string;
  mtlsCertificateExpiry?: string;
  environment: 'production' | 'sandbox';
  status: 'connected' | 'unconfigured' | 'testing';
  lastHealthCheck?: string;
  latencyMs?: number;
}

