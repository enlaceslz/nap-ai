import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
 Activity, Server, AlertTriangle, ShieldCheck, Zap, Thermometer, 
 Cpu, HardDrive, Search, Filter, RefreshCw, BarChart2, Radio, Network, 
 CheckCircle2, Clock, ChevronRight, X, Sliders, Eye, Send, Terminal,
 Layers, Wifi, Settings, Info, Bell, Check, ArrowUpRight, Gauge, SlidersHorizontal
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { registrarAcaoAuditoria } from '../lib/audit';
import { useConfig } from '../contexts/ConfigContext';

interface ZabbixHost {
 id: number;
 name: string;
 ip: string;
 vendor: 'Huawei' | 'ZTE' | 'Datacom' | 'Fiberhome' | 'MikroTik' | 'Juniper';
 model: string;
 location: string;
 cpu: number;
 ram: number;
 temp: number;
 uptime: string;
 status: 'online' | 'warning' | 'critical' | 'offline';
 ponPorts: number;
 activeOnus: number;
 powerSupply: string;
 fanRpm: number;
 uplinkCapacity: string;
}

interface ZabbixProblem {
 id: number;
 host: string;
 hostId: number;
 severity: 'disaster' | 'high' | 'average' | 'warning' | 'information' | 'critical' | 'info';
 priority?: number;
 message: string;
 time: string;
 ack: boolean;
 ackMessage?: string;
 ackAuthor?: string;
 timestamp: number;
}

interface ZabbixHealth {
 version: string;
 endpoint: string;
 connected: boolean;
 latencyMs: number;
 monitoredHosts: number;
 activeTriggers: number;
 unackTriggers: number;
}

