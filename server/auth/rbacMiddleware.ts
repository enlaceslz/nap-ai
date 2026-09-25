import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AuthenticatedUser, Permission, UserRole, ROLE_PERMISSIONS } from './types';
import { getJwtSecret } from '../security/secretManager';

// Declaração de tipo estendido para o Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Cria token de autenticação assinado (HMAC-SHA256)
 */
export function generateAuthToken(user: { id: string; email: string; nome: string; role: UserRole }): string {
  const secret = getJwtSecret();
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: user.id,
    email: user.email,
    name: user.nome,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24h
  })).toString('base64url');

  const signature = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

/**
 * Valida token de autenticação assinado
 */
export function verifyAuthToken(token: string): AuthenticatedUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const secret = getJwtSecret();
    const expectedSig = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expirado
    }

    const role: UserRole = (ROLE_PERMISSIONS as any)[decoded.role] ? (decoded.role as UserRole) : 'ATENDIMENTO';
    const permissions = ROLE_PERMISSIONS[role] || [];

    return {
      id: String(decoded.sub || decoded.id),
      email: decoded.email,
      nome: decoded.name || decoded.nome,
      role,
      permissions,
      issuedAt: decoded.iat
    };
  } catch (err) {
    return null;
  }
}

/**
 * Middleware central de Autenticação Real do NAP
 * REGRA CRÍTICA: NUNCA confia em headers x-user-id, x-user-name, x-user-role enviados pelo cliente!
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Limpeza explícita de headers forjáveis para evitar contaminação
  delete req.headers['x-user-id'];
  delete req.headers['x-user-name'];
  delete req.headers['x-user-role'];
  delete req.headers['x-usuario'];

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const verified = verifyAuthToken(token);
    if (verified) {
      req.user = {
        ...verified,
        ip: req.socket.remoteAddress || req.ip || undefined
      };
      return next();
    }
  }

  // Em ambiente de Desenvolvimento / Preview (não-produção), permite sessão mockada prévia identificada
  if (process.env.NODE_ENV !== 'production') {
    // Usuário de fallback em dev para não quebrar a navegação no preview
    const devRole: UserRole = 'ADMIN';
    req.user = {
      id: 'dev_user_admin',
      email: 'admin@nap.local',
      nome: 'Administrador Local (Dev)',
      role: devRole,
      permissions: ROLE_PERMISSIONS[devRole],
      ip: req.socket.remoteAddress || req.ip || undefined
    };
  }

  next();
}

/**
 * Middleware para exigir usuário autenticado
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Autenticação necessária. Token de autorização Bearer ausente ou inválido.',
      code: 'UNAUTHORIZED'
    });
  }
  next();
}

/**
 * Middleware para exigir permissões granulares no RBAC
 */
export function requirePermission(...requiredPermissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Autenticação necessária para acessar esta operação.',
        code: 'UNAUTHORIZED'
      });
    }

    // ADMIN possui bypass automático se tiver as permissões completas
    const userPermissions = req.user.permissions || [];
    const hasAll = requiredPermissions.every(p => userPermissions.includes(p));

    if (!hasAll) {
      return res.status(403).json({
        success: false,
        error: `Acesso negado. Esta operação requer a(s) permissão(ões): ${requiredPermissions.join(', ')}`,
        code: 'FORBIDDEN',
        requiredPermissions,
        userRole: req.user.role
      });
    }

    next();
  };
}

/**
 * Middleware para autorização baseada em Papéis (Roles)
 * ADMIN sempre tem acesso total.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Autenticação necessária para acessar esta operação.',
        code: 'UNAUTHORIZED'
      });
    }

    if (req.user.role === 'ADMIN' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: `Acesso negado. Esta operação requer um dos seguintes papéis: ${allowedRoles.join(', ')}`,
      code: 'FORBIDDEN',
      userRole: req.user.role
    });
  };
}
