import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, LineChart, Line, Legend, ComposedChart
} from 'recharts';
import { 
  Users, Bot, Clock, TrendingUp, TrendingDown, Phone, MessageSquare, 
  Zap, Radio, Signal, Headphones, DollarSign, AlertCircle, CheckCircle2,
  Star, HeartHandshake, Smile, Meh, Frown, ThumbsUp, Send, Filter, Sparkles, RefreshCw,
  MapPin, Wrench
} from 'lucide-react';
import Webphone from '../components/Webphone';
import SyncStatusMonitor from '../components/SyncStatusMonitor';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { DivIcon } from 'leaflet';
import { useConfig } from '../contexts/ConfigContext';

const dataResolucao = [
  { name: 'Seg', humano: 120, ia: 250 },
  { name: 'Ter', humano: 132, ia: 280 },
  { name: 'Qua', humano: 101, ia: 310 },
  { name: 'Qui', humano: 140, ia: 350 },
  { name: 'Sex', humano: 90, ia: 380 },
  { name: 'Sáb', humano: 50, ia: 150 },
  { name: 'Dom', humano: 40, ia: 140 },
];

const dataTMR = [
  { time: '08:00', tmr: 25 },
  { time: '10:00', tmr: 15 },
  { time: '12:00', tmr: 45 },
  { time: '14:00', tmr: 30 },
  { time: '16:00', tmr: 18 },
  { time: '18:00', tmr: 12 },
];

const dataReceita = [
  { name: 'Sem 1', mrr: 125000, recuperado: 4500 },
  { name: 'Sem 2', mrr: 128000, recuperado: 6200 },
  { name: 'Sem 3', mrr: 131500, recuperado: 5800 },
  { name: 'Sem 4', mrr: 135000, recuperado: 8900 },
];

