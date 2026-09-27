/**
 * MAIA V3 — Official API Routes
 * Endpoints oficiais de interação com a MaIA, AI Gateway, Voz e Sessões.
 *
 * Rotas:
 * - POST /api/maia/chat
 * - POST /api/maia/voice
 * - POST /api/maia/tool-confirm
 * - GET  /api/maia/health
 * - GET  /api/maia/sessions/:id
 */

import { Router, Request, Response } from "express";
import crypto from "crypto";
import { MaiaCore } from "../core/MaiaCore";
import { MaiaSecurityContextManager } from "../security/MaiaSecurityContext";
import { MaiaVoiceBridge } from "../voice/MaiaVoiceBridge";
import { MaiaToolExecutor } from "../tools/MaiaToolExecutor";
import { MaiaAuditService } from "../audit/MaiaAuditService";
import { MaiaSessionService } from "../sessions/MaiaSessionService";
import { isDatabaseConnected } from "../../../src/db/index";

export function setupMaiaRoutes(app: any): Router {
  const router = Router();
  const maiaCore = MaiaCore.getInstance();

  /**
   * POST /api/maia/chat
   * Execução de turnos de conversação e tool-calling com proteção de segurança e Policy Engine.
   */
  router.post("/chat", async (req: Request, res: Response) => {
    try {
      const {
        prompt,
        sessionId,
        clienteId,
        userId,
        channel = 'webchat',
        tenantId = 'default',
        correlationId,
        profileType,
        isConfirmed = false,
        profileOverride
      } = req.body;

      if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        return res.status(400).json({
          status: 'ERROR',
          error: 'O parâmetro "prompt" é obrigatório e deve ser uma string não vazia.'
        });
      }

      // Constrói o contexto de segurança sem privilégios próprios
      const securityContext = MaiaSecurityContextManager.buildContext({
        tenantId,
        user: (req as any).user || (userId ? { id: userId } : undefined),
        cliente: (req as any).client || (clienteId ? { id: clienteId } : undefined),
        clienteId: clienteId || (req as any).client?.id,
        userId: userId || (req as any).user?.id,
        channel,
        sessionId,
        correlationId: correlationId || crypto.randomUUID(),
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        isConfirmed: Boolean(isConfirmed)
      });

      const result = await maiaCore.execute({
        prompt,
        securityContext,
        profileType,
        profileOverride
      });

      return res.status(200).json(result);
    } catch (err: any) {
      console.error("[MaIA API Chat Error]:", err);
      return res.status(500).json({
        status: 'ERROR',
        error: err.message || 'Erro interno no processamento da MaIA.'
      });
    }
  });

  /**
   * POST /api/maia/voice
   * Integração de voz Asterisk ARI / AMI / WebRTC
   */
  router.post("/voice", async (req: Request, res: Response) => {
    try {
      const {
        sessionId,
        callerNumber,
        text,
        asteriskChannelId,
        asteriskUniqueId,
        linkedId,
        tenantId = 'default',
        correlationId
      } = req.body;

      // Se identificadores do Asterisk foram enviados, vincula a sessão
      let voiceBinding = undefined;
      if (asteriskUniqueId) {
        voiceBinding = MaiaVoiceBridge.bindAsteriskSession({
          sessionId,
          asteriskChannelId: asteriskChannelId || 'SIP/default-00000001',
          asteriskUniqueId,
          linkedId,
          callerNumber: callerNumber || 'anonimo',
          tenantId
        });
      }

      const liveVoiceCapability = MaiaVoiceBridge.checkLiveVoiceCapability();

      // Executa o turno de voz se houver texto
      let turnResult = null;
      if (text && text.trim() !== '') {
        const securityContext = MaiaSecurityContextManager.buildContext({
          tenantId,
          channel: 'voice',
          sessionId: voiceBinding ? voiceBinding.sessionId : sessionId,
          correlationId: correlationId || crypto.randomUUID(),
          callerNumber: callerNumber || 'anonimo',
          asteriskUniqueId,
          asteriskChannelId,
          linkedId
        });

        turnResult = await maiaCore.execute({
          prompt: text,
          securityContext,
          profileType: 'VOICE_REALTIME'
        });
      }

      return res.status(200).json({
        status: 'SUCCESS',
        binding: voiceBinding || null,
        liveVoiceCapability,
        result: turnResult
      });
    } catch (err: any) {
      console.error("[MaIA API Voice Error]:", err);
      return res.status(500).json({
        status: 'ERROR',
        error: err.message || 'Erro interno no canal de voz da MaIA.'
      });
    }
  });

  /**
   * POST /api/maia/tool-confirm
   * Confirmação explícita de ferramenta crítica (Policy Engine HIGH / CONFIRMATION_REQUIRED)
   */
  router.post("/tool-confirm", async (req: Request, res: Response) => {
    try {
      const {
        sessionId,
        toolName,
        confirmed,
        parameters = {},
        tenantId = 'default',
        correlationId,
        userId,
        clienteId
      } = req.body;

      if (!toolName) {
        return res.status(400).json({
          status: 'ERROR',
          error: 'O parâmetro "toolName" é obrigatório.'
        });
      }

      const activeSessionId = sessionId || `session_${crypto.randomUUID()}`;
      const activeCorrelationId = correlationId || crypto.randomUUID();

      if (!confirmed) {
        await MaiaSessionService.recordEvent({
          sessionId: activeSessionId,
          eventType: 'tool_confirmation_rejected',
          severity: 'warning',
          payload: { toolName, parameters }
        });

        return res.status(200).json({
          status: 'REJECTED',
          message: 'Execução da ferramenta cancelada pelo usuário ou operador.',
          toolName
        });
      }

      // Executa com confirmação autorizada
      const securityContext = MaiaSecurityContextManager.buildContext({
        tenantId,
        user: (req as any).user || (userId ? { id: userId } : undefined),
        cliente: (req as any).client || (clienteId ? { id: clienteId } : undefined),
        clienteId: clienteId || (req as any).client?.id,
        userId: userId || (req as any).user?.id,
        channel: 'api_confirmation',
        sessionId: activeSessionId,
        correlationId: activeCorrelationId,
        isConfirmed: true,
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      });

      const execResult = await MaiaToolExecutor.execute(toolName, parameters, securityContext);

      // Auditoria
      await MaiaAuditService.recordExecution({
        aiSessionId: activeSessionId,
        tenantId,
        userId: securityContext.userId,
        clienteId: securityContext.clienteId,
        channel: securityContext.channel,
        provider: 'Manual Confirmation',
        model: 'Enlace Policy Executor',
        tool: toolName,
        riskLevel: execResult.riskLevel || 'HIGH',
        policyDecision: 'AUTHORIZED',
        confirmationRequired: true,
        confirmationResult: 'CONFIRMED',
        executionStatus: execResult.success ? 'SUCCESS' : 'FAILED',
        correlationId: activeCorrelationId,
        parameters,
        resultData: execResult.toolDados
      }, securityContext);

      return res.status(200).json({
        status: execResult.success ? 'COMPLETED' : 'FAILED',
        toolExecutada: toolName,
        toolDados: execResult.toolDados,
        resposta: execResult.respostaGerada || (execResult.success ? 'Operação confirmada e executada com sucesso.' : 'Falha na execução da operação.')
      });
    } catch (err: any) {
      console.error("[MaIA Tool Confirm Error]:", err);
      return res.status(500).json({
        status: 'ERROR',
        error: err.message || 'Erro ao processar confirmação de ferramenta.'
      });
    }
  });

  /**
   * GET /api/maia/health
   * Diagnóstico de saúde do AI Gateway, provedores e componentes de segurança.
   */
  router.get("/health", async (_req: Request, res: Response) => {
    try {
      const gateway = maiaCore.getGateway();
      const geminiProvider = gateway.getRouter().getProvider('gemini');
      const nineRouterProvider = gateway.getRouter().getProvider('9router');

      const geminiHealth = geminiProvider ? await geminiProvider.healthCheck() : { status: 'NOT_FOUND', message: 'Gemini provider não registrado', checkedAt: new Date().toISOString() };
      const nineRouterHealth = nineRouterProvider ? await nineRouterProvider.healthCheck() : { status: 'NOT_FOUND', message: '9router provider não registrado', checkedAt: new Date().toISOString() };

      const isHealthy = geminiHealth.status === 'UP' || nineRouterHealth.status === 'UP';

      return res.status(200).json({
        status: isHealthy ? 'UP' : 'DEGRADED',
        gateway: {
          defaultProfile: process.env.AI_DEFAULT_PROFILE || 'BALANCEADO',
          isRouterEnabled: process.env.AI_ROUTER_ENABLED === 'true'
        },
        providers: {
          gemini: geminiHealth,
          nineRouter: nineRouterHealth
        },
        database: isDatabaseConnected ? 'UP' : 'DEGRADED',
        checkedAt: new Date().toISOString()
      });
    } catch (err: any) {
      return res.status(500).json({
        status: 'DOWN',
        error: err.message
      });
    }
  });

  /**
   * GET /api/maia/sessions/:id
   * Consulta histórico persistido de sessão de IA, turnos, tools e eventos.
   */
  router.get("/sessions/:id", async (req: Request, res: Response) => {
    try {
      const sessionId = req.params.id;
      const session = await MaiaSessionService.getSession(sessionId);

      if (!session) {
        return res.status(404).json({
          status: 'NOT_FOUND',
          error: `Sessão de IA '${sessionId}' não foi encontrada.`
        });
      }

      return res.status(200).json({
        status: 'SUCCESS',
        session
      });
    } catch (err: any) {
      console.error("[MaIA API Session Error]:", err);
      return res.status(500).json({
        status: 'ERROR',
        error: err.message
      });
    }
  });

  app.use("/api/maia", router);
  return router;
}
