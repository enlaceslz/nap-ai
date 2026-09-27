/**
 * MAIA V3 — Security Context Manager
 * Garante que a MaIA execute SEM PRIVILÉGIOS PRÓPRIOS.
 * As permissões e identidades derivam estritamente do usuário, cliente ou sessão.
 */

import { MaiaSecurityContext } from '../core/types';
import crypto from 'crypto';

export class MaiaSecurityContextManager {
  /**
   * Constrói o contexto de segurança seguro a partir da requisição HTTP ou canal de entrada
   */
  public static buildContext(params: {
    tenantId?: string;
    user?: any;
    userId?: string;
    cliente?: any;
    clienteId?: number;
    channel?: string;
    sessionId?: string;
    correlationId?: string;
    ip?: string;
    userAgent?: string;
    isConfirmed?: boolean;
    callerNumber?: string;
    asteriskUniqueId?: string;
    asteriskChannelId?: string;
    linkedId?: string;
  }): MaiaSecurityContext {
    const tenantId = (params.tenantId || process.env.TENANT_ID || 'default').trim();
    const correlationId = params.correlationId || `corr_${crypto.randomUUID()}`;
    const sessionId = params.sessionId || `session_${crypto.randomUUID()}`;
    const channel = params.channel || 'webchat';

    // 1. Caso Operador Humano (Painel Administrativo)
    if (params.user && params.user.id && params.user.id !== 'maia-agent') {
      const userPermissions = Array.isArray(params.user.permissions) ? params.user.permissions : [];
      return {
        tenantId,
        userId: String(params.user.id),
        role: params.user.role || 'ATENDIMENTO',
        permissions: [...userPermissions],
        channel,
        sessionId,
        correlationId,
        ip: params.ip,
        userAgent: params.userAgent,
        isConfirmed: Boolean(params.isConfirmed),
        callerNumber: params.callerNumber,
        asteriskUniqueId: params.asteriskUniqueId,
        asteriskChannelId: params.asteriskChannelId,
        linkedId: params.linkedId
      };
    }

    // 2. Caso Cliente Autenticado (Portal do Assinante / Sessão de Voz com Contrato Vinculado)
    const effectiveClienteId = params.clienteId || params.cliente?.id;
    if (effectiveClienteId) {
      return {
        tenantId,
        clienteId: Number(effectiveClienteId),
        role: 'CLIENTE',
        // Clientes autenticados têm permissão apenas para leitura de faturas e diagnóstico do seu próprio contrato
        permissions: ['INVOICE_READ', 'CUSTOMER_READ', 'ONU_READ'],
        channel,
        sessionId,
        correlationId,
        ip: params.ip,
        userAgent: params.userAgent,
        isConfirmed: Boolean(params.isConfirmed),
        callerNumber: params.callerNumber,
        asteriskUniqueId: params.asteriskUniqueId,
        asteriskChannelId: params.asteriskChannelId,
        linkedId: params.linkedId
      };
    }

    // 3. Caso Visitante / Lead / Não Autenticado
    // NUNCA conceder permissões privadas ou operacionais
    return {
      tenantId,
      role: 'VISITANTE',
      permissions: ['CUSTOMER_CREATE'], // Somente para registrar interesse/lead de vendas
      channel,
      sessionId,
      correlationId,
      ip: params.ip,
      userAgent: params.userAgent,
      isConfirmed: false,
      callerNumber: params.callerNumber,
      asteriskUniqueId: params.asteriskUniqueId,
      asteriskChannelId: params.asteriskChannelId,
      linkedId: params.linkedId
    };
  }

  /**
   * Valida se o contexto possui direito de consultar dados privados de cliente
   */
  public static canAccessPrivateCustomerData(ctx: MaiaSecurityContext, targetClienteId?: number): boolean {
    if (ctx.role === 'VISITANTE' || !ctx.permissions.includes('CUSTOMER_READ')) {
      return false;
    }
    // Operadores com permissão podem acessar
    if (['ADMIN', 'OPERADOR', 'ATENDIMENTO', 'SUPORTE', 'NOC'].includes(ctx.role || '')) {
      return true;
    }
    // Cliente só acessa seus próprios dados
    if (ctx.role === 'CLIENTE' && ctx.clienteId && targetClienteId) {
      return ctx.clienteId === targetClienteId;
    }
    return false;
  }
}
