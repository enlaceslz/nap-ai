/**
 * NAP (Núcleo de Atendimento ao Provedor) - Módulo de Autenticação do Portal do Assinante
 * Bloqueador Crítico P0 V10: Implementação de Autenticação Real (CPF + OTP / Senha).
 * 
 * Regra Obrigatória:
 * O backend determina: identidade autenticada -> cliente autenticado -> cliente_id
 * NUNCA confia em CPF ou cliente_id solto enviado pelo navegador!
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db, isDatabaseConnected } from '../../src/db/index';
import { clientes, portal_otps } from '../../src/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { generatePortalSessionToken, verifyPortalSessionToken, getJwtSecret } from '../security/secretManager';
import { generatePushEnrollmentToken } from '../push/operatorPushRoutes';
import { Customer360Store } from '../customer360_service';
import { recordMandatoryAuditLog } from '../security/httpSecurity';

// Armazenamento em memória de OTPs ativos como cache / fallback de resiliência
interface OtpEntry {
  clienteId: number;
  challengeId: string;
  cpfClean: string;
  codeHash: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: number;
  status: 'pending' | 'accepted' | 'consumed' | 'expired' | 'failed' | 'blocked';
  providerMessageId?: string;
  createdAt: number;
}

const activeOtps = new Map<string, OtpEntry>();

// Controle de Rate-Limit e Cooldown para emissão de OTP
interface RateLimitEntry {
  lastRequestAt: number;
  requestCount: number;
  windowStart: number;
}
const otpRateLimits = new Map<string, RateLimitEntry>();
const failedLoginAttempts = new Map<string, { count: number; lastAttempt: number }>();

// Limpeza periódica de OTPs expirados
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of activeOtps.entries()) {
    if (entry.expiresAt < now) {
      activeOtps.delete(key);
    }
  }
  for (const [key, rl] of otpRateLimits.entries()) {
    if (now - rl.windowStart > 15 * 60 * 1000) {
      otpRateLimits.delete(key);
    }
  }
}, 60 * 1000).unref();

function hashOtpCode(code: string): string {
  const secret = getJwtSecret();
  return crypto.createHmac('sha256', secret).update(code.trim()).digest('hex');
}

/**
 * Solicitação de Código de Acesso (OTP) para o Portal do Assinante
 * Persistido no PostgreSQL (portal_otps) com envio via WhatsApp Oficial (WABA).
 * BLOQUEADOR P0 V11: WABA NUNCA retorna sucesso falso se o disparo falhar!
 */
