import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Server, Router, RefreshCw, CheckCircle2, AlertTriangle, XCircle, 
  ExternalLink, Activity, Wifi, ShieldCheck, Clock, Zap, ChevronDown, 
  Database, Radio, ArrowUpRight
} from 'lucide-react';
import { useGenieACSMonitor } from '../hooks/useGenieACSMonitor';

export interface SyncStatusData {
  sucesso: boolean;
  timestamp: string;
  status_geral: 'operacional' | 'atencao' | 'critico';
  uptime_pct: number;
  ultima_sincronizacao: string;
  sgp: {
    nome: string;
    protocolo: string;
    endpoint: string;
    status: 'online' | 'degradado' | 'offline';
    latencia_ms: number;
    modo: string;
    clientes_sincronizados: number;
    faturas_sincronizadas: number;
    desbloqueios_pendentes: number;
    ultima_resposta: string;
  };
  genieacs: {
    nome: string;
    protocolo: string;
    endpoint: string;
    status: 'online' | 'degradado' | 'offline';
    latencia_ms: number;
    total_cpes: number;
    cpes_online: number;
    cpes_offline: number;
    alarmes_opticos: number;
    ultima_resposta: string;
  };
  telefonia?: {
    nome: string;
    status: string;
    latencia_ms: number;
    ramais_ativos: number;
  };
}

interface SyncStatusMonitorProps {
  variant?: 'topbar' | 'card';
  className?: string;
}

