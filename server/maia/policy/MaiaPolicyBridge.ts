/**
 * MAIA V3 — Policy Bridge
 * Conecta o ecossistema MaIA ao AiPolicyEngine oficial sem duplicar regras.
 * Enforça Deny-by-Default, validação de Tenant e RBAC.
 */

import { AiPolicyEngine, RiskLevel, PolicyEvaluationResult } from "../../agent/policyEngine";
import { MaiaSecurityContext } from "../core/types";

export class MaiaPolicyBridge {
  public static evaluate(
    toolName: string,
    params: any,
    securityContext: MaiaSecurityContext
  ): PolicyEvaluationResult {
    // A MaIA NÃO tem privilégios próprios. Converte o contexto de segurança
    // no formato de usuário autenticado esperado pelo Policy Engine oficial.
    const user = {
      id: securityContext.userId || (securityContext.clienteId ? `cli_${securityContext.clienteId}` : 'anonimo'),
      email: securityContext.userId ? `user_${securityContext.userId}@nap.local` : (securityContext.clienteId ? `cliente_${securityContext.clienteId}@portal.local` : 'visitante@publico.local'),
      nome: securityContext.userId ? `Operador #${securityContext.userId}` : (securityContext.clienteId ? `Assinante #${securityContext.clienteId}` : 'Visitante Anônimo'),
      role: (securityContext.role as any) || 'VISITANTE',
      permissions: securityContext.permissions as any[]
    };

    return AiPolicyEngine.evaluate(
      toolName,
      params,
      user,
      Boolean(securityContext.isConfirmed)
    );
  }
}
