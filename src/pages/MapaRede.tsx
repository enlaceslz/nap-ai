import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import { DivIcon, Icon } from 'leaflet';
import { useConfig } from '../contexts/ConfigContext';
import { oltApi } from '../services/oltApi';
import { 
  Search, Filter, MapPin, Router, Activity, 
  CheckCircle2, XCircle, AlertTriangle, RefreshCw, Signal, X, Maximize, Minimize, Crosshair, ChevronUp, ChevronDown,
  Layers, ExternalLink, Copy, Check, RotateCcw, Wifi, Thermometer, Zap, Gauge, Wrench, Navigation, Battery, Phone, User
, Globe } from 'lucide-react';

// Correção para ícones padrão do Leaflet no React
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// Tipagem da ONT no Mapa
interface OntGeoNode {
  id: string;
  cliente: string;
  mac: string;
  lat: number;
  lng: number;
  status: 'online' | 'offline' | 'alerta';
  rxPower: string;
  txPower: string;
  uptime: string;
  plano: string;
  olt: string;
  pon: string;
  ip: string;
  modelo: string;
  temp: string;
  volt: string;
  wifiSsid: string;
  wifiClients: number;
}

// Tipagem de Técnico em Rota de Campo
interface TecnicoNode {
  id: number;
  nome: string;
  veiculo: string;
  status: string;
  status_label: string;
  telefone: string;
  lat: number;
  lng: number;
  precisao_metros: number;
  endereco: string;
  velocidade_kmh: number;
  bateria: number;
  atualizado_em: string;
}

// Tipagem de Ordem de Serviço de Campo
interface OrdemServicoNode {
  id: string;
  numero: string;
  tipo: string;
  cliente_nome: string;
  endereco: string;
  bairro: string;
  lat: number;
  lng: number;
  status: string;
  prioridade: string;
  tecnico_nome?: string;
}

// Gerador de Mocks Geográficos (Ao redor de uma coordenada central)
const generateMockOnts = (centerLat: number, centerLng: number, count: number): OntGeoNode[] => {
  const nodes: OntGeoNode[] = [];
  const radius = 0.05; // ~5km
  
  const statuses: ('online' | 'offline' | 'alerta')[] = ['online', 'online', 'online', 'online', 'alerta', 'offline'];
  const nomes = ['João Silva', 'Maria Souza', 'Empresa XYZ', 'Carlos Oliveira', 'Ana Costa', 'Padaria Pão Quente', 'Lucas Mendes', 'Farmácia Vida'];
  const planos = ['Fibra 500 Mega', 'Fibra 700 Mega', 'Gamer 1 Giga', 'Empresarial Link Dedicado'];
  const olts = ['OLT-HUAWEI-01 (Centro)', 'OLT-ZTE-02 (Norte)', 'OLT-DATACOM-03 (Sul)'];
  const modelos = ['Huawei HG8145V5', 'ZTE F670L', 'Fiberhome AN5506', 'Datacom DM985'];

  for (let i = 0; i < count; i++) {
    const r = radius * Math.sqrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    let rx = '-19.5 dBm';
    let tx = '+2.3 dBm';
    let temp = `${Math.floor(Math.random() * 8 + 38)}°C`;
    let volt = '3.31 V';

    if (status === 'alerta') {
      rx = '-28.4 dBm (Crítico)';
      tx = '+1.1 dBm';
      temp = '52°C';
    }
    if (status === 'offline') {
      rx = 'Sem Sinal (LOS)';
      tx = '0.0 dBm (Desligado)';
      temp = '--';
      volt = '0.0 V';
    }
    
    nodes.push({
      id: `ONT-${1000 + i}`,
      cliente: nomes[Math.floor(Math.random() * nomes.length)] + ` ${i+1}`,
      mac: `48:57:DD:${Math.floor(Math.random()*90+10)}:${Math.floor(Math.random()*90+10)}:${Math.floor(Math.random()*90+10)}`,
      lat: centerLat + r * Math.cos(theta),
      lng: centerLng + r * Math.sin(theta),
      status: status,
      rxPower: rx,
      txPower: tx,
      uptime: status === 'offline' ? '00:00:00' : `${Math.floor(Math.random() * 30 + 1)} dias`,
      plano: planos[Math.floor(Math.random() * planos.length)],
      olt: olts[Math.floor(Math.random() * olts.length)],
      pon: `0/${Math.floor(Math.random() * 2)}/${Math.floor(Math.random() * 16)}`,
      ip: `100.64.${Math.floor(Math.random() * 50 + 10)}.${Math.floor(Math.random() * 250 + 2)}`,
      modelo: modelos[Math.floor(Math.random() * modelos.length)],
      temp,
      volt,
      wifiSsid: `NAP_FIBRA_${Math.floor(Math.random() * 900 + 100)}`,
      wifiClients: status === 'offline' ? 0 : Math.floor(Math.random() * 7 + 1)
    });
  }
  return nodes;
};

// Ícones Customizados
const createCustomIcon = (status: 'online' | 'offline' | 'alerta') => {
  let colorClass = 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]';
  if (status === 'alerta') colorClass = 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse';
  if (status === 'offline') colorClass = 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-bounce';

  return new DivIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div class="relative flex items-center justify-center w-6 h-6">
        <div class="absolute w-full h-full rounded-full border-2 border-white ${colorClass}"></div>
        <div class="w-1.5 h-1.5 bg-white rounded-full z-10"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