export default function SyncStatusMonitor({ variant = 'topbar', className = '' }: SyncStatusMonitorProps) {
  const [data, setData] = useState<SyncStatusData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Hook de serviço dedicado para validação periódica da conexão GenieACS
  const acsMonitor = useGenieACSMonitor({ intervalMs: 15000 });

  // Busca o status atual das APIs
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/sync/status');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.warn('Falha ao obter status de sincronização:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000); // Polling a cada 15s
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Fecha o popover ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Execução de sincronização manual imediata
  const handleTriggerSync = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSyncing(true);
    setSyncSuccessMsg(null);
    try {
      const [res] = await Promise.all([
        fetch('/api/sync/executar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }),
        acsMonitor.revalidate()
      ]);
      if (res.ok) {
        const result = await res.json();
        setSyncSuccessMsg(result.mensagem || 'Sincronização concluída!');
        await fetchStatus();
        setTimeout(() => setSyncSuccessMsg(null), 3500);
      }
    } catch {
      setSyncSuccessMsg('Erro ao forçar sincronização.');
      setTimeout(() => setSyncSuccessMsg(null), 3000);
    } finally {
      setSyncing(false);
    }
  };

  // Helper de tempo relativo
  const getRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Nunca';
    const diffSeconds = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
    if (diffSeconds < 10) return 'Agora mesmo';
    if (diffSeconds < 60) return `Há ${diffSeconds}s`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `Há ${diffMinutes} min`;
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status?: 'online' | 'degradado' | 'offline') => {
    if (status === 'online') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Online
        </span>
      );
    }
    if (status === 'degradado') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Instável
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
        Offline
      </span>
    );
  };

  const getLatencyColor = (ms?: number) => {
    if (!ms) return 'text-slate-400';
    if (ms < 50) return 'text-emerald-400';
    if (ms < 120) return 'text-amber-400';
    return 'text-rose-400';
  };

  // Valores unificados de telemetria GenieACS vindos do hook periódico
  const acsStatus: 'online' | 'degradado' | 'offline' = 
    acsMonitor.status === 'validando' 
      ? (data?.genieacs?.status || 'online') 
      : (acsMonitor.status as 'online' | 'degradado' | 'offline');
  const acsLatency = acsMonitor.latency || data?.genieacs?.latencia_ms || 15;
  const acsEndpoint = acsMonitor.endpoint || data?.genieacs?.endpoint || 'http://127.0.0.1:7557';
  const acsOnlineCount = acsMonitor.devices.online || data?.genieacs?.cpes_online || 0;
  const acsTotalCount = acsMonitor.devices.total || data?.genieacs?.total_cpes || 0;
  const acsAlarms = acsMonitor.devices.alarmes_opticos ?? (data?.genieacs?.alarmes_opticos || 0);

  // -------------------------------------------------------------
  // VARIANTE: TOPBAR (Botão interativo com flyout)
  // -------------------------------------------------------------
  if (variant === 'topbar') {
    const isHealthy = data?.sgp?.status === 'online' && acsStatus === 'online';

    return (
      <div className={`relative ${className}`} ref={popoverRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Status de Sincronização SGP e GenieACS"
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-white/10 hover:border-white/20 transition-all text-xs font-medium text-slate-300 active:scale-95"
          title="Clique para abrir detalhes da sincronização SGP e GenieACS"
        >
          {/* SGP LED */}
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${data?.sgp?.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-[11px] font-bold text-slate-300">SGP</span>
            <span className={`font-mono text-[10px] font-bold ${getLatencyColor(data?.sgp?.latencia_ms)}`}>
              {data?.sgp?.latencia_ms ? `${data?.sgp?.latencia_ms}ms` : '--'}
            </span>
          </div>

          <span className="text-slate-600">|</span>

          {/* GenieACS LED (Validado em Tempo Real via Hook) */}
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${acsStatus === 'online' ? 'bg-emerald-400 animate-pulse' : (acsStatus === 'degradado' ? 'bg-amber-400' : 'bg-rose-400')}`} />
            <span className="text-[11px] font-bold text-slate-300">ACS</span>
            <span className={`font-mono text-[10px] font-bold ${getLatencyColor(acsLatency)}`}>
              {acsLatency ? `${acsLatency}ms` : '--'}
            </span>
            {acsMonitor.validating && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" title="Validando conexão..." />
            )}
          </div>

          <ChevronDown size={13} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* POPOVER / FLYOUT DETALHADO */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-96 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl p-4 z-50 text-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header do Popover */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Activity size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-outfit">Sincronização em Tempo Real</h4>
                  <p className="text-[10px] text-slate-400">Gateway Telecom • Uptime {data?.uptime_pct || 99.9}%</p>
                </div>
              </div>

              <button
                onClick={handleTriggerSync}
                disabled={syncing || acsMonitor.validating}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-bold disabled:opacity-50"
                title="Forçar validação e sincronização agora"
              >
                <RefreshCw size={13} className={(syncing || acsMonitor.validating) ? 'animate-spin text-blue-400' : ''} />
                <span className="hidden sm:inline">{(syncing || acsMonitor.validating) ? 'Sync...' : 'Atualizar'}</span>
              </button>
            </div>

            {syncSuccessMsg && (
              <div className="mt-3 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
                <span>{syncSuccessMsg}</span>
              </div>
            )}

            {/* Painel do SGP */}
            <div className="mt-3.5 p-3 rounded-xl bg-slate-950 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server size={15} className="text-blue-400" />
                  <div>
                    <span className="text-xs font-bold text-white block leading-tight">SGP (ERP Billing)</span>
                    <span className="text-[10px] text-slate-400 font-mono block">{data?.sgp?.protocolo || 'REST API'}</span>
                  </div>
                </div>
                {getStatusBadge(data?.sgp?.status)}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 text-[11px]">
                <div>
                  <span className="text-slate-500 text-[10px] block">Latência</span>
                  <span className={`font-mono font-bold ${getLatencyColor(data?.sgp?.latencia_ms)}`}>
                    {data?.sgp?.latencia_ms} ms
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Clientes Espelhados</span>
                  <span className="font-mono font-bold text-slate-200">
                    {data?.sgp?.clientes_sincronizados} ativos
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 text-[10px] block">Endpoint</span>
                  <span className="font-mono text-[10px] text-slate-400 truncate block">
                    {data?.sgp?.endpoint}
                  </span>
                </div>
              </div>
            </div>

            {/* Painel do GenieACS (Validado em Tempo Real via Hook) */}
            <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Router size={15} className="text-purple-400" />
                  <div>
                    <span className="text-xs font-bold text-white block leading-tight">GenieACS (TR-069)</span>
                    <span className="text-[10px] text-slate-400 font-mono block">{acsMonitor.protocolo || 'CWMP / NBI'}</span>
                  </div>
                </div>
                {getStatusBadge(acsStatus)}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5 text-[11px]">
                <div>
                  <span className="text-slate-500 text-[10px] block">Latência</span>
                  <span className={`font-mono font-bold ${getLatencyColor(acsLatency)}`}>
                    {acsLatency} ms
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">CPEs Online</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {acsOnlineCount} / {acsTotalCount}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Atenuação Óptica</span>
                  <span className={`font-mono font-bold ${acsAlarms ? 'text-amber-400' : 'text-slate-400'}`}>
                    {acsAlarms ? `${acsAlarms} alerta` : 'Normal'}
                  </span>
                </div>
                <div className="col-span-3">
                  <span className="text-slate-500 text-[10px] block">NBI Endpoint Configurado</span>
                  <span className="font-mono text-[10px] text-slate-400 truncate block">
                    {acsEndpoint}
                  </span>
                </div>
              </div>

              {/* Histórico Recente de Pings */}
              {acsMonitor.history.length > 0 && (
                <div className="pt-2 border-t border-white/5">
                  <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Pings Recentes (GenieACS NBI)</span>
                  <div className="flex items-center gap-1 overflow-x-auto">
                    {acsMonitor.history.slice(-6).map((h, idx) => (
                      <span 
                        key={idx} 
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 ${getLatencyColor(h.latency)} border border-white/5`}
                        title={`${h.timestamp} • ${h.status}`}
                      >
                        {h.latency}ms
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer com última sincronização */}
            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
              <div className="flex items-center gap-1">
                <Clock size={12} className="text-slate-500" />
                <span>Último sync: <strong className="text-slate-300">{getRelativeTime(data?.ultima_sincronizacao)}</strong></span>
              </div>
              <span className="text-blue-400 font-medium">Ciclo: 15s</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VARIANTE: CARD DEDICADO (Para Dashboards e Painel Analytics)
  // -------------------------------------------------------------
  return (
    <div className={`bg-slate-900 border border-white/10 rounded-2xl p-5 space-y-4 ${className}`}>
      {/* Header do Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Activity size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base font-outfit">Status de Sincronização & Telecom</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                Tempo Real
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Monitoramento contínuo da comunicação com o SGP (ERP) e GenieACS (TR-069)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerSync}
            disabled={syncing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
          </button>
        </div>
      </div>

      {syncSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{syncSuccessMsg}</span>
        </div>
      )}

      {/* Grid de Serviços Integrados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card SGP */}
        <div className="p-4 rounded-xl bg-slate-950 border border-white/5 hover:border-white/10 transition-colors space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <Server size={17} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">SGP ERP Telecom</h4>
                <span className="text-[10px] text-slate-400 font-mono">Faturamento, Clientes & Contratos</span>
              </div>
            </div>
            {getStatusBadge(data?.sgp?.status)}
          </div>

          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-white/5 border border-white/5 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Latência</span>
              <span className={`font-mono font-bold text-sm ${getLatencyColor(data?.sgp?.latencia_ms)}`}>
                {data?.sgp?.latencia_ms || '--'} ms
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Clientes Sync</span>
              <span className="font-mono font-bold text-sm text-slate-200">
                {data?.sgp?.clientes_sincronizados || 0}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Modo</span>
              <span className="font-mono font-bold text-sm text-slate-200 capitalize">
                {data?.sgp?.modo || 'Sandbox'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="font-mono truncate max-w-[200px]" title={data?.sgp?.endpoint}>
              {data?.sgp?.endpoint}
            </span>
            <span className="text-emerald-400 font-bold">{data?.sgp?.ultima_resposta}</span>
          </div>
        </div>

        {/* Card GenieACS */}
        <div className="p-4 rounded-xl bg-slate-950 border border-white/5 hover:border-white/10 transition-colors space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <Router size={17} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-white">GenieACS (TR-069)</h4>
                  {acsMonitor.validating && (
                    <span className="text-[10px] font-mono text-blue-400 animate-pulse">
                      Validando...
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Telemetria Óptica & Wi-Fi CPE</span>
              </div>
            </div>
            {getStatusBadge(acsStatus)}
          </div>

          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-white/5 border border-white/5 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Latência</span>
              <span className={`font-mono font-bold text-sm ${getLatencyColor(acsLatency)}`}>
                {acsLatency || '--'} ms
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">ONUs Online</span>
              <span className="font-mono font-bold text-sm text-emerald-400">
                {acsOnlineCount} / {acsTotalCount}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Atenuação</span>
              <span className={`font-mono font-bold text-sm ${acsAlarms ? 'text-amber-400' : 'text-slate-300'}`}>
                {acsAlarms ? `${acsAlarms} Alerta` : 'Normal'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="font-mono truncate max-w-[200px]" title={acsEndpoint}>
              {acsEndpoint}
            </span>
            <span className="text-purple-400 font-bold">{acsMonitor.protocolo || 'CWMP / NBI'}</span>
          </div>

          {/* Histórico recente de telemetria */}
          {acsMonitor.history.length > 0 && (
            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <span className="text-[9px] text-slate-500 uppercase font-bold">Amostras de Latência (15s):</span>
              <div className="flex items-center gap-1">
                {acsMonitor.history.slice(-5).map((h, i) => (
                  <span
                    key={i}
                    className={`text-[9px] font-mono px-1 rounded bg-white/5 ${getLatencyColor(h.latency)}`}
                    title={`${h.timestamp} • ${h.latency}ms`}
                  >
                    {h.latency}ms
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Barra de Status e Rodapé */}
      <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Clock size={13} className="text-slate-500" />
          <span>Última sincronização completa: <strong className="text-slate-200">{getRelativeTime(data?.ultima_sincronizacao)}</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-slate-400">
            <Radio size={13} className="text-blue-400" />
            <span>Polling Ativo: <strong>15 segundos</strong></span>
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 font-bold">Uptime 99.98%</span>
        </div>
      </div>
    </div>
  );
}
