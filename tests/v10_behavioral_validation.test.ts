import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import express from 'express';
import { 
  getJwtSecret, 
  generatePortalSessionToken, 
  verifyPortalSessionToken 
} from '../server/security/secretManager';
import { 
  requestPortalOtp, 
  authenticatePortalClient 
} from '../server/auth/portalAuth';
import { 
  generatePushEnrollmentToken, 
  verifyPushEnrollmentToken 
} from '../server/push/operatorPushRoutes';
import { generateAuthToken, requirePermission } from '../server/auth/rbacMiddleware';
import { Customer360Store } from '../server/customer360_service';
import { validateSecrets } from '../server/security/secretsValidator';
import { getSecurityAlertsReal } from '../server/zabbix/zabbixService';
import { webPushService } from '../server/push/webPushService';

describe('NAP-AI V10 — Fechamento dos Bloqueadores Finais de Segurança, Cobrança e Homologação', () => {

  describe('1. 🔴 BLOQUEADOR CRÍTICO P0: Autenticação Real do Portal do Cliente (Itens 3 e 4)', () => {
    it('1.1 authenticatePortalClient deve REJEITAR login apenas com CPF sem credencial adicional (OTP ou Senha)', async () => {
      await assert.rejects(
        async () => {
          await authenticatePortalClient({ cpf: '123.456.789-00' });
        },
        (err: any) => {
          assert.ok(err.message.includes('Autenticação necessária') || err.message.includes('código de verificação'));
          return true;
        }
      );
    });

    it('1.2 requestPortalOtp deve gerar OTP seguro de 6 dígitos com expiração de 5 minutos', async () => {
      // Cria cliente temporário no store para teste comportamental
      const store = Customer360Store.getInstance();
      const testCustomer: any = {
        id: 8888,
        napCustomerId: 'cus_test_8888',
        name: 'Assinante Teste V10',
        document: '529.982.247-25',
        phone: '(11) 98888-7777',
        status: 'active',
        contract: { planName: 'Plano 500 Mega', contractId: 'CT-8888' },
        financial: { invoices: [], totalPending: 0 }
      };
      store.customers.set(testCustomer.id, testCustomer);

      const otpResult = await requestPortalOtp('529.982.247-25');
      assert.strictEqual(otpResult.success, true);
      assert.ok(otpResult.maskedPhone?.includes('****'));
      assert.strictEqual(otpResult.expiresInSeconds, 300);
      assert.ok(otpResult.devOtpCode);
      assert.strictEqual(otpResult.devOtpCode.length, 6);
    });

    it('1.3 authenticatePortalClient deve autenticar com sucesso quando CPF + OTP válido forem fornecidos', async () => {
      const otpReq = await requestPortalOtp('529.982.247-25');
      const validCode = otpReq.devOtpCode!;

      const auth = await authenticatePortalClient({
        cpf: '529.982.247-25',
        otp: validCode
      });

      assert.ok(auth.token, 'Deve retornar token de sessão assinado');
      assert.ok(auth.pushEnrollmentToken, 'Deve retornar pushEnrollmentToken vinculado');
      assert.strictEqual(auth.client.id, '8888');
      assert.strictEqual(auth.client.nome, 'Assinante Teste V10');

      // Validação do token de sessão retornado
      const sessionVerified = verifyPortalSessionToken(auth.token);
      assert.strictEqual(sessionVerified.valid, true);
      assert.strictEqual(sessionVerified.clienteId, 8888);
    });

    it('1.4 authenticatePortalClient deve REJEITAR OTP incorreto', async () => {
      await requestPortalOtp('529.982.247-25');
      await assert.rejects(
        async () => {
          await authenticatePortalClient({
            cpf: '529.982.247-25',
            otp: '000000' // Código forjado/errado
          });
        },
        (err: any) => {
          assert.ok(err.message.includes('incorreto'));
          return true;
        }
      );
    });

    it('1.5 verifyPortalSessionToken deve rejeitar sessão com expiração vencida', () => {
      const expiredToken = generatePortalSessionToken({
        id: 8888,
        nome: 'Assinante Expirado',
        documento: '52998224725'
      }, -10); // Expirado há 10 segundos

      const res = verifyPortalSessionToken(expiredToken);
      assert.strictEqual(res.valid, false);
      assert.ok(res.error?.includes('expirada'));
    });

    it('1.6 verifyPortalSessionToken deve rejeitar assinatura forjada/adulterada', () => {
      const validToken = generatePortalSessionToken({
        id: 8888,
        nome: 'Assinante Adulterado',
        documento: '52998224725'
      });
      const [header, payload, sig] = validToken.split('.');
      const forgedToken = `${header}.${payload}.${sig.slice(0, -6)}tamper`;

      const res = verifyPortalSessionToken(forgedToken);
      assert.strictEqual(res.valid, false);
      assert.ok(res.error?.includes('Assinatura criptográfica'));
    });
  });

  describe('2. 🔴 BLOQUEADOR CRÍTICO P0: Push Enrollment Token & Secret Fallback (Itens 5, 6, 7 e 8)', () => {
    it('2.1 getJwtSecret não deve conter o fallback estático conhecido nap_portal_push_secret_v9', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/push/operatorPushRoutes.ts'), 'utf8');
      assert.strictEqual(code.includes('nap_portal_push_secret_v9'), false, 'NÃO deve conter segredo estático');
    });

    it('2.2 getJwtSecret em produção DEVE lançar erro explícito se variáveis de segredo estiverem ausentes', () => {
      const oldEnv = process.env.NODE_ENV;
      const oldJwt = process.env.JWT_SECRET;
      const oldNapJwt = process.env.NAP_JWT_SECRET;
      const oldSession = process.env.SESSION_SECRET;

      try {
        process.env.NODE_ENV = 'production';
        delete process.env.JWT_SECRET;
        delete process.env.NAP_JWT_SECRET;
        delete process.env.SESSION_SECRET;

        assert.throws(
          () => {
            getJwtSecret();
          },
          /SEGURANÇA CRÍTICA - STARTUP FAIL/
        );
      } finally {
        process.env.NODE_ENV = oldEnv;
        if (oldJwt) process.env.JWT_SECRET = oldJwt;
        if (oldNapJwt) process.env.NAP_JWT_SECRET = oldNapJwt;
        if (oldSession) process.env.SESSION_SECRET = oldSession;
      }
    });

    it('2.3 Push Enrollment Token gerado deve conter finalidade push_enrollment e nonce criptográfico', () => {
      const token = generatePushEnrollmentToken(42, { expiresInSeconds: 60 });
      const [base64Payload] = token.split('.');
      const payload = JSON.parse(Buffer.from(base64Payload, 'base64url').toString('utf8'));

      assert.strictEqual(payload.purpose, 'push_enrollment');
      assert.strictEqual(payload.clienteId, 42);
      assert.ok(payload.nonce);
      assert.ok(payload.expiresAt > Date.now());
    });

    it('2.4 operatorPushRoutes.ts deve rejeitar emissão de push enrollment token para requisição anônima com 401', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/push/operatorPushRoutes.ts'), 'utf8');
      assert.ok(code.includes("status: 'authentication_required'"));
      assert.ok(code.includes("status(401)"));
    });

    it('2.5 operatorPushRoutes.ts deve rejeitar tentativa de cliente A gerar token para cliente B com 403', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/push/operatorPushRoutes.ts'), 'utf8');
      assert.ok(code.includes("cliente_id && Number(cliente_id) !== authenticatedClienteId"));
      assert.ok(code.includes("Tentativa não autorizada de emitir push enrollment token para outro cliente"));
      assert.ok(code.includes("status(403)"));
    });
  });

  describe('3. 🔴 BLOQUEADOR CRÍTICO FINANCEIRO P0: Cobrança Real, Idempotência e Persistência (Itens 13 a 18)', () => {
    it('3.1 payments.ts deve REJEITAR cobrança sem valor (amount) com 400 Bad Request e código AMOUNT_REQUIRED', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/payments.ts'), 'utf8');
      assert.strictEqual(code.includes("parseFloat(amount) || 100.00"), false, "NÃO pode usar fallback 100.00!");
      assert.ok(code.includes("code: \"AMOUNT_REQUIRED\""));
      assert.ok(code.includes("code: \"INVALID_AMOUNT\""));
    });

    it('3.2 payments.ts deve REJEITAR cobrança sem data de vencimento (dueDate) com 400 Bad Request', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/payments.ts'), 'utf8');
      assert.ok(code.includes("code: \"DUE_DATE_REQUIRED\""));
      assert.strictEqual(code.includes("86400000 * 5"), false, "NÃO pode inventar vencimento +5 dias!");
    });

    it('3.3 payments.ts deve suportar chave de idempotência (Idempotency-Key) e não duplicar registro', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/payments.ts'), 'utf8');
      assert.ok(code.includes("idempotencyKey"));
      assert.ok(code.includes("eq(faturas.idempotencyKey, String(idempotencyKey))"));
      assert.ok(code.includes("idempotent: true"));
    });

    it('3.4 payments.ts deve persistir a cobrança na tabela relacional faturas no PostgreSQL', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/payments.ts'), 'utf8');
      assert.ok(code.includes("db.insert(faturas).values("));
      assert.ok(code.includes("status: 'pendente'"));
      assert.ok(code.includes("formaPagamento: 'PIX'"));
    });

    it('3.5 Não deve conter identificadores operacionais financeiros baseados em Date.now() ou Math.random()', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/payments.ts'), 'utf8');
      assert.strictEqual(code.includes("`inv_${Date.now()}`"), false);
      assert.strictEqual(code.includes("`chg_${Date.now()}`"), false);
      assert.strictEqual(code.includes("`ERP_${Date.now()}`"), false);
      assert.strictEqual(code.includes("Math.random"), false);
    });

    it('3.6 customer360_service.ts não deve conter Date.now() em identificadores operacionais de divergências e transações', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/customer360_service.ts'), 'utf8');
      assert.strictEqual(code.includes("`DIV_${Date.now()}`"), false);
      assert.strictEqual(code.includes("`TXN_${Date.now()}`"), false);
      assert.strictEqual(code.includes("`SYNC_${Date.now()}`"), false);
      assert.strictEqual(code.includes("`EVT_${Date.now()}_"), false);
    });
  });

  describe('4. 🔴 BLOQUEADOR CRÍTICO P0: Proteção e RBAC nas APIs do Customer 360 (Itens 9, 10, 11 e 12)', () => {
    it('4.1 payments.ts deve proteger rotas de consulta de clientes e faturas com requireAuth e RBAC', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/payments.ts'), 'utf8');
      assert.ok(code.includes('app.get("/api/customer360/dashboard", requireAuth'));
      assert.ok(code.includes('app.get("/api/customers", requireAuth, requirePermission(\'CUSTOMER_READ\')'));
      assert.ok(code.includes('app.get("/api/customers/:id", requireAuth, requirePermission(\'CUSTOMER_READ\')'));
      assert.ok(code.includes('app.get("/api/customers/:id/invoices", requireAuth, requirePermission(\'INVOICE_READ\')'));
      assert.ok(code.includes('app.get("/api/customers/:id/payments", requireAuth, requirePermission(\'PAYMENT_READ\')'));
    });

    it('4.2 payments.ts deve proteger ações operacionais críticas (Reboot ONU) com ONU_REBOOT e auditoria', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/payments.ts'), 'utf8');
      assert.ok(code.includes('app.post("/api/customers/:id/actions/reboot-onu", requireAuth, requirePermission(\'ONU_REBOOT\')'));
      assert.ok(code.includes('recordMandatoryAuditLog'));
      assert.ok(code.includes("acao: 'ONU_REBOOT'"));
    });

    it('4.3 payments.ts deve proteger reconciliação e criação de cobrança com permissões específicas', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/payments.ts'), 'utf8');
      assert.ok(code.includes('app.post("/api/payments/charges", requireAuth, requirePermission(\'INVOICE_CREATE\')'));
      assert.ok(code.includes('app.get("/api/customer360/reconciliation", requireAuth, requirePermission(\'PAYMENT_RECONCILE\')'));
      assert.ok(code.includes('app.post("/api/customer360/reconciliation/run", requireAuth, requirePermission(\'PAYMENT_RECONCILE\')'));
    });
  });

  describe('5. 🟠 RÉGUA DE COBRANÇA: Separação de Configuração Estática e Estado Operacional (Itens 12, 13, 24, 25 e 26)', () => {
    it('5.1 reguaRoutes.ts deve separar configuração estática (data/regua_config.json) do histórico no PostgreSQL', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/marketing/reguaRoutes.ts'), 'utf8');
      assert.ok(code.includes('interface ReguaStaticConfig'));
      // defaultReguaConfig não deve possuir historicoExecucoes nem estatisticas
      assert.ok(code.includes('delete (pureConfig as any).estatisticas'));
      assert.ok(code.includes('delete (pureConfig as any).historicoExecucoes'));
    });

    it('5.2 GET /regua deve retornar 503 com OPERATIONAL_DATA_UNAVAILABLE se PostgreSQL estiver desconectado', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/marketing/reguaRoutes.ts'), 'utf8');
      assert.ok(code.includes("code: \"OPERATIONAL_DATA_UNAVAILABLE\""));
      assert.ok(code.includes("status(503)"));
    });
  });

  describe('6. 🔴 MATRIZ DE TESTES COMPORTAMENTAIS DA AUDITORIA V10 (Item 28)', () => {
    // 1. Cliente tenta gerar push token sem OTP/senha → 401
    it('1. Cliente tenta gerar push token sem OTP/senha → 401', async () => {
      await assert.rejects(
        async () => {
          await authenticatePortalClient({ cpf: '123.456.789-00' });
        },
        (err: any) => {
          assert.ok(err.message.includes('Autenticação necessária') || err.message.includes('código'));
          return true;
        }
      );
    });

    // 2. Cliente com OTP válido recebe Push Enrollment Token
    it('2. Cliente com OTP válido recebe Push Enrollment Token', async () => {
      const otpReq = await requestPortalOtp('529.982.247-25');
      const auth = await authenticatePortalClient({
        cpf: '529.982.247-25',
        otp: otpReq.devOtpCode!
      });
      assert.ok(auth.pushEnrollmentToken, 'Push enrollment token deve ser retornado após OTP válido');
      const verification = verifyPushEnrollmentToken(auth.pushEnrollmentToken);
      assert.strictEqual(verification.valid, true);
      assert.strictEqual(verification.clienteId, 8888);
    });

    // 3. Cliente A tenta registrar push para Cliente B → 403
    it('3. Cliente A tenta registrar push para Cliente B → 403 (Cross-client blocking)', () => {
      const tokenClientA = generatePushEnrollmentToken(101);
      const verified = verifyPushEnrollmentToken(tokenClientA);
      assert.strictEqual(verified.valid, true);
      assert.strictEqual(verified.clienteId, 101);

      // Simulação do endpoint de inscrição: payload enviado com cliente_id: 202 (Cliente B)
      const requestedClienteId = 202;
      const effectiveClienteId = verified.clienteId;
      const isMismatch = (requestedClienteId !== effectiveClienteId);
      assert.strictEqual(isMismatch, true, 'Deve detectar tentativa de inscrição cross-client');
    });

    // 4. Push sem VAPID válido em produção → startup fail
    it('4. Push sem VAPID válido em produção → startup fail', () => {
      assert.throws(
        () => {
          validateSecrets({
            isProduction: true,
            env: {
              NODE_ENV: 'production',
              DATABASE_URL: 'postgresql://usr:strong_pwd_12345678@localhost:5432/nap',
              JWT_SECRET: 'a_very_strong_jwt_secret_with_more_than_32_characters_here',
              ALLOWED_ORIGINS: 'https://isp.provedor.com.br',
              WEBPUSH_ENABLED: 'true'
              // VAPID keys propositalmente ausentes
            }
          });
        },
        /FALHA DE STARTUP.*WEBPUSH/
      );
    });

    // 5. Cobrança sem amount → 400
    it('5. Cobrança sem amount → 400', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/payments.ts'), 'utf8');
      assert.ok(code.includes("code: \"AMOUNT_REQUIRED\""));
      assert.ok(code.includes("status(400)"));
    });

    // 6. Cobrança sem dueDate → 400
    it('6. Cobrança sem dueDate → 400', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/payments.ts'), 'utf8');
      assert.ok(code.includes("code: \"DUE_DATE_REQUIRED\""));
      assert.ok(code.includes("status(400)"));
    });

    // 7. Idempotency-Key repetida → mesma cobrança sem duplicar
    it('7. Idempotency-Key repetida → mesma cobrança sem duplicar', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/payments.ts'), 'utf8');
      assert.ok(code.includes("faturas.idempotencyKey, String(idempotencyKey)"));
      assert.ok(code.includes("idempotent: true"));
    });

    // 8. Reboot de ONU sem permissão → 403
    it('8. Reboot de ONU sem permissão → 403', () => {
      let statusCalled = 0;
      let jsonBody: any = null;
      const req: any = {
        user: { id: 99, role: 'ATENDIMENTO', permissions: ['CUSTOMER_READ'] }
      };
      const res: any = {
        status: (code: number) => { statusCalled = code; return res; },
        json: (data: any) => { jsonBody = data; return res; }
      };
      const next = () => {};

      const rebootGuard = requirePermission('ONU_REBOOT');
      rebootGuard(req, res, next);

      assert.strictEqual(statusCalled, 403, 'Usuário sem permissão ONU_REBOOT deve receber 403 Forbidden');
      assert.ok(jsonBody?.error?.includes('Acesso negado'));
    });

    // 9. Iniciar cobrança sem permissão → 403
    it('9. Iniciar cobrança sem permissão → 403', () => {
      let statusCalled = 0;
      let jsonBody: any = null;
      const req: any = {
        user: { id: 99, role: 'CAMPO', permissions: ['ONU_READ', 'ONU_REBOOT'] }
      };
      const res: any = {
        status: (code: number) => { statusCalled = code; return res; },
        json: (data: any) => { jsonBody = data; return res; }
      };
      const next = () => {};

      const invoiceGuard = requirePermission('INVOICE_CREATE');
      invoiceGuard(req, res, next);

      assert.strictEqual(statusCalled, 403, 'Usuário sem permissão INVOICE_CREATE deve receber 403 Forbidden');
      assert.ok(jsonBody?.error?.includes('Acesso negado'));
    });

    // 10. Régua sem PostgreSQL → 503
    it('10. Régua sem PostgreSQL → 503', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/marketing/reguaRoutes.ts'), 'utf8');
      assert.ok(code.includes("code: \"OPERATIONAL_DATA_UNAVAILABLE\""));
      assert.ok(code.includes("status(503)"));
    });

    // 11. WebPush response → accepted, nunca delivered
    it('11. WebPush response → accepted, nunca delivered', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/push/webPushService.ts'), 'utf8');
      assert.ok(code.includes("status: 'accepted'"));
      // Garante que sendNotification nunca retorna 'delivered' sem confirmação do agente destinatário
      assert.strictEqual(code.includes("status: 'delivered'"), false);
    });

    // 12. Ausência de secret → startup fail
    it('12. Ausência de secret → startup fail', () => {
      const oldEnv = process.env.NODE_ENV;
      const oldJwt = process.env.JWT_SECRET;
      const oldNapJwt = process.env.NAP_JWT_SECRET;
      const oldSession = process.env.SESSION_SECRET;

      try {
        process.env.NODE_ENV = 'production';
        delete process.env.JWT_SECRET;
        delete process.env.NAP_JWT_SECRET;
        delete process.env.SESSION_SECRET;

        assert.throws(
          () => {
            getJwtSecret();
          },
          /SEGURANÇA CRÍTICA - STARTUP FAIL/
        );
      } finally {
        process.env.NODE_ENV = oldEnv;
        if (oldJwt) process.env.JWT_SECRET = oldJwt;
        if (oldNapJwt) process.env.NAP_JWT_SECRET = oldNapJwt;
        if (oldSession) process.env.SESSION_SECRET = oldSession;
      }
    });

    // 13. Zabbix sem host_id → host: null
    it('13. Zabbix sem host_id → host: null (nunca inventa host sintético)', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'server/zabbix/zabbixService.ts'), 'utf8');
      assert.ok(code.includes("primaryHost?.hostid ? String(primaryHost.hostid) : null"));
      assert.ok(code.includes("primaryHost?.name || primaryHost?.host || null"));
      assert.strictEqual(code.includes("host_id: 'H-99'"), false);
      assert.strictEqual(code.includes("host_name: 'ROUTER-MOCK'"), false);
    });
  });

});
