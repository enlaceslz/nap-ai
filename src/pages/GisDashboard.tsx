import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { DivIcon } from 'leaflet';
import { Search, Layers, Server, MapPin, Wifi, X, Bot, Send, Loader2, Activity, AlertTriangle } from 'lucide-react';

interface GisFeature {
 id: string;
 type: string;
 geometry: {
 type: string;
 coordinates: number[];
 };
 properties: {
 name: string;
 status: string;
 description: string;
 layer_id: string;
 vendor?: string;
 rx_power?: number;
 cable_type?: string;
 fibers_count?: number;
 zabbix_trigger?: string;
 };
}

// Criar ícones customizados baseados na camada
const createCustomIcon = (layerId: string, opacity: number = 1, status?: string) => {
 let bgColor = 'bg-emerald-500';
 let borderColor = 'border-emerald-700';

 if (status === 'offline') {
 bgColor = 'bg-red-500';
 borderColor = 'border-red-700';
 } else if (status === 'blocked_sgp') {
 bgColor = 'bg-purple-500';
 borderColor = 'border-purple-700';
 } else if (status === 'warning') {
 bgColor = 'bg-amber-500';
 borderColor = 'border-amber-700';
 } else {
 // Cores padrao por camada se online
 if (layerId === 'layer-olt') {
 bgColor = 'bg-fuchsia-500';
 borderColor = 'border-fuchsia-700';
 } else if (layerId === 'layer-cto') {
 bgColor = 'bg-blue-500';
 borderColor = 'border-blue-700';
 } else if (layerId === 'layer-ceo') {
 bgColor = 'bg-orange-500';
 borderColor = 'border-orange-700';
 } else if (layerId === 'layer-dio') {
 bgColor = 'bg-yellow-500';
 borderColor = 'border-yellow-700';
 }
 }
 
 return new DivIcon({
 className: 'custom-div-icon',
 html: `<div class="w-4 h-4 ${bgColor} border-2 ${borderColor} rounded-full shadow-lg" style="opacity: ${opacity}"></div>`,
 iconSize: [16, 16],
 iconAnchor: [8, 8]
 });
};

