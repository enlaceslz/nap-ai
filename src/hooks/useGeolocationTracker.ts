import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface GeolocationData {
  ativo: boolean;
  lat: number;
  lng: number;
  precisao: number;
  velocidade: number;
  endereco: string;
  ultimaAtualizacao: string;
  bateria?: number;
  statusRastreamento: 'ativo' | 'buscando' | 'negado' | 'desativado';
}

export function useGeolocationTracker() {
  const { user } = useAuth();
  const isTecnico = user?.role === 'tecnico_campo' || user?.role === 'tecnico_noc';
  
  // Coordenadas base da sede do provedor
  const getInitialCoords = () => {
    return {
      lat: -23.5489,
      lng: -46.6388,
      endereco: 'Sede Central do Provedor',
      velocidade: 0
    };
  };

  const initial = getInitialCoords();

  const [geoData, setGeoData] = useState<GeolocationData>({
    ativo: true,
    lat: initial.lat,
    lng: initial.lng,
    precisao: 10,
    velocidade: initial.velocidade,
    endereco: initial.endereco,
    ultimaAtualizacao: 'Aguardando GPS',
    bateria: 100,
    statusRastreamento: 'buscando'
  });

  // Enviar coordenada para o servidor para exibição no mapa do Admin e Operador
  const syncLocationWithBackend = useCallback(async (lat: number, lng: number, precisao: number, velocidade: number) => {
    try {
      const usuarioId = user?.id === 'mock-local-id-123' 
        ? (isTecnico ? 3 : user?.role === 'operador' ? 2 : 1)
        : (user?.id || 1);

      await fetch('/api/usuarios/localizacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: usuarioId,
          lat,
          lng,
          precisao_metros: Math.round(precisao),
          velocidade_kmh: Math.round(velocidade),
          bateria_percentual: 100,
          endereco_estimado: isTecnico 
            ? `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)} (GPS Campo)`
            : `Central Operacional (Presença Operador)`
        })
      });
    } catch (e) {
      console.warn('Erro ao sincronizar localização com backend:', e);
    }
  }, [user, isTecnico]);

  useEffect(() => {
    // Apenas ativa por padrão se for Técnico ou Operador (ou Admin se desejar)
    const deveAtivar = isTecnico || user?.role === 'operador' || user?.role === 'admin' || user?.role === 'superadmin';
    if (!deveAtivar) return;

    if (!('geolocation' in navigator)) {
      setGeoData(prev => ({ ...prev, statusRastreamento: 'desativado', ultimaAtualizacao: 'Geolocalização não suportada' }));
      return;
    }

    let watchId: number | null = null;

    // Obter geolocalização real do navegador (W3C Geolocation API)
    try {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy, speed } = position.coords;
          const velKmH = speed ? Math.round(speed * 3.6) : 0;
          
          setGeoData({
            ativo: true,
            lat: latitude,
            lng: longitude,
            precisao: Math.round(accuracy),
            velocidade: velKmH,
            endereco: `Lat ${latitude.toFixed(4)}, Long ${longitude.toFixed(4)}`,
            ultimaAtualizacao: new Date().toLocaleTimeString('pt-BR'),
            bateria: 100,
            statusRastreamento: 'ativo'
          });

          syncLocationWithBackend(latitude, longitude, accuracy, velKmH);
        },
        (error) => {
          setGeoData(prev => ({
            ...prev,
            statusRastreamento: error.code === error.PERMISSION_DENIED ? 'negado' : 'desativado',
            ultimaAtualizacao: 'Sinal GPS indisponível'
          }));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    } catch (e) {
      console.warn('Falha ao iniciar GPS:', e);
    }

    // Intervalo de sincronização periódica de presença se o GPS estiver ativo
    const heartbeat = setInterval(() => {
      setGeoData(prev => {
        if (prev.statusRastreamento === 'ativo') {
          syncLocationWithBackend(prev.lat, prev.lng, prev.precisao, prev.velocidade);
        }
        return {
          ...prev,
          ultimaAtualizacao: new Date().toLocaleTimeString('pt-BR')
        };
      });
    }, 30000);

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      clearInterval(heartbeat);
    };
  }, [user, isTecnico, syncLocationWithBackend]);

  return {
    geoData,
    toggleGeo: () => {
      setGeoData(prev => ({ ...prev, ativo: !prev.ativo }));
    }
  };
}
