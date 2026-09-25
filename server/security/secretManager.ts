/**
 * NAP (Núcleo de Atendimento ao Provedor) - Gerenciador Central de Segredos e Sessão
 * Bloqueador Crítico P0 V10: Eliminação incondicional de secret fallbacks hardcoded.
 * 
 * Regra Estrita:
 * Em produção (NODE_ENV === 'production'), a ausência de JWT_SECRET / NAP_JWT_SECRET
 * provoca FALHA CRÍTICA IMEDIATA (startup fail / fail-closed).
 * Em desenvolvimento/teste, se ausente, gera um segredo efêmero aleatório criptográfico
 * por ciclo de vida do processo (NUNCA uma string estática ou conhecida).
 */

import crypto from 'crypto';

let ephemeralSecret: string | null = null;

function getEphemeralSecret(): string {
  if (!ephemeralSecret) {
    ephemeralSecret = crypto.randomBytes(32).toString('hex');
  }
  return ephemeralSecret;
}

/**
 * Retorna o segredo criptográfico ativo para assinatura de JWTs e Tokens de Inscrição.
 * Lança erro explícito se em produção e o segredo estiver ausente.
 */
export function getJwtSecret(): string {
  const secret = process.env.NAP_JWT_SECRET || process.env.JWT_SECRET || process.env.SESSION_SECRET;
  
  if (!secret || secret.trim() === '') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[SEGURANÇA CRÍTICA - STARTUP FAIL] As variáveis NAP_JWT_SECRET, JWT_SECRET ou SESSION_SECRET ' +
        'são OBRIGATÓRIAS em ambiente de produção (NODE_ENV=production). ' +
        'Nenhum fallback estático é aceito.'
      );
    }
    return getEphemeralSecret();
  }
  
  return secret;
}

/**
 * Estrutura do Payload da Sessão do Assinante no Portal
 */
export interface PortalSessionPayload {
  sub: string; // ID do cliente em string
  clienteId: number;
  cpf: string;
  nome: string;
  role: 'cliente';
  purpose: 'portal_session';
  iat: number;
  exp: number;
  jti: string;
}

/**
 * Gera um JWT de Sessão Autenticada para o Assinante do Portal (HMAC-SHA256)
 */
export function generatePortalSessionToken(client: {
  id: number;
  nome: string;
  documento: string;
}, expiresInSeconds: number = 12 * 60 * 60): string {
  const secret = getJwtSecret();
  const now = Math.floor(Date.now() / 1000);
  
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload: PortalSessionPayload = {
    sub: String(client.id),
    clienteId: client.id,
    cpf: String(client.documento).replace(/\D/g, ''),
    nome: client.nome,
    role: 'cliente',
    purpose: 'portal_session',
    iat: now,
    exp: now + expiresInSeconds,
    jti: crypto.randomBytes(16).toString('hex')
  };
  
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${payloadB64}`).digest('base64url');
  
  return `${header}.${payloadB64}.${signature}`;
}

/**
 * Valida o JWT de Sessão do Assinante do Portal
 */
export function verifyPortalSessionToken(token: string): {
  valid: boolean;
  clienteId?: number;
  cpf?: string;
  nome?: string;
  error?: string;
} {
  try {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Token ausente ou inválido.' };
    }
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Estrutura do token inválida (esperado formato JWS).' };
    }
    
    const [header, payloadB64, signature] = parts;
    const secret = getJwtSecret();
    const expectedSig = crypto.createHmac('sha256', secret).update(`${header}.${payloadB64}`).digest('base64url');
    
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return { valid: false, error: 'Assinatura criptográfica do token de sessão inválida ou forjada.' };
    }
    
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Sessão expirada. Efetue login novamente.' };
    }
    
    if (payload.purpose !== 'portal_session' || payload.role !== 'cliente') {
      return { valid: false, error: 'Finalidade do token de autenticação incompatível.' };
    }
    
    return {
      valid: true,
      clienteId: Number(payload.clienteId || payload.sub),
      cpf: payload.cpf,
      nome: payload.nome
    };
  } catch (err: any) {
    return { valid: false, error: `Falha na verificação da sessão: ${err.message}` };
  }
}
