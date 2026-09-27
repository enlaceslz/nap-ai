/**
 * MAIA V3 — NOC Copilot (Maia Specialist = NOC)
 * Integrado ao MaiaCore e AI Gateway oficial do Enlace.
 * Não duplica clientes de IA nem bypassa políticas de segurança.
 */

import { MaiaCore } from "../maia/core/MaiaCore";
import { MaiaSecurityContextManager } from "../maia/security/MaiaSecurityContext";
import { GisService } from "../gis/gisService";

export class NocCopilot {
  private gisService = GisService.getInstance();
  private maiaCore = MaiaCore.getInstance();

  public async processQuery(prompt: string, history: any[] = []): Promise<string> {
    const securityContext = MaiaSecurityContextManager.buildContext({
      channel: 'noc_copilot',
      user: {
        id: 'noc_specialist',
        nome: 'NOC Operator',
        role: 'NOC',
        permissions: ['ZABBIX_READ', 'ONU_READ', 'FIELD_READ', 'CUSTOMER_READ', 'IPAM_READ']
      }
    });

    try {
      const result = await this.maiaCore.execute({
        prompt: `[NOC COPILOT SPECIALIST]: ${prompt}`,
        securityContext,
        profileType: 'ALTA_CAPACIDADE'
      });

      return result.resposta || "Análise do NOC concluída.";
    } catch (err: any) {
      console.error("[NocCopilot Error]:", err.message);
      return `❌ Erro no processamento do NOC Copilot: ${err.message}`;
    }
  }
}

export const nocCopilotInstance = new NocCopilot();
