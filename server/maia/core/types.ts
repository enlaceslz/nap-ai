/**
 * MAIA V3 — Core Types
 * Arquitetura Oficial Enlace (NAP-AI)
 */

export interface ProviderPlan {
  nome: string;
  velocidade: string;
  preco: string;
  descricao?: string;
}

export interface ProviderProfile {
  tenantId: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  horarioAtendimento: string;
  planos: ProviderPlan[];
  politicas: Record<string, any>;
  canais: string[];
}

export interface MaiaSecurityContext {
  tenantId: string;
  userId?: string;
  clienteId?: number;
  role?: string;
  permissions: string[];
  channel: string;
  sessionId: string;
  correlationId: string;
  ip?: string;
  userAgent?: string;
  isConfirmed?: boolean;
  callerNumber?: string;
  asteriskUniqueId?: string;
  asteriskChannelId?: string;
  linkedId?: string;
}

export interface MaiaExecutionRequest {
  prompt: string;
  securityContext: MaiaSecurityContext;
  profileOverride?: Partial<ProviderProfile>;
  channelData?: Record<string, any>;
  profileType?: 'ECONOMICO' | 'BALANCEADO' | 'ALTA_CAPACIDADE' | 'VOICE_REALTIME' | 'FALLBACK';
}

export interface MaiaExecutionResponse {
  sessionId: string;
  turnId: string;
  resposta: string;
  toolExecutada?: string;
  toolDados?: any;
  status: 'COMPLETED' | 'CONFIRMATION_REQUIRED' | 'FORBIDDEN' | 'AI_UNAVAILABLE' | 'GUARD_BLOCKED';
  provider: string;
  model: string;
  tokens?: { prompt?: number; completion?: number; total?: number };
  costEstimated?: number | null;
  latencyMs: number;
  guardClassification?: string;
  correlationId: string;
}
