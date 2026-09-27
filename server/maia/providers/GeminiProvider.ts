/**
 * MAIA V3 — Gemini AI Provider
 * Integração oficial com Google Gen AI SDK (@google/genai)
 */

import { GoogleGenAI } from "@google/genai";
import { MaiaAIProvider, MaiaGenerateRequest, MaiaGenerateResponse, ProviderHealth } from "../gateway/types";

export class GeminiProvider implements MaiaAIProvider {
  public readonly name = "Google Gemini";
  private ai: GoogleGenAI | null = null;
  private apiKey: string;
  private defaultModel: string;

  constructor(apiKey?: string, defaultModel = "gemini-2.5-flash") {
    this.apiKey = apiKey !== undefined ? apiKey : (process.env.GEMINI_API_KEY || "");
    this.defaultModel = defaultModel;
    if (this.apiKey) {
      this.ai = new GoogleGenAI({
        apiKey: this.apiKey,
        httpOptions: { headers: { 'User-Agent': 'enlace-maia-v3' } }
      });
    }
  }

  public supportsTools(): boolean {
    return true;
  }

  public supportsVision(): boolean {
    return true;
  }

  public supportsAudio(): boolean {
    return true;
  }

  public supportsLiveVoice(): boolean {
    return true;
  }

  public async healthCheck(): Promise<ProviderHealth> {
    if (!this.apiKey || !this.ai) {
      return {
        status: 'NOT_CONFIGURED',
        message: 'GEMINI_API_KEY não configurada no ambiente.',
        checkedAt: new Date().toISOString()
      };
    }

    const start = Date.now();
    try {
      // Teste leve e real com timeout curto
      const ping = this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "ping"
      });
      const timeoutPing = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout Gemini HealthCheck")), 3000));
      await Promise.race([ping, timeoutPing]);

      return {
        status: 'UP',
        latencyMs: Date.now() - start,
        message: 'Google Gemini API respondendo normalmente.',
        checkedAt: new Date().toISOString()
      };
    } catch (err: any) {
      return {
        status: 'DEGRADED',
        latencyMs: Date.now() - start,
        message: `Falha na verificação de saúde do Gemini: ${err.message}`,
        checkedAt: new Date().toISOString()
      };
    }
  }

  public async generate(request: MaiaGenerateRequest): Promise<MaiaGenerateResponse> {
    if (!this.apiKey || !this.ai) {
      throw new Error("[GeminiProvider] GEMINI_API_KEY não configurada no servidor.");
    }

    const start = Date.now();
    const model = request.metadata?.model || this.defaultModel;

    // Configuração de tools para o formato aceito pelo SDK
    let toolsParam: any = undefined;
    if (request.tools && request.tools.length > 0) {
      toolsParam = [{
        functionDeclarations: request.tools.map(t => ({
          name: t.name,
          description: t.description,
          parameters: t.parametersSchema || { type: 'OBJECT', properties: {} }
        }))
      }];
    }

    const config: any = {
      temperature: request.temperature ?? 0.2
    };

    if (toolsParam) {
      config.tools = toolsParam;
    }

    if (request.systemInstruction) {
      config.systemInstruction = request.systemInstruction;
    }

    try {
      const callPromise = this.ai.models.generateContent({
        model,
        contents: request.prompt,
        config
      });

      const timeoutLimit = request.profileType === 'VOICE_REALTIME' ? 3500 : 8000;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout Gemini Provider (${timeoutLimit}ms)`)), timeoutLimit)
      );

      const response: any = await Promise.race([callPromise, timeoutPromise]);
      const latencyMs = Date.now() - start;

      // Extração de Function Calls
      const toolCalls: any[] = [];
      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const fc of response.functionCalls) {
          toolCalls.push({
            name: fc.name,
            args: fc.args || {}
          });
        }
      }

      // Registro de tokens reais do provider (se informados) ou null (NUNCA inventar)
      const usage = response.usageMetadata;
      const tokensPrompt = usage?.promptTokenCount ?? undefined;
      const tokensCompletion = usage?.candidatesTokenCount ?? undefined;

      return {
        text: response.text || undefined,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        provider: this.name,
        model,
        tokensPrompt,
        tokensCompletion,
        costEstimated: null, // Provedor não fornece custo diretamente
        latencyMs,
        finishReason: response.candidates?.[0]?.finishReason || 'STOP'
      };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      throw new Error(`[GeminiProvider Error (${latencyMs}ms)]: ${err.message}`);
    }
  }
}
