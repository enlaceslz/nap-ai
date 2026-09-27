/**
 * MAIA V3 — Tool Executor
 * Ponto único e inviolável de execução de ferramentas da MaIA.
 * Todas as chamadas (incluindo fallbacks e autoatendimento) OBRIGATORIAMENTE passam por
 * agentToolRegistry.executeToolSecurely() e são validadas pelo Policy Engine.
 */

import { agentToolRegistry, SecureExecutionResult } from "../../agent/toolRegistry";
import { MaiaSecurityContext } from "../core/types";

export class MaiaToolExecutor {
  public static async execute(
    toolName: string,
    params: any,
    securityContext: MaiaSecurityContext
  ): Promise<SecureExecutionResult> {
    const user = {
      id: securityContext.userId || (securityContext.clienteId ? `cli_${securityContext.clienteId}` : 'anonimo'),
      email: securityContext.userId ? `user_${securityContext.userId}@nap.local` : (securityContext.clienteId ? `cliente_${securityContext.clienteId}@portal.local` : 'visitante@publico.local'),
      nome: securityContext.userId ? `Operador #${securityContext.userId}` : (securityContext.clienteId ? `Assinante #${securityContext.clienteId}` : 'Visitante Anônimo'),
      role: (securityContext.role as any) || 'VISITANTE',
      permissions: securityContext.permissions as any[]
    };

    // Injeta contexto de segurança verificado server-side nos parâmetros
    const enrichedParams = {
      ...params,
      context: {
        tenantId: securityContext.tenantId,
        clienteId: securityContext.clienteId,
        channel: securityContext.channel,
        correlationId: securityContext.correlationId
      }
    };

    return await agentToolRegistry.executeToolSecurely(
      toolName,
      enrichedParams,
      {
        user,
        isConfirmed: Boolean(securityContext.isConfirmed),
        ip: securityContext.ip,
        origem: `MaIA Core [${securityContext.channel}]`
      }
    );
  }
}
