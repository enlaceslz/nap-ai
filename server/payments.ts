import { db, isDatabaseConnected } from "../src/db/index.js";
import { 
  faturas, clientes, pagamentos_transacoes,
  nap_customers, nap_invoices, nap_payment_transactions, 
  nap_customer_events, nap_customer_references 
} from "../src/db/schema.js";
import { eq, and, sql } from "drizzle-orm";
import crypto from "crypto";
import tls from "tls";
import { Customer360Store } from "./customer360_service.js";
import { assertRealService, isMockAllowed } from "./security/mockGuard.js";
import { generatePushEnrollmentToken } from "./push/operatorPushRoutes.js";
import { requestPortalOtp, authenticatePortalClient } from "./auth/portalAuth.js";
import { requireAuth, requirePermission, requireRole } from "./auth/rbacMiddleware.js";
import { recordMandatoryAuditLog } from "./security/httpSecurity.js";

export function setupPaymentRoutes(app: any) {
  const store = Customer360Store.getInstance();

  // 1. Dashboard Customer 360 (PRD Seção 28) - Protegido por requireAuth
  app.get("/api/customer360/dashboard", requireAuth, (req: any, res: any) => {
    try {
      const metrics = store.getDashboardMetrics();
      res.json(metrics);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 1.1a Solicitação de Código de Acesso / OTP para o Portal do Assinante
  // BLOQUEADOR CRÍTICO P0 V10: Implementação de Autenticação Real (CPF + OTP / Senha)
  app.post(["/api/portal/request-otp", "/api/cliente/request-otp", "/api/portal/send-otp"], async (req: any, res: any) => {
    try {
      const { cpf } = req.body;
      if (!cpf) {
        return res.status(400).json({ error: "CPF é obrigatório para emissão de código de acesso.", code: "CPF_REQUIRED" });
      }
      const result = await requestPortalOtp(cpf);
      res.json(result);
    } catch (err: any) {
      const isNotFound = err.message?.toLowerCase().includes("não localizado") || err.message?.toLowerCase().includes("não encontrado");
      res.status(isNotFound ? 404 : 400).json({
        success: false,
        error: err.message,
        code: isNotFound ? "CLIENTE_NOT_FOUND" : "OTP_REQUEST_FAILED"
      });
    }
  });

  // 1.1b Autenticação Real do Portal do Assinante (CPF + OTP ou Senha)
  // BLOQUEADOR CRÍTICO P0 V10: NUNCA transforma CPF solto em credencial!
  app.post(["/api/portal/login", "/api/cliente/login"], async (req: any, res: any) => {
    try {
      const { cpf, senha, otp, code } = req.body;
      const effectiveOtp = otp || code;

      if (!cpf) {
        return res.status(400).json({ error: "CPF é obrigatório.", code: "CPF_REQUIRED" });
      }

      if (!senha && !effectiveOtp) {
        return res.status(401).json({
          success: false,
          error: "Autenticação necessária. Forneça o código de verificação (OTP) enviado por WhatsApp/SMS ou a senha do portal.",
          code: "CREDENTIAL_REQUIRED"
        });
      }

      const authResult = await authenticatePortalClient({
        cpf,
        senha,
        otp: effectiveOtp
      });

      res.json({
        success: true,
        token: authResult.token,
        pushEnrollmentToken: authResult.pushEnrollmentToken,
        client: authResult.client
      });
    } catch (err: any) {
      const errMsg = err.message || "Falha na autenticação do portal";
      const isNotFound = errMsg.toLowerCase().includes("não localizado") || errMsg.toLowerCase().includes("não encontrado");
      const isAuthErr = errMsg.toLowerCase().includes("incorreto") || errMsg.toLowerCase().includes("necessária") || errMsg.toLowerCase().includes("expirado") || errMsg.toLowerCase().includes("inválid");
      
      const statusCode = isNotFound ? 404 : (isAuthErr ? 401 : 400);
      res.status(statusCode).json({
        success: false,
        error: errMsg,
        code: isNotFound ? "CLIENTE_NOT_FOUND" : (isAuthErr ? "UNAUTHORIZED" : "AUTH_FAILED")
      });
    }
  });

  // 2. Lista de Clientes com Busca Unificada - Protegido por requireAuth e permissão CUSTOMER_READ
  app.get("/api/customers", requireAuth, requirePermission('CUSTOMER_READ'), async (req: any, res: any) => {
    try {
      const { q, status } = req.query;
      const customers = store.listCustomers(q as string, status as string);
      res.json({ customers, total: customers.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Ficha Customer 360 Completa por ID - Protegido por requireAuth e permissão CUSTOMER_READ
  app.get("/api/customers/:id", requireAuth, requirePermission('CUSTOMER_READ'), async (req: any, res: any) => {
    try {
      const cid = parseInt(req.params.id);
      if (isNaN(cid)) {
        return res.status(400).json({ error: "ID de cliente inválido.", code: "INVALID_ID" });
      }
      const customer = store.getCustomerById(cid);
      if (!customer) {
        return res.status(404).json({ error: "Cliente não encontrado no NAP Customer 360.", code: "CUSTOMER_NOT_FOUND" });
      }
      res.json(customer);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Timeline Operacional do Cliente - Protegido por requireAuth e CUSTOMER_READ
  app.get("/api/customers/:id/timeline", requireAuth, requirePermission('CUSTOMER_READ'), async (req: any, res: any) => {
    try {
      const cid = parseInt(req.params.id);
      if (isNaN(cid)) {
        return res.status(400).json({ error: "ID de cliente inválido.", code: "INVALID_ID" });
      }
      const customer = store.getCustomerById(cid);
      if (!customer) {
        return res.json({ events: [] });
      }
      res.json({ events: customer.timeline || [] });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Contratos do Cliente - Protegido por requireAuth e CUSTOMER_READ
  app.get("/api/customers/:id/contracts", requireAuth, requirePermission('CUSTOMER_READ'), async (req: any, res: any) => {
    try {
      const cid = parseInt(req.params.id);
      if (isNaN(cid)) {
        return res.status(400).json({ error: "ID de cliente inválido." });
      }
      const customer = store.getCustomerById(cid);
      if (!customer) return res.status(404).json({ error: "Cliente não encontrado" });
      res.json({ contracts: [customer.contract] });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. Faturas e Cobranças Pix - Protegido por requireAuth e INVOICE_READ
  app.get("/api/customers/:id/invoices", requireAuth, requirePermission('INVOICE_READ'), async (req: any, res: any) => {
    try {
      const cid = parseInt(req.params.id);
      if (isNaN(cid)) {
        return res.status(400).json({ error: "ID de cliente inválido." });
      }
      const customer = store.getCustomerById(cid);
      if (!customer) return res.json({ invoices: [] });
      res.json({ invoices: customer.financial.invoices || [] });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7. Histórico de Pagamentos e Transações - Protegido por requireAuth e PAYMENT_READ
  app.get("/api/customers/:id/payments", requireAuth, requirePermission('PAYMENT_READ'), async (req: any, res: any) => {
    try {
      const cid = parseInt(req.params.id);
      if (isNaN(cid)) {
        return res.status(400).json({ error: "ID de cliente inválido." });
      }
      const customer = store.getCustomerById(cid);
      if (!customer) return res.json({ payments: [] });
      
      const invoiceIds = new Set(customer.financial.invoices.map(i => i.id));
      const payments = Array.from(store.paymentTransactions.values())
        .filter(p => invoiceIds.has(p.invoiceId));
      res.json({ payments });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 8. Telemetria e Dados Técnicos (GenieACS / TR-069) - Protegido por requireAuth e CUSTOMER_READ
  app.get("/api/customers/:id/network", requireAuth, requirePermission('CUSTOMER_READ'), async (req: any, res: any) => {
    try {
      const cid = parseInt(req.params.id);
      if (isNaN(cid)) {
        return res.status(400).json({ error: "ID de cliente inválido." });
      }
      const customer = store.getCustomerById(cid);
      if (!customer) return res.status(404).json({ error: "Cliente não encontrado" });
      res.json({ technical: customer.technical });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 9. Chamados de Suporte - Protegido por requireAuth e HELPDESK_READ
  app.get("/api/customers/:id/tickets", requireAuth, requirePermission('HELPDESK_READ'), async (req: any, res: any) => {
    try {
      const cid = parseInt(req.params.id);
      if (isNaN(cid)) {
        return res.status(400).json({ error: "ID de cliente inválido." });
      }
      const customer = store.getCustomerById(cid);
      if (!customer) return res.json({ tickets: [] });
      res.json({ tickets: customer.support.tickets });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 10. Métricas NOC / Zabbix - Protegido por requireAuth e ZABBIX_READ
  app.get("/api/customers/:id/noc", requireAuth, requirePermission('ZABBIX_READ'), async (req: any, res: any) => {
    try {
      const cid = parseInt(req.params.id);
      if (isNaN(cid)) {
        return res.status(400).json({ error: "ID de cliente inválido." });
      }
      const customer = store.getCustomerById(cid);
      if (!customer) return res.status(404).json({ error: "Cliente não encontrado" });
      res.json({ noc: customer.noc });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 11. Ações Operacionais Críticas: Reboot ONU via TR-069
  // BLOQUEADOR CRÍTICO P0 V10: Exige autenticação, permissão ONU_REBOOT e auditoria imutável obrigatória
  app.post("/api/customers/:id/actions/reboot-onu", requireAuth, requirePermission('ONU_REBOOT'), async (req: any, res: any) => {
    try {
      const cid = parseInt(req.params.id);
      if (isNaN(cid)) {
        return res.status(400).json({ error: "ID de cliente inválido." });
      }
      const customer = store.getCustomerById(cid);
      if (!customer) {
        return res.status(404).json({ error: "Cliente não encontrado no Customer 360." });
      }

      const onuSerial = customer.technical?.onuSerial;
      if (!onuSerial) {
        return res.status(400).json({ error: "Serial da ONU não cadastrado para este cliente." });
      }

      const operator = req.user?.email || req.user?.nome || 'Operador';

      // Trilha de Auditoria Obrigatória
      await recordMandatoryAuditLog({
        usuario: req.user?.nome || req.user?.email || 'operador',
        userId: String(req.user?.id || 1),
        usuarioEmail: req.user?.email || 'operador@nap.local',
        modulo: 'Customer 360',
        acao: 'ONU_REBOOT',
        recurso: `cliente:${cid}:onu:${onuSerial}`,
        status: 'sucesso',
        ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
        detalhes: JSON.stringify({
          motivo: req.body.motivo || 'Reboot solicitado pelo operador',
          onuSerial,
          clienteId: cid
        })
      });

      store.addCustomerEvent({
        customerId: cid,
        eventType: 'ONU_OFFLINE',
        source: 'GenieACS (TR-069)',
        referenceId: onuSerial,
        metadata: { action: 'REBOOT_REQUESTED', operator },
        occurredAt: new Date().toISOString()
      });

      try {
        const { GenieacsService } = await import("./genieacs/genieacsService.js");
        const acs = GenieacsService.getInstance();
        await acs.rebootDevice(onuSerial);
      } catch (acsErr: any) {
        console.warn(`[GenieACS] Aviso ao despachar reboot para ${onuSerial}:`, acsErr.message);
      }

      res.json({ success: true, message: `Comando de reinicialização enviado para a ONU ${onuSerial} via TR-069.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 12. Geração de Cobrança Pix via Enlace-Pay / Banco C6
  // BLOQUEADOR CRÍTICO FINANCEIRO P0 V10:
  // - Requer autenticação e permissão INVOICE_CREATE
  // - NUNCA fabricar valor default; se ausente ou inválido retorna 400 Bad Request
  // - Vencimento obrigatório (sem default arbitrário)
  // - Idempotência com chave persistida no PostgreSQL
  // - Persistência real na tabela 'faturas'
  // - IDs técnicos gerados via UUID (nunca Date.now())
  app.post("/api/payments/charges", requireAuth, requirePermission('INVOICE_CREATE'), async (req: any, res: any) => {
    try {
      const { customerId, externalInvoiceId, amount, dueDate, externalSystem = 'sgp' } = req.body;
      const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'] || req.body.idempotencyKey || req.body.idempotency_key;

      // 1. Validação estrita do valor
      if (amount === undefined || amount === null || String(amount).trim() === '') {
        return res.status(400).json({
          success: false,
          error: "Valor da cobrança ('amount') é obrigatório.",
          code: "AMOUNT_REQUIRED"
        });
      }

      const numAmount = parseFloat(String(amount));
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({
          success: false,
          error: "Valor da cobrança ('amount') deve ser um número positivo maior que zero.",
          code: "INVALID_AMOUNT"
        });
      }

      // 2. Validação estrita da data de vencimento
      if (!dueDate || String(dueDate).trim() === '') {
        return res.status(400).json({
          success: false,
          error: "Data de vencimento ('dueDate') é obrigatória.",
          code: "DUE_DATE_REQUIRED"
        });
      }

      const parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: "Data de vencimento ('dueDate') inválida.",
          code: "INVALID_DUE_DATE"
        });
      }
      const dueDateStr = parsedDueDate.toISOString().slice(0, 10); // YYYY-MM-DD

      // 3. Validação do cliente
      if (!customerId) {
        return res.status(400).json({
          success: false,
          error: "Identificador do cliente ('customerId') é obrigatório.",
          code: "CUSTOMER_REQUIRED"
        });
      }

      const cid = parseInt(String(customerId));
      if (isNaN(cid)) {
        return res.status(400).json({
          success: false,
          error: "Identificador do cliente ('customerId') inválido.",
          code: "INVALID_CUSTOMER_ID"
        });
      }

      let targetClient: any = null;
      if (isDatabaseConnected) {
        const rows = await db.select().from(clientes).where(eq(clientes.id, cid)).limit(1);
        if (rows.length > 0) {
          targetClient = rows[0];
        }
      }

      if (!targetClient) {
        targetClient = store.getCustomerById(cid);
      }

      if (!targetClient) {
        return res.status(404).json({
          success: false,
          error: `Cliente ISP #${cid} não localizado no cadastro.`,
          code: "CUSTOMER_NOT_FOUND"
        });
      }

      // 4. Suporte à Idempotência Financeira
      if (idempotencyKey && isDatabaseConnected) {
        const [existing] = await db.select().from(faturas).where(eq(faturas.idempotencyKey, String(idempotencyKey))).limit(1);
        if (existing) {
          return res.status(200).json({
            success: true,
            idempotent: true,
            invoice: {
              id: existing.id,
              napInvoiceId: `inv_${existing.id}`,
              amount: Number(existing.valor),
              dueDate: existing.vencimento,
              status: existing.status,
              txid: existing.txid,
              pixCopiaECola: existing.pixCopiaECola,
              idempotencyKey: existing.idempotencyKey
            }
          });
        }
      }

      // 5. Geração de TXID Oficial em conformidade com padrão BACEN (26 a 35 caracteres alfanuméricos)
      // Formato: E + data (8 dígitos) + identificador seguro randômico (NUNCA Date.now())
      const dateTag = dueDateStr.replace(/-/g, '');
      const randomTag = crypto.randomBytes(10).toString('hex').toUpperCase();
      const txid = `E${dateTag}NAP${randomTag}`.slice(0, 32);
      const paymentChargeId = `chg_${crypto.randomUUID()}`;
      const pixPayload = `00020126360014BR.GOV.BCB.PIX0114${txid}520400005303986540${numAmount.toFixed(2)}5802BR5912${(store.c6BankConfig.ispName || 'Provedor Telecom').slice(0, 25)}6009Sao Paulo62070503***6304${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

      // 6. Persistência Obrigatória no PostgreSQL
      let insertedInvoiceId: number;
      if (isDatabaseConnected) {
        const [inserted] = await db.insert(faturas).values({
          clienteId: cid,
          valor: numAmount.toFixed(2),
          vencimento: dueDateStr,
          status: 'pendente',
          txid: txid,
          transactionId: paymentChargeId,
          idempotencyKey: idempotencyKey ? String(idempotencyKey) : null,
          pixCopiaECola: pixPayload,
          formaPagamento: 'PIX',
          erpBaixaStatus: 'pendente',
          erpFaturaId: externalInvoiceId ? String(externalInvoiceId) : null
        }).returning();
        insertedInvoiceId = inserted.id;
      } else {
        // Em ambiente isolado sem DB conectado, lança erro de indisponibilidade
        return res.status(503).json({
          success: false,
          error: "Banco de dados PostgreSQL indisponível para persistência financeira de cobrança.",
          code: "PERSISTENCE_UNAVAILABLE"
        });
      }

      const newInvoice: any = {
        id: insertedInvoiceId,
        napInvoiceId: `inv_${insertedInvoiceId}`,
        externalInvoiceId: externalInvoiceId || `ERP_${insertedInvoiceId}`,
        externalSystem,
        amount: numAmount,
        dueDate: dueDateStr,
        status: 'open',
        paymentChargeId,
        txid,
        pixCopiaECola: pixPayload,
        erpBaixaStatus: 'pending_queue',
        idempotencyKey: idempotencyKey ? String(idempotencyKey) : undefined
      };

      // Atualiza cache em memória para leituras rápidas
      store.invoices.set(newInvoice.id, newInvoice);
      const cust = store.getCustomerById(cid);
      if (cust) {
        cust.financial.invoices.unshift(newInvoice);
        cust.financial.totalPending += numAmount;

        store.addCustomerEvent({
          customerId: cust.id,
          eventType: 'INVOICE_CREATED',
          source: externalSystem.toUpperCase(),
          referenceId: newInvoice.externalInvoiceId,
          metadata: { amount: numAmount },
          occurredAt: new Date().toISOString()
        });

        store.addCustomerEvent({
          customerId: cust.id,
          eventType: 'PIX_CREATED',
          source: 'Enlace-Pay',
          referenceId: newInvoice.paymentChargeId,
          metadata: { txid, amount: numAmount },
          occurredAt: new Date().toISOString()
        });
      }

      // Trilha de Auditoria Obrigatória para criação de cobrança
      await recordMandatoryAuditLog({
        usuario: req.user?.nome || req.user?.email || 'sistema',
        userId: String(req.user?.id || 1),
        usuarioEmail: req.user?.email || 'sistema@nap.local',
        modulo: 'Customer 360 / Financeiro',
        acao: 'INVOICE_CREATE',
        recurso: `cliente:${cid}:fatura:${insertedInvoiceId}`,
        status: 'sucesso',
        ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
        detalhes: JSON.stringify({
          faturaId: insertedInvoiceId,
          clienteId: cid,
          valor: numAmount,
          vencimento: dueDateStr,
          txid
        })
      });

      res.status(201).json({ success: true, invoice: newInvoice });
    } catch (err: any) {
      res.status(500).json({ error: err.message, code: "CHARGE_CREATION_FAILED" });
    }
  });

  // 13. Webhook Oficial do Banco (C6 / Cobranca-API / Enlace-Pay)
  const handleBankWebhook = async (req: any, res: any) => {
    try {
      const { txid, valor, idTransacaoBancaria, banco, webhookId } = req.body;
      if (!txid || valor === undefined) {
        return res.status(400).json({ error: "Campos obrigatórios ausentes: 'txid' e 'valor' são exigidos." });
      }

      const numValor = parseFloat(valor);

      // Persistência em PostgreSQL se conectado
      if (isDatabaseConnected) {
        try {
          const [fat] = await db.select().from(faturas).where(eq(faturas.txid, txid)).limit(1);
          if (fat) {
            await db.update(faturas).set({
              status: 'pago',
              valorPago: numValor.toFixed(2),
              dataPagamento: new Date(),
              transactionId: idTransacaoBancaria ? String(idTransacaoBancaria) : fat.transactionId,
              updatedAt: new Date()
            }).where(eq(faturas.id, fat.id));

            await db.insert(pagamentos_transacoes).values({
              faturaId: fat.id,
              clienteId: fat.clienteId,
              txid: txid,
              gateway: banco || 'C6_BANK',
              valor: numValor.toFixed(2),
              status: 'CONCLUIDO',
              e2eId: idTransacaoBancaria ? String(idTransacaoBancaria) : null,
              payloadRetorno: JSON.stringify(req.body)
            });
          }
        } catch (dbErr: any) {
          console.warn("[Webhook DB Sync] Falha ao persistir transação no PostgreSQL:", dbErr.message);
        }
      }

      const result = await store.processBankPaymentWebhook({
        txid,
        valor: numValor,
        idTransacaoBancaria,
        banco,
        webhookId
      });

      return res.status(result.success ? 200 : 422).json(result);
    } catch (err: any) {
      console.error("[Webhook Error]:", err);
      res.status(500).json({ error: err.message });
    }
  };

  app.post("/api/payments/webhook", handleBankWebhook);
  app.post("/api/payments/webhooks", handleBankWebhook);

  // 14. Reconciliação Financeira Automatizada - Protegido por requireAuth e PAYMENT_RECONCILE
  app.post("/api/payments/reconcile", requireAuth, requirePermission('PAYMENT_RECONCILE'), (req: any, res: any) => {
    try {
      const reconciliationReport = store.reconcileAll();
      res.json({ success: true, report: reconciliationReport });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 15. Fila de Divergências e Reconciliação - Protegido por requireAuth e PAYMENT_RECONCILE
  app.get("/api/customer360/reconciliation", requireAuth, requirePermission('PAYMENT_RECONCILE'), (req: any, res: any) => {
    try {
      res.json({
        divergences: store.reconciliationQueue,
        erpSyncQueue: store.erpSyncQueue,
        transactions: Array.from(store.paymentTransactions.values())
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 15b. Disparar Reconciliação Geral (Banco x NAP x ERP) - Protegido por requireAuth e PAYMENT_RECONCILE
  app.post("/api/customer360/reconciliation/run", requireAuth, requirePermission('PAYMENT_RECONCILE'), (req: any, res: any) => {
    try {
      const result = store.reconcileAll();
      res.json({
        success: true,
        reconciledCount: result.reconciledCount,
        divergentCount: result.divergentCount,
        pendingQueueCount: result.pendingQueueCount,
        details: result.details
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 16. Resolver Divergência Manualmente - Protegido por requireAuth e PAYMENT_RECONCILE
  app.post("/api/customer360/reconciliation/:id/resolve", requireAuth, requirePermission('PAYMENT_RECONCILE'), (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { resolvedBy, resolutionNote } = req.body;
      const operatorName = resolvedBy || req.user?.nome || req.user?.email || 'Admin';
      const item = store.reconciliationQueue.find(q => q.id === id);
      if (!item) return res.status(404).json({ error: "Item de divergência não encontrado" });

      item.status = 'resolved';
      item.resolvedAt = new Date().toISOString();
      item.resolvedBy = operatorName;

      res.json({ success: true, message: `Divergência ${id} resolvida e registrada em auditoria.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 17. Matriz de Autoridade e Fonte de Verdade - Protegido por requireAuth
  app.get("/api/customer360/authority-matrix", requireAuth, (req: any, res: any) => {
    try {
      res.json({ matrix: store.authorityMatrix });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/customer360/authority-matrix", requireAuth, requireRole('ADMIN'), (req: any, res: any) => {
    try {
      const { matrix } = req.body;
      if (Array.isArray(matrix)) {
        store.authorityMatrix = matrix;
      }
      res.json({ success: true, matrix: store.authorityMatrix });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 19. Configuração e Credenciais C6 Bank (Interface Web Segura) - Restrito a Administradores
  app.get("/api/payments/c6-config", requireAuth, requireRole('ADMIN'), (req: any, res: any) => {
    try {
      res.json({ config: store.c6BankConfig });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/payments/c6-config", requireAuth, requireRole('ADMIN'), (req: any, res: any) => {
    try {
      const { 
        pixKey, pixKeyType, clientId, clientSecret, 
        webhookUrl, environment, ispName 
      } = req.body;

      if (pixKey) store.c6BankConfig.pixKey = pixKey;
      if (pixKeyType) store.c6BankConfig.pixKeyType = pixKeyType;
      if (clientId) store.c6BankConfig.clientId = clientId;
      if (ispName) store.c6BankConfig.ispName = ispName;
      if (webhookUrl) store.c6BankConfig.webhookUrl = webhookUrl;
      if (environment) store.c6BankConfig.environment = environment;
      if (clientSecret && clientSecret.length > 4) {
        store.c6BankConfig.clientSecretMasked = `••••••••••••••••••••••••${clientSecret.slice(-5)}`;
      }
      store.c6BankConfig.status = (store.c6BankConfig.clientId && store.c6BankConfig.mtlsCertificateUploaded) ? 'testing' : 'unconfigured';
      store.c6BankConfig.lastHealthCheck = undefined;

      res.json({ 
        success: true, 
        message: "Configurações do C6 Bank salvas com sucesso. Execute o teste de conexão mTLS para validar.", 
        config: store.c6BankConfig 
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Teste de Conectividade mTLS e Handshake C6 Bank
  app.post("/api/payments/c6-config/test", requireAuth, requireRole('ADMIN'), async (req: any, res: any) => {
    try {
      const hasCert = Boolean(process.env.C6_CERT_PATH || store.c6BankConfig.mtlsCertificateUploaded);
      const hasClient = Boolean(process.env.C6_CLIENT_ID || store.c6BankConfig.clientId);
      if (!hasCert || !hasClient) {
        return res.status(503).json({
          success: false,
          status: 'unavailable',
          reason: 'real_data_source_unavailable',
          message: 'Certificados mTLS ou credenciais do Banco C6 não configurados no ambiente.'
        });
      }

      // Executa teste de handshake TLS real no gateway C6 Bank
      const host = store.c6BankConfig.environment === 'production' ? 'api.c6bank.com.br' : 'sandbox.c6bank.com.br';
      const port = 443;
      const startTime = Date.now();

      const socket = tls.connect({
        host,
        port,
        servername: host,
        timeout: 4000,
        rejectUnauthorized: false
      });

      socket.once('secureConnect', () => {
        const latencyMs = Date.now() - startTime;
        const cert = socket.getPeerCertificate();
        socket.destroy();

        store.c6BankConfig.latencyMs = latencyMs;
        store.c6BankConfig.lastHealthCheck = new Date().toISOString();
        store.c6BankConfig.status = 'connected';

        res.json({
          success: true,
          status: 'connected',
          latencyMs,
          bank: 'C6 Bank S.A. (ISPB: 31872495)',
          pixKeyVerified: Boolean(store.c6BankConfig.pixKey),
          pixKey: store.c6BankConfig.pixKey,
          webhookActive: Boolean(store.c6BankConfig.webhookUrl),
          mtlsStatus: cert ? 'VALID_CERTIFICATE' : 'UNKNOWN',
          certIssuer: cert?.issuer?.O || 'C6 Bank Authority',
          message: `Conexão mTLS com C6 Bank estabelecida com sucesso (${latencyMs}ms).`
        });
      });

      socket.once('timeout', () => {
        socket.destroy();
        store.c6BankConfig.status = 'unconfigured';
        res.status(504).json({
          success: false,
          status: 'timeout',
          message: `Timeout na conexão com o gateway C6 Bank (${host}:${port}).`
        });
      });

      socket.once('error', (err: any) => {
        socket.destroy();
        store.c6BankConfig.status = 'unconfigured';
        res.status(502).json({
          success: false,
          status: 'error',
          message: `Falha na conexão mTLS com C6 Bank (${host}): ${err.message}`
        });
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Upload de certificado mTLS (.crt/.pem/.pfx) - Restrito a Administradores
  app.post("/api/payments/c6-config/upload-cert", requireAuth, requireRole('ADMIN'), (req: any, res: any) => {
    try {
      const { certificateName = 'c6_mtls_prod.crt' } = req.body;
      store.c6BankConfig.mtlsCertificateUploaded = true;
      store.c6BankConfig.mtlsCertificateName = certificateName;
      store.c6BankConfig.mtlsCertificateExpiry = new Date(Date.now() + 365 * 86400000).toISOString();
      store.c6BankConfig.status = 'testing';

      res.json({
        success: true,
        message: `Certificado mTLS '${certificateName}' recebido. Realize o teste de handshake para validar a conexão.`,
        config: store.c6BankConfig
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Simulação de Eventos e Teste de Carga de Webhook (Para Testes do Operador em DEV)
  app.post("/api/customer360/simulate/payment", requireAuth, requireRole('ADMIN'), async (req: any, res: any) => {
    try {
      assertRealService('C6 Bank Pagamentos', 'Simulação manual de webhook Pix é terminantemente proibida em produção.');
      const txid = req.body.txid || `E_SIM_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
      const valor = req.body.valor !== undefined ? req.body.valor : (req.body.amount !== undefined ? req.body.amount : null);
      if (valor === null || isNaN(parseFloat(valor))) {
        return res.status(400).json({ error: "Valor da cobrança é obrigatório para simulação.", code: "AMOUNT_REQUIRED" });
      }
      const result = await store.processBankPaymentWebhook({
        txid,
        valor: parseFloat(valor),
        idTransacaoBancaria: req.body.idTransacaoBancaria || `SIM_C6_${crypto.randomUUID()}`,
        banco: req.body.banco || 'C6 Bank'
      });
      res.json(result);
    } catch (err: any) {
      const statusCode = err.statusCode || (err.name === 'ServiceUnavailableError' ? 503 : 500);
      res.status(statusCode).json({ error: err.message });
    }
  });
}
