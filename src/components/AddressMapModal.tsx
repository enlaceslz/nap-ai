import React, { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  Search, 
  Compass, 
  Phone, 
  AlertCircle,
  Car,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useConfig } from '../contexts/ConfigContext';

export interface EnderecoCliente {
  id?: number | string;
  nome?: string;
  telefone?: string;
  endereco?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  ponto_referencia?: string;
  coordenadas?: {
    lat: number;
    lng: number;
  };
}

interface AddressMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: EnderecoCliente;
  onAddressUpdated?: (novoEndereco: EnderecoCliente) => void;
}

export default function AddressMapModal({
  isOpen,
  onClose,
  cliente,
  onAddressUpdated
}: AddressMapModalProps) {
  const { config } = useConfig();
  const [cepInput, setCepInput] = useState(cliente.cep || '');
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [copiadoCoords, setCopiadoCoords] = useState(false);
  const [mapType, setMapType] = useState<'osm' | 'google' | 'waze'>('osm');

  // Estado editável local do endereço
  const [enderecoAtual, setEnderecoAtual] = useState<EnderecoCliente>(cliente);
  const [pontoReferencia, setPontoReferencia] = useState(cliente.ponto_referencia || '');
  const [salvando, setSalvando] = useState(false);
  const [salvoFeedback, setSalvoFeedback] = useState(false);

  // Sincroniza se o cliente prop mudar
  React.useEffect(() => {
    setEnderecoAtual(cliente);
    setCepInput(cliente.cep || '');
    setPontoReferencia(cliente.ponto_referencia || '');
  }, [cliente]);

  if (!isOpen) return null;

  const lat = enderecoAtual.coordenadas?.lat ?? -23.5505;
  const lng = enderecoAtual.coordenadas?.lng ?? -46.6333;
  const hasCoords = !!enderecoAtual.coordenadas;

  // Monta string limpa para rotas e busca
  const fullAddressQuery = [
    enderecoAtual.logradouro || '',
    enderecoAtual.numero || '',
    enderecoAtual.bairro || '',
    enderecoAtual.cidade || '',
    enderecoAtual.uf || '',
    enderecoAtual.cep ? `CEP ${enderecoAtual.cep}` : ''
  ].filter(Boolean).join(', ') || enderecoAtual.endereco || 'São Paulo, SP';

  // Buscar CEP via endpoint local /api/cep
  const handleBuscarCep = async () => {
    const clean = cepInput.replace(/\D/g, '');
    if (clean.length !== 8) {
      setCepError('Digite um CEP válido com 8 dígitos.');
      return;
    }

    setLoadingCep(true);
    setCepError(null);

    try {
      const res = await fetch(`/api/cep/${clean}`);
      const data = await res.json();

      if (res.ok && data.sucesso && data.dados) {
        const d = data.dados;
        const atualizado: EnderecoCliente = {
          ...enderecoAtual,
          cep: d.cep,
          logradouro: d.logradouro || enderecoAtual.logradouro,
          bairro: d.bairro || enderecoAtual.bairro,
          cidade: d.localidade || enderecoAtual.cidade,
          uf: d.uf || enderecoAtual.uf,
          coordenadas: d.coordenadas || enderecoAtual.coordenadas,
          endereco: `${d.logradouro || ''}, ${enderecoAtual.numero || 'S/N'} - ${d.bairro || ''}, ${d.localidade || ''}/${d.uf || ''}`
        };
        setEnderecoAtual(atualizado);
        if (onAddressUpdated) {
          onAddressUpdated(atualizado);
        }
      } else {
        setCepError(data.erro || 'CEP não localizado na base.');
      }
    } catch (err) {
      console.error('Erro ao consultar CEP:', err);
      setCepError('Falha ao conectar com o serviço de CEP.');
    } finally {
      setLoadingCep(false);
    }
  };

  // Salvar alterações de endereço/ponto de referência no servidor
  const handleSalvarNoSgp = async () => {
    if (!cliente.id) return;
    setSalvando(true);
    try {
      const res = await fetch(`/api/sgp/cliente/${cliente.id}/endereco`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logradouro: enderecoAtual.logradouro,
          numero: enderecoAtual.numero,
          complemento: enderecoAtual.complemento,
          bairro: enderecoAtual.bairro,
          cidade: enderecoAtual.cidade,
          uf: enderecoAtual.uf,
          cep: enderecoAtual.cep,
          ponto_referencia: pontoReferencia,
          coordenadas: enderecoAtual.coordenadas
        })
      });
      if (res.ok) {
        setSalvoFeedback(true);
        setTimeout(() => setSalvoFeedback(false), 3000);
        if (onAddressUpdated) {
          onAddressUpdated({
            ...enderecoAtual,
            ponto_referencia: pontoReferencia
          });
        }
      }
    } catch (err) {
      console.error('Erro ao salvar endereço no SGP:', err);
    } finally {
      setSalvando(false);
    }
  };

  // Gerar mensagem formatada para enviar via WhatsApp para o técnico
  const gerarTextoWhatsApp = () => {
    const nomeCliente = cliente.nome || 'Cliente Provedor';
    const telCliente = cliente.telefone || 'Não informado';
    const end = enderecoAtual.endereco || fullAddressQuery;
    const ref = pontoReferencia ? `\n📍 *Ponto de Ref:* ${pontoReferencia}` : '';
    const coordsStr = hasCoords ? `\n🧭 *Coordenadas GPS:* \`${lat}, ${lng}\`` : '';
    const googleMapsUrl = hasCoords 
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(end)}`;
    const wazeUrl = hasCoords
      ? `https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`
      : `https://www.waze.com/ul?q=${encodeURIComponent(end)}&navigate=yes`;

    return `🛠️ *ORDEM DE SERVIÇO / LOCALIZAÇÃO DO CLIENTE*
👤 *Cliente:* ${nomeCliente} (ID #${cliente.id || 'N/A'})
📞 *Telefone:* ${telCliente}
🏠 *Endereço:* ${end}${ref}${coordsStr}

🗺️ *Abrir Navegação GPS:*
• Google Maps: ${googleMapsUrl}
• Waze: ${wazeUrl}

_Enviado via NAP Telecom (SGP / CRM Integrado)_`;
  };

  const handleCompartilharWhatsApp = () => {
    const texto = encodeURIComponent(gerarTextoWhatsApp());
    window.open(`https://api.whatsapp.com/send?text=${texto}`, '_blank', 'noopener,noreferrer');
  };

  const handleCopiarTexto = () => {
    navigator.clipboard.writeText(gerarTextoWhatsApp());
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const handleCopiarCoordenadas = () => {
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    setCopiadoCoords(true);
    setTimeout(() => setCopiadoCoords(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-slate-900 rounded-3xl border border-white/10  w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do Modal */}
        <div className="p-5 sm:p-6 border-b border-white/10 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-200 text-blue-600 flex items-center justify-center">
              <MapPin size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white font-outfit">
                  Localização e Rotas de Atendimento Técnico
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  GPS & CEP
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {cliente.nome ? `Assinante: ${cliente.nome} (ID #${cliente.id})` : 'Encontre e compartilhe coordenadas para técnicos em campo'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-white/10 hover:bg-slate-200 text-slate-500 hover:text-slate-200 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* Barra de Busca de CEP e Validação */}
          <div className="bg-slate-950 border border-white/10 rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Compass size={14} className="text-blue-600" />
                Busca de CEP no Provedor & ViaCEP
              </label>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <span>Sugestões:</span>
                <button 
                  onClick={() => { setCepInput('04856-200'); }} 
                  className="hover:text-blue-600 underline"
                >
                  04856-200
                </button>
                <span>•</span>
                <button 
                  onClick={() => { setCepInput('01001-000'); }} 
                  className="hover:text-blue-600 underline"
                >
                  01001-000
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={cepInput}
                  onChange={(e) => setCepInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBuscarCep()}
                  placeholder="Digite o CEP (Ex: 04856-200)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs sm:text-sm text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 font-mono "
                />
              </div>
              <button
                type="button"
                onClick={handleBuscarCep}
                disabled={loadingCep || !cepInput.trim()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50  shrink-0"
              >
                {loadingCep ? (
                  <span className="animate-spin text-sm">⏳</span>
                ) : (
                  <Search size={15} />
                )}
                <span>Consultar CEP</span>
              </button>
            </div>

            {cepError && (
              <div className="mt-2.5 p-2 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-400">
                <AlertCircle size={14} className="text-red-500 shrink-0" />
                <span>{cepError}</span>
              </div>
            )}
          </div>

          {/* Grid de Informações de Endereço & Ações Rápidas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Detalhes do Endereço (Editável / Conferência) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="border border-white/10 rounded-2xl p-4 bg-slate-900  space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <MapPin size={14} className="text-blue-600" />
                    Endereço de Instalação SGP
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 font-semibold">
                    CEP: {enderecoAtual.cep || 'Não informado'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Logradouro (Rua / Av)</label>
                    <input 
                      type="text"
                      value={enderecoAtual.logradouro || ''}
                      onChange={(e) => setEnderecoAtual({ ...enderecoAtual, logradouro: e.target.value })}
                      placeholder="Ex: Rua das Acácias"
                      className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-slate-200 focus:bg-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Número</label>
                    <input 
                      type="text"
                      value={enderecoAtual.numero || ''}
                      onChange={(e) => setEnderecoAtual({ ...enderecoAtual, numero: e.target.value })}
                      placeholder="Ex: 412"
                      className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-slate-200 focus:bg-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Bairro</label>
                    <input 
                      type="text"
                      value={enderecoAtual.bairro || ''}
                      onChange={(e) => setEnderecoAtual({ ...enderecoAtual, bairro: e.target.value })}
                      placeholder="Ex: Jardim Primavera"
                      className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-slate-200 focus:bg-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Cidade</label>
                    <input 
                      type="text"
                      value={enderecoAtual.cidade || ''}
                      onChange={(e) => setEnderecoAtual({ ...enderecoAtual, cidade: e.target.value })}
                      placeholder="Ex: São Paulo"
                      className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-slate-200 focus:bg-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">UF</label>
                    <input 
                      type="text"
                      value={enderecoAtual.uf || ''}
                      onChange={(e) => setEnderecoAtual({ ...enderecoAtual, uf: e.target.value })}
                      placeholder="SP"
                      maxLength={2}
                      className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-slate-200 uppercase focus:bg-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* Ponto de Referência para técnicos */}
                <div>
                  <label className="block text-[11px] font-bold text-amber-500 mb-1 flex items-center justify-between">
                    <span>Ponto de Referência para Técnicos em Campo:</span>
                    <span className="text-[10px] font-normal text-slate-400">Crucial para visitas e rotas</span>
                  </label>
                  <input
                    type="text"
                    value={pontoReferencia}
                    onChange={(e) => setPontoReferencia(e.target.value)}
                    placeholder="Ex: Próximo à Padaria Flor da Primavera / Em frente à CTO-12 / Casa com portão preto"
                    className="w-full px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-slate-200 focus:bg-slate-900 focus:outline-none focus:border-amber-500  font-medium"
                  />
                </div>

                {/* Coordenadas e Ação de Salvar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 font-medium">Coordenadas:</span>
                    <span className="font-mono font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-white/10">
                      {lat.toFixed(5)}, {lng.toFixed(5)}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopiarCoordenadas}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-400 flex items-center gap-1"
                    >
                      {copiadoCoords ? <Check size={12} /> : <Copy size={12} />}
                      {copiadoCoords ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSalvarNoSgp}
                    disabled={salvando}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {salvando ? 'Salvando...' : salvoFeedback ? '✓ Sincronizado no SGP' : 'Salvar no SGP'}
                  </button>
                </div>
              </div>
            </div>

            {/* Painel de Compartilhamento Direto para o Técnico */}
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200 rounded-2xl p-4 ">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center ">
                    <Share2 size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white font-outfit">Enviar para o Técnico</h4>
                    <p className="text-[11px] text-slate-500">Compartilhar via WhatsApp com 1 clique</p>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Transmita a localização exata, link do Google Maps, Waze e pontos de referência para o técnico em rota.
                </p>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleCompartilharWhatsApp}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all  -600/20 active:scale-98"
                  >
                    <Share2 size={15} />
                    <span>Compartilhar no WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopiarTexto}
                    className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-950 border border-white/10 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors "
                  >
                    {copiado ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{copiado ? 'Texto Copiado!' : 'Copiar Texto da OS'}</span>
                  </button>
                </div>
              </div>

              {/* Botões Diretos de Navegação Externa */}
              <div className="border border-white/10 rounded-2xl p-3.5 bg-slate-900 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Navegação Opcional (URL Intent)
                </span>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-200 text-blue-400 rounded-xl text-xs font-bold flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Navigation size={14} /> Abrir no Google Maps (Free Intent)
                  </span>
                  <ExternalLink size={13} />
                </a>

                <a
                  href={`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 bg-cyan-50 hover:bg-cyan-100/80 border border-cyan-200 text-cyan-800 rounded-xl text-xs font-bold flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Car size={14} /> Abrir Rota no Waze (Free Intent)
                  </span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </div>

          {/* Visualizador de Mapa Embutido */}
          <div className="border border-white/10 rounded-2xl overflow-hidden bg-slate-900 ">
            <div className="p-3 bg-slate-950 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers size={15} className="text-slate-500" />
                <span className="text-xs font-bold text-slate-200">Visualização Integrada (OpenStreetMap)</span>
                <span className="text-[10px] font-mono text-slate-500">
                  ({lat.toFixed(4)}, {lng.toFixed(4)})
                </span>
              </div>
            </div>

            {/* Container do MapContainer / Mapa Interativo Nativo */}
            <div className="relative w-full h-64 sm:h-80 bg-slate-800 z-0">
              <MapContainer 
                center={[lat, lng]} 
                zoom={14} 
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
              >
                <TileLayer
                  url={config.mapa?.tileUrlDark || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                  attribution={config.mapa?.atribuicao || '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'}
                  className="map-tiles-dark"
                />
                <Marker 
                  position={[lat, lng]}
                  icon={new DivIcon({
                    className: 'custom-leaflet-icon',
                    html: `<div class="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center"></div>`,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                  })}
                />
              </MapContainer>

              {/* Overlay com resumo do ponto no mapa */}
              <div className="absolute bottom-3 left-3 bg-slate-900/95 backdrop-blur-xs border border-white/10 px-3 py-2 rounded-xl max-w-xs text-xs pointer-events-none z-[400]">
                <p className="font-bold text-white truncate">{enderecoAtual.nome || 'Local de Instalação'}</p>
                <p className="text-[11px] text-slate-400 truncate">{enderecoAtual.endereco}</p>
                {pontoReferencia && (
                  <p className="text-[10px] text-amber-400 font-medium truncate mt-0.5">
                    📍 {pontoReferencia}
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info size={14} className="text-slate-400" />
            <span>Compatível com sistemas de roteirização externa e despachador SGP.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-200 rounded-xl text-xs font-bold transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
