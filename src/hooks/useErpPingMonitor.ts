import { useState, useEffect, useCallback, useRef } from 'react';
import { PingData } from '../components/ErpPingBadge';

export function useErpPingMonitor(autoRefreshIntervalMs: number = 12000) {
  const [pings, setPings] = useState<Record<string, PingData>>({
    ixc: {
      erpId: 'ixc',
      nome: 'IXC Soft',
      online: false,
      latenciaMs: null,
      qualidade: 'offline',
      jitterMs: null,
      timestamp: undefined
    },
    hubsoft: {
      erpId: 'hubsoft',
      nome: 'Hubsoft Telecom',
      online: false,
      latenciaMs: null,
      qualidade: 'offline',
      jitterMs: null,
      timestamp: undefined
    },
    mikweb: {
      erpId: 'mikweb',
      nome: 'MikWeb',
      online: false,
      latenciaMs: null,
      qualidade: 'offline',
      jitterMs: null,
      timestamp: undefined
    },
    sgp: {
      erpId: 'sgp',
      nome: 'SGP ERP',
      online: false,
      latenciaMs: null,
      qualidade: 'offline',
      jitterMs: null,
      timestamp: undefined
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
              latenciaMs: data.latenciaMs ?? null,
              qualidade: data.qualidade || (data.online ? 'estavel' : 'offline'),
              jitterMs: data.jitterMs ?? null,
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
