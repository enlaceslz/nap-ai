import { Router, Request, Response } from 'express';
import { db, isDatabaseConnected } from '../../src/db/index';
import { users } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import { generateAuthToken, requireAuth } from './rbacMiddleware';
import { verifyPassword, hashPassword } from './passwordUtils';
import { appendAuditLog } from '../security/httpSecurity';
import { UserRole, ROLE_PERMISSIONS } from './types';

export const authRouter = Router();

// Endpoint de login unificado do NAP
authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const ip = req.socket.remoteAddress || req.ip || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'unknown';

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    // 1. Consulta no PostgreSQL oficial
    let dbUser: any = null;
    try {
      const results = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
      dbUser = results[0];
    } catch (dbErr: any) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[AUTH ERROR] Erro de comunicação com PostgreSQL no login:', dbErr.message);
        return res.status(503).json({ error: 'Banco de dados indisponível para autenticação.' });
      }
      // Em dev/preview, prossegue para verificação de fallback
    }

    if (dbUser) {
      if (!dbUser.ativo) {
        appendAuditLog({
          usuario: normalizedEmail,
          modulo: 'AUTENTICACAO',
          acao: 'LOGIN_BLOQUEADO',
          detalhes: 'Tentativa de login de usuário desativado.',
          severidade: 'atencao',
          ip,
          status: 'falha'
        });
        return res.status(403).json({ error: 'Usuário desativado pelo administrador.' });
      }

      const isPasswordValid = verifyPassword(password, dbUser.senha);
      if (!isPasswordValid) {
        appendAuditLog({
          usuario: normalizedEmail,
          modulo: 'AUTENTICACAO',
          acao: 'LOGIN_FALHA',
          detalhes: 'Senha incorreta para usuário existente.',
          severidade: 'atencao',
          ip,
          status: 'falha'
        });
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      const role: UserRole = (ROLE_PERMISSIONS as any)[dbUser.cargo] ? (dbUser.cargo as UserRole) : 'ATENDIMENTO';
      const token = generateAuthToken({
        id: String(dbUser.id),
        email: dbUser.email,
        nome: dbUser.nome,
        role
      });

      appendAuditLog({
        usuario: dbUser.email,
        usuarioEmail: dbUser.email,
        usuarioRole: role,
        modulo: 'AUTENTICACAO',
        acao: 'LOGIN_SUCESSO',
        detalhes: `Login realizado com sucesso via PostgreSQL. Cargo: ${role}`,
        severidade: 'info',
        ip,
        userAgent,
        status: 'sucesso'
      });

      return res.json({
        success: true,
        token,
        id: String(dbUser.id),
        email: dbUser.email,
        name: dbUser.nome,
        role,
        permissions: ROLE_PERMISSIONS[role] || [],
        status: 'ativo'
      });
    }

    // Se usuário não encontrado no DB
    if (process.env.NODE_ENV === 'production') {
      appendAuditLog({
        usuario: normalizedEmail,
        modulo: 'AUTENTICACAO',
        acao: 'LOGIN_NAO_ENCONTRADO',
        detalhes: 'Tentativa de autenticação com e-mail não cadastrado.',
        severidade: 'atencao',
        ip,
        status: 'falha'
      });
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // Em ambiente de Desenvolvimento / Preview: permite bootstrap/login dev se não houver registros no DB
    if (normalizedEmail.includes('admin') && password.length >= 6) {
      const devRole: UserRole = 'ADMIN';
      const token = generateAuthToken({
        id: '1',
        email: normalizedEmail,
        nome: 'Administrador (Dev Setup)',
        role: devRole
      });

      return res.json({
        success: true,
        token,
        id: '1',
        email: normalizedEmail,
        name: 'Administrador (Dev Setup)',
        role: devRole,
        permissions: ROLE_PERMISSIONS[devRole],
        status: 'ativo'
      });
    }

    return res.status(401).json({ error: 'Usuário não encontrado.' });
  } catch (err: any) {
    console.error('[AUTH ERROR] Erro interno no processamento de login:', err.message);
    return res.status(500).json({ error: 'Erro interno no servidor durante autenticação.' });
  }
});

// Validação de sessão / Obter dados do usuário autenticado
authRouter.get('/me', requireAuth, (req: Request, res: Response) => {
  return res.json({
    success: true,
    user: req.user
  });
});

// Logout
authRouter.post('/logout', (req: Request, res: Response) => {
  if (req.user) {
    appendAuditLog({
      usuario: req.user.email,
      usuarioRole: req.user.role,
      modulo: 'AUTENTICACAO',
      acao: 'LOGOUT',
      detalhes: 'Sessão encerrada pelo usuário.',
      severidade: 'info',
      ip: req.user.ip || '127.0.0.1',
      status: 'sucesso'
    });
  }
  return res.json({ success: true, message: 'Logout realizado com sucesso.' });
});