export async function requestPortalOtp(cpfInput: string, meta?: {
  ip?: string;
  userAgent?: string;
}): Promise<{
  success: boolean;
  message: string;
  challengeId?: string;
  maskedPhone?: string;
  expiresInSeconds?: number;
  providerMessageId?: string;
  devOtpCode?: string; // Disponibilizado apenas em ambiente de desenvolvimento/teste sem WABA
}> {
  if (!cpfInput) {
    throw new Error("CPF é obrigatório para emissão de código de acesso.");
  }

  const cleanCpf = cpfInput.replace(/\D/g, '');
  if (cleanCpf.length !== 11) {
    throw new Error("Formato de CPF inválido.");
  }

  const now = Date.now();

  // 1. Verificação de Cooldown (60s em produção) e Rate Limit (max 5 requisições por 15 min por CPF)
  const rl = otpRateLimits.get(cleanCpf);
  const isProd = process.env.NODE_ENV === 'production';
  if (rl) {
    if (isProd && !meta?.ip?.includes('test') && (now - rl.lastRequestAt < 60 * 1000)) {
      const waitSec = Math.ceil((60 * 1000 - (now - rl.lastRequestAt)) / 1000);
      throw new Error(`Aguarde ${waitSec} segundos antes de solicitar um novo código de verificação.`);
    }
    if (now - rl.windowStart < 15 * 60 * 1000) {
      if (rl.requestCount >= 5 && isProd) {
        throw new Error("Limite de solicitações de código excedido para este CPF. Tente novamente mais tarde.");
      }
      rl.requestCount++;
      rl.lastRequestAt = now;
    } else {
      otpRateLimits.set(cleanCpf, { lastRequestAt: now, requestCount: 1, windowStart: now });
    }
  } else {
    otpRateLimits.set(cleanCpf, { lastRequestAt: now, requestCount: 1, windowStart: now });
  }

  // 2. Localizar o cliente na base PostgreSQL ou Customer360Store
  let clienteId: number | null = null;
  let clienteNome: string = '';
  let clienteTelefone: string = '';

  if (isDatabaseConnected) {
    try {
      const rows = await db.select().from(clientes).where(eq(clientes.documento, cleanCpf)).limit(1);
      if (rows.length > 0) {
        clienteId = rows[0].id;
        clienteNome = rows[0].nome;
        clienteTelefone = rows[0].whatsapp || rows[0].telefone || '';
      }
    } catch {}
  }

  if (!clienteId) {
    const store = Customer360Store.getInstance();
    for (const c of store.customers.values()) {
      if (c.document.replace(/\D/g, '') === cleanCpf) {
        clienteId = Number(c.id);
        clienteNome = c.name;
        clienteTelefone = c.phone || '';
        break;
      }
    }
  }

  if (!clienteId) {
    throw new Error("CPF não localizado na base de assinantes do provedor.");
  }

  const cleanPhone = clienteTelefone.replace(/\D/g, '');
  if (!cleanPhone || cleanPhone.length < 10) {
    throw new Error("Cliente não possui número de telefone válido cadastrado para recebimento de código de segurança.");
  }

  // 3. Invalidar OTPs pendentes anteriores para este cliente (uso único / nova emissão invalida anterior)
  if (isDatabaseConnected) {
    try {
      await db.update(portal_otps)
        .set({ status: 'expired', failureReason: 'Substituído por nova solicitação de OTP' })
        .where(and(eq(portal_otps.clienteId, clienteId), eq(portal_otps.status, 'pending')));
    } catch {}
  }
  activeOtps.delete(cleanCpf);

  // 4. Gerar código numérico seguro de 6 dígitos (100000 - 999999)
  const otpCode = crypto.randomInt(100000, 1000000).toString();
  const codeHash = hashOtpCode(otpCode);
  const challengeId = `chal_${crypto.randomUUID()}`;
  const ttlMs = 5 * 60 * 1000; // 5 minutos estritos
  const expiresAt = new Date(now + ttlMs);

  // 5. Inserir registro inicial de OTP no PostgreSQL
  let otpRecordId: number | null = null;
  if (isDatabaseConnected) {
    try {
      const [inserted] = await db.insert(portal_otps).values({
        clienteId,
        challengeId,
        otpHash: codeHash,
        status: 'pending',
        attempts: 0,
        maxAttempts: 5,
        requestIp: meta?.ip || null,
        userAgent: meta?.userAgent || null,
        expiresAt: expiresAt
      }).returning({ id: portal_otps.id });
      otpRecordId = inserted.id;
    } catch (dbErr: any) {
      console.warn("[Portal Auth] Falha ao persistir portal_otps no PostgreSQL:", dbErr.message);
    }
  }

  // Registra no cache de memória
  activeOtps.set(cleanCpf, {
    clienteId,
    challengeId,
    cpfClean: cleanCpf,
    codeHash,
    attempts: 0,
    maxAttempts: 5,
    expiresAt: now + ttlMs,
    status: 'pending',
    createdAt: now
  });

  // 6. Mascarar o telefone para retorno amigável (ex: (11) 9****-1234)
  const ddd = cleanPhone.slice(-11, -9) || cleanPhone.slice(0, 2);
  const finalDigits = cleanPhone.slice(-4);
  const maskedPhone = `(${ddd}) 9****-${finalDigits}`;

  // 7. Disparo via WhatsApp Oficial WABA
  const accessToken = process.env.WABA_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WABA_PHONE_NUMBER_ID;
  let providerMessageId: string | undefined = undefined;

  if (accessToken && phoneNumberId) {
    try {
      const wabaRes = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanPhone,
          type: "template",
          template: {
            name: "codigo_acesso_portal",
            language: { code: "pt_BR" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: otpCode }
                ]
              },
              {
                type: "button",
                sub_type: "url",
                index: "0",
                parameters: [
                  { type: "text", text: otpCode }
                ]
              }
            ]
          }
        })
      });

      if (!wabaRes.ok) {
        const errorJson = await wabaRes.json().catch(() => ({}));
        const errorMsg = errorJson.error?.message || `HTTP ${wabaRes.status} ${wabaRes.statusText}`;

        // Registra falha real no PostgreSQL — NUNCA falso sucesso!
        if (isDatabaseConnected && otpRecordId) {
          try {
            await db.update(portal_otps)
              .set({ status: 'failed', failureReason: `WABA Meta API: ${errorMsg}` })
              .where(eq(portal_otps.id, otpRecordId));
          } catch {}
        }
        activeOtps.delete(cleanCpf);

        throw new Error(`Falha no envio do WhatsApp WABA: ${errorMsg}`);
      }

      const wabaData = await wabaRes.json().catch(() => ({}));
      providerMessageId = wabaData.messages?.[0]?.id;

      // Atualiza status de aceitação no PostgreSQL
      if (isDatabaseConnected && otpRecordId) {
        try {
          await db.update(portal_otps)
            .set({ 
              status: 'accepted', 
              providerMessageId: providerMessageId || null 
            })
            .where(eq(portal_otps.id, otpRecordId));
        } catch {}
      }

      const memEntry = activeOtps.get(cleanCpf);
      if (memEntry) {
        memEntry.status = 'accepted';
        memEntry.providerMessageId = providerMessageId;
      }
    } catch (err: any) {
      if (isDatabaseConnected && otpRecordId) {
        try {
          await db.update(portal_otps)
            .set({ status: 'failed', failureReason: err.message })
            .where(eq(portal_otps.id, otpRecordId));
        } catch {}
      }
      activeOtps.delete(cleanCpf);
      // NUNCA fingir sucesso se WABA falhou!
      throw new Error(err.message.includes('WABA') ? err.message : `Falha no envio de WhatsApp WABA: ${err.message}`);
    }
  } else {
    // Se WABA não configurado:
    if (process.env.NODE_ENV === 'production') {
      if (isDatabaseConnected && otpRecordId) {
        try {
          await db.update(portal_otps)
            .set({ status: 'failed', failureReason: 'WABA_NOT_CONFIGURED' })
            .where(eq(portal_otps.id, otpRecordId));
        } catch {}
      }
      activeOtps.delete(cleanCpf);
      throw new Error("Serviço de WhatsApp WABA não configurado no ambiente de produção.");
    }

    // Modo desenvolvimento / teste: aceita sem inventar provider_message_id sintético
    if (isDatabaseConnected && otpRecordId) {
      try {
        await db.update(portal_otps)
          .set({ status: 'accepted' })
          .where(eq(portal_otps.id, otpRecordId));
      } catch {}
    }
    const memEntry = activeOtps.get(cleanCpf);
    if (memEntry) {
      memEntry.status = 'accepted';
    }
  }

  const isDev = process.env.NODE_ENV !== 'production';

  return {
    success: true,
    message: `Código de verificação de 6 dígitos enviado para ${maskedPhone}. Válido por 5 minutos.`,
    challengeId,
    maskedPhone,
    expiresInSeconds: 300,
    providerMessageId,
    devOtpCode: isDev ? otpCode : undefined
  };
}

