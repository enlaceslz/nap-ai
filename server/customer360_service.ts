import { db } from "../src/db/index.js";
import { 
  nap_customers, nap_customer_references, nap_invoices, 
  nap_payment_transactions, nap_customer_events, nap_integrations 
} from "../src/db/schema.js";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";
import { ErpFactory } from "./integrations/erp/ErpFactory.js";
import type { 
  NapCustomer360, NapInvoice, NapPaymentTransaction, 
  NapCustomerEvent, DomainAuthorityRule, C6BankConfig
} from "../src/types.js";

// --- MEMORY FALLBACK STORE (Resilient In-Memory State) ---
export class Customer360Store {
  private static instance: Customer360Store;
  
  public c6BankConfig: C6BankConfig = {
    id: 'c6_bank_primary',
    bankName: 'C6 Bank S.A. (336)',
    ispName: 'DJD Telecom Provedor Fibra',
    pixKey: '12.345.678/0001-90',
    pixKeyType: 'cnpj',
    clientId: 'c6_client_live_89172401',
    clientSecretMasked: '••••••••••••••••••••••••c6sec',
    webhookUrl: 'https://ais-dev-yp5je5zs6omogetmqdpfub-289190228687.us-east1.run.app/api/payments/webhook',
    mtlsCertificateUploaded: true,
    mtlsCertificateName: 'c6_mtls_prod_2026.crt',
    mtlsCertificateExpiry: '2027-08-30T23:59:59Z',
    environment: 'production',
    status: 'connected',
    lastHealthCheck: new Date().toISOString(),
    latencyMs: 42
  };
  public customers: Map<number, NapCustomer360> = new Map();
  public invoices: Map<number, NapInvoice> = new Map();
  public paymentTransactions: Map<string, NapPaymentTransaction> = new Map();
  public events: NapCustomerEvent[] = [];
  public erpSyncQueue: Array<{
    id: string;
    invoiceId: number;
    externalInvoiceId: string;
    externalSystem: string;
    amount: number;
    txid: string;
    transactionId: string;
    paymentDate: string;
    status: 'pending' | 'retrying' | 'posted' | 'failed';
    attempts: number;
    lastError?: string;
    createdAt: string;
  }> = [];
  public reconciliationQueue: Array<{
    id: string;
    txid: string;
    invoiceId?: number;
    expectedAmount?: number;
    receivedAmount: number;
    status: 'divergent' | 'resolved';
    reason: string;
    detectedAt: string;
    resolvedAt?: string;
    resolvedBy?: string;
  }> = [];
  public processedWebhooks: Set<string> = new Set();
  public authorityMatrix: DomainAuthorityRule[] = [
    { domain: 'Cliente', description: 'Cadastro e dados cadastrais', primarySource: 'ERP (SGP/IXC/HubSoft)', secondarySource: 'NAP Customer 360', syncMode: 'webhook', lastSyncAt: new Date().toISOString(), status: 'active' },
    { domain: 'Contrato', description: 'Contratos e planos comerciais', primarySource: 'ERP Externo', secondarySource: 'NAP Customer 360', syncMode: 'event_driven', lastSyncAt: new Date().toISOString(), status: 'active' },
    { domain: 'Fatura', description: 'Títulos e faturas oficiais', primarySource: 'ERP Externo', secondarySource: 'NAP Billing', syncMode: 'event_driven', lastSyncAt: new Date().toISOString(), status: 'active' },
    { domain: 'Cobrança Pix', description: 'Geração de TXID e QR Code', primarySource: 'Enlace-Pay / Cobranca-API', secondarySource: 'NAP Payments', syncMode: 'webhook', lastSyncAt: new Date().toISOString(), status: 'active' },
    { domain: 'Transação Pix', description: 'Confirmação bancária oficial', primarySource: 'C6 / Enlace-Pay', secondarySource: 'NAP Payments', syncMode: 'webhook', lastSyncAt: new Date().toISOString(), status: 'active' },
    { domain: 'Baixa Oficial', description: 'Quitação oficial no ERP', primarySource: 'ERP Externo', secondarySource: 'NAP Billing', syncMode: 'event_driven', lastSyncAt: new Date().toISOString(), status: 'active' },
    { domain: 'OLT & PON', description: 'Topologia e portas OLT', primarySource: 'NAP', secondarySource: 'Zabbix', syncMode: 'event_driven', lastSyncAt: new Date().toISOString(), status: 'active' },
    { domain: 'ONU / ONT', description: 'Potência óptica e TR-069', primarySource: 'NAP (GenieACS)', secondarySource: 'Zabbix', syncMode: 'webhook', lastSyncAt: new Date().toISOString(), status: 'active' },
    { domain: 'Rede / PPPoE', description: 'Sessão PPPoE e IP dinâmico', primarySource: 'NAP (RADIUS/MikroTik)', secondarySource: 'IPAM', syncMode: 'event_driven', lastSyncAt: new Date().toISOString(), status: 'active' },
    { domain: 'Zabbix / NOC', description: 'Alertas e telemetria', primarySource: 'NAP', secondarySource: 'Zabbix 7.0 LTS', syncMode: 'webhook', lastSyncAt: new Date().toISOString(), status: 'active' },
    { domain: 'Asterisk / Voz', description: 'Chamadas e URA', primarySource: 'NAP', secondarySource: 'Asterisk 20+ PABX', syncMode: 'event_driven', lastSyncAt: new Date().toISOString(), status: 'active' },
    { domain: 'WhatsApp / WABA', description: 'Mensagens e Triagem IA', primarySource: 'NAP', secondarySource: 'Meta Cloud API', syncMode: 'webhook', lastSyncAt: new Date().toISOString(), status: 'active' },
    { domain: 'Chamados', description: 'Help Desk e OS de campo', primarySource: 'NAP (Zammad Engine)', secondarySource: 'ERP Externo', syncMode: 'event_driven', lastSyncAt: new Date().toISOString(), status: 'active' },
    { domain: 'Timeline 360', description: 'Histórico operacional do cliente', primarySource: 'NAP', secondarySource: 'Event Engine', syncMode: 'event_driven', lastSyncAt: new Date().toISOString(), status: 'active' },
    { domain: 'Auditoria LGPD', description: 'Trilha de auditoria imutável', primarySource: 'NAP', secondarySource: 'PostgreSQL WAF', syncMode: 'event_driven', lastSyncAt: new Date().toISOString(), status: 'active' }
  ];

