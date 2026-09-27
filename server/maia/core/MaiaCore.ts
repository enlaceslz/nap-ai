/**
 * MAIA V3 — Core Orchestrator
 * Arquitetura Oficial Enlace (NAP-AI)
 * 
 * Fluxo Obrigatório Inviolável:
 * Usuário / Cliente
 *   ↓ Identidade autenticada & Tenant Context
 *   ↓ Prompt Guard
 *   ↓ AI Gateway (Router: Gemini / 9router)
 *   ↓ Tool Request
 *   ↓ Policy Engine (RBAC, Tenant, Ownership, Risk)
 *   ↓ Confirmação quando necessária
 *   ↓ Executor Seguro
 *   ↓ Fonte Real (PostgreSQL / ERP / GenieACS / Zabbix / GIS)
 *   ↓ Auditoria & Persistência (ai_sessions / logs_auditoria)
 *   ↓ Resposta final estruturada da MaIA
 */

import { MaiaExecutionRequest, MaiaExecutionResponse, ProviderProfile } from "./types";
import { MaiaPromptGuard } from "../security/MaiaPromptGuard";
import { MaiaAIGateway } from "../gateway/MaiaAIGateway";
import { PromptComposer } from "./PromptComposer";
import { MaiaToolExecutor } from "../tools/MaiaToolExecutor";
import { MaiaSessionService } from "../sessions/MaiaSessionService";
import { MaiaMemoryManager } from "../memory/MaiaMemoryManager";
import { MaiaKnowledgeService } from "../knowledge/MaiaKnowledgeService";
import { MaiaAuditService } from "../audit/MaiaAuditService";
import { agentToolRegistry } from "../../agent/toolRegistry";
import crypto from "crypto";

export class MaiaCore {
  private static instance: MaiaCore;
  private gateway: MaiaAIGateway;

  private constructor() {
    this.gateway = new MaiaAIGateway();
  }

  public static getInstance(): MaiaCore {
    if (!MaiaCore.instance) {
      MaiaCore.instance = new MaiaCore();
    }
    return MaiaCore.instance;
  }

  public getGateway(): MaiaAIGateway {
    return this.gateway;
  }

