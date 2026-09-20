import helmet from 'helmet';
import crypto from 'crypto';
import cors, { CorsOptions } from 'cors';
import { Request, Response, NextFunction } from 'express';

/**
 * Valida a configuração de CORS em conformidade estrita com o ambiente.
 * Em produção (NODE_ENV=production), ALLOWED_ORIGINS é OBRIGATÓRIA e proíbe wildcard (*).
 */
export function validateAndBuildCorsOptions(
  allowedOriginsEnv = process.env.ALLOWED_ORIGINS,
  isProduction = process.env.NODE_ENV === 'production'
): CorsOptions {
  if (isProduction) {
    if (!allowedOriginsEnv || !allowedOriginsEnv.trim()) {
      throw new Error(
        '[FALHA CRÍTICA DE STARTUP] Em produção (NODE_ENV=production), a variável ALLOWED_ORIGINS é OBRIGATÓRIA. Defina os domínios autorizados (ex: https://admin.provedor.com.br,https://portal.provedor.com.br).'
      );
    }

    const origins = allowedOriginsEnv.split(',').map(o => o.trim()).filter(Boolean);

    if (origins.length === 0 || origins.includes('*')) {
      throw new Error(
        '[FALHA CRÍTICA DE STARTUP] Em produção, o uso de wildcard (*) ou lista vazia em ALLOWED_ORIGINS é terminantemente proibido por segurança.'
      );
    }

    return {
      origin: (origin, callback) => {
        // Requisições sem Origin (ex: server-to-server, Postman local, Webhooks com mTLS/HMAC) são permitidas
        if (!origin) {
          return callback(null, true);
        }

        if (origins.includes(origin)) {
          return callback(null, true);
        } else {
          return callback(new Error(`Origem '${origin}' não autorizada pelas políticas estritas de CORS do NAP.`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
    };
  }

  // Ambiente de Desenvolvimento / Testes / Preview
  const devOrigins = allowedOriginsEnv
    ? allowedOriginsEnv.split(',').map(o => o.trim()).filter(Boolean)
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3001'
      ];

  return {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      
      const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      const isCloudRunOrPreview = /^https:\/\/.*(\.run\.app|\.google\.com|\.google\.dev|\.web\.app|\.firebaseapp\.com)$/.test(origin);
      
      if (devOrigins.includes(origin) || isLocalhost || isCloudRunOrPreview) {
        return callback(null, true);
      }
      // Em desenvolvimento e preview, autorizar origens dinâmicas de preview
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
  };
}

export function configureCors(
  allowedOriginsEnv?: string,
  isProduction?: boolean
) {
  const options = validateAndBuildCorsOptions(allowedOriginsEnv, isProduction);
  return cors(options);
}


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
 * Compatível com renderização em iFrame do Google AI Studio e Web Preview.
 */
export function configureHelmet() {
  const isProd = process.env.NODE_ENV === 'production';
  
  return helmet({
    // Permite que o preview seja embutido sem restrições de frame no iFrame do Google AI Studio e Web Preview
    xFrameOptions: false,
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
    hsts: false,
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

  if (statusCode >= 500) {
    try {
      appendAuditLog({
        usuario: (req as any).user?.email || 'ANONIMO',
        userId: (req as any).user?.id ? String((req as any).user.id) : undefined,
        requestId,
        modulo: 'HTTP_SERVER',
        acao: 'ERRO_INTERNO',
        recurso: req.originalUrl,
        resultado: 'falha',
        detalhes: `Exceção não tratada capturada pelo errorHandler: ${err.message || 'Erro desconhecido'}`,
        severidade: 'critico',
        status: 'falha',
        ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      });
    } catch {
      // Previne falha de log durante tratamento de erro
    }
  }

  res.status(statusCode).json({
    success: false,
    error: isProduction && statusCode >= 500 ? 'Erro interno no processamento da solicitação.' : (err.message || 'Erro interno'),
    requestId,
    code: err.code || 'INTERNAL_SERVER_ERROR'
  });
}

/**
 * Trilha de Auditoria Append-Only com integridade SHA-256 e Persistência no PostgreSQL
 * Garante conformidade com LGPD e rastreabilidade para ISPs (ISP Compliance).
 * - Cadeia criptográfica SHA-256 contínua persistida na tabela 'logs_auditoria'.
 * - Recuperação do último hash no startup (sobrevive a reinicializações de container).
 * - Cache em memória (últimos 500 registros) para alta performance de consulta.
 * - Fila de contingência (outbox pattern) com retry assíncrono caso o banco fique temporariamente inacessível.
 */
export interface AppendOnlyAuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  usuario: string;
  usuarioEmail?: string;
  usuarioRole?: string;
  requestId?: string;
  modulo: string;
  acao: string;
  recurso?: string;
  resultado?: string;
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
const auditOutbox: AppendOnlyAuditLog[] = [];
let isFlushingOutbox = false;
let isPersistenceInitialized = false;

// Dynamic import or lazy access to pool to avoid circular dependency
let dbPool: any = null;
async function getDbPool() {
  if (!dbPool) {
    try {
      const dbModule = await import('../../src/db/index.js');
      dbPool = dbModule.pool;
    } catch {
      try {
        const dbModule = await import('../../src/db/index');
        dbPool = dbModule.pool;
      } catch {
        dbPool = null;
      }
    }
  }
  return dbPool;
}

/**
 * Inicializa a cadeia de integridade a partir do PostgreSQL
 * Busca o último registro de auditoria para dar continuidade ao hash encadeado.
 */
export async function initAuditPersistence(): Promise<void> {
  if (isPersistenceInitialized) return;
  try {
    const pool = await getDbPool();
    if (!pool || !process.env.DATABASE_URL) {
      console.warn('[AUDIT] PostgreSQL não configurado. Auditoria iniciada com Hash Gênese em buffer local.');
      isPersistenceInitialized = true;
      return;
    }

    const result = await pool.query(
      'SELECT entry_hash FROM logs_auditoria ORDER BY id DESC LIMIT 1'
    );

    if (result.rows && result.rows.length > 0 && result.rows[0].entry_hash) {
      lastHash = result.rows[0].entry_hash;
      console.log(`[AUDIT PERSISTÊNCIA] Hash anterior restaurado do PostgreSQL: ${lastHash.substring(0, 16)}...`);
    } else {
      lastHash = '0'.repeat(64);
      console.log('[AUDIT PERSISTÊNCIA] Tabela logs_auditoria vazia. Iniciado Hash Gênese (64 zeros).');
    }

    isPersistenceInitialized = true;
    await flushAuditOutbox();
  } catch (err: any) {
    console.warn(`[AUDIT AVISO] Não foi possível consultar o último hash no banco (${err.message}). Utilizando Hash Gênese.`);
    lastHash = '0'.repeat(64);
    isPersistenceInitialized = true;
  }
}

/**
 * Persistência assíncrona com enfileiramento resiliente
 */
async function persistLogToPostgres(log: AppendOnlyAuditLog): Promise<void> {
  try {
    const pool = await getDbPool();
    if (!pool || !process.env.DATABASE_URL) {
      return;
    }

    await pool.query(
      `INSERT INTO logs_auditoria 
        (user_id, usuario, usuario_email, usuario_role, request_id, modulo, acao, recurso, resultado, detalhes, categoria, severidade, ip, user_agent, status, previous_hash, entry_hash, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
      [
        log.userId || null,
        log.usuario,
        log.usuarioEmail || null,
        log.usuarioRole || null,
        log.requestId || null,
        log.modulo,
        log.acao,
        log.recurso || null,
        log.resultado || log.status,
        log.detalhes,
        log.categoria || 'operacional',
        log.severidade || 'info',
        log.ip || null,
        log.userAgent || null,
        log.status,
        log.previousHash,
        log.entryHash,
        new Date(log.timestamp)
      ]
    );
  } catch (err: any) {
    if (auditOutbox.length < 5000) {
      auditOutbox.push(log);
    }
    console.warn(`[AUDIT OUTBOX] Falha ao persistir log no PostgreSQL. Enfileirado no buffer (pendentes: ${auditOutbox.length}). Detalhe: ${err.message}`);
  }
}

/**
 * Descarrega a fila de contingência (outbox) quando a conexão com o banco é restabelecida
 */
export async function flushAuditOutbox(): Promise<void> {
  if (isFlushingOutbox || auditOutbox.length === 0) return;
  isFlushingOutbox = true;

  try {
    const pool = await getDbPool();
    if (!pool || !process.env.DATABASE_URL) return;

    while (auditOutbox.length > 0) {
      const item = auditOutbox[0];
      await pool.query(
        `INSERT INTO logs_auditoria 
          (user_id, usuario, usuario_email, usuario_role, request_id, modulo, acao, recurso, resultado, detalhes, categoria, severidade, ip, user_agent, status, previous_hash, entry_hash, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          item.userId || null,
          item.usuario,
          item.usuarioEmail || null,
          item.usuarioRole || null,
          item.requestId || null,
          item.modulo,
          item.acao,
          item.recurso || null,
          item.resultado || item.status,
          item.detalhes,
          item.categoria || 'operacional',
          item.severidade || 'info',
          item.ip || null,
          item.userAgent || null,
          item.status,
          item.previousHash,
          item.entryHash,
          new Date(item.timestamp)
        ]
      );
      auditOutbox.shift();
    }
  } catch (err: any) {
    console.warn('[AUDIT OUTBOX RETRY] Não foi possível descarregar fila de contingência neste ciclo:', err.message);
  } finally {
    isFlushingOutbox = false;
  }
}

// Timer de background para tentar descarregar o buffer a cada 10 segundos se houver itens
if (typeof setInterval !== 'undefined') {
  const auditTimer = setInterval(() => {
    if (auditOutbox.length > 0) {
      flushAuditOutbox().catch(() => {});
    }
  }, 10000);
  if (auditTimer && typeof auditTimer.unref === 'function') {
    auditTimer.unref();
  }
}

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
  if (auditChain.length > 500) {
    auditChain.shift();
  }

  // Persiste no PostgreSQL assincronamente
  persistLogToPostgres(logEntry).catch(() => {});

  return logEntry;
}

export function getAuditChain(): readonly AppendOnlyAuditLog[] {
  return auditChain;
}

export function getLastAuditHash(): string {
  return lastHash;
}

export function getPendingAuditOutboxCount(): number {
  return auditOutbox.length;
}
