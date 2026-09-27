/**
 * MAIA V3 — Audit Service
 * Registro estruturado de auditoria operacional da IA em conformidade com LGPD.
 * Sanitiza segredos, tokens e chaves antes da gravação.
 */

import { appendAuditLog } from "../../security/httpSecurity";
import { MaiaSessionService } from "../sessions/MaiaSessionService";
import { MaiaSecurityContext } from "../core/types";

export interface MaiaAuditEntry {
  aiSessionId: string;
  tenantId: string;
  userId?: string;
  clienteId?: number;
  channel: string;
  provider: string;
  model: string;
  tool?: string;
  riskLevel: string;
  policyDecision: string;
  confirmationRequired: boolean;
  confirmationResult?: string;
  executionStatus: string;
  correlationId: string;
  latencyMs?: number;
  parameters?: any;
  resultData?: any;
}

export class MaiaAuditService {
  /**
   * Sanitiza dados antes de persistir, mascarando CPF, senhas, tokens e chaves de API
   */
  public static sanitizePayload(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(it => this.sanitizePayload(it));

    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      const kl = k.toLowerCase();
      if (kl.includes('password') || kl.includes('senha') || kl.includes('token') || kl.includes('secret') || kl.includes('key')) {
        clean[k] = '********';
      } else if (kl.includes('cpf') && typeof v === 'string' && v.length >= 11) {
        clean[k] = v.substring(0, 3) + '.***.***-' + v.substring(v.length - 2);
      } else if (typeof v === 'object' && v !== null) {
        clean[k] = this.sanitizePayload(v);
      } else {
        clean[k] = v;
      }
    }
    return clean;
  }

  public static async recordExecution(entry: MaiaAuditEntry, securityContext: MaiaSecurityContext): Promise<void> {
    const sanitizedParams = this.sanitizePayload(entry.parameters);
    const sanitizedResults = this.sanitizePayload(entry.resultData);

    // 1. Persistência na tabela específica de auditoria de tools de IA
    if (entry.tool) {
      await MaiaSessionService.recordToolExecution({
        sessionId: entry.aiSessionId,
        toolName: entry.tool,
        riskLevel: entry.riskLevel,
        policyDecision: entry.policyDecision,
        confirmationRequired: entry.confirmationRequired,
        confirmationResult: entry.confirmationResult,
        executionStatus: entry.executionStatus,
        parameters: sanitizedParams,
        resultData: sanitizedResults,
        correlationId: entry.correlationId,
        latencyMs: entry.latencyMs
      });
    }

    // 2. Persistência no log de auditoria central do NAP
    appendAuditLog({
      usuario: securityContext.userId ? `Operador #${securityContext.userId}` : (securityContext.clienteId ? `Cliente #${securityContext.clienteId}` : 'Visitante'),
      usuarioEmail: securityContext.userId ? `user_${securityContext.userId}@nap.local` : 'maia@audit.local',
      usuarioRole: (securityContext.role as any) || 'ATENDIMENTO',
      modulo: 'MaIA Audit Engine',
      acao: entry.tool ? `MAIA_TOOL_${entry.tool.toUpperCase()}` : 'MAIA_TURN_COMPLETED',
      detalhes: `Sessão: ${entry.aiSessionId} | Tenant: ${entry.tenantId} | Provedor: ${entry.provider} (${entry.model}) | Status: ${entry.executionStatus} | Risco: ${entry.riskLevel}`,
      severidade: entry.riskLevel === 'CRITICAL' || entry.riskLevel === 'DESTRUCTIVE' ? 'critico' : 'info',
      status: entry.executionStatus === 'SUCCESS' || entry.executionStatus === 'COMPLETED' ? 'sucesso' : 'falha',
      ip: securityContext.ip,
      userAgent: securityContext.userAgent
    });
  }
}
