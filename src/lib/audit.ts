import { logAuditEventToFirestore } from './firebase';
import type { AuditLogEntry } from '../types';

export async function registrarAcaoAuditoria(params: {
  modulo: 'Acessos' | 'SGP / ERP' | 'GenieACS (TR-069)' | 'NOC / Zabbix' | 'Campanhas' | 'WhatsApp WABA' | 'Segurança' | 'Configurações' | 'Sistema' | string;
  acao: string;
  detalhes: string;
  categoria?: 'acesso' | 'configuracao' | 'disparo' | 'comando' | 'seguranca';
  severidade?: 'info' | 'atencao' | 'critico';
  usuario?: string;
  usuarioEmail?: string;
  usuarioRole?: string;
  payloadAntes?: any;
  payloadDepois?: any;
  status?: 'sucesso' | 'falha';
}): Promise<void> {
  let userNome = params.usuario;
  let userEmail = params.usuarioEmail;
  let userRole = params.usuarioRole;

  if (!userNome) {
    try {
      const raw = localStorage.getItem('nap_auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        userNome = parsed.name || parsed.email || 'Operador';
        userEmail = parsed.email || '';
        userRole = parsed.role || 'operador';
      }
    } catch {}
  }

  const payload = {
    modulo: params.modulo,
    acao: params.acao,
    detalhes: params.detalhes,
    categoria: params.categoria || 'configuracao',
    severidade: params.severidade || 'info',
    usuario: userNome || 'Operador NAP',
    usuarioEmail: userEmail || '',
    usuarioRole: userRole || 'operador',
    payloadAntes: params.payloadAntes || null,
    payloadDepois: params.payloadDepois || null,
    status: params.status || 'sucesso',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server'
  };

  try {
    // 1. Enviar para API Express / Node.js
    await fetch('/api/auditoria', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});

    // 2. Persistir no Firestore (coleção imutável para compliance)
    await logAuditEventToFirestore({
      usuario: payload.usuario,
      modulo: payload.modulo,
      acao: payload.acao,
      detalhes: payload.detalhes,
      categoria: payload.categoria,
      severidade: payload.severidade,
      status: payload.status,
      payloadAntes: payload.payloadAntes,
      payloadDepois: payload.payloadDepois
    });
  } catch (err) {
    console.warn('Erro ao processar auditoria:', err);
  }
}
