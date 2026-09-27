/**
 * MAIA V3 — Client Context Resolver
 * Resolução server-side estrita de identidade, contrato, equipamentos e ONUs.
 * Nunca confia cegamente em IDs enviados pelo modelo de IA.
 */

import { db, isDatabaseConnected } from "../../../src/db/index";
import { clientes, contratos, ordens_servico } from "../../../src/db/schema";
import { eq, or, and, desc } from "drizzle-orm";
import { ErpFactory } from "../../integrations/erp/ErpFactory";
import { Customer360Store } from "../../customer360_service";

export type ResolutionStatus = 'RESOLVED' | 'NOT_FOUND' | 'AMBIGUOUS' | 'UNAVAILABLE';

export interface ResolvedCustomerContext {
  status: ResolutionStatus;
  clienteId?: number;
  nome?: string;
  documento?: string;
  telefone?: string;
  contratoId?: string;
  equipamentoSerial?: string;
  onuAutenticada?: boolean;
  message?: string;
}

export class ClientContextResolver {
  /**
   * Resolve a identidade do cliente prioritariamente pelo contexto autenticado de sessão
   * ou por busca determinística única em PostgreSQL / ERP.
   */
  public static async resolve(params: {
    authenticatedClienteId?: number;
    cpf_cnpj?: string;
    telefone?: string;
    serialNumber?: string;
  }): Promise<ResolvedCustomerContext> {
    // 1. Identidade Autenticada de Sessão tem precedência absoluta
    if (params.authenticatedClienteId) {
      if (isDatabaseConnected) {
        try {
          const rows = await db.select().from(clientes).where(eq(clientes.id, params.authenticatedClienteId)).limit(2);
          if (rows.length === 1) {
            const c = rows[0];
            const serial = await this.lookupCustomerSerial(c.id);
            return {
              status: 'RESOLVED',
              clienteId: c.id,
              nome: c.nome,
              documento: c.documento,
              telefone: c.telefone || undefined,
              equipamentoSerial: serial || undefined,
              onuAutenticada: Boolean(serial)
            };
          }
        } catch (dbErr) {
          console.warn('[ClientContextResolver] Falha ao consultar PostgreSQL:', dbErr);
        }
      }

      // Se autenticado mas DB offline, retorna resolvido com o ID seguro da sessão
      return {
        status: 'RESOLVED',
        clienteId: params.authenticatedClienteId
      };
    }

    // 2. Se nenhuma identidade autenticada for fornecida, busca por CPF/CNPJ
    const cleanDoc = (params.cpf_cnpj || '').replace(/\D/g, '');
    const cleanTel = (params.telefone || '').replace(/\D/g, '');

    if (!cleanDoc && !cleanTel && !params.serialNumber) {
      return {
        status: 'NOT_FOUND',
        message: 'Nenhum identificador válido (sessão autenticada, CPF/CNPJ ou telefone) foi fornecido.'
      };
    }

    if (!isDatabaseConnected) {
      // Sem PostgreSQL conectado em produção, não inventa resolução
      return {
        status: 'UNAVAILABLE',
        message: 'Banco de dados PostgreSQL indisponível para resolução determinística de cliente.'
      };
    }

    try {
      let matchedClientes: any[] = [];

      if (cleanDoc) {
        matchedClientes = await db.select().from(clientes)
          .where(eq(clientes.documento, cleanDoc))
          .limit(3);
      } else if (cleanTel && cleanTel.length >= 8) {
        matchedClientes = await db.select().from(clientes)
          .where(eq(clientes.telefone, cleanTel))
          .limit(3);
      }

      if (matchedClientes.length === 0) {
        return {
          status: 'NOT_FOUND',
          message: 'Cliente não localizado no cadastro oficial do provedor.'
        };
      }

      if (matchedClientes.length > 1) {
        return {
          status: 'AMBIGUOUS',
          message: 'Múltiplos cadastros localizados para o identificador. Autenticação adicional é obrigatória.'
        };
      }

      const c = matchedClientes[0];
      const serial = await this.lookupCustomerSerial(c.id);

      return {
        status: 'RESOLVED',
        clienteId: c.id,
        nome: c.nome,
        documento: c.documento,
        telefone: c.telefone || undefined,
        equipamentoSerial: serial || undefined,
        onuAutenticada: Boolean(serial)
      };
    } catch (err: any) {
      return {
        status: 'UNAVAILABLE',
        message: `Falha na resolução de identidade: ${err.message}`
      };
    }
  }

  /**
   * Localiza o serial da ONU vinculada ao contrato do cliente
   */
  private static async lookupCustomerSerial(clienteId: number): Promise<string | null> {
    try {
      const cust = Customer360Store.getInstance().getCustomerById(clienteId);
      if (cust?.technical?.onuSerial) {
        return cust.technical.onuSerial;
      }

      if (isDatabaseConnected) {
        const rows = await db.select({ onuSerial: ordens_servico.onuSerial })
          .from(ordens_servico)
          .where(eq(ordens_servico.clienteId, clienteId))
          .orderBy(desc(ordens_servico.id))
          .limit(1);
        if (rows.length > 0 && rows[0].onuSerial) {
          return rows[0].onuSerial;
        }
      }
    } catch {
      // Ignora erro de query
    }
    return null;
  }
}
