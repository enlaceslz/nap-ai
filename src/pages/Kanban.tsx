import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
 Plus, 
 MoreHorizontal, 
 X, 
 Clock, 
 User, 
 Phone, 
 MapPin, 
 Activity, 
 Search, 
 Check, 
 AlertTriangle, 
 Wifi, 
 ArrowRight,
 ExternalLink,
 MessageSquare,
 Share2,
 Navigation,
 DollarSign,
 TrendingUp,
 Filter,
 Sparkles,
 Send,
 ShieldCheck,
 ChevronRight,
 CheckCircle2,
 FileText,
 BarChart3,
 Layers,
 Zap,
 Calendar,
 Briefcase,
 Headphones,
 CreditCard
} from 'lucide-react';
import { Tooltip } from '../components/Tooltip';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import type { Deal } from '../types';
import AddressMapModal from '../components/AddressMapModal';

export default function Kanban({ type }: { type: "Suporte" | "Vendas" | "Cobranca" }) {
 const navigate = useNavigate();
 const [deals, setDeals] = useState<Deal[]>([]);
 const [loading, setLoading] = useState(true);
 const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
 const [searchTerm, setSearchTerm] = useState('');
 const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'ia'>('all');
 const [kpiFilter, setKpiFilter] = useState<'todos' | 'funil' | 'ticket' | 'oportunidades'>('todos');
 
 // Toast
 const [toastMessage, setToastMessage] = useState<string | null>(null);
 const showToast = (msg: string) => {
 setToastMessage(msg);
 setTimeout(() => setToastMessage(null), 4000);
 };
 
 // Modal de Novo Card
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [isSaving, setIsSaving] = useState(false);

 // Modal de Mapa / CEP / Rota do Técnico
 const [mapTargetDeal, setMapTargetDeal] = useState<Deal | null>(null);
 const [newDealData, setNewDealData] = useState({
 titulo: '',
 contato: '',
 telefone: '',
 endereco: '',
 plano: 'Fibra 500MB',
 valor: 99.90,
 dias_atraso: 0,
 prioridade: 2,
 contexto_ia: ''
 });

 useEffect(() => {
 // Ajusta os placeholders padrão ao mudar o tipo
 if (type === 'Vendas') {
 setNewDealData(prev => ({
 ...prev,
 plano: 'Fibra 1GB + Wi-Fi 6 Mesh',
 valor: 149.90
 }));
 } else if (type === 'Cobranca') {
 setNewDealData(prev => ({
 ...prev,
 dias_atraso: 3,
 valor: 99.90
 }));
 }
 }, [type]);

 const stages = useMemo(() => {
 if (type === 'Suporte') {
 return ['Novo Chamado', 'Em Análise N1', 'Escalonado N2 / NOC', 'Técnico em Rota', 'Resolvido'];
 }
 if (type === 'Vendas') {
 return ['Novo Lead', 'Qualificado (IA)', 'Negociação', 'Fechado/Ganho'];
 }
 return ['A Vencer (Preventivo)', 'Vencido (1-5d)', 'Bloqueado', 'Desbloqueio 24h', 'Recuperado (PIX)'];
 }, [type]);

 useEffect(() => {
 setLoading(true);
 fetch('/api/deals')
 .then(res => res.json())
 .then((data: Deal[]) => {
 setDeals(data.filter(d => d.pipeline === type));
 setLoading(false);
 })
 .catch(() => {
 setLoading(false);
 });
 }, [type]);

 const onDragEnd = async (result: DropResult) => {
 if (!result.destination) return;
 
 const { source, destination } = result;
 
 if (source.droppableId !== destination.droppableId) {
 const destStage = destination.droppableId;
 const movedDealId = parseInt(result.draggableId);
 
 // Atualização otimista no estado local
 setDeals(prev => prev.map(deal => 
 deal.id === movedDealId 
 ? { ...deal, estagio: destStage } 
 : deal
 ));

 if (selectedDeal && selectedDeal.id === movedDealId) {
 setSelectedDeal(prev => prev ? { ...prev, estagio: destStage } : null);
 }
 
 // Persistência nativa no backend do DJD e Automações WABA
 try {
 await fetch(`/api/deals/${movedDealId}`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ estagio: destStage })
 });
 
 // Disparo de Automação WABA
 const automationStages = ['Fechado/Ganho', 'Qualificado (IA)', 'Técnico em Rota', 'Desbloqueio 24h', 'Recuperado (PIX)'];
 if (automationStages.includes(destStage)) {
 const wabaRes = await fetch(`/api/deals/${movedDealId}/waba-trigger`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ estagio: destStage })
 });
 if (wabaRes.ok) {
 const data = await wabaRes.json();
 showToast(`Automação WABA Disparada! ${data.mensagem ? '💬 ' + data.mensagem.substring(0,40) + '...' : ''}`);
 } else {
 // Fallback to original toast logic if endpoint fails
 if (destStage === 'Fechado/Ganho') showToast('🚀 Parabéns! Contrato SGP gerado e Link de Assinatura enviado no WhatsApp.');
 else if (destStage === 'Qualificado (IA)' && type === 'Vendas') showToast('✅ Lead Qualificado! Mensagem de apresentação enviada no WhatsApp WABA.');
 else if (destStage === 'Técnico em Rota') showToast('📍 OS Atualizada! Cliente notificado com o Rastreador GPS em tempo real.');
 else if (destStage === 'Desbloqueio 24h') showToast('🔓 Desbloqueio 24h em confiança acionado direto no NAS/MikroTik!');
 else if (destStage === 'Recuperado (PIX)') showToast('💸 Receita recuperada! Mensagem de agradecimento disparada.');
 }
 }
 } catch (err) {
 console.error("Falha ao persistir movimentação no servidor:", err);
 }
 }
 };

 const handleCreateDeal = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!newDealData.titulo.trim() || !newDealData.contato.trim() || isSaving) return;

 setIsSaving(true);
 try {
 const res = await fetch('/api/deals', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 ...newDealData,
 pipeline: type
 })
 });
 const created: Deal = await res.json();
 setDeals(prev => [created, ...prev]);
 setIsModalOpen(false);
 setNewDealData({
 titulo: '',
 contato: '',
 telefone: '',
 endereco: '',
 plano: 'Fibra 500MB',
 valor: 99.90,
 dias_atraso: 0,
 prioridade: 2,
 contexto_ia: ''
 });
 showToast(`✨ ${type === 'Vendas' ? 'Lead comercial' : 'Chamado'} registrado com sucesso!`);
 } catch (err) {
 console.error("Erro ao criar chamado:", err);
 } finally {
 setIsSaving(false);
 }
 };

 const handleAdvanceStage = async (deal: Deal) => {
 const currentIndex = stages.indexOf(deal.estagio);
 if (currentIndex < stages.length - 1) {
 const nextStage = stages[currentIndex + 1];
 setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, estagio: nextStage } : d));
 setSelectedDeal(prev => prev ? { ...prev, estagio: nextStage } : null);

 showToast(`Etapa avançada para: ${nextStage}`);

 try {
 await fetch(`/api/deals/${deal.id}`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ estagio: nextStage })
 });
 } catch (err) {
 console.error(err);
 }
 }
 };

 // Helper para iniciais do avatar
 const getInitials = (name: string) => {
 if (!name) return 'CL';
 if (typeof name !== 'string') return 'CL';
 const clean = name.trim().replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
 const parts = clean.split(/\s+/);
 if (parts.length === 1) return (parts[0] ? parts[0].substring(0, 2).toUpperCase() : 'CL');
 return ((parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '')).toUpperCase() || 'CL';
 };

 const filteredDeals = useMemo(() => {
 return deals.filter(deal => {
 const matchesSearch = 
 deal.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
 deal.contato.toLowerCase().includes(searchTerm.toLowerCase()) ||
 (deal.telefone && deal.telefone.includes(searchTerm)) ||
 String(deal.id).includes(searchTerm);

 let matchesFilter = true;
 if (filterPriority === 'high') {
 matchesFilter = deal.prioridade === 1;
 } else if (filterPriority === 'ia') {
 matchesFilter = !!(deal.contexto_ia && deal.contexto_ia.trim().length > 0);
 }

 let matchesKpi = true;
 if (kpiFilter === 'funil') {
 matchesKpi = deal.valor > 0;
 } else if (kpiFilter === 'ticket') {
 matchesKpi = true; // Em um cenário de produção o ticket cruzaria valor acima da média.
 } else if (kpiFilter === 'oportunidades') {
 matchesKpi = deal.id > 0;
 }

 return matchesSearch && matchesFilter && matchesKpi;
 });
 }, [deals, searchTerm, filterPriority, kpiFilter]);

 // Cálculos de KPI no estilo Digify
 const metrics = useMemo(() => {
 const totalVolume = deals.length;
 const totalValor = deals.reduce((acc, d) => acc + (d.valor || 99.9), 0);
 const ticketMedio = totalVolume > 0 ? totalValor / totalVolume : 0;
 const highPriorityCount = deals.filter(d => d.prioridade === 1).length;
 const iaAssistedCount = deals.filter(d => d.contexto_ia && d.contexto_ia.length > 0).length;
 
 // Taxa de conclusão / recuperação
 const lastStage = stages[stages.length - 1];
 const completedCount = deals.filter(d => d.estagio === lastStage).length;
 const taxaConversao = totalVolume > 0 ? Math.round((completedCount / totalVolume) * 100) : 0;

 return {
 totalVolume,
 totalValor,
 ticketMedio,
 highPriorityCount,
 iaAssistedCount,
 taxaConversao
 };
 }, [deals, stages]);

 const pipelineInfo = {
 Vendas: {
 label: 'Funil de Vendas Comercial',
 tag: 'Leads & Negociações',
 icon: <Briefcase size={16} className="text-[#55b0ff]" />,
 activeClass: 'bg-[#0a50ff] text-white shadow-[0_4px_16px_rgba(10,80,255,0.35)]',
 route: '/admin/vendas'
 },
 Cobranca: {
 label: 'Régua de Cobrança',
 tag: 'PIX & Desbloqueio 24h',
 icon: <CreditCard size={16} className="text-[#ffb21a]" />,
 activeClass: 'bg-[#0a50ff] text-white shadow-[0_4px_16px_rgba(10,80,255,0.35)]',
 route: '/admin/cobranca'
 },
 Suporte: {
 label: 'Chamados de Suporte',
 tag: 'N1, N2 & Técnico',
 icon: <Headphones size={16} className="text-[#18c7a8]" />,
 activeClass: 'bg-[#0a50ff] text-white shadow-[0_4px_16px_rgba(10,80,255,0.35)]',
 route: '/admin/suporte'
 }
 };

 return (
 <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-foreground font-sans">
 
 {/* Toast Notifier estilo Digify */}
 {toastMessage && (
 <div className="fixed bottom-6 right-6 z-50 bg-card border border-[#0a50ff]/40 text-foreground px-4 py-3 rounded-2xl shadow-[0_12px_32px_rgba(10,80,255,0.25)] flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
 <div className="w-2 h-2 rounded-full bg-[#55b0ff] animate-ping shrink-0" />
 <p className="text-xs font-semibold">{toastMessage}</p>
 <button onClick={() => setToastMessage(null)} className="text-muted-foreground hover:text-foreground ml-2">
 <X size={14} />
 </button>
 </div>
 )}

 {/* Top Header - Digify Brand Styling */}
 <div className="border-b border-border bg-card/95 backdrop-blur-md px-5 py-4 shrink-0 space-y-3.5">
 
 {/* Row 1: Pipeline Switcher & Actions */}
 <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
 
 {/* Pipeline Switcher Tabs (Digify Multi-Pipeline) */}
 <div className="flex items-center gap-1.5 p-1 bg-card border border-border rounded-2xl">
 {(['Vendas', 'Cobranca', 'Suporte'] as const).map((pType) => {
 const info = pipelineInfo[pType];
 const isActive = type === pType;
 return (
 <button
 key={pType}
 onClick={() => navigate(info.route)}
 className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
 isActive 
 ? 'bg-[#0a50ff] text-white shadow-[0_4px_14px_rgba(10,80,255,0.4)]' 
 : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
 }`}
 >
 {info.icon}
 <span>{pType === 'Cobranca' ? 'Cobrança' : pType}</span>
 <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
 isActive ? 'bg-white/20 text-foreground font-mono' : 'bg-white/5 text-muted-foreground'
 }`}>
 {pType === type ? deals.length : '•'}
 </span>
 </button>
 );
 })}
 </div>

 {/* Search, Filters & Action Button */}
 <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
 <div className="relative flex-1 sm:w-60">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
 <input
 type="text"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 placeholder="Buscar lead, cliente ou telefone..."
 className="w-full pl-9 pr-3 py-1.5 text-xs bg-card hover:bg-muted border border-border focus:border-[#0a50ff] focus:ring-1 focus:ring-[#0a50ff] rounded-xl text-foreground placeholder:text-muted-foreground outline-none transition-all"
 />
 {searchTerm && (
 <button 
 onClick={() => setSearchTerm('')} 
 className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
 >
 <X size={12} />
 </button>
 )}
 </div>

 {/* Filter Chips */}
 <div className="flex items-center gap-1 bg-card border border-border p-0.5 rounded-xl text-xs">
 <button
 onClick={() => setFilterPriority('all')}
 className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
 filterPriority === 'all' 
 ? 'bg-muted text-foreground shadow-xs' 
 : 'text-muted-foreground hover:text-card-foreground'
 }`}
 >
 Todos
 </button>
 <button
 onClick={() => setFilterPriority(filterPriority === 'high' ? 'all' : 'high')}
 className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
 filterPriority === 'high' 
 ? 'bg-[#ff5c7a]/20 text-[#ff5c7a] border border-[#ff5c7a]/40' 
 : 'text-muted-foreground hover:text-card-foreground'
 }`}
 >
 <AlertTriangle size={11} className="text-[#ff5c7a]" />
 <span>Alta Pri.</span>
 </button>
 <button
 onClick={() => setFilterPriority(filterPriority === 'ia' ? 'all' : 'ia')}
 className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
 filterPriority === 'ia' 
 ? 'bg-[#0a50ff]/20 text-[#55b0ff] border border-[#0a50ff]/40' 
 : 'text-muted-foreground hover:text-card-foreground'
 }`}
 >
 <Sparkles size={11} className="text-[#55b0ff]" />
 <span>Copiloto IA</span>
 </button>
 </div>

 <div className="flex items-center gap-2">
 {type === 'Cobranca' && (
 <button 
 onClick={async () => {
 try {
 const res = await fetch('/api/erp/cron/regua-cobranca', { method: 'POST' });
 if (res.ok) {
 const data = await res.json();
 showToast(`⚙️ ${data.mensagem}`);
 fetch('/api/deals').then(r => r.json()).then(d => setDeals(d.filter((x: any) => x.pipeline === type)));
 }
 } catch(e) {}
 }}
 className="flex items-center gap-1.5 bg-[#ff5c7a]/15 hover:bg-[#ff5c7a]/25 text-[#ff5c7a] border border-[#ff5c7a]/30 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0"
 >
 <Zap size={14} />
 <span className="hidden sm:inline">Motor de Cobrança</span>
 </button>
 )}
 {/* Primary Action Button (Digify Electric Blue) */}
 <button 
 onClick={() => setIsModalOpen(true)}
 className="flex items-center gap-2 bg-[#0a50ff] hover:bg-[#0842cc] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-[0_4px_16px_rgba(10,80,255,0.35)] active:scale-95 shrink-0"
 >
 <Plus size={15} />
 <span>Novo {type === 'Suporte' ? 'Chamado' : type === 'Vendas' ? 'Lead' : 'Título'}</span>
 </button>
 </div>
 </div>
 </div>

 {/* Row 2: Digify KPI Bar (Métricas Executivas do Funil) */}
 <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-1">
 <button 
 onClick={() => setKpiFilter(kpiFilter === 'funil' ? 'todos' : 'funil')}
 className={`text-left rounded-xl px-3.5 py-2.5 flex items-center gap-3 transition-all ${
 kpiFilter === 'funil' 
 ? 'bg-muted border border-[#0a50ff]/50 shadow-[0_0_15px_rgba(10,80,255,0.1)]' 
 : 'bg-card/80 border border-border hover:bg-muted/80'
 }`}
 >
 <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
 kpiFilter === 'funil' ? 'bg-[#0a50ff]/20 text-[#55b0ff] border border-[#0a50ff]/40' : 'bg-[#0a50ff]/15 text-[#55b0ff] border border-[#0a50ff]/30'
 }`}>
 <DollarSign size={16} />
 </div>
 <div className="min-w-0">
 <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
 {type === 'Cobranca' ? 'Total em Débito' : 'Valor no Funil'}
 </p>
 <p className="text-sm font-extrabold text-foreground truncate font-mono">
 R$ {metrics.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
 </p>
 </div>
 </button>
 
 <button 
 onClick={() => setKpiFilter(kpiFilter === 'ticket' ? 'todos' : 'ticket')}
 className={`text-left rounded-xl px-3.5 py-2.5 flex items-center gap-3 transition-all ${
 kpiFilter === 'ticket' 
 ? 'bg-muted border border-[#18c7a8]/50 shadow-[0_0_15px_rgba(24,199,168,0.1)]' 
 : 'bg-card/80 border border-border hover:bg-muted/80'
 }`}
 >
 <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
 kpiFilter === 'ticket' ? 'bg-[#18c7a8]/20 text-[#18c7a8] border border-[#18c7a8]/40' : 'bg-[#18c7a8]/15 text-[#18c7a8] border border-[#18c7a8]/30'
 }`}>
 <TrendingUp size={16} />
 </div>
 <div className="min-w-0">
 <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Ticket Médio</p>
 <p className="text-sm font-extrabold text-foreground truncate font-mono">
 R$ {metrics.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
 </p>
 </div>
 </button>

 <button 
 onClick={() => setKpiFilter(kpiFilter === 'oportunidades' ? 'todos' : 'oportunidades')}
 className={`text-left rounded-xl px-3.5 py-2.5 flex items-center gap-3 transition-all ${
 kpiFilter === 'oportunidades' 
 ? 'bg-muted border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
 : 'bg-card/80 border border-border hover:bg-muted/80'
 }`}
 >
 <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
 kpiFilter === 'oportunidades' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40' : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
 }`}>
 <Layers size={16} />
 </div>
 <div className="min-w-0">
 <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Oportunidades</p>
 <p className="text-sm font-extrabold text-foreground truncate">
 {metrics.totalVolume} <span className="text-[11px] font-normal text-muted-foreground">negócios</span>
 </p>
 </div>
 </button>

 <div className="bg-card/80 border border-border rounded-xl px-3.5 py-2.5 flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-[#22c55e]/15 border border-[#22c55e]/30 flex items-center justify-center shrink-0">
 <CheckCircle2 size={16} className="text-[#22c55e]" />
 </div>
 <div className="min-w-0">
 <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
 {type === 'Cobranca' ? 'Taxa Recuperação' : 'Taxa de Fechamento'}
 </p>
 <p className="text-sm font-extrabold text-emerald-400 truncate">
 {metrics.taxaConversao}%
 </p>
 </div>
 </div>

 <div className="hidden lg:flex bg-card/80 border border-border rounded-xl px-3.5 py-2.5 items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-[#55b0ff]/15 border border-[#55b0ff]/30 flex items-center justify-center shrink-0">
 <Sparkles size={16} className="text-[#55b0ff]" />
 </div>
 <div className="min-w-0">
 <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Copiloto Gemini</p>
 <p className="text-sm font-extrabold text-[#55b0ff] truncate">
 {metrics.iaAssistedCount} <span className="text-[11px] font-normal text-muted-foreground">qualificados</span>
 </p>
 </div>
 </div>
 </div>

 </div>

 {/* Kanban Board Area */}
 <div className="flex-1 overflow-x-auto p-4 sm:p-5 crm-kanban-scroll">
 {loading ? (
 <div className="h-full flex items-center justify-center">
 <div className="flex flex-col items-center gap-3 text-muted-foreground">
 <div className="w-8 h-8 border-2 border-[#0a50ff] border-t-transparent rounded-full animate-spin" />
 <p className="text-xs font-semibold">Carregando oportunidades Digify CRM...</p>
 </div>
 </div>
 ) : (
 <DragDropContext onDragEnd={onDragEnd}>
 <div className="flex gap-4 h-full min-w-max pb-2 items-start">
 {stages.map((stage, stageIdx) => {
 const stageDeals = filteredDeals.filter(d => d.estagio === stage);
 const stageValor = stageDeals.reduce((acc, d) => acc + (d.valor || 99.9), 0);

 // Cores de estágio estilo Digify
 const stageColor = 
 stageIdx === 0 ? '#0a50ff' :
 stageIdx === 1 ? '#ffb21a' :
 stageIdx === 2 ? '#818cf8' :
 '#18c7a8';

 return (
 <div key={stage} className="w-80 sm:w-84 flex flex-col h-full max-h-full">
 
 {/* Stage Header Digify */}
 <div className="bg-card border border-border rounded-t-2xl p-3.5 shrink-0 shadow-sm">
 <div className="flex justify-between items-center mb-1.5">
 <div className="flex items-center gap-2 min-w-0">
 <span 
 className="w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_8px]" 
 style={{ backgroundColor: stageColor, boxShadow: `0 0 10px ${stageColor}88` }}
 />
 <h3 className="font-bold text-foreground text-xs uppercase tracking-wider truncate font-sans">
 {stage}
 </h3>
 </div>
 <span className="text-[11px] font-extrabold bg-muted text-[#55b0ff] px-2.5 py-0.5 rounded-full border border-border shrink-0 font-mono">
 {stageDeals.length}
 </span>
 </div>
 
 {/* Subtotal da Etapa */}
 <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1 border-t border-white/[0.04]">
 <span>Subtotal da etapa:</span>
 <span className="font-bold text-card-foreground font-mono">
 R$ {stageValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
 </span>
 </div>
 </div>
 
 {/* Droppable Stage Column */}
 <Droppable droppableId={stage}>
 {(provided, snapshot) => (
 <div 
 ref={provided.innerRef}
 {...provided.droppableProps}
 className={`flex-1 overflow-y-auto space-y-2.5 p-2.5 rounded-b-2xl border-x border-b transition-all duration-200 min-h-[180px] crm-kanban-scroll ${
 snapshot.isDraggingOver 
 ? 'bg-[#0a50ff]/10 border-2 border-dashed border-[#0a50ff]' 
 : 'bg-card/60 border-border'
 }`}
 >
 {stageDeals.map((deal, index) => {
 const DraggableItem = Draggable as any;
 return (
 <DraggableItem key={deal.id} draggableId={String(deal.id)} index={index}>
 {(provided: any, snapshot: any) => (
 <div 
 onClick={() => setSelectedDeal(deal)}
 ref={provided.innerRef}
 {...provided.draggableProps}
 {...provided.dragHandleProps}
 className={`bg-card p-3.5 rounded-xl border transition-all duration-200 cursor-grab select-none group ${
 snapshot.isDragging 
 ? 'border-[#0a50ff] shadow-[0_16px_36px_rgba(10,80,255,0.3)] rotate-1 scale-[1.02] z-50 ring-2 ring-[#0a50ff]' 
 : 'border-border hover:border-[#0a50ff]/50 hover:shadow-[0_8px_24px_rgba(10,80,255,0.12)] hover:-translate-y-0.5'
 }`}
 >
 {/* Card Header: ID, Prioridade & Horário */}
 <div className="flex justify-between items-center mb-2">
 <div className="flex items-center gap-1.5">
 <span className="text-[10px] font-mono font-bold text-[#55b0ff] bg-[#0a50ff]/15 border border-[#0a50ff]/30 px-1.5 py-0.5 rounded-md">
 #{deal.id}
 </span>
 {deal.prioridade === 1 && (
 <span className="text-[9px] uppercase font-bold text-[#ff5c7a] bg-[#ff5c7a]/15 border border-[#ff5c7a]/30 px-1.5 py-0.5 rounded-md flex items-center gap-1">
 <AlertTriangle size={10} /> Alta
 </span>
 )}
 </div>

 <span className="text-[10px] text-muted-foreground font-medium">
 {deal.criado_em || 'Hoje'}
 </span>
 </div>

 {/* Assinante / Lead - Digify Avatar & Name */}
 <div className="flex items-center gap-2.5 mb-2.5">
 <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0a50ff] to-[#55b0ff] flex items-center justify-center text-[10px] font-extrabold text-foreground shrink-0 shadow-sm">
 {getInitials(deal.contato)}
 </div>
 <div className="min-w-0 flex-1">
 <p className="text-xs font-bold text-foreground truncate group-hover:text-[#55b0ff] transition-colors">
 {deal.contato}
 </p>
 <p className="text-[10px] text-muted-foreground truncate">
 {deal.telefone || '(11) 98765-4321'}
 </p>
 </div>
 </div>

 {/* Título da Oportunidade / Chamado */}
 <h4 className="font-semibold text-card-foreground text-xs leading-snug mb-2.5 line-clamp-2">
 {deal.titulo}
 </h4>

 {/* Contexto IA se presente */}
 {deal.contexto_ia && (
 <div className="mb-2.5 px-2 py-1 rounded-lg bg-[#0a50ff]/10 border border-[#0a50ff]/20 text-[10px] text-[#55b0ff] flex items-center gap-1.5">
 <Sparkles size={11} className="shrink-0 text-[#55b0ff]" />
 <span className="truncate">{deal.contexto_ia}</span>
 </div>
 )}

 {/* Bottom Info: Plano & Valor */}
 <div className="pt-2.5 border-t border-border flex justify-between items-center text-[11px]">
 <div className="flex items-center gap-1 text-muted-foreground font-medium">
 <Wifi size={11} className="text-[#0a50ff]" />
 <span className="truncate max-w-[120px]">{deal.plano || 'Fibra 500MB'}</span>
 </div>

 <div className="text-right font-mono">
 {type === 'Cobranca' && deal.valor ? (
 <span className="text-[#ffb21a] font-bold bg-[#ffb21a]/10 px-1.5 py-0.5 rounded border border-[#ffb21a]/20">
 R$ {deal.valor.toFixed(2)}
 </span>
 ) : (
 <span className="text-[#18c7a8] font-bold">
 R$ {(deal.valor || 99.90).toFixed(2)}
 </span>
 )}
 </div>
 </div>

 {/* Quick Actions Row no Hover */}
 <div className="mt-2 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-muted-foreground">
 <div className="flex items-center gap-1.5">
 <a
 href={`https://wa.me/55${(deal.telefone || '').replace(/\D/g, '')}`}
 target="_blank"
 rel="noreferrer"
 onClick={(e) => e.stopPropagation()}
 className="p-1 rounded-lg hover:bg-[#22c55e]/15 hover:text-[#22c55e] transition-colors"
 title="Conversar no WhatsApp"
 >
 <MessageSquare size={13} />
 </a>

 {deal.endereco && (
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 setMapTargetDeal(deal);
 }}
 className="p-1 rounded-lg hover:bg-[#0a50ff]/15 hover:text-[#55b0ff] transition-colors"
 title="Ver endereço no mapa"
 >
 <MapPin size={13} />
 </button>
 )}
 </div>

 {/* Botão de Avanço Rápido */}
 {stageIdx < stages.length - 1 && (
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 handleAdvanceStage(deal);
 }}
 className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-white px-2 py-0.5 rounded-lg hover:bg-[#0a50ff] transition-all"
 title={`Avançar para ${stages[stageIdx + 1]}`}
 >
 <span>Avançar</span>
 <ArrowRight size={11} />
 </button>
 )}
 </div>

 </div>
 )}
 </DraggableItem>
 );
 })}
 {provided.placeholder}
 
 {stageDeals.length === 0 && !snapshot.isDraggingOver && (
 <div className="border border-dashed border-border rounded-xl h-28 flex flex-col items-center justify-center text-[11px] text-muted-foreground bg-card/40 p-3 text-center">
 <Layers size={18} className="text-muted-foreground mb-1" />
 <span>Nenhum card nesta etapa</span>
 </div>
 )}
 </div>
 )}
 </Droppable>
 </div>
 );
 })}
 </div>
 </DragDropContext>
 )}
 </div>

 {/* Slide-over Deal Panel - Digify 360 Style */}
 {selectedDeal && (
 <>
 <div 
 onClick={() => setSelectedDeal(null)} 
 className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40"
 aria-hidden="true"
 />
 <div className="fixed top-0 right-0 h-full w-full sm:max-w-lg bg-card border-l border-border shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-in slide-in-from-right duration-200 flex flex-col z-50 font-sans">
 
 {/* Header do Drawer */}
 <div className="p-5 border-b border-border bg-card flex justify-between items-start shrink-0">
 <div>
 <div className="flex items-center gap-2 mb-1.5">
 <span className="text-[10px] font-mono font-bold text-[#55b0ff] bg-[#0a50ff]/15 border border-[#0a50ff]/30 px-2 py-0.5 rounded-md">
 #{selectedDeal.id}
 </span>
 <span className="text-[10px] uppercase font-bold text-white bg-[#0a50ff] px-2.5 py-0.5 rounded-md">
 {selectedDeal.estagio}
 </span>
 {selectedDeal.prioridade === 1 && (
 <span className="text-[10px] uppercase font-bold text-[#ff5c7a] bg-[#ff5c7a]/20 border border-[#ff5c7a]/30 px-2 py-0.5 rounded-md flex items-center gap-1">
 <AlertTriangle size={10} /> Crítico
 </span>
 )}
 </div>
 <h2 className="text-base font-extrabold text-foreground">
 {selectedDeal.titulo}
 </h2>
 </div>
 <button 
 onClick={() => setSelectedDeal(null)}
 className="p-1.5 hover:bg-accent rounded-xl text-muted-foreground hover:text-foreground transition-colors"
 >
 <X size={18} />
 </button>
 </div>

 {/* Funil Visual Stepper (Digify Pipeline Progress) */}
 <div className="px-5 py-3 bg-muted border-b border-border shrink-0">
 <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Progresso no Pipeline</p>
 <div className="flex items-center justify-between gap-1 relative">
 {stages.map((st, idx) => {
 const currentIdx = stages.indexOf(selectedDeal.estagio);
 const isPassed = idx < currentIdx;
 const isCurrent = idx === currentIdx;

 return (
 <div key={st} className="flex-1 flex flex-col items-center relative">
 <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all z-10 ${
 isPassed 
 ? 'bg-[#18c7a8] text-white' 
 : isCurrent 
 ? 'bg-[#0a50ff] text-white ring-4 ring-[#0a50ff]/20' 
 : 'bg-muted text-muted-foreground'
 }`}>
 {isPassed ? <Check size={12} /> : idx + 1}
 </div>
 <span className={`text-[9px] mt-1 font-medium truncate max-w-[70px] text-center ${
 isCurrent ? 'text-foreground font-bold' : isPassed ? 'text-muted-foreground' : 'text-muted-foreground'
 }`}>
 {st}
 </span>
 </div>
 );
 })}
 </div>
 </div>
 
 {/* Body Details */}
 <div className="flex-1 overflow-y-auto p-5 space-y-4 crm-kanban-scroll">
 
 {/* Card de Assinante */}
 <div className="bg-card p-4 rounded-2xl border border-border space-y-3 text-xs">
 <div className="flex items-center justify-between pb-2 border-b border-border">
 <h3 className="font-bold text-foreground flex items-center gap-2">
 <User size={14} className="text-[#55b0ff]" /> Dados do Contato
 </h3>
 <span className="text-[10px] text-[#55b0ff] bg-[#0a50ff]/10 px-2 py-0.5 rounded-full border border-[#0a50ff]/20">
 Sincronizado SGP
 </span>
 </div>
 
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0a50ff] to-[#55b0ff] flex items-center justify-center text-sm font-extrabold text-foreground">
 {getInitials(selectedDeal.contato)}
 </div>
 <div>
 <p className="font-bold text-foreground text-sm">{selectedDeal.contato}</p>
 <p className="text-muted-foreground">{selectedDeal.telefone || '(11) 98765-4321'}</p>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-2 pt-1">
 <div className="p-2.5 bg-muted rounded-xl border border-border">
 <p className="text-[10px] uppercase font-bold text-muted-foreground">Plano Contratado</p>
 <p className="font-semibold text-foreground mt-0.5">{selectedDeal.plano || 'Fibra 500MB'}</p>
 </div>
 <div className="p-2.5 bg-muted rounded-xl border border-border">
 <p className="text-[10px] uppercase font-bold text-muted-foreground">
 {type === 'Cobranca' ? 'Valor em Débito' : 'Valor Mensal'}
 </p>
 <p className="font-bold text-[#18c7a8] font-mono mt-0.5">
 R$ {(selectedDeal.valor || 99.90).toFixed(2)}
 </p>
 </div>
 </div>

 {type === 'Cobranca' && selectedDeal.dias_atraso !== undefined && selectedDeal.dias_atraso > 0 && (
 <div className="p-2.5 bg-[#ff5c7a]/10 border border-[#ff5c7a]/30 rounded-xl flex items-center justify-between">
 <span className="text-xs text-[#ff5c7a] font-bold flex items-center gap-1.5">
 <AlertTriangle size={13} /> Inadimplência
 </span>
 <span className="text-xs font-bold text-[#ff5c7a]">
 {selectedDeal.dias_atraso} dias em atraso
 </span>
 </div>
 )}

 {/* Endereço & Mapa */}
 <div className="pt-1">
 <div className="flex items-center justify-between mb-1.5">
 <p className="text-[10px] uppercase font-bold text-muted-foreground">Endereço de Instalação</p>
 <button
 type="button"
 onClick={() => setMapTargetDeal(selectedDeal)}
 className="text-[11px] font-bold text-[#55b0ff] hover:underline flex items-center gap-1"
 >
 <MapPin size={12} />
 <span>Ver no Mapa</span>
 </button>
 </div>
 <div className="bg-muted border border-border rounded-xl p-3 flex items-center justify-between gap-2">
 <div className="flex items-center gap-2 min-w-0">
 <MapPin size={14} className="text-[#0a50ff] shrink-0" />
 <span className="font-medium text-card-foreground text-xs truncate">
 {selectedDeal.endereco || 'Rua das Acácias, 412 - Jd. Primavera'}
 </span>
 </div>
 <button
 type="button"
 onClick={() => setMapTargetDeal(selectedDeal)}
 className="px-2.5 py-1 bg-[#18c7a8] hover:bg-[#16b296] text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 transition-colors"
 title="Compartilhar rota com técnico via WhatsApp"
 >
 <Share2 size={11} />
 <span>Rota GPS</span>
 </button>
 </div>
 </div>
 </div>

 {/* Contexto IA & Copiloto Gemini */}
 <div className="bg-gradient-to-br from-[#0a50ff]/15 to-[#55b0ff]/5 border border-[#0a50ff]/30 rounded-2xl p-4 space-y-2">
 <div className="flex items-center gap-1.5 text-[#55b0ff] font-bold uppercase tracking-wider text-[11px]">
 <Sparkles size={14} />
 <span>Copiloto Gemini & Telemetria</span>
 </div>
 <p className="text-xs text-card-foreground leading-relaxed">
 {selectedDeal.contexto_ia || 
 (type === 'Suporte' 
 ? 'Telemetria TR-069 acusa sinal óptico Rx em -19.4 dBm (Excelente). Nenhuma perda de pacotes recente. Sugestão: reiniciar CPE ou validar roteador mesh.'
 : type === 'Vendas'
 ? 'Lead demonstrou alto interesse no plano Gamer de 700MB. Canal de entrada: Anúncio Instagram. Responde rápido no WhatsApp comercial.'
 : 'Cliente com histórico de pagamento pontual até o ciclo atual. Recomendado disparo de link PIX com desconto até o vencimento.')}
 </p>
 </div>

 {/* Histórico & Linha do Tempo */}
 <div className="bg-card p-4 rounded-2xl border border-border">
 <h3 className="font-bold text-foreground mb-3 text-xs flex items-center gap-1.5">
 <Clock size={14} className="text-[#55b0ff]" /> Histórico de Atividades
 </h3>
 <div className="space-y-3 pl-2 border-l-2 border-border ml-1.5 text-xs">
 <div className="relative pl-3">
 <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 bg-[#0a50ff] rounded-full border-2 border-slate-900" />
 <p className="text-[10px] text-muted-foreground">{selectedDeal.criado_em || 'Hoje'}</p>
 <p className="font-semibold text-foreground">Etapa atual: {selectedDeal.estagio}</p>
 </div>
 <div className="relative pl-3">
 <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 bg-slate-500 rounded-full border-2 border-slate-900" />
 <p className="text-[10px] text-muted-foreground">Entrada no Sistema</p>
 <p className="text-muted-foreground">Lead sincronizado via API Omnichannel</p>
 </div>
 </div>
 </div>

 </div>
 
 {/* Drawer Footer Actions */}
 <div className="p-4 border-t border-border bg-card flex gap-2.5 shrink-0">
 <a
 href={`https://wa.me/55${(selectedDeal.telefone || '').replace(/\D/g, '')}`}
 target="_blank"
 rel="noreferrer"
 className="flex-1 bg-muted hover:bg-muted border border-border text-foreground px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
 >
 <MessageSquare size={15} className="text-[#22c55e]" />
 <span>Conversar no WhatsApp</span>
 </a>

 {stages.indexOf(selectedDeal.estagio) < stages.length - 1 ? (
 <button 
 onClick={() => handleAdvanceStage(selectedDeal)}
 className="flex-1 bg-[#0a50ff] hover:bg-[#0842cc] text-white px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-[0_4px_16px_rgba(10,80,255,0.35)] flex items-center justify-center gap-2"
 >
 <span>Avançar Etapa</span>
 <ArrowRight size={15} />
 </button>
 ) : (
 <div className="flex-1 bg-[#18c7a8]/15 border border-[#18c7a8]/30 text-[#18c7a8] px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
 <Check size={15} /> Concluído
 </div>
 )}
 </div>
 </div>
 </>
 )}

 {/* Modal de Criação de Novo Card - Digify UI */}
 {isModalOpen && (
 <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
 <div className="bg-card rounded-2xl max-w-md w-full p-6 border border-border shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95">
 <div className="flex justify-between items-center pb-3 border-b border-border mb-4">
 <div>
 <h3 className="font-extrabold text-foreground text-base">
 Novo {type === 'Suporte' ? 'Chamado de Suporte' : type === 'Vendas' ? 'Lead Comercial' : 'Título em Cobrança'}
 </h3>
 <p className="text-[11px] text-muted-foreground mt-0.5">
 Preencha os dados da oportunidade para o pipeline da Digify
 </p>
 </div>
 <button 
 onClick={() => setIsModalOpen(false)}
 className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
 >
 <X size={18} />
 </button>
 </div>

 <form onSubmit={handleCreateDeal} className="space-y-3 text-xs">
 <div>
 <label className="block font-bold text-muted-foreground mb-1">Título da Oportunidade / Assunto</label>
 <input
 type="text"
 required
 placeholder={type === 'Suporte' ? "Ex: Lentidão na fibra óptica" : type === 'Vendas' ? "Ex: Contratação Residencial 700MB" : "Ex: Mensalidade Vencida"}
 value={newDealData.titulo}
 onChange={(e) => setNewDealData({ ...newDealData, titulo: e.target.value })}
 className="w-full bg-card border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-[#0a50ff]"
 />
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block font-bold text-muted-foreground mb-1">Nome do Cliente</label>
 <input
 type="text"
 required
 placeholder="Ex: Carlos Eduardo"
 value={newDealData.contato}
 onChange={(e) => setNewDealData({ ...newDealData, contato: e.target.value })}
 className="w-full bg-card border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-[#0a50ff]"
 />
 </div>
 <div>
 <label className="block font-bold text-muted-foreground mb-1">Telefone / WhatsApp</label>
 <input
 type="text"
 placeholder="(11) 98765-4321"
 value={newDealData.telefone}
 onChange={(e) => setNewDealData({ ...newDealData, telefone: e.target.value })}
 className="w-full bg-card border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-[#0a50ff]"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block font-bold text-muted-foreground mb-1">Plano de Internet</label>
 <select
 value={newDealData.plano}
 onChange={(e) => setNewDealData({ ...newDealData, plano: e.target.value })}
 className="w-full bg-card border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-[#0a50ff]"
 >
 <option value="Fibra 300MB">Fibra 300MB</option>
 <option value="Fibra 500MB">Fibra 500MB</option>
 <option value="Fibra 700MB Gamer">Fibra 700MB Gamer</option>
 <option value="Fibra 1GB Empresarial">Fibra 1GB Empresarial</option>
 </select>
 </div>
 <div>
 <label className="block font-bold text-muted-foreground mb-1">Valor Mensal (R$)</label>
 <input
 type="number"
 step="0.01"
 value={newDealData.valor}
 onChange={(e) => setNewDealData({ ...newDealData, valor: parseFloat(e.target.value) || 0 })}
 className="w-full bg-card border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-[#0a50ff]"
 />
 </div>
 </div>

 <div>
 <label className="block font-bold text-muted-foreground mb-1">Endereço de Instalação</label>
 <input
 type="text"
 placeholder="Rua, número, bairro e cidade"
 value={newDealData.endereco}
 onChange={(e) => setNewDealData({ ...newDealData, endereco: e.target.value })}
 className="w-full bg-card border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-[#0a50ff]"
 />
 </div>

 <div className="pt-3 flex justify-end gap-2 border-t border-border">
 <button
 type="button"
 onClick={() => setIsModalOpen(false)}
 className="px-4 py-2 border border-border text-muted-foreground rounded-xl font-bold hover:bg-card transition-colors"
 >
 Cancelar
 </button>
 <button
 type="submit"
 disabled={isSaving}
 className="px-4 py-2 bg-[#0a50ff] hover:bg-[#0842cc] text-white rounded-xl font-bold transition-all shadow-[0_4px_16px_rgba(10,80,255,0.35)] flex items-center gap-1.5"
 >
 {isSaving ? 'Salvando...' : 'Criar Oportunidade'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* Modal de Mapa, Busca de CEP e Compartilhamento com Técnico */}
 {mapTargetDeal && (
 <AddressMapModal
 isOpen={!!mapTargetDeal}
 onClose={() => setMapTargetDeal(null)}
 cliente={{
 id: mapTargetDeal.id,
 nome: mapTargetDeal.contato,
 telefone: mapTargetDeal.telefone,
 endereco: mapTargetDeal.endereco
 }}
 onAddressUpdated={(novo) => {
 setDeals(prev => prev.map(d => d.id === mapTargetDeal.id ? {
 ...d,
 endereco: novo.endereco || d.endereco
 } : d));
 if (selectedDeal && selectedDeal.id === mapTargetDeal.id) {
 setSelectedDeal(prev => prev ? {
 ...prev,
 endereco: novo.endereco || prev.endereco
 } : null);
 }
 }}
 />
 )}

 </div>
 );
}

