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


// TECHNICAL DEBT: Migrar rate limiting em memória para Redis distribuído (ioredis / node-redis)
// Em produção com múltiplos workers ou instâncias escaladas horizontalmente, o Map em memória
// não sincroniza entre processos. Para este ciclo, o controle por IP atende a instância dedicada.
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
 * Retorna as opções do Helmet com separação estrita entre Produção e Preview/Dev
 */
export function getHelmetOptions(isProduction = process.env.NODE_ENV === 'production'): Parameters<typeof helmet>[0] {
  if (isProduction) {
    return {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
          imgSrc: ["'self'", "data:", "blob:", "https://*.tile.openstreetmap.org"],
          connectSrc: ["'self'", "https://*.tile.openstreetmap.org", "wss://*:8089", "ws://*:8089", ...(process.env.ASTERISK_WEBSOCKET_URL ? [process.env.ASTERISK_WEBSOCKET_URL] : [])],
          mediaSrc: ["'self'", "blob:"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'self'"]
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      xFrameOptions: { action: 'sameorigin' },
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-origin' }
    };
  }

  // Preview / Development: permite iframe do Google AI Studio e políticas relaxadas
  return {
    xFrameOptions: false,
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
    hsts: false,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  };
}

/**
 * Configura headers de segurança HTTP via Helmet
 * Em produção: aplica CSP estrito, HSTS, SAMEORIGIN, noSniff e COOP/CORP.
 * Em desenvolvimento/preview: flexibiliza para permitir renderização em iFrame.
 */
export function configureHelmet(isProduction?: boolean) {
  const isProd = isProduction !== undefined ? isProduction : process.env.NODE_ENV === 'production';
  return helmet(getHelmetOptions(isProd));
}

/**
 * Global Error Handler padronizado
 * REGRA CRÍTICA: Em produção, nunca vazar stack trace, erro de banco de dados,
 * senhas, tokens, chaves de API, connection strings ou caminhos do sistema de arquivos.
 * Resposta: { success: false, error: "Erro interno", requestId: "..." }
 */
export function globalErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const requestId = crypto.randomUUID ? crypto.randomUUID() : `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  
  // Log detalhado interno apenas para os operadores do servidor (nunca vazando para o cliente)
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
        detalhes: `Exceção capturada pelo errorHandler: ${err.message || 'Erro desconhecido'}`,
        severidade: 'critico',
        status: 'falha',
        ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      });
    } catch {
      // Previne falha de log durante tratamento de erro
    }
  }

  // Em produção: NUNCA vazar stack, detalhes do banco, tokens, senhas ou paths de arquivos
  if (isProduction) {
    const rawMsg = String(err.message || '');
    const isSensitive = /password|senha|token|secret|postgres|database|drizzle|select\s|insert\s|update\s|delete\s|\/home\/|\/opt\/|\/etc\/|connect\s/i.test(rawMsg);
    const clientMessage = (statusCode >= 500 || isSensitive)
      ? 'Erro interno'
      : rawMsg;

    return res.status(statusCode).json({
      error: clientMessage,
      requestId,
      code: err.code || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST')
    });
  }

  // Em desenvolvimento / testes
  return res.status(statusCode).json({
    error: err.message || 'Erro interno',
    requestId,
    code: err.code || 'INTERNAL_SERVER_ERROR',
    stack: err.stack
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
  status: 'sucesso' | 'falha' | 'bloqueado' | 'pendente';
  persistenceStatus?: 'queued' | 'persisted' | 'failed';
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
 * Persistência assíncrona com enfileiramento resiliente e serialização por lock no PostgreSQL
 */
async function persistLogToPostgres(log: AppendOnlyAuditLog): Promise<void> {
  const pool = await getDbPool();
  if (!pool || !process.env.DATABASE_URL) {
    return;
  }

  let client: any = null;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    // Advisory transaction lock exclusivo para a cadeia de hash de auditoria (evita concorrência)
    await client.query('SELECT pg_advisory_xact_lock(42424242)');

    // Recupera o previousHash real gravado imediatamente antes no banco
    const prevRes = await client.query('SELECT entry_hash FROM logs_auditoria ORDER BY id DESC LIMIT 1');
    const realPreviousHash = prevRes.rows.length > 0 && prevRes.rows[0].entry_hash
      ? prevRes.rows[0].entry_hash
      : '0'.repeat(64);

    let effectivePreviousHash = log.previousHash;
    let effectiveEntryHash = log.entryHash;

    if (effectivePreviousHash !== realPreviousHash) {
      effectivePreviousHash = realPreviousHash;
      const rawString = `${log.id}|${log.timestamp}|${log.usuario}|${log.modulo}|${log.acao}|${log.detalhes}|${effectivePreviousHash}`;
      effectiveEntryHash = crypto.createHash('sha256').update(rawString).digest('hex');
    }

    await client.query(
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
        effectivePreviousHash,
        effectiveEntryHash,
        new Date(log.timestamp)
      ]
    );

    await client.query('COMMIT');
    lastHash = effectiveEntryHash;
    (log as any).persistenceStatus = 'persisted';
  } catch (err: any) {
    (log as any).persistenceStatus = 'failed';
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
    }
    if (auditOutbox.length < 5000) {
      auditOutbox.push(log);
    }
    console.error(`[AUDIT_PERSISTENCE_FAILURE] Falha ao persistir log no PostgreSQL. Enfileirado no buffer (pendentes: ${auditOutbox.length}). Detalhe: ${err.message}`);
  } finally {
    if (client) {
      client.release();
    }
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
      await persistLogToPostgres(item);
      auditOutbox.shift();
    }
  } catch (err: any) {
    console.warn('[AUDIT OUTBOX RETRY] Não foi possível descarregar fila de contingência neste ciclo:', err.message);
  } finally {
    isFlushingOutbox = false;
  }
}

/**
 * Sanitiza dados sensíveis (senhas, tokens, secrets, chaves privadas, etc.)
 * antes de registrar em trilhas de auditoria, hashes ou persistência no PostgreSQL.
 */
export function sanitizeAuditPayload(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    const trimmed = data.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        const parsed = JSON.parse(trimmed);
        return JSON.stringify(sanitizeAuditPayload(parsed));
      } catch {
        // Segue para sanitização via regex
      }
    }

    let sanitized = data;
    sanitized = sanitized.replace(/(bearer\s+)[a-zA-Z0-9_\-\.]{10,}/gi, '$1[REDACTED_TOKEN]');
    sanitized = sanitized.replace(/(password|senha|secret|token|apikey|api_key|gemini_api_key|admin_password|ami_password|sgp_token|jwt_secret)\s*[:=]\s*["']?[^"'\s,;]+["']?/gi, '$1=[REDACTED]');
    sanitized = sanitized.replace(/(\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53})/g, '[REDACTED_BCRYPT_HASH]');
    return sanitized;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeAuditPayload(item));
  }

  if (typeof data === 'object') {
    const sensitiveKeyPatterns = [
      /password/i,
      /senha/i,
      /secret/i,
      /token/i,
      /apikey/i,
      /api_key/i,
      /auth/i,
      /bearer/i,
      /credential/i,
      /private_key/i,
      /privatekey/i,
      /hash/i,
      /cvv/i
    ];

    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      const isSensitive = sensitiveKeyPatterns.some(pattern => pattern.test(key));
      if (isSensitive) {
        result[key] = '[REDACTED_SENSITIVE_DATA]';
      } else if (typeof value === 'object' && value !== null) {
        result[key] = sanitizeAuditPayload(value);
      } else if (typeof value === 'string') {
        result[key] = sanitizeAuditPayload(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  return data;
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
  const id = `aud_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const timestamp = new Date().toISOString();
  const previousHash = lastHash;

  // Sanitização rigorosa contra vazamento de segredos antes do cálculo do hash e persistência
  const sanitizedDetalhes = typeof entry.detalhes === 'string'
    ? sanitizeAuditPayload(entry.detalhes)
    : (entry.detalhes ? JSON.stringify(sanitizeAuditPayload(entry.detalhes)) : '');

  const sanitizedEntry = {
    ...entry,
    detalhes: sanitizedDetalhes
  };

  const rawString = `${id}|${timestamp}|${sanitizedEntry.usuario}|${sanitizedEntry.modulo}|${sanitizedEntry.acao}|${sanitizedEntry.detalhes}|${previousHash}`;
  const entryHash = crypto.createHash('sha256').update(rawString).digest('hex');
  lastHash = entryHash;

  const logEntry: AppendOnlyAuditLog = {
    ...sanitizedEntry,
    id,
    timestamp,
    previousHash,
    entryHash,
    persistenceStatus: 'queued'
  };

  auditChain.push(Object.freeze(logEntry));
  if (auditChain.length > 500) {
    auditChain.shift();
  }

  // Persiste no PostgreSQL assincronamente com controle de integridade
  persistLogToPostgres(logEntry).catch((err) => {
    console.error(`[AUDIT_PERSISTENCE_FAILURE] ${err.message}`);
  });

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

/**
 * Retorna o status de integridade e saúde da trilha de auditoria.
 * Permite que dashboards de monitoramento e o Centro de Controle NOC
 * detectem imediatamente caso o PostgreSQL esteja indisponível e eventos estejam em outbox.
 */
export function getAuditHealthStatus(): {
  status: 'healthy' | 'degraded';
  storage: 'postgresql' | 'memory_fallback';
  chainLength: number;
  pendingOutbox: number;
  lastHash: string;
  alerts: string[];
} {
  const isProd = process.env.NODE_ENV === 'production';
  const hasDb = Boolean(process.env.DATABASE_URL);
  const pending = auditOutbox.length;
  const isDegraded = pending > 0 || (!hasDb && isProd);

  const alerts: string[] = [];
  if (pending > 0) {
    alerts.push(`Fila de contingência contém ${pending} evento(s) aguardando sincronização com o PostgreSQL.`);
    console.warn(`[AUDIT_DEGRADED_ALERT] Trilha de auditoria operando em modo degradado (${pending} eventos pendentes).`);
  }
  if (!hasDb && isProd) {
    alerts.push('PostgreSQL não configurado em ambiente de produção (DATABASE_URL ausente).');
  }

  return {
    status: isDegraded ? 'degraded' : 'healthy',
    storage: hasDb ? 'postgresql' : 'memory_fallback',
    chainLength: auditChain.length,
    pendingOutbox: pending,
    lastHash,
    alerts
  };
}

/**
 * Registra evento de AUDITORIA OBRIGATÓRIA (operações críticas de segurança, RBAC, financeiro e setup).
 * Em produção, se a gravação direta no PostgreSQL falhar ou o banco estiver inacessível,
 * a operação crítica DEVE ser bloqueada (throw Error) para prevenir bypass de auditoria.
 */
export async function recordMandatoryAuditLog(
  entry: Omit<AppendOnlyAuditLog, 'id' | 'timestamp' | 'previousHash' | 'entryHash'>
): Promise<AppendOnlyAuditLog> {
  const isProduction = process.env.NODE_ENV === 'production';
  const pool = await getDbPool();

  const id = `aud_m_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const timestamp = new Date().toISOString();
  const previousHash = lastHash;

  // Sanitização rigorosa de segredos antes do cálculo criptográfico
  const sanitizedDetalhes = typeof entry.detalhes === 'string'
    ? sanitizeAuditPayload(entry.detalhes)
    : (entry.detalhes ? JSON.stringify(sanitizeAuditPayload(entry.detalhes)) : '');

  const sanitizedEntry = {
    ...entry,
    detalhes: sanitizedDetalhes
  };

  const rawString = `${id}|${timestamp}|${sanitizedEntry.usuario}|${sanitizedEntry.modulo}|${sanitizedEntry.acao}|${sanitizedEntry.detalhes}|${previousHash}`;
  const entryHash = crypto.createHash('sha256').update(rawString).digest('hex');

  const logEntry: AppendOnlyAuditLog = {
    ...sanitizedEntry,
    id,
    timestamp,
    previousHash,
    entryHash
  };

  if (isProduction) {
    if (!pool || !process.env.DATABASE_URL) {
      console.error(`[AUDIT_CRITICAL_BLOCKED] Operação '${entry.acao}' no módulo '${entry.modulo}' bloqueada: PostgreSQL indisponível em produção.`);
      throw new Error(`[AUDITORIA_OBRIGATORIA_FALHA] Operação '${entry.acao}' bloqueada: persistência em PostgreSQL é obrigatória em produção e o banco está inacessível.`);
    }

    let client: any = null;
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(42424242)');

      const prevRes = await client.query('SELECT entry_hash FROM logs_auditoria ORDER BY id DESC LIMIT 1');
      const realPreviousHash = prevRes.rows.length > 0 && prevRes.rows[0].entry_hash
        ? prevRes.rows[0].entry_hash
        : '0'.repeat(64);

      let effectivePreviousHash = logEntry.previousHash;
      let effectiveEntryHash = logEntry.entryHash;

      if (effectivePreviousHash !== realPreviousHash) {
        effectivePreviousHash = realPreviousHash;
        const newRaw = `${logEntry.id}|${logEntry.timestamp}|${logEntry.usuario}|${logEntry.modulo}|${logEntry.acao}|${logEntry.detalhes}|${effectivePreviousHash}`;
        effectiveEntryHash = crypto.createHash('sha256').update(newRaw).digest('hex');
      }

      await client.query(
        `INSERT INTO logs_auditoria 
          (user_id, usuario, usuario_email, usuario_role, request_id, modulo, acao, recurso, resultado, detalhes, categoria, severidade, ip, user_agent, status, previous_hash, entry_hash, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          logEntry.userId || null,
          logEntry.usuario,
          logEntry.usuarioEmail || null,
          logEntry.usuarioRole || null,
          logEntry.requestId || null,
          logEntry.modulo,
          logEntry.acao,
          logEntry.recurso || null,
          logEntry.resultado || logEntry.status,
          logEntry.detalhes,
          logEntry.categoria || 'seguranca_critica',
          logEntry.severidade || 'critico',
          logEntry.ip || null,
          logEntry.userAgent || null,
          logEntry.status,
          effectivePreviousHash,
          effectiveEntryHash,
          new Date(logEntry.timestamp)
        ]
      );

      await client.query('COMMIT');
      lastHash = effectiveEntryHash;
      logEntry.previousHash = effectivePreviousHash;
      logEntry.entryHash = effectiveEntryHash;
      logEntry.persistenceStatus = 'persisted';
    } catch (err: any) {
      if (client) {
        await client.query('ROLLBACK').catch(() => {});
      }
      console.error(`[AUDIT_CRITICAL_BLOCKED] Falha de persistência síncrona de auditoria no PostgreSQL: ${err.message}`);
      throw new Error(`[AUDITORIA_OBRIGATORIA_FALHA] Operação '${entry.acao}' abortada por impossibilidade de registrar trilha de auditoria no PostgreSQL: ${err.message}`);
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  // Em dev/testes, registra no buffer
  lastHash = entryHash;
  auditChain.push(Object.freeze(logEntry));
  if (auditChain.length > 500) {
    auditChain.shift();
  }

  return logEntry;
}
