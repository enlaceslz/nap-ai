import React, { useState, useEffect } from 'react';
import { fetchHelpDeskDashboardData } from '../../../services/helpdeskApi';
import { 
 Ticket, 
 MapPin, 
 Clock, 
 AlertCircle, 
 Activity, 
 CheckCircle2, 
 Search,
 Filter,
 Plus,
 X
} from 'lucide-react';

export default function HelpDeskDashboard() {
 const [tickets, setTickets] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [activeTab, setActiveTab] = useState('tickets');
 const [kpiFilter, setKpiFilter] = useState<'todos' | 'abertos' | 'criticos' | 'campo' | 'sla'>('todos');
 const [searchTerm, setSearchTerm] = useState('');
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [newOS, setNewOS] = useState({ title: '', priority: 'normal', description: '' });
 const [isSaving, setIsSaving] = useState(false);

 const [metrics, setMetrics] = useState<any>(null);
 const [nocStatus, setNocStatus] = useState<any>(null);
 const [selectedTicket, setSelectedTicket] = useState<any>(null);

 useEffect(() => {
 fetchHelpDeskDashboardData().then(res => {
 setTickets(res.tickets);
 setMetrics(res.metrics);
 setNocStatus(res.nocStatus);
 setLoading(false);
 });
 }, []);

 return (
 <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
 
 {/* HEADER PRINCIPAL */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
 <Ticket className="text-blue-600" />
 Central de Serviços (Help Desk)
 </h1>
 <p className="text-muted-foreground text-sm mt-1">
 Orquestração de Incidentes de Rede e Ordens de Serviço
 </p>
 </div>
 <div className="flex items-center gap-3">
 <button className="px-4 py-2 bg-muted text-card-foreground font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-accent transition-colors flex items-center gap-2 text-sm">
 <Filter size={16} />
 Filtros
 </button>
 <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2 text-sm">
 <Plus size={16} />
 Nova OS
 </button>
 </div>
 </div>

 {/* MÉTRICAS DE TOPO */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <button 
 onClick={() => setKpiFilter(kpiFilter === 'abertos' ? 'todos' : 'abertos')}
 className={`text-left rounded-2xl p-5 border shadow-sm flex items-center gap-4 transition-all ${
 kpiFilter === 'abertos' 
 ? 'bg-background /80 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
 : 'bg-card border-border hover:bg-slate-50 dark:hover:bg-muted/50'
 }`}
 >
 <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
 kpiFilter === 'abertos' ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30' : 'bg-blue-500/10 text-blue-500'
 }`}>
 <Ticket size={24} />
 </div>
 <div>
 <div className="text-3xl font-bold text-foreground">{loading ? "-" : metrics?.openTickets}</div>
 <div className="text-sm font-medium text-muted-foreground">Tickets Abertos</div>
 </div>
 </button>

 <button 
 onClick={() => setKpiFilter(kpiFilter === 'criticos' ? 'todos' : 'criticos')}
 className={`text-left rounded-2xl p-5 border shadow-sm flex items-center gap-4 transition-all ${
 kpiFilter === 'criticos' 
 ? 'bg-background /80 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.1)]' 
 : 'bg-card border-border hover:bg-slate-50 dark:hover:bg-muted/50'
 }`}
 >
 <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
 kpiFilter === 'criticos' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' : 'bg-orange-500/10 text-orange-500'
 }`}>
 <AlertCircle size={24} />
 </div>
 <div>
 <div className="text-3xl font-bold text-foreground">{loading ? "-" : metrics?.criticalIncidents}</div>
 <div className="text-sm font-medium text-muted-foreground">Incidentes Críticos</div>
 </div>
 </button>

 <button 
 onClick={() => setKpiFilter(kpiFilter === 'campo' ? 'todos' : 'campo')}
 className={`text-left rounded-2xl p-5 border shadow-sm flex items-center gap-4 transition-all ${
 kpiFilter === 'campo' 
 ? 'bg-background /80 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
 : 'bg-card border-border hover:bg-slate-50 dark:hover:bg-muted/50'
 }`}
 >
 <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
 kpiFilter === 'campo' ? 'bg-purple-500/20 text-purple-500 border border-purple-500/30' : 'bg-purple-500/10 text-purple-500'
 }`}>
 <MapPin size={24} />
 </div>
 <div>
 <div className="text-3xl font-bold text-foreground">{loading ? "-" : metrics?.fieldOrders}</div>
 <div className="text-sm font-medium text-muted-foreground">OS em Campo</div>
 </div>
 </button>

 <button 
 onClick={() => setKpiFilter(kpiFilter === 'sla' ? 'todos' : 'sla')}
 className={`text-left rounded-2xl p-5 border shadow-sm flex items-center gap-4 transition-all ${
 kpiFilter === 'sla' 
 ? 'bg-background /80 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
 : 'bg-card border-border hover:bg-slate-50 dark:hover:bg-muted/50'
 }`}
 >
 <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
 kpiFilter === 'sla' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' : 'bg-emerald-500/10 text-emerald-500'
 }`}>
 <Clock size={24} />
 </div>
 <div>
 <div className="text-3xl font-bold text-foreground">{loading ? "-" : metrics?.slaCompliance}%</div>
 <div className="text-sm font-medium text-muted-foreground">SLA Atendido</div>
 </div>
 </button>
 </div>

 {/* AREA CENTRAL */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 {/* LISTAGEM DE TICKETS */}
 <div className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-sm flex flex-col h-[600px]">
 <div className="p-4 border-b border-border flex items-center justify-between">
 <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
 <button 
 onClick={() => setActiveTab('tickets')}
 className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'tickets' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-slate-700 dark:hover:text-muted-foreground'}`}
 >
 Caixa de Entrada
 </button>
 <button 
 onClick={() => setActiveTab('os')}
 className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'os' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-slate-700 dark:hover:text-muted-foreground'}`}
 >
 Ordens de Serviço
 </button>
 </div>
 
 <div className="relative w-64">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
 <input type="text" placeholder="Buscar ticket ou OS..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-foreground"
 />
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-4 space-y-3">
 {loading ? (
 <div className="flex items-center justify-center h-full text-muted-foreground">
 <Activity className="animate-pulse mr-2" /> Carregando incidentes...
 </div>
 ) : (
 tickets.filter((t: any) => {
 const matchesTab = activeTab === 'os' ? t.source === 'sgp' : t.source !== 'sgp';
 
 let matchesKpi = true;
 if (kpiFilter === 'abertos') {
 matchesKpi = t.status !== 'resolvido';
 } else if (kpiFilter === 'criticos') {
 matchesKpi = t.priority === 'alta';
 } else if (kpiFilter === 'campo') {
 matchesKpi = t.source === 'sgp' && t.status !== 'resolvido';
 } else if (kpiFilter === 'sla') {
 matchesKpi = t.status === 'resolvido';
 }

 const titleStr = t.title ? t.title.toString() : '';
 const idStr = t.id ? t.id.toString() : '';
 const matchesSearch = titleStr.toLowerCase().includes(searchTerm.toLowerCase()) || idStr.toLowerCase().includes(searchTerm.toLowerCase());
 return matchesTab && matchesSearch && matchesKpi;
 }).map((t: any) => (
 <div key={t.id} className="group p-4 rounded-xl border border-border hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer bg-card flex items-center gap-4">
 
 {/* Status Indicator */}
 <div className={`w-2 h-12 rounded-full ${
 t.priority === 'alta' ? 'bg-red-500' : 
 t.status === 'resolvido' ? 'bg-emerald-500' : 
 'bg-blue-500'
 }`}></div>

 <div className="flex-1">
 <div className="flex justify-between items-start mb-1">
 <h3 className="font-semibold text-foreground text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
 {t.title}
 </h3>
 <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
 {t.id}
 </span>
 </div>
 
 <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
 <span className="flex items-center gap-1.5"><Clock size={14} /> {t.date}</span>
 <span className="flex items-center gap-1.5">
 <div className={`w-1.5 h-1.5 rounded-full ${t.priority === 'alta' ? 'bg-red-500' : 'bg-slate-400'}`}></div>
 Prioridade {t.priority}
 </span>
 <span className="px-2 py-0.5 rounded uppercase text-[10px] tracking-wider border border-border bg-muted/50">
 {t.source}
 </span>
 </div>
 </div>
 </div>
 ))
 )}
 </div>
 </div>

 {/* COLUNA DIREITA - CONTEXTO RÁPIDO */}
 <div className="space-y-6">
 <div className="bg-card text-foreground rounded-2xl border border-border shadow-sm p-6 overflow-hidden relative">
 <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
 <Activity size={120} />
 </div>
 
 <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
 <Activity className="text-blue-400" />
 NOC Status
 </h3>
 
 <div className="space-y-4 relative z-10">
 <div className="flex justify-between items-center border-b border-border pb-3">
 <span className="text-sm text-muted-foreground">OLTs Operacionais</span>
 <span className="font-mono font-bold text-emerald-400">{loading ? "-" : `${nocStatus?.oltsUp} / ${nocStatus?.oltsTotal}`}</span>
 </div>
 <div className="flex justify-between items-center border-b border-border pb-3">
 <span className="text-sm text-muted-foreground">Links BGP (Transit)</span>
 <span className="font-mono font-bold text-emerald-400">{loading ? "-" : `${nocStatus?.bgpUp} / ${nocStatus?.bgpTotal} UP`}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-sm text-muted-foreground">Alarme Recente</span>
 <span className="text-xs font-medium bg-red-500/20 text-red-400 px-2 py-1 rounded">{loading ? "-" : nocStatus?.recentAlarm}</span>
 </div>
 </div>
 </div>

 <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
 <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
 <CheckCircle2 size={16} className="text-blue-500" />
 Minhas Atribuições
 </h3>
 
 <div className="text-center py-8">
 <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-3">
 <CheckCircle2 size={24} className="text-muted-foreground " />
 </div>
 <p className="text-sm font-medium text-muted-foreground">Nenhuma OS pendente para você hoje.</p>
 </div>
 </div>
 </div>

 </div>

 {/* MODAL NOVA OS */}
 {isModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
 <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
 <div className="flex items-center justify-between p-4 border-b border-border">
 <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
 <Plus size={20} className="text-blue-500" />
 Criar Nova OS
 </h3>
 <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-slate-600 dark:hover:text-foreground transition-colors">
 <X size={20} />
 </button>
 </div>
 <div className="p-4 space-y-4">
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Título</label>
 <input 
 type="text" 
 value={newOS.title} 
 onChange={e => setNewOS({...newOS, title: e.target.value})} 
 placeholder="Ex: Rompimento na Rua A" 
 className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Prioridade</label>
 <select 
 value={newOS.priority} 
 onChange={e => setNewOS({...newOS, priority: e.target.value})} 
 className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
 >
 <option value="normal">Normal</option>
 <option value="alta">Alta / Urgente</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Descrição</label>
 <textarea 
 value={newOS.description} 
 onChange={e => setNewOS({...newOS, description: e.target.value})} 
 placeholder="Detalhes do problema..." 
 className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-24 resize-none"
 ></textarea>
 </div>
 </div>
 <div className="p-4 bg-background border-t border-border flex justify-end gap-3">
 <button 
 onClick={() => setIsModalOpen(false)} 
 className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-slate-200 dark:hover:bg-muted rounded-xl transition-colors"
 >
 Cancelar
 </button>
 <button 
 onClick={async () => {
 if(!newOS.title) return;
 setIsSaving(true);
 try {
 const res = await fetch('/api/v1/helpdesk/tickets', {
 method: 'POST',
 headers: {'Content-Type': 'application/json'},
 body: JSON.stringify({
 title: newOS.title,
 description: newOS.description,
 priority: newOS.priority,
 source: 'manual'
 })
 });
 if(res.ok) {
 setIsModalOpen(false);
 setNewOS({title: '', priority: 'normal', description: ''});
 // Refresh tickets
 const ref = await fetch('/api/v1/helpdesk/tickets');
 const data = await ref.json();
 const realTickets = (data.tickets || []).map((t: any) => ({
 id: t.external_id || t.id?.toString(),
 title: t.title,
 status: t.status,
 priority: t.priority,
 source: t.source || 'manual',
 date: new Date(t.created_at).toLocaleDateString('pt-BR')
 }));
 // Update UI hack since we don't export the full fetch func easily
 // We'll just trigger a reload or update state manually.
 setTickets(realTickets);
 }
 } catch(e) {}
 setIsSaving(false);
 }} 
 disabled={isSaving || !newOS.title}
 className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
 >
 {isSaving ? <Activity size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
 {isSaving ? 'Salvando...' : 'Criar OS / Ticket'}
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );

}