  private constructor() {
    this.seedInitialData();
  }

  public static getInstance(): Customer360Store {
    if (!Customer360Store.instance) {
      Customer360Store.instance = new Customer360Store();
    }
    return Customer360Store.instance;
  }

  private seedInitialData() {
    // 1. Cliente João da Silva (SGP)
    const joao: NapCustomer360 = {
      id: 1,
      napCustomerId: 'cus_01J8M9A4B2C3D',
      name: 'João da Silva',
      document: '123.456.789-00',
      phone: '+55 11 99999-9999',
      whatsapp: '5511999999999',
      email: 'joao.silva@email.com',
      address: 'Av. Paulista, 1000, Apto 42 - Bela Vista, São Paulo - SP',
      status: 'active',
      createdAt: '2026-01-15T10:00:00Z',
      externalReferences: [
        { externalSystem: 'sgp', externalCustomerId: '45821', externalContractId: 'CTR-45821', lastSyncAt: new Date().toISOString(), syncStatus: 'synced' },
        { externalSystem: 'ixc', externalCustomerId: 'IXC-LEGACY-112', externalContractId: 'CTR-OLD', lastSyncAt: '2026-02-01T12:00:00Z', syncStatus: 'synced' }
      ],
      contract: {
        contractId: 'CTR-45821',
        planName: 'Fibra Turbo 500 Mega',
        speedDown: '500 Mbps',
        speedUp: '250 Mbps',
        installDate: '2026-01-18',
        status: 'Ativo',
        installAddress: 'Av. Paulista, 1000, Apto 42 - Bela Vista, São Paulo - SP',
        equipment: 'ONU Wi-Fi 6 Huawei HG8145V5 (Comodato)',
        monthlyPrice: 100.00
      },
      technical: {
        olt: 'OLT-HUAWEI-CENTRAL-01',
        pon: '0/2/4',
        onuSerial: 'HWTC4891A204',
        onuMac: '48:57:02:91:A2:04',
        vlan: 100,
        ipPppoe: '100.64.12.45',
        pppoeUser: 'joao.silva@djdtelecom',
        opticalPowerRx: '-19.4 dBm',
        opticalPowerTx: '+2.3 dBm',
        onuState: 'online',
        uptime: '28 dias, 14 horas',
        genieAcsDeviceId: 'HWTC-4891A204'
      },
      financial: {
        invoices: [],
        totalPending: 0.00,
        totalPaid: 100.00,
        defaultRisk: 'baixo'
      },
      support: {
        tickets: [
          { id: 'TKT-2026-081', title: 'Dúvida sobre canais Wi-Fi 5GHz', status: 'fechado', priority: 'baixa', openedAt: '2026-09-15T09:10:00Z', assignedTo: 'Suporte N1' }
        ],
        callsCount: 2,
        whatsappInteractionsCount: 5,
        lastInteractionDate: '2026-09-17T14:30:00Z'
      },
      noc: {
        availabilityPercent: 99.98,
        activeAlerts: 0,
        latencyMs: 3.8,
        packetLossPercent: 0.0,
        zabbixHostId: 'ZBX-HOST-45821'
      },
      timeline: []
    };

    // Fatura João
    const invJoao: NapInvoice = {
      id: 101,
      napInvoiceId: 'inv_001',
      externalInvoiceId: '45821',
      externalSystem: 'sgp',
      amount: 100.00,
      dueDate: '2026-10-10T23:59:59Z',
      status: 'paid',
      paymentChargeId: 'chg_001',
      txid: 'E123456789',
      pixCopiaECola: '00020126360014BR.GOV.BCB.PIX0114123456789012345204000053039865405100.005802BR5912DJD Telecom6009Sao Paulo62070503***63047D4E',
      paidAt: '2026-09-17T14:32:00Z',
      erpBaixaStatus: 'posted',
      erpBaixaId: 'SGP_REC_849201'
    };

    joao.financial.invoices.push(invJoao);
    this.invoices.set(invJoao.id, invJoao);

    // Eventos do João
    const eventsJoao: NapCustomerEvent[] = [
      { id: 'EVT-01', customerId: 1, eventType: 'ERP_PAYMENT_POSTED', source: 'SGP', referenceId: '45821', metadata: { status: 'PAID', receipt: 'SGP_REC_849201' }, occurredAt: '2026-09-17T14:32:15Z' },
      { id: 'EVT-02', customerId: 1, eventType: 'PAYMENT_CONFIRMED', source: 'NAP Payments', referenceId: 'inv_001', metadata: { txid: 'E123456789', amount: 100.00, bank: 'C6' }, occurredAt: '2026-09-17T14:32:00Z' },
      { id: 'EVT-03', customerId: 1, eventType: 'PAYMENT_RECEIVED', source: 'C6 / Enlace-Pay', referenceId: 'chg_001', metadata: { txid: 'E123456789', amount: 100.00 }, occurredAt: '2026-09-17T14:31:58Z' },
      { id: 'EVT-04', customerId: 1, eventType: 'QR_VIEWED', source: 'PWA Portal', referenceId: 'inv_001', metadata: { channel: 'Portal Web' }, occurredAt: '2026-09-17T14:30:10Z' },
      { id: 'EVT-05', customerId: 1, eventType: 'WHATSAPP_DELIVERED', source: 'WABA Meta', referenceId: 'MSG-WABA-991', metadata: { phone: '5511999999999' }, occurredAt: '2026-09-17T14:29:45Z' },
      { id: 'EVT-06', customerId: 1, eventType: 'WHATSAPP_SENT', source: 'Régua de Cobrança', referenceId: 'inv_001', metadata: { campaign: 'Fatura Mensal' }, occurredAt: '2026-09-17T14:29:30Z' },
      { id: 'EVT-07', customerId: 1, eventType: 'PIX_CREATED', source: 'Enlace-Pay', referenceId: 'chg_001', metadata: { txid: 'E123456789' }, occurredAt: '2026-09-17T14:29:00Z' },
      { id: 'EVT-08', customerId: 1, eventType: 'INVOICE_CREATED', source: 'SGP', referenceId: '45821', metadata: { amount: 100.00 }, occurredAt: '2026-09-17T14:28:30Z' },
      { id: 'EVT-09', customerId: 1, eventType: 'ONU_ONLINE', source: 'GenieACS', referenceId: 'HWTC4891A204', metadata: { opticalRx: '-19.4 dBm' }, occurredAt: '2026-09-16T10:18:00Z' },
      { id: 'EVT-10', customerId: 1, eventType: 'ONU_OFFLINE', source: 'GenieACS', referenceId: 'HWTC4891A204', metadata: { reason: 'Queda de energia pontual' }, occurredAt: '2026-09-16T10:15:00Z' },
      { id: 'EVT-11', customerId: 1, eventType: 'TICKET_CLOSED', source: 'Help Desk (Zammad)', referenceId: 'TKT-2026-081', metadata: { resolution: 'Explicado funcionamento dual-band' }, occurredAt: '2026-09-15T09:10:00Z' }
    ];

    joao.timeline = eventsJoao;
    this.events.push(...eventsJoao);
    this.customers.set(joao.id, joao);

    // 2. Cliente Maria Oliveira Santos (IXC)
    const maria: NapCustomer360 = {
      id: 2,
      napCustomerId: 'cus_01J8N2F5K9P1W',
      name: 'Maria Oliveira Santos',
      document: '987.654.321-99',
      phone: '+55 11 98888-7777',
      whatsapp: '5511988887777',
      email: 'maria.santos@gmail.com',
      address: 'Rua Augusta, 500, Consolação, São Paulo - SP',
      status: 'active',
      createdAt: '2026-02-10T14:00:00Z',
      externalReferences: [
        { externalSystem: 'ixc', externalCustomerId: 'IXC-9821', externalContractId: 'CTR-IXC-9821', lastSyncAt: new Date().toISOString(), syncStatus: 'synced' }
      ],
      contract: {
        contractId: 'CTR-IXC-9821',
        planName: 'Plano Ultra Gamer 600 Mega',
        speedDown: '600 Mbps',
        speedUp: '300 Mbps',
        installDate: '2026-02-12',
        status: 'Ativo',
        installAddress: 'Rua Augusta, 500, Consolação, São Paulo - SP',
        equipment: 'ONT ZTE F670L Wi-Fi AC1200',
        monthlyPrice: 119.90
      },
      technical: {
        olt: 'OLT-ZTE-CENTRAL-02',
        pon: '1/1/8',
        onuSerial: 'ZTEGC19382B1',
        onuMac: '84:A4:23:93:82:B1',
        vlan: 102,
        ipPppoe: '100.64.44.110',
        pppoeUser: 'maria.santos@djdtelecom',
        opticalPowerRx: '-21.2 dBm',
        opticalPowerTx: '+2.1 dBm',
        onuState: 'online',
        uptime: '42 dias, 08 horas'
      },
      financial: {
        invoices: [],
        totalPending: 119.90,
        totalPaid: 239.80,
        defaultRisk: 'baixo'
      },
      support: {
        tickets: [],
        callsCount: 0,
        whatsappInteractionsCount: 2,
        lastInteractionDate: '2026-09-10T11:20:00Z'
      },
      noc: {
        availabilityPercent: 99.99,
        activeAlerts: 0,
        latencyMs: 2.9,
        packetLossPercent: 0.0
      },
      timeline: []
    };

    const invMaria: NapInvoice = {
      id: 102,
      napInvoiceId: 'inv_002',
      externalInvoiceId: 'IXC-INV-5541',
      externalSystem: 'ixc',
      amount: 119.90,
      dueDate: new Date(Date.now() + 86400000 * 4).toISOString(),
      status: 'open',
      paymentChargeId: 'chg_002',
      txid: 'E987654321IXC',
      pixCopiaECola: '00020126360014BR.GOV.BCB.PIX0114987654321012345204000053039865405119.905802BR5912DJD Telecom6009Sao Paulo62070503***63048B2A',
      erpBaixaStatus: 'pending_queue'
    };

    maria.financial.invoices.push(invMaria);
    this.invoices.set(invMaria.id, invMaria);

    // Eventos da Maria
    const eventsMaria: NapCustomerEvent[] = [
      { id: 'EVT-M01', customerId: 2, eventType: 'PIX_CREATED', source: 'Enlace-Pay', referenceId: 'chg_002', metadata: { txid: 'E987654321IXC', amount: 119.90 }, occurredAt: new Date(Date.now() - 3600000 * 4).toISOString() },
      { id: 'EVT-M02', customerId: 2, eventType: 'INVOICE_CREATED', source: 'IXC Soft', referenceId: 'IXC-INV-5541', metadata: { amount: 119.90 }, occurredAt: new Date(Date.now() - 3600000 * 5).toISOString() },
      { id: 'EVT-M03', customerId: 2, eventType: 'WHATSAPP_DELIVERED', source: 'WABA Meta', referenceId: 'MSG-WABA-882', metadata: { phone: '5511988887777' }, occurredAt: new Date(Date.now() - 3600000 * 6).toISOString() },
      { id: 'EVT-M04', customerId: 2, eventType: 'ONU_ONLINE', source: 'GenieACS', referenceId: 'ZTEGC19382B1', metadata: { opticalRx: '-21.2 dBm' }, occurredAt: '2026-09-10T11:20:00Z' }
    ];
    maria.timeline = eventsMaria;
    this.events.push(...eventsMaria);
    this.customers.set(maria.id, maria);

    // 3. Cliente Carlos Eduardo Mendes (HubSoft)
    const carlos: NapCustomer360 = {
      id: 3,
      napCustomerId: 'cus_01J8P7G2H4Y8M',
      name: 'Carlos Eduardo Mendes',
      document: '456.123.789-11',
      phone: '+55 11 97777-6666',
      whatsapp: '5511977776666',
      email: 'carlos.mendes@empresa.com.br',
      address: 'Rua Vergueiro, 1200, Vila Mariana, São Paulo - SP',
      status: 'active',
      createdAt: '2026-03-01T08:30:00Z',
      externalReferences: [
        { externalSystem: 'hubsoft', externalCustomerId: 'HUB-1029', externalContractId: 'CTR-HUB-1029', lastSyncAt: new Date().toISOString(), syncStatus: 'synced' }
      ],
      contract: {
        contractId: 'CTR-HUB-1029',
        planName: 'Fibra 400 Mega Dedicado',
        speedDown: '400 Mbps',
        speedUp: '400 Mbps',
        installDate: '2026-03-05',
        status: 'Ativo',
        installAddress: 'Rua Vergueiro, 1200, Vila Mariana, São Paulo - SP',
        equipment: 'ONU VSOL V2801SG + Mikrotik hEX S',
        monthlyPrice: 89.90
      },
      technical: {
        olt: 'OLT-VSOL-SUL-01',
        pon: '0/1/2',
        onuSerial: 'VSOL001827AB',
        onuMac: 'E0:67:B3:18:27:AB',
        vlan: 105,
        ipPppoe: '100.64.99.32',
        pppoeUser: 'carlos.hub@djdtelecom',
        opticalPowerRx: '-18.8 dBm',
        opticalPowerTx: '+2.5 dBm',
        onuState: 'online',
        uptime: '15 dias, 22 horas'
      },
      financial: {
        invoices: [],
        totalPending: 0.00,
        totalPaid: 89.90,
        defaultRisk: 'baixo'
      },
      support: {
        tickets: [],
        callsCount: 1,
        whatsappInteractionsCount: 1,
        lastInteractionDate: '2026-09-01T15:00:00Z'
      },
      noc: {
        availabilityPercent: 99.95,
        activeAlerts: 0,
        latencyMs: 4.5,
        packetLossPercent: 0.0
      },
      timeline: []
    };

    const invCarlos: NapInvoice = {
      id: 103,
      napInvoiceId: 'inv_003',
      externalInvoiceId: 'HUB-INV-8890',
      externalSystem: 'hubsoft',
      amount: 89.90,
      dueDate: '2026-09-10T23:59:59Z',
      status: 'paid',
      paymentChargeId: 'chg_003',
      txid: 'E456123789HUB',
      pixCopiaECola: '00020126360014BR.GOV.BCB.PIX011445612378901234520400005303986540589.905802BR5912DJD Telecom6009Sao Paulo62070503***63049C1D',
      paidAt: '2026-09-10T11:45:00Z',
      erpBaixaStatus: 'posted',
      erpBaixaId: 'HUB_REC_7721'
    };

    carlos.financial.invoices.push(invCarlos);
    this.invoices.set(invCarlos.id, invCarlos);

    // Eventos do Carlos
    const eventsCarlos: NapCustomerEvent[] = [
      { id: 'EVT-C01', customerId: 3, eventType: 'ERP_PAYMENT_POSTED', source: 'HubSoft', referenceId: 'HUB-INV-8890', metadata: { receipt: 'HUB_REC_7721' }, occurredAt: '2026-09-10T11:45:20Z' },
      { id: 'EVT-C02', customerId: 3, eventType: 'PAYMENT_CONFIRMED', source: 'NAP Payments', referenceId: 'inv_003', metadata: { txid: 'E456123789HUB', amount: 89.90, bank: 'C6' }, occurredAt: '2026-09-10T11:45:00Z' },
      { id: 'EVT-C03', customerId: 3, eventType: 'PAYMENT_RECEIVED', source: 'C6 / Enlace-Pay', referenceId: 'chg_003', metadata: { txid: 'E456123789HUB', amount: 89.90 }, occurredAt: '2026-09-10T11:44:50Z' },
      { id: 'EVT-C04', customerId: 3, eventType: 'PIX_CREATED', source: 'Enlace-Pay', referenceId: 'chg_003', metadata: { txid: 'E456123789HUB', amount: 89.90 }, occurredAt: '2026-09-08T09:00:00Z' },
      { id: 'EVT-C05', customerId: 3, eventType: 'INVOICE_CREATED', source: 'HubSoft', referenceId: 'HUB-INV-8890', metadata: { amount: 89.90 }, occurredAt: '2026-09-08T08:30:00Z' },
      { id: 'EVT-C06', customerId: 3, eventType: 'ONU_ONLINE', source: 'GenieACS', referenceId: 'VSOL001827AB', metadata: { opticalRx: '-18.8 dBm' }, occurredAt: '2026-09-05T14:10:00Z' }
    ];
    carlos.timeline = eventsCarlos;
    this.events.push(...eventsCarlos);
    this.customers.set(carlos.id, carlos);

    // Transações oficiais liquidadas
    const txnJoao: NapPaymentTransaction = {
      id: 'TXN-001',
      txid: invJoao.txid!,
      invoiceId: invJoao.id,
      amount: invJoao.amount,
      method: 'PIX',
      bank: 'C6 Bank',
      transactionId: 'C6_TX_849201',
      source: 'Enlace-Pay (C6)',
      status: 'reconciled',
      receivedAt: invJoao.paidAt || '2026-09-17T14:32:00Z',
      reconciledAt: '2026-09-17T14:32:15Z'
    };
    this.paymentTransactions.set(txnJoao.txid, txnJoao);

    const txnCarlos: NapPaymentTransaction = {
      id: 'TXN-002',
      txid: invCarlos.txid!,
      invoiceId: invCarlos.id,
      amount: invCarlos.amount,
      method: 'PIX',
      bank: 'C6 Bank',
      transactionId: 'C6_TX_772109',
      source: 'Enlace-Pay (C6)',
      status: 'reconciled',
      receivedAt: invCarlos.paidAt || '2026-09-10T11:45:00Z',
      reconciledAt: '2026-09-10T11:45:15Z'
    };
    this.paymentTransactions.set(txnCarlos.txid, txnCarlos);
  }