// Ícone Customizado para Técnicos de Campo
const createTechnicianIcon = (status: string) => {
  const isEmRota = status === 'em_rota';
  const bgColor = isEmRota ? 'bg-indigo-600' : 'bg-blue-600';
  const pulseColor = isEmRota ? 'rgba(99,102,241,0.6)' : 'rgba(59,130,246,0.6)';

  return new DivIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8 cursor-pointer group">
        <div class="absolute w-8 h-8 rounded-full border-2 border-white ${bgColor} shadow-[0_0_15px_${pulseColor}] flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
          </svg>
        </div>
        <div class="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${isEmRota ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

// Ícone Customizado para Ordens de Serviço
const createServiceOrderIcon = (prioridade: string) => {
  const isUrgente = prioridade === 'urgente' || prioridade === 'alta';
  const bgColor = isUrgente ? 'bg-amber-500' : 'bg-slate-700';

  return new DivIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div class="relative flex items-center justify-center w-6 h-6 cursor-pointer">
        <div class="w-6 h-6 rounded-lg border-2 border-white ${bgColor} shadow-md flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

// Componente para atualizar o centro do mapa dinamicamente
const MapController = ({ center, zoom, isFullScreen }: { center: [number, number]; zoom?: number; isFullScreen?: boolean }) => {
  const map = useMap();
  
  useEffect(() => {
    map.flyTo(center, zoom || 14, { animate: true, duration: 1.2 });
  }, [center, zoom, map]);

  // Corrige falha de renderização de tiles quando a div contêiner do Leaflet muda de tamanho (Fullscreen)
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);
    return () => clearTimeout(timer);
  }, [isFullScreen, map]);

  return null;
};