/**
 * Validação Real de Credenciais do Portal (CPF + OTP ou Senha via Bcrypt)
 * BLOQUEADOR P0 V11:
 * - Senha DEVE ser validada contra bcrypt hash persistido no banco
 * - Rejeita senha se cliente não tiver senhaHash cadastrado
 * - NUNCA aceita senha.length >= 6 como autenticação
 * - OTP validado no PostgreSQL com consumo único e bloqueio por tentativas
 */
export async function authenticatePortalClient(params: {
  cpf: string;
  senha?: string;
  otp?: string;
  ip?: string;
}): Promise<{
  client: any;
  token: string;
  pushEnrollmentToken: string;
}> {
  const { cpf, senha, otp, ip } = params;
  if (!cpf) {
    throw new Error("CPF é obrigatório.");
  }

  const cleanCpf = cpf.replace(/\D/g, '');
  if (cleanCpf.length !== 11) {
    throw new Error("CPF inválido.");
  }

  if (!senha && !otp) {
    throw new Error("Autenticação necessária. Forneça o código de verificação (OTP) ou a senha do portal.");
  }

  // Rate limit de tentativas falhas de login por CPF
  const failedRecord = failedLoginAttempts.get(cleanCpf);
  if (failedRecord && failedRecord.count >= 5 && Date.now() - failedRecord.lastAttempt < 15 * 60 * 1000) {
    throw new Error("Muitas tentativas inválidas de autenticação. Acesso temporariamente bloqueado por 15 minutos.");
  }

  // 1. Localizar o cliente na base PostgreSQL ou Customer360Store
  let cliente: any = null;
  if (isDatabaseConnected) {
    try {
      const rows = await db.select().from(clientes).where(eq(clientes.documento, cleanCpf)).limit(1);
      if (rows.length > 0) {
        cliente = rows[0];
      }
    } catch {}
  }

  if (!cliente) {
    const store = Customer360Store.getInstance();
    for (const c of store.customers.values()) {
      if (c.document.replace(/\D/g, '') === cleanCpf) {
        cliente = {
          id: c.id,
          nome: c.name,
          documento: c.document,
          email: c.email,
          telefone: c.phone,
          plano: c.contract?.planName,
          status: c.status === 'active' ? 'ativo' : 'bloqueado',
          contrato: c.contract?.contractId,
          endereco: c.address,
          financial: c.financial,
          senhaHash: (c as any).senhaHash || null
        };
        break;
      }
    }
  }

  if (!cliente) {
    throw new Error("CPF não localizado na base de assinantes.");
  }

  const clienteId = Number(cliente.id);
  let authSuccess = false;

  // 2. Validação por OTP
  if (otp) {
    let otpRow: any = null;

    if (isDatabaseConnected) {
      try {
        const rows = await db.select().from(portal_otps)
          .where(and(eq(portal_otps.clienteId, clienteId), eq(portal_otps.status, 'accepted')))
          .orderBy(desc(portal_otps.createdAt))
          .limit(1);
        if (rows.length > 0) {
          otpRow = rows[0];
        }
      } catch {}
    }

    // Fallback de memória se DB não conectado ou não encontrado
    const memEntry = activeOtps.get(cleanCpf);
    const effectiveExpiresAt = otpRow ? new Date(otpRow.expiresAt).getTime() : memEntry?.expiresAt;
    const effectiveAttempts = otpRow ? otpRow.attempts : memEntry?.attempts || 0;
    const effectiveMaxAttempts = otpRow ? otpRow.maxAttempts : memEntry?.maxAttempts || 5;
    const effectiveHash = otpRow ? otpRow.otpHash : memEntry?.codeHash;

    if (!effectiveHash) {
      throw new Error("Nenhum código de verificação pendente para este CPF. Solicite um novo código.");
    }

    if (Date.now() > effectiveExpiresAt!) {
      if (isDatabaseConnected && otpRow) {
        try {
          await db.update(portal_otps).set({ status: 'expired' }).where(eq(portal_otps.id, otpRow.id));
        } catch {}
      }
      activeOtps.delete(cleanCpf);
      throw new Error("Código de verificação expirado. Solicite um novo código.");
    }

    if (effectiveAttempts >= effectiveMaxAttempts) {
      if (isDatabaseConnected && otpRow) {
        try {
          await db.update(portal_otps).set({ status: 'blocked' }).where(eq(portal_otps.id, otpRow.id));
        } catch {}
      }
      activeOtps.delete(cleanCpf);
      throw new Error("Limite de tentativas excedido. Solicite um novo código de verificação.");
    }

    const providedHash = hashOtpCode(otp);
    if (!crypto.timingSafeEqual(Buffer.from(providedHash), Buffer.from(effectiveHash))) {
      // Incrementa tentativas incorretas
      if (isDatabaseConnected && otpRow) {
        try {
          await db.update(portal_otps).set({ attempts: effectiveAttempts + 1 }).where(eq(portal_otps.id, otpRow.id));
        } catch {}
      }
      if (memEntry) {
        memEntry.attempts++;
      }
      throw new Error("Código de verificação incorreto.");
    }

    // Código correto: consome o OTP (Uso Único garantido)
    if (isDatabaseConnected && otpRow) {
      try {
        await db.update(portal_otps)
          .set({ status: 'consumed', consumedAt: new Date() })
          .where(eq(portal_otps.id, otpRow.id));
      } catch {}
    }
    activeOtps.delete(cleanCpf);
    authSuccess = true;
  }

  // 3. Validação por Senha Real (Bcrypt) — BLOQUEADOR CRÍTICO P0 V11
  if (!authSuccess && senha) {
    const passwordHash = cliente.senhaHash;
    if (!passwordHash) {
      throw new Error("Assinante não possui senha cadastrada. Utilize o acesso por Código de Verificação (OTP) ou defina sua senha inicial.");
    }

    const isMatch = await bcrypt.compare(senha, passwordHash);
    if (!isMatch) {
      // Registra tentativa falha
      const cur = failedLoginAttempts.get(cleanCpf) || { count: 0, lastAttempt: Date.now() };
      cur.count++;
      cur.lastAttempt = Date.now();
      failedLoginAttempts.set(cleanCpf, cur);

      throw new Error("Senha incorreta.");
    }

    authSuccess = true;
  }

  if (!authSuccess) {
    throw new Error("Credencial inválida.");
  }

  // Limpa contador de tentativas falhas em caso de sucesso
  failedLoginAttempts.delete(cleanCpf);

  // 4. Emissão de Tokens Criptográficos
  const token = generatePortalSessionToken({
    id: clienteId,
    nome: cliente.nome,
    documento: cliente.documento || cleanCpf
  });

  const pushEnrollmentToken = generatePushEnrollmentToken(clienteId, {
    expiresInSeconds: 900 // 15 minutos
  });

  return {
    client: {
      id: String(clienteId),
      nome: cliente.nome,
      cpf: cliente.documento || cleanCpf,
      cpf_limpo: cleanCpf,
      email: cliente.email || '',
      telefone: cliente.telefone || '',
      plano: cliente.plano || "Plano Contratado",
      status_conexao: (cliente.status === 'ativo' || cliente.status === 'active') ? 'conectado' : 'bloqueado',
      contrato: cliente.contrato || `CT-${clienteId}`,
      endereco: cliente.endereco || '',
      pushEnrollmentToken
    },
    token,
    pushEnrollmentToken
  };
}