  // --- BUSCA E RETORNO CUSTOMER 360 ---
  public getCustomerById(id: number): NapCustomer360 | null {
    return this.customers.get(id) || null;
  }

  public getCustomerByExternalId(system: string, externalId: string): NapCustomer360 | null {
    for (const c of this.customers.values()) {
      const match = c.externalReferences.find(r => 
        r.externalSystem.toLowerCase() === system.toLowerCase() && 
        r.externalCustomerId === externalId
      );
      if (match) return c;
    }
    return null;
  }

  public listCustomers(query?: string, statusFilter?: string): NapCustomer360[] {
    let list = Array.from(this.customers.values());
    if (statusFilter && statusFilter !== 'todos') {
      list = list.filter(c => c.status === statusFilter);
    }
    if (query && query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(c => 
        c.name.toLowerCase().includes(q) ||
        c.document.includes(q) ||
        c.phone.includes(q) ||
        c.contract.contractId.toLowerCase().includes(q) ||
        c.technical.ipPppoe.includes(q) ||
        c.napCustomerId.toLowerCase().includes(q) ||
        c.externalReferences.some(r => r.externalCustomerId.toLowerCase().includes(q))
      );
    }
    return list;
  }

  public addCustomerEvent(event: Omit<NapCustomerEvent, 'id'>): NapCustomerEvent {
    const fullEvent: NapCustomerEvent = {
      ...event,
      id: `EVT_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`
    };
    this.events.unshift(fullEvent);
    const customer = this.customers.get(event.customerId);
    if (customer) {
      if (!customer.timeline) customer.timeline = [];
      customer.timeline.unshift(fullEvent);
    }
    return fullEvent;
  }