export default function GisDashboard() {
 const [features, setFeatures] = useState<GisFeature[]>([]);
 const [loading, setLoading] = useState(true);
 const [activeLayer, setActiveLayer] = useState<string>('all');
 const [tracedPath, setTracedPath] = useState<string[]>([]);
 const [isTracing, setIsTracing] = useState(false);
 const [isViabilityMode, setIsViabilityMode] = useState(false);
 const [viabilityResult, setViabilityResult] = useState<any>(null);
 const [viabilityPoint, setViabilityPoint] = useState<any>(null);
 const [impactReport, setImpactReport] = useState<any>(null);
 const [isCopilotOpen, setIsCopilotOpen] = useState(false);
 const [copilotQuery, setCopilotQuery] = useState('');
 const [copilotHistory, setCopilotHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
 const [isCopilotLoading, setIsCopilotLoading] = useState(false);

 
 
 const ViabilityTool = () => {
 useMapEvents({
 click(e) {
 if (!isViabilityMode) return;
 setViabilityPoint(e.latlng);
 fetch('/api/gis/topology/viability', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ lat: e.latlng.lat, lng: e.latlng.lng })
 })
 .then(res => res.json())
 .then(data => {
 if(data.success) {
 setViabilityResult(data);
 }
 });
 },
 });
 return null;
 };
 
 const handleTracePath = (featureId: string) => {
 setIsTracing(true);
 fetch(`/api/gis/topology/path/${featureId}`)
 .then(res => res.json())
 .then(data => {
 if (data.success) {
 setTracedPath(data.topology_nodes);
 }
 setIsTracing(false);
 })
 .catch(e => {
 console.error('Erro no Trace:', e);
 setIsTracing(false);
 });
 };
 
 
 
 const handleSendCopilot = () => {
 if(!copilotQuery.trim()) return;
 const prompt = copilotQuery;
 setCopilotQuery('');
 setCopilotHistory(prev => [...prev, {role: 'user', text: prompt}]);
 setIsCopilotLoading(true);

 fetch('/api/ai/copilot', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ prompt })
 })
 .then(res => res.json())
 .then(data => {
 setCopilotHistory(prev => [...prev, {role: 'ai', text: data.text}]);
 setIsCopilotLoading(false);
 })
 .catch(() => {
 setCopilotHistory(prev => [...prev, {role: 'ai', text: '❌ Erro de comunicação com a Inteligência do DJD.'}]);
 setIsCopilotLoading(false);
 });
 };
 
 const handleSimulateImpact = (featureId: string) => {
 fetch(`/api/gis/topology/impact/${featureId}`)
 .then(res => res.json())
 .then(data => {
 if (data.success) {
 setImpactReport(data);
 }
 });
 };
 
 const clearTrace = () => {
 setTracedPath([]);
 };
 
 useEffect(() => {
 fetch('/api/gis/features')
 .then(res => res.json())
 .then(data => {
 setFeatures(data);
 setLoading(false);
 })
 .catch(e => {
 console.error('Erro ao carregar dados GIS:', e);
 setLoading(false);
 });
 }, []);

 const filteredFeatures = features.filter(f => activeLayer === 'all' || f.properties.layer_id === activeLayer);

 return (
 <div className="flex flex-col h-full bg-background relative">
 <div className="flex items-center justify-between px-6 py-4 bg-card border-b border-border z-10">
 <div>
 <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
 <MapPin className="text-emerald-400" />
 DJD GIS (Open-Source)
 </h1>
 <p className="text-xs text-muted-foreground mt-1">Georreferenciamento e Engenharia Física Nativa</p>
 </div>
 <div className="flex gap-2 bg-background p-1 rounded-lg border border-border">
 
 <button 
 onClick={() => { setIsViabilityMode(!isViabilityMode); setViabilityResult(null); setViabilityPoint(null); }}
 className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 ${isViabilityMode ? 'bg-amber-600 text-white animate-pulse' : 'bg-muted text-muted-foreground hover:text-white'}`}
 >
 <Search size={14} /> Viabilidade (Clique no Mapa)
 </button>
 
 <button 
 onClick={() => setActiveLayer('all')}
 className={`px-3 py-1.5 rounded text-xs font-semibold ${activeLayer === 'all' ? 'bg-emerald-600 text-white' : 'text-muted-foreground hover:text-white'}`}
 >
 Todas as Camadas
 </button>
 <button 
 onClick={() => setActiveLayer('layer-olt')}
 className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 ${activeLayer === 'layer-olt' ? 'bg-fuchsia-600 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
 >
 <Server size={14} /> OLTs
 </button>
 <button 
 onClick={() => setActiveLayer('layer-ont')}
 className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 ${activeLayer === 'layer-ont' ? 'bg-emerald-600 text-white' : 'text-muted-foreground hover:text-white'}`}
 >
 <Wifi size={14} /> ONTs / Clientes
 </button>
 
 {tracedPath.length > 0 && (
 <button onClick={clearTrace} className="px-3 py-1.5 rounded text-xs font-semibold bg-red-600 text-white hover:bg-red-500 ml-2">
 Limpar Rota
 </button>
 )}
 
 </div>
 </div>

 <div className="flex-1 w-full h-full relative z-0">
 <MapContainer 
 center={[-2.5297, -44.3028]} 
 zoom={12} 
 style={{ height: '100%', width: '100%', zIndex: 0 }}
 zoomControl={true}
 >
 <TileLayer
 className="map-tiles-dark"
 attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
 url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
 />
 
 
 {filteredFeatures.map(feature => {
 const isHighlighted = tracedPath.length > 0 && tracedPath.includes(feature.id);
 const opacity = tracedPath.length === 0 || isHighlighted ? 1 : 0.2;

 if (feature.geometry.type === 'LineString') {
 const positions = feature.geometry.coordinates.map((coord: any) => [coord[1], coord[0]]);
 let pathColor = '#64748b'; // default cabo tronco
 let weight = 4;
 if (feature.properties.cable_type === 'DROP') { pathColor = '#94a3b8'; weight = 2; }
 if (isHighlighted) { pathColor = '#facc15'; weight = 5; } // Highlight amarelo

 return (
 <Polyline 
 key={feature.id} 
 positions={positions} 
 color={pathColor} 
 weight={weight}
 opacity={opacity}
 dashArray={feature.properties.cable_type === 'DROP' ? '5, 5' : undefined}
 >
 <Popup className="gis-popup text-foreground">
 <div className="p-1 min-w-[200px]">
 <strong className="block text-sm font-bold mb-1">{feature.properties.name}</strong>
 <span className="text-xs text-muted-foreground block mb-3 pb-2 border-b border-border">{feature.properties.description}</span>
 <div className="space-y-1 text-xs">
 <div className="flex justify-between"><span className="text-muted-foreground">Tipo:</span><span className="font-semibold">{feature.properties.cable_type}</span></div>
 <div className="flex justify-between"><span className="text-muted-foreground">Fibras:</span><span className="font-semibold">{feature.properties.fibers_count} FO</span></div>
 <div className="mt-3">
 <button onClick={() => handleTracePath(feature.id)} disabled={isTracing} className="w-full bg-card text-foreground text-xs py-1.5 rounded mb-1">Rastrear Rota Integrada</button>
 <button onClick={() => handleSimulateImpact(feature.id)} className="w-full bg-red-900/50 text-red-400 border border-red-800 text-xs py-1.5 rounded hover:bg-red-800 hover:text-white">Simular Rompimento</button>
 </div>
 </div>
 </div>
 </Popup>
 </Polyline>
 );
 }

 const [lng, lat] = feature.geometry.coordinates;
 return (
 <Marker 
 key={feature.id} 
 position={[lat, lng]}
 icon={createCustomIcon(feature.properties.layer_id, opacity, feature.properties.status)}
 >
 
 <Popup className="gis-popup text-foreground">
 <div className="p-1 min-w-[200px]">
 <strong className="block text-sm font-bold mb-1">{feature.properties.name}</strong>
 <span className="text-xs text-muted-foreground block mb-3 pb-2 border-b border-border">{feature.properties.description}</span>
 <div className="space-y-1 text-xs">
 
 <div className="flex justify-between"><span className="text-muted-foreground">Status:</span><span className={`font-bold ${feature.properties.status === 'online' ? 'text-emerald-500' : feature.properties.status === 'blocked_sgp' ? 'text-purple-500' : 'text-red-500'}`}>{typeof feature.properties.status === "string" ? feature.properties.status.toUpperCase() : "DESCONHECIDO"}</span></div>
 {feature.properties.zabbix_trigger && (
 <div className="bg-amber-900/30 border border-amber-500/50 p-1 rounded mt-1 flex justify-between items-center">
 <span className="text-amber-500 text-[10px] font-bold">ZABBIX:</span>
 <span className="text-amber-400 text-[10px] truncate max-w-[120px]">{feature.properties.zabbix_trigger}</span>
 </div>
 )}
 {feature.properties.status === 'blocked_sgp' && (
 <div className="bg-purple-900/30 border border-purple-500/50 p-1 rounded mt-1 flex justify-between items-center">
 <span className="text-purple-500 text-[10px] font-bold">ERP/SGP:</span>
 <span className="text-purple-400 text-[10px]">Fatura Vencida</span>
 </div>
 )}
 
 {feature.properties.rx_power !== undefined && (
 <div className="flex justify-between">
 <span className="text-muted-foreground">Sinal Óptico:</span>
 <span className="font-mono font-semibold">{feature.properties.rx_power} dBm</span>
 </div>
 )}
 
 <div className="flex justify-between mt-2 pt-2 border-t border-slate-100">
 <span className="text-muted-foreground">Módulo de Origem:</span>
 <span className="text-[10px] font-mono bg-slate-100 px-1 rounded">{feature.properties.layer_id}</span>
 </div>
 
 {/* BOTAO PARTE 02 */}
 <div className="mt-3">
 <button 
 className="w-full bg-card text-foreground text-xs py-1.5 rounded hover:bg-muted flex items-center justify-center gap-1"
 onClick={() => handleTracePath(feature.id)}
 disabled={isTracing}
 >
 {isTracing ? 'Calculando...' : 'Rastrear Rota (Topologia)'}
 </button>
 </div>
 
 </div>
 </div>
 </Popup>
 </Marker>
 );
 })}
 <ViabilityTool />
 {viabilityPoint && viabilityResult && viabilityResult.best_option && (<Polyline positions={[[viabilityPoint.lat, viabilityPoint.lng], [viabilityResult.best_option.cto.geometry.coordinates[1], viabilityResult.best_option.cto.geometry.coordinates[0]]]} color={viabilityResult.best_option.viability_status === 'VIÁVEL' ? '#10b981' : '#f59e0b'} weight={3} dashArray="5, 10" />)}
 {viabilityPoint && <Marker position={viabilityPoint} icon={createCustomIcon('layer-clientes')} />}
 
 <ViabilityTool />
 {viabilityPoint && viabilityResult && viabilityResult.best_option && (<Polyline positions={[[viabilityPoint.lat, viabilityPoint.lng], [viabilityResult.best_option.cto.geometry.coordinates[1], viabilityResult.best_option.cto.geometry.coordinates[0]]]} color={viabilityResult.best_option.viability_status === 'VIÁVEL' ? '#10b981' : '#f59e0b'} weight={3} dashArray="5, 10" />)}
 {viabilityPoint && <Marker position={viabilityPoint} icon={createCustomIcon('layer-clientes')} />}
 </MapContainer>
 
 {viabilityResult && (
 <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-card border-2 border-border p-4 rounded-xl shadow-2xl z-[1000] min-w-[300px]">
 <div className="flex justify-between items-start mb-2">
 <h3 className="text-foreground font-bold">Análise de Viabilidade (P3)</h3>
 <button onClick={() => {setViabilityResult(null); setViabilityPoint(null);}} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
 </div>
 
 {viabilityResult.best_option ? (
 <div>
 <div className={`px-3 py-2 rounded text-sm font-semibold mb-3 ${viabilityResult.best_option.viability_status === 'VIÁVEL' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
 {viabilityResult.best_option.viability_status}
 </div>
 <div className="flex justify-between items-center mb-2 pb-2 border-b border-border">
 <span className="text-muted-foreground text-xs">Score de Viabilidade:</span>
 <span className="text-foreground font-bold">{viabilityResult.best_option.score}/100</span>
 </div>
 <p className="text-muted-foreground text-xs mb-1"><strong>Distância:</strong> {viabilityResult.best_option.distance_meters}m</p>
 <p className="text-muted-foreground text-xs mb-1"><strong>CTO Alvo:</strong> {viabilityResult.best_option.cto.properties.name}</p>
 <p className="text-muted-foreground text-xs mb-3"><strong>Portas Livres:</strong> {viabilityResult.best_option.free_ports}</p>
 
 {viabilityResult.alternatives && viabilityResult.alternatives.length > 0 && (
 <div className="mt-3 pt-3 border-t border-border">
 <p className="text-xs text-muted-foreground mb-2">Alternativas ({viabilityResult.alternatives.length}):</p>
 {viabilityResult.alternatives.map((alt: any, idx: number) => (
 <div key={idx} className="flex justify-between text-[10px] text-muted-foreground mb-1">
 <span>{alt.cto.properties.name}</span>
 <span>{alt.distance_meters}m (Score {alt.score})</span>
 </div>
 ))}
 </div>
 )}
 
 <div className="mt-3 bg-muted p-2 rounded">
 <p className="text-[10px] text-muted-foreground mb-1">Confiança da Análise: <strong>{viabilityResult.confidence}</strong></p>
 <ul className="list-disc pl-4 text-[10px] text-muted-foreground">
 {viabilityResult.data_quality?.map((q: string, i: number) => <li key={i}>{q}</li>)}
 </ul>
 </div>
 </div>
 ) : (
 <div className="bg-red-500/20 text-red-400 px-3 py-2 rounded text-sm font-semibold">INVIÁVEL - Nenhuma infraestrutura detectada num raio de 800m.</div>
 )}
 </div>
 )}
 
 {impactReport && (
 <div className="absolute top-4 right-4 bg-card border-2 border-border p-4 rounded-xl shadow-2xl z-[1000] w-[350px] max-h-[80%] overflow-y-auto">
 <div className="flex justify-between items-start mb-2">
 <h3 className="text-foreground font-bold text-red-400">🚨 Relatório de Rompimento (P3)</h3>
 <button onClick={() => setImpactReport(null)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
 </div>
 
 <div className="bg-red-900/20 border border-red-900/50 p-3 rounded-lg mb-4">
 <p className="text-muted-foreground text-xs mb-2">Foco: <span className="font-mono text-foreground">{impactReport.root_name}</span></p>
 <p className="text-[10px] text-amber-400 italic mb-2">"{impactReport.suggestion}"</p>
 <div className="bg-background p-2 rounded border border-border mb-3 flex items-center gap-2">
 <Activity size={14} className="text-cyan-400" />
 <span className="text-[10px] text-muted-foreground">
 Distância Estimada (OTDR): <strong className="text-cyan-400">{impactReport.impact.otdr_distance_meters}m</strong> a partir da {impactReport.impact.otdr_reference}
 </span>
 </div>
 
 <div className="grid grid-cols-2 gap-2 mt-3">
 <div className="bg-card p-2 rounded border border-border text-center">
 <span className="block text-2xl font-bold text-foreground">{impactReport.impact.ceos_affected + impactReport.impact.ctos_affected}</span>
 <span className="text-[10px] text-muted-foreground uppercase">Caixas Isoladas</span>
 </div>
 <div className="bg-card p-2 rounded border border-red-900/50 text-center">
 <span className="block text-2xl font-bold text-red-400">{impactReport.impact.onts_affected}</span>
 <span className="text-[10px] text-red-400/80 uppercase">ONTs Offline</span>
 </div>
 </div>
 </div>
 
 <button 
 onClick={() => {
 fetch('/api/gis/topology/declare-failure/' + impactReport.root_id, { method: 'POST' })
 .then(res => res.json())
 .then(data => {
 if(data.success) {
 alert('Alarme Zabbix gerado com sucesso! ' + data.problem.message);
 setImpactReport(null);
 }
 });
 }}
 className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded text-xs transition-colors flex items-center justify-center gap-2"
 >
 <AlertTriangle size={14} /> Declarar Falha no Zabbix NOC
 </button>
 </div>
 )}


 
 {/* Legenda do Ecossistema */}
 <div className="absolute bottom-4 left-4 z-[1000] bg-card/90 backdrop-blur border border-border p-3 rounded-lg shadow-xl text-xs space-y-2">
 <div className="text-foreground font-bold mb-2 border-b border-border pb-1 flex justify-between items-center">
 <span>Legenda & Integrações</span>
 <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
 </div>
 <div className="flex items-center gap-2 text-muted-foreground"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Online (Normal)</div>
 <div className="flex items-center gap-2 text-muted-foreground"><div className="w-3 h-3 rounded-full bg-red-500 border border-red-700"></div> Offline (Corte Físico)</div>
 <div className="flex items-center gap-2 text-muted-foreground"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Alarme Zabbix</div>
 <div className="flex items-center gap-2 text-muted-foreground"><div className="w-3 h-3 rounded-full bg-purple-500"></div> Bloqueio SGP (Fatura)</div>
 </div>
 
 {/* NOC Copilot FAB & Window */}
 <div className="absolute bottom-4 right-4 z-[1000] flex flex-col items-end">
 {isCopilotOpen && (
 <div className="bg-card border border-border w-[350px] h-[450px] rounded-xl shadow-2xl mb-4 flex flex-col overflow-hidden">
 <div className="bg-muted p-3 flex justify-between items-center border-b border-border">
 <div className="flex items-center gap-2 text-emerald-400 font-bold">
 <Bot size={18} /> NOC Copilot (IA)
 </div>
 <button onClick={() => setIsCopilotOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
 </div>
 
 <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-card/50">
 {copilotHistory.length === 0 && (
 <p className="text-xs text-muted-foreground text-center mt-4">Faça uma pergunta operacional.<br/>Ex: "Quantos clientes serão afetados se o cabo Dist SUL romper?"</p>
 )}
 {copilotHistory.map((msg, i) => (
 <div key={i} className={`p-2 text-xs rounded-lg max-w-[85%] ${msg.role === 'user' ? 'bg-emerald-600/20 text-emerald-100 ml-auto border border-emerald-500/30' : 'bg-muted text-muted-foreground border border-border'}`}>
 <div className="whitespace-pre-wrap">{msg.text}</div>
 </div>
 ))}
 {isCopilotLoading && (
 <div className="bg-muted border border-border text-muted-foreground p-2 text-xs rounded-lg max-w-[85%] flex items-center gap-2">
 <Loader2 size={12} className="animate-spin" /> Analisando a topologia...
 </div>
 )}
 </div>
 
 <div className="p-2 bg-muted border-t border-border flex gap-2">
 <input 
 type="text" 
 value={copilotQuery}
 onChange={(e) => setCopilotQuery(e.target.value)}
 onKeyDown={(e) => e.key === 'Enter' && handleSendCopilot()}
 placeholder="Pergunte ao Copilot..."
 className="flex-1 bg-card text-foreground text-xs px-3 py-2 rounded border border-border focus:outline-none focus:border-emerald-500"
 />
 <button 
 onClick={handleSendCopilot}
 disabled={isCopilotLoading}
 className="bg-emerald-600 text-white p-2 rounded hover:bg-emerald-500 disabled:opacity-50"
 >
 <Send size={14} />
 </button>
 </div>
 </div>
 )}
 
 {!isCopilotOpen && (
 <button 
 onClick={() => setIsCopilotOpen(true)}
 className="bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
 >
 <Bot size={24} />
 </button>
 )}
 </div>
 
 </div>
 </div>
 );
}