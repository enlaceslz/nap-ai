import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Utilitários de hash e verificação de senhas para o NAP
 * Utiliza bcryptjs com salt rounds = 12 para produção e scrypt/constant-time como suporte retrocompatível.
 * A senha do administrador é armazenada exclusivamente como hash criptográfico no PostgreSQL.
 */

export function hashPassword(password: string): string {
  // Bcrypt com fator de custo 12 (forte para proteção contra brute-force / GPU cracking)
  return bcrypt.hashSync(password, 12);
}

export function verifyPassword(password: string, hash: string): boolean {
  if (!password || !hash) return false;

  try {
    // 1. Bcrypt ($2a$, $2b$, $2y$)
    if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
      return bcrypt.compareSync(password, hash);
    }

    // 2. Scrypt legado com salt aleatório
    if (hash.startsWith('$scrypt$')) {
      const parts = hash.split('$');
      if (parts.length !== 4) return false;
      const salt = parts[2];
      const storedHashHex = parts[3];
      const derivedKey = crypto.scryptSync(password, salt, 64);
      const storedKey = Buffer.from(storedHashHex, 'hex');
      return crypto.timingSafeEqual(derivedKey, storedKey);
    }

    // 3. Suporte legado seguro a SHA-256
    if (hash.length === 64) {
      const sha256 = crypto.createHash('sha256').update(password).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(sha256), Buffer.from(hash));
    }

    // Em ambiente estritamente de produção, rejeita comparação de texto plano
    if (process.env.NODE_ENV === 'production') {
      return false;
    }

    // Apenas em desenvolvimento permite comparação direta caso exista seed dev não hasheada
    return crypto.timingSafeEqual(Buffer.from(password), Buffer.from(hash));
  } catch (err) {
    return false;
  }
}
