import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const rawConnectionString = process.env.DATABASE_URL?.trim();

const INSECURE_DB_PATTERNS = [
  'nap_secure_pwd',
  'CHANGE_ME_IN_PRODUCTION',
  'CHANGE_ME',
  'postgres:postgres',
  ':password@',
  ':123456@',
  ':admin@'
];

/**
 * Validação rigorosa de DATABASE_URL
 */
export function validateDatabaseUrl(url = rawConnectionString, prod = isProduction): string {
  if (prod) {
    if (!url || url.trim() === '') {
      throw new Error(
        '[FALHA CRÍTICA DE STARTUP] Em produção (NODE_ENV=production), a variável DATABASE_URL é OBRIGATÓRIA.'
      );
    }

    for (const pattern of INSECURE_DB_PATTERNS) {
      if (url.includes(pattern)) {
        throw new Error(
          `[FALHA CRÍTICA DE STARTUP] DATABASE_URL contém credencial padrão ou insegura proibida ('${pattern}'). Configure credenciais reais e fortes no .env.`
        );
      }
    }

    if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
      throw new Error(
        '[FALHA CRÍTICA DE STARTUP] DATABASE_URL inválida. O formato deve ser postgresql://usuario:senha@host:porta/database'
      );
    }

    return url;
  }

  // Em desenvolvimento / preview: usa a URL configurada ou fallback local explícito
  if (url) return url;
  console.warn('[DATABASE] [DEV] DATABASE_URL não definida no ambiente de desenvolvimento. Utilizando fallback local.');
  return 'postgresql://postgres:postgres@127.0.0.1:5432/nap_crm';
}

const effectiveConnectionString = validateDatabaseUrl();

export let isDatabaseConnected = false;

export const pool = new Pool({
  connectionString: effectiveConnectionString,
  connectionTimeoutMillis: isProduction ? 5000 : 2000,
  max: 20
});

pool.on('connect', () => {
  isDatabaseConnected = true;
});

pool.on('error', (err) => {
  isDatabaseConnected = false;
  console.error('[DATABASE CRITICAL] Erro no pool do PostgreSQL:', err.message);
});

/**
 * Verificação estrita de prontidão do banco de dados no startup.
 * Em produção, lança exceção fatal se o banco não responder.
 */
export async function assertDatabaseReady(): Promise<void> {
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      isDatabaseConnected = true;
      console.log('[DATABASE] Conexão com PostgreSQL estabelecida com sucesso.');
    } finally {
      client.release();
    }
  } catch (err: any) {
    isDatabaseConnected = false;
    if (isProduction) {
      const msg = `[FALHA CRÍTICA DE STARTUP] Conexão inicial com PostgreSQL falhou em produção: ${err.message}`;
      console.error(msg);
      throw new Error(msg);
    } else {
      console.warn('[DATABASE] PostgreSQL não disponível no ambiente local/preview. Operando em modo desacoplado de desenvolvimento.');
    }
  }
}

// Inicia verificação não bloqueante em dev, bloqueante em produção quando chamado no server.ts
if (!isProduction) {
  assertDatabaseReady().catch(() => {});
}

export const db = drizzle(pool, { schema });