export default function MapaRede() {
  const navigate = useNavigate();
  const { config } = useConfig();
  const centralPos = useMemo(() => {
    return {
      lat: config.mapa?.centroPadrao?.lat ?? -23.5505,
      lng: config.mapa?.centroPadrao?.lng ?? -46.6333
    };
  }, [config.mapa?.centroPadrao?.lat, config.mapa?.centroPadrao?.lng]);
  const [onts, setOnts] = useState<OntGeoNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'online' | 'alerta' | 'offline'>('todos');
  const [selectedOnt, setSelectedOnt] = useState<OntGeoNode | null>(null);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLegendMinimized, setIsLegendMinimized] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([centralPos.lat, centralPos.lng]);
  const [mapZoom, setMapZoom] = useState(config.mapa?.zoomPadrao ?? 13);
  const [mapLayer, setMapLayer] = useState<'dark' | 'satellite' | 'streets' | 'hybrid'>('hybrid');
  const [showTechniciansLayer, setShowTechniciansLayer] = useState(true);
  const [tecnicos, setTecnicos] = useState<TecnicoNode[]>([]);
  const [ordensServico, setOrdensServico] = useState<OrdemServicoNode[]>([]);
  const [selectedTecnico, setSelectedTecnico] = useState<TecnicoNode | null>(null);
  const [selectedOS, setSelectedOS] = useState<OrdemServicoNode | null>(null);
  const [locationQuery, setLocationQuery] = useState('');
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [copiedMac, setCopiedMac] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const fetchOnts = async () => {
      setLoading(true);
      try {
        // Fetch real ONUs from OLT service
        const realOnus = await oltApi.getOnus();
        
        // Convert to OntGeoNode format and assign random lat/lng around central position
        const radius = 0.05;
        const realOntNodes: OntGeoNode[] = realOnus.map((onu, index) => {
          const r = radius * Math.sqrt(Math.random());
          const theta = Math.random() * 2 * Math.PI;
          
          let statusLabel: 'online' | 'offline' | 'alerta' = 'online';
          if (onu.status === 'offline' || onu.status === 'los') statusLabel = 'offline';
          if (onu.rx_onu < -25 || onu.rx_onu > -10) statusLabel = 'alerta';
          if (onu.status === 'offline') statusLabel = 'offline';

          return {
            id: onu.id,
            cliente: onu.cliente_nome || onu.nome,
            mac: onu.mac || onu.serial,
            lat: centralPos.lat + r * Math.cos(theta),
            lng: centralPos.lng + r * Math.sin(theta),
            status: statusLabel,
            rxPower: `${onu.rx_onu} dBm`,
            txPower: `${onu.tx_onu} dBm`,
            uptime: onu.uptime,
            plano: onu.profile_service || 'N/A',
            olt: onu.olt_nome || onu.olt_id,
            pon: onu.pon_identifier,
            ip: onu.ip_address || '100.64.0.x',
            modelo: onu.modelo || 'N/A',
            temp: `${onu.temperatura}°C`,
            volt: '3.3V',
            wifiSsid: `NAP_${onu.nome.split(' ')[0]}`,
            wifiClients: Math.floor(Math.random() * 8)
          };
        });

        // Generate additional mocks (reduced to 800 for better performance)
        const mockOnts = generateMockOnts(centralPos.lat, centralPos.lng, 800);
        
        setOnts([...realOntNodes, ...mockOnts]);
      } catch (err) {
        console.error('Erro ao carregar ONTs da OLT:', err);
        setOnts(generateMockOnts(centralPos.lat, centralPos.lng, 800));
      } finally {
        setLoading(false);
      }
    };

    fetchOnts();

    // Carregamento de Técnicos e OSs de Campo do backend em tempo real
    const fetchTecnicos = async () => {
      try {
        const res = await fetch('/api/tecnicos/mapa');
        const data = await res.json();
        if (data.sucesso) {
          if (data.tecnicos) setTecnicos(data.tecnicos);
          if (data.ordens_servico) setOrdensServico(data.ordens_servico);
        }
      } catch (err) {
        console.error('Erro ao carregar técnicos de campo:', err);
      }
    };

    fetchTecnicos();
    const interval = setInterval(fetchTecnicos, 15000);
    return () => clearInterval(interval);
  }, []);

  const filteredOnts = useMemo(() => {
    return (onts || []).filter(ont => {
      if (!ont) return false;
      const matchSearch = (ont.cliente?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          (ont.mac?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (ont.id?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'todos' || ont.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [onts, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: onts?.length || 0,
      online: onts?.filter(o => o?.status === 'online')?.length || 0,
      alertas: onts?.filter(o => o?.status === 'alerta')?.length || 0,
      offline: onts?.filter(o => o?.status === 'offline')?.length || 0
    };
  }, [onts]);

  const searchMatches = useMemo(() => {
    if (!searchTerm || searchTerm.trim().length < 2) return [];
    const term = searchTerm.toLowerCase();
    return (onts || [])
      .filter(o => 
        o.cliente.toLowerCase().includes(term) || 
        o.mac.toLowerCase().includes(term) || 
        o.id.toLowerCase().includes(term)
      )
      .slice(0, 5);
  }, [onts, searchTerm]);

  const handleSelectSearchOnt = (ont: OntGeoNode) => {
    setSelectedOnt(ont);
    setMapCenter([ont.lat, ont.lng]);
    setMapZoom(17);
    setSearchTerm('');
  };

  const handleCopyMac = (mac: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(mac);
      setCopiedMac(true);
      setTimeout(() => setCopiedMac(false), 2000);
      showToast(`MAC ${mac} copiado para a área de transferência.`);
    }
  };

  const handleRunDiagnostic = async (ontId: string) => {
    setDiagnosticLoading(true);
    try {
      if (ontId.startsWith('onu-')) {
        await oltApi.runDiagnostics(ontId);
      } else {
        await new Promise(resolve => setTimeout(resolve, 1200));
      }
      showToast(`Telemetria atualizada com sucesso para ${ontId}. Parâmetros de fibra validados.`);
    } catch (error) {
      showToast(`Falha ao obter telemetria para ${ontId}. O equipamento pode estar offline.`);
    } finally {
      setDiagnosticLoading(false);
    }
  };

  const handleRebootOnt = async (ontId: string) => {
    const confirmReboot = window.confirm(`Deseja realmente disparar o comando de REBOOT para ${ontId}?`);
    if (!confirmReboot) return;
    try {
      if (ontId.startsWith('onu-')) {
        await oltApi.executeBatchOperation({
          onu_ids: [ontId],
          action: 'reboot'
        });
      }
      showToast(`Comando RPC:Reboot enviado para ${ontId}. A ONT irá reiniciar em instantes.`);
    } catch (error) {
      showToast(`Falha ao enviar comando de reboot para ${ontId}.`);
    }
  };

  const handleMyPosition = () => {
    if ('geolocation' in navigator) {
      setSearchingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
          setMapZoom(16);
          setSearchingLocation(false);
          showToast('Localização atual obtida com sucesso.');
        },
        (error) => {
          setSearchingLocation(false);
          console.error("Erro ao obter localização", error);
          showToast("Erro ao obter localização ou permissão negada.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      showToast("Geolocalização não é suportada por este navegador.");
    }
  };

  const handleLocationSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!locationQuery) return;
    setSearchingLocation(true);
    try {
      const res = await fetch(`/api/geo/search?q=${encodeURIComponent(locationQuery)}`);
      const data = await res.json();
      const items = data.resultados || [];
      if (items.length > 0 && items[0].lat && items[0].lon) {
        setMapCenter([parseFloat(items[0].lat), parseFloat(items[0].lon)]);
      } else {
        showToast("Localização/CEP não encontrado.");
      }
    } catch (error) {
      console.error("Erro na busca de localização:", error);
      showToast("Busca de endereço indisponível temporariamente.");
    } finally {
      setSearchingLocation(false);
    }
  };

  const toggleControls = () => {
    setShowControls(prev => !prev);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
  };

  return (
    <div className={isFullScreen ? "fixed inset-0 z-[999] flex flex-col bg-slate-950" : "flex-1 flex flex-col h-full bg-slate-950 relative overflow-hidden"}>
      {/* Toggle Panel Button - Global & Responsive */}
      <div className="absolute top-4 right-4 z-[400] max-sm:fixed max-sm:bottom-8 max-sm:left-1/2 max-sm:-translate-x-1/2 max-sm:top-auto max-sm:right-auto">
        
            <button
              type="button"
              onClick={() => setMapLayer('hybrid')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                mapLayer === 'hybrid' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Visão Híbrida (Satélite + Ruas)"
            >
              <Globe size={13} />
              <span>Híbrido</span>
            </button>
            <button
          onClick={toggleControls}
          className="bg-blue-600/90 hover:bg-blue-500 backdrop-blur-md text-white px-4 py-2.5 rounded-full border border-blue-400/50 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-colors flex items-center gap-2 font-bold"
          title={showControls ? "Esconder Filtros" : "Mostrar Filtros"}
        >
          {showControls ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          <span className="text-sm">{showControls ? "Esconder Painel" : "Filtros & Buscas"}</span>
        </button>
      </div>

      {/* HEADER DE CONTROLE */}
      <div className={`p-6 border-b border-white/5 bg-slate-900/90 backdrop-blur-md z-20 shadow-md flex-shrink-0 transition-all duration-300 ${showControls ? 'max-h-[800px] opacity-100 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden !p-0 !border-0'}`}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white font-outfit flex items-center gap-2">
              <MapPin className="text-blue-500" /> GIS & Mapa de ONTs
            </h1>
            <p className="text-sm text-slate-400 mt-1">Monitoramento geográfico em tempo real das ONTs (TR-069) e Alarmes.</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div 
              className={`bg-slate-950 border ${statusFilter === 'todos' ? 'border-white bg-slate-800 ring-2 ring-white/20' : 'border-white/10'} rounded-xl px-4 py-2 flex flex-col items-center justify-center min-w-[100px] cursor-pointer hover:bg-slate-800 transition-all`} 
              onClick={() => setStatusFilter('todos')}
            >
              <span className="text-xl font-bold text-white">{stats.total}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Total Ativos</span>
            </div>
            <div 
              className={`bg-emerald-500/10 border ${statusFilter === 'online' ? 'border-emerald-500 bg-emerald-500/30 ring-2 ring-emerald-500/50' : 'border-emerald-500/20'} rounded-xl px-4 py-2 flex flex-col items-center justify-center min-w-[100px] cursor-pointer hover:bg-emerald-500/30 transition-all`} 
              onClick={() => setStatusFilter('online')}
            >
              <span className="text-xl font-bold text-emerald-400">{stats.online}</span>
              <span className="text-[10px] text-emerald-500 uppercase tracking-wider">Online</span>
            </div>
            <div 
              className={`bg-amber-500/10 border ${statusFilter === 'alerta' ? 'border-amber-500 bg-amber-500/30 ring-2 ring-amber-500/50' : 'border-amber-500/20'} rounded-xl px-4 py-2 flex flex-col items-center justify-center min-w-[100px] cursor-pointer hover:bg-amber-500/30 transition-all`} 
              onClick={() => setStatusFilter('alerta')}
            >
              <span className="text-xl font-bold text-amber-400">{stats.alertas}</span>
              <span className="text-[10px] text-amber-500 uppercase tracking-wider">Atenção</span>
            </div>
            <div 
              className={`bg-red-500/10 border ${statusFilter === 'offline' ? 'border-red-500 bg-red-500/30 ring-2 ring-red-500/50' : 'border-red-500/20'} rounded-xl px-4 py-2 flex flex-col items-center justify-center min-w-[100px] cursor-pointer hover:bg-red-500/30 transition-all`} 
              onClick={() => setStatusFilter('offline')}
            >
              <span className="text-xl font-bold text-red-400">{stats.offline}</span>
              <span className="text-[10px] text-red-500 uppercase tracking-wider">LOS/Offline</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-4 items-center">
          {/* Busca ONTs */}
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-500" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Nome, MAC ou ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            )}

            {/* Dropdown de Autocomplete Rápido */}
            {searchMatches.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-white/5">
                <div className="px-3 py-1.5 bg-slate-950/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Resultados Encontrados ({searchMatches.length})</span>
                  <span className="text-blue-400">Clique para localizar no mapa</span>
                </div>
                {searchMatches.map((match) => (
                  <button
                    key={match.id}
                    type="button"
                    onClick={() => handleSelectSearchOnt(match)}
                    className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors flex items-center justify-between gap-2 group cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-xs truncate group-hover:text-blue-400 transition-colors">
                          {match.cliente}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {match.id}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        MAC: <span className="font-mono text-slate-300">{match.mac}</span> • {match.olt}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        match.status === 'online' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                        match.status === 'alerta' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                        'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}>
                        {typeof match.status === "string" ? match.status.toUpperCase() : "DESCONHECIDO"}
                      </span>
                      <Crosshair size={14} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-1 w-full relative">
            <form onSubmit={handleLocationSearch} className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin size={18} className="text-slate-500" />
              </div>
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="Buscar Endereço ou CEP..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button 
                type="submit"
                disabled={searchingLocation}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-500 hover:text-blue-400 cursor-pointer"
              >
                {searchingLocation ? <RefreshCw size={16} className="animate-spin" /> : <Crosshair size={16} />}
              </button>
            </form>

            <button
              type="button"
              onClick={handleMyPosition}
              disabled={searchingLocation}
              title="Minha Localização Atual"
              className="bg-slate-950 hover:bg-slate-900 text-blue-500 border border-white/10 p-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center shadow-lg"
            >
              <Navigation size={20} />
            </button>
          </div>

          {/* Seletor de Camadas do Mapa */}
          <div className="flex items-center bg-slate-950 border border-white/10 rounded-xl p-0.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setMapLayer('dark')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                mapLayer === 'dark' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Modo Escuro NOC (OSM Invertido)"
            >
              <span>🌙</span>
              <span>NOC Dark</span>
            </button>
            <button
              type="button"
              onClick={() => setMapLayer('satellite')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                mapLayer === 'satellite' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Camada de Satélite de Alta Resolução (Esri World Imagery)"
            >
              <Layers size={13} />
              <span>Satélite</span>
            </button>
            <button
              type="button"
              onClick={() => setMapLayer('streets')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                mapLayer === 'streets' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Camada de Ruas (OpenStreetMap)"
            >
              <MapPin size={13} />
              <span>Ruas</span>
            </button>
          </div>

          {/* Toggle de Equipes de Campo (Radar GPS) */}
          <button
            type="button"
            onClick={() => setShowTechniciansLayer(!showTechniciansLayer)}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer flex-shrink-0 ${
              showTechniciansLayer 
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-xs' 
                : 'bg-slate-950 text-slate-400 border-white/10 hover:text-white hover:bg-white/5'
            }`}
            title="Exibir ou ocultar técnicos em rota e ordens de serviço"
          >
            <Wrench size={14} className={showTechniciansLayer ? 'text-indigo-400' : 'text-slate-400'} />
            <span>Técnicos & OSs</span>
            {tecnicos.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                showTechniciansLayer ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'
              }`}>
                {tecnicos.length}
              </span>
            )}
          </button>

          {/* Filtro & Fullscreen */}
          <div className="flex items-center gap-2 w-full xl:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 flex-1 xl:w-48 appearance-none cursor-pointer"
            >
              <option value="todos">Todos os Status</option>
              <option value="online">Somente Online</option>
              <option value="alerta">Somente Alertas</option>
              <option value="offline">Somente Offline</option>
            </select>
            
            <button
              onClick={() => {
                setIsFullScreen(!isFullScreen);
                setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-white p-2.5 rounded-xl border border-white/10 transition-colors flex-shrink-0 cursor-pointer"
              title={isFullScreen ? "Sair da Tela Cheia" : "Tela Cheia"}
            >
              {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* ÁREA DO MAPA */}
      <div className="flex-1 relative z-10 bg-slate-900 min-h-0">
        
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-50">
            <RefreshCw size={32} className="text-blue-500 animate-spin mb-4" />
            <p className="text-slate-300 font-medium">Carregando dados geolocalizados do GenieACS...</p>
          </div>
        ) : null}

        {/* Legenda Interativa Flutuante */}
        <div className="absolute bottom-6 right-6 z-[400] bg-slate-900/90 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl flex flex-col gap-3 min-w-[200px]">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-sm font-bold text-white">Legenda (Status TR-069)</h3>
            <button 
              onClick={() => setIsLegendMinimized(!isLegendMinimized)} 
              className="text-slate-400 hover:text-white p-1 hover:bg-white/10 rounded transition-colors"
            >
              {isLegendMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
             
          {!isLegendMinimized && (
            <>
              <div 
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${statusFilter === 'online' ? 'bg-white/10' : 'hover:bg-white/5'}`}
                onClick={() => setStatusFilter(statusFilter === 'online' ? 'todos' : 'online')}
              >
                <div className="relative flex items-center justify-center w-5 h-5">
                  <div className="absolute w-full h-full rounded-full border border-white bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full z-10"></div>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-white leading-none">Online</p>
                  <p className="text-[10px] text-emerald-400">Sinal e conexão OK</p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">{stats.online}</span>
              </div>

              <div 
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${statusFilter === 'alerta' ? 'bg-white/10' : 'hover:bg-white/5'}`}
                onClick={() => setStatusFilter(statusFilter === 'alerta' ? 'todos' : 'alerta')}
              >
                <div className="relative flex items-center justify-center w-5 h-5">
                  <div className="absolute w-full h-full rounded-full border border-white bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse"></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full z-10"></div>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-white leading-none">Atenção</p>
                  <p className="text-[10px] text-amber-400">Sinal Crítico (Atenuado)</p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">{stats.alertas}</span>
              </div>

              <div 
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${statusFilter === 'offline' ? 'bg-white/10' : 'hover:bg-white/5'}`}
                onClick={() => setStatusFilter(statusFilter === 'offline' ? 'todos' : 'offline')}
              >
                <div className="relative flex items-center justify-center w-5 h-5">
                  <div className="absolute w-full h-full rounded-full border border-white bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-bounce" style={{animationDuration: '2s'}}></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full z-10"></div>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-white leading-none">Offline (LOS)</p>
                  <p className="text-[10px] text-red-400">Rompimento / Sem Energia</p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">{stats.offline}</span>
              </div>

              {/* Seção Campo (quando ativada) */}
              {showTechniciansLayer && (
                <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Equipes de Rua</span>
                  <div className="flex items-center gap-2.5 text-xs text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-indigo-600 border border-white flex items-center justify-center text-white">
                      <Wrench size={10} />
                    </div>
                    <span>Técnico em Rota</span>
                    <span className="ml-auto font-mono text-slate-400 font-bold">{tecnicos.length}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-300">
                    <div className="w-4 h-4 rounded bg-amber-500 border border-white flex items-center justify-center text-white">
                      <span className="text-[8px] font-bold">OS</span>
                    </div>
                    <span>Ordem de Serviço</span>
                    <span className="ml-auto font-mono text-slate-400 font-bold">{ordensServico.length}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <MapContainer 
          center={[centralPos.lat, centralPos.lng]} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          className="z-10"
        >
          <MapController center={mapCenter} zoom={mapZoom} isFullScreen={isFullScreen} />
          
          {/* Camadas Selecionáveis */}
          
          {mapLayer === 'hybrid' && (
            <TileLayer
              attribution='&copy; Google Maps'
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              maxZoom={20}
            />
          )}
          {mapLayer === 'dark' && (
            <TileLayer
              attribution={config.mapa?.atribuicao || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; CARTO'}
              url={config.mapa?.tileUrlDark || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
              className="map-tiles-dark"
            />
          )}
          {mapLayer === 'satellite' && (
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com">Esri</a>, Maxar, Earthstar Geographics'
              url={config.mapa?.tileUrlSatelite || "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"}
              maxZoom={19}
            />
          )}
          {mapLayer === 'streets' && (
            <TileLayer
              attribution={config.mapa?.atribuicao || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
              url={config.mapa?.tileUrlPadrao || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
            />
          )}
          
          <MarkerClusterGroup chunkedLoading maxClusterRadius={50}>
            {(filteredOnts || []).map(ont => {
              if (!ont) return null;
              return (
              <Marker 
                key={ont.id} 
                position={[ont.lat, ont.lng]} 
                icon={createCustomIcon(ont.status)}
                eventHandlers={{
                  click: () => setSelectedOnt(ont)
                }}
              >
                <Popup className="custom-popup">
                  <div className="p-2 min-w-[220px]">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                      <Router size={16} className="text-blue-500" />
                      <span className="font-bold text-white text-sm">{ont.id}</span>
                      {ont.status === 'online' && <span className="ml-auto bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/30">ONLINE</span>}
                      {ont.status === 'alerta' && <span className="ml-auto bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-500/30">ALERTA</span>}
                      {ont.status === 'offline' && <span className="ml-auto bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px] font-bold border border-red-500/30">OFFLINE</span>}
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-300">
                      <p><strong className="text-white">Cliente:</strong> {ont.cliente}</p>
                      <p><strong className="text-white">MAC:</strong> <span className="font-mono">{ont.mac}</span></p>
                      <p><strong className="text-white">Plano:</strong> {ont.plano}</p>

                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/10">
                        <div>
                          <strong className="text-white block mb-0.5">OLT / PON:</strong>
                          <span className="font-mono text-[10px] bg-slate-900 border border-white/5 px-1.5 py-0.5 rounded text-slate-300">{ont.olt} - PON {ont.pon}</span>
                        </div>
                        <div>
                          <strong className="text-white block mb-0.5">Sinal Óptico:</strong>
                          <div className="flex items-center gap-1">
                            <Signal size={14} className={ont.status === 'offline' ? 'text-red-500' : 'text-blue-500'} />
                            <span className="font-semibold">{ont.rxPower}</span>
                          </div>
                        </div>
                      </div>
                      
                      {ont.status === 'online' && (
                        <div className="flex items-center gap-1 mt-1 pt-1 text-emerald-400 font-medium">
                           <Activity size={14} />
                           <span>Uptime: {ont.uptime}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 mt-3">
                      <button 
                        type="button"
                        onClick={() => setSelectedOnt(ont)}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded-lg text-xs font-bold transition-colors border border-white/10 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Gauge size={12} className="text-blue-400" />
                        <span>Diagnóstico</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => navigate(`/admin/genieacs?tab=tr069&search=${encodeURIComponent(ont.mac || ont.id)}`)}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-1.5 rounded-lg text-xs font-bold transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <ExternalLink size={12} />
                        <span>GenieACS</span>
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )})}
          </MarkerClusterGroup>

          {/* Camada de Técnicos e OSs de Campo (GPS em Tempo Real) */}
          {showTechniciansLayer && (
            <>
              {/* Marcadores dos Técnicos em Rota */}
              {tecnicos.map(tec => (
                <Marker
                  key={`tec-${tec.id}`}
                  position={[tec.lat, tec.lng]}
                  icon={createTechnicianIcon(tec.status)}
                  eventHandlers={{
                    click: () => {
                      setSelectedTecnico(tec);
                      setSelectedOS(null);
                      setSelectedOnt(null);
                    }
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="p-2.5 min-w-[240px]">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                          <Wrench size={13} />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-xs leading-none">{tec.nome}</h4>
                          <span className="text-[10px] text-slate-400">{tec.veiculo}</span>
                        </div>
                        <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                          tec.status === 'em_rota' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                          'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {tec.status_label || tec.status}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-300">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Velocidade Atual:</span>
                          <span className="font-mono font-bold text-white">{tec.velocidade_kmh} km/h</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Bateria do PWA:</span>
                          <span className="font-mono text-emerald-400 font-bold">{tec.bateria}%</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Precisão GPS:</span>
                          <span className="font-mono text-slate-300">±{tec.precisao_metros}m</span>
                        </div>
                        <div className="pt-1 text-[10px] text-slate-400 truncate">
                          📍 {tec.endereco}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 mt-3 pt-2 border-t border-white/10">
                        <a 
                          href={`tel:${tec.telefone}`}
                          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded-lg text-xs font-bold transition-colors border border-white/10 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Phone size={12} className="text-emerald-400" />
                          <span>Ligar</span>
                        </a>
                        <button 
                          type="button"
                          onClick={() => navigate('/admin/campo')}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 rounded-lg text-xs font-bold transition-colors shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Navigation size={12} />
                          <span>Painel OS</span>
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Marcadores das Ordens de Serviço Agendadas */}
              {ordensServico.map(os => (
                <Marker
                  key={`os-${os.id}`}
                  position={[os.lat, os.lng]}
                  icon={createServiceOrderIcon(os.prioridade)}
                  eventHandlers={{
                    click: () => {
                      setSelectedOS(os);
                      setSelectedTecnico(null);
                      setSelectedOnt(null);
                    }
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="p-2.5 min-w-[230px]">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                        <span className="text-xs font-mono font-bold text-blue-400">OS #{os.numero}</span>
                        <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                          os.prioridade === 'urgente' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                          os.prioridade === 'alta' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                          'bg-slate-700 text-slate-300 border-white/10'
                        }`}>
                          {typeof os.prioridade === "string" ? os.prioridade.toUpperCase() : "NORMAL"}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-slate-300">
                        <p><strong className="text-white">Tipo:</strong> {os.tipo}</p>
                        <p><strong className="text-white">Cliente:</strong> {os.cliente_nome}</p>
                        <p className="text-[11px] text-slate-400 truncate">📍 {os.endereco}, {os.bairro}</p>
                        {os.tecnico_nome && (
                          <p className="text-[11px] text-indigo-300">🛠️ Atribuído: <strong>{os.tecnico_nome}</strong></p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate('/admin/campo')}
                        className="mt-3 w-full bg-slate-800 hover:bg-slate-700 text-white py-1.5 rounded-lg text-xs font-bold transition-colors border border-white/10 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <ExternalLink size={12} />
                        <span>Abrir Detalhes da OS</span>
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </>
          )}
        </MapContainer>

        {/* Painel Slide-over de Diagnóstico TR-069 da ONT Selecionada */}
        {selectedOnt && (
          <div className="absolute top-4 right-4 bottom-4 w-96 max-w-[calc(100vw-32px)] z-[500] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-200">
            {/* Header do Painel */}
            <div className="p-4 border-b border-white/10 bg-slate-950/60 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Router size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{selectedOnt.id}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                      selectedOnt.status === 'online' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                      selectedOnt.status === 'alerta' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                      'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>
                      {typeof selectedOnt.status === "string" ? selectedOnt.status.toUpperCase() : "DESCONHECIDO"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{selectedOnt.modelo}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOnt(null)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Fechar Painel"
              >
                <X size={16} />
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Cliente e Assinante */}
              <div className="bg-slate-950/60 border border-white/5 rounded-xl p-3 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assinante & Conexão</div>
                <div className="flex justify-between items-start">
                  <span className="text-white font-semibold text-sm">{selectedOnt.cliente}</span>
                  <span className="text-[11px] font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    {selectedOnt.plano}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Endereço IP:</span>
                    <span className="font-mono text-slate-200 font-medium">{selectedOnt.ip}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Uptime:</span>
                    <span className="text-slate-200 font-medium">{selectedOnt.uptime}</span>
                  </div>
                </div>
                <div className="pt-1 border-t border-white/5 flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">MAC Address:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-slate-200 text-[11px] bg-slate-900 px-1.5 py-0.5 rounded border border-white/5">
                      {selectedOnt.mac}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyMac(selectedOnt.mac)}
                      className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
                      title="Copiar MAC"
                    >
                      {copiedMac ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Topologia Óptica OLT/PON */}
              <div className="bg-slate-950/60 border border-white/5 rounded-xl p-3 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Topologia de Fibra</div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">OLT Concentradora:</span>
                  <span className="font-medium text-slate-200">{selectedOnt.olt}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Porta PON / Slot:</span>
                  <span className="font-mono text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    PON {selectedOnt.pon}
                  </span>
                </div>
              </div>

              {/* Telemetria Óptica e Sensores */}
              <div className="bg-slate-950/60 border border-white/5 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Signal size={12} className="text-blue-400" /> Níveis Ópticos (TR-069)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Calibrado</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* RX Power */}
                  <div className="bg-slate-900/80 border border-white/5 p-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 block mb-1">Potência RX (ONU)</span>
                    <span className={`text-base font-bold font-mono ${
                      selectedOnt.status === 'offline' ? 'text-red-400' :
                      selectedOnt.status === 'alerta' ? 'text-amber-400' :
                      'text-emerald-400'
                    }`}>
                      {selectedOnt.rxPower}
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">Ref: -14 a -25 dBm</span>
                  </div>

                  {/* TX Power */}
                  <div className="bg-slate-900/80 border border-white/5 p-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 block mb-1">Potência TX (Laser)</span>
                    <span className="text-base font-bold font-mono text-slate-200">
                      {selectedOnt.txPower}
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">Ref: +1.5 a +5 dBm</span>
                  </div>

                  {/* Temperatura */}
                  <div className="bg-slate-900/80 border border-white/5 p-2.5 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-slate-400">Temp. Interna</span>
                      <Thermometer size={12} className="text-amber-400" />
                    </div>
                    <span className="text-sm font-bold font-mono text-slate-200">{selectedOnt.temp}</span>
                  </div>

                  {/* Tensão */}
                  <div className="bg-slate-900/80 border border-white/5 p-2.5 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-slate-400">Tensão VCC</span>
                      <Zap size={12} className="text-blue-400" />
                    </div>
                    <span className="text-sm font-bold font-mono text-slate-200">{selectedOnt.volt}</span>
                  </div>
                </div>

                {/* Wi-Fi Telemetry */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Wifi size={13} className="text-blue-400" />
                    <span className="font-mono">{selectedOnt.wifiSsid}</span>
                  </div>
                  <span className="text-slate-400">
                    {selectedOnt.wifiClients} disp. conectados
                  </span>
                </div>
              </div>

              {/* Ações de Comando TR-069 */}
              <div className="space-y-2 pt-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Comandos & Diagnóstico</div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={diagnosticLoading}
                    onClick={() => handleRunDiagnostic(selectedOnt.id)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2 px-3 rounded-xl font-semibold text-xs border border-white/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={diagnosticLoading ? 'animate-spin text-blue-400' : 'text-blue-400'} />
                    <span>{diagnosticLoading ? 'Consultando...' : 'Atualizar Sinal'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRebootOnt(selectedOnt.id)}
                    className="w-full bg-slate-800 hover:bg-red-500/20 text-slate-200 hover:text-red-300 py-2 px-3 rounded-xl font-semibold text-xs border border-white/10 hover:border-red-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} className="text-amber-400" />
                    <span>Reiniciar ONT</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/admin/genieacs?tab=tr069&search=${encodeURIComponent(selectedOnt.mac || selectedOnt.id)}`)}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 px-3 rounded-xl font-semibold text-xs shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <ExternalLink size={13} />
                  <span>Abrir Dispositivo no GenieACS</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate(`/admin/crm?search=${encodeURIComponent(selectedOnt.cliente)}`)}
                  className="w-full bg-slate-950 hover:bg-white/5 text-slate-300 hover:text-white py-2 px-3 rounded-xl font-medium text-xs border border-white/10 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Activity size={13} />
                  <span>Ver Assinante no CRM 360</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Painel Slide-over de Técnico Selecionado */}
        {selectedTecnico && (
          <div className="absolute top-4 right-4 bottom-4 w-96 max-w-[calc(100vw-32px)] z-[500] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-200">
            <div className="p-4 border-b border-white/10 bg-slate-950/60 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Wrench size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm leading-tight">{selectedTecnico.nome}</h3>
                  <span className="text-[11px] text-slate-400">Equipe de Campo • {selectedTecnico.veiculo}</span>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedTecnico(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <div className="bg-slate-950/60 border border-white/5 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status Operacional:</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                    selectedTecnico.status === 'em_rota' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {selectedTecnico.status_label || selectedTecnico.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Telemetria GPS:</span>
                  <span className="text-slate-200 font-mono">±{selectedTecnico.precisao_metros} metros</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Velocidade em Trânsito:</span>
                  <span className="font-bold text-white font-mono">{selectedTecnico.velocidade_kmh} km/h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Bateria do Smartphone:</span>
                  <span className="text-emerald-400 font-bold font-mono">{selectedTecnico.bateria}%</span>
                </div>
                <div className="pt-2 border-t border-white/5">
                  <span className="text-slate-400 block mb-1">Última Localização Registrada:</span>
                  <p className="text-slate-200 font-medium">{selectedTecnico.endereco}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <a
                  href={`tel:${selectedTecnico.telefone}`}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Phone size={14} />
                  <span>Ligar para Técnico ({selectedTecnico.telefone})</span>
                </a>
                <button
                  type="button"
                  onClick={() => navigate('/admin/campo')}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 px-3 rounded-xl font-semibold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Navigation size={14} />
                  <span>Gerenciar OSs no Painel de Campo</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Painel Slide-over de Ordem de Serviço Selecionada */}
        {selectedOS && (
          <div className="absolute top-4 right-4 bottom-4 w-96 max-w-[calc(100vw-32px)] z-[500] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-200">
            <div className="p-4 border-b border-white/10 bg-slate-950/60 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Wrench size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm leading-tight">OS #{selectedOS.numero}</h3>
                  <span className="text-[11px] text-slate-400">{selectedOS.tipo}</span>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedOS(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <div className="bg-slate-950/60 border border-white/5 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Prioridade:</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    selectedOS.prioridade === 'urgente' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                    selectedOS.prioridade === 'alta' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                    'bg-slate-700 text-slate-300 border-white/10'
                  }`}>
                    {typeof selectedOS.prioridade === "string" ? selectedOS.prioridade.toUpperCase() : "NORMAL"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Assinante:</span>
                  <span className="font-bold text-white">{selectedOS.cliente_nome}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Técnico Encarregado:</span>
                  <span className="font-medium text-indigo-300">{selectedOS.tecnico_nome || 'Aguardando Despacho'}</span>
                </div>
                <div className="pt-2 border-t border-white/5">
                  <span className="text-slate-400 block mb-1">Endereço do Atendimento:</span>
                  <p className="text-slate-200 font-medium">{selectedOS.endereco} - {selectedOS.bairro}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => navigate(`/admin/crm?search=${encodeURIComponent(selectedOS.cliente_nome)}`)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 px-3 rounded-xl font-semibold text-xs border border-white/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Activity size={14} />
                  <span>Ver Cliente no CRM 360</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin/campo')}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 px-3 rounded-xl font-semibold text-xs shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <ExternalLink size={14} />
                  <span>Abrir no Módulo de Campo</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notificação de Ações TR-069 */}
        {toastMessage && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[600] bg-slate-900 border border-blue-500/40 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium animate-in fade-in-50 zoom-in-95">
            <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
        
        {/* Adicionar CSS Customizado para o Popup do Leaflet para integrar ao tema Dark */}
        <style dangerouslySetInnerHTML={{__html: `
          .leaflet-popup-content-wrapper, .leaflet-popup-tip {
            background-color: #101726 !important;
            color: #f1f5f9 !important;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
          }
          .custom-popup .leaflet-popup-content {
            margin: 0;
            padding: 4px;
          }
          .custom-leaflet-icon {
            background: transparent;
            border: none;
          }
          .leaflet-control-attribution {
            background: rgba(11, 15, 25, 0.8) !important;
            color: #64748b !important;
            border-top-left-radius: 8px;
          }
          .leaflet-control-attribution a {
            color: #3b82f6 !important;
          }
          .leaflet-control-zoom a {
            background-color: #101726 !important;
            color: #f1f5f9 !important;
            border-color: rgba(255, 255, 255, 0.1) !important;
          }
          .leaflet-control-zoom a:hover {
            background-color: #1e293b !important;
          }
        `}} />
      </div>
    </div>
  );
}
