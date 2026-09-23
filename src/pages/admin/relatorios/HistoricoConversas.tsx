import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, Calendar, MessageSquare, Download, Eye, 
  Bot, User, Clock, FileText, ChevronRight, X, Phone,
  CheckCircle2, AlertCircle, PieChart, Activity, Users, Zap, Loader2
} from 'lucide-react';
import { format } from 'date-fns';

export default function HistoricoConversas() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('todos');
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [kpiFilter, setKpiFilter] = useState<'todos' | 'resolvidos' | 'pendentes' | 'ia'>('todos');
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    const fetchConversas = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/conversas');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const mapped = data.map((c: any) => ({
              id: c.id,
              protocolo: `NAP-${c.id.toString().padStart(6, '0')}`,
              cliente: c.nome || c.clienteNome || c.telefone || 'Contato',
              telefone: c.telefone || 'N/A',
              canal: c.canal || 'whatsapp',
              operador: c.fila === 'ia' ? 'Cérebro IA' : (c.fila ? `Fila: ${c.fila}` : 'Atendimento Humano'),
              inicio: c.createdAt || new Date().toISOString(),
              fim: c.updatedAt || c.createdAt || new Date().toISOString(),
              status: c.status || 'aberto',
              tabulacao: c.tabulacao || c.motivo || (c.fila ? `Fila ${c.fila}` : 'Atendimento Geral'),
              mensagens: []
            }));
            setHistoryData(mapped);
          }
        }
      } catch (err) {
        console.warn('Falha ao consultar histórico de conversas:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversas();
  }, []);

  const handleSelectChat = async (chat: any) => {
    setSelectedChat(chat);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/conversas/${chat.id}/mensagens`);
      if (res.ok) {
        const msgs = await res.json();
        if (Array.isArray(msgs)) {
          setSelectedChat((prev: any) => ({
            ...prev,
            mensagens: msgs.map((m: any) => ({
              remetente: m.fromMe ? (m.remetente || 'operador') : 'cliente',
              texto: m.conteudo || m.texto || '',
              hora: m.createdAt ? new Date(m.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'
            }))
          }));
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar mensagens da conversa:', e);
    } finally {
      setLoadingMessages(false);
    }
  };

  const metrics = useMemo(() => {
    const total = historyData.length;
    const resolvidos = historyData.filter(d => d.status === 'resolvido' || d.status === 'fechado').length;
    const pendentes = historyData.filter(d => d.status === 'pendente' || d.status === 'aberto').length;
    const ia = historyData.filter(d => d.operador.includes('IA') || d.operador.includes('ia')).length;
    
    // Top Tabulação
    const tabs: Record<string, number> = {};
    historyData.forEach(d => {
      tabs[d.tabulacao] = (tabs[d.tabulacao] || 0) + 1;
    });
    const topMotivo = Object.entries(tabs).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';
    
    // Clientes Reincidentes
    const clientes: Record<string, number> = {};
    historyData.forEach(d => {
      clientes[d.cliente] = (clientes[d.cliente] || 0) + 1;
    });
    const reincidentes = Object.values(clientes).filter(c => c > 1).length;
    
    return { total, resolvidos, pendentes, ia, topMotivo, reincidentes };
  }, [historyData]);

  const filteredData = historyData.filter(chat => {
    const matchesSearch = chat.cliente.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          chat.protocolo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          chat.telefone.includes(searchQuery);
    const matchesChannel = selectedChannel === 'todos' || chat.canal === selectedChannel;
    let matchesKpi = true;
    if (kpiFilter === 'resolvidos') matchesKpi = chat.status === 'resolvido' || chat.status === 'fechado';
    else if (kpiFilter === 'pendentes') matchesKpi = chat.status === 'pendente' || chat.status === 'aberto';
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
            Busque conversas reais, audite atendimentos e exporte relatórios consolidados do banco de dados.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div 
          onClick={() => setKpiFilter('todos')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            kpiFilter === 'todos' 
              ? 'bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/30' 
              : 'bg-card border-border hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold">Total Registrado</span>
            <MessageSquare size={14} className="text-blue-400" />
          </div>
          <div className="text-xl font-bold text-foreground">{metrics.total}</div>
        </div>

        <div 
          onClick={() => setKpiFilter('resolvidos')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            kpiFilter === 'resolvidos' 
              ? 'bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/30' 
              : 'bg-card border-border hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold">Resolvidos</span>
            <CheckCircle2 size={14} className="text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">{metrics.resolvidos}</div>
        </div>

        <div 
          onClick={() => setKpiFilter('pendentes')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            kpiFilter === 'pendentes' 
              ? 'bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/30' 
              : 'bg-card border-border hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold">Pendentes</span>
            <Clock size={14} className="text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400">{metrics.pendentes}</div>
        </div>

        <div 
          onClick={() => setKpiFilter('ia')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            kpiFilter === 'ia' 
              ? 'bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/30' 
              : 'bg-card border-border hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold">Triagem IA</span>
            <Bot size={14} className="text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-indigo-400">{metrics.ia}</div>
        </div>

        <div className="p-3.5 rounded-xl border bg-card border-border">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold">Top Tabulação</span>
            <PieChart size={14} className="text-sky-400" />
          </div>
          <div className="text-xs font-bold text-foreground truncate mt-1" title={metrics.topMotivo}>
            {metrics.topMotivo}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border bg-card border-border">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold">Reincidentes</span>
            <Users size={14} className="text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-400">{metrics.reincidentes}</div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
        <div className="flex flex-1 items-center gap-3 w-full">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por protocolo, nome ou telefone..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedChannel}
              onChange={e => setSelectedChannel(e.target.value)}
              className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none"
            >
              <option value="todos">Todos os Canais</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="webchat">Webchat</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden bg-card rounded-xl border border-border shadow-sm flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-xs uppercase font-bold text-muted-foreground">
                <th className="p-4">Protocolo</th>
                <th className="p-4">Cliente / Contato</th>
                <th className="p-4">Canal</th>
                <th className="p-4 hidden sm:table-cell">Operador / Fila</th>
                <th className="p-4 hidden lg:table-cell">Tabulação</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted-foreground">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-blue-500" />
                    Carregando conversas do banco de dados...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted-foreground">
                    Nenhum atendimento encontrado para os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredData.map(chat => (
                  <tr 
                    key={chat.id} 
                    onClick={() => handleSelectChat(chat)} 
                    className="hover:bg-muted/30 transition-colors cursor-pointer group"
                  >
                    <td className="p-4">
                      <span className="font-mono font-bold text-blue-400">{chat.protocolo}</span>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {chat.inicio ? format(new Date(chat.inicio), 'dd/MM/yyyy HH:mm') : '--'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-foreground">{chat.cliente}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone size={10} /> {chat.telefone}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        chat.canal === 'whatsapp' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      }`}>
                        {chat.canal}
                      </span>
                    </td>
                    <td className="p-4 hidden sm:table-cell text-sm text-foreground">
                      {chat.operador}
                    </td>
                    <td className="p-4 hidden lg:table-cell text-sm text-muted-foreground">
                      {chat.tabulacao}
                    </td>
                    <td className="p-4 text-center">
                      <button className="p-2 text-muted-foreground hover:text-blue-400 hover:bg-muted rounded-lg transition-colors">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over View Chat */}
      {selectedChat && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity animate-in fade-in"
            onClick={() => setSelectedChat(null)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
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
                  <Phone size={12} className="text-blue-500" />
                  {selectedChat.telefone}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card p-3 rounded-lg border border-border">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Fila / Tabulação</p>
                  <p className="text-sm font-medium text-foreground line-clamp-1">{selectedChat.tabulacao}</p>
                </div>
                <div className="bg-card p-3 rounded-lg border border-border">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Status</p>
                  <span className="text-sm font-bold text-emerald-400 capitalize">
                    {selectedChat.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center p-8 text-muted-foreground text-sm">
                  <Loader2 size={18} className="animate-spin mr-2 text-blue-500" /> Carregando mensagens...
                </div>
              ) : selectedChat.mensagens && selectedChat.mensagens.length > 0 ? (
                selectedChat.mensagens.map((msg: any, idx: number) => {
                  const isCliente = msg.remetente === 'cliente';
                  return (
                    <div key={idx} className={`flex gap-3 ${isCliente ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center shadow-sm ${
                        isCliente ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-600 text-white'
                      }`}>
                        {isCliente ? <User size={14} /> : <Bot size={14} />}
                      </div>
                      <div className={`flex flex-col ${isCliente ? 'items-end' : 'items-start'} max-w-[75%]`}>
                        <span className="text-[10px] font-bold text-muted-foreground mb-1 px-1 uppercase tracking-wider">
                          {isCliente ? 'Cliente' : selectedChat.operador}
                        </span>
                        <div className={`p-3 rounded-2xl text-sm ${
                          isCliente 
                            ? 'bg-emerald-600 text-white rounded-tr-sm' 
                            : 'bg-muted text-foreground border border-border rounded-tl-sm shadow-sm'
                        }`}>
                          {msg.texto}
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1 px-1">{msg.hora}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center p-8 text-muted-foreground text-sm">
                  Nenhuma mensagem registrada nesta conversa.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