  // --- PROCESSAMENTO DO WEBHOOK PIX (ENLACE-PAY / C6) ---
  public async processBankPaymentWebhook(payload: {
    txid: string;
    valor: number;
    idTransacaoBancaria?: string;
    banco?: string;
    webhookId?: string;
    dataPagamento?: string;
  }): Promise<{
    success: boolean;
    status: 'confirmed' | 'already_processed' | 'divergence' | 'invoice_not_found';
    message: string;
    invoice?: NapInvoice;
    transaction?: NapPaymentTransaction;
    erpBaixaResult?: any;
  }> {
    const { txid, valor, idTransacaoBancaria = `C6_${Date.now()}`, banco = 'C6', webhookId = `WBK_${Date.now()}`, dataPagamento = new Date().toISOString() } = payload;

    // 1. Idempotência do Webhook
    const idempotencyKey = `${txid}_${idTransacaoBancaria}`;
    if (this.processedWebhooks.has(idempotencyKey)) {
      console.log(`[Idempotência] Webhook ${idempotencyKey} já processado anteriormente.`);
      return {
        success: true,
        status: 'already_processed',
        message: 'Pagamento já processado anteriormente. Ignorando duplicação.'
      };
    }

    // 2. Localizar cobrança pelo TXID
    let targetInvoice: NapInvoice | undefined;
    for (const inv of this.invoices.values()) {
      if (inv.txid === txid) {
        targetInvoice = inv;
        break;
      }
    }

    if (!targetInvoice) {
      console.warn(`[Divergência] TXID ${txid} não localizado no cadastro de faturas do NAP.`);
      this.reconciliationQueue.push({
        id: `DIV_${Date.now()}`,
        txid,
        receivedAmount: valor,
        status: 'divergent',
        reason: 'TXID não localizado no NAP',
        detectedAt: new Date().toISOString()
      });
      return {
        success: false,
        status: 'invoice_not_found',
        message: 'Fatura não encontrada para este TXID. Enviado para fila de reconciliação.'
      };
    }

    // 3. Validação de Valor (Prevenção de Fraude ou Valor Parcial)
    if (Math.abs(Number(targetInvoice.amount) - Number(valor)) > 0.01) {
      console.warn(`[Divergência de Valor] Fatura: R$ ${targetInvoice.amount}, Recebido: R$ ${valor}`);
      this.reconciliationQueue.push({
        id: `DIV_${Date.now()}`,
        txid,
        invoiceId: targetInvoice.id,
        expectedAmount: Number(targetInvoice.amount),
        receivedAmount: Number(valor),
        status: 'divergent',
        reason: `Divergência de valor: Esperado R$ ${targetInvoice.amount}, Recebido R$ ${valor}`,
        detectedAt: new Date().toISOString()
      });
      targetInvoice.status = 'divergent';
      return {
        success: false,
        status: 'divergence',
        message: `Divergência de valor identificada. Encaminhado para a fila de exceções.`,
        invoice: targetInvoice
      };
    }

    // 4. Registrar Transação Oficial Bancária
    const transaction: NapPaymentTransaction = {
      id: `TXN_${Date.now()}`,
      txid,
      invoiceId: targetInvoice.id,
      amount: valor,
      method: 'PIX',
      bank: banco,
      transactionId: idTransacaoBancaria,
      source: 'C6 / Cobranca-API / Enlace-Pay',
      status: 'confirmed',
      receivedAt: dataPagamento
    };
    this.paymentTransactions.set(txid, transaction);
    this.processedWebhooks.add(idempotencyKey);

    // 5. Atualizar Fatura local
    targetInvoice.status = 'paid';
    targetInvoice.paidAt = dataPagamento;

    // 6. Atualizar Customer 360
    let customerId = 1;
    for (const c of this.customers.values()) {
      if (c.financial.invoices.some(i => i.id === targetInvoice!.id)) {
        customerId = c.id;
        c.financial.totalPaid += Number(valor);
        c.financial.totalPending = Math.max(0, c.financial.totalPending - Number(valor));
        break;
      }
    }

    // 7. Adicionar Eventos na Timeline 360
    this.addCustomerEvent({
      customerId,
      eventType: 'PAYMENT_RECEIVED',
      source: 'C6 / Enlace-Pay',
      referenceId: txid,
      metadata: { txid, amount: valor, bank: banco, transactionId: idTransacaoBancaria },
      occurredAt: dataPagamento
    });

    this.addCustomerEvent({
      customerId,
      eventType: 'PAYMENT_CONFIRMED',
      source: 'NAP Payments',
      referenceId: targetInvoice.napInvoiceId,
      metadata: { invoiceId: targetInvoice.id, txid, amount: valor },
      occurredAt: new Date().toISOString()
    });

    // 8. Baixa Automática e Resiliente no ERP (SGP / IXC / HubSoft)
    let erpResult: any = null;
    try {
      const adapter = ErpFactory.getAdapter(targetInvoice.externalSystem || 'sgp');
      erpResult = await adapter.baixarFatura({
        external_invoice_id: targetInvoice.externalInvoiceId,
        amount: valor,
        payment_date: dataPagamento,
        method: 'PIX',
        txid: txid,
        transaction_id: idTransacaoBancaria
      });

      if (erpResult.success) {
        targetInvoice.erpBaixaStatus = 'posted';
        targetInvoice.erpBaixaId = erpResult.receiptId;

        this.addCustomerEvent({
          customerId,
          eventType: 'ERP_PAYMENT_POSTED',
          source: targetInvoice.externalSystem || 'SGP',
          referenceId: targetInvoice.externalInvoiceId,
          metadata: { receipt: erpResult.receiptId, message: erpResult.message },
          occurredAt: new Date().toISOString()
        });
      } else {
        throw new Error(erpResult.message || 'Falha na resposta do ERP');
      }
    } catch (erpError: any) {
      // PRD Seção 25: Resiliência! Se ERP estiver fora, enfileira para retry sem perder pagamento
      console.warn(`[ERP Offline] Falha ao enviar baixa imediata para ${targetInvoice.externalSystem}. Retendo na fila de contingência:`, erpError?.message);
      targetInvoice.erpBaixaStatus = 'pending_queue';
      
      this.erpSyncQueue.push({
        id: `SYNC_${Date.now()}`,
        invoiceId: targetInvoice.id,
        externalInvoiceId: targetInvoice.externalInvoiceId,
        externalSystem: targetInvoice.externalSystem || 'sgp',
        amount: valor,
        txid,
        transactionId: idTransacaoBancaria,
        paymentDate: dataPagamento,
        status: 'pending',
        attempts: 1,
        lastError: erpError?.message || 'ERP indisponível',
        createdAt: new Date().toISOString()
      });

      this.addCustomerEvent({
        customerId,
        eventType: 'ERP_SYNC_FAILED',
        source: 'NAP Billing Queue',
        referenceId: targetInvoice.externalInvoiceId,
        metadata: { error: erpError?.message, status: 'enqueued_for_retry' },
        occurredAt: new Date().toISOString()
      });
    }

    return {
      success: true,
      status: 'confirmed',
      message: 'Pagamento confirmado e processado com sucesso.',
      invoice: targetInvoice,
      transaction,
      erpBaixaResult: erpResult
    };
  }

