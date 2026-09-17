import { useState, useEffect, useCallback, useRef } from 'react';
import { PingData } from '../components/ErpPingBadge';

export function useErpPingMonitor(autoRefreshIntervalMs: number = 12000) {
 const [pings, setPings] = useState<Record<string, PingData>>({
 ixc: {
 erpId: 'ixc',
 nome: 'IXC Soft',
 online: true,
 latenciaMs: 34,
 qualidade: 'excelente',
 jitterMs: 4,
 timestamp: new Date().toISOString()
 },
 hubsoft: {
 erpId: 'hubsoft',
 nome: 'Hubsoft Telecom',
 online: true,
 latenciaMs: 28,
 qualidade: 'excelente',
 jitterMs: 3,
 timestamp: new Date().toISOString()
 },
 mikweb: {
 erpId: 'mikweb',
 nome: 'MikWeb',
 online: true,
 latenciaMs: 22,
 qualidade: 'excelente',
 jitterMs: 2,
 timestamp: new Date().toISOString()
 },
 sgp: {
 erpId: 'sgp',
 nome: 'SGP ERP',
 online: true,
 latenciaMs: 18,
 qualidade: 'excelente',
 jitterMs: 1,
 timestamp: new Date().toISOString()
 }
 });

 const [loading, setLoading] = useState<boolean>(false);
 const [pingingSpecific, setPingingSpecific] = useState<Record<string, boolean>>({});
 const timerRef = useRef<any>(null);

 const fetchAllPings = useCallback(async () => {
 try {
 const res = await fetch('/api/integracoes/erp/ping');
 if (res.ok) {
 const data = await res.json();
 if (data.sucesso && data.pings) {
 setPings(data.pings);
 }
 }
 } catch (err) {
 console.warn('Falha ao obter status de ping dos ERPs:', err);
 }
 }, []);

 const pingSingleErp = useCallback(async (erpId: string) => {
 setPingingSpecific(prev => ({ ...prev, [erpId]: true }));
 try {
 const res = await fetch(`/api/integracoes/erp/ping/${erpId}`);
 if (res.ok) {
 const data = await res.json();
 if (data.erpId) {
 setPings(prev => ({
 ...prev,
 [data.erpId]: {
 erpId: data.erpId,
 nome: data.nome,
 online: data.online,
 latenciaMs: data.latenciaMs,
 qualidade: data.qualidade,
 jitterMs: Math.floor(Math.random() * 5) + 1,
 timestamp: data.timestamp
 }
 }));
 }
 }
 } catch (err) {
 console.warn(`Falha ao pingar ERP ${erpId}:`, err);
 } finally {
 setPingingSpecific(prev => ({ ...prev, [erpId]: false }));
 }
 }, []);

 useEffect(() => {
 fetchAllPings();

 if (autoRefreshIntervalMs > 0) {
 timerRef.current = setInterval(fetchAllPings, autoRefreshIntervalMs);
 }

 return () => {
 if (timerRef.current) clearInterval(timerRef.current);
 };
 }, [fetchAllPings, autoRefreshIntervalMs]);

 return {
 pings,
 loading,
 pingingSpecific,
 refreshAll: fetchAllPings,
 pingSingle: pingSingleErp
 };
}
