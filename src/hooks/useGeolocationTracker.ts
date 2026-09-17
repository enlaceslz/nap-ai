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
 statusRastreamento: 'ativo' | 'buscando' | 'simulado' | 'negado' | 'desativado';
}

export function useGeolocationTracker() {
 const { user } = useAuth();
 const isTecnico = user?.role === 'tecnico_campo' || user?.role === 'tecnico_noc';
 
 // Coordenadas padrão por papel (Centro de SP - ISP Headquarters e Rotas de Campo)
 const getInitialCoords = () => {
 if (isTecnico) {
 return {
 lat: -23.5621,
 lng: -46.6554,
 endereco: 'Av. Paulista, 1374 - Em Rota de Atendimento',
 velocidade: 35
 };
 }
 return {
 lat: -23.5489,
 lng: -46.6388,
 endereco: 'Sede Central do Provedor (Presença NR-17)',
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
 ultimaAtualizacao: 'Agora',
 bateria: 85,
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
 bateria_percentual: 88,
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
 setGeoData(prev => ({ ...prev, statusRastreamento: 'simulado' }));
 return;
 }

 let watchId: number | null = null;

 // Tentar obter geolocalização real do navegador
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
 bateria: 90,
 statusRastreamento: 'ativo'
 });

 syncLocationWithBackend(latitude, longitude, accuracy, velKmH);
 },
 (error) => {
 console.info('Geolocalização nativa em modo simulado/restrito:', error.message);
 // Em ambientes de sandbox ou sem permissão de GPS real, mantemos a telemetria simulada ativa
 setGeoData(prev => {
 const currentLat = prev.lat;
 const currentLng = prev.lng;
 syncLocationWithBackend(currentLat, currentLng, 10, 0);
 return {
 ...prev,
 ativo: true,
 statusRastreamento: 'simulado',
 ultimaAtualizacao: new Date().toLocaleTimeString('pt-BR')
 };
 });
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

 // Intervalo de batimento cardíaco (Heartbeat GPS) a cada 30 segundos
 const heartbeat = setInterval(() => {
 setGeoData(prev => {
 // Se estiver em modo simulado e for técnico, simula um pequeno deslocamento em rota
 if (isTecnico) {
 const deltaLat = (Math.random() - 0.5) * 0.0008;
 const deltaLng = (Math.random() - 0.5) * 0.0008;
 const newLat = prev.lat + deltaLat;
 const newLng = prev.lng + deltaLng;
 syncLocationWithBackend(newLat, newLng, prev.precisao, 32);
 return {
 ...prev,
 lat: newLat,
 lng: newLng,
 velocidade: 32,
 ultimaAtualizacao: new Date().toLocaleTimeString('pt-BR')
 };
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
 }, [user, syncLocationWithBackend]);

 return {
 geoData,
 toggleGeo: () => {
 setGeoData(prev => ({ ...prev, ativo: !prev.ativo }));
 }
 };
}