  // --- RECONCILIAÇÃO FINANCEIRA AUTOMATIZADA ---
  public reconcileAll(): {
    reconciledCount: number;
    divergentCount: number;
    pendingQueueCount: number;
    details: any[];
  } {
    let reconciledCount = 0;
    let divergentCount = 0;
    const details: any[] = [];

    for (const [txid, txn] of this.paymentTransactions.entries()) {
      const inv = this.invoices.get(txn.invoiceId);
      if (inv) {
        if (inv.status === 'paid' && Math.abs(Number(inv.amount) - Number(txn.amount)) < 0.01) {
          txn.status = 'reconciled';
          txn.reconciledAt = new Date().toISOString();
          reconciledCount++;
          details.push({ txid, invoiceId: inv.id, status: 'RECONCILED', amount: txn.amount });
        } else {
          txn.status = 'divergent';
          divergentCount++;
          details.push({ txid, invoiceId: inv.id, status: 'DIVERGENT', reason: 'Divergência de status ou valor' });
          if (!this.reconciliationQueue.some(r => r.txid === txid)) {
            this.reconciliationQueue.push({
              id: `DIV_${Date.now()}_${txid.slice(-4)}`,
              txid,
              invoiceId: inv.id,
              expectedAmount: Number(inv.amount),
              receivedAmount: Number(txn.amount),
              status: 'divergent',
              reason: 'Divergência de status ou valor entre fatura e liquidação bancária',
              detectedAt: new Date().toISOString()
            });
          }
        }
      } else {
        txn.status = 'divergent';
        divergentCount++;
        details.push({ txid, status: 'DIVERGENT', reason: 'Fatura inexistente para a transação' });
        if (!this.reconciliationQueue.some(r => r.txid === txid)) {
          this.reconciliationQueue.push({
            id: `DIV_${Date.now()}_${txid.slice(-4)}`,
            txid,
            receivedAmount: Number(txn.amount),
            status: 'divergent',
            reason: 'Fatura inexistente no cadastro para esta transação bancária',
            detectedAt: new Date().toISOString()
          });
        }
      }
    }

    return {
      reconciledCount,
      divergentCount,
      pendingQueueCount: this.erpSyncQueue.filter(q => q.status === 'pending').length,
      details
    };
  }

