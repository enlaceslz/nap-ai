import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
 Search, 
 UserPlus, 
 RefreshCw, 
 Filter, 
 MoreHorizontal, 
 CheckCircle2, 
 XCircle, 
 X, 
 Activity, 
 FileText, 
 Trello, 
 Zap, 
 Phone, 
 Server, 
 Sparkles, 
 Send, 
 CreditCard, 
 ChevronRight, 
 MapPin, 
 Share2, 
 Compass,
 Users,
 ShieldCheck,
 TrendingUp,
 DollarSign,
 AlertTriangle
} from 'lucide-react';
import type { Contato } from '../types';
import SgpAdvancedSearch from '../components/SgpAdvancedSearch';
import AddressMapModal from '../components/AddressMapModal';

export default function CRM() {
 const [searchParams] = useSearchParams();
 const initialSearch = searchParams.get('search') || '';

 const [contatos, setContatos] = useState<Contato[]>([]);
 const [toastMsg, setToastMsg] = useState<string | null>(null);
 const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };
 const [loading, setLoading] = useState(true);
 const [selectedContato, setSelectedContato] = useState<Contato | null>(null);
 
 // Controle de visão: Tabela de Clientes vs. Consulta Avançada SGP
 const [crmView, setCrmView] = useState<'tabela' | 'consulta_avancada_sgp'>('tabela');
 const [sgpTargetId, setSgpTargetId] = useState<number | string>(1001);
 const [searchTerm, setSearchTerm] = useState(initialSearch);
 const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'bloqueado'>('all');

 useEffect(() => {
 const query = searchParams.get('search');
 if (query) {
 setSearchTerm(query);
 }
 }, [searchParams]);

 // Modal de Mapa / Busca CEP / Compartilhar WhatsApp com Técnico
 const [mapTargetCliente, setMapTargetCliente] = useState<Contato | null>(null);

 const fetchContatos = () => {
 setLoading(true);
 fetch('/api/contatos')
 .then(res => res.json())
 .then(data => {
 setContatos(Array.isArray(data) ? data : (data?.contatos || []));
 setLoading(false);
 })
 .catch(() => setLoading(false));
 };

 const handleSyncSgp = () => {
 setLoading(true);
 showToast("Iniciando sincronização com ERP SGP...");
 fetch('/api/contatos/sync', { method: 'POST' })
 .then(res => res.json())
 .then(data => {
 if (data.success) {
 showToast(`Sincronização concluída: ${data.count} clientes importados.`);
 fetchContatos();
 } else {
 showToast("Erro ao sincronizar com ERP.");
 setLoading(false);
 }
 })
 .catch(() => {
 showToast("Falha de conexão durante a sincronização.");
 setLoading(false);
 });
 };

 useEffect(() => {
 fetchContatos();
 }, []);

 const handleOpenSgpConsulta = (idOrCpf: number | string) => {
 setSgpTargetId(idOrCpf);
 setCrmView('consulta_avancada_sgp');
 };

 const getInitials = (name: string) => {
 if (!name) return 'CL';
 if (typeof name !== 'string') return 'CL';
 const clean = name.trim().replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
 const parts = clean.split(/\s+/);
 if (parts.length === 1) return (parts[0] ? parts[0].substring(0, 2).toUpperCase() : 'CL');
 return ((parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '')).toUpperCase() || 'CL';
 };

 const filteredContatos = useMemo(() => {
 return contatos.filter(c => {
 const matchesSearch = !searchTerm.trim() || 
 c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
 c.cpf_cnpj.includes(searchTerm) ||
 c.telefone.includes(searchTerm) ||
 String(c.id).includes(searchTerm);

 const matchesStatus = statusFilter === 'all' || c.status_cliente === statusFilter;

 return matchesSearch && matchesStatus;
 });
 }, [contatos, searchTerm, statusFilter]);

 // Métricas Digify CRM
 const metrics = useMemo(() => {
 const total = contatos.length;
 const ativos = contatos.filter(c => c.status_cliente === 'ativo').length;
 const bloqueados = contatos.filter(c => c.status_cliente === 'bloqueado').length;
 const taxaAtivos = total > 0 ? Math.round((ativos / total) * 100) : 0;
 return { total, ativos, bloqueados, taxaAtivos };
 }, [contatos]);

 return (
 <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-foreground font-sans relative">
 
 {/* Top Header estilo Digify */}
 <div className="p-5 border-b border-border bg-card/95 backdrop-blur-md shrink-0 space-y-3.5 z-10">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
 <div>
 <div className="flex items-center gap-2">
 <h1 className="text-xl font-extrabold text-foreground">Base de Clientes (CRM 360)</h1>
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0a50ff]/15 text-[#55b0ff] border border-[#0a50ff]/30">
 Sincronizado SGP
 </span>
 {toastMsg && (
 <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-white px-4 py-3 rounded-2xl shadow-xl font-bold animate-in slide-in-from-bottom-5">
 {toastMsg}
 </div>
 )}
</div>
 <p className="text-xs text-muted-foreground mt-0.5">
 Gestão de assinantes, consulta avançada de faturas e diagnóstico de rede FTTH.
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-2">
 {/* Alternador de visualização */}
 <div className="bg-card p-1 rounded-xl border border-border flex items-center gap-1">
 <button
 onClick={() => setCrmView('tabela')}
 className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
 crmView === 'tabela' 
 ? 'bg-[#0a50ff] text-white shadow-[0_4px_14px_rgba(10,80,255,0.4)]' 
 : 'text-muted-foreground hover:text-foreground'
 }`}
 >
 Lista de Clientes
 </button>
 <button
 onClick={() => setCrmView('consulta_avancada_sgp')}
 className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
 crmView === 'consulta_avancada_sgp' 
 ? 'bg-[#0a50ff] text-white shadow-[0_4px_14px_rgba(10,80,255,0.4)]' 
 : 'text-muted-foreground hover:text-foreground'
 }`}
 >
 <Server size={13} />
 <span>Consulta Avançada SGP</span>
 </button>
 </div>

 <button 
 onClick={handleSyncSgp}
 className="flex items-center gap-2 bg-card hover:bg-muted border border-border text-muted-foreground px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors shadow-xs"
 >
 <RefreshCw size={13} className={loading ? "animate-spin text-[#0a50ff]" : "text-[#55b0ff]"} />
 <span>Sync SGP</span>
 </button>
 </div>
 </div>

 {/* Metric Bar Digify */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
 <button 
 onClick={() => setStatusFilter('all')}
 className={`text-left rounded-xl px-3.5 py-2 flex items-center gap-3 transition-all ${
 statusFilter === 'all' 
 ? 'bg-muted border border-[#0a50ff]/50 shadow-[0_0_15px_rgba(10,80,255,0.1)]' 
 : 'bg-card/80 border border-border hover:bg-muted/80'
 }`}
 >
 <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
 statusFilter === 'all' ? 'bg-[#0a50ff]/20 border border-[#0a50ff]/40 text-[#55b0ff]' : 'bg-[#0a50ff]/15 border border-[#0a50ff]/30 text-[#55b0ff]'
 }`}>
 <Users size={15} />
 </div>
 <div>
 <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total de Assinantes</p>
 <p className="text-sm font-extrabold text-foreground">{metrics.total} cadastrados</p>
 </div>
 </button>

 <button 
 onClick={() => setStatusFilter(statusFilter === 'ativo' ? 'all' : 'ativo')}
 className={`text-left rounded-xl px-3.5 py-2 flex items-center gap-3 transition-all ${
 statusFilter === 'ativo' 
 ? 'bg-muted border border-[#22c55e]/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
 : 'bg-card/80 border border-border hover:bg-muted/80'
 }`}
 >
 <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
 statusFilter === 'ativo' ? 'bg-[#22c55e]/20 border border-[#22c55e]/40 text-[#22c55e]' : 'bg-[#22c55e]/15 border border-[#22c55e]/30 text-[#22c55e]'
 }`}>
 <CheckCircle2 size={15} />
 </div>
 <div>
 <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Clientes Ativos</p>
 <p className="text-sm font-extrabold text-[#22c55e]">{metrics.ativos} ({metrics.taxaAtivos}%)</p>
 </div>
 </button>

 <button 
 onClick={() => setStatusFilter(statusFilter === 'bloqueado' ? 'all' : 'bloqueado')}
 className={`text-left rounded-xl px-3.5 py-2 flex items-center gap-3 transition-all ${
 statusFilter === 'bloqueado' 
 ? 'bg-muted border border-[#ff5c7a]/50 shadow-[0_0_15px_rgba(255,92,122,0.1)]' 
 : 'bg-card/80 border border-border hover:bg-muted/80'
 }`}
 >
 <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
 statusFilter === 'bloqueado' ? 'bg-[#ff5c7a]/20 border border-[#ff5c7a]/40 text-[#ff5c7a]' : 'bg-[#ff5c7a]/15 border border-[#ff5c7a]/30 text-[#ff5c7a]'
 }`}>
 <AlertTriangle size={15} />
 </div>
 <div>
 <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Bloqueados / Débito</p>
 <p className="text-sm font-extrabold text-[#ff5c7a]">{metrics.bloqueados} clientes</p>
 </div>
 </button>

 <div className="bg-card/80 border border-border rounded-xl px-3.5 py-2 flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-[#ffb21a]/15 border border-[#ffb21a]/30 flex items-center justify-center shrink-0">
 <CreditCard size={15} className="text-[#ffb21a]" />
 </div>
 <div>
 <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Desbloqueio Ativo</p>
 <p className="text-sm font-extrabold text-[#ffb21a]">Regra de 24 Horas</p>
 </div>
 </div>
 </div>

 </div>

 <div className="p-4 sm:p-5 flex-1 overflow-y-auto crm-kanban-scroll">
 {crmView === 'consulta_avancada_sgp' ? (
 <div className="space-y-4 max-w-5xl mx-auto">
 <div className="flex items-center justify-between">
 <button
 onClick={() => setCrmView('tabela')}
 className="text-xs font-bold text-[#55b0ff] hover:underline flex items-center gap-1 transition-colors"
 >
 ← Voltar para lista de clientes
 </button>
 <span className="text-xs text-muted-foreground font-mono">
 Módulo SGP ERP v4.2 • Integração Direta
 </span>
 </div>
 <SgpAdvancedSearch 
 initialClienteId={sgpTargetId} 
 onSelectCliente={() => {}} 
 />
 </div>
 ) : (
 <div className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col shadow-sm">
 
 {/* Toolbar com Busca e Filtro de Status */}
 <div className="p-4 border-b border-border bg-card flex flex-wrap gap-3 items-center justify-between">
 <div className="relative flex-1 min-w-[260px] max-w-md">
 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
 <input 
 type="text" 
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 placeholder="Buscar por nome, CPF/CNPJ ou telefone..." 
 className="w-full pl-10 pr-4 py-2 bg-card hover:bg-muted border border-border rounded-xl text-xs text-foreground outline-none focus:border-[#0a50ff] focus:ring-1 focus:ring-[#0a50ff] placeholder:text-muted-foreground transition-all"
 />
 </div>

 {/* Status Filter Tabs */}
 <div className="flex items-center gap-1 bg-card p-0.5 rounded-xl border border-border text-xs">
 <button
 onClick={() => setStatusFilter('all')}
 className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
 statusFilter === 'all' 
 ? 'bg-muted text-foreground shadow-xs' 
 : 'text-muted-foreground hover:text-card-foreground'
 }`}
 >
 Todos ({contatos.length})
 </button>
 <button
 onClick={() => setStatusFilter('ativo')}
 className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
 statusFilter === 'ativo' 
 ? 'bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30' 
 : 'text-muted-foreground hover:text-card-foreground'
 }`}
 >
 <CheckCircle2 size={11} /> Ativos
 </button>
 <button
 onClick={() => setStatusFilter('bloqueado')}
 className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
 statusFilter === 'bloqueado' 
 ? 'bg-[#ff5c7a]/20 text-[#ff5c7a] border border-[#ff5c7a]/30' 
 : 'text-muted-foreground hover:text-card-foreground'
 }`}
 >
 <XCircle size={11} /> Bloqueados
 </button>
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs text-muted-foreground">
 <thead className="bg-background text-muted-foreground font-bold uppercase tracking-wider text-[10px] border-b border-border">
 <tr>
 <th className="px-5 py-3.5">ID SGP</th>
 <th className="px-5 py-3.5">Assinante / Razão Social</th>
 <th className="px-5 py-3.5">CPF / CNPJ</th>
 <th className="px-5 py-3.5">WhatsApp / Telefone</th>
 <th className="px-5 py-3.5">Endereço & Rota</th>
 <th className="px-5 py-3.5">Plano FTTH</th>
 <th className="px-5 py-3.5">Status</th>
 <th className="px-5 py-3.5 text-center">Ações SGP</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-800/60 bg-card">
 {loading ? (
 <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">Sincronizando clientes com o SGP ERP...</td></tr>
 ) : filteredContatos.length === 0 ? (
 <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">Nenhum assinante encontrado para o filtro atual.</td></tr>
 ) : (
 filteredContatos.map((contato) => (
 <tr 
 key={contato.id} 
 className="hover:bg-muted transition-colors group cursor-pointer"
 >
 <td 
 onClick={() => setSelectedContato(contato)}
 className="px-5 py-3.5 font-bold font-mono text-[#55b0ff]"
 >
 #{contato.id}
 </td>
 <td 
 onClick={() => setSelectedContato(contato)}
 className="px-5 py-3.5"
 >
 <div className="flex items-center gap-2.5">
 <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0a50ff] to-[#55b0ff] flex items-center justify-center text-[10px] font-extrabold text-foreground shrink-0">
 {getInitials(contato.nome)}
 </div>
 <span className="font-bold text-foreground group-hover:text-[#55b0ff] transition-colors">
 {contato.nome}
 </span>
 </div>
 </td>
 <td 
 onClick={() => setSelectedContato(contato)}
 className="px-5 py-3.5 font-mono text-muted-foreground text-[11px]"
 >
 {contato.cpf_cnpj}
 </td>
 <td 
 onClick={() => setSelectedContato(contato)}
 className="px-5 py-3.5 font-mono text-muted-foreground text-[11px]"
 >
 {contato.telefone}
 </td>
 <td className="px-5 py-3.5">
 <div className="flex items-center gap-2">
 <div className="max-w-[180px] truncate">
 <p className="text-card-foreground truncate" title={contato.endereco || 'Endereço não informado'}>
 {contato.endereco || 'Endereço a confirmar'}
 </p>
 {contato.cep && (
 <p className="text-[10px] text-muted-foreground font-mono">
 CEP: {contato.cep}
 </p>
 )}
 </div>
 <div className="flex items-center gap-1 shrink-0">
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 setMapTargetCliente(contato);
 }}
 className="p-1 rounded-lg bg-[#0a50ff]/10 hover:bg-[#0a50ff]/20 text-[#55b0ff] border border-[#0a50ff]/20 transition-colors"
 title="Ver no Mapa / Rota do Técnico"
 >
 <MapPin size={12} />
 </button>
 </div>
 </div>
 </td>
 <td 
 onClick={() => setSelectedContato(contato)}
 className="px-5 py-3.5"
 >
 <span className="bg-muted border border-border text-card-foreground px-2 py-0.5 rounded-md text-[10px] font-bold">
 {contato.plano || 'Fibra 500MB'}
 </span>
 </td>
 <td 
 onClick={() => setSelectedContato(contato)}
 className="px-5 py-3.5"
 >
 {contato.status_cliente === 'ativo' ? (
 <div className="flex items-center gap-1.5 text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/30 px-2 py-0.5 rounded-md text-[10px] font-bold w-max">
 <CheckCircle2 size={12} /> Ativo
 </div>
 ) : (
 <div className="flex items-center gap-1.5 text-[#ff5c7a] bg-[#ff5c7a]/10 border border-[#ff5c7a]/30 px-2 py-0.5 rounded-md text-[10px] font-bold w-max">
 <XCircle size={12} /> Bloqueado
 </div>
 )}
 </td>
 <td className="px-5 py-3.5 text-center">
 <div className="flex items-center justify-center gap-1.5">
 <button 
 onClick={() => handleOpenSgpConsulta(contato.id)}
 className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0a50ff] hover:bg-[#0842cc] text-white rounded-lg text-[11px] font-bold transition-all shadow-xs"
 title="Abrir Consulta Avançada SGP com Financeiro e Ofertas"
 >
 <Zap size={12} />
 <span>SGP</span>
 </button>
 <button 
 onClick={() => setSelectedContato(contato)}
 className="px-2 py-1 bg-card hover:bg-muted text-muted-foreground border border-border rounded-lg text-[11px] font-semibold transition-colors"
 title="Ver ficha 360"
 >
 Ficha
 </button>
 </div>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 
 <div className="p-3.5 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground font-medium">
 <span>Exibindo {filteredContatos.length} de {contatos.length} assinantes cadastrados</span>
 <div className="flex gap-2">
 <button className="px-3 py-1 bg-card border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground text-xs">Anterior</button>
 <button className="px-3 py-1 bg-card border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground text-xs">Próxima</button>
 </div>
 </div>
 </div>
 )}
 </div>

 {/* Customer 360 Slide-over Panel estilo Digify */}
 {selectedContato && (
 <>
 <div 
 onClick={() => setSelectedContato(null)} 
 className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40"
 aria-hidden="true"
 />
 <div className="fixed top-0 right-0 h-full w-full sm:max-w-xl bg-card border-l border-border shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-in slide-in-from-right duration-200 flex flex-col z-50 font-sans">
 
 <div className="p-5 border-b border-border bg-card flex justify-between items-start shrink-0">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0a50ff] to-[#55b0ff] flex items-center justify-center text-sm font-extrabold text-foreground">
 {getInitials(selectedContato.nome)}
 </div>
 <div>
 <div className="flex items-center gap-2 mb-0.5">
 <h2 className="text-base font-extrabold text-foreground">{selectedContato.nome}</h2>
 {selectedContato.status_cliente === 'ativo' ? (
 <CheckCircle2 size={16} className="text-[#22c55e]" />
 ) : (
 <XCircle size={16} className="text-[#ff5c7a]" />
 )}
 </div>
 <p className="text-xs text-muted-foreground font-mono flex items-center gap-2">
 <span className="bg-[#0a50ff]/15 px-1.5 py-0.5 rounded text-[#55b0ff] border border-[#0a50ff]/30 text-[10px]">
 ID: #{selectedContato.id}
 </span>
 <span>{selectedContato.cpf_cnpj}</span>
 </p>
 </div>
 </div>

 <div className="flex items-center gap-1.5">
 <button
 onClick={() => setMapTargetCliente(selectedContato)}
 className="px-2.5 py-1.5 bg-[#18c7a8]/15 hover:bg-[#18c7a8]/25 text-[#18c7a8] border border-[#18c7a8]/30 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
 title="Abrir mapa, consultar CEP ou compartilhar rota via WhatsApp com técnico"
 >
 <MapPin size={13} />
 <span className="hidden sm:inline">Mapa</span>
 </button>
 <button 
 onClick={() => setSelectedContato(null)}
 className="p-1.5 hover:bg-accent rounded-xl text-muted-foreground hover:text-foreground transition-colors"
 >
 <X size={18} />
 </button>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-5 space-y-4 crm-kanban-scroll">
 
 {/* Componente Integrado de Consulta Avançada SGP dentro da Ficha 360 */}
 <div className="border border-border rounded-2xl overflow-hidden shadow-sm bg-card">
 <SgpAdvancedSearch 
 initialClienteId={selectedContato.id}
 />
 </div>

 {/* AI Summary Block Digify */}
 <div className="bg-gradient-to-br from-[#0a50ff]/15 to-[#55b0ff]/5 border border-[#0a50ff]/30 rounded-2xl p-4 relative overflow-hidden">
 <div className="flex items-center gap-1.5 text-[#55b0ff] font-bold uppercase tracking-wider mb-2 text-[11px]">
 <Sparkles size={14} />
 Diagnóstico Gemini Copiloto
 </div>
 <p className="text-xs text-card-foreground leading-relaxed">
 Assinante com alta fidelidade (18 meses). Telemetria TR-069 registra sinal de recepção estável. Histórico de pagamento pontual via PIX. Sugestão comercial: oferecer upgrade para Fibra 700MB Gamer Pro com roteador Wi-Fi 6 incluso.
 </p>
 </div>

 {/* Histórico PABX Asterisk */}
 <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
 <h3 className="font-bold text-foreground text-xs flex items-center gap-2">
 <Phone size={14} className="text-[#55b0ff]" /> Chamadas Telefonia PABX (Asterisk 20+)
 </h3>
 <div className="bg-muted border border-border rounded-xl divide-y divide-slate-700">
 <div className="p-3 flex justify-between items-center text-xs">
 <div className="flex gap-2.5 items-center">
 <div className="w-7 h-7 rounded-full bg-[#22c55e]/15 border border-[#22c55e]/30 flex items-center justify-center">
 <Phone size={11} className="text-[#22c55e]" />
 </div>
 <div>
 <p className="font-bold text-foreground">Suporte Técnico N1</p>
 <p className="text-[10px] text-muted-foreground">Atendido por: Lucas Almeida (Ramal 2004)</p>
 </div>
 </div>
 <div className="text-right">
 <p className="text-[10px] font-bold text-muted-foreground">Hoje, 09:30</p>
 <p className="text-[10px] text-muted-foreground font-mono">03m 45s</p>
 </div>
 </div>
 </div>
 </div>

 </div>
 
 <div className="p-4 border-t border-border bg-card flex gap-2.5 shrink-0">
 <a 
 href={`tel:${selectedContato.telefone || ''}`}
 className="flex-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
 title="Ligar via Webphone SIP/Asterisk"
 >
 <Phone size={14} />
 <span>Webphone</span>
 </a>
 <a 
 href={`https://wa.me/55${(selectedContato.telefone || '').replace(/\D/g, '')}`}
 target="_blank"
 rel="noreferrer"
 className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
 >
 <span>WhatsApp</span>
 </a>
 <button 
 onClick={() => {
 handleOpenSgpConsulta(selectedContato.id);
 setSelectedContato(null);
 }}
 className="flex-1 bg-[#0a50ff] hover:bg-[#0842cc] text-white px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-[0_4px_16px_rgba(10,80,255,0.35)] flex items-center justify-center gap-2"
 >
 <Zap size={14} />
 <span>Abrir no SGP</span>
 </button>
 </div>

 </div>
 </>
 )}

 {/* Modal de Mapa, Busca de CEP e Compartilhamento com Técnico */}
 {mapTargetCliente && (
 <AddressMapModal
 isOpen={!!mapTargetCliente}
 onClose={() => setMapTargetCliente(null)}
 cliente={{
 id: mapTargetCliente.id,
 nome: mapTargetCliente.nome,
 telefone: mapTargetCliente.telefone,
 endereco: mapTargetCliente.endereco,
 logradouro: mapTargetCliente.logradouro,
 numero: mapTargetCliente.numero,
 complemento: mapTargetCliente.complemento,
 bairro: mapTargetCliente.bairro,
 cidade: mapTargetCliente.cidade,
 uf: mapTargetCliente.uf,
 cep: mapTargetCliente.cep,
 ponto_referencia: mapTargetCliente.ponto_referencia,
 coordenadas: mapTargetCliente.coordenadas
 }}
 onAddressUpdated={(novo) => {
 setContatos(prev => prev.map(c => c.id === mapTargetCliente.id ? ({
 ...c,
 ...novo,
 id: c.id,
 endereco: novo.endereco || c.endereco
 } as Contato) : c));
 if (selectedContato && selectedContato.id === mapTargetCliente.id) {
 setSelectedContato(prev => prev ? ({
 ...prev,
 ...novo,
 id: prev.id,
 endereco: novo.endereco || prev.endereco
 } as Contato) : null);
 }
 }}
 />
 )}

 </div>
 );
}