  /**
   * Ponto central de execução de interações da MaIA
   */
  public async execute(request: MaiaExecutionRequest): Promise<MaiaExecutionResponse> {
    const startTime = Date.now();
    const { securityContext, profileOverride } = request;
    const sessionId = securityContext.sessionId;
    const correlationId = securityContext.correlationId;

    // 1. Obtenção do Perfil Oficial do Tenant (White-Label)
    const profile: ProviderProfile = {
      ...PromptComposer.getDefaultTenantProfile(securityContext.tenantId),
      ...(profileOverride || {})
    };

    // 2. Análise pelo Prompt Guard (Detecção e Isolamento de Injeção)
    const guardAnalysis = MaiaPromptGuard.analyze(request.prompt);
    if (guardAnalysis.isFlagged) {
      await MaiaSessionService.recordEvent({
        sessionId,
        eventType: 'prompt_guard_flag',
        severity: guardAnalysis.threatLevel === 'POLICY_BYPASS_ATTEMPT' ? 'critical' : 'warning',
        payload: {
          detectedPatterns: guardAnalysis.detectedPatterns,
          threatLevel: guardAnalysis.threatLevel
        }
      });
    }

    // 3. Recuperação de Memória de Conversação e Knowledge RAG (estritamente isolado pelo tenant)
    const conversationHistory = MaiaMemoryManager.formatForPrompt(sessionId);
    const knowledgeDocs = MaiaKnowledgeService.query({
      tenantId: securityContext.tenantId,
      query: guardAnalysis.sanitizedPrompt,
      maxResults: 2
    });
    const knowledgeText = knowledgeDocs.length > 0
      ? knowledgeDocs.map(d => `[${d.titulo}]: ${d.conteudo}`).join('\n')
      : undefined;

    // 4. Montagem estruturada do Prompt
    const fullPrompt = PromptComposer.compose(
      {
        systemPolicy: '',
        developerPolicy: '',
        securityPolicy: '',
        tenantPolicy: '',
        knowledgeContext: knowledgeText,
        conversationMemory: conversationHistory || undefined,
        userInput: guardAnalysis.sanitizedPrompt
      },
      profile,
      securityContext
    );

    // 5. Preparação das declarações de ferramentas para o AI Gateway
    const availableToolDeclarations = agentToolRegistry.toGeminiFunctionDeclarations().map(f => ({
      name: f.name,
      description: f.description,
      parametersSchema: f.parameters
    }));

    // 6. Chamada ao AI Gateway com fallback controlado
    let aiResponse;
    try {
      aiResponse = await this.gateway.generateWithFallback({
        prompt: fullPrompt,
        tools: availableToolDeclarations,
        profileType: request.profileType,
        metadata: {
          channel: securityContext.channel,
          sessionId,
          tenantId: securityContext.tenantId
        }
      });
    } catch (gatewayErr: any) {
      // Fallback em caso de indisponibilidade geral da IA
      console.error('[MaiaCore Gateway Error]:', gatewayErr);
      
      const latencyMs = Date.now() - startTime;
      const turnId = await MaiaSessionService.recordTurn({
        sessionId,
        role: 'assistant',
        content: 'Desculpe, nossos canais de IA estão temporariamente indisponíveis. Estou transferindo para a nossa equipe humana.',
        latencyMs
      });

      return {
        sessionId,
        turnId,
        resposta: "Desculpe, nossos canais de inteligência artificial estão em alta demanda no momento. Estou transferindo o seu atendimento para um de nossos operadores humanos.",
        status: 'AI_UNAVAILABLE',
        provider: 'Fallback Local',
        model: 'None',
        latencyMs,
        correlationId
      };
    }

    // Registrar a sessão e o turno do usuário
    await MaiaSessionService.ensureSession({
      sessionId,
      securityContext,
      provider: aiResponse.provider,
      model: aiResponse.model
    });

    await MaiaSessionService.recordTurn({
      sessionId,
      role: 'user',
      content: request.prompt,
      tokensPrompt: aiResponse.tokensPrompt
    });
    MaiaMemoryManager.appendTurn(sessionId, 'user', request.prompt);

    // 7. Se a IA solicitou execução de ferramenta (Tool Calling)
    if (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
      const toolCall = aiResponse.toolCalls[0];
      const toolName = toolCall.name;
      const toolArgs = toolCall.args;

      // Execução estritamente via ToolExecutor (passa obrigatoriamente pelo Policy Engine)
      const toolExecResult = await MaiaToolExecutor.execute(
        toolName,
        toolArgs,
        securityContext
      );

      const latencySoFar = Date.now() - startTime;

      // Registrar auditoria da tool
      await MaiaAuditService.recordExecution({
        aiSessionId: sessionId,
        tenantId: securityContext.tenantId,
        userId: securityContext.userId,
        clienteId: securityContext.clienteId,
        channel: securityContext.channel,
        provider: aiResponse.provider,
        model: aiResponse.model,
        tool: toolName,
        riskLevel: toolExecResult.riskLevel || 'LOW',
        policyDecision: toolExecResult.status,
        confirmationRequired: toolExecResult.status === 'CONFIRMATION_REQUIRED',
        confirmationResult: securityContext.isConfirmed ? 'CONFIRMED' : (toolExecResult.status === 'CONFIRMATION_REQUIRED' ? 'PENDING' : 'N/A'),
        executionStatus: toolExecResult.success ? 'SUCCESS' : (toolExecResult.status === 'CONFIRMATION_REQUIRED' ? 'BLOCKED' : 'FAILED'),
        correlationId,
        latencyMs: latencySoFar,
        parameters: toolArgs,
        resultData: toolExecResult.toolDados
      }, securityContext);

      // Tratativa de confirmação obrigatória
      if (toolExecResult.status === 'CONFIRMATION_REQUIRED') {
        const respostaConfirmacao = `⚠️ Ação de alto impacto operacional: ${toolExecResult.confirmationPrompt || 'Esta operação exige autorização explícita do operador.'} Deseja confirmar?`;
        
        const turnId = await MaiaSessionService.recordTurn({
          sessionId,
          role: 'assistant',
          content: respostaConfirmacao,
          latencyMs: Date.now() - startTime
        });
        MaiaMemoryManager.appendTurn(sessionId, 'assistant', respostaConfirmacao);

        return {
          sessionId,
          turnId,
          resposta: respostaConfirmacao,
          toolExecutada: toolName,
          toolDados: { status: 'CONFIRMATION_REQUIRED', prompt: toolExecResult.confirmationPrompt },
          status: 'CONFIRMATION_REQUIRED',
          provider: aiResponse.provider,
          model: aiResponse.model,
          latencyMs: Date.now() - startTime,
          correlationId
        };
      }

      // Tratativa de bloqueio por permissão / RBAC
      if (!toolExecResult.success) {
        const respostaBloqueio = `Não foi possível prosseguir: ${toolExecResult.message || 'Operação restrita pelas diretrizes de segurança do provedor.'}`;
        
        const turnId = await MaiaSessionService.recordTurn({
          sessionId,
          role: 'assistant',
          content: respostaBloqueio,
          latencyMs: Date.now() - startTime
        });
        MaiaMemoryManager.appendTurn(sessionId, 'assistant', respostaBloqueio);

        return {
          sessionId,
          turnId,
          resposta: respostaBloqueio,
          toolExecutada: toolName,
          toolDados: { status: 'FORBIDDEN', message: toolExecResult.message },
          status: 'FORBIDDEN',
          provider: aiResponse.provider,
          model: aiResponse.model,
          latencyMs: Date.now() - startTime,
          correlationId
        };
      }

      // 8. Tool executada com sucesso na fonte real: Follow-up para sintetizar resposta final humana
      const followupPrompt = PromptComposer.compose(
        {
          systemPolicy: '',
          developerPolicy: '',
          securityPolicy: '',
          tenantPolicy: '',
          conversationMemory: conversationHistory || undefined,
          toolResult: {
            toolName,
            rawResult: toolExecResult.toolDados
          },
          userInput: `A ferramenta oficial '${toolName}' retornou os dados acima. Elabore a resposta final cordial para o usuário baseando-se estritamente nestes dados.`
        },
        profile,
        securityContext
      );

      let finalResponseText = toolExecResult.respostaGerada || "Prontinho! Operação realizada com sucesso.";
      try {
        const followupAiResponse = await this.gateway.generateWithFallback({
          prompt: followupPrompt,
          profileType: request.profileType,
          metadata: {
            channel: securityContext.channel,
            sessionId,
            tenantId: securityContext.tenantId
          }
        });
        if (followupAiResponse.text) {
          finalResponseText = followupAiResponse.text;
        }
      } catch (followupErr) {
        console.warn('[MaiaCore Followup Warning] Usando resposta direta da ferramenta:', followupErr);
      }

      const totalLatency = Date.now() - startTime;
      const turnId = await MaiaSessionService.recordTurn({
        sessionId,
        role: 'assistant',
        content: finalResponseText,
        latencyMs: totalLatency
      });
      MaiaMemoryManager.appendTurn(sessionId, 'assistant', finalResponseText);

      return {
        sessionId,
        turnId,
        resposta: finalResponseText,
        toolExecutada: toolName,
        toolDados: toolExecResult.toolDados,
        status: 'COMPLETED',
        provider: aiResponse.provider,
        model: aiResponse.model,
        tokens: {
          prompt: aiResponse.tokensPrompt,
          completion: aiResponse.tokensCompletion,
          total: (aiResponse.tokensPrompt || 0) + (aiResponse.tokensCompletion || 0)
        },
        costEstimated: null,
        latencyMs: totalLatency,
        correlationId
      };
    }

    // 9. Resposta de conversação livre / esclarecimento de dúvidas
    const finalContent = aiResponse.text || "Olá! Como posso ajudar você hoje?";
    const totalLatency = Date.now() - startTime;

    const turnId = await MaiaSessionService.recordTurn({
      sessionId,
      role: 'assistant',
      content: finalContent,
      tokensCompletion: aiResponse.tokensCompletion,
      latencyMs: totalLatency
    });
    MaiaMemoryManager.appendTurn(sessionId, 'assistant', finalContent);

    return {
      sessionId,
      turnId,
      resposta: finalContent,
      status: 'COMPLETED',
      provider: aiResponse.provider,
      model: aiResponse.model,
      tokens: {
        prompt: aiResponse.tokensPrompt,
        completion: aiResponse.tokensCompletion,
        total: (aiResponse.tokensPrompt || 0) + (aiResponse.tokensCompletion || 0)
      },
      costEstimated: null,
      latencyMs: totalLatency,
      correlationId
    };
  }
}