  // --- DASHBOARD CUSTOMER 360 METRICS (PRD SEÇÃO 28) ---
  public getDashboardMetrics() {
    const allCustomers = Array.from(this.customers.values());
    const allInvoices = Array.from(this.invoices.values());

    return {
      customers: {
        total: allCustomers.length,
        active: allCustomers.filter(c => c.status === 'active').length,
        blocked: allCustomers.filter(c => c.status === 'blocked').length,
        defaulters: allCustomers.filter(c => c.financial.totalPending > 0).length
      },
      financial: {
        openChargesCount: allInvoices.filter(i => i.status === 'open').length,
        openChargesAmount: allInvoices.filter(i => i.status === 'open').reduce((acc, i) => acc + Number(i.amount), 0),
        pixReceivedCount: allInvoices.filter(i => i.status === 'paid').length,
        pixReceivedAmount: allInvoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + Number(i.amount), 0),
        pendingErpBaixasCount: this.erpSyncQueue.filter(q => q.status === 'pending').length,
        reconciledCount: Array.from(this.paymentTransactions.values()).filter(t => t.status === 'reconciled' || t.status === 'confirmed').length,
        divergencesCount: this.reconciliationQueue.filter(r => r.status === 'divergent').length
      },
      support: {
        openTickets: allCustomers.reduce((acc, c) => acc + c.support.tickets.filter(t => t.status !== 'fechado').length, 0),
        delayedTickets: 0,
        whatsappInteractions: allCustomers.reduce((acc, c) => acc + c.support.whatsappInteractionsCount, 0),
        asteriskCalls: allCustomers.reduce((acc, c) => acc + c.support.callsCount, 0)
      },
      noc: {
        offlineCustomers: allCustomers.filter(c => c.technical.onuState === 'offline' || c.technical.onuState === 'los').length,
        offlineOnus: allCustomers.filter(c => c.technical.onuState === 'offline').length,
        criticalAlerts: allCustomers.reduce((acc, c) => acc + c.noc.activeAlerts, 0),
        averageAvailability: 99.97
      }
    };
  }
}