export default function Analytics() {
  const { config } = useConfig();
  const [abaAtiva, setAbaAtiva] = useState<'operacao' | 'nps' | 'radar'>('operacao');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };
  const [npsStats, setNpsStats] = useState<any>(null);
  const [npsFeed, setNpsFeed] = useState<any[]>([]);
  const [filtroNps, setFiltroNps] = useState<'todos' | 'promotor' | 'neutro' | 'detrator'>('todos');
  const [disparandoNps, setDisparandoNps] = useState(false);
  const [disparoMsg, setDisparoMsg] = useState<string | null>(null);
  
  const [mapaTecnicos, setMapaTecnicos] = useState<any>(null);

  useEffect(() => {
    if (abaAtiva === 'radar') {
      const fetchRadar = () => {
        fetch('/api/tecnicos/mapa')
          .then(res => res.json())
          .then(data => setMapaTecnicos(data))
          .catch(err => console.error(err));
      };
      fetchRadar();
      const interval = setInterval(fetchRadar, 15000);
      return () => clearInterval(interval);
    }
  }, [abaAtiva]);

  useEffect(() => {
    fetch('/api/nps/stats')
      .then(res => res.json())
      .then(data => setNpsStats(data))
      .catch(() => {});

    fetch('/api/nps/feed')
      .then(res => res.json())
      .then(data => {
        if (data.feed) setNpsFeed(data.feed);
      })
      .catch(() => {});
  }, []);

  const handleDispararTesteNps = async () => {
    setDisparandoNps(true);
    setDisparoMsg(null);
    try {
      const res = await fetch('/api/nps/disparar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: 'Mariana Souza',
          telefone: '+55 11 98877-6655',
          canal: 'WhatsApp WABA',
          ticketId: '1095'
        })
      });
      const data = await res.json();
      setDisparoMsg(data.mensagem);
    } catch {
      setDisparoMsg('Erro ao agendar disparo de teste.');
    } finally {
      setDisparandoNps(false);
    }
  };

  const feedFiltrado = npsFeed.filter(item => {
    if (filtroNps === 'todos') return true;
    return item.classificacao === filtroNps;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header com Switcher de Abas */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white font-outfit mb-2">Visão Geral da Operação</h1>
            <p className="text-slate-400">Monitoramento e inteligência analítica do ecossistema NAP.</p>
            {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-white px-4 py-3 rounded-2xl shadow-xl font-bold animate-in slide-in-from-bottom-5">
          {toastMsg}
        </div>
      )}
</div>
          
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-1 rounded-2xl border border-white/10 flex items-center gap-1">
              <button
                onClick={() => setAbaAtiva('operacao')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  abaAtiva === 'operacao' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap size={14} /> Métricas de Operação
              </button>
              <button
                onClick={() => setAbaAtiva('nps')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  abaAtiva === 'nps' 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Star size={14} className={abaAtiva === 'nps' ? "fill-current" : ""} /> NPS & Qualidade
              </button>
              <button
                onClick={() => setAbaAtiva('radar')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  abaAtiva === 'radar' 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Radio size={14} className={abaAtiva === 'radar' ? "animate-pulse" : ""} /> Radar NOC
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-2 pl-2">
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-medium text-emerald-500">Tempo Real</span>
            </div>
          </div>
        </div>

        {abaAtiva === 'operacao' ? (
          <>
            {/* Monitor de Conectividade em Tempo Real (SGP & GenieACS) */}
            <SyncStatusMonitor variant="card" />

            {/* Top KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard 
                title="MRR Mensal" 
                value="R$ 135.4K" 
                trend="+8.2%" 
                trendUp={true}
                icon={<DollarSign className="text-emerald-400" size={24} />} 
              />
              <MetricCard 
                title="Inadimplência (5+ dias)" 
                value="4.2%" 
                trend="-1.5%" 
                trendUp={true}
                icon={<AlertCircle className="text-red-400" size={24} />} 
              />
              <MetricCard 
                title="Receita Recuperada (PIX IA)" 
                value="R$ 8.9K" 
                trend="+24%" 
                trendUp={true}
                icon={<CheckCircle2 className="text-blue-400" size={24} />} 
              />
              <MetricCard 
                title="Taxa de Retenção IA" 
                value="78.5%" 
                trend="+5.4%" 
                trendUp={true}
                icon={<Bot className="text-indigo-400" size={24} />} 
              />
            </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Financial Chart */}
          <div className="lg:col-span-2 bg-slate-900 border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white font-outfit mb-6 flex items-center gap-2">
              <DollarSign size={18} className="text-emerald-400" />
              MRR & Recuperação Automática (PIX)
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dataReceita} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `R$${val/1000}k`} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `R$${val/1000}k`} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9', borderRadius: '8px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area yAxisId="left" type="monotone" dataKey="mrr" name="MRR (Faturamento)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMrr)" />
                  <Bar yAxisId="right" dataKey="recuperado" name="Recuperado (Cobranca IA)" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Chart */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white font-outfit mb-6">Tempo Médio de Resposta (s)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataTMR} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: '#1e293b', opacity: 0.4}}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9', borderRadius: '8px' }}
                  />
                  <Bar dataKey="tmr" name="TMR" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Volume de Atendimentos Area */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-white font-outfit">Volume de Resolução: Humano vs IA</h3>
              <p className="text-xs text-slate-500 mt-1">Comparativo de tickets encerrados sem intervenção humana na última semana.</p>
            </div>
            <button className="text-xs bg-slate-950 border border-white/5 text-slate-300 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
              Exportar CSV
            </button>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataResolucao} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHumano" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="ia" name="NAP IA Integrada" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorIa)" />
                <Area type="monotone" dataKey="humano" name="Operador Humano" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorHumano)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Operators & Embedded Asterisk Webphone */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Operadores Online (2 Cols) */}
          <div className="lg:col-span-2 bg-slate-900 border border-white/5 rounded-2xl   overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900">
              <div>
                <h3 className="text-lg font-bold text-white font-outfit">Operadores Online & Filas Asterisk 20+</h3>
                <p className="text-xs text-slate-500 mt-0.5">Ramais SIP ativos no Asterisk 21 e distribuição de canais</p>
              </div>
              <span className="bg-emerald-500/10 text-emerald-600 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                4 Ativos
              </span>
            </div>
            <div className="divide-y divide-white/5 flex-1">
              {[
                { nome: 'Ana Costa', status: 'Em Atendimento', canal: 'WhatsApp', fila: 'Suporte N1', ramal: '2004' },
                { nome: 'Carlos Silva', status: 'Disponível', canal: 'Omni', fila: 'Vendas', ramal: '2002' },
                { nome: 'João Dev (Você)', status: 'Disponível', canal: 'WebRTC Telephony', fila: 'Suporte N2', ramal: '2001' },
                { nome: 'Mariana Lima', status: 'Pausa (Lanche)', canal: 'Telefonia', fila: 'Cobrança', ramal: '2003' },
              ].map((op, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-950 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-300 font-bold border border-white/5">
                      {op.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold text-sm">{op.nome}</p>
                        <span className="text-[10px] font-mono text-slate-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                          Ramal {op.ramal}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{op.fila}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      {op.canal.includes('Telefonia') || op.canal.includes('Telephony') ? <Phone size={14} /> : <MessageSquare size={14} />}
                      <span>{op.canal}</span>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${
                      op.status === 'Disponível' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      op.status === 'Em Atendimento' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {op.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Rodapé de Status do Servidor de Telefonia */}
            <div className="p-4 bg-slate-950 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Asterisk PBX: v21.4.1 (Debian 12)</span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span>Codecs: Opus, G.711u</span>
                <span>Porta AMI: 5038</span>
                <span>SRTP: Ativo</span>
              </div>
            </div>
          </div>

          {/* WebPhone Embutido no Dashboard (1 Col) */}
          <div className="flex flex-col items-center">
            <div className="w-full mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Headphones size={14} className="text-blue-400" />
                Console Webphone Operador
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                SIP Pronto
              </span>
            </div>
            <Webphone embedded={true} className="w-full" defaultExtension="2001" />
          </div>
        </div>
      </>
    ) : (
        /* ABA NPS & QUALIDADE */
        <div className="space-y-8 animate-in fade-in">
          
          {/* Banner de Status Global e KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900 border border-emerald-500/20 p-6 rounded-2xl relative overflow-hidden group">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <HeartHandshake size={24} />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Excelente
                </span>
              </div>
              <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">NPS Score Global</h4>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white font-outfit">+{npsStats?.npsScore || 78}</span>
                <span className="text-xs text-slate-400">/ 100</span>
              </div>
              <p className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1 font-medium">
                <Sparkles size={12} /> Zona de Excelência (+75 a +100)
              </p>
            </div>

            <MetricCard 
              title="CSAT Médio (Satisfação)" 
              value={`${npsStats?.csatMedio || 4.8} / 5.0`} 
              trend="+0.2 pts" 
              trendUp={true}
              icon={<Star className="text-amber-400 fill-amber-400/20" size={24} />} 
            />

            <MetricCard 
              title="Resolução 1º Contato (FCR)" 
              value={npsStats?.resolucaoPrimeiroContato || "87.4%"} 
              trend="+3.1%" 
              trendUp={true}
              icon={<CheckCircle2 className="text-blue-400" size={24} />} 
            />

            <MetricCard 
              title="Taxa de Resposta à Pesquisa" 
              value={npsStats?.taxaResposta || "42.8%"} 
              trend="+5.6%" 
              trendUp={true}
              icon={<Send className="text-purple-400" size={24} />} 
            />
          </div>

          {/* Distribuição de Notas NPS */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-base font-bold text-white font-outfit flex items-center gap-2">
                  <ThumbsUp size={18} className="text-emerald-400" />
                  Distribuição de Sentimento dos Clientes
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Baseado em {npsStats?.totalRespostas || 486} avaliações validadas nos últimos 30 dias</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Promotores (9-10)
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Neutros (7-8)
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Detratores (0-6)
                </span>
              </div>
            </div>

            {/* Barra Segmentada */}
            <div className="h-5 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
              <div 
                style={{ width: `${npsStats?.promotoresPct || 84}%` }} 
                className="bg-emerald-500 hover:bg-emerald-400 transition-all cursor-pointer flex items-center justify-center text-[10px] font-bold text-slate-950"
                title="84% Promotores"
              >
                {npsStats?.promotoresPct || 84}%
              </div>
              <div 
                style={{ width: `${npsStats?.neutrosPct || 11}%` }} 
                className="bg-amber-400 hover:bg-amber-300 transition-all cursor-pointer flex items-center justify-center text-[10px] font-bold text-slate-950"
                title="11% Neutros"
              >
                {npsStats?.neutrosPct || 11}%
              </div>
              <div 
                style={{ width: `${npsStats?.detratoresPct || 5}%` }} 
                className="bg-rose-500 hover:bg-rose-400 transition-all cursor-pointer flex items-center justify-center text-[10px] font-bold text-white"
                title="5% Detratores"
              >
                {npsStats?.detratoresPct || 5}%
              </div>
            </div>

            {/* Sub-cards explicativos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Smile size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Promotores (Notas 9-10)</p>
                  <p className="text-lg font-bold text-white font-outfit">408 clientes ({npsStats?.promotoresPct || 84}%)</p>
                  <p className="text-[11px] text-emerald-400">Fidelizados e propensos a indicar</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Meh size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Passivos / Neutros (Notas 7-8)</p>
                  <p className="text-lg font-bold text-white font-outfit">54 clientes ({npsStats?.neutrosPct || 11}%)</p>
                  <p className="text-[11px] text-amber-400">Satisfeitos, mas vulneráveis à concorrência</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                  <Frown size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Detratores (Notas 0-6)</p>
                  <p className="text-lg font-bold text-white font-outfit">24 clientes ({npsStats?.detratoresPct || 5}%)</p>
                  <p className="text-[11px] text-rose-400">Prioritários para retenção ativa (CRM)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico de Evolução & Automação de Disparo */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Gráfico de Evolução Semanal */}
            <div className="lg:col-span-2 bg-slate-900 border border-white/5 rounded-2xl p-6">
              <h3 className="text-base font-bold text-white font-outfit mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-400" />
                Evolução Semanal do NPS vs CSAT
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={npsStats?.historicoSemanal || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="semana" stroke="#64748b" />
                    <YAxis stroke="#64748b" domain={[60, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="nps" name="Score NPS" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
                    <Line type="monotone" dataKey="promotores" name="% Promotores" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Card de Configuração do Gatilho */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-outfit mb-2 flex items-center gap-2">
                  <Zap size={18} className="text-amber-400" />
                  Gatilho Automático de Pesquisa
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  O NAP monitora o encerramento de tickets no Inbox, Webchat e URA. Após o prazo configurado, uma mensagem interativa de avaliação é despachada.
                </p>

                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="p-2.5 rounded-xl bg-white/5 flex items-center justify-between">
                    <span>Canal WhatsApp WABA:</span>
                    <span className="font-bold text-emerald-400">Ativo (3 min após fim)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 flex items-center justify-between">
                    <span>Webchat no Portal PWA:</span>
                    <span className="font-bold text-blue-400">Modal Instantâneo</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 flex items-center justify-between">
                    <span>URA Asterisk 20+:</span>
                    <span className="font-bold text-purple-400">Dígitos 1 a 5</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5">
                {disparoMsg && (
                  <p className="text-xs text-emerald-400 mb-3 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                    {disparoMsg}
                  </p>
                )}
                <button
                  onClick={handleDispararTesteNps}
                  disabled={disparandoNps}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <Send size={14} className={disparandoNps ? "animate-spin" : ""} />
                  Testar Disparo de Pesquisa no Zap
                </button>
              </div>
            </div>

          </div>

          {/* Feed de Avaliações em Tempo Real */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-white font-outfit flex items-center gap-2">
                  <MessageSquare size={18} className="text-blue-400" />
                  Feed de Avaliações Recentes (Auditoria de Atendimento)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Comentários e notas registradas pelos clientes em todos os canais</p>
              </div>

              {/* Filtro por classificação */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setFiltroNps('todos')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${filtroNps === 'todos' ? 'bg-white/10 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Todos ({npsFeed.length})
                </button>
                <button
                  onClick={() => setFiltroNps('promotor')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${filtroNps === 'promotor' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Promotores
                </button>
                <button
                  onClick={() => setFiltroNps('neutro')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${filtroNps === 'neutro' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Neutros
                </button>
                <button
                  onClick={() => setFiltroNps('detrator')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${filtroNps === 'detrator' ? 'bg-rose-500/20 text-rose-400 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Detratores
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {feedFiltrado.map(item => (
                <div 
                  key={item.id}
                  onClick={() => showToast('Detalhes do feedback do cliente')} className="p-4 rounded-xl bg-slate-950 border border-white/5 hover:border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-start gap-3.5 flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold font-outfit shrink-0 border ${
                      item.classificacao === 'promotor' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      item.classificacao === 'neutro' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {item.nota}
                    </div>

                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-white">{item.cliente}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{item.telefone}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/5">
                          {item.canal}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          {item.setor}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 italic">
                        "{item.comentario}"
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-center text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                    <span className="text-xs text-slate-400 font-medium">Atendente: <strong className="text-white">{item.atendente}</strong></span>
                    <span className="text-[11px] text-slate-500">{item.data}</span>
                  </div>
                </div>
              ))}

              {feedFiltrado.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Nenhuma avaliação encontrada para este filtro.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {abaAtiva === 'radar' && (
         <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-slate-900 border border-white/5 p-6 rounded-2xl">
              <h2 className="text-xl font-bold text-white font-outfit mb-4 flex items-center gap-2"><Radio className="text-purple-500 animate-pulse" /> Radar NOC (C.C.O)</h2>
              <p className="text-slate-400 text-sm mb-6">Acompanhamento em tempo real das viaturas em campo via GPS (PWA Técnico), status do Asterisk PABX e contenção da IA Gemini.</p>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* COL 1: Grid Map */}
                 <div className="lg:col-span-2 bg-slate-950 border border-white/5 rounded-xl p-4 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-4 relative z-10">
                       <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2"><MapPin size={16} className="text-emerald-400" /> Viaturas em Campo (GPS)</h3>
                       <span className="flex items-center gap-1 text-xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full"><Signal size={12}/> Transmitindo ao vivo</span>
                    </div>

                    <div className="relative w-full h-[400px] border border-white/10 rounded-xl overflow-hidden bg-slate-900 shadow-inner">
                        {mapaTecnicos ? (
                          <MapContainer 
                            center={[-23.5621, -46.6554]} 
                            zoom={13} 
                            style={{ height: '100%', width: '100%', background: '#0b0f19' }}
                            zoomControl={false}
                          >
                            <TileLayer
                              url={config.mapa?.tileUrlDark || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                              attribution={config.mapa?.atribuicao || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}
                              className="map-tiles-dark"
                            />
                            
                            {/* Marcadores de Técnicos (GPS) */}
                            {mapaTecnicos.tecnicos?.map((tec: any) => {
                              const iconeStatus = tec.status === 'em_rota' ? 'emerald' : tec.status === 'no_cliente' ? 'blue' : 'amber';
                              const CustomIcon = new DivIcon({
                                className: 'custom-div-icon',
                                html: `<div style="width:24px;height:24px;background:rgba(16,185,129,0.2);border:2px solid #10b981;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(16,185,129,0.5);" class="animate-pulse"></div>`,
                                iconSize: [24, 24],
                                iconAnchor: [12, 12]
                              });
                              
                              if (tec.status === 'no_cliente') {
                                CustomIcon.options.html = `<div style="width:24px;height:24px;background:rgba(59,130,246,0.2);border:2px solid #3b82f6;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(59,130,246,0.5);"></div>`;
                              }

                              return (
                                <Marker key={`tec-${tec.id}`} position={[tec.lat, tec.lng]} icon={CustomIcon}>
                                  <Popup className="bg-slate-900 border border-white/10 rounded-xl">
                                    <div className="p-1">
                                      <p className="font-bold text-white text-xs">{tec.nome}</p>
                                      <p className="text-[10px] text-emerald-400 mt-1">{tec.status_label}</p>
                                      <p className="text-[10px] text-slate-400 font-mono mt-1">{tec.velocidade_kmh} km/h • Bat: {tec.bateria}%</p>
                                    </div>
                                  </Popup>
                                </Marker>
                              );
                            })}
                            
                            {/* OS Agendadas/Em Andamento */}
                            {mapaTecnicos.ordens_servico?.map((os: any) => {
                              const OsIcon = new DivIcon({
                                className: 'custom-os-icon',
                                html: `<div style="width:16px;height:16px;background:#ef4444;border-radius:50%;border:2px solid white;box-shadow:0 0 5px rgba(0,0,0,0.5);"></div>`,
                                iconSize: [16, 16],
                                iconAnchor: [8, 8]
                              });
                              return (
                                <Marker key={`os-${os.id}`} position={[os.lat, os.lng]} icon={OsIcon}>
                                  <Popup>
                                    <div className="p-1">
                                      <p className="font-bold text-slate-900 text-xs">{os.numero}</p>
                                      <p className="text-[10px] text-slate-600 mt-1">{os.cliente_nome}</p>
                                      <p className="text-[10px] text-slate-500 mt-1">{os.observacoes}</p>
                                    </div>
                                  </Popup>
                                </Marker>
                              );
                            })}
                          </MapContainer>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-20">
                            <RefreshCw className="animate-spin text-emerald-500" />
                          </div>
                        )}
                    </div>
                 </div>

                 {/* COL 2: Status Live */}
                 <div className="space-y-6">
                    <div className="bg-slate-950 border border-white/5 rounded-xl p-5 shadow-sm relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-5"><Phone size={64}/></div>
                       <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2"><Phone size={16} className="text-blue-400" /> PABX (Asterisk/WebRTC)</h3>
                       <div className="space-y-3 relative z-10">
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                             <span className="text-xs text-slate-400">Chamadas Ativas</span>
                             <span className="text-sm font-bold text-emerald-400">12</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                             <span className="text-xs text-slate-400">Fila de Espera</span>
                             <span className="text-sm font-bold text-orange-400">3</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                             <span className="text-xs text-slate-400">Tempo Médio Espera (TME)</span>
                             <span className="text-sm font-bold text-white">01m 45s</span>
                          </div>
                       </div>
                    </div>

                    <div className="bg-slate-950 border border-white/5 rounded-xl p-5 shadow-sm relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-5"><Bot size={64}/></div>
                       <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2"><Bot size={16} className="text-indigo-400" /> Cérebro IA (Gemini)</h3>
                       <div className="space-y-3 relative z-10">
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                             <span className="text-xs text-slate-400">Resolução Contida (FCR)</span>
                             <span className="text-sm font-bold text-emerald-400">72%</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                             <span className="text-xs text-slate-400">Transferências (Handoff)</span>
                             <span className="text-sm font-bold text-orange-400">28%</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                             <span className="text-xs text-slate-400">Erros de Compreensão</span>
                             <span className="text-sm font-bold text-slate-500">0.4%</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
         </div>
      )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, trendUp, icon }: any) {
  return (
    <div className="bg-slate-900 border border-white/5 p-6 rounded-2xl   flex flex-col relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 text-slate-200/30 group-hover:text-slate-300/30 transition-colors duration-500 rotate-12 scale-150">
        {icon}
      </div>
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="p-3 bg-slate-950 rounded-xl border border-white/5 ">
          {icon}
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${trendUp ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
          {trend}
        </span>
      </div>
      <div className="relative z-10">
        <h4 className="text-slate-400 text-sm font-medium mb-1">{title}</h4>
        <span className="text-3xl font-bold text-white font-outfit">{value}</span>
      </div>
    </div>
  );
}
