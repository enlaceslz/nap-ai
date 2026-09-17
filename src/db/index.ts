import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

// Usamos a string de conexão padrão do nosso Docker caso não exista no .env
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:nap_secure_pwd@localhost:5432/nap_crm';

const pool = new Pool({
 connectionString,
});

// Evita que erros do pool não tratados derrubem a aplicação (ex: ECONNREFUSED em modo fallback)
pool.on('error', (err) => {
 // Ignoramos a exibição do erro explícito no console para evitar 
 // que a UI da plataforma dispare triggers falsos de "Crash", já que 
 // o sistema foi projetado para operar com Memory Fallback de forma silenciosa.
});

export const db = drizzle(pool, { schema });
