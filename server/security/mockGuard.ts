import { appendAuditLog } from './httpSecurity';

export class ServiceUnavailableError extends Error {
  public readonly serviceName: string;
  public readonly statusCode: number = 503;

  constructor(serviceName: string, reason?: string) {
    super(`Serviço ${serviceName} indisponível. Operação não realizada.${reason ? ` Detalhes: ${reason}` : ''}`);
    this.name = 'ServiceUnavailableError';
    this.serviceName = serviceName;
  }
}

/**
 * Guardião centralizado de produção para prevenir uso indevido de Mocks/Fallbacks.
 * 
 * Regra de Homologação e Produção (NODE_ENV=production):
 * - É estritamente proibido retornar mocks ou dados simulados em produção para
 *   operações críticas de negócio (ex: C6 Bank, SGP/ERP, Helpdesk Zammad, Telefonia Asterisk).
 * - Quando o serviço real não estiver configurado ou falhar, lança exceção ServiceUnavailableError (503)
 *   e gera registro na trilha de auditoria com severidade 'critico' e status 'bloqueado'.
 * 
 * Em Desenvolvimento / Preview / Testes (NODE_ENV !== 'production'):
 * - Emite aviso explícito no console [MOCK] [DEV ONLY] e permite fallback em memória para não bloquear desenvolvimento.
 */
export function assertRealService(serviceName: string, detail?: string): void {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const errorMsg = `Serviço ${serviceName} indisponível. Operação não realizada.${detail ? ` Detalhes: ${detail}` : ''}`;
    
    // Registrar violação/bloqueio na trilha de auditoria append-only
    try {
      appendAuditLog({
        usuario: 'SISTEMA_SEGURANCA',
        modulo: 'MOCK_GUARD',
        acao: 'MOCK_BLOQUEADO_PRODUCAO',
        recurso: serviceName,
        resultado: 'bloqueado',
        detalhes: `Tentativa de fallback para simulação em memória do serviço ${serviceName} bloqueada em produção. ${detail || 'Serviço externo indisponível ou credenciais ausentes.'}`,
        severidade: 'critico',
        status: 'bloqueado'
      });
    } catch (e) {
      // Ignora falha de log para não mascarar a exceção principal
    }

    throw new ServiceUnavailableError(serviceName, detail);
  }

  // Em desenvolvimento e testes: permite simulação emitindo warning explícito
  console.warn(`[MOCK] [DEV ONLY] Usando fallback/mock para serviço '${serviceName}' (${detail || 'Sem conexão com serviço real'}).`);
}

/**
 * Verifica se o ambiente autoriza o uso de simulação / mock
 * Somente permitido em: development, test, preview.
 * NUNCA em: production.
 */
export function isMockAllowed(): boolean {
  const env = (process.env.NODE_ENV || 'development').toLowerCase();
  if (env === 'production') {
    return false;
  }
  return ['development', 'test', 'preview'].includes(env) || env === '';
}

export const areMocksAllowed = isMockAllowed;

export function assertNoMockAllowed(serviceName: string): void {
  if (!isMockAllowed()) {
    throw new Error(`[MOCK GUARD BLOCKED] Mock data is disabled in production for service: ${serviceName}`);
  }
}
