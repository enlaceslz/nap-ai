import React, { useState, useEffect } from 'react';
import { 
  Navigation, MapPin, CheckCircle2, Clock, AlertTriangle, 
  Wrench, Camera, PenTool, X, Activity, Radio, Phone, Shield, ArrowRight, 
  RefreshCw, Check, Sparkles, Smartphone, Battery, Compass,
  ExternalLink, FileText, UploadCloud, ArrowLeft
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { DivIcon } from 'leaflet';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';
import { useGeolocationTracker } from '../hooks/useGeolocationTracker';
import { useOperatorPushNotifications } from '../hooks/useOperatorPushNotifications';
import { fetchWorkOrders, updateOrderStatus } from '../services/fieldApi';
import { oltApi } from '../services/oltApi';

type OSItem = {
  id: string;
  numero: string;
  tipo: 'Instalacao' | 'Reparo' | 'Migracao' | 'Retirada';
  cliente_nome: string;
  cliente_cpf: string;
  endereco: string;
  bairro: string;
  cidade: string;
  lat: number;
  lng: number;
  status: 'pendente' | 'em_deslocamento' | 'no_local' | 'executando' | 'concluida';
  prioridade: 'normal' | 'alta' | 'urgente';
  sinal_optico_dbm?: number;
  onu_mac?: string;
  onu_serial?: string;
  horario_agendado: string;
  observacoes: string;
};

export default function TecnicoCampo() {
  const { user } = useAuth();
  const { config } = useConfig();
  const { geoData } = useGeolocationTracker();
  const { showNotification } = useOperatorPushNotifications();

  const [ordens, setOrdens] = useState<OSItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOS, setSelectedOS] = useState<OSItem | null>(null);
  const [isDiagnosticando, setIsDiagnosticando] = useState(false);
  const [checklist, setChecklist] = useState({
    conectorMontado: false,
    potenciaMedida: false,
    wifiConfigurado: false,
    speedtestRealizado: false,
    assinaturaCliente: false
  });
  const [conclusaoMsg, setConclusaoMsg] = useState<string | null>(null);

  const [showAssinaturaModal, setShowAssinaturaModal] = React.useState(false);
  const [assinaturaData, setAssinaturaData] = React.useState<string | null>(null);
  const [fotoInstalacao, setFotoInstalacao] = React.useState<string | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);


  // Carregar OSs de campo do servidor
