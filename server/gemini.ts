/**
 * MAIA V3 — Gemini Integration & Compatibility Layer
 * Redireciona para o MaiaCore e AI Gateway oficial do Enlace.
 * Remove identidades privilegiadas (maia-agent), dados hardcoded e bypass de tools.
 */

import { MaiaCore } from "./maia/core/MaiaCore";
import { MaiaSecurityContextManager } from "./maia/security/MaiaSecurityContext";
import { aiAlerts } from "./ai_state.js";
import crypto from "crypto";

export async function processGeminiAgentRun(reqBody: any, configOverride?: any) {
  const { prompt = "", cliente_cpf, telefone, contexto } = reqBody;

  // Constrói o contexto de segurança sem privilégios próprios
  const securityContext = MaiaSecurityContextManager.buildContext({
    tenantId: reqBody.tenantId || configOverride?.tenantId,
    user: reqBody.user,
    cliente: reqBody.cliente,
    clienteId: reqBody.clienteId,
    channel: reqBody.channel || 'webchat',
    sessionId: reqBody.sessionId,
    correlationId: reqBody.correlationId,
    ip: reqBody.ip,
    userAgent: reqBody.userAgent,
    isConfirmed: Boolean(reqBody.isConfirmed),
    callerNumber: telefone
  });

  const maiaCore = MaiaCore.getInstance();

  try {
    const result = await maiaCore.execute({
      prompt,
      securityContext,
      channelData: { cliente_cpf, telefone, contexto }
    });

    return {
      resposta: result.resposta,
      toolExecutada: result.toolExecutada,
      toolDados: result.toolDados,
      status: result.status,
      provider: result.provider,
      model: result.model,
      tokens: result.tokens,
      latencyMs: result.latencyMs,
      correlationId: result.correlationId
    };
  } catch (err: any) {
    console.error("[MaIA Agent Error]:", err.message);

    // Alerta de cota no painel se aplicável
    if (err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED')) {
      if (!aiAlerts.some((a: any) => a.type === 'QUOTA_EXHAUSTED')) {
        aiAlerts.push({
          id: `alert_${crypto.randomUUID()}`,
          type: 'QUOTA_EXHAUSTED',
          message: 'Limite de cota de IA atingido nos provedores configurados.',
          provider: 'AI Gateway',
          details: err.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    return {
      resposta: "Desculpe, nossos serviços de inteligência artificial estão temporariamente indisponíveis. Estou transferindo você para a nossa equipe de atendimento.",
      toolExecutada: "AI_UNAVAILABLE",
      toolDados: { error: err.message }
    };
  }
}
