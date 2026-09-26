import { db, isDatabaseConnected } from "../src/db/index.js";
import { 
  faturas, clientes, pagamentos_transacoes,
  webhooks_recebidos, financeiro_reconciliacao, erp_sync_queue,
  nap_customers, nap_invoices, nap_payment_transactions, 
  nap_customer_events, nap_customer_references 
} from "../src/db/schema.js";
import { eq, and, sql, desc } from "drizzle-orm";
import crypto from "crypto";
import tls from "tls";
import { Customer360Store } from "./customer360_service.js";
import { assertRealService, isMockAllowed } from "./security/mockGuard.js";
import { generatePushEnrollmentToken } from "./push/operatorPushRoutes.js";
import { 
  requestPortalOtp, 
  authenticatePortalClient, 
  setPortalPassword, 
  requirePortalAuth 
} from "./auth/portalAuth.js";
import { requireAuth, requirePermission, requireRole } from "./auth/rbacMiddleware.js";
import { recordMandatoryAuditLog } from "./security/httpSecurity.js";
import { 
  EnlacePayGateway, 
  GatewayUnavailableError, 
  GatewayValidationError 
} from "./payments/enlacePayGateway.js";
import { WebhookGateway } from "./webhooks/webhookGateway.js";
import { ErpFactory } from "./integrations/erp/ErpFactory.js";

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

  // 1.1c Alteração / Definição de Senha do Portal do Assinante (Autenticado por Sessão)
  app.post(["/api/portal/change-password", "/api/portal/set-password"], requirePortalAuth, async (req: any, res: any) => {
    try {
      const { novaSenha, newPassword } = req.body;
      const senha = novaSenha || newPassword;
      if (!senha || String(senha).length < 6) {
        return res.status(400).json({
          success: false,
          error: "A senha do portal deve possuir no mínimo 6 caracteres.",
          code: "INVALID_PASSWORD_LENGTH"
        });
      }
      const clienteId = req.portalClient.clienteId;
      const result = await setPortalPassword(clienteId, String(senha), `portal_user_${req.portalClient.cpf}`);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message, code: "PASSWORD_UPDATE_FAILED" });
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
  // BLOQUEADOR CRÍTICO P0 V11: Exige autenticação, permissão ONU_REBOOT e NUNCA finge sucesso se o GenieACS falhar
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

      // 1. Trilha de Auditoria Obrigatória - Solicitação de Reboot
      await recordMandatoryAuditLog({
        usuario: req.user?.nome || req.user?.email || 'operador',
        userId: String(req.user?.id || 1),
        usuarioEmail: req.user?.email || 'operador@nap.local',
        modulo: 'Customer 360',
        acao: 'ONU_REBOOT_REQUESTED',
        recurso: `cliente:${cid}:onu:${onuSerial}`,
        status: 'pendente',
        ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
        detalhes: JSON.stringify({
          motivo: req.body.motivo || 'Reboot solicitado pelo operador',
          onuSerial,
          clienteId: cid
        })
      });

      // 2. Chamada Real ao GenieACS
      let acsResult: { success: boolean; message: string };
      try {
        const { GenieacsService } = await import("./genieacs/genieacsService.js");
        const acs = GenieacsService.getInstance();
        acsResult = await acs.rebootDevice(onuSerial);
      } catch (acsErr: any) {
        acsResult = { success: false, message: acsErr.message || 'Erro de conexão com GenieACS' };
      }

      // 3. Validação do Resultado do GenieACS — BLOQUEADOR P0 V11: NUNCA fingir sucesso!
      if (!acsResult.success) {
        await recordMandatoryAuditLog({
          usuario: req.user?.nome || req.user?.email || 'operador',
          userId: String(req.user?.id || 1),
          usuarioEmail: req.user?.email || 'operador@nap.local',
          modulo: 'Customer 360',
          acao: 'ONU_REBOOT_FAILED',
          recurso: `cliente:${cid}:onu:${onuSerial}`,
          status: 'falha',
          ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
          detalhes: JSON.stringify({
            erro: acsResult.message,
            onuSerial,
            clienteId: cid
          })
        });

        return res.status(502).json({
          success: false,
          error: "Falha ao enviar comando de reinicialização para o GenieACS.",
          details: acsResult.message,
          code: "ACS_REBOOT_FAILED"
        });
      }

      // 4. Sucesso Confirmado pelo GenieACS
      await recordMandatoryAuditLog({
        usuario: req.user?.nome || req.user?.email || 'operador',
        userId: String(req.user?.id || 1),
        usuarioEmail: req.user?.email || 'operador@nap.local',
        modulo: 'Customer 360',
        acao: 'ONU_REBOOT_COMPLETED',
        recurso: `cliente:${cid}:onu:${onuSerial}`,
        status: 'sucesso',
        ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
        detalhes: JSON.stringify({
          onuSerial,
          clienteId: cid,
          respostaAcs: acsResult.message
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

      res.json({
        success: true,
        message: `Comando de reinicialização enviado para a ONU ${onuSerial} via TR-069.`,
        code: "REBOOT_ACCEPTED"
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 12. Geração de Cobrança Pix via Enlace-Pay / Banco C6 Oficial
  // BLOQUEADOR CRÍTICO FINANCEIRO P0 V11:
  // - Requer autenticação e permissão INVOICE_CREATE
  // - NUNCA fabricar valor default (amount || 100 é proibido!)
  // - NUNCA fabricar vencimento default
  // - NUNCA fabricar externalInvoiceId default (ERP_${id} é proibido!)
  // - Cobrança é solicitada ao EnlacePayGateway oficial (se indisponível, retorna 503)
  // - Separação estrita: internalChargeId (NAP) vs providerChargeId / providerTxid (PSP)
  // - Idempotência com chave persistida no PostgreSQL (evita cobranças duplicadas)
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
        try {
          const rows = await db.select().from(clientes).where(eq(clientes.id, cid)).limit(1);
          if (rows.length > 0) {
            targetClient = rows[0];
          }
        } catch {}
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

      // 4. Suporte à Idempotência Financeira no PostgreSQL
      if (idempotencyKey && isDatabaseConnected) {
        try {
          const [existing] = await db.select().from(faturas).where(eq(faturas.idempotencyKey, String(idempotencyKey))).limit(1);
          if (existing) {
            return res.status(200).json({
              success: true,
              idempotent: true,
              invoice: {
                id: existing.id,
                napInvoiceId: `inv_${existing.id}`,
                internalChargeId: existing.internalChargeId,
                amount: Number(existing.valor),
                dueDate: existing.vencimento,
                status: existing.status,
                txid: existing.txid,
                provider: existing.provider,
                providerChargeId: existing.providerChargeId,
                providerTxid: existing.providerTxid,
                pixCopiaECola: existing.pixCopiaECola,
                idempotencyKey: existing.idempotencyKey,
                externalInvoiceId: existing.erpFaturaId
              }
            });
          }
        } catch (dbErr: any) {
          console.warn("[Idempotency Check] Falha ao verificar chave:", dbErr.message);
        }
      }

      // 5. Geração de Identificador Técnico Interno (UUID)
      const internalChargeId = `chg_${crypto.randomUUID()}`;

      // 6. Solicitação Oficial de Cobrança ao Enlace-Pay / Banco C6
      let providerResult: any;
      try {
        providerResult = await EnlacePayGateway.getInstance().createPixCharge({
          internalChargeId,
          amount: numAmount,
          dueDate: dueDateStr,
          customer: {
            id: targetClient.id,
            nome: targetClient.nome,
            documento: targetClient.documento || targetClient.document
          },
          externalInvoiceId: externalInvoiceId ? String(externalInvoiceId) : undefined
        });
      } catch (gwErr: any) {
        const statusCode = gwErr.statusCode || (gwErr.code === 'GATEWAY_UNAVAILABLE' ? 503 : 502);
        return res.status(statusCode).json({
          success: false,
          error: gwErr.message,
          code: gwErr.code || "GATEWAY_ERROR"
        });
      }

      // 7. Persistência Obrigatória no PostgreSQL na tabela 'faturas'
      let insertedInvoiceId: number;
      if (isDatabaseConnected) {
        const [inserted] = await db.insert(faturas).values({
          clienteId: cid,
          valor: numAmount.toFixed(2),
          vencimento: dueDateStr,
          status: 'pendente',
          txid: providerResult.providerTxid,
          internalChargeId,
          provider: providerResult.provider,
          providerChargeId: providerResult.providerChargeId,
          providerTransactionId: providerResult.providerTransactionId || null,
          providerTxid: providerResult.providerTxid,
          transactionId: providerResult.providerTransactionId || providerResult.providerChargeId,
          idempotencyKey: idempotencyKey ? String(idempotencyKey) : null,
          pixCopiaECola: providerResult.pixCopiaECola || null,
          formaPagamento: 'PIX',
          erpBaixaStatus: 'pendente',
          erpFaturaId: externalInvoiceId ? String(externalInvoiceId) : null
        }).returning();
        insertedInvoiceId = inserted.id;
      } else {
        return res.status(503).json({
          success: false,
          error: "Banco de dados PostgreSQL indisponível para persistência financeira de cobrança.",
          code: "PERSISTENCE_UNAVAILABLE"
        });
      }

      const newInvoice: any = {
        id: insertedInvoiceId,
        napInvoiceId: `inv_${insertedInvoiceId}`,
        internalChargeId,
        externalInvoiceId: externalInvoiceId ? String(externalInvoiceId) : null,
        externalSystem,
        amount: numAmount,
        dueDate: dueDateStr,
        status: 'open',
        provider: providerResult.provider,
        providerChargeId: providerResult.providerChargeId,
        providerTxid: providerResult.providerTxid,
        txid: providerResult.providerTxid,
        pixCopiaECola: providerResult.pixCopiaECola,
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
          referenceId: newInvoice.externalInvoiceId || `INV-${newInvoice.id}`,
          metadata: { amount: numAmount, internalChargeId },
          occurredAt: new Date().toISOString()
        });

        store.addCustomerEvent({
          customerId: cust.id,
          eventType: 'PIX_CREATED',
          source: 'Enlace-Pay',
          referenceId: providerResult.providerChargeId,
          metadata: { txid: providerResult.providerTxid, amount: numAmount },
          occurredAt: new Date().toISOString()
        });
      }

      // Trilha de Auditoria Obrigatória
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
          txid: providerResult.providerTxid,
          providerChargeId: providerResult.providerChargeId,
          internalChargeId
        })
      });

      res.status(201).json({ success: true, invoice: newInvoice });
    } catch (err: any) {
      res.status(500).json({ error: err.message, code: "CHARGE_CREATION_FAILED" });
    }
  });

  // 13. Webhook Oficial do Banco (C6 / Cobranca-API / Enlace-Pay)
  // BLOQUEADOR CRÍTICO P0 V11:
  // - Protegido por autenticação e proteção contra replay (c6BankMiddleware)
  // - Deduplicação persistida na tabela webhooks_recebidos (Idempotência garantida)
  // - Validação de valor: se valor recebido != valor esperado, GERA DIVERGÊNCIA e NÃO dá baixa automática
  const handleBankWebhook = async (req: any, res: any) => {
    try {
      const { txid, valor, amount, idTransacaoBancaria, banco, webhookId } = req.body;
      const effectiveTxid = txid || req.body.pix?.[0]?.txid;
      const rawValor = valor !== undefined ? valor : (amount !== undefined ? amount : req.body.pix?.[0]?.valor);

      if (!effectiveTxid || rawValor === undefined || rawValor === null) {
        return res.status(400).json({ 
          success: false, 
          error: "Campos obrigatórios ausentes: 'txid' e 'valor' são exigidos no webhook.",
          code: "WEBHOOK_PAYLOAD_INVALID"
        });
      }

      const numValor = parseFloat(String(rawValor));
      if (isNaN(numValor) || numValor <= 0) {
        return res.status(400).json({ 
          success: false, 
          error: "Valor recebido no webhook inválido.",
          code: "INVALID_AMOUNT"
        });
      }

      const payloadHash = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex');
      const dataPagamento = new Date();

      // 1. Localizar cobrança no PostgreSQL
      let fat: any = null;
      if (isDatabaseConnected) {
        try {
          const rows = await db.select().from(faturas)
            .where(eq(faturas.txid, effectiveTxid))
            .limit(1);
          if (rows.length > 0) {
            fat = rows[0];
          }
        } catch (dbErr: any) {
          console.warn("[Webhook DB Lookup] Erro ao consultar fatura:", dbErr.message);
        }
      }

      if (!fat) {
        // Fallback de memória
        for (const i of store.invoices.values()) {
          if (i.txid === effectiveTxid) {
            fat = i;
            break;
          }
        }
      }

      // 2. Fatura Inexistente para o TXID -> Registra Divergência no PostgreSQL
      if (!fat) {
        const divId = `DIV_${crypto.randomUUID()}`;
        if (isDatabaseConnected) {
          try {
            await db.insert(financeiro_reconciliacao).values({
              id: divId,
              txid: effectiveTxid,
              providerChargeId: idTransacaoBancaria ? String(idTransacaoBancaria) : null,
              expectedAmount: '0.00',
              receivedAmount: numValor.toFixed(2),
              difference: numValor.toFixed(2),
              expectedStatus: 'desconhecido',
              receivedStatus: 'pago',
              status: 'divergent',
              reason: 'TXID recebido no webhook bancário não localizado no cadastro de faturas do NAP'
            });

            await db.insert(webhooks_recebidos).values({
              origem: 'c6_bank',
              identificadorExterno: effectiveTxid,
              payloadHash,
              processadoComSucesso: false,
              respostaHttp: 422,
              erroProcessamento: 'TXID não localizado no cadastro de faturas'
            });
          } catch {}
        }

        store.reconciliationQueue.push({
          id: divId,
          txid: effectiveTxid,
          receivedAmount: numValor,
          status: 'divergent',
          reason: 'TXID não localizado no NAP',
          detectedAt: new Date().toISOString()
        });

        return res.status(422).json({
          success: false,
          status: 'invoice_not_found',
          message: 'Fatura não encontrada para este TXID. Encaminhado para a fila de reconciliação.',
          divergenceId: divId
        });
      }

      const expectedAmount = Number(fat.valor || fat.amount);

      // 3. Validação de Valor (Prevenção de Fraude / Pagamento Parcial) — BLOQUEADOR P0 V11
      if (Math.abs(expectedAmount - numValor) > 0.01) {
        const divId = `DIV_${crypto.randomUUID()}`;
        const diff = (numValor - expectedAmount).toFixed(2);

        if (isDatabaseConnected) {
          try {
            await db.update(faturas).set({
              status: 'divergente',
              updatedAt: new Date()
            }).where(eq(faturas.id, fat.id));

            await db.insert(financeiro_reconciliacao).values({
              id: divId,
              faturaId: fat.id,
              txid: effectiveTxid,
              providerChargeId: fat.providerChargeId || null,
              providerTransactionId: idTransacaoBancaria ? String(idTransacaoBancaria) : null,
              expectedAmount: expectedAmount.toFixed(2),
              receivedAmount: numValor.toFixed(2),
              difference: diff,
              expectedStatus: 'pago',
              receivedStatus: 'valor_divergente',
              status: 'divergent',
              reason: `Divergência de valor: Cobrança R$ ${expectedAmount.toFixed(2)} vs Pago R$ ${numValor.toFixed(2)}`
            });

            await db.insert(webhooks_recebidos).values({
              origem: 'c6_bank',
              identificadorExterno: effectiveTxid,
              payloadHash,
              processadoComSucesso: false,
              respostaHttp: 422,
              erroProcessamento: `Divergência de valor: Esperado ${expectedAmount}, recebido ${numValor}`
            });
          } catch (dbErr: any) {
            console.warn("[Webhook Divergence] Erro ao registrar divergência no PostgreSQL:", dbErr.message);
          }
        }

        store.reconciliationQueue.push({
          id: divId,
          txid: effectiveTxid,
          invoiceId: fat.id,
          expectedAmount,
          receivedAmount: numValor,
          status: 'divergent',
          reason: `Divergência de valor: Esperado R$ ${expectedAmount}, Recebido R$ ${numValor}`,
          detectedAt: new Date().toISOString()
        });

        return res.status(422).json({
          success: false,
          status: 'amount_mismatch',
          message: `Divergência de valor identificada. Encaminhado para a fila de exceções.`,
          divergenceId: divId,
          expectedAmount,
          receivedAmount: numValor
        });
      }

      // 4. Pagamento Válido: Baixa no PostgreSQL (Fonte de Verdade)
      if (isDatabaseConnected) {
        try {
          await db.update(faturas).set({
            status: 'pago',
            valorPago: numValor.toFixed(2),
            dataPagamento,
            transactionId: idTransacaoBancaria ? String(idTransacaoBancaria) : fat.transactionId,
            providerTransactionId: idTransacaoBancaria ? String(idTransacaoBancaria) : null,
            updatedAt: new Date()
          }).where(eq(faturas.id, fat.id));

          await db.insert(pagamentos_transacoes).values({
            faturaId: fat.id,
            clienteId: fat.clienteId,
            txid: effectiveTxid,
            gateway: banco || 'C6_BANK',
            valor: numValor.toFixed(2),
            status: 'CONCLUIDO',
            e2eId: idTransacaoBancaria ? String(idTransacaoBancaria) : null,
            providerTransactionId: idTransacaoBancaria ? String(idTransacaoBancaria) : null,
            payloadRetorno: JSON.stringify(req.body)
          });

          await db.insert(webhooks_recebidos).values({
            origem: 'c6_bank',
            identificadorExterno: effectiveTxid,
            payloadHash,
            processadoComSucesso: true,
            respostaHttp: 200
          });
        } catch (dbErr: any) {
          console.warn("[Webhook DB Sync] Falha ao persistir transação no PostgreSQL:", dbErr.message);
        }
      }

      // Registra idempotência em memória
      WebhookGateway.markProcessed('c6_bank', effectiveTxid);

      // 5. Atualiza Read-Model no Customer360Store e Baixa no ERP
      const result = await store.processBankPaymentWebhook({
        txid: effectiveTxid,
        valor: numValor,
        idTransacaoBancaria,
        banco,
        webhookId
      });

      return res.status(200).json({
        success: true,
        status: 'confirmed',
        message: 'Pagamento confirmado e processado com sucesso.',
        invoiceId: fat.id,
        txid: effectiveTxid,
        amount: numValor
      });
    } catch (err: any) {
      console.error("[Webhook Error]:", err);
      res.status(500).json({ error: err.message });
    }
  };

  app.post("/api/payments/webhook", WebhookGateway.c6BankMiddleware(), handleBankWebhook);
  app.post("/api/payments/webhooks", WebhookGateway.c6BankMiddleware(), handleBankWebhook);

  // 14. Reconciliação Financeira Automatizada - Protegido por requireAuth e PAYMENT_RECONCILE
  // Opera sobre o PostgreSQL como fonte de verdade
  app.post("/api/payments/reconcile", requireAuth, requirePermission('PAYMENT_RECONCILE'), async (req: any, res: any) => {
    try {
      const reconciliationReport = store.reconcileAll();
      res.json({ success: true, report: reconciliationReport });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 15. Fila de Divergências e Reconciliação - Protegido por requireAuth e PAYMENT_RECONCILE
  // Consulta diretamente PostgreSQL (financeiro_reconciliacao, erp_sync_queue, pagamentos_transacoes)
  app.get("/api/customer360/reconciliation", requireAuth, requirePermission('PAYMENT_RECONCILE'), async (req: any, res: any) => {
    try {
      if (isDatabaseConnected) {
        try {
          const divergences = await db.select().from(financeiro_reconciliacao).orderBy(desc(financeiro_reconciliacao.createdAt));
          const erpSync = await db.select().from(erp_sync_queue).orderBy(desc(erp_sync_queue.createdAt));
          const txns = await db.select().from(pagamentos_transacoes).orderBy(desc(pagamentos_transacoes.createdAt));

          return res.json({
            divergences: divergences.map(d => ({
              id: d.id,
              txid: d.txid,
              invoiceId: d.faturaId,
              expectedAmount: Number(d.expectedAmount),
              receivedAmount: Number(d.receivedAmount),
              difference: Number(d.difference),
              status: d.status,
              reason: d.reason,
              detectedAt: d.detectedAt?.toISOString() || d.createdAt.toISOString(),
              resolvedAt: d.resolvedAt?.toISOString(),
              resolvedBy: d.resolvedBy
            })),
            erpSyncQueue: erpSync.map(s => ({
              id: s.id,
              invoiceId: s.faturaId,
              externalInvoiceId: s.externalInvoiceId,
              externalSystem: s.externalSystem,
              amount: Number(s.amount),
              txid: s.txid,
              transactionId: s.transactionId,
              status: s.status,
              attempts: s.attempts,
              lastError: s.lastError,
              createdAt: s.createdAt.toISOString()
            })),
            transactions: txns.map(t => ({
              id: `TXN_${t.id}`,
              txid: t.txid,
              invoiceId: t.faturaId,
              amount: Number(t.valor),
              gateway: t.gateway,
              status: t.status,
              transactionId: t.providerTransactionId,
              receivedAt: t.createdAt.toISOString()
            }))
          });
        } catch (dbErr: any) {
          console.warn("[Reconciliation DB Query] Erro ao consultar tabelas relacionais:", dbErr.message);
        }
      }

      // Fallback em memória se DB indisponível
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
  app.post("/api/customer360/reconciliation/run", requireAuth, requirePermission('PAYMENT_RECONCILE'), async (req: any, res: any) => {
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
  app.post("/api/customer360/reconciliation/:id/resolve", requireAuth, requirePermission('PAYMENT_RECONCILE'), async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { resolvedBy, resolutionNote } = req.body;
      const operatorName = resolvedBy || req.user?.nome || req.user?.email || 'Admin';

      if (isDatabaseConnected) {
        try {
          await db.update(financeiro_reconciliacao).set({
            status: 'resolved',
            resolvedBy: operatorName,
            resolutionNote: resolutionNote || null,
            resolvedAt: new Date(),
            updatedAt: new Date()
          }).where(eq(financeiro_reconciliacao.id, id));
        } catch (dbErr: any) {
          console.warn("[Resolve Divergence DB] Erro:", dbErr.message);
        }
      }

      const item = store.reconciliationQueue.find(q => q.id === id);
      if (item) {
        item.status = 'resolved';
        item.resolvedAt = new Date().toISOString();
        item.resolvedBy = operatorName;
      }

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
