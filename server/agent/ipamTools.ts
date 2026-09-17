import { FunctionDeclaration, Type } from "@google/genai";
import { IPAMService } from "../ipam/service";
import { CorrelationEngine } from "../correlation/engine";

const ipamService = new IPAMService();
const correlationEngine = new CorrelationEngine();

export const mcpIpamTools: Record<string, { declaration: FunctionDeclaration, execute: (args: any) => Promise<any> }> = {
  // --- READ TOOLS ---
  ipam_search_customer: {
    declaration: {
      name: "ipam_search_customer",
      description: "Recupera o contexto unificado completo de um cliente (IPv4, IPv6 PD, status de rede e OLT, e dados do SGP) usando a Correlation Engine do NAP.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          customerId: { type: Type.INTEGER, description: "ID numérico do cliente no SGP" }
        },
        required: ["customerId"]
      }
    },
    execute: async (args: { customerId: number }) => {
      try {
        const result = await correlationEngine.getCustomerContext(args.customerId);
        return result;
      } catch (e: any) {
        return { error: `Falha ao buscar contexto: ${e.message}` };
      }
    }
  },
  
  // --- WRITE TOOLS ---
  ipam_allocate_ip: {
    declaration: {
      name: "ipam_allocate_ip",
      description: "Aloca o próximo IP WAN disponível em um prefixo especificado para um cliente.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          prefixId: { type: Type.STRING, description: "O ID/UUID do prefixo base no Nautobot (ex: pool do BNG)" },
          customerId: { type: Type.INTEGER, description: "ID numérico do cliente no SGP" },
          purpose: { type: Type.STRING, description: "A finalidade dessa alocação (ex: Conexão Fibra)" }
        },
        required: ["prefixId", "customerId"]
      }
    },
    execute: async (args: { prefixId: string, customerId: number, purpose?: string }) => {
      try {
        const result = await ipamService.allocateNextAvailableIP(args.prefixId, args.customerId, args.purpose || 'Alocação IA');
        return { success: true, message: `IP alocado com sucesso. ID da reserva: ${result.id}`, ip: result.ip_address };
      } catch (e: any) {
        return { error: `Falha ao alocar IP: ${e.message}` };
      }
    }
  },

  ipam_delegate_ipv6: {
    declaration: {
      name: "ipam_delegate_ipv6",
      description: "Recorta e delega um prefixo IPv6 (PD - Prefix Delegation), geralmente /56, a partir de um bloco /48 de roteador BNG para um cliente.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          parentPrefixId: { type: Type.STRING, description: "ID/UUID do prefixo IPv6 PAI no Nautobot (ex: /48 do BNG)" },
          customerId: { type: Type.INTEGER, description: "ID numérico do cliente no SGP" },
          prefixLength: { type: Type.INTEGER, description: "Tamanho do prefixo delegado (padrão 56)" }
        },
        required: ["parentPrefixId", "customerId"]
      }
    },
    execute: async (args: { parentPrefixId: string, customerId: number, prefixLength?: number }) => {
      try {
        const result = await ipamService.delegateIPv6Prefix(args.parentPrefixId, args.customerId, args.prefixLength || 56);
        return { success: true, message: `IPv6 Delegado com sucesso. UUID Base: ${result.backendId}` };
      } catch (e: any) {
        return { error: `Falha ao delegar IPv6: ${e.message}` };
      }
    }
  }
};
