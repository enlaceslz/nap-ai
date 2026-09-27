/**
 * MAIA V3 — AI Gateway
 * Orquestra chamadas aos modelos de linguagem através do MaiaProviderRouter,
 * aplicando fallback transparente entre provedores sem quebra de sessão ou segurança.
 */

import { MaiaAIProvider, MaiaGenerateRequest, MaiaGenerateResponse, ProviderHealth } from "./types";
import { MaiaProviderRouter } from "../router/MaiaProviderRouter";

export class MaiaAIGateway {
  private router: MaiaProviderRouter;

  constructor(router?: MaiaProviderRouter) {
    this.router = router || new MaiaProviderRouter();
  }

  public getRouter(): MaiaProviderRouter {
    return this.router;
  }

  /**
   * Executa a inferência utilizando a rota selecionada com failover automático
   */
  public async generateWithFallback(request: MaiaGenerateRequest): Promise<MaiaGenerateResponse> {
    const route = this.router.selectRoute(request);
    const providersToTry = [route.provider, ...route.fallbackChain];

    let lastError: any = null;

    for (const provider of providersToTry) {
      try {
        const response = await provider.generate(request);
        return response;
      } catch (err: any) {
        lastError = err;
        console.warn(`[MaiaAIGateway] Provedor '${provider.name}' falhou. Tentando próximo na cadeia de fallback:`, err.message);
      }
    }

    throw new Error(`[MaiaAIGateway AI_UNAVAILABLE] Todos os provedores de IA falharam na requisição: ${lastError?.message || 'Indisponibilidade geral'}`);
  }

  /**
   * Coleta relatório de saúde de todos os provedores registrados
   */
  public async checkAllProvidersHealth(): Promise<Record<string, ProviderHealth>> {
    const report: Record<string, ProviderHealth> = {};
    const gemini = this.router.getProvider('gemini');
    const nineRouter = this.router.getProvider('9router');

    if (gemini) {
      report['gemini'] = await gemini.healthCheck();
    }
    if (nineRouter) {
      report['9router'] = await nineRouter.healthCheck();
    }

    return report;
  }
}
