import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL?.trim();

if (isProduction && (!connectionString || connectionString.includes('nap_secure_pwd') || connectionString.includes('CHANGE_ME'))) {
  throw new Error('[SEGURANÇA CRÍTICA] DATABASE_URL não configurada ou contendo credencial padrão em ambiente de produção.');
}

export let isDatabaseConnected = false;

// Em não-produção, permite fallback para URI local ou memória mockada
const effectiveConnectionString = connectionString || 'postgresql://postgres:postgres@127.0.0.1:5432/nap_crm';

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
  if (isProduction) {
    console.error('[DATABASE ERROR] Falha no pool do PostgreSQL:', err.message);
  }
});

// Teste inicial não-bloqueante de conexão
pool.query('SELECT 1').then(() => {
  isDatabaseConnected = true;
  console.log('[DATABASE] Conexão com PostgreSQL estabelecida com sucesso.');
}).catch((err) => {
  isDatabaseConnected = false;
  if (isProduction) {
    console.error('[DATABASE] Falha de conexão inicial com PostgreSQL em produção:', err.message);
  } else {
    console.warn('[DATABASE] PostgreSQL não disponível no ambiente local/preview. Operando em modo desacoplado.');
  }
});

export const db = drizzle(pool, { schema });

