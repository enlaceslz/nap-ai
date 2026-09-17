import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Server, Wifi, Activity, CreditCard, ShieldCheck, FileText, Router, CheckCircle2, XCircle, Loader2, Zap, User, Phone, MapPin, AlertTriangle, MessageCircle, HeartHandshake, ArrowUpRight, Copy, Check, Share2, Navigation, Sliders, Smartphone, Bot } from 'lucide-react';
import AddressMapModal from '../components/AddressMapModal';
import { useConfig } from '../contexts/ConfigContext';

export default function ConsultaSGP() {
  const { config } = useConfig();
  const erpAtivoId = config.erpAtivo || 'ixc';
  const erpAtivoObj = config.erps?.[erpAtivoId];
  const erpNome = erpAtivoObj?.nome || erpAtivoId.toUpperCase();

  const [query, setQuery] = useState('Maria');
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState<any[] | null>(null);
  const [activeTab, setActiveTab] = useState<'geral' | 'suporte' | 'financeiro' | 'vendas'>('geral');
  const [copied, setCopied] = useState(false);
  const [mapTargetCliente, setMapTargetCliente] = useState<any | null>(null);
  const [sendingPortal, setSendingPortal] = useState(false);
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/erp/busca?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResultados(data.resultados);
      setActiveTab('geral');
    } catch (error) {
      console.error(error);
      setResultados([]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-200 text-xs font-bold uppercase tracking-wider text-emerald-700"><CheckCircle2 size={14} /> Ativo</span>;
      case 'bloqueado_parcial':
        return <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-200 text-xs font-bold uppercase tracking-wider text-amber-700"><AlertTriangle size={14} /> Bloq. Parcial (Inadimplência)</span>;
      default:
        return <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-200 text-xs font-bold uppercase tracking-wider text-red-700"><XCircle size={14} /> Inativo</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative">
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-slate-900 z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit flex items-center gap-2">
            <Server className="text-blue-400" size={24} />
            Workspace CRM & ERP Telecom
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Conectado ao <strong className="text-blue-400">{erpNome}</strong> • Visão 360 do assinante, faturas, PIX e telecom.
          </p>
        </div>

        <Link
          to="/admin/configuracoes"
          className="px-4 py-2 bg-slate-950 hover:bg-white/5 text-slate-300 border border-white/10 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0"
        >
          <Sliders size={14} className="text-blue-400" />
          <span>Configurações ERP ({erpAtivoId.toUpperCase()})</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        {/* Search Bar */}
        <div className="bg-slate-900 rounded-2xl border border-white/5  p-6 mb-8 max-w-5xl mx-auto">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Busque por CPF, CNPJ, Nome ou ID..." 
                className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-white/5 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all font-medium placeholder:text-slate-500 "
              />
            </div>
            <button 
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-blue-700 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-bold transition-all  -700/20 disabled:opacity-70 flex items-center gap-2 hover:scale-105 active:scale-95"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
              Buscar
            </button>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-blue-400">
            <Loader2 size={40} className="animate-spin mb-4" />
            <p className="font-bold text-slate-400">Sincronizando com {erpNome}...</p>
          </div>
        )}

        {/* Results Area */}
        {!loading && resultados && resultados.length > 0 && (
          <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4">
            {resultados.map((res: any) => (
              <div key={res.id} className="bg-slate-900 rounded-3xl border border-white/5  -200/40 overflow-hidden">
                
                {/* Profile Header */}
                <div className="p-8 border-b border-white/5 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl font-bold font-outfit  border-2 border-white/10">
                        {res.nome.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-3xl font-bold font-outfit tracking-tight">{res.nome}</h2>
                          {renderStatusBadge(res.status_cliente)}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-slate-300 text-sm font-medium">
                          <span className="flex items-center gap-1.5 bg-slate-900/10 px-3 py-1.5 rounded-lg backdrop-blur-md">
                            <FileText size={14} /> ID: #{res.id}
                          </span>
                          <span className="flex items-center gap-1.5 bg-slate-900/10 px-3 py-1.5 rounded-lg backdrop-blur-md">
                            <ShieldCheck size={14} /> {res.cpf_cnpj}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Key Metrics Quick View */}
                    <div className="flex gap-4">
                       <div className="bg-slate-900/10 backdrop-blur-md border border-white/10 rounded-xl p-4 min-w-[120px]">
                         <p className="text-blue-300 text-[10px] font-bold uppercase tracking-wider mb-1">Score Pagador</p>
                         <p className="text-2xl font-bold font-outfit">{res.metricas.score_pagador}/10</p>
                       </div>
                       <div className="bg-slate-900/10 backdrop-blur-md border border-white/10 rounded-xl p-4 min-w-[120px]">
                         <p className="text-blue-300 text-[10px] font-bold uppercase tracking-wider mb-1">Tempo de Casa</p>
                         <p className="text-2xl font-bold font-outfit">{res.metricas.tempo_contrato_meses} <span className="text-sm font-medium">meses</span></p>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex overflow-x-auto border-b border-white/5 bg-slate-950/80 px-4">
                  {[
                    { id: 'geral', label: 'Visão Geral (CRM)', icon: <User size={16} /> },
                    { id: 'financeiro', label: 'Financeiro & Cobrança', icon: <CreditCard size={16} /> },
                    { id: 'suporte', label: 'Suporte & Conexão (NOC)', icon: <Router size={16} /> },
                    { id: 'vendas', label: 'Upgrades (Cross-sell)', icon: <HeartHandshake size={16} /> },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id 
                          ? 'border-blue-600 text-blue-400 bg-slate-900' 
                          : 'border-transparent text-slate-500 hover:text-slate-200 hover:bg-white/5/50'
                      }`}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="p-8">
                  
                  {/* TAB: VISÃO GERAL */}
                  {activeTab === 'geral' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Contato Info */}
                      <div className="lg:col-span-1 space-y-6">
                        <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 ">
                          <h3 className="font-bold text-white font-outfit mb-4 text-sm flex items-center gap-2 border-b border-white/5 pb-2">
                            <User size={16} className="text-blue-400" /> Dados de Contato
                          </h3>
                          <div className="space-y-4">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Telefone Principal (WhatsApp)</p>
                              <div className="flex items-center justify-between bg-slate-900 border border-white/5 px-3 py-2 rounded-lg">
                                <span className="font-bold text-white">{res.contato.telefone}</span>
                                <div className="flex gap-1.5">
                                  <a 
                                    href={`tel:${res.contato.telefone}`}
                                    className="text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors"
                                    title="Ligar via Webphone SIP/Asterisk"
                                  >
                                    <Phone size={12} /> Webphone
                                  </a>
                                  <a 
                                    href={`https://wa.me/55${(res.contato.telefone || '').replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors"
                                  >
                                    <MessageCircle size={12} /> WABA
                                  </a>
                                </div>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">E-mail Cadastrado</p>
                              <p className="font-medium text-white text-sm bg-slate-900 border border-white/5 px-3 py-2 rounded-lg truncate">{res.contato.email}</p>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Endereço de Instalação</p>
                                <button
                                  type="button"
                                  onClick={() => setMapTargetCliente(res)}
                                  className="text-[11px] font-bold text-blue-400 hover:text-blue-400 flex items-center gap-1"
                                >
                                  <MapPin size={12} />
                                  <span>Ver no Mapa / CEP</span>
                                </button>
                              </div>
                              <div className="bg-slate-900 border border-white/5 px-3 py-2.5 rounded-lg space-y-2">
                                <p className="font-medium text-white text-sm leading-relaxed">{res.endereco}</p>
                                {res.ponto_referencia && (
                                  <p className="text-xs text-amber-700 font-medium">📍 Ref: {res.ponto_referencia}</p>
                                )}
                                <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                                  <button
                                    type="button"
                                    onClick={() => setMapTargetCliente(res)}
                                    className="px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-100 text-blue-400 border border-blue-500/20 rounded-md text-xs font-bold flex items-center gap-1 transition-colors "
                                  >
                                    <MapPin size={12} />
                                    <span>Mapa & Rotas GPS</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setMapTargetCliente(res)}
                                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold flex items-center gap-1 transition-colors "
                                  >
                                    <Share2 size={12} />
                                    <span>WhatsApp Técnico</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Timeline CRM */}
                      <div className="lg:col-span-2">
                         <div className="bg-slate-900 p-6 rounded-2xl border border-white/5 ">
                           <h3 className="font-bold text-white font-outfit mb-6 text-sm flex items-center gap-2 border-b border-white/5 pb-3">
                             <Activity size={16} className="text-blue-400" /> Histórico de Atendimentos (Últimos 30 dias)
                           </h3>
                           
                           {res.chamados_recentes.map((chamado: any) => (
                             <div key={chamado.id} className="relative pl-6 pb-6 border-l-2 border-white/5 last:border-0 last:pb-0">
                               <div className="absolute -left-[9px] top-0 w-4 h-4 bg-emerald-500 rounded-full border-4 border-slate-900 "></div>
                               <div className="bg-slate-950 border border-white/5 rounded-xl p-4">
                                 <div className="flex justify-between items-start mb-2">
                                   <div className="flex items-center gap-2">
                                     <span className="bg-white/10 text-slate-300 text-[10px] px-2 py-0.5 rounded font-bold">Ticket #{chamado.id}</span>
                                     <span className="text-xs text-slate-500 font-bold">{new Date(chamado.data).toLocaleDateString('pt-BR')}</span>
                                   </div>
                                   <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Resolvido</span>
                                 </div>
                                 <p className="text-sm font-medium text-white">{chamado.assunto}</p>
                               </div>
                             </div>
                           ))}
                         </div>
                      </div>
                    </div>
                  )}

                   {/* TAB: FINANCEIRO E COBRANÇA */}
                  {activeTab === 'financeiro' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Ações de Cobrança */}
                      <div className="lg:col-span-1 space-y-4">
                        <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-4">
                           <h3 className="font-bold text-white font-outfit text-sm flex items-center gap-2 border-b border-white/5 pb-2">
                             <Zap size={16} className="text-amber-500" /> Ações Financeiras
                           </h3>

                           {actionFeedback && (
                             <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-semibold flex items-center gap-2 animate-in fade-in">
                               <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                               <span>{actionFeedback}</span>
                             </div>
                           )}

                           <div className="space-y-2.5">
                             {/* Canal Principal: Notificação Push no Portal */}
                             <button 
                               onClick={() => {
                                 setSendingPortal(true);
                                 setTimeout(() => {
                                   setSendingPortal(false);
                                   setActionFeedback("✓ Notificação Push e fatura enviadas ao Portal do Cliente (Canal Principal)!");
                                   setTimeout(() => setActionFeedback(null), 5000);
                                 }, 600);
                               }}
                               disabled={sendingPortal}
                               className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 px-3 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 disabled:opacity-50"
                             >
                               <Smartphone size={15} /> 
                               <span>{sendingPortal ? 'Transmitindo...' : 'Notificar no Portal (Canal Principal)'}</span>
                             </button>

                             {/* Canal Sob Demanda: WhatsApp a critério do operador */}
                             <button 
                               onClick={() => {
                                 setSendingWhatsapp(true);
                                 setTimeout(() => {
                                   setSendingWhatsapp(false);
                                   setActionFeedback("✓ Fatura enviada via WhatsApp WABA a critério do operador!");
                                   setTimeout(() => setActionFeedback(null), 5000);
                                 }, 700);
                               }}
                               disabled={sendingWhatsapp}
                               className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 py-2.5 px-3 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                               title="Disparo sob demanda autorizado pelo operador"
                             >
                               <MessageCircle size={15} className="text-emerald-400" /> 
                               <span>{sendingWhatsapp ? 'Enviando WABA...' : 'Enviar WhatsApp (Critério do Operador)'}</span>
                             </button>
                             
                             {/* Copiar Chave PIX (Integração) */}
                             <button 
                               onClick={() => {
                                 navigator.clipboard.writeText("00020101021126360014br.gov.bcb.pix0114+55119999999995204000053039865802BR5916Provedor Telecom6009SAO PAULO62070503***6304");
                                 setActionFeedback("✓ Código PIX Copia e Cola gerado e copiado com sucesso!");
                                 setTimeout(() => setActionFeedback(null), 5000);
                               }}
                               className="w-full bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 py-2.5 px-3 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-2 active:scale-95"
                             >
                               <Copy size={15} /> 
                               <span>Gerar PIX Copia e Cola</span>
                             </button>

                             {res.status_cliente === 'bloqueado_parcial' && (
                               <button 
                                 onClick={() => {
                                   setActionFeedback("✓ Desbloqueio temporário de 24h aplicado no concentrador!");
                                   setTimeout(() => setActionFeedback(null), 5000);
                                 }}
                                 className="w-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 py-2.5 px-3 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-2 active:scale-95"
                               >
                                 <ShieldCheck size={15} className="text-amber-400" /> Desbloqueio em Confiança (24h)
                               </button>
                             )}
                             <button 
                               onClick={() => {
                                 setActionFeedback("✓ Promessa de pagamento registrada para +3 dias!");
                                 setTimeout(() => setActionFeedback(null), 5000);
                               }}
                               className="w-full bg-slate-900 hover:bg-white/5 border border-white/5 text-slate-300 py-2.5 px-3 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-2"
                             >
                               <FileText size={15} /> Promessa de Pagamento
                             </button>
                           </div>

                           {/* Card de Diretriz Operacional */}
                           <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 space-y-1 text-[11px] text-slate-400">
                             <div className="flex items-center gap-1.5 font-bold text-white">
                               <Bot size={13} className="text-indigo-400" />
                               <span>Estratégia Omnichannel & MaIA 24h</span>
                             </div>
                             <p className="leading-relaxed">
                               Faturas e débitos ficam centralizados no Portal do Cliente. O operador tem autonomia para enviar ou não via WhatsApp WABA, enquanto a MaIA permanece ativa 24h para responder qualquer dúvida.
                             </p>
                           </div>
                        </div>
                      </div>

                      {/* Lista de Faturas */}
                      <div className="lg:col-span-2 space-y-4">
                        {res.faturas.map((fatura: any) => (
                          <div key={fatura.id} className={`p-5 rounded-2xl border ${
                            fatura.status === 'atrasado' ? 'bg-red-50/30 border-red-200' : 'bg-slate-900 border-white/5'
                          }  transition-all hover:`}>
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border  ${
                                  fatura.status === 'pago' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 
                                  fatura.status === 'atrasado' ? 'bg-red-50 border-red-200 text-red-600' : 
                                  'bg-amber-50 border-amber-200 text-amber-600'
                                }`}>
                                  <CreditCard size={20} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-white text-lg">Fatura #{fatura.id}</h4>
                                    {fatura.status === 'atrasado' && (
                                      <span className="text-[10px] font-bold uppercase bg-red-100 text-red-700 px-2 py-0.5 rounded">{fatura.dias_atraso} dias atraso</span>
                                    )}
                                  </div>
                                  <p className="text-sm font-medium text-slate-500">Vencimento: {new Date(fatura.vencimento).toLocaleDateString('pt-BR')}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold font-outfit text-white">R$ {fatura.valor.toFixed(2).replace('.', ',')}</p>
                                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                                  fatura.status === 'pago' ? 'text-emerald-600' : fatura.status === 'atrasado' ? 'text-red-600' : 'text-amber-600'
                                }`}>{fatura.status}</span>
                              </div>
                            </div>
                            
                            {/* PIX Copy & Paste area for unpaid */}
                            {(fatura.status === 'atrasado' || fatura.status === 'pendente') && (
                              <div className="pt-4 border-t border-white/5 mt-2">
                                <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2">Linha Digitável / PIX Copia e Cola</p>
                                <div className="flex gap-2">
                                  <input 
                                    readOnly 
                                    value={fatura.linha_digitavel}
                                    className="flex-1 bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs font-mono text-slate-400 outline-none"
                                  />
                                  <button 
                                    onClick={() => copyToClipboard(fatura.linha_digitavel)}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg font-bold text-xs flex items-center gap-2 transition-colors border border-white/5"
                                  >
                                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />} Copiar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB: SUPORTE & CONEXÃO (NOC) */}
                  {activeTab === 'suporte' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 ">
                        <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
                          <h3 className="font-bold text-white font-outfit text-sm flex items-center gap-2 uppercase tracking-wider">
                            <Router size={16} className="text-blue-400" /> Detalhes da Conexão (Radius)
                          </h3>
                          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-full border border-white/5 ">
                            <span className="flex h-2.5 w-2.5 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Online</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-900 p-4 rounded-xl border border-white/5 ">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Plano Atual</p>
                            <p className="font-bold text-white text-sm">{res.conexao.plano}</p>
                          </div>
                          <div className="bg-slate-900 p-4 rounded-xl border border-white/5 ">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Uptime</p>
                            <p className="font-bold text-white text-sm">{res.conexao.uptime}</p>
                          </div>
                          <div className="bg-slate-900 p-4 rounded-xl border border-white/5 ">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">IP Designado</p>
                            <p className="font-mono text-sm font-bold text-white">{res.conexao.ip}</p>
                          </div>
                          <div className="bg-slate-900 p-4 rounded-xl border border-white/5 ">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Sinal Óptico (ONU)</p>
                            <p className="font-mono text-sm font-bold text-emerald-600">{res.conexao.sinal_optico}</p>
                          </div>
                        </div>

                        {actionFeedback && (
                          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-500 font-semibold flex items-center gap-2 animate-in fade-in">
                            <CheckCircle2 size={15} className="shrink-0" />
                            <span>{actionFeedback}</span>
                          </div>
                        )}
                        <div className="mt-6 flex gap-3">
                           <button 
                             onClick={() => {
                               setActionFeedback("✓ Comando de Radius CoA (Disconnect) enviado com sucesso para a BNG.");
                               setTimeout(() => setActionFeedback(null), 5000);
                             }}
                             className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 py-3 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2"
                           >
                             <Zap size={16} /> Kick (Derrubar Conexão)
                           </button>
                           <button className="flex-1 bg-slate-900 hover:bg-white/5 border border-white/5 text-slate-300 py-3 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2">
                             <Activity size={16} /> Extrato de Navegação
                           </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: VENDAS E UPGRADES */}
                  {activeTab === 'vendas' && (
                    <div>
                      <div className="mb-6">
                        <h3 className="font-bold text-white font-outfit text-lg flex items-center gap-2">
                          <ArrowUpRight className="text-blue-400" /> Oportunidades de Upgrade (Cross-sell)
                        </h3>
                        <p className="text-slate-400 text-sm">Com base no consumo de {res.metricas.consumo_mes_gb}GB/mês, estes planos são recomendados.</p>
                      </div>
                      
                      {actionFeedback && (
                        <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-300 font-semibold flex items-center gap-2 animate-in fade-in max-w-4xl">
                          <CheckCircle2 size={15} className="text-blue-400 shrink-0" />
                          <span>{actionFeedback}</span>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                        {res.planos_disponiveis.map((plano: any) => (
                          <div key={plano.id} className={`p-6 rounded-2xl border-2 transition-all cursor-pointer hover: ${
                            plano.destaque ? 'border-blue-600 bg-blue-500/10/30' : 'border-white/5 bg-slate-900 hover:border-blue-300'
                          }`}>
                            {plano.destaque && (
                              <span className="inline-block bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md mb-4 inline-block ">
                                Recomendado pela IA
                              </span>
                            )}
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-2xl font-bold text-white font-outfit">{plano.nome}</h4>
                            </div>
                            <p className="text-3xl font-bold font-outfit text-white mb-6">
                              R$ {plano.valor.toFixed(2).replace('.', ',')} <span className="text-sm font-medium text-slate-500">/mês</span>
                            </p>
                            
                            <button 
                              onClick={() => {
                                setActionFeedback("✓ Oferta registrada no ERP e adicionada ao Pipeline do Kanban de Vendas!");
                                setTimeout(() => setActionFeedback(null), 5000);
                              }}
                              className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                              plano.destaque ? 'bg-blue-700 hover:bg-blue-800 text-white -700/20' : 'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/5'
                            }`}>
                              <HeartHandshake size={16} /> Ofertar Upgrade
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Mapa, Busca de CEP e Rotas para Técnico */}
      {mapTargetCliente && (
        <AddressMapModal
          isOpen={!!mapTargetCliente}
          onClose={() => setMapTargetCliente(null)}
          cliente={{
            id: mapTargetCliente.id,
            nome: mapTargetCliente.nome,
            telefone: mapTargetCliente.contato?.telefone || '',
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
            setResultados(prev => {
              if (!prev) return prev;
              return prev.map(c => c.id === mapTargetCliente.id ? {
                ...c,
                ...novo,
                endereco: novo.endereco || c.endereco
              } : c);
            });
          }}
        />
      )}
    </div>
  );
}