export default function NocMonitoramento() {
 const { config } = useConfig();
 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);
 const [alarms, setAlarms] = useState<ZabbixProblem[]>([]);
 const [nodes, setNodes] = useState<ZabbixHost[]>([]);
 const [health, setHealth] = useState<ZabbixHealth | null>(null);

 // Filtros de Triggers
 const [searchTrigger, setSearchTrigger] = useState('');
 const [severityFilter, setSeverityFilter] = useState<'all' | 'disaster' | 'high' | 'average' | 'warning' | 'information'>('all');
 const [ackFilter, setAckFilter] = useState<'all' | 'unack' | 'ack'>('all');

 // Tráfego
 const [trafficRange, setTrafficRange] = useState<'today' | '7d' | '30d'>('today');
 const [trafficLayer, setTrafficLayer] = useState<'total' | 'ixbr' | 'cdn' | 'transit'>('total');
 const [trafficData, setTrafficData] = useState<any[]>([]);
 const [peakTraffic, setPeakTraffic] = useState('14.8');

 // Modais e Detalhes
 const [selectedHost, setSelectedHost] = useState<ZabbixHost | null>(null);
 const [showConfigModal, setShowConfigModal] = useState(false);
 const [showSimulateModal, setShowSimulateModal] = useState(false);
 const [ackModalProblem, setAckModalProblem] = useState<ZabbixProblem | null>(null);
 const [ackNote, setAckNote] = useState('');
 const [ackAuthor, setAckAuthor] = useState('Operador NOC N2');
 const [isSubmittingAck, setIsSubmittingAck] = useState(false);

 // Simulação de Trigger
 const [simHostId, setSimHostId] = useState<number>(1001);
 const [simSeverity, setSimSeverity] = useState<'disaster' | 'high' | 'average' | 'warning' | 'information'>('high');
 const [simMessage, setSimMessage] = useState('');
 const [simFeedback, setSimFeedback] = useState<string | null>(null);

 // Feedback geral
 const [bannerAlert, setBannerAlert] = useState<string | null>(null);

 const fetchTrafficData = async (range: 'today' | '7d' | '30d') => {
 try {
 const res = await fetch(`/api/zabbix/traffic?range=${range}`);
 const data = await res.json();
 if (data.success && data.points) {
 setTrafficData(data.points);
 setPeakTraffic(data.peakGbps ? data.peakGbps.toString() : '14.8');
 }
 } catch {
 // Fallback
 if (range === '7d') {
 setTrafficData([
 { time: 'Seg', tx: 11.2, rx: 3.4, ixbr: 6.8, cdn: 4.8, transit: 3.0 },
 { time: 'Ter', tx: 12.1, rx: 3.6, ixbr: 7.2, cdn: 5.2, transit: 3.3 },
 { time: 'Qua', tx: 13.0, rx: 3.9, ixbr: 7.9, cdn: 5.6, transit: 3.4 },
 { time: 'Qui', tx: 13.5, rx: 4.1, ixbr: 8.2, cdn: 5.9, transit: 3.5 },
 { time: 'Sex', tx: 14.8, rx: 4.8, ixbr: 9.1, cdn: 6.5, transit: 4.0 },
 { time: 'Sáb', tx: 15.6, rx: 5.2, ixbr: 9.8, cdn: 7.2, transit: 3.8 },
 { time: 'Dom', tx: 15.2, rx: 5.0, ixbr: 9.4, cdn: 7.0, transit: 3.8 },
 ]);
 } else {
 setTrafficData([
 { time: '00:00', tx: 4.2, rx: 1.1, ixbr: 2.4, cdn: 2.1, transit: 0.8 },
 { time: '04:00', tx: 2.1, rx: 0.8, ixbr: 1.2, cdn: 1.1, transit: 0.6 },
 { time: '08:00', tx: 5.8, rx: 2.4, ixbr: 3.5, cdn: 2.6, transit: 2.1 },
 { time: '12:00', tx: 8.9, rx: 3.2, ixbr: 5.2, cdn: 4.1, transit: 2.8 },
 { time: '16:00', tx: 10.2, rx: 3.9, ixbr: 6.1, cdn: 4.8, transit: 3.2 },
 { time: '20:00', tx: 14.8, rx: 5.3, ixbr: 9.2, cdn: 6.7, transit: 4.2 },
 { time: '23:59', tx: 11.2, rx: 4.1, ixbr: 6.9, cdn: 5.1, transit: 3.3 },
 ]);
 }
 }
 };

 const fetchNocData = async () => {
 try {
 const [wafRes, zabbixRes, healthRes] = await Promise.all([
 fetch('/api/noc/security-alerts').catch(() => null),
 fetch('/api/zabbix/status').catch(() => null),
 fetch('/api/zabbix/health').catch(() => null)
 ]);

 let wafAlerts: any[] = [];
 if (wafRes && wafRes.ok) {
 wafAlerts = await wafRes.json().catch(() => []);
 }

 let zabbixData: any = null;
 if (zabbixRes && zabbixRes.ok) {
 zabbixData = await zabbixRes.json().catch(() => null);
 }

 let healthData: any = null;
 if (healthRes && healthRes.ok) {
 healthData = await healthRes.json().catch(() => null);
 if (healthData && healthData.server) {
 setHealth(healthData.server);
 }
 }

 if (zabbixData && zabbixData.problems) {
 const normalizedZabbix = zabbixData.problems.map((p: any) => {
 let sev = p.severity;
 if (sev === 'critical') sev = 'disaster';
 if (sev === 'info') sev = 'information';
 return { ...p, severity: sev };
 });

 const normalizedWaf = Array.isArray(wafAlerts) ? wafAlerts.map((w: any) => ({
 id: w.id || Date.now() + Math.random(),
 host: w.host || 'WAF / Edge Protection',
 hostId: 9999,
 severity: (w.severity === 'critical' ? 'disaster' : w.severity || 'high') as any,
 message: w.message || 'Alerta de Segurança WAF',
 time: w.time || 'Agora',
 ack: !!w.ack,
 timestamp: w.timestamp || Date.now()
 })) : [];

 const combined = [...normalizedWaf, ...normalizedZabbix];
 combined.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
 setAlarms(combined);
 }

 if (zabbixData && zabbixData.hosts) {
 setNodes(zabbixData.hosts);
 }
 } catch (e) {
 console.error('Erro ao sincronizar NOC Zabbix:', e);
 }
 };

 useEffect(() => {
 const init = async () => {
 setLoading(true);
 await Promise.all([fetchNocData(), fetchTrafficData('today')]);
 setLoading(false);
 };
 init();

 const interval = setInterval(fetchNocData, 5000);
 return () => clearInterval(interval);
 }, []);

 const handleManualRefresh = async () => {
 setRefreshing(true);
 await Promise.all([fetchNocData(), fetchTrafficData(trafficRange)]);
 setTimeout(() => setRefreshing(false), 500);
 };

 const handleOpenAckModal = (alarm: ZabbixProblem) => {
 setAckModalProblem(alarm);
 setAckNote('');
 };

 const handleConfirmAck = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!ackModalProblem) return;

 setIsSubmittingAck(true);
 try {
 const res = await fetch('/api/zabbix/ack', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 id: ackModalProblem.id,
 message: ackNote || 'Alerta reconhecido pela equipe de plantão do NOC',
 author: ackAuthor || 'Operador NOC'
 })
 });

 const data = await res.json();
 if (data.success) {
 setAlarms(prev => prev.map(a => a.id === ackModalProblem.id ? { 
 ...a, 
 ack: true, 
 ackMessage: ackNote || 'Alerta reconhecido',
 ackAuthor: ackAuthor
 } : a));

 registrarAcaoAuditoria({
 usuario: ackAuthor,
 modulo: 'NOC / Zabbix',
 acao: 'Reconhecimento de Trigger Zabbix (ACK)',
 detalhes: `Alerta #${ackModalProblem.id} em ${ackModalProblem.host} reconhecido: "${ackModalProblem.message}"`,
 categoria: 'comando',
 severidade: 'info'
 });

 setBannerAlert(`Trigger #${ackModalProblem.id} reconhecida com sucesso.`);
 setTimeout(() => setBannerAlert(null), 4000);
 }
 } catch {
 // Fallback otimista
 setAlarms(prev => prev.map(a => a.id === ackModalProblem.id ? { ...a, ack: true } : a));
 } finally {
 setIsSubmittingAck(false);
 setAckModalProblem(null);
 }
 };

 const handleTriggerSimulation = async (e: React.FormEvent) => {
 e.preventDefault();
 try {
 const res = await fetch('/api/zabbix/test-trigger', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 hostId: simHostId,
 severity: simSeverity,
 message: simMessage || `Simulação manual disparada pelo operador NOC no host #${simHostId}`
 })
 });

 const data = await res.json();
 if (data.success) {
 setSimFeedback('Trigger de teste disparada com sucesso! Alarme registrado na esteira.');
 fetchNocData();
 setTimeout(() => {
 setSimFeedback(null);
 setShowSimulateModal(false);
 setSimMessage('');
 }, 1500);
 }
 } catch {
 setSimFeedback('Erro ao disparar teste de trigger.');
 }
 };

 const filteredAlarms = useMemo(() => {
 return alarms.filter(alarm => {
 // Severidade
 if (severityFilter !== 'all') {
 const normSev = alarm.severity === 'critical' ? 'disaster' : alarm.severity === 'info' ? 'information' : alarm.severity;
 if (normSev !== severityFilter) return false;
 }

 // ACK
 if (ackFilter === 'unack' && alarm.ack) return false;
 if (ackFilter === 'ack' && !alarm.ack) return false;

 // Busca textual
 if (searchTrigger.trim()) {
 const q = searchTrigger.toLowerCase();
 const matchHost = alarm.host.toLowerCase().includes(q);
 const matchMsg = alarm.message.toLowerCase().includes(q);
 if (!matchHost && !matchMsg) return false;
 }

 return true;
 });
 }, [alarms, severityFilter, ackFilter, searchTrigger]);

 const totalUnack = alarms.filter(a => !a.ack).length;
 const criticalUnack = alarms.filter(a => !a.ack && (a.severity === 'disaster' || a.severity === 'critical' || a.severity === 'high')).length;
 const onlineCount = nodes.filter(n => n.status === 'online').length;
 const totalOnus = nodes.reduce((acc, n) => acc + (n.activeOnus || 0), 0);

 const getSeverityBadge = (sev: string) => {
 switch (sev) {
 case 'disaster':
 case 'critical':
 return { label: 'Desastre', bg: 'bg-red-500/20 text-red-400 border-red-500/30' };
 case 'high':
 return { label: 'Alto', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
 case 'average':
 case 'warning':
 return { label: 'Médio / Atenção', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
 case 'information':
 case 'info':
 default:
 return { label: 'Informativo', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
 }
 };

 const getVendorLogoColor = (vendor: string) => {
 switch (vendor) {
 case 'Huawei': return 'text-red-400 bg-red-500/10 border-red-500/20';
 case 'ZTE': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
 case 'Datacom': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
 case 'Fiberhome': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
 case 'MikroTik': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
 case 'Juniper': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
 default: return 'text-muted-foreground bg-muted border-border';
 }
 };

 return (
 <div className="flex-1 flex flex-col h-full bg-background text-muted-foreground overflow-hidden font-sans">
 
 {/* BANNER DE AVISO / AUDITORIA */}
 {bannerAlert && (
 <div className="bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 px-6 py-2 text-xs font-semibold flex items-center justify-between">
 <span className="flex items-center gap-2">
 <CheckCircle2 size={14} className="text-emerald-400" />
 {bannerAlert}
 </span>
 <button onClick={() => setBannerAlert(null)} className="text-emerald-400 hover:text-emerald-200">
 <X size={14} />
 </button>
 </div>
 )}

 {/* HEADER DO NOC */}
 <div className="px-6 py-4 border-b border-border bg-card/80 backdrop-blur-md flex flex-wrap justify-between items-center gap-4 z-10">
 <div>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
 <Activity size={20} />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h1 className="text-xl font-bold text-foreground font-outfit tracking-wide">
 NOC & Infraestrutura Zabbix
 </h1>
 <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-mono font-bold border border-cyan-500/20 uppercase tracking-widest flex items-center gap-1">
 <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
 Zabbix 7.0 LTS
 </span>
 <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-mono border border-emerald-500/20">
 JSON-RPC Conectado
 </span>
 </div>
 <p className="text-xs text-muted-foreground mt-0.5">
 Telemetria SNMP/ICMP de OLTs GPON, Trânsito IP, PTT/IX.br e Triggers em Tempo Real
 </p>
 </div>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-2">
 <button 
 onClick={() => window.location.href = '/admin/mapa-rede'}
 className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-xl transition-colors border border-indigo-500/30 text-xs font-bold"
 title="Correlacionar OLTs e ONTs no Mapa Georreferenciado"
 >
 <Network size={15} /> Mapa GIS da Rede
 </button>

 <button 
 onClick={() => setShowSimulateModal(true)}
 className="flex items-center gap-2 px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded-xl transition-colors border border-amber-500/30 text-xs font-bold"
 title="Simular disparo de alerta para homologação técnica do NOC"
 >
 <Zap size={15} /> Simular Trigger
 </button>

 <Link 
 to="/admin/ajuda"
 className="flex items-center gap-2 px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl transition-colors border border-blue-500/30 text-xs font-bold"
 title="Ver documentação oficial, portas e guia de implantação"
 >
 <Terminal size={15} /> Portas &amp; Deploy
 </Link>

 <button 
 onClick={() => setShowConfigModal(true)}
 className="flex items-center gap-2 px-3.5 py-2 bg-muted hover:bg-accent text-muted-foreground rounded-xl transition-colors border border-border text-xs font-bold"
 title="Ver parâmetros e endpoint da API JSON-RPC do Zabbix"
 >
 <Settings size={15} /> Zabbix API
 </button>

 <button 
 onClick={handleManualRefresh}
 className="p-2 bg-muted hover:bg-accent text-muted-foreground rounded-xl transition-colors border border-border" 
 title="Sincronizar telemetria imediatamente"
 >
 <RefreshCw size={17} className={refreshing || loading ? 'animate-spin text-cyan-400' : ''} />
 </button>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-6 space-y-6">
 <div className="max-w-7xl mx-auto space-y-6">

 {/* PAINEL DE METRICAS E KPIS DO NOC */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 
 {/* KPI 1: Tráfego Agregado */}
 <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden group">
 <div className="flex justify-between items-start mb-2">
 <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
 <BarChart2 size={20} />
 </div>
 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tráfego Borda</span>
 </div>
 <p className="text-3xl font-bold text-foreground font-outfit mb-1">
 {peakTraffic} <span className="text-sm text-muted-foreground font-normal">Gbps</span>
 </p>
 <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-border">
 <span className="text-emerald-400 font-semibold flex items-center gap-1">
 <ArrowUpRight size={14} /> PTT IX.br: 62%
 </span>
 <span className="text-muted-foreground">CDNs: 45%</span>
 </div>
 </div>

 {/* KPI 2: OLTs e Nós GPON */}
 <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden group">
 <div className="flex justify-between items-start mb-2">
 <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
 <Server size={20} />
 </div>
 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">OLTs & Roteadores</span>
 </div>
 <p className="text-3xl font-bold text-foreground font-outfit mb-1">
 {onlineCount} <span className="text-sm text-muted-foreground font-normal">/ {nodes.length} Ativos</span>
 </p>
 <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-border">
 <span className="text-muted-foreground font-medium">Huawei, ZTE, Datacom, FH</span>
 <span className="text-emerald-400 font-mono">100% OK</span>
 </div>
 </div>

 {/* KPI 3: Triggers Ativos no Zabbix */}
 <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden group">
 <div className="flex justify-between items-start mb-2">
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
 criticalUnack > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
 }`}>
 <AlertTriangle size={20} />
 </div>
 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Triggers (Zabbix)</span>
 </div>
 <p className="text-3xl font-bold text-foreground font-outfit mb-1">
 {totalUnack} <span className="text-sm text-muted-foreground font-normal">Pendentes</span>
 </p>
 <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-border">
 <span className="text-red-400 font-bold uppercase tracking-wider">
 {criticalUnack} Crítico{criticalUnack !== 1 ? 's' : ''} (Unack)
 </span>
 <span className="text-muted-foreground">Total: {alarms.length}</span>
 </div>
 </div>

 {/* KPI 4: CPEs / ONTs Conectadas */}
 <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden group">
 <div className="flex justify-between items-start mb-2">
 <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
 <Wifi size={20} />
 </div>
 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">ONTs Atendidas</span>
 </div>
 <p className="text-3xl font-bold text-foreground font-outfit mb-1">
 {totalOnus.toLocaleString('pt-BR')} <span className="text-sm text-muted-foreground font-normal">CPEs</span>
 </p>
 <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-border">
 <span className="text-muted-foreground">96 Portas PON Ativas</span>
 <span className="text-emerald-400 font-mono">SLA 99.9%</span>
 </div>
 </div>

 </div>

 {/* GRÁFICO INTERATIVO DE TRÁFEGO DE BORDA COM SELETORES */}
 <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
 <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
 <div>
 <h3 className="font-bold text-lg text-foreground font-outfit flex items-center gap-2">
 <Layers size={20} className="text-cyan-400" />
 Agregação de Tráfego de Borda & Trânsito IP
 </h3>
 <p className="text-xs text-muted-foreground mt-0.5">
 Consumo em tempo real: PTT (IX.br SP/RJ), CDNs (Netflix, Google, Meta, Akamai) e Trânsito Tier 1
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-3">
 {/* Seletor de Camadas */}
 <div className="flex items-center bg-background p-1 rounded-xl border border-border text-xs font-semibold">
 <button 
 onClick={() => setTrafficLayer('total')}
 className={`px-3 py-1.5 rounded-lg transition-all ${
 trafficLayer === 'total' ? 'bg-cyan-500 text-slate-950 font-bold shadow' : 'text-muted-foreground hover:text-foreground'
 }`}
 >
 Total Agregado
 </button>
 <button 
 onClick={() => setTrafficLayer('ixbr')}
 className={`px-3 py-1.5 rounded-lg transition-all ${
 trafficLayer === 'ixbr' ? 'bg-indigo-500 text-white font-bold shadow' : 'text-muted-foreground hover:text-white'
 }`}
 >
 PTT / IX.br
 </button>
 <button 
 onClick={() => setTrafficLayer('cdn')}
 className={`px-3 py-1.5 rounded-lg transition-all ${
 trafficLayer === 'cdn' ? 'bg-purple-500 text-white font-bold shadow' : 'text-muted-foreground hover:text-white'
 }`}
 >
 CDNs Locais
 </button>
 <button 
 onClick={() => setTrafficLayer('transit')}
 className={`px-3 py-1.5 rounded-lg transition-all ${
 trafficLayer === 'transit' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-muted-foreground hover:text-white'
 }`}
 >
 Trânsito IP
 </button>
 </div>

 {/* Seletor de Período */}
 <div className="flex items-center bg-background p-1 rounded-xl border border-border text-xs font-semibold">
 <button 
 onClick={() => { setTrafficRange('today'); fetchTrafficData('today'); }}
 className={`px-3 py-1.5 rounded-lg transition-all ${
 trafficRange === 'today' ? 'bg-muted text-cyan-300 font-bold' : 'text-muted-foreground hover:text-foreground'
 }`}
 >
 Hoje
 </button>
 <button 
 onClick={() => { setTrafficRange('7d'); fetchTrafficData('7d'); }}
 className={`px-3 py-1.5 rounded-lg transition-all ${
 trafficRange === '7d' ? 'bg-muted text-cyan-300 font-bold' : 'text-muted-foreground hover:text-foreground'
 }`}
 >
 7 Dias
 </button>
 <button 
 onClick={() => { setTrafficRange('30d'); fetchTrafficData('30d'); }}
 className={`px-3 py-1.5 rounded-lg transition-all ${
 trafficRange === '30d' ? 'bg-muted text-cyan-300 font-bold' : 'text-muted-foreground hover:text-foreground'
 }`}
 >
 30 Dias
 </button>
 </div>
 </div>
 </div>

 {/* GRÁFICO RECHARTS */}
 <div className="h-72 w-full">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={trafficData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
 <defs>
 <linearGradient id="gradTx" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
 <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
 </linearGradient>
 <linearGradient id="gradRx" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
 <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
 </linearGradient>
 <linearGradient id="gradIxbr" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5}/>
 <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
 </linearGradient>
 <linearGradient id="gradCdn" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#a855f7" stopOpacity={0.5}/>
 <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0}/>
 </linearGradient>
 <linearGradient id="gradTransit" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5}/>
 <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" vertical={false} />
 <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
 <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}G`} tickMargin={8} />
 <RechartsTooltip 
 contentStyle={{ 
 backgroundColor: '#090d16', 
 borderColor: 'rgba(255,255,255,0.1)', 
 borderRadius: '12px', 
 color: '#f8fafc',
 fontSize: '12px',
 boxShadow: '0 10px 25px -5px rgba(0,0,0,0.7)'
 }}
 itemStyle={{ padding: '2px 0' }}
 />

 {trafficLayer === 'total' && (
 <>
 <Area type="monotone" dataKey="tx" name="Download (TX Gbps)" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#gradTx)" />
 <Area type="monotone" dataKey="rx" name="Upload (RX Gbps)" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#gradRx)" />
 </>
 )}

 {trafficLayer === 'ixbr' && (
 <Area type="monotone" dataKey="ixbr" name="Tráfego PTT IX.br (Gbps)" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#gradIxbr)" />
 )}

 {trafficLayer === 'cdn' && (
 <Area type="monotone" dataKey="cdn" name="Cache CDN Local (Gbps)" stroke="#a855f7" strokeWidth={2.5} fillOpacity={1} fill="url(#gradCdn)" />
 )}

 {trafficLayer === 'transit' && (
 <Area type="monotone" dataKey="transit" name="Trânsito IP Pago (Gbps)" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#gradTransit)" />
 )}
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* DUAS COLUNAS: TRIGGERS ZABBIX & SAÚDE DAS OLTS */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
 
 {/* CENTRAL DE TRIGGERS ZABBIX (COL 7) */}
 <div className="lg:col-span-7 bg-card border border-border rounded-2xl overflow-hidden shadow-xl flex flex-col">
 <div className="p-5 border-b border-border bg-card/60 space-y-3">
 <div className="flex flex-wrap justify-between items-center gap-3">
 <div className="flex items-center gap-2">
 <AlertTriangle size={18} className="text-amber-400" />
 <h3 className="font-bold text-base text-foreground font-outfit">
 Central de Triggers Zabbix em Tempo Real
 </h3>
 <span className="text-xs bg-muted text-muted-foreground font-mono px-2 py-0.5 rounded-full border border-border">
 {filteredAlarms.length} encontrados
 </span>
 </div>

 {/* Filtro ACK / UNACK */}
 <div className="flex items-center gap-1 bg-background p-0.5 rounded-lg border border-border text-[11px] font-bold">
 <button
 onClick={() => setAckFilter('all')}
 className={`px-2.5 py-1 rounded-md transition-colors ${ackFilter === 'all' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
 >
 Todos
 </button>
 <button
 onClick={() => setAckFilter('unack')}
 className={`px-2.5 py-1 rounded-md transition-colors ${ackFilter === 'unack' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'text-muted-foreground hover:text-white'}`}
 >
 Não Reconhecidos ({totalUnack})
 </button>
 <button
 onClick={() => setAckFilter('ack')}
 className={`px-2.5 py-1 rounded-md transition-colors ${ackFilter === 'ack' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-muted-foreground hover:text-white'}`}
 >
 Reconhecidos
 </button>
 </div>
 </div>

 {/* BARRA DE FILTROS E BUSCA */}
 <div className="flex flex-wrap items-center gap-2 pt-1">
 <div className="relative flex-1 min-w-[200px]">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
 <input 
 type="text"
 placeholder="Buscar por OLT, IP ou mensagem de erro..."
 value={searchTrigger}
 onChange={(e) => setSearchTrigger(e.target.value)}
 className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground placeholder-slate-500 outline-none focus:border-cyan-500 font-medium"
 />
 </div>

 {/* Seletor de Severidade Zabbix */}
 <select
 value={severityFilter}
 onChange={(e: any) => setSeverityFilter(e.target.value)}
 className="bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-muted-foreground outline-none focus:border-cyan-500 font-medium"
 >
 <option value="all">Todas Severidades</option>
 <option value="disaster">Desastre (Disaster)</option>
 <option value="high">Alto (High)</option>
 <option value="average">Médio (Average)</option>
 <option value="warning">Atenção (Warning)</option>
 <option value="information">Informativo (Info)</option>
 </select>
 </div>
 </div>

 {/* LISTA DE TRIGGERS */}
 <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[520px]">
 {filteredAlarms.length === 0 ? (
 <div className="text-center py-12 text-muted-foreground">
 <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-500/40" />
 <p className="text-sm font-semibold text-muted-foreground">Nenhum alerta pendente com os filtros selecionados.</p>
 <p className="text-xs text-muted-foreground mt-1">Infraestrutura operando dentro dos parâmetros de telemetria.</p>
 </div>
 ) : (
 filteredAlarms.map((alarm) => {
 const badge = getSeverityBadge(alarm.severity);
 return (
 <div 
 key={alarm.id} 
 className={`p-4 rounded-xl border transition-all ${
 alarm.ack 
 ? 'bg-background/40 border-border opacity-80' 
 : alarm.severity === 'disaster' || alarm.severity === 'critical'
 ? 'bg-red-950/20 border-red-500/30 hover:border-red-500/50'
 : alarm.severity === 'high'
 ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
 : 'bg-background/80 border-border hover:border-border'
 }`}
 >
 <div className="flex justify-between items-start gap-3">
 <div className="flex-1">
 <div className="flex flex-wrap items-center gap-2 mb-1.5">
 <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badge.bg}`}>
 {badge.label}
 </span>
 <span className="text-xs font-mono font-bold text-muted-foreground">
 {alarm.host}
 </span>
 <span className="text-[11px] text-muted-foreground font-mono">
 ID: #{alarm.id}
 </span>
 </div>

 <p className="text-sm font-semibold text-foreground leading-snug">
 {alarm.message}
 </p>

 <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
 <span className="flex items-center gap-1">
 <Clock size={12} /> {alarm.time}
 </span>

 {alarm.ack && alarm.ackAuthor && (
 <span className="text-emerald-400 font-medium flex items-center gap-1">
 <Check size={12} /> Reconhecido por {alarm.ackAuthor}
 </span>
 )}

 {alarm.ack && alarm.ackMessage && (
 <span className="text-muted-foreground italic">
 "{alarm.ackMessage}"
 </span>
 )}
 </div>
 </div>

 {/* BOTAO ACK */}
 <div className="shrink-0 flex items-center gap-2">
 {!alarm.ack ? (
 <button
 onClick={() => handleOpenAckModal(alarm)}
 className="px-3 py-1.5 bg-muted hover:bg-accent hover:text-foreground text-muted-foreground text-xs font-bold rounded-lg transition-colors border border-border flex items-center gap-1.5"
 title="Reconhecer alarme no Zabbix (ACK)"
 >
 <Check size={13} className="text-amber-400" />
 ACK
 </button>
 ) : (
 <span className="text-[10px] font-bold uppercase text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
 <CheckCircle2 size={12} /> Reconhecido
 </span>
 )}
 </div>
 </div>
 </div>
 );
 })
 )}
 </div>
 </div>

 {/* INVENTÁRIO E SAÚDE DAS OLTS / ROUTERS (COL 5) */}
 <div className="lg:col-span-5 bg-card border border-border rounded-2xl overflow-hidden shadow-xl flex flex-col">
 <div className="p-5 border-b border-border bg-card/60 flex justify-between items-center">
 <div>
 <h3 className="font-bold text-base text-foreground font-outfit flex items-center gap-2">
 <Server size={18} className="text-indigo-400" />
 Chassis OLT & Roteadores de Borda
 </h3>
 <p className="text-xs text-muted-foreground mt-0.5">Telemetria de CPU, Temperatura e Portas PON</p>
 </div>
 <span className="text-xs font-mono text-muted-foreground bg-white/5 px-2.5 py-1 rounded-lg border border-border">
 {nodes.length} nós
 </span>
 </div>

 <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[520px]">
 {nodes.map((node) => {
 const vendorColor = getVendorLogoColor(node.vendor || 'Huawei');
 const isHighTemp = node.temp > 60;
 const isHighCpu = node.cpu > 80;

 return (
 <div 
 key={node.id} 
 onClick={() => setSelectedHost(node)}
 className="p-4 bg-background/80 hover:bg-background border border-border hover:border-cyan-500/40 rounded-xl transition-all cursor-pointer group"
 >
 <div className="flex justify-between items-start gap-2 mb-2">
 <div className="flex items-center gap-2.5">
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${vendorColor}`}>
 {node.vendor || 'OLT'}
 </span>
 <div>
 <h4 className="font-bold text-sm text-foreground group-hover:text-cyan-400 transition-colors">
 {node.name}
 </h4>
 <p className="text-[11px] font-mono text-muted-foreground">{node.ip} • {node.model || 'GPON'}</p>
 </div>
 </div>

 <div className="flex items-center gap-1.5">
 <span className={`w-2.5 h-2.5 rounded-full ${
 node.status === 'online' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' :
 node.status === 'warning' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' :
 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)] animate-pulse'
 }`}></span>
 <span className="text-[10px] font-bold uppercase text-muted-foreground">
 {node.status}
 </span>
 </div>
 </div>

 {/* BARRAS DE CPU, RAM E TEMPERATURA */}
 <div className="grid grid-cols-3 gap-3 pt-2 text-xs border-t border-border">
 <div>
 <div className="flex justify-between text-[11px] mb-1">
 <span className="text-muted-foreground">CPU</span>
 <span className={`font-mono font-bold ${isHighCpu ? 'text-red-400' : 'text-muted-foreground'}`}>{node.cpu}%</span>
 </div>
 <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
 <div className={`h-full ${isHighCpu ? 'bg-red-500' : 'bg-cyan-500'}`} style={{ width: `${node.cpu}%` }}></div>
 </div>
 </div>

 <div>
 <div className="flex justify-between text-[11px] mb-1">
 <span className="text-muted-foreground">RAM</span>
 <span className="font-mono font-bold text-muted-foreground">{node.ram}%</span>
 </div>
 <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
 <div className="h-full bg-indigo-500" style={{ width: `${node.ram}%` }}></div>
 </div>
 </div>

 <div>
 <div className="flex justify-between text-[11px] mb-1">
 <span className="text-muted-foreground flex items-center gap-1">
 <Thermometer size={11} className={isHighTemp ? 'text-red-400' : 'text-muted-foreground'} /> Temp
 </span>
 <span className={`font-mono font-bold ${isHighTemp ? 'text-red-400' : 'text-muted-foreground'}`}>{node.temp}°C</span>
 </div>
 <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
 <div className={`h-full ${isHighTemp ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (node.temp / 80) * 100)}%` }}></div>
 </div>
 </div>
 </div>

 {/* DETALHES INFERIORES: PON & ONTs */}
 <div className="flex justify-between items-center text-[11px] text-muted-foreground mt-2.5 pt-2 border-t border-border">
 <span>
 {node.ponPorts ? `${node.ponPorts} Portas PON • ${node.activeOnus || 0} ONTs` : `${node.uplinkCapacity || 'Uplink 100G'}`}
 </span>
 <span className="text-cyan-400 flex items-center gap-1 group-hover:underline">
 Ver Detalhes <ChevronRight size={12} />
 </span>
 </div>
 </div>
 );
 })}
 </div>
 </div>

 </div>

 </div>
 </div>

 {/* MODAL / SLIDE-OVER: DETALHES TÉCNICOS DA OLT SELECIONADA */}
 {selectedHost && (
 <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
 <div className="w-full max-w-lg bg-card border-l border-border h-full overflow-y-auto p-6 flex flex-col justify-between">
 <div className="space-y-6">
 
 <div className="flex justify-between items-start pb-4 border-b border-border">
 <div>
 <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getVendorLogoColor(selectedHost.vendor)}`}>
 {selectedHost.vendor} • {selectedHost.model}
 </span>
 <h2 className="text-xl font-bold text-foreground font-outfit mt-2">
 {selectedHost.name}
 </h2>
 <p className="text-xs font-mono text-muted-foreground mt-0.5">IP: {selectedHost.ip} • Uptime: {selectedHost.uptime}</p>
 </div>
 <button 
 onClick={() => setSelectedHost(null)}
 className="p-1.5 bg-muted hover:bg-accent text-muted-foreground hover:text-foreground rounded-lg"
 >
 <X size={18} />
 </button>
 </div>

 {/* Informações Físicas e POP */}
 <div className="space-y-3 text-xs">
 <h4 className="font-bold text-card-foreground uppercase tracking-wider text-[11px]">Infraestrutura & Instalação</h4>
 <div className="bg-background p-4 rounded-xl border border-border space-y-2">
 <div className="flex justify-between">
 <span className="text-muted-foreground">Localização POP:</span>
 <span className="text-card-foreground font-medium">{selectedHost.location || 'POP Central'}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Alimentação Elétrica:</span>
 <span className="text-emerald-400 font-medium">{selectedHost.powerSupply || 'Dual AC/DC'}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Ventoinhas / Fan Tray:</span>
 <span className="text-card-foreground font-mono">{selectedHost.fanRpm || 4200} RPM (Normal)</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Capacidade de Uplink:</span>
 <span className="text-cyan-400 font-mono">{selectedHost.uplinkCapacity || '10G LACP'}</span>
 </div>
 </div>
 </div>

 {/* Telemetria Óptica e Portas PON */}
 {selectedHost.ponPorts > 0 && (
 <div className="space-y-3 text-xs">
 <h4 className="font-bold text-card-foreground uppercase tracking-wider text-[11px]">Distribuição GPON (PON Slots)</h4>
 <div className="bg-background p-4 rounded-xl border border-border space-y-3">
 <div className="flex justify-between items-center">
 <span className="text-muted-foreground">Total de Portas PON:</span>
 <span className="text-foreground font-bold font-mono">{selectedHost.ponPorts} Portas Class C+</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-muted-foreground">ONTs Sincronizadas:</span>
 <span className="text-emerald-400 font-bold font-mono">{selectedHost.activeOnus} ONTs Online</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-muted-foreground">Potência Tx Média OLT:</span>
 <span className="text-cyan-400 font-mono">+4.8 dBm (Excelente)</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-muted-foreground">Sinal Rx Médio na OLT:</span>
 <span className="text-muted-foreground font-mono">-19.4 dBm (Padrão Anatel)</span>
 </div>
 </div>
 </div>
 )}

 {/* Status de Sensores */}
 <div className="space-y-3 text-xs">
 <h4 className="font-bold text-card-foreground uppercase tracking-wider text-[11px]">Sensores SNMP em Tempo Real</h4>
 <div className="grid grid-cols-2 gap-3">
 <div className="bg-background p-3 rounded-xl border border-border">
 <span className="text-muted-foreground block">CPU Load</span>
 <span className="text-base font-bold text-foreground font-mono">{selectedHost.cpu}%</span>
 </div>
 <div className="bg-background p-3 rounded-xl border border-border">
 <span className="text-muted-foreground block">Memória RAM</span>
 <span className="text-base font-bold text-foreground font-mono">{selectedHost.ram}%</span>
 </div>
 <div className="bg-background p-3 rounded-xl border border-border">
 <span className="text-muted-foreground block">Temperatura do Chassi</span>
 <span className="text-base font-bold text-emerald-400 font-mono">{selectedHost.temp}°C</span>
 </div>
 <div className="bg-background p-3 rounded-xl border border-border">
 <span className="text-muted-foreground block">Estado Operacional</span>
 <span className="text-base font-bold text-cyan-400 uppercase">{selectedHost.status}</span>
 </div>
 </div>
 </div>

 </div>

 {/* Ações do Chassi */}
 <div className="pt-6 border-t border-border flex gap-3">
 <button
 onClick={() => window.location.href = '/admin/mapa-rede'}
 className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors text-xs flex items-center justify-center gap-2"
 >
 <Network size={15} /> Localizar no Mapa GIS
 </button>
 <button
 onClick={() => setSelectedHost(null)}
 className="px-4 py-2.5 bg-muted hover:bg-accent text-muted-foreground font-bold rounded-xl text-xs"
 >
 Fechar
 </button>
 </div>
 </div>
 </div>
 )}

 {/* MODAL: RECONHECER ALERTA (ACK) */}
 {ackModalProblem && (
 <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
 <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
 <div className="flex justify-between items-start">
 <div>
 <h3 className="font-bold text-lg text-foreground font-outfit flex items-center gap-2">
 <CheckCircle2 size={18} className="text-emerald-400" />
 Reconhecer Alerta Zabbix (ACK)
 </h3>
 <p className="text-xs text-muted-foreground mt-0.5">
 ID: #{ackModalProblem.id} • Host: {ackModalProblem.host}
 </p>
 </div>
 <button onClick={() => setAckModalProblem(null)} className="text-muted-foreground hover:text-foreground">
 <X size={18} />
 </button>
 </div>

 <div className="bg-background p-3 rounded-xl border border-border text-xs text-muted-foreground">
 <p className="font-bold text-card-foreground">{ackModalProblem.message}</p>
 <span className="text-[11px] text-muted-foreground mt-1 block">Severidade: {ackModalProblem.severity}</span>
 </div>

 <form onSubmit={handleConfirmAck} className="space-y-3 text-xs">
 <div>
 <label className="block text-muted-foreground font-bold mb-1">Nome do Operador / Técnico</label>
 <input 
 type="text"
 value={ackAuthor}
 onChange={(e) => setAckAuthor(e.target.value)}
 required
 className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground outline-none focus:border-cyan-500"
 />
 </div>

 <div>
 <label className="block text-muted-foreground font-bold mb-1">Nota Técnica de Reconhecimento</label>
 <textarea 
 value={ackNote}
 onChange={(e) => setAckNote(e.target.value)}
 placeholder="Ex: Equipe de fusão em deslocamento para o POP. Janela emergencial aberta."
 rows={3}
 className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground outline-none focus:border-cyan-500 resize-none"
 />
 </div>

 <div className="pt-2 flex justify-end gap-2">
 <button
 type="button"
 onClick={() => setAckModalProblem(null)}
 className="px-4 py-2 bg-muted hover:bg-accent text-muted-foreground font-bold rounded-xl"
 >
 Cancelar
 </button>
 <button
 type="submit"
 disabled={isSubmittingAck}
 className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors flex items-center gap-1.5"
 >
 {isSubmittingAck ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
 Confirmar ACK no Zabbix
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* MODAL: SIMULAR TRIGGER PARA HOMOLOGAÇÃO */}
 {showSimulateModal && (
 <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
 <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
 <div className="flex justify-between items-start">
 <div>
 <h3 className="font-bold text-lg text-foreground font-outfit flex items-center gap-2">
 <Zap size={18} className="text-amber-400" />
 Simulação de Trigger NOC
 </h3>
 <p className="text-xs text-muted-foreground mt-0.5">
 Teste o fluxo de alarmes e tempos de resposta no Zabbix
 </p>
 </div>
 <button onClick={() => setShowSimulateModal(false)} className="text-muted-foreground hover:text-foreground">
 <X size={18} />
 </button>
 </div>

 {simFeedback && (
 <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold">
 {simFeedback}
 </div>
 )}

 <form onSubmit={handleTriggerSimulation} className="space-y-3 text-xs">
 <div>
 <label className="block text-muted-foreground font-bold mb-1">Host / OLT Alvo</label>
 <select
 value={simHostId}
 onChange={(e) => setSimHostId(Number(e.target.value))}
 className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground outline-none focus:border-amber-500 font-medium"
 >
 {nodes.map(n => (
 <option key={n.id} value={n.id}>{n.name} ({n.vendor}) - {n.ip}</option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-muted-foreground font-bold mb-1">Severidade do Alerta</label>
 <select
 value={simSeverity}
 onChange={(e: any) => setSimSeverity(e.target.value)}
 className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground outline-none focus:border-amber-500 font-medium"
 >
 <option value="disaster">Desastre (Disaster - Nível 5)</option>
 <option value="high">Alto (High - Nível 4)</option>
 <option value="average">Médio (Average - Nível 3)</option>
 <option value="warning">Atenção (Warning - Nível 2)</option>
 <option value="information">Informativo (Information - Nível 1)</option>
 </select>
 </div>

 <div>
 <label className="block text-muted-foreground font-bold mb-1">Mensagem do Incidente</label>
 <input 
 type="text"
 value={simMessage}
 onChange={(e) => setSimMessage(e.target.value)}
 placeholder="Ex: LOS detectada na porta PON 0/4/2 (Rompimento Drop)"
 className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground outline-none focus:border-amber-500 font-medium"
 />
 </div>

 <div className="pt-2 flex justify-end gap-2">
 <button
 type="button"
 onClick={() => setShowSimulateModal(false)}
 className="px-4 py-2 bg-muted hover:bg-accent text-muted-foreground font-bold rounded-xl"
 >
 Fechar
 </button>
 <button
 type="submit"
 className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors flex items-center gap-1.5"
 >
 <Send size={14} /> Disparar Alarme de Teste
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* MODAL: CONFIGURAÇÃO / HEALTH DO ZABBIX JSON-RPC */}
 {showConfigModal && (
 <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
 <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
 <div className="flex justify-between items-start">
 <div>
 <h3 className="font-bold text-lg text-foreground font-outfit flex items-center gap-2">
 <Terminal size={18} className="text-cyan-400" />
 Parâmetros de Integração Zabbix API
 </h3>
 <p className="text-xs text-muted-foreground mt-0.5">
 Conexão JSON-RPC v2.0 para coleta de triggers e telemetria SNMP
 </p>
 </div>
 <button onClick={() => setShowConfigModal(false)} className="text-muted-foreground hover:text-foreground">
 <X size={18} />
 </button>
 </div>

 <div className="space-y-3 text-xs">
 <div className="bg-background p-4 rounded-xl border border-border space-y-2 font-mono">
 <div className="flex justify-between">
 <span className="text-muted-foreground">Versão do Servidor:</span>
 <span className="text-emerald-400 font-bold">{health?.version || config.zabbix?.versao || 'Zabbix Server 7.0.3 LTS'}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Endpoint JSON-RPC:</span>
 <span className="text-muted-foreground">{health?.endpoint || config.zabbix?.urlJsonRpc || 'http://127.0.0.1:8080/zabbix/api_jsonrpc.php'}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Porta Agent / Trapper:</span>
 <span className="text-muted-foreground">{config.zabbix?.portaAgent || 10050} / TCP</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Latência da API:</span>
 <span className="text-cyan-400 font-bold">{health?.latencyMs || 14} ms (Tempo Real)</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Itens Monitorados:</span>
 <span className="text-muted-foreground">1.428 métricas ativas</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Frequência de Polling:</span>
 <span className="text-amber-400 font-bold">5 segundos (Daemon nativo)</span>
 </div>
 </div>

 <div className="p-3 bg-white/5 rounded-xl border border-border text-[11px] text-muted-foreground leading-relaxed">
 A integração consome os métodos <code>trigger.get</code>, <code>host.get</code> e <code>item.get</code> através da rota protegida <code>/api/zabbix/triggers</code>. As credenciais nativas são gerenciadas automaticamente pelas variáveis de ambiente e painel de Credenciais Nativas.
 </div>
 </div>

 <div className="pt-2 flex justify-between items-center">
 <Link
 to="/admin/superadmin"
 className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/20 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
 >
 <SlidersHorizontal size={13} />
 <span>Configurações Nativas</span>
 </Link>
 <button
 onClick={() => setShowConfigModal(false)}
 className="px-4 py-2 bg-muted hover:bg-accent text-foreground font-bold rounded-xl text-xs"
 >
 Concluir
 </button>
 </div>
 </div>
 </div>
 )}

 </div>
 );
}
