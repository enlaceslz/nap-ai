/**
 * MAIA V3 — Communications NOC Copilot (Telegram & Events)
 * Maia Specialist = NOC
 * Utiliza o MaiaCore com AI Gateway e Policy Engine.
 */

import { MaiaCore } from "../maia/core/MaiaCore";
import { MaiaSecurityContextManager } from "../maia/security/MaiaSecurityContext";

export class NocCopilot {
  private maiaCore = MaiaCore.getInstance();

  public async ask(prompt: string, role: string, napUserId: string): Promise<string> {
    const securityContext = MaiaSecurityContextManager.buildContext({
      channel: 'telegram',
      user: {
        id: napUserId || 'telegram_operator',
        nome: `Operador Telegram (${napUserId || 'NOC'})`,
        role: (role as any) || 'NOC',
        permissions: ['ZABBIX_READ', 'ONU_READ', 'FIELD_READ', 'CUSTOMER_READ', 'IPAM_READ', 'FIELD_WRITE']
      }
    });

    try {
      const result = await this.maiaCore.execute({
        prompt: `[TELEGRAM NOC COPILOT]: ${prompt}`,
        securityContext,
        profileType: 'ALTA_CAPACIDADE'
      });

      return result.resposta || "Análise operacional concluída.";
    } catch (error: any) {
      console.error("[NOC Copilot Telegram Error]:", error);
      return "🚨 Erro ao processar IA no canal do Telegram: Falha na comunicação com o Maia Core.";
    }
  }
}
