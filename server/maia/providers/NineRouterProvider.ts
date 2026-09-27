/**
 * MAIA V3 — 9router Enterprise Provider
 * Provider desacoplado para o Gateway Enlace (9router)
 */

import fetch from "node-fetch";
import { MaiaAIProvider, MaiaGenerateRequest, MaiaGenerateResponse, ProviderHealth } from "../gateway/types";

export class NineRouterProvider implements MaiaAIProvider {
  public readonly name = "9router Gateway";
  private baseUrl: string;
  private apiKey: string;
  private defaultModel: string;

  constructor(baseUrl?: string, apiKey?: string, defaultModel = "gemini-2.5-flash") {
    this.baseUrl = baseUrl !== undefined ? baseUrl : (process.env.NINE_ROUTER_BASE_URL || process.env.GEMINI_BASE_URL || "");
    this.apiKey = apiKey !== undefined ? apiKey : (process.env.NINE_ROUTER_API_KEY || process.env.GEMINI_API_KEY || "");
    this.defaultModel = defaultModel;
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
    return false; // Live Voice via WebSockets do 9router é reservado
  }

  public async healthCheck(): Promise<ProviderHealth> {
    if (!this.baseUrl) {
      return {
        status: 'NOT_CONFIGURED',
        message: 'NINE_ROUTER_BASE_URL não configurada no ambiente.',
        checkedAt: new Date().toISOString()
      };
    }

    const start = Date.now();
    try {
      const url = `${this.baseUrl.replace(/\/$/, '')}/health`;
      const res = await fetch(url, { method: 'GET', headers: { 'Authorization': `Bearer ${this.apiKey}` } });
      const latencyMs = Date.now() - start;

      if (res.ok) {
        return {
          status: 'UP',
          latencyMs,
          message: '9router Gateway online e acessível.',
          checkedAt: new Date().toISOString()
        };
      }

      return {
        status: 'DEGRADED',
        latencyMs,
        message: `9router respondeu com status HTTP ${res.status}`,
        checkedAt: new Date().toISOString()
      };
    } catch (err: any) {
      return {
        status: 'DOWN',
        latencyMs: Date.now() - start,
        message: `Não foi possível conectar ao 9router: ${err.message}`,
        checkedAt: new Date().toISOString()
      };
    }
  }

  public async generate(request: MaiaGenerateRequest): Promise<MaiaGenerateResponse> {
    if (!this.baseUrl) {
      throw new Error("[NineRouterProvider] NINE_ROUTER_BASE_URL não configurada no servidor.");
    }

    const start = Date.now();
    const model = request.metadata?.model || this.defaultModel;

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

    const reqPayload: any = {
      contents: [{ parts: [{ text: request.prompt }] }]
    };

    if (toolsParam) {
      reqPayload.tools = toolsParam;
    }

    const endpoint = `${this.baseUrl.replace(/\/$/, '')}/v1beta/models/${model}:generateContent${this.apiKey ? `?key=${this.apiKey}` : ''}`;

    try {
      const timeoutLimit = request.profileType === 'VOICE_REALTIME' ? 3500 : 8000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutLimit);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
        },
        body: JSON.stringify(reqPayload),
        signal: controller.signal as any
      }).finally(() => clearTimeout(timeoutId));

      if (!res.ok) {
        throw new Error(`9router HTTP ${res.status}: ${res.statusText}`);
      }

      const data: any = await res.json();
      const latencyMs = Date.now() - start;

      const candidate = data.candidates?.[0];
      const part = candidate?.content?.parts?.[0];

      const toolCalls: any[] = [];
      if (part?.functionCall) {
        toolCalls.push({
          name: part.functionCall.name,
          args: part.functionCall.args || {}
        });
      }

      const usage = data.usageMetadata;
      const tokensPrompt = usage?.promptTokenCount ?? undefined;
      const tokensCompletion = usage?.candidatesTokenCount ?? undefined;

      return {
        text: part?.text || undefined,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        provider: this.name,
        model,
        tokensPrompt,
        tokensCompletion,
        costEstimated: null,
        latencyMs,
        finishReason: candidate?.finishReason || 'STOP'
      };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      throw new Error(`[NineRouterProvider Error (${latencyMs}ms)]: ${err.message}`);
    }
  }
}
