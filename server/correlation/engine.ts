import { db } from '../../src/db';
import { clientes, ipam_reservations } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import { IPAMService } from '../ipam/service';
import { HelpDeskService } from '../helpdesk/service';

export class CorrelationEngine {
  private ipam: IPAMService;
  private helpdesk: HelpDeskService;

  constructor() {
    this.ipam = new IPAMService();
    this.helpdesk = new HelpDeskService();
  }

  /**
   * FASE 10, 11 e 12 (SGP + GIS + OLT/GenieACS + IPAM)
   * Agrega o contexto completo do assinante para o NOC ou para a IA
   */
  async getCustomerContext(customerId: number) {
    // 1. SGP (CRM Local no NAP)
    const [customer] = await db.select().from(clientes).where(eq(clientes.id, customerId));
    if (!customer) throw new Error('Cliente não encontrado no SGP');

    // 2. IPAM (Nautobot via bindings locais)
    const allocations = await db.select().from(ipam_reservations).where(eq(ipam_reservations.customer_id, customerId));
    
    // Separar IPv4 e IPv6 PD
    const ipv4 = allocations.find(a => a.purpose === 'WAN Allocation')?.ip_address || 'Não alocado';
    const ipv6_pd = allocations.find(a => a.purpose === 'IPv6 Prefix Delegation (PD)')?.ip_address || 'Não delegado';

    // 3. OLT Manager / GenieACS (Abstração da Camada de Acesso)
    // Numa implementação real, faríamos fetch no serviço de OLT/GenieACS do NAP
    const accessNetwork = {
      olt: 'BNG-01 / OLT-03',
      pon: '1/2/8',
      ont_serial: 'HWTC12345678',
      optical_power: '-22.5 dBm',
      status: 'online',
      last_comm: new Date().toISOString()
    };

    // 4. GIS (Abstração do Mapa)
    const geo = {
      latitude: '-23.55052',
      longitude: '-46.633308',
      cto: 'CTO-023',
      pop: 'POP-CENTRO'
    };

    return {
      success: true,
      data: {
        customer: {
          id: customer.id,
          nome: customer.nome,
          contrato: customer.contrato,
          status: customer.status,
        },
        network: accessNetwork,
        geo,
        ipam: {
          ipv4,
          ipv6_pd
        }
      }
    };
  }

  /**
   * Correlação Reversa: Recebe um Alarme do Zabbix (ex: OLT Down)
   * Encontra a CTO/PON afetada (GIS/OLT), localiza os clientes (SGP), 
   * e abre um Incidente Massivo no Help Desk (Zammad).
   */
  async processNetworkAlarm(alarmData: any) {
    // 1. Interpretar alarme (Zabbix)
    const { host, trigger, severity } = alarmData;

    // 2. Localizar no NSoT / OLT Manager
    // Ex: Host "OLT-03" -> 500 clientes afetados
    const affectedCustomers = 500; // Mock

    // 3. Gerar Ticket Massivo no Zammad via NAP Help Desk
    const ticketData = {
      title: `[ALERTA NOC] ${trigger} em ${host}`,
      description: `Alarme Crítico gerado pelo Zabbix.\nEquipamento: ${host}\nSeveridade: ${severity}\nClientes Afetados: ~${affectedCustomers}\nFavor iniciar troubleshooting L2/L3.`,
      status: 'novo',
      priority: severity === 'high' ? 'alta' : 'normal',
      source: 'zabbix'
    };

    const ticket = await this.helpdesk.createTicket(ticketData, 'system-zabbix');

    return {
      success: true,
      message: 'Alarme correlacionado e Ticket aberto com sucesso',
      ticket,
      impact: {
        customersAffected: affectedCustomers,
        host
      }
    };
  }
}
