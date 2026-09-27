/**
 * MAIA V3 — Session Persistence Service
 * Persistência relacional de sessões de IA, turnos de conversação, execuções de tools e eventos no PostgreSQL.
 */

import { db, isDatabaseConnected } from "../../../src/db/index";
import { ai_sessions, ai_session_turns, ai_tool_executions, ai_session_events } from "../../../src/db/schema";
import { eq } from "drizzle-orm";
import { MaiaSecurityContext } from "../core/types";
import crypto from "crypto";

export class MaiaSessionService {
  private static inMemorySessions = new Map<string, any>();
  private static inMemoryTurns = new Map<string, any[]>();
  private static inMemoryTools = new Map<string, any[]>();
  private static inMemoryEvents = new Map<string, any[]>();

  /**
   * Garante a criação ou atualização de uma sessão no PostgreSQL
   */
  public static async ensureSession(params: {
    sessionId: string;
    securityContext: MaiaSecurityContext;
    provider: string;
    model: string;
  }): Promise<void> {
    if (!this.inMemorySessions.has(params.sessionId)) {
      this.inMemorySessions.set(params.sessionId, {
        sessionId: params.sessionId,
        tenantId: params.securityContext.tenantId,
        userId: params.securityContext.userId,
        clienteId: params.securityContext.clienteId,
        channel: params.securityContext.channel,
        provider: params.provider,
        model: params.model,
        status: 'active',
        startedAt: new Date().toISOString()
      });
      this.inMemoryTurns.set(params.sessionId, []);
      this.inMemoryTools.set(params.sessionId, []);
      this.inMemoryEvents.set(params.sessionId, []);
    }

    if (!isDatabaseConnected) return;

    try {
      const existing = await db.select({ id: ai_sessions.id })
        .from(ai_sessions)
        .where(eq(ai_sessions.sessionId, params.sessionId))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(ai_sessions).values({
          sessionId: params.sessionId,
          tenantId: params.securityContext.tenantId,
          userId: params.securityContext.userId ? parseInt(params.securityContext.userId, 10) || null : null,
          clienteId: params.securityContext.clienteId || null,
          agentId: 'maia-core',
          channel: params.securityContext.channel,
          asteriskChannelId: params.securityContext.asteriskChannelId || null,
          asteriskUniqueId: params.securityContext.asteriskUniqueId || null,
          linkedId: params.securityContext.linkedId || null,
          callerNumber: params.securityContext.callerNumber || null,
          provider: params.provider,
          model: params.model,
          status: 'active',
          startedAt: new Date()
        });
      }
    } catch (err: any) {
      console.warn('[MaiaSessionService] Falha ao persistir sessão:', err.message);
    }
  }

  /**
   * Registra um turno de conversação (usuário ou assistente)
   */
  public static async recordTurn(params: {
    sessionId: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    tokensPrompt?: number;
    tokensCompletion?: number;
    latencyMs?: number;
    costEstimated?: number | null;
  }): Promise<string> {
    const turnId = `turn_${crypto.randomUUID()}`;
    const turns = this.inMemoryTurns.get(params.sessionId) || [];
    turns.push({ turnId, ...params, createdAt: new Date().toISOString() });
    this.inMemoryTurns.set(params.sessionId, turns);

    if (!isDatabaseConnected) return turnId;

    try {
      await db.insert(ai_session_turns).values({
        turnId,
        sessionId: params.sessionId,
        role: params.role,
        content: params.content,
        tokensPrompt: params.tokensPrompt || null,
        tokensCompletion: params.tokensCompletion || null,
        latencyMs: params.latencyMs || null,
        costEstimated: params.costEstimated ? String(params.costEstimated) : null
      });
    } catch (err: any) {
      console.warn('[MaiaSessionService] Falha ao persistir turno:', err.message);
    }

    return turnId;
  }

  /**
   * Registra a execução de uma ferramenta chamada pela IA
   */
  public static async recordToolExecution(params: {
    sessionId: string;
    toolName: string;
    riskLevel: string;
    policyDecision: string;
    confirmationRequired: boolean;
    confirmationResult?: string;
    executionStatus: string;
    parameters?: any;
    resultData?: any;
    correlationId?: string;
    latencyMs?: number;
  }): Promise<string> {
    const executionId = `tool_${crypto.randomUUID()}`;
    const tools = this.inMemoryTools.get(params.sessionId) || [];
    tools.push({ executionId, ...params, createdAt: new Date().toISOString() });
    this.inMemoryTools.set(params.sessionId, tools);

    if (!isDatabaseConnected) return executionId;

    try {
      await db.insert(ai_tool_executions).values({
        executionId,
        sessionId: params.sessionId,
        toolName: params.toolName,
        riskLevel: params.riskLevel,
        policyDecision: params.policyDecision,
        confirmationRequired: params.confirmationRequired,
        confirmationResult: params.confirmationResult || 'N/A',
        executionStatus: params.executionStatus,
        parameters: params.parameters ? JSON.stringify(params.parameters) : null,
        resultData: params.resultData ? JSON.stringify(params.resultData) : null,
        correlationId: params.correlationId || null,
        latencyMs: params.latencyMs || null
      });
    } catch (err: any) {
      console.warn('[MaiaSessionService] Falha ao persistir execução de tool:', err.message);
    }

    return executionId;
  }

  /**
   * Registra eventos de ciclo de vida (Prompt Guard, Failover, etc.)
   */
  public static async recordEvent(params: {
    sessionId: string;
    eventType: string;
    severity?: 'info' | 'warning' | 'critical';
    payload?: any;
  }): Promise<void> {
    const eventId = `ev_${crypto.randomUUID()}`;
    const events = this.inMemoryEvents.get(params.sessionId) || [];
    events.push({ eventId, ...params, createdAt: new Date().toISOString() });
    this.inMemoryEvents.set(params.sessionId, events);

    if (!isDatabaseConnected) return;

    try {
      await db.insert(ai_session_events).values({
        eventId,
        sessionId: params.sessionId,
        eventType: params.eventType,
        severity: params.severity || 'info',
        payload: params.payload ? JSON.stringify(params.payload) : null
      });
    } catch (err: any) {
      console.warn('[MaiaSessionService] Falha ao persistir evento:', err.message);
    }
  }

  /**
   * Encerra a sessão
   */
  public static async endSession(sessionId: string, status: 'completed' | 'failed' | 'transferred' = 'completed'): Promise<void> {
    const mem = this.inMemorySessions.get(sessionId);
    if (mem) {
      mem.status = status;
      mem.endedAt = new Date().toISOString();
    }

    if (!isDatabaseConnected) return;

    try {
      await db.update(ai_sessions)
        .set({ status, endedAt: new Date(), updatedAt: new Date() })
        .where(eq(ai_sessions.sessionId, sessionId));
    } catch (err: any) {
      console.warn('[MaiaSessionService] Falha ao encerrar sessão:', err.message);
    }
  }

  /**
   * Consulta uma sessão por ID, incluindo turnos, execuções de tools e eventos
   */
  public static async getSession(sessionId: string): Promise<any | null> {
    if (isDatabaseConnected) {
      try {
        const [session] = await db.select().from(ai_sessions).where(eq(ai_sessions.sessionId, sessionId)).limit(1);
        if (session) {
          const turns = await db.select().from(ai_session_turns).where(eq(ai_session_turns.sessionId, sessionId)).orderBy(ai_session_turns.createdAt);
          const tools = await db.select().from(ai_tool_executions).where(eq(ai_tool_executions.sessionId, sessionId)).orderBy(ai_tool_executions.createdAt);
          const events = await db.select().from(ai_session_events).where(eq(ai_session_events.sessionId, sessionId)).orderBy(ai_session_events.createdAt);

          return {
            ...session,
            turns,
            toolExecutions: tools,
            events
          };
        }
      } catch (err: any) {
        console.warn('[MaiaSessionService] Falha ao consultar PostgreSQL:', err.message);
      }
    }

    // Fallback para memória
    const memSession = this.inMemorySessions.get(sessionId);
    if (!memSession) return null;

    return {
      ...memSession,
      turns: this.inMemoryTurns.get(sessionId) || [],
      toolExecutions: this.inMemoryTools.get(sessionId) || [],
      events: this.inMemoryEvents.get(sessionId) || []
    };
  }
}
