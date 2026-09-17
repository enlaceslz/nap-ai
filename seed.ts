import { db } from './src/db';
import { users } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function seed() {
  const existingUsers = await db.select().from(users).limit(1);
  if (existingUsers.length === 0) {
    await db.insert(users).values({
      nome: 'Admin Provedor',
      email: 'admin@nap.com',
      senha: 'admin', // in a real app this should be hashed, keeping simple for demo
      cargo: 'admin'
    });
    console.log('Seed: Usuário admin@nap.com / admin criado com sucesso.');
  }
}

seed().catch(console.error).finally(() => process.exit(0));
