import { db } from "../src/db/index.js";
import { 
  nap_customers, nap_customer_references, nap_invoices, 
  nap_payment_transactions, nap_customer_events, nap_integrations 
} from "../src/db/schema.js";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";
import { ErpFactory } from "./integrations/erp/ErpFactory.js";
import { isMockAllowed } from "./security/mockGuard.js";
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
    ispName: process.env.ISP_NAME || 'Provedor Telecom',
    pixKey: process.env.C6_PIX_KEY || '',
    pixKeyType: (process.env.C6_PIX_KEY_TYPE as any) || 'cnpj',
    clientId: process.env.C6_CLIENT_ID || '',
    clientSecretMasked: process.env.C6_CLIENT_SECRET ? '••••••••••••••••••••••••' : '',
    webhookUrl: process.env.C6_WEBHOOK_URL || '',
    mtlsCertificateUploaded: Boolean(process.env.C6_MTLS_CERT || process.env.C6_CERT_PATH),
    mtlsCertificateName: (process.env.C6_MTLS_CERT || process.env.C6_CERT_PATH) ? 'c6_mtls.crt' : undefined,
    mtlsCertificateExpiry: undefined,
    environment: (process.env.C6_ENV as any) || 'sandbox',
    status: (process.env.C6_CLIENT_ID && (process.env.C6_MTLS_CERT || process.env.C6_CERT_PATH)) ? 'testing' : 'unconfigured',
    lastHealthCheck: undefined,
    latencyMs: undefined
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
    // Instância limpa em runtime; dados são carregados estritamente via sincronização ERP e PostgreSQL
  }

  public static getInstance(): Customer360Store {
    if (!Customer360Store.instance) {
      Customer360Store.instance = new Customer360Store();
    }
    return Customer360Store.instance;
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

  /**
   * Sincronização e conciliação de cliente vindo do ERP externo (SGP, IXC, HubSoft).
   * - Consulta o ERP via adaptador;
   * - Persiste ou atualiza no PostgreSQL (tabela clientes / nap_customers);
   * - Concilia e atualiza o estado em memória do Customer 360;
   * - Sincroniza faturas abertas e atualiza totalPending.
   */
  public async syncCustomerFromErp(documentoOuCpf: string, erpProvider: string = 'sgp'): Promise<NapCustomer360 | null> {
    const cleanDoc = documentoOuCpf.replace(/\D/g, '');
    const adapter = ErpFactory.getAdapter(erpProvider);

    const erpCliente = await adapter.buscarClientePorCpf(cleanDoc || documentoOuCpf);
    if (!erpCliente) {
      return null;
    }

    let dbCustomerId: number | null = null;
    if (process.env.DATABASE_URL) {
      try {
        const existing = await db.select().from(nap_customers).where(eq(nap_customers.documento, erpCliente.documento)).limit(1);
        if (existing.length > 0) {
          dbCustomerId = existing[0].id;
          await db.update(nap_customers).set({
            nome: erpCliente.nome,
            telefone: erpCliente.telefone,
            plano: erpCliente.plano,
            status: erpCliente.status === 'ativo' ? 'ativo' : 'bloqueado',
            endereco: erpCliente.endereco,
            erpId: erpCliente.id,
            erpOrigem: adapter.getName().toLowerCase(),
            ultimaSincronizacao: new Date(),
            updatedAt: new Date()
          }).where(eq(nap_customers.id, dbCustomerId));
        } else {
          const inserted = await db.insert(nap_customers).values({
            nome: erpCliente.nome,
            documento: erpCliente.documento,
            telefone: erpCliente.telefone,
            plano: erpCliente.plano,
            status: erpCliente.status === 'ativo' ? 'ativo' : 'bloqueado',
            endereco: erpCliente.endereco,
            erpId: erpCliente.id,
            erpOrigem: adapter.getName().toLowerCase(),
            ultimaSincronizacao: new Date()
          }).returning({ id: nap_customers.id });
          if (inserted.length > 0) {
            dbCustomerId = inserted[0].id;
          }
        }
      } catch (dbErr: any) {
        console.warn('[Customer360] Fallback PostgreSQL ao persistir cliente do ERP:', dbErr?.message);
      }
    }

    const numericId = dbCustomerId || (Date.now() % 100000);
    let existingC360: NapCustomer360 | undefined;
    for (const c of this.customers.values()) {
      if (c.document.replace(/\D/g, '') === cleanDoc || c.document === erpCliente.documento) {
        existingC360 = c;
        break;
      }
    }

    const customerObj: NapCustomer360 = existingC360 || {
      id: numericId,
      napCustomerId: `cus_erp_${erpCliente.id}`,
      name: erpCliente.nome,
      document: erpCliente.documento,
      phone: erpCliente.telefone,
      whatsapp: erpCliente.telefone.replace(/\D/g, ''),
      email: `${erpCliente.nome.toLowerCase().replace(/\s+/g, '.')}@cliente.provedor.com.br`,
      address: erpCliente.endereco,
      status: erpCliente.status === 'ativo' ? 'active' : 'blocked',
      createdAt: new Date().toISOString(),
      externalReferences: [
        {
          externalSystem: (adapter.getName().toLowerCase().includes('ixc') ? 'ixc' : adapter.getName().toLowerCase().includes('hub') ? 'hubsoft' : 'sgp'),
          externalCustomerId: erpCliente.id,
          externalContractId: erpCliente.contratoId || `CTR-${erpCliente.id}`,
          lastSyncAt: new Date().toISOString(),
          syncStatus: 'synced'
        }
      ],
      contract: {
        contractId: erpCliente.contratoId || `CTR-${erpCliente.id}`,
        planName: erpCliente.plano,
        speedDown: '500 Mega',
        speedUp: '250 Mega',
        installDate: new Date().toISOString().split('T')[0],
        status: erpCliente.status === 'ativo' ? 'Ativo' : 'Bloqueado',
        installAddress: erpCliente.endereco,
        equipment: 'ONU Wi-Fi 6 (Comodato)',
        monthlyPrice: 99.90
      },
      technical: {
        olt: 'OLT-DEFAULT-01',
        pon: '0/1/1',
        onuSerial: `ONT${erpCliente.id}`,
        onuMac: '00:11:22:33:44:55',
        vlan: 100,
        ipPppoe: '100.64.10.1',
        pppoeUser: `${cleanDoc || 'cliente'}@isp`,
        opticalPowerRx: '-19.0 dBm',
        opticalPowerTx: '+2.0 dBm',
        onuState: 'online',
        uptime: '5 dias'
      },
      financial: {
        invoices: [],
        totalPending: 0,
        totalPaid: 0,
        defaultRisk: 'baixo'
      },
      support: {
        tickets: [],
        callsCount: 0,
        whatsappInteractionsCount: 0,
        lastInteractionDate: new Date().toISOString()
      },
      noc: {
        availabilityPercent: null,
        activeAlerts: null,
        latencyMs: null,
        packetLossPercent: null
      },
      timeline: []
    };

    customerObj.name = erpCliente.nome;
    customerObj.phone = erpCliente.telefone;
    customerObj.address = erpCliente.endereco;
    customerObj.status = erpCliente.status === 'ativo' ? 'active' : 'blocked';
    customerObj.contract.planName = erpCliente.plano;

    try {
      const faturasErp = await adapter.buscarFaturasEmAberto(erpCliente.id);
      if (faturasErp && faturasErp.length > 0) {
        for (const f of faturasErp) {
          const invId = Number(f.id) || (Date.now() % 100000);
          const invoiceItem: NapInvoice = {
            id: invId,
            napInvoiceId: `inv_erp_${f.id}`,
            externalInvoiceId: f.id,
            externalSystem: adapter.getName().toLowerCase(),
            amount: f.valor,
            dueDate: f.vencimento,
            status: f.status === 'pago' ? 'paid' : 'open',
            txid: f.txid || `TXID_${f.id}`,
            pixCopiaECola: f.linkPix || undefined
          };
          customerObj.financial.invoices.push(invoiceItem);
          this.invoices.set(invId, invoiceItem);
        }
        customerObj.financial.totalPending = customerObj.financial.invoices
          .filter(i => i.status === 'open')
          .reduce((acc, i) => acc + Number(i.amount), 0);
      }
    } catch (fErr: any) {
      console.warn('[Customer360] Falha ao sincronizar faturas do ERP:', fErr?.message);
    }

    this.customers.set(customerObj.id, customerObj);
    return customerObj;
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
        averageAvailability: null
      }
    };
  }
}
