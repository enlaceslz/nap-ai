import React, { useState, useMemo } from 'react';
import { 
 Search, Filter, Calendar, MessageSquare, Download, Eye, 
 Bot, User, Clock, FileText, ChevronRight, X, Phone,
 CheckCircle2, AlertCircle, PieChart, Activity, Users, Zap
} from 'lucide-react';
import { format } from 'date-fns';

export default function HistoricoConversas() {
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedChannel, setSelectedChannel] = useState('todos');
 const [selectedOperator, setSelectedOperator] = useState('todos');
 const [selectedChat, setSelectedChat] = useState<any>(null);
 const [kpiFilter, setKpiFilter] = useState<'todos' | 'resolvidos' | 'pendentes' | 'ia'>('todos');

 // Fallback memory data (Simulating database for the UI)
 const [historyData] = useState([
 {
 id: 1,
 protocolo: 'DJD-2026-0917-1001',
 cliente: 'João Silva',
 telefone: '5511999990001',
 canal: 'whatsapp',
 operador: 'Ana (Humano)',
 inicio: '2026-09-17T09:15:00',
 fim: '2026-09-17T09:45:00',
 status: 'resolvido',
 tabulacao: 'Suporte Técnico - Lerdeza',
 mensagens: [
 { remetente: 'cliente', texto: 'Bom dia, minha internet está lenta.', hora: '09:15' },
 { remetente: 'ia', texto: 'Bom dia! Sou a IA da DJD Telecom. Pode me informar o CPF do titular?', hora: '09:15' },
 { remetente: 'cliente', texto: '12345678900', hora: '09:16' },
 { remetente: 'ia', texto: 'Obrigada. Fiz um diagnóstico e detectei que a sua ONU está há 45 dias ligada. Gostaria que eu reiniciasse?', hora: '09:16' },
 { remetente: 'cliente', texto: 'Não, eu já reiniciei. Quero falar com atendente.', hora: '09:17' },
 { remetente: 'sistema', texto: 'Transferido para a fila Humana.', hora: '09:18' },
 { remetente: 'operador', texto: 'Olá João, aqui é a Ana. Vou verificar seu sinal no TR-069.', hora: '09:30' },
 { remetente: 'operador', texto: 'Fiz um ajuste na modulação do Wi-Fi. Melhorou?', hora: '09:40' },
 { remetente: 'cliente', texto: 'Ficou ótimo agora! Obrigado.', hora: '09:44' },
 ]
 },
 {
 id: 2,
 protocolo: 'DJD-2026-0916-2044',
 cliente: 'Empresa Alpha',
 telefone: '5511999990002',
 canal: 'webchat',
 operador: 'NocCopilot (IA)',
 inicio: '2026-09-16T14:20:00',
 fim: '2026-09-16T14:25:00',
 status: 'resolvido',
 tabulacao: 'Financeiro - 2ª Via PIX',
 mensagens: [
 { remetente: 'cliente', texto: 'Preciso do PIX da minha fatura que venceu ontem.', hora: '14:20' },
 { remetente: 'ia', texto: 'Claro! Localizei aqui no SGP a fatura vencida em 15/09 no valor de R$ 149,90. Um instante...', hora: '14:21' },
 { remetente: 'ia', texto: 'Aqui está o código PIX Copia e Cola: 00020101021126580014br.gov.bcb.pix...', hora: '14:23' },
 { remetente: 'cliente', texto: 'Pago!', hora: '14:25' },
 { remetente: 'ia', texto: 'Pagamento confirmado pelo banco em tempo real. A conexão já está normalizada!', hora: '14:25' }
 ]
 },
 {
 id: 3,
 protocolo: 'DJD-2026-0916-3091',
 cliente: 'Maria Oliveira',
 telefone: '5511999990003',
 canal: 'whatsapp',
 operador: 'Carlos (NOC)',
 inicio: '2026-09-16T18:00:00',
 fim: '2026-09-16T18:50:00',
 status: 'pendente',
 tabulacao: 'Abertura de O.S. (Rompimento)',
 mensagens: [
 { remetente: 'cliente', texto: 'Caminhão passou e arrancou o fio aqui na rua!', hora: '18:00' },
 { remetente: 'ia', texto: 'Nossa! Sinto muito por isso. Qual é o endereço exato ou ponto de referência?', hora: '18:01' },
 { remetente: 'cliente', texto: 'Rua das Acácias, em frente ao número 100.', hora: '18:02' },
 { remetente: 'ia', texto: 'Registrado. Estou transferindo para a equipe do NOC para agendar a equipe de rua.', hora: '18:03' },
 { remetente: 'operador', texto: 'Boa noite Maria, aqui é o Carlos. Já localizamos a falha no mapa.', hora: '18:40' },
 { remetente: 'operador', texto: 'Acabei de abrir o Chamado #592. O técnico chega em 40 minutos.', hora: '18:45' },
 ]
 },
 {
 id: 4,
 protocolo: 'DJD-2026-0912-1002',
 cliente: 'João Silva',
 telefone: '5511999990001',
 canal: 'whatsapp',
 operador: 'Ana (Humano)',
 inicio: '2026-09-12T09:15:00',
 fim: '2026-09-12T09:45:00',
 status: 'resolvido',
 tabulacao: 'Dúvida Fatura',
 mensagens: [
 { remetente: 'cliente', texto: 'Quero saber se já constou meu pagamento.', hora: '09:15' }
 ]
 }
 ]);

 const metrics = useMemo(() => {
 const total = historyData.length;
 const resolvidos = historyData.filter(d => d.status === 'resolvido').length;
 const pendentes = historyData.filter(d => d.status === 'pendente').length;
 const ia = historyData.filter(d => d.operador.includes('IA')).length;
 
 // Top Tabulação
 const tabs: Record<string, number> = {};
 historyData.forEach(d => tabs[d.tabulacao] = (tabs[d.tabulacao] || 0) + 1);
 const topMotivo = Object.entries(tabs).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';
 
 // Clientes Reincidentes
 const clientes: Record<string, number> = {};
 historyData.forEach(d => clientes[d.cliente] = (clientes[d.cliente] || 0) + 1);
 const reincidentes = Object.values(clientes).filter(c => c > 1).length;
 
 return { total, resolvidos, pendentes, ia, topMotivo, reincidentes };
 }, [historyData]);

 const filteredData = historyData.filter(chat => {
 const matchesSearch = chat.cliente.toLowerCase().includes(searchQuery.toLowerCase()) || 
 chat.protocolo.toLowerCase().includes(searchQuery.toLowerCase());
 const matchesChannel = selectedChannel === 'todos' || chat.canal === selectedChannel;
 let matchesKpi = true;
 if (kpiFilter === 'resolvidos') matchesKpi = chat.status === 'resolvido';
 else if (kpiFilter === 'pendentes') matchesKpi = chat.status === 'pendente';
 else if (kpiFilter === 'ia') matchesKpi = chat.operador.includes('IA');
 
 return matchesSearch && matchesChannel && matchesKpi;
 });

 return (
 <div className="p-6 max-w-[1600px] mx-auto h-[calc(100vh-64px)] flex flex-col relative overflow-hidden">
 {/* Header */}
 <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
 <div>
 <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
 <FileText className="text-blue-500" />
 Histórico & Relatórios de Conversas
 </h1>
 <p className="text-muted-foreground text-sm mt-1">
 Busque conversas antigas, audite atendimentos e exporte relatórios consolidados.
 </p>
 </div>
 <div className="flex items-center gap-3">
 <button className="bg-muted text-muted-foreground px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-accent">
 <Download size={16} /> Exportar CSV
 </button>
 </div>
 </div>


 {/* KPIs */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 shrink-0">
 <button 
 onClick={() => setKpiFilter('todos')}
 className={`text-left p-5 rounded-2xl border flex items-center gap-4 transition-all ${
 kpiFilter === 'todos' 
 ? 'bg-background /80 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
 : 'bg-card border-border hover:bg-slate-50 dark:hover:bg-muted/50'
 }`}
 >
 <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
 kpiFilter === 'todos' ? 'bg-blue-500/20 border-blue-500/30 text-blue-500 border' : 'bg-blue-500/10 text-blue-500'
 }`}>
 <MessageSquare size={24} />
 </div>
 <div>
 <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total no Mês</p>
 <h3 className="text-2xl font-bold text-foreground leading-none mt-1">{metrics.total}</h3>
 </div>
 </button>

 <button 
 onClick={() => setKpiFilter(kpiFilter === 'resolvidos' ? 'todos' : 'resolvidos')}
 className={`text-left p-5 rounded-2xl border flex items-center gap-4 transition-all ${
 kpiFilter === 'resolvidos' 
 ? 'bg-background /80 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
 : 'bg-card border-border hover:bg-slate-50 dark:hover:bg-muted/50'
 }`}
 >
 <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
 kpiFilter === 'resolvidos' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-500 border' : 'bg-emerald-500/10 text-emerald-500'
 }`}>
 <CheckCircle2 size={24} />
 </div>
 <div>
 <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Resolvidos (FCR)</p>
 <h3 className="text-2xl font-bold text-foreground leading-none mt-1">{metrics.resolvidos}</h3>
 </div>
 </button>

 <button 
 onClick={() => setKpiFilter(kpiFilter === 'pendentes' ? 'todos' : 'pendentes')}
 className={`text-left p-5 rounded-2xl border flex items-center gap-4 transition-all ${
 kpiFilter === 'pendentes' 
 ? 'bg-background /80 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
 : 'bg-card border-border hover:bg-slate-50 dark:hover:bg-muted/50'
 }`}
 >
 <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
 kpiFilter === 'pendentes' ? 'bg-amber-500/20 border-amber-500/30 text-amber-500 border' : 'bg-amber-500/10 text-amber-500'
 }`}>
 <AlertCircle size={24} />
 </div>
 <div>
 <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pendentes / OS</p>
 <h3 className="text-2xl font-bold text-foreground leading-none mt-1">{metrics.pendentes}</h3>
 </div>
 </button>

 <button 
 onClick={() => setKpiFilter(kpiFilter === 'ia' ? 'todos' : 'ia')}
 className={`text-left p-5 rounded-2xl border flex items-center gap-4 transition-all ${
 kpiFilter === 'ia' 
 ? 'bg-background /80 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
 : 'bg-card border-border hover:bg-slate-50 dark:hover:bg-muted/50'
 }`}
 >
 <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
 kpiFilter === 'ia' ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-500 border' : 'bg-indigo-500/10 text-indigo-500'
 }`}>
 <Bot size={24} />
 </div>
 <div>
 <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Atendidos por IA</p>
 <h3 className="text-2xl font-bold text-foreground leading-none mt-1">{metrics.ia}</h3>
 </div>
 </button>
 </div>

 {/* Filters Bar */}
 <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col md:flex-row gap-4 mb-6 shrink-0">
 <div className="flex-1 relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
 <input 
 type="text" 
 placeholder="Buscar por cliente, protocolo ou telefone..." 
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-blue-500"
 />
 </div>
 
 <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
 <div className="relative w-full sm:w-auto">
 <select 
 value={selectedChannel}
 onChange={(e) => setSelectedChannel(e.target.value)}
 className="w-full sm:w-auto appearance-none pl-10 pr-10 py-2.5 bg-background border border-border rounded-lg text-sm text-muted-foreground focus:outline-none focus:border-blue-500"
 >
 <option value="todos">Todos os Canais</option>
 <option value="whatsapp">WhatsApp (WABA)</option>
 <option value="webchat">Webchat (Portal)</option>
 </select>
 <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
 </div>

 <div className="relative w-full sm:w-auto">
 <select 
 className="w-full sm:w-auto appearance-none pl-10 pr-10 py-2.5 bg-background border border-border rounded-lg text-sm text-muted-foreground focus:outline-none focus:border-blue-500"
 >
 <option value="30">Últimos 30 Dias</option>
 <option value="7">Últimos 7 Dias</option>
 <option value="hoje">Hoje</option>
 <option value="custom">Personalizado...</option>
 </select>
 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
 </div>
 </div>
 </div>

 {/* Main Content Area */}
 <div className="flex-1 overflow-hidden bg-card rounded-xl border border-border shadow-sm flex flex-col">
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse min-w-[800px]">
 <thead>
 <tr className="bg-muted/50 border-b border-border text-xs uppercase font-bold text-muted-foreground">
 <th className="p-4">Protocolo</th>
 <th className="p-4">Cliente / Contato</th>
 <th className="p-4">Canal</th>
 <th className="p-4 hidden sm:table-cell">Operador Final</th>
 <th className="p-4 hidden md:table-cell">Duração</th>
 <th className="p-4 hidden lg:table-cell">Tabulação</th>
 <th className="p-4 text-center">Ações</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
 {filteredData.map(chat => (
 <tr key={chat.id} onClick={() => setSelectedChat(chat)} className="hover:bg-slate-50 dark:hover:bg-muted/30 transition-colors cursor-pointer group">
 <td className="p-4">
 <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{chat.protocolo}</span>
 <div className="text-[11px] text-muted-foreground mt-0.5">{format(new Date(chat.inicio), 'dd/MM/yyyy HH:mm')}</div>
 </td>
 <td className="p-4">
 <div className="font-bold text-foreground">{chat.cliente}</div>
 <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
 <Phone size={10} /> {chat.telefone}
 </div>
 </td>
 <td className="p-4">
 <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
 chat.canal === 'whatsapp' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' :
 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400'
 }`}>
 {chat.canal === 'whatsapp' ? 'WhatsApp' : 'Webchat'}
 </span>
 </td>
 <td className="p-4 hidden sm:table-cell">
 <div className="flex items-center gap-2">
 {chat.operador.includes('IA') ? (
 <div className="w-6 h-6 rounded bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
 <Bot size={12} className="text-indigo-600 dark:text-indigo-400" />
 </div>
 ) : (
 <div className="w-6 h-6 rounded bg-muted flex items-center justify-center shrink-0">
 <User size={12} className="text-muted-foreground " />
 </div>
 )}
 <span className="text-sm font-medium text-muted-foreground">{chat.operador}</span>
 </div>
 </td>
 <td className="p-4 hidden md:table-cell">
 <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
 <Clock size={14} />
 30 min
 </div>
 </td>
 <td className="p-4 hidden lg:table-cell">
 <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-1 rounded">
 {chat.tabulacao}
 </span>
 </td>
 <td className="p-4 text-center">
 <button 
 onClick={(e) => { e.stopPropagation(); setSelectedChat(chat); }}
 className="p-2 hover:bg-slate-200 dark:hover:bg-accent text-muted-foreground hover:text-blue-500 rounded-lg transition-colors"
 title="Ver Transcrição"
 >
 <Eye size={18} />
 </button>
 </td>
 </tr>
 ))}
 {filteredData.length === 0 && (
 <tr>
 <td colSpan={7} className="p-12 text-center text-muted-foreground">
 Nenhum atendimento encontrado para os filtros atuais.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* Slide-over View Chat */}
 {selectedChat && (
 <>
 {/* Overlay */}
 <div 
 className="fixed inset-0 bg-card/50 backdrop-blur-sm z-40 transition-opacity animate-in fade-in"
 onClick={() => setSelectedChat(null)}
 />
 {/* Drawer */}
 <div className="fixed inset-y-0 right-0 w-full max-w-md bg-card shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
 {/* Header */}
 <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
 <div>
 <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
 <FileText size={20} className="text-blue-500" />
 Transcrição do Atendimento
 </h3>
 <p className="font-mono text-sm text-muted-foreground mt-1">{selectedChat.protocolo}</p>
 </div>
 <button 
 onClick={() => setSelectedChat(null)}
 className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
 >
 <X size={20} />
 </button>
 </div>

 
 {/* Customer KPIs */}
 <div className="bg-background p-4 border-b border-border shrink-0">
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-2 text-foreground font-bold">
 <User size={16} className="text-blue-500" />
 {selectedChat.cliente}
 </div>
 <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-card px-2 py-1 rounded-md border border-border">
 <Activity size={14} className="text-blue-500" />
 {historyData.filter(h => h.cliente === selectedChat.cliente).length} conversas neste mês
 </div>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div className="bg-card p-3 rounded-lg border border-border">
 <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Motivo (Tabulação)</p>
 <p className="text-sm font-medium text-muted-foreground line-clamp-1">{selectedChat.tabulacao}</p>
 </div>
 <div className="bg-card p-3 rounded-lg border border-border">
 <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Conclusão</p>
 <div className="flex items-center gap-1.5">
 {selectedChat.status === 'resolvido' ? (
 <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 capitalize">
 <CheckCircle2 size={14} /> Resolvido
 </span>
 ) : (
 <span className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 capitalize">
 <AlertCircle size={14} /> {selectedChat.status}
 </span>
 )}
 </div>
 </div>
 </div>
 </div>

 {/* Messages Scroll Area */}
 <div className="flex-1 overflow-y-auto p-6 space-y-6">
 {selectedChat.mensagens.map((msg: any, idx: number) => {
 const isCliente = msg.remetente === 'cliente';
 const isSystem = msg.remetente === 'sistema';
 const isIa = msg.remetente === 'ia';

 if (isSystem) {
 return (
 <div key={idx} className="flex justify-center">
 <span className="bg-muted text-muted-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2">
 <AlertCircle size={12} />
 {msg.texto}
 </span>
 </div>
 );
 }

 return (
 <div key={idx} className={`flex gap-3 ${isCliente ? 'flex-row-reverse' : 'flex-row'}`}>
 {/* Avatar */}
 <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center shadow-sm ${
 isCliente ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' :
 isIa ? 'bg-indigo-600 text-white' :
 'bg-muted text-foreground'
 }`}>
 {isCliente ? <User size={14} /> : isIa ? <Bot size={14} /> : <User size={14} />}
 </div>
 
 {/* Bubble */}
 <div className={`flex flex-col ${isCliente ? 'items-end' : 'items-start'} max-w-[75%]`}>
 <span className="text-[10px] font-bold text-muted-foreground mb-1 px-1 uppercase tracking-wider">
 {isCliente ? 'Cliente' : isIa ? 'Cérebro IA' : selectedChat.operador}
 </span>
 <div className={`p-3 rounded-2xl text-sm ${
 isCliente 
 ? 'bg-emerald-500 text-white rounded-tr-sm' 
 : 'bg-card text-foreground border border-border rounded-tl-sm shadow-sm'
 }`}>
 {msg.texto}
 </div>
 <span className="text-[10px] text-muted-foreground mt-1 px-1">{msg.hora}</span>
 </div>
 </div>
 );
 })}
 </div>
 
 </div>
 </>
 )}
 </div>
 );
}
