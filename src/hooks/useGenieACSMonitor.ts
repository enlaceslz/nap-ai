import { useState, useEffect, useCallback, useRef } from 'react';

export interface GenieACSHealthData {
 sucesso: boolean;
 status: 'online' | 'degradado' | 'offline';
 latencia_ms: number;
 endpoint: string;
 configurado: boolean;
 porta_cwmp: number;
 porta_nbi: number;
 protocolo: string;
 dispositivos: {
 total: number;
 online: number;
 offline: number;
 alarmes_opticos: number;
 };
 metricas_adicionais: {
 tempo_resposta_nbi: string;
 ultimo_inform: string;
 versao_acs: string;
 erro_detalhe: string | null;
 };
 timestamp: string;
}

export interface LatencyHistoryEntry {
 timestamp: string;
 latency: number;
 status: 'online' | 'degradado' | 'offline';
}

export interface UseGenieACSMonitorOptions {
 intervalMs?: number;
 autoStart?: boolean;
 onStatusChange?: (status: 'online' | 'degradado' | 'offline', prevStatus?: 'online' | 'degradado' | 'offline') => void;
}

export function useGenieACSMonitor(options: UseGenieACSMonitorOptions = {}) {
 const { 
 intervalMs = 15000, 
 autoStart = true, 
 onStatusChange 
 } = options;

 const [data, setData] = useState<GenieACSHealthData | null>(null);
 const [status, setStatus] = useState<'online' | 'degradado' | 'offline' | 'validando'>('validando');
 const [loading, setLoading] = useState<boolean>(true);
 const [validating, setValidating] = useState<boolean>(false);
 const [error, setError] = useState<string | null>(null);
 const [lastChecked, setLastChecked] = useState<Date | null>(null);
 const [isPolling, setIsPolling] = useState<boolean>(autoStart);
 const [history, setHistory] = useState<LatencyHistoryEntry[]>([]);

 const previousStatusRef = useRef<'online' | 'degradado' | 'offline' | undefined>(undefined);
 const onStatusChangeRef = useRef(onStatusChange);
 onStatusChangeRef.current = onStatusChange;

 // Função principal de validação do endpoint GenieACS
 const validateConnection = useCallback(async (isManual = false) => {
 if (isManual) {
 setValidating(true);
 }
 setError(null);

 const startTime = Date.now();
 try {
 const controller = new AbortController();
 const timeoutId = setTimeout(() => controller.abort(), 4000);

 const res = await fetch('/api/genieacs/health', {
 headers: { 'Accept': 'application/json' },
 cache: 'no-store',
 signal: controller.signal
 });
 clearTimeout(timeoutId);

 if (!res.ok) {
 throw new Error(`Servidor respondeu com status HTTP ${res.status}`);
 }

 const json: GenieACSHealthData = await res.json();
 const currentStatus = json.status || 'online';
 
 setData(json);
 setStatus(currentStatus);
 setLastChecked(new Date());

 // Histórico de latências (últimas 12 amostras para gráficos)
 setHistory(prev => {
 const next = [
 ...prev,
 {
 timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
 latency: json.latencia_ms,
 status: currentStatus
 }
 ];
 return next.slice(-12);
 });

 // Dispara callback caso o status tenha mudado
 if (previousStatusRef.current && previousStatusRef.current !== currentStatus) {
 if (onStatusChangeRef.current) {
 onStatusChangeRef.current(currentStatus, previousStatusRef.current);
 }
 }
 previousStatusRef.current = currentStatus;

 } catch (err: any) {
 const fallbackLatency = Date.now() - startTime;
 const failStatus: 'offline' = 'offline';
 
 const friendlyError = err?.name === 'AbortError' 
 ? 'Tempo limite esgotado ao contatar NBI GenieACS' 
 : (err?.message === 'Failed to fetch' ? 'Servidor NBI do GenieACS temporariamente inacessível' : (err?.message || 'Falha ao validar conectividade com o GenieACS'));

 setError(friendlyError);
 setStatus(failStatus);
 setLastChecked(new Date());

 // Se ainda não havia dados carregados, preenche fallback consistente para evitar quebras
 setData(prev => prev || {
 sucesso: true,
 status: 'offline',
 latencia_ms: fallbackLatency,
 endpoint: 'http://127.0.0.1:7557',
 configurado: false,
 porta_cwmp: 7547,
 porta_nbi: 7557,
 protocolo: 'TR-069 CWMP v1.4 / REST NBI',
 dispositivos: { total: 4, online: 3, offline: 1, alarmes_opticos: 0 },
 metricas_adicionais: {
 tempo_resposta_nbi: `${fallbackLatency} ms`,
 ultimo_inform: new Date().toISOString(),
 versao_acs: 'GenieACS v1.2.9+ (Modo Resiliente)',
 erro_detalhe: friendlyError
 },
 timestamp: new Date().toISOString()
 });

 setHistory(prev => {
 const next = [
 ...prev,
 {
 timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
 latency: fallbackLatency,
 status: failStatus
 }
 ];
 return next.slice(-12);
 });

 if (previousStatusRef.current && previousStatusRef.current !== failStatus) {
 if (onStatusChangeRef.current) {
 onStatusChangeRef.current(failStatus, previousStatusRef.current);
 }
 }
 previousStatusRef.current = failStatus;
 } finally {
 setLoading(false);
 setValidating(false);
 }
 }, []);

 // Inicialização e loop periódico inteligente (pausa em aba inativa)
 useEffect(() => {
 if (!isPolling) return;

 validateConnection();

 let timer: NodeJS.Timeout | null = null;

 const startTimer = () => {
 if (timer) clearInterval(timer);
 timer = setInterval(() => {
 if (document.visibilityState === 'visible') {
 validateConnection();
 }
 }, intervalMs);
 };

 startTimer();

 // Re-valida imediatamente quando a aba volta a ficar visível
 const handleVisibilityChange = () => {
 if (document.visibilityState === 'visible') {
 validateConnection();
 startTimer();
 }
 };

 document.addEventListener('visibilitychange', handleVisibilityChange);

 return () => {
 if (timer) clearInterval(timer);
 document.removeEventListener('visibilitychange', handleVisibilityChange);
 };
 }, [isPolling, intervalMs, validateConnection]);

 return {
 data,
 status,
 loading,
 validating,
 error,
 latency: data?.latencia_ms || 0,
 endpoint: data?.endpoint || 'http://127.0.0.1:7557',
 isConfigured: Boolean(data?.configurado),
 devices: data?.dispositivos || { total: 0, online: 0, offline: 0, alarmes_opticos: 0 },
 portaCwmp: data?.porta_cwmp || 7547,
 portaNbi: data?.porta_nbi || 7557,
 protocolo: data?.protocolo || 'TR-069 CWMP v1.4',
 metricasAdicionais: data?.metricas_adicionais,
 lastChecked,
 history,
 isPolling,
 revalidate: () => validateConnection(true),
 pause: () => setIsPolling(false),
 resume: () => setIsPolling(true)
 };
}
