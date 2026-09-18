import helmet from 'helmet';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

// Rate Limiter em memória por IP
interface RateLimitBucket {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitBucket>();

export function createRateLimiter(options: { windowMs: number; max: number; message?: string }) {
  const { windowMs, max, message = 'Muitas requisições. Tente novamente mais tarde.' } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Ignora rate-limit para assets estáticos
    if (!req.path.startsWith('/api/')) return next();

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
    const key = `${clientIp}:${req.path}`;
    const now = Date.now();

    const bucket = rateLimitMap.get(key);
    if (!bucket || now > bucket.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > max) {
      return res.status(429).json({
        success: false,
        error: message,
        retryAfterMs: bucket.resetAt - now
      });
    }

    next();
  };
}

/**
 * Configura headers de segurança HTTP via Helmet
 */
export function configureHelmet() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:", "https://*.tile.openstreetmap.org", "https://*.cartocdn.com", "https://server.arcgisonline.com"],
        connectSrc: ["'self'", "wss:", "ws:", "https://generativelanguage.googleapis.com", "https://*.firebaseio.com", "https://identitytoolkit.googleapis.com"],
        frameAncestors: ["'self'"],
        objectSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  });
}

/**
 * Global Error Handler padronizado
 * REGRA CRÍTICA: Não retornar err.message diretamente para o usuário em produção.
 * Resposta: { success: false, error: "Erro interno", requestId: "..." }
 */
export function globalErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const requestId = crypto.randomUUID ? crypto.randomUUID() : `req_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  
  // Log detalhado interno apenas para os operadores do servidor
  console.error(`[ERROR_HANDLER] [RequestID: ${requestId}] [${req.method} ${req.originalUrl}]`, err);

  const isProduction = process.env.NODE_ENV === 'production';
  const statusCode = err.status || err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    error: isProduction && statusCode >= 500 ? 'Erro interno no processamento da solicitação.' : (err.message || 'Erro interno'),
    requestId,
    code: err.code || 'INTERNAL_SERVER_ERROR'
  });
}

/**
 * Trilha de Auditoria Append-Only com integridade SHA-256
 * Previne alteração ou deleção de logs por administradores
 */
export interface AppendOnlyAuditLog {
  id: string;
  timestamp: string;
  usuario: string;
  usuarioEmail?: string;
  usuarioRole?: string;
  modulo: string;
  acao: string;
  detalhes: string;
  categoria?: string;
  severidade?: 'info' | 'atencao' | 'critico';
  ip?: string;
  userAgent?: string;
  status: 'sucesso' | 'falha' | 'bloqueado';
  previousHash: string;
  entryHash: string;
}

const auditChain: AppendOnlyAuditLog[] = [];
let lastHash = '0000000000000000000000000000000000000000000000000000000000000000';

export function appendAuditLog(entry: Omit<AppendOnlyAuditLog, 'id' | 'timestamp' | 'previousHash' | 'entryHash'>): AppendOnlyAuditLog {
  const id = `aud_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const timestamp = new Date().toISOString();
  const previousHash = lastHash;

  const rawString = `${id}|${timestamp}|${entry.usuario}|${entry.modulo}|${entry.acao}|${entry.detalhes}|${previousHash}`;
  const entryHash = crypto.createHash('sha256').update(rawString).digest('hex');
  lastHash = entryHash;

  const logEntry: AppendOnlyAuditLog = {
    ...entry,
    id,
    timestamp,
    previousHash,
    entryHash
  };

  auditChain.push(Object.freeze(logEntry));
  return logEntry;
}

export function getAuditChain(): readonly AppendOnlyAuditLog[] {
  return auditChain;
}