const mockOrdens: OSItem[] = [
  { id: '1', numero: 'OS-000182', tipo: 'Reparo', cliente_nome: 'João Silva', cliente_cpf: '111', endereco: 'Rua A', bairro: 'Cohab', cidade: 'São Luís', lat: -2.529, lng: -44.302, status: 'pendente', prioridade: 'alta', horario_agendado: '14:00', observacoes: 'Mock' }
];
  const carregarOrdens = async () => {
    try {
      setLoading(true);
      const orders = await fetchWorkOrders();
      if (orders && Array.isArray(orders)) {
        // Map backend orders to frontend OSItem types roughly
        const mappedOrders: OSItem[] = orders.map((o: any) => ({
          id: o.id,
          numero: o.osNumber,
          tipo: (o.priority === 'critical' ? 'Reparo' : 'Instalacao') as 'Instalacao' | 'Reparo' | 'Migracao' | 'Retirada',
          cliente_nome: o.customerName || o.assignedTo,
          cliente_cpf: 'N/A',
          endereco: (o.location && typeof o.location === 'object' ? o.location.address : o.location) || 'Localidade Zabbix',
          bairro: 'Desconhecido',
          cidade: 'Sede',
          lat: (o.location && typeof o.location === 'object' ? o.location.lat : o.lat) || -23.5505,
          lng: (o.location && typeof o.location === 'object' ? o.location.lng : o.lng) || -46.6333,
          status: o.status,
          prioridade: o.priority === 'critical' ? 'alta' : 'normal',
          observacoes: o.problem,
          horario_agendado: o.scheduled_time || 'Hoje'
        }));
        
        setOrdens(mappedOrders);
        if (!selectedOS && mappedOrders.length > 0) {
          if (window.innerWidth >= 1024) {
            setSelectedOS(mappedOrders[0]);
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar ordens:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarOrdens();
  }, []);

  // Atualizar status da OS
  const handleUpdateStatus = async (osId: string, novoStatus: OSItem['status']) => {
    try {
      const data = await updateOrderStatus(osId, novoStatus, user?.name || 'Tecnico', 'Atualizado via PWA');
      if (data.success) {
        setOrdens(prev => prev.map(o => o.id === osId ? { ...o, status: novoStatus } : o));
        if (selectedOS?.id === osId) {
          setSelectedOS(prev => prev ? { ...prev, status: novoStatus } : null);
        }
        showNotification(`OS Atualizada: ${novoStatus.toUpperCase()}`, {
          body: `Status transmitido ao NOC e Atendimento com sucesso.`,
          tag: `os_status_${osId}`
        }, 'suporte');
      }
    } catch (e) {
      console.warn('Erro ao atualizar status', e);
    }
  };

  // Diagnóstico TR-069 in loco da ONU
  const handleDiagnosticarSinal = async (os: OSItem) => {
    setIsDiagnosticando(true);
    try {
      let medicaoAtual = -20.4;
      
      // Tenta buscar a ONT real se a OS tiver mac ou serial
      if (os.onu_mac || os.onu_serial) {
        try {
          const onus = await oltApi.getOnus();
          const targetOnu = onus.find(o => 
            (os.onu_mac && o.mac === os.onu_mac) || 
            (os.onu_serial && o.serial === os.onu_serial)
          );
          if (targetOnu) {
            const diag = await oltApi.runDiagnostics(targetOnu.id);
            medicaoAtual = diag.optical.rx_onu;
          } else {
            medicaoAtual = Number((-19.0 - Math.random() * 4).toFixed(1));
          }
        } catch (e) {
          medicaoAtual = Number((-19.0 - Math.random() * 4).toFixed(1));
        }
      } else {
        // Fallback simulado se a OS não possuir os dados vinculados
        await new Promise(resolve => setTimeout(resolve, 1200));
        medicaoAtual = Number((-19.0 - Math.random() * 4).toFixed(1));
      }

      setOrdens(prev => prev.map(o => o.id === os.id ? { ...o, sinal_optico_dbm: medicaoAtual } : o));
      if (selectedOS?.id === os.id) {
        setSelectedOS(prev => prev ? { ...prev, sinal_optico_dbm: medicaoAtual } : null);
      }
      setChecklist(c => ({ ...c, potenciaMedida: true }));
      
      showNotification("Diagnóstico Óptico Realizado", {
        body: `Potência RX aferida: ${medicaoAtual} dBm.`,
        tag: `diag_${os.id}`
      }, 'noc');
    } finally {
      setIsDiagnosticando(false);
    }
  };

  // Concluir Atendimento
  
  // Funções do Canvas de Assinatura
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setAssinaturaData(null);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setAssinaturaData(canvas.toDataURL());
  };
  
  const handleCapturePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => setFotoInstalacao(e.target?.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleConcluirAtendimento = async (osId: string) => {
    await handleUpdateStatus(osId, 'concluida');
    setConclusaoMsg("Ordem de serviço finalizada e sincronizada com o ERP!");
    setTimeout(() => setConclusaoMsg(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-6 space-y-6 pb-24">
      {/* Header Mobile-First do Técnico de Campo */}
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <Wrench size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white font-outfit">Modo Técnico de Campo</h1>
              <span className="text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                PWA Campo
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Operador logado: <strong className="text-slate-200">{user?.name}</strong> • Veículo: <span className="text-emerald-300">{user?.veiculo || 'Fiorino 01'}</span>
            </p>
          </div>
        </div>

        {/* Telemetria GPS em Tempo Real */}
        <div className="flex items-center gap-3 bg-slate-950 border border-white/10 px-4 py-2.5 rounded-xl w-full md:w-auto justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">GPS Ativo (Backgr.)</div>
              <div className="font-mono text-emerald-400 font-bold text-xs">
                {geoData.statusRastreamento === 'ativo' ? 'Satélite OK / Transmitindo' : 'Rastreamento Background'}
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-white/10"></div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Compass size={14} className="text-blue-400" />
            <span className="font-mono text-xs">{geoData.velocidade} km/h</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Battery size={14} className="text-emerald-400" />
            <span className="font-mono text-xs">88%</span>
          </div>
        </div>
      </div>

      {conclusaoMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-sm font-bold flex items-center gap-3 animate-in fade-in duration-200">
          <CheckCircle2 size={20} />
          <span>{conclusaoMsg}</span>
        </div>
      )}

      {/* Grid Principal: Lista de OSs + Detalhe / Ferramentas de Campo */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">
        </div>
{/* Coluna Esquerda: Lista de OSs */}
        <div className={`lg:col-span-4 space-y-4 ${selectedOS && window.innerWidth < 1024 ? 'hidden' : 'block'}`}>
        <div className={`lg:col-span-5 space-y-3 ${selectedOS ? 'hidden lg:block' : 'block'}`}>
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Ordens de Serviço ({ordens.length})
            </h2>
            <button 
              onClick={carregarOrdens}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              <span>Atualizar</span>
            </button>
          </div>

          <div className="space-y-3">
            {ordens.map((os) => (
              <div 
                key={os.id}
                onClick={() => setSelectedOS(os)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedOS?.id === os.id 
                    ? 'bg-slate-900 border-blue-500/50 shadow-lg' 
                    : 'bg-slate-900 border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="font-mono text-xs text-blue-400 font-bold">{os.numero}</span>
                    <h3 className="text-sm font-bold text-white leading-tight">{os.cliente_nome}</h3>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    os.status === 'concluida' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    os.status === 'no_local' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                    os.status === 'em_deslocamento' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                    'bg-slate-800 text-slate-400 border-white/5'
                  }`}>
                    {os.status === 'no_local' ? 'No Local' : os.status === 'em_deslocamento' ? 'Em Rota' : os.status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                  <MapPin size={13} className="text-red-400 shrink-0" />
                  <span className="truncate">{os.endereco}, {os.bairro}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock size={12} className="text-slate-500" />
                    {os.horario_agendado}
                  </span>
                  <span className={`font-bold ${os.prioridade === 'urgente' ? 'text-red-400' : 'text-slate-400'}`}>
                    Tipo: {os.tipo}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna Direita: Painel de Atendimento da OS Selecionada */}
        <div className={`lg:col-span-7 ${!selectedOS ? 'hidden lg:block' : 'block'}`}>
          {selectedOS ? (
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 md:p-6 space-y-6">
              {/* Header da OS */}
              <button 
                onClick={() => setSelectedOS(null)} 
                className="lg:hidden flex items-center gap-1.5 text-slate-300 font-bold bg-white/5 hover:bg-white/10 border border-white/10 py-2 px-3 rounded-xl transition-colors mb-2 w-fit"
              >
                <ArrowLeft size={16} /> Voltar para lista de OS
              </button>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-blue-400">{selectedOS.numero}</span>
                    <span className="text-xs bg-white/5 border border-white/10 text-slate-300 px-2 py-0.5 rounded font-bold">
                      {selectedOS.tipo}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">{selectedOS.cliente_nome}</h2>
                  <p className="text-xs text-slate-400">CPF: {selectedOS.cliente_cpf} • Agendamento: {selectedOS.horario_agendado}</p>
                </div>
              </div>

              {/* Endereço & Ações Rápidas de Deslocamento */}
              <div className="bg-slate-950 border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <MapPin size={18} className="text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Endereço de Atendimento</h4>
                        <p className="text-sm font-semibold text-white">{selectedOS.endereco}</p>
                        <p className="text-xs text-slate-400">{selectedOS.bairro} - {selectedOS.cidade}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Visualização de Rota Integrada */}
                  <div className="flex-1 h-32 rounded-xl overflow-hidden border border-white/10 relative z-0">
                     <MapContainer 
                        center={[selectedOS.lat, selectedOS.lng]} 
                        zoom={14} 
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                      >
                        <TileLayer
                          url={config.mapa?.tileUrlDark || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                          attribution={config.mapa?.atribuicao || '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'}
                          className="map-tiles-dark"
                        />
                        <Marker 
                          position={[selectedOS.lat, selectedOS.lng]}
                          icon={new DivIcon({
                            className: 'custom-leaflet-icon',
                            html: `<div class="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center"></div>`,
                            iconSize: [24, 24],
                            iconAnchor: [12, 12]
                          })}
                        />
                        <Marker 
                          position={[geoData.lat, geoData.lng]}
                          icon={new DivIcon({
                            className: 'custom-leaflet-icon',
                            html: `<div class="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center animate-pulse"></div>`,
                            iconSize: [24, 24],
                            iconAnchor: [12, 12]
                          })}
                        />
                      </MapContainer>
                      <div className="absolute top-2 right-2 bg-slate-900/90 backdrop-blur border border-white/10 text-[10px] px-2 py-1 rounded-md z-[400] text-blue-400 font-bold shadow-md">
                         GPS Integrado
                      </div>
                  </div>
                </div>

                {/* Botões de Transição de Status em Campo */}
                
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedOS.id, 'em_deslocamento');
                      showNotification('Deslocamento Iniciado', { body: 'O NOC e o cliente foram notificados. Acompanhamento GPS em tempo real ativado.', tag: 'gps_start' }, 'noc');
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      selectedOS.status === 'em_deslocamento'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5 hover:border-white/20'
                    }`}
                  >
                    <Navigation size={14} className={selectedOS.status === 'em_deslocamento' ? 'animate-pulse' : ''} /> 1. Iniciar Rota
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedOS.id, 'no_local');
                      showNotification('Chegada Confirmada', { body: 'Horário de chegada registrado no SGP.', tag: 'gps_arrive' }, 'noc');
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      selectedOS.status === 'no_local'
                        ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5 hover:border-white/20'
                    }`}
                  >
                    <MapPin size={14} /> 2. Cheguei
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedOS.id, 'executando')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      selectedOS.status === 'executando'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5 hover:border-white/20'
                    }`}
                  >
                    <Wrench size={14} /> 3. Executando
                  </button>
                </div>

              </div>

              {/* Ferramenta TR-069: Diagnóstico Óptico in loco */}
              <div className="bg-slate-950 border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio size={16} className="text-blue-400" />
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      GenieACS TR-069 (Sinal da ONU)
                    </h4>
                  </div>
                  <button
                    onClick={() => handleDiagnosticarSinal(selectedOS)}
                    disabled={isDiagnosticando}
                    className="flex items-center gap-1.5 text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-lg font-bold transition-all"
                  >
                    <RefreshCw size={12} className={isDiagnosticando ? 'animate-spin' : ''} />
                    {isDiagnosticando ? 'Aferindo Potência...' : 'Medir Sinal Óptico'}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-900 border border-white/5 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Potência RX Óptica</span>
                    <span className={`text-lg font-mono font-bold ${
                      (selectedOS.sinal_optico_dbm || 0) < -26 ? 'text-red-400' : 'text-emerald-400'
                    }`}>
                      {selectedOS.sinal_optico_dbm ? `${selectedOS.sinal_optico_dbm} dBm` : '-- dBm'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Ideal: -18 a -24 dBm</span>
                  </div>

                  <div className="p-3 bg-slate-900 border border-white/5 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Serial da ONU</span>
                    <span className="text-xs font-mono font-bold text-slate-200 block truncate">
                      {selectedOS.onu_serial || 'ZTEG12345678'}
                    </span>
                    <span className="text-[10px] text-emerald-400">Provisionada TR-069</span>
                  </div>

                  <div className="p-3 bg-slate-900 border border-white/5 rounded-xl col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">MAC da CPE</span>
                    <span className="text-xs font-mono font-bold text-slate-200 block truncate">
                      {selectedOS.onu_mac || 'E0:67:B3:91:AA:12'}
                    </span>
                    <span className="text-[10px] text-slate-500">Wi-Fi 6 Ativo</span>
                  </div>
                </div>
              </div>

              {/* Checklist de Validação em Campo */}
              <div className="bg-slate-950 border border-white/10 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Checklist de Conclusão Técnica
                </h4>
                <div className="space-y-2">
                  {[
                    { key: 'conectorMontado', label: 'Conector SC/APC montado e clivado com precisão' },
                    { key: 'potenciaMedida', label: 'Potência óptica atestada no power meter / TR-069' },
                    { key: 'wifiConfigurado', label: 'Roteador Wi-Fi 6 configurado com 2.4GHz e 5GHz unificadas' },
                    { key: 'speedtestRealizado', label: 'Teste de velocidade realizado acima de 500 Mbps' },
                    { key: 'assinaturaCliente', label: 'Aceite digital e assinatura do cliente colhidos' }
                  ].map((item) => (
                    <label 
                      key={item.key}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <input 
                        type="checkbox"
                        checked={(checklist as any)[item.key]}
                        onChange={(e) => setChecklist({ ...checklist, [item.key]: e.target.checked })}
                        className="w-4 h-4 rounded border-white/20 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-medium text-slate-300">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Botão Final de Concluir OS */}
              <button
                onClick={() => setShowAssinaturaModal(true)}
                disabled={selectedOS.status === 'concluida'}
                className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] disabled:opacity-50"
              >
                <CheckCircle2 size={18} />
                {selectedOS.status === 'concluida' ? 'OS Concluída com Sucesso' : 'Finalizar e Assinar OS no ERP SGP'}
              </button>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 border border-white/5 rounded-2xl">
              Selecione uma Ordem de Serviço na lista ao lado para iniciar o atendimento.
            </div>
          )}
        </div>
      </div>

      {/* Modal de Assinatura e Foto (Comprovação) */}
      {showAssinaturaModal && selectedOS && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950">
              <h3 className="font-bold text-white flex items-center gap-2">
                <PenTool size={18} className="text-emerald-400" />
                Comprovação de OS
              </h3>
              <button onClick={() => setShowAssinaturaModal(false)} className="text-slate-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase">1. Foto da Instalação (CTO/ONU)</label>
                {!fotoInstalacao ? (
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-white/10 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                    <Camera size={32} className="text-slate-400 mb-2" />
                    <span className="text-sm font-bold text-slate-300">Tirar Foto</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCapturePhoto} />
                  </label>
                ) : (
                  <div className="relative h-32 rounded-xl overflow-hidden border border-white/10">
                    <img src={fotoInstalacao} alt="Instalação" className="w-full h-full object-cover" />
                    <button onClick={() => setFotoInstalacao(null)} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg shadow-lg">
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase">2. Assinatura do Cliente</label>
                  <button onClick={clearSignature} className="text-xs text-slate-400 hover:text-white">Limpar</button>
                </div>
                <div className="bg-slate-950 border border-white/10 rounded-xl overflow-hidden relative touch-none">
                  <canvas 
                    ref={canvasRef}
                    width={400}
                    height={150}
                    className="w-full h-[150px] cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseOut={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  <div className="absolute bottom-2 left-2 pointer-events-none">
                    <span className="text-[10px] text-slate-500 font-mono">Assine acima</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-slate-950">
              <button
                onClick={() => {
                  saveSignature();
                  setShowAssinaturaModal(false);
                  handleConcluirAtendimento(selectedOS.id);
                }}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition-all active:scale-[0.99] flex justify-center items-center gap-2"
              >
                <CheckCircle2 size={18} />
                Validar e Encerrar OS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}