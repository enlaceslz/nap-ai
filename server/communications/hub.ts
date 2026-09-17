import { TelegramGateway } from './telegramGateway';
import { CorrelationEngine } from '../correlation/engine';

export class CommunicationsHub {
  private telegram: TelegramGateway;
  private correlation: CorrelationEngine;

  constructor() {
    this.telegram = new TelegramGateway();
    this.correlation = new CorrelationEngine();
  }

  /**
   * Ponto central para receber eventos (ex: Zabbix via webhook local)
   * e rotear para os canais corretos (Telegram, e-mail, push)
   */
  async routeEvent(eventSource: string, payload: any) {
    if (eventSource === 'zabbix') {
      return this.handleZabbixAlarm(payload);
    }
    
    if (eventSource === 'field_service') {
      return this.handleFieldUpdate(payload);
    }

    throw new Error(`Event source ${eventSource} not recognized`);
  }

  private async handleZabbixAlarm(payload: any) {
    // 1. Processar no motor de correlação (Abre ticket, encontra clientes)
    const correlationResult = await this.correlation.processNetworkAlarm(payload);
    
    // 2. Montar mensagem formatada
    const { host, trigger, severity } = payload;
    const impact = correlationResult.impact?.customersAffected || 'Desconhecido';
    const ticketId = correlationResult.ticket?.id || 'N/A';

    const emoji = severity === 'high' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️';
    
    const msg = `
${emoji} <b>ALERTA NOC</b> ${emoji}
<b>Ativo:</b> ${host}
<b>Evento:</b> ${trigger}
<b>Severidade:</b> ${severity}

<b>Impacto Estimado:</b> ~${impact} clientes
<b>Ticket Aberto:</b> #${ticketId}

👉 <i>Acesse o NAP Help Desk para iniciar a tratativa.</i>
    `.trim();

    // 3. Disparar pro grupo do NOC no Telegram
    await this.telegram.sendMessage(msg);

    return correlationResult;
  }

  private async handleFieldUpdate(payload: any) {
    const { orderId, status, techName, location } = payload;
    
    const msg = `
🛠️ <b>ATUALIZAÇÃO DE CAMPO</b>
<b>Técnico:</b> ${techName}
<b>OS:</b> #${orderId}
<b>Novo Status:</b> ${status}

📍 <a href="https://maps.google.com/?q=${location.lat},${location.lng}">Ver no Radar</a>
    `.trim();

    await this.telegram.sendMessage(msg);
    return { success: true };
  }
}
