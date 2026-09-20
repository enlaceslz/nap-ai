import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool, validateDatabaseUrl } from './index';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

/**
 * NAP TELECOM - Runner de Migrações Versionadas de Produção (Drizzle ORM)
 * 
 * Substitui estritamente 'drizzle-kit push' em produção.
 * Execução determinística baseada no diretório ./drizzle versionado.
 * Registra o histórico e hashes na tabela interna __drizzle_migrations do PostgreSQL.
 */
export async function runMigrations(): Promise<void> {
  const isProd = process.env.NODE_ENV === 'production';
  console.log('===========================================================');
  console.log('  NAP-AI — Execução de Migrações Versionadas (Drizzle ORM) ');
  console.log(`  Ambiente: ${isProd ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}      `);
  console.log('===========================================================');

  const connectionString = validateDatabaseUrl(process.env.DATABASE_URL, isProd);
  if (!connectionString) {
    if (isProd) {
      console.error('[MIGRATION FATAL] DATABASE_URL não definida em produção.');
      process.exit(1);
    }
    console.warn('[MIGRATION AVISO] DATABASE_URL não definida em dev/preview. Pulando execução de migrações.');
    return;
  }

  const migrationsFolder = path.resolve(process.cwd(), 'drizzle');
  console.log(`[MIGRATION] Diretório de migrações: ${migrationsFolder}`);

  try {
    const startTime = Date.now();
    await migrate(db, { migrationsFolder });
    const duration = Date.now() - startTime;
    console.log(`[MIGRATION SUCESSO] Todas as migrações foram verificadas e aplicadas com êxito em ${duration}ms!`);
  } catch (error: any) {
    console.error('-----------------------------------------------------------');
    console.error('[MIGRATION ERRO FATAL] Falha crítica ao aplicar migrações:');
    console.error(error?.message || error);
    console.error('-----------------------------------------------------------');
    console.error('[DEPLOY BLOQUEADO] O deploy foi interrompido para proteger a integridade dos dados.');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Execução direta quando invocado via CLI (npm run db:migrate)
if (process.argv[1]?.endsWith('migrate.ts') || process.argv[1]?.endsWith('migrate.js')) {
  runMigrations().catch((err) => {
    console.error('[MIGRATION FATAL EXCEPTION]', err);
    process.exit(1);
  });
}
