import crypto from 'crypto';

/**
 * Utilitários de hash e verificação de senhas para o NAP
 * Utiliza scrypt com sal aleatório e comparação em tempo constante.
 */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `$scrypt$${salt}$${derivedKey.toString('hex')}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  if (!password || !hash) return false;

  try {
    if (hash.startsWith('$scrypt$')) {
      const parts = hash.split('$');
      if (parts.length !== 4) return false;
      const salt = parts[2];
      const storedHashHex = parts[3];
      const derivedKey = crypto.scryptSync(password, salt, 64);
      const storedKey = Buffer.from(storedHashHex, 'hex');
      return crypto.timingSafeEqual(derivedKey, storedKey);
    }

    // Suporte legado seguro a SHA-256 se o banco antigo salvou assim
    if (hash.length === 64) {
      const sha256 = crypto.createHash('sha256').update(password).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(sha256), Buffer.from(hash));
    }

    // Em ambiente estritamente de produção, rejeita comparação de texto plano
    if (process.env.NODE_ENV === 'production') {
      return false;
    }

    // Apenas em desenvolvimento permite comparação direta caso exista seed mock não hasheada
    return crypto.timingSafeEqual(Buffer.from(password), Buffer.from(hash));
  } catch (err) {
    return false;
  }
}