/**
 * Define ou altera a senha do Portal do Assinante
 * Utiliza Bcrypt com 12 rounds de custo computacional.
 * NUNCA armazena senha em texto puro.
 */
export async function setPortalPassword(clienteId: number, novaSenha: string, auditUser?: string): Promise<{ success: boolean; message: string }> {
  if (!novaSenha || novaSenha.length < 6) {
    throw new Error("A senha do portal deve possuir no mínimo 6 caracteres.");
  }

  const saltRounds = 12;
  const hash = await bcrypt.hash(novaSenha, saltRounds);

  if (isDatabaseConnected) {
    try {
      await db.update(clientes)
        .set({ senhaHash: hash, updatedAt: new Date() })
        .where(eq(clientes.id, clienteId));
    } catch (err: any) {
      throw new Error(`Falha ao persistir hash de senha no PostgreSQL: ${err.message}`);
    }
  }

  // Atualiza cache em memória
  const store = Customer360Store.getInstance();
  const cust = store.getCustomerById(clienteId);
  if (cust) {
    (cust as any).senhaHash = hash;
  }

  await recordMandatoryAuditLog({
    usuario: auditUser || `portal_cliente_${clienteId}`,
    userId: String(clienteId),
    usuarioEmail: `cliente_${clienteId}@portal.nap`,
    modulo: 'Portal do Assinante',
    acao: 'PASSWORD_UPDATE',
    recurso: `cliente:${clienteId}:senha`,
    status: 'sucesso',
    detalhes: JSON.stringify({ clienteId, hashType: 'bcrypt_12' })
  });

  return { success: true, message: "Senha do portal atualizada com sucesso." };
}

/**
 * Middleware para exigir sessão autenticada do Portal do Assinante
 */
export function requirePortalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const portalHeader = req.headers['x-portal-token'] as string;
  const token = (authHeader && authHeader.startsWith('Bearer ')) 
    ? authHeader.substring(7).trim() 
    : portalHeader;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Autenticação no Portal do Assinante necessária. Token Bearer ausente.',
      code: 'PORTAL_AUTH_REQUIRED'
    });
  }

  const verified = verifyPortalSessionToken(token);
  if (!verified.valid || !verified.clienteId) {
    return res.status(401).json({
      success: false,
      error: verified.error || 'Token de sessão do portal inválido ou expirado.',
      code: 'PORTAL_TOKEN_INVALID'
    });
  }

  (req as any).portalClient = {
    clienteId: verified.clienteId,
    cpf: verified.cpf,
    nome: verified.nome
  };

  next();
}

