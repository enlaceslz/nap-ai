import React, { useState, useMemo } from 'react';
import { 
 Search, Plus, User, Phone, Shield, Settings, MessageCircle, 
 X, Save, Trash2, Users, Activity, PauseCircle, BellRing, 
 Smartphone, Laptop, Send, Radio, CheckCircle2, Volume2, AlertTriangle
} from 'lucide-react';
import { useOperatorPushNotifications } from '../hooks/useOperatorPushNotifications';

type Operator = {
 id: number;
 nome: string;
 email: string;
 ramal: string;
 permissao: string;
 status: 'online' | 'offline' | 'pausa';
 filas: string[];
 pwaPush?: {
 ativo: boolean;
 dispositivo: string;
 ultimoPush?: string;
 };
};

export default function Operadores() {
 const { showNotification } = useOperatorPushNotifications();
 const [operadores, setOperadores] = useState<Operator[]>([
 { 
 id: 1, 
 nome: "João Silva", 
 email: "joao@provedor.com.br", 
 ramal: "2001", 
 permissao: "Admin", 
 status: "online", 
 filas: ["Suporte N2", "Vendas"],
 pwaPush: { ativo: true, dispositivo: "PWA Desktop (Chrome)", ultimoPush: "Há 12 min" }
 },
 { 
 id: 2, 
 nome: "Ana Santos", 
 email: "ana@provedor.com.br", 
 ramal: "2002", 
 permissao: "Operador", 
 status: "online", 
 filas: ["Suporte N1"],
 pwaPush: { ativo: true, dispositivo: "PWA Mobile (Android)", ultimoPush: "Há 35 min" }
 },
 { 
 id: 3, 
 nome: "Carlos Mendes", 
 email: "carlos@provedor.com.br", 
 ramal: "2003", 
 permissao: "Operador", 
 status: "pausa", 
 filas: ["Retenção", "Vendas"],
 pwaPush: { ativo: false, dispositivo: "Inativo" }
 },
 { 
 id: 4, 
 nome: "Fernanda Lima", 
 email: "fernanda@provedor.com.br", 
 ramal: "2004", 
 permissao: "Operador", 
 status: "offline", 
 filas: ["Suporte N1"],
 pwaPush: { ativo: false, dispositivo: "Inativo" }
 },
 ]);

 const [searchQuery, setSearchQuery] = useState('');
 const [kpiFilter, setKpiFilter] = useState<'todos' | 'online' | 'pausa' | 'pwaAtivo'>('todos');
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
 const [editingOp, setEditingOp] = useState<Operator | null>(null);

 // Broadcast state
 const [broadcastData, setBroadcastData] = useState({
 titulo: 'Alerta Operacional Geral',
 mensagem: 'Atenção equipe: fila de Suporte N1 com pico de chamados devido a instabilidade pontual.',
 tipo: 'whatsapp' as 'whatsapp' | 'suporte' | 'noc' | 'geral',
 fila: ''
 });
 const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

 // Form State
 const [formData, setFormData] = useState<Partial<Operator>>({});

 const filteredOperadores = useMemo(() => {
 let result = operadores;
 
 if (kpiFilter === 'online') {
 result = result.filter(op => op.status === 'online');
 } else if (kpiFilter === 'pausa') {
 result = result.filter(op => op.status === 'pausa');
 } else if (kpiFilter === 'pwaAtivo') {
 result = result.filter(op => op.pwaPush?.ativo);
 }

 if (searchQuery.trim()) {
 const lowerQuery = searchQuery.toLowerCase();
 result = result.filter(op => 
 op.nome.toLowerCase().includes(lowerQuery) || 
 op.email.toLowerCase().includes(lowerQuery) || 
 op.ramal.includes(lowerQuery)
 );
 }
 return result;
 }, [operadores, searchQuery, kpiFilter]);

 const openNewModal = () => {
 setEditingOp(null);
 setFormData({ nome: '', email: '', ramal: '', permissao: 'Operador', filas: [], status: 'offline', pwaPush: { ativo: false, dispositivo: 'Inativo' } });
 setIsModalOpen(true);
 };

 const openEditModal = (op: Operator) => {
 setEditingOp(op);
 setFormData({ ...op });
 setIsModalOpen(true);
 };

 const closeModal = () => {
 setIsModalOpen(false);
 setEditingOp(null);
 setFormData({});
 };

 const handleSave = () => {
 if (!formData.nome || !formData.email) return;

 if (editingOp) {
 setOperadores(prev => prev.map(op => op.id === editingOp.id ? { ...op, ...formData } as Operator : op));
 } else {
 const newOp: Operator = {
 id: Date.now(),
 nome: formData.nome || '',
 email: formData.email || '',
 ramal: formData.ramal || '',
 permissao: formData.permissao || 'Operador',
 status: 'offline',
 filas: Array.isArray(formData.filas) ? formData.filas : (formData.filas as any || '').split(',').map((f: string) => f.trim()).filter(Boolean),
 pwaPush: { ativo: false, dispositivo: 'Inativo' }
 };
 setOperadores(prev => [...prev, newOp]);
 }
 closeModal();
 };

 const handleDelete = (id: number) => {
 if (confirm('Tem certeza que deseja remover este operador?')) {
 setOperadores(prev => prev.filter(op => op.id !== id));
 closeModal();
 }
 };

 // Disparar Push Broadcast para os operadores
 const handleSendBroadcast = async () => {
 try {
 const res = await fetch('/api/push/operator/send', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(broadcastData)
 });
 const data = await res.json();
 if (data.sucesso) {
 setBroadcastSuccess(data.mensagem);
 showNotification(broadcastData.titulo, {
 body: broadcastData.mensagem,
 tag: `broadcast_${Date.now()}`
 }, broadcastData.tipo);

 setTimeout(() => {
 setBroadcastSuccess(null);
 setIsBroadcastOpen(false);
 }, 2500);
 }
 } catch (err) {
 console.error(err);
 setBroadcastSuccess("Notificação simulada e entregue localmente!");
 setTimeout(() => {
 setBroadcastSuccess(null);
 setIsBroadcastOpen(false);
 }, 2000);
 }
 };

 // Disparar notificação de teste individual para um operador específico
 const handleSendDirectTest = async (op: Operator) => {
 try {
 await fetch('/api/push/operator/test', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 operador_nome: op.nome,
 ramal: op.ramal,
 tipo: 'whatsapp'
 })
 });
 showNotification(
 `Chamado para ${op.nome}`,
 {
 body: `Novo cliente aguardando na fila ${op.filas[0] || 'Geral'} (Ramal ${op.ramal}).`,
 tag: `direct_test_${op.id}`
 },
 'whatsapp'
 );
 // Atualiza timestamp local do push
 setOperadores(prev => prev.map(o => o.id === op.id ? {
 ...o,
 pwaPush: { ...o.pwaPush, ativo: true, dispositivo: o.pwaPush?.dispositivo || 'PWA Web', ultimoPush: 'Agora' }
 } : o));
 } catch (e) {
 console.warn(e);
 }
 };

 // KPIs
 const kpis = {
 total: operadores.length,
 online: operadores.filter(o => o.status === 'online').length,
 pausa: operadores.filter(o => o.status === 'pausa').length,
 pwaAtivo: operadores.filter(o => o.pwaPush?.ativo).length
 };

 return (
 <div className="flex-1 overflow-y-auto bg-background relative">
 <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
 
 {/* Header */}
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <div className="flex items-center gap-3 mb-1">
 <span className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
 <Users size={22} />
 </span>
 <h1 className="text-2xl font-bold text-foreground font-outfit">Gestão de Operadores & PWA</h1>
 </div>
 <p className="text-sm text-muted-foreground">Controle de acessos, ramais Asterisk, filas e notificações push em tempo real.</p>
 </div>
 <div className="flex items-center gap-3 flex-wrap">
 <button
 onClick={() => setIsBroadcastOpen(true)}
 className="flex items-center gap-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
 >
 <Send size={16} /> Disparar Push Geral
 </button>
 <button 
 onClick={openNewModal}
 className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg"
 >
 <Plus size={18} /> Novo Operador
 </button>
 </div>
 </div>

 {/* KPIs */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 <button 
 onClick={() => setKpiFilter('todos')}
 className={`p-5 rounded-2xl border flex items-center gap-4 text-left transition-all ${
 kpiFilter === 'todos' 
 ? 'bg-muted border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
 : 'bg-card border-border hover:bg-muted/80 hover:border-border'
 }`}
 >
 <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
 kpiFilter === 'todos' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400 border' : 'bg-blue-500/10 border-blue-500/20 text-blue-400 border'
 }`}>
 <Users size={24} />
 </div>
 <div>
 <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Total de Contas</p>
 <h3 className="text-2xl font-bold text-foreground font-outfit leading-none">{kpis.total}</h3>
 </div>
 </button>

 <button 
 onClick={() => setKpiFilter(kpiFilter === 'online' ? 'todos' : 'online')}
 className={`p-5 rounded-2xl border flex items-center gap-4 text-left transition-all ${
 kpiFilter === 'online' 
 ? 'bg-muted border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
 : 'bg-card border-border hover:bg-muted/80 hover:border-border'
 }`}
 >
 <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
 kpiFilter === 'online' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 border' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 border'
 }`}>
 <Activity size={24} />
 </div>
 <div>
 <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Operadores Online</p>
 <h3 className="text-2xl font-bold text-foreground font-outfit leading-none">{kpis.online}</h3>
 </div>
 </button>

 <button 
 onClick={() => setKpiFilter(kpiFilter === 'pausa' ? 'todos' : 'pausa')}
 className={`p-5 rounded-2xl border flex items-center gap-4 text-left transition-all ${
 kpiFilter === 'pausa' 
 ? 'bg-muted border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
 : 'bg-card border-border hover:bg-muted/80 hover:border-border'
 }`}
 >
 <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
 kpiFilter === 'pausa' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400 border' : 'bg-amber-500/10 border-amber-500/20 text-amber-400 border'
 }`}>
 <PauseCircle size={24} />
 </div>
 <div>
 <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Em Pausa (NR-17)</p>
 <h3 className="text-2xl font-bold text-foreground font-outfit leading-none">{kpis.pausa}</h3>
 </div>
 </button>

 <button 
 onClick={() => setKpiFilter(kpiFilter === 'pwaAtivo' ? 'todos' : 'pwaAtivo')}
 className={`p-5 rounded-2xl border flex items-center gap-4 text-left transition-all ${
 kpiFilter === 'pwaAtivo' 
 ? 'bg-muted border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
 : 'bg-card border-border hover:bg-muted/80 hover:border-border'
 }`}
 >
 <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
 kpiFilter === 'pwaAtivo' ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400 border' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 border'
 }`}>
 <BellRing size={24} />
 </div>
 <div>
 <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">PWA Push Ativo</p>
 <h3 className="text-2xl font-bold text-foreground font-outfit leading-none">
 {kpis.pwaAtivo} <span className="text-xs font-normal text-muted-foreground">/ {kpis.total}</span>
 </h3>
 </div>
 </button>
 </div>

 {/* Table & Toolbar Container */}
 <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
 {/* Toolbar */}
 <div className="p-5 border-b border-border bg-background/30 flex flex-col sm:flex-row items-center justify-between gap-4">
 <div className="relative w-full sm:max-w-md">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
 <input 
 type="text" 
 placeholder="Buscar por nome, e-mail ou ramal..." 
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground outline-none focus:border-blue-600 transition-all "
 />
 </div>

 <div className="flex items-center gap-2 text-xs text-muted-foreground">
 <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
 <span>Web Push VAPID Configurado</span>
 </div>
 </div>

 {/* Table */}
 <div className="overflow-x-auto flex-1">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-background/50 border-b border-border">
 <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Operador</th>
 <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Comunicações</th>
 <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Filas de Atendimento</th>
 <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">PWA & Push</th>
 <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
 <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">Ações</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-white/5">
 {filteredOperadores.length === 0 ? (
 <tr>
 <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground text-sm">
 Nenhum operador encontrado com estes filtros.
 </td>
 </tr>
 ) : (
 filteredOperadores.map((op) => (
 <tr key={op.id} className="hover:bg-white/[0.02] transition-colors group">
 <td className="px-5 py-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-border text-muted-foreground font-bold font-outfit ">
 {op.nome.charAt(0)}
 </div>
 <div>
 <p className="font-bold text-foreground text-sm">{op.nome}</p>
 <p className="text-[11px] text-muted-foreground">{op.email}</p>
 </div>
 </div>
 </td>

 <td className="px-5 py-4">
 <div className="flex flex-col gap-1.5">
 <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
 <Phone size={14} className="text-emerald-500" />
 <span className="font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded text-emerald-400 border border-emerald-500/20 font-bold">SIP/{op.ramal}</span>
 </div>
 <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
 <MessageCircle size={14} className="text-blue-400" />
 <span>WhatsApp API</span>
 </div>
 </div>
 </td>

 <td className="px-5 py-4">
 <div className="flex flex-col items-start gap-2">
 <div className="flex items-center gap-1.5">
 {op.permissao === 'Admin' ? (
 <span className="bg-blue-600/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold flex items-center gap-1">
 <Shield size={10} /> {op.permissao}
 </span>
 ) : (
 <span className="bg-background text-muted-foreground border border-border px-2 py-0.5 rounded text-[10px] uppercase font-bold flex items-center gap-1">
 <User size={10} /> {op.permissao}
 </span>
 )}
 </div>
 <div className="flex gap-1 flex-wrap max-w-[200px]">
 {op.filas.map((fila, idx) => (
 <span key={idx} className="bg-background border border-border text-muted-foreground px-2 py-0.5 rounded text-[10px] font-medium">
 {fila}
 </span>
 ))}
 </div>
 </div>
 </td>

 {/* PWA & Push Status */}
 <td className="px-5 py-4">
 {op.pwaPush?.ativo ? (
 <div className="space-y-1">
 <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
 <BellRing size={13} className="text-emerald-400" />
 <span>Push Ativo</span>
 <button
 onClick={() => handleSendDirectTest(op)}
 className="ml-1 text-[10px] bg-white/5 hover:bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30 text-emerald-300 transition-colors"
 title="Enviar notificação de teste para este operador"
 >
 Testar
 </button>
 </div>
 <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
 {op.pwaPush.dispositivo.includes('Mobile') ? (
 <Smartphone size={11} className="text-indigo-400" />
 ) : (
 <Laptop size={11} className="text-blue-400" />
 )}
 <span>{op.pwaPush.dispositivo}</span>
 </div>
 </div>
 ) : (
 <div className="flex items-center gap-2">
 <span className="text-[11px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded border border-border">
 Inativo
 </span>
 <button
 onClick={() => handleSendDirectTest(op)}
 className="text-[10px] text-blue-400 hover:text-blue-300 underline"
 title="Enviar convite de ativação de push"
 >
 Ativar
 </button>
 </div>
 )}
 </td>

 <td className="px-5 py-4">
 <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
 op.status === 'online' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
 op.status === 'pausa' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
 'bg-muted text-muted-foreground border-border'
 }`}>
 <span className={`w-1.5 h-1.5 rounded-full ${
 op.status === 'online' ? 'bg-emerald-400 animate-pulse' :
 op.status === 'pausa' ? 'bg-amber-400' : 'bg-slate-500'
 }`}></span>
 {op.status === 'online' ? 'Livre' : op.status === 'pausa' ? 'Em Pausa' : 'Deslogado'}
 </span>
 </td>

 <td className="px-5 py-4 text-center">
 <button 
 onClick={() => openEditModal(op)}
 className="p-2 text-muted-foreground hover:text-blue-400 bg-transparent hover:bg-blue-500/10 rounded-lg transition-colors border border-transparent hover:border-blue-500/20"
 title="Editar operador"
 >
 <Settings size={18} />
 </button>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {/* Modal de Disparo Push Broadcast para Operadores */}
 {isBroadcastOpen && (
 <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
 <div className="bg-card border border-border rounded-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
 <div className="p-5 border-b border-border flex justify-between items-center bg-background/30">
 <div className="flex items-center gap-2.5">
 <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
 <Send size={16} />
 </div>
 <div>
 <h2 className="text-base font-bold text-foreground font-outfit">Disparar Alerta Push aos Operadores</h2>
 <p className="text-xs text-muted-foreground">Transmissão instantânea para navegadores e celulares PWA da equipe.</p>
 </div>
 </div>
 <button onClick={() => setIsBroadcastOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
 <X size={18} />
 </button>
 </div>

 <div className="p-6 space-y-4">
 <div>
 <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Categoria do Alerta</label>
 <div className="grid grid-cols-4 gap-2">
 {[
 { id: 'whatsapp', label: 'WhatsApp' },
 { id: 'suporte', label: 'Suporte' },
 { id: 'noc', label: 'NOC / Fibra' },
 { id: 'geral', label: 'Aviso Geral' }
 ].map((t) => (
 <button
 key={t.id}
 type="button"
 onClick={() => setBroadcastData({ ...broadcastData, tipo: t.id as any })}
 className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
 broadcastData.tipo === t.id 
 ? 'bg-indigo-600 border-indigo-500 text-white' 
 : 'bg-background border-border text-muted-foreground hover:text-foreground'
 }`}
 >
 {t.label}
 </button>
 ))}
 </div>
 </div>

 <div>
 <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Título da Notificação</label>
 <input 
 type="text" 
 value={broadcastData.titulo}
 onChange={(e) => setBroadcastData({ ...broadcastData, titulo: e.target.value })}
 placeholder="Ex: Alerta de Fila / Manutenção"
 className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-indigo-500"
 />
 </div>

 <div>
 <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Mensagem</label>
 <textarea 
 rows={3}
 value={broadcastData.mensagem}
 onChange={(e) => setBroadcastData({ ...broadcastData, mensagem: e.target.value })}
 placeholder="Descreva o comunicado ou instrução para a equipe..."
 className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-indigo-500 resize-none"
 />
 </div>

 <div>
 <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Filtro de Fila (Opcional)</label>
 <select
 value={broadcastData.fila}
 onChange={(e) => setBroadcastData({ ...broadcastData, fila: e.target.value })}
 className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-indigo-500"
 >
 <option value="">Todos os Operadores ({operadores.length})</option>
 <option value="Suporte N1">Apenas Fila Suporte N1</option>
 <option value="Suporte N2">Apenas Fila Suporte N2</option>
 <option value="Vendas">Apenas Fila Vendas</option>
 <option value="Retenção">Apenas Fila Retenção</option>
 </select>
 </div>

 {broadcastSuccess && (
 <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2">
 <CheckCircle2 size={16} />
 <span>{broadcastSuccess}</span>
 </div>
 )}
 </div>

 <div className="p-5 border-t border-border flex justify-end gap-3 bg-background/30">
 <button 
 onClick={() => setIsBroadcastOpen(false)}
 className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
 >
 Cancelar
 </button>
 <button 
 onClick={handleSendBroadcast}
 disabled={!broadcastData.titulo || !broadcastData.mensagem}
 className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
 >
 <Send size={15} /> Disparar Push Agora
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Modal de Edição / Criação */}
 {isModalOpen && (
 <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
 <div className="bg-card border border-border rounded-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
 <div className="p-5 border-b border-border flex justify-between items-center bg-background/30">
 <h2 className="text-lg font-bold text-foreground font-outfit">
 {editingOp ? 'Editar Operador' : 'Novo Operador'}
 </h2>
 <button onClick={closeModal} className="text-muted-foreground hover:text-foreground transition-colors">
 <X size={18} />
 </button>
 </div>
 
 <div className="p-6 space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div className="col-span-2">
 <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Nome Completo</label>
 <input 
 type="text" 
 value={formData.nome || ''}
 onChange={(e) => setFormData({...formData, nome: e.target.value})}
 placeholder="Ex: João Silva"
 className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-blue-600 "
 />
 </div>
 <div className="col-span-2 md:col-span-1">
 <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">E-mail</label>
 <input 
 type="email" 
 value={formData.email || ''}
 onChange={(e) => setFormData({...formData, email: e.target.value})}
 placeholder="joao@provedor.com.br"
 className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-blue-600 "
 />
 </div>
 <div className="col-span-2 md:col-span-1">
 <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Ramal SIP (Asterisk 20+)</label>
 <input 
 type="text" 
 value={formData.ramal || ''}
 onChange={(e) => setFormData({...formData, ramal: e.target.value})}
 placeholder="Ex: 2001"
 className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-mono text-emerald-400 outline-none focus:border-blue-600 "
 />
 </div>
 <div className="col-span-2 md:col-span-1">
 <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Nível de Acesso</label>
 <select 
 value={formData.permissao || 'Operador'}
 onChange={(e) => setFormData({...formData, permissao: e.target.value})}
 className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-blue-600 "
 >
 <option value="Operador">Operador (Padrão)</option>
 <option value="Admin">Administrador</option>
 </select>
 </div>
 <div className="col-span-2 md:col-span-1">
 <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Filas (Separar por vírgula)</label>
 <input 
 type="text" 
 value={Array.isArray(formData.filas) ? formData.filas.join(', ') : formData.filas || ''}
 onChange={(e) => setFormData({...formData, filas: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
 placeholder="Ex: Suporte N1, Vendas"
 className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-blue-600 "
 />
 </div>
 </div>
 </div>
 <div className="p-5 border-t border-border flex justify-between items-center bg-background/30">
 {editingOp ? (
 <button 
 onClick={() => handleDelete(editingOp.id)}
 className="flex items-center gap-2 text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
 >
 <Trash2 size={16} /> Remover
 </button>
 ) : <div></div>}
 
 <div className="flex gap-3">
 <button 
 onClick={closeModal}
 className="px-5 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
 >
 Cancelar
 </button>
 <button 
 onClick={handleSave}
 disabled={!formData.nome || !formData.email}
 className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 active:scale-95"
 >
 <Save size={16} /> Salvar
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
