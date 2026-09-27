/**
 * MAIA V3 — AI Gateway Types
 */

export interface ProviderHealth {
  status: 'UP' | 'DOWN' | 'DEGRADED' | 'NOT_CONFIGURED';
  latencyMs?: number;
  message?: string;
  checkedAt: string;
}

export interface MaiaToolDeclaration {
  name: string;
  description: string;
  parametersSchema?: Record<string, any>;
}

export interface MaiaToolCallRequest {
  name: string;
  args: Record<string, any>;
}

export interface MaiaGenerateRequest {
  prompt: string;
  systemInstruction?: string;
  tools?: MaiaToolDeclaration[];
  temperature?: number;
  maxOutputTokens?: number;
  profileType?: 'ECONOMICO' | 'BALANCEADO' | 'ALTA_CAPACIDADE' | 'VOICE_REALTIME' | 'FALLBACK';
  metadata?: Record<string, any>;
}

export interface MaiaGenerateResponse {
  text?: string;
  toolCalls?: MaiaToolCallRequest[];
  provider: string;
  model: string;
  tokensPrompt?: number;
  tokensCompletion?: number;
  costEstimated?: number | null;
  latencyMs: number;
  finishReason?: string;
}

export interface MaiaAIProvider {
  readonly name: string;
  generate(request: MaiaGenerateRequest): Promise<MaiaGenerateResponse>;
  supportsTools(): boolean;
  supportsVision(): boolean;
  supportsAudio(): boolean;
  supportsLiveVoice(): boolean;
  healthCheck(): Promise<ProviderHealth>;
}
