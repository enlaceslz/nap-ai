import fs from 'fs';
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
 * - Produção: Obrigatória, formato estrito, sem credenciais inseguras.
 * - Docker: Alerta se utilizar 127.0.0.1 em vez do nome de serviço 'db'.
 * - Sem fallback com senhas padrão no código.
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

    // Alerta se rodando em container Docker com 127.0.0.1
    if (fs.existsSync('/.dockerenv') && (url.includes('@127.0.0.1:') || url.includes('@localhost:'))) {
      console.warn(
        '[DATABASE DOCKER ALERTA] Executando dentro de container Docker com DATABASE_URL apontando para 127.0.0.1/localhost. Na rede interna Docker, utilize o host do serviço (ex: postgresql://user:pass@db:5432/nap_crm).'
      );
    }

    return url;
  }

  // Em desenvolvimento / preview:
  if (!url || url.trim() === '') {
    console.warn('[DATABASE] [DEV] DATABASE_URL não definida no ambiente. Operando com persistência em memória/fallback.');
    return '';
  }

  for (const pattern of INSECURE_DB_PATTERNS) {
    if (url.includes(pattern)) {
      console.warn(`[DATABASE] [DEV] DATABASE_URL contém credencial insegura conhecida ('${pattern}'). Recomenda-se configurar credenciais válidas.`);
    }
  }

  return url;
}

const effectiveConnectionString = validateDatabaseUrl();

export let isDatabaseConnected = false;

export const pool = new Pool(
  effectiveConnectionString
    ? {
        connectionString: effectiveConnectionString,
        connectionTimeoutMillis: isProduction ? 5000 : 2000,
        max: 20
      }
    : {
        // Pool dummy inativo para ambiente sem DATABASE_URL em dev/preview
        max: 1
      }
);

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
  if (!effectiveConnectionString) {
    if (isProduction) {
      throw new Error('[FALHA CRÍTICA DE STARTUP] DATABASE_URL não definida em produção.');
    }
    isDatabaseConnected = false;
    console.warn('[DATABASE] PostgreSQL não configurado no ambiente local/preview. Operando em modo desacoplado de desenvolvimento.');
    return;
  }

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
if (!isProduction && effectiveConnectionString) {
  assertDatabaseReady().catch(() => {});
}

export const db = drizzle(pool, { schema });
