/**
 * MAIA V3 — AI Provider Router
 * Roteamento inteligente baseado em perfis (ECONOMICO, BALANCEADO, ALTA_CAPACIDADE, VOICE_REALTIME, FALLBACK)
 * considerando disponibilidade, latência, suporte a ferramentas e modalidades.
 */

import { MaiaAIProvider, MaiaGenerateRequest, MaiaGenerateResponse } from "../gateway/types";
import { GeminiProvider } from "../providers/GeminiProvider";
import { NineRouterProvider } from "../providers/NineRouterProvider";

export type RouterProfile = 'ECONOMICO' | 'BALANCEADO' | 'ALTA_CAPACIDADE' | 'VOICE_REALTIME' | 'FALLBACK';

export interface RouteDecision {
  provider: MaiaAIProvider;
  profile: RouterProfile;
  fallbackChain: MaiaAIProvider[];
  reason: string;
}

export class MaiaProviderRouter {
  private providers: Map<string, MaiaAIProvider> = new Map();
  private defaultProfile: RouterProfile;

  constructor() {
    this.defaultProfile = (process.env.AI_DEFAULT_PROFILE as RouterProfile) || 'BALANCEADO';
    
    // Inicialização dos provedores oficiais
    const gemini = new GeminiProvider();
    const nineRouter = new NineRouterProvider();

    this.registerProvider('gemini', gemini);
    this.registerProvider('9router', nineRouter);
  }

  public registerProvider(key: string, provider: MaiaAIProvider) {
    this.providers.set(key, provider);
  }

  public getProvider(key: string): MaiaAIProvider | undefined {
    return this.providers.get(key);
  }

  /**
   * Decide a rota considerando perfil, complexidade, necessidade de tools e latência
   */
  public selectRoute(request: MaiaGenerateRequest): RouteDecision {
    const profile = request.profileType || this.inferProfile(request);
    const gemini = this.providers.get('gemini')!;
    const nineRouter = this.providers.get('9router')!;

    const hasTools = Boolean(request.tools && request.tools.length > 0);
    const isNineRouterConfigured = Boolean(process.env.NINE_ROUTER_BASE_URL || process.env.GEMINI_BASE_URL);
    const isNineRouterPreferred = process.env.GEMINI_USE_9ROUTER === 'true' || process.env.AI_ROUTER_ENABLED === 'true';

    switch (profile) {
      case 'VOICE_REALTIME':
        // Voz exige menor latência e suporte a live voice
        return {
          provider: gemini.supportsLiveVoice() ? gemini : (isNineRouterConfigured ? nineRouter : gemini),
          profile: 'VOICE_REALTIME',
          fallbackChain: [isNineRouterConfigured ? nineRouter : gemini].filter(p => p !== gemini),
          reason: 'Perfil de baixa latência e suporte a áudio síncrono.'
        };

      case 'ECONOMICO':
        // Texto simples sem tools pesadas: 9router Gateway ou Gemini Flash
        if (isNineRouterConfigured && isNineRouterPreferred) {
          return {
            provider: nineRouter,
            profile: 'ECONOMICO',
            fallbackChain: [gemini],
            reason: 'Roteamento econômico via 9router Gateway com failover para Gemini Flash.'
          };
        }
        return {
          provider: gemini,
          profile: 'ECONOMICO',
          fallbackChain: isNineRouterConfigured ? [nineRouter] : [],
          reason: 'Roteamento econômico via Gemini Flash oficial.'
        };

      case 'ALTA_CAPACIDADE':
        // Diagnóstico técnico denso e raciocínio multi-passo
        return {
          provider: gemini,
          profile: 'ALTA_CAPACIDADE',
          fallbackChain: isNineRouterConfigured ? [nineRouter] : [],
          reason: 'Perfil de alta capacidade para correlação multi-passo.'
        };

      case 'FALLBACK':
        // Modo de emergência/reserva
        if (isNineRouterConfigured) {
          return {
            provider: nineRouter,
            profile: 'FALLBACK',
            fallbackChain: [gemini],
            reason: 'Rota de contingência ativada.'
          };
        }
        return {
          provider: gemini,
          profile: 'FALLBACK',
          fallbackChain: [],
          reason: 'Rota de contingência local.'
        };

      case 'BALANCEADO':
      default:
        // Uso geral do provedor (WhatsApp, Webchat, Suporte NOC)
        if (isNineRouterPreferred && isNineRouterConfigured) {
          return {
            provider: nineRouter,
            profile: 'BALANCEADO',
            fallbackChain: [gemini],
            reason: 'Roteamento balanceado preferencial para 9router Gateway.'
          };
        }
        return {
          provider: gemini,
          profile: 'BALANCEADO',
          fallbackChain: isNineRouterConfigured ? [nineRouter] : [],
          reason: 'Roteamento balanceado oficial via Gemini Flash.'
        };
    }
  }

  /**
   * Inferência dinâmica do perfil caso não seja explicitamente passado
   */
  private inferProfile(request: MaiaGenerateRequest): RouterProfile {
    const promptLower = (request.prompt || '').toLowerCase();
    
    // Telefonia ou áudio
    if (request.metadata?.channel === 'voice' || promptLower.includes('ura') || promptLower.includes('ramal')) {
      return 'VOICE_REALTIME';
    }

    // Diagnósticos complexos de NOC / OLT / BNG / BGP / TR-069
    if (promptLower.includes('pon') || promptLower.includes('olt') || promptLower.includes('zabbix') || promptLower.includes('ipam') || promptLower.includes('bgp') || promptLower.includes('cpe')) {
      return 'ALTA_CAPACIDADE';
    }

    // Consultas simples
    if (promptLower.length < 50 && !request.tools?.length) {
      return 'ECONOMICO';
    }

    return this.defaultProfile;
  }
}
