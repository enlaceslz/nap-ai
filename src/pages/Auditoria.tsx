import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, Search, Filter, Download, RefreshCw, FileText, 
  AlertTriangle, CheckCircle2, Info, Eye, Server, Radio, Megaphone, 
  UserCheck, Clock, Lock, Database, Copy, Check, X, ShieldAlert,
  ArrowUpDown, ExternalLink, Calendar, ChevronRight, Hash, PieChart as PieChartIcon,
  Activity, MessageCircle
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';
import type { AuditLogEntry } from '../types';
import { registrarAcaoAuditoria } from '../lib/audit';

export default function Auditoria() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [busca, setBusca] = useState<string>('');
  const [moduloFiltro, setModuloFiltro] = useState<string>('todos');
  const [severidadeFiltro, setSeveridadeFiltro] = useState<string>('todas');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [modalSimularAberto, setModalSimularAberto] = useState<boolean>(false);
  const [novoEvento, setNovoEvento] = useState({
    modulo: 'SGP / ERP' as const,
    acao: 'Alteração de Parâmetros de Conexão',
    detalhes: 'Operador atualizou timeout da API e revalidou credenciais de autenticação.',
    categoria: 'configuracao' as const,
    severidade: 'critico' as const,
    usuario: 'Operador Supervisor',
    usuarioEmail: 'supervisor@provedor.com.br'
  });

  const carregarLogs = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/auditoria');
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Erro ao buscar logs de auditoria:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    carregarLogs();
  }, []);

  const logsFiltrados = useMemo(() => {
    return logs.filter((log) => {
      const matchBusca = 
        !busca ||
        log.usuario.toLowerCase().includes(busca.toLowerCase()) ||
        log.acao.toLowerCase().includes(busca.toLowerCase()) ||
        log.detalhes.toLowerCase().includes(busca.toLowerCase()) ||
        log.modulo.toLowerCase().includes(busca.toLowerCase()) ||
        (log.ip && log.ip.includes(busca));

      const matchModulo = 
        moduloFiltro === 'todos' ||
        log.modulo.toLowerCase().includes(moduloFiltro.toLowerCase());

      const matchSeveridade = 
        severidadeFiltro === 'todas' || 
        log.severidade === severidadeFiltro;

      const matchCategoria = 
        categoriaFiltro === 'todas' || 
        log.categoria === categoriaFiltro;

      return matchBusca && matchModulo && matchSeveridade && matchCategoria;
    });
  }, [logs, busca, moduloFiltro, severidadeFiltro, categoriaFiltro]);

  const estatisticas = useMemo(() => {
    const total = logs.length;
    const criticos = logs.filter(l => l.severidade === 'critico').length;
    const atencao = logs.filter(l => l.severidade === 'atencao').length;
    const acessos = logs.filter(l => l.modulo.includes('Acesso') || l.categoria === 'acesso').length;
    const sgpErp = logs.filter(l => l.modulo.includes('SGP') || l.modulo.includes('ERP')).length;
    const genieacs = logs.filter(l => l.modulo.includes('GenieACS') || l.categoria === 'comando').length;
    const campanhas = logs.filter(l => l.modulo.includes('Campanha') || l.categoria === 'disparo').length;

    return { total, criticos, atencao, acessos, sgpErp, genieacs, campanhas };
  }, [logs]);

  // Distribuição de ações por tipo para o gráfico de rosca (Acessos, Alterações, Campanhas)
  const dadosDistribuicao = useMemo(() => {
    let acessos = 0;
    let alteracoes = 0;
    let campanhas = 0;
    let comandos = 0;

    logs.forEach((log) => {
      const mod = (log.modulo || '').toLowerCase();
      const cat = (log.categoria || '').toLowerCase();
      if (cat === 'acesso' || mod.includes('acesso')) {
        acessos++;
      } else if (cat === 'disparo' || mod.includes('campanha') || mod.includes('cobranca')) {
        campanhas++;
      } else if (cat === 'configuracao' || mod.includes('sgp') || mod.includes('erp') || mod.includes('configura')) {
        alteracoes++;
      } else {
        comandos++;
      }
    });

    const totalReal = (acessos + alteracoes + campanhas + comandos) || 1;

    return [
      {
        tipoId: 'acesso',
        name: 'Acessos & Sessões',
        value: acessos,
        color: '#38bdf8', // sky-400
        icon: UserCheck,
        descricao: 'Logins, sessões e autenticação de operadores',
        pct: Math.round((acessos / totalReal) * 100)
      },
      {
        tipoId: 'configuracao',
        name: 'Alterações SGP / ERP',
        value: alteracoes,
        color: '#a855f7', // purple-500
        icon: Server,
        descricao: 'Credenciais, parâmetros de rede e timeouts',
        pct: Math.round((alteracoes / totalReal) * 100)
      },
      {
        tipoId: 'disparo',
        name: 'Campanhas & Cobrança',
        value: campanhas,
        color: '#f59e0b', // amber-500
        icon: Megaphone,
        descricao: 'Disparos HSM WhatsApp, régua e URA reversa',
        pct: Math.round((campanhas / totalReal) * 100)
      },
      {
        tipoId: 'comando',
        name: 'Comandos & Infraestrutura',
        value: comandos,
        color: '#10b981', // emerald-500
        icon: Radio,
        descricao: 'Ações no GenieACS, Zabbix e WhatsApp WABA',
        pct: Math.round((comandos / totalReal) * 100)
      }
    ];
  }, [logs]);

  // Itens para renderização no gráfico de rosca (ou fatia placeholder se vazio)
  const dadosGraficoRosca = useMemo(() => {
    const ativos = dadosDistribuicao.filter(d => d.value > 0);
    if (ativos.length === 0) {
      return [{ name: 'Sem registros', value: 1, color: '#334155', tipoId: 'vazio', pct: 100, descricao: 'Nenhuma ação registrada ainda' }];
    }
    return ativos;
  }, [dadosDistribuicao]);

  const handleExportar = (formato: 'csv' | 'json') => {
    window.open(`/api/auditoria/exportar?formato=${formato}`, '_blank');
  };

  const handleCopiar = (texto: string, id: string) => {
    navigator.clipboard.writeText(texto);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const handleSimularRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registrarAcaoAuditoria({
        modulo: novoEvento.modulo,
        acao: novoEvento.acao,
        detalhes: novoEvento.detalhes,
        categoria: novoEvento.categoria,
        severidade: novoEvento.severidade,
        usuario: novoEvento.usuario,
        usuarioEmail: novoEvento.usuarioEmail,
        payloadAntes: { parametro: 'padrao_anterior' },
        payloadDepois: { parametro: 'atualizado_em_conformidade' }
      });
      setModalSimularAberto(false);
      await carregarLogs();
    } catch (err) {
      console.error('Erro ao simular evento:', err);
    }
  };

  const getSeveridadeBadge = (sev: string) => {
    switch (sev) {
      case 'critico':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Crítico
          </span>
        );
      case 'atencao':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Atenção
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Informativo
          </span>
        );
    }
  };

  const getModuloIcon = (modulo: string) => {
    if (modulo.includes('Acesso')) return <UserCheck size={14} className="text-blue-400" />;
    if (modulo.includes('SGP') || modulo.includes('ERP')) return <Server size={14} className="text-purple-400" />;
    if (modulo.includes('GenieACS')) return <Radio size={14} className="text-cyan-400" />;
    if (modulo.includes('Zabbix')) return <Activity size={14} className="text-rose-400" />;
    if (modulo.includes('WhatsApp') || modulo.includes('WABA')) return <MessageCircle size={14} className="text-green-400" />;
    if (modulo.includes('Campanha')) return <Megaphone size={14} className="text-amber-400" />;
    return <ShieldCheck size={14} className="text-slate-400" />;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-200 overflow-y-auto">
      {/* Header Principal */}
      <div className="border-b border-white/5 bg-slate-900/80 backdrop-blur-md px-6 py-5 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  Logs de Auditoria & Conformidade
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    LGPD Art. 37 / ANATEL
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rastreamento forense, seguro e imutável de todas as ações executadas por operadores no NAP.
                </p>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setModalSimularAberto(true)}
              className="px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Hash size={14} />
              Registrar Ação
            </button>
            <button
              onClick={() => handleExportar('csv')}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download size={14} />
              Exportar CSV
            </button>
            <button
              onClick={() => handleExportar('json')}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <FileText size={14} />
              Exportar JSON
            </button>
            <button
              onClick={carregarLogs}
              disabled={refreshing}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors disabled:opacity-50"
              title="Atualizar Logs"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin text-blue-400' : ''} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Painel de Métricas de Auditoria */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-900 border border-white/5 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Total Registros</span>
              <Database size={15} className="text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1.5">{estatisticas.total}</p>
            <span className="text-[10px] text-slate-500 mt-1 block">Trilha imutável</span>
          </div>

          <div className="bg-slate-900 border border-white/5 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Acessos & Logins</span>
              <UserCheck size={15} className="text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-cyan-400 mt-1.5">{estatisticas.acessos}</p>
            <span className="text-[10px] text-slate-500 mt-1 block">Sessões autenticadas</span>
          </div>

          <div className="bg-slate-900 border border-white/5 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Alterações ERP</span>
              <Server size={15} className="text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-400 mt-1.5">{estatisticas.sgpErp}</p>
            <span className="text-[10px] text-slate-500 mt-1 block">SGP / IXC / Hubsoft</span>
          </div>

          <div className="bg-slate-900 border border-white/5 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Comandos TR-069</span>
              <Radio size={15} className="text-indigo-400" />
            </div>
            <p className="text-2xl font-bold text-indigo-400 mt-1.5">{estatisticas.genieacs}</p>
            <span className="text-[10px] text-slate-500 mt-1 block">Reboots / Wi-Fi CPE</span>
          </div>

          <div className="bg-slate-900 border border-white/5 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Disparos Ativos</span>
              <Megaphone size={15} className="text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-400 mt-1.5">{estatisticas.campanhas}</p>
            <span className="text-[10px] text-slate-500 mt-1 block">Campanhas & Régua</span>
          </div>

          <div className="bg-slate-900 border border-rose-500/20 bg-rose-500/5 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-rose-400 text-xs font-medium">
              <span>Ações Críticas</span>
              <AlertTriangle size={15} className="text-rose-400" />
            </div>
            <p className="text-2xl font-bold text-rose-400 mt-1.5">{estatisticas.criticos}</p>
            <span className="text-[10px] text-rose-400/70 mt-1 block">Requer supervisão</span>
          </div>
        </div>

        {/* Gráfico de Rosca: Distribuição de Ações por Tipo (Visão Rápida de Conformidade) */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/5">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <PieChartIcon size={16} className="text-emerald-400" />
                Distribuição de Ações por Tipo
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Visão Rápida de Conformidade
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Proporção analítica de acessos, alterações de parâmetros SGP/GenieACS e disparos de campanhas em conformidade com a LGPD e Anatel.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-medium text-slate-300">Auditoria Forense Ativa</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-4">
            {/* Gráfico de Rosca (Donut Chart) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center relative min-h-[220px]">
              <div className="w-full h-52 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <RechartsTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl text-xs">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                                <span className="font-bold text-white">{data.name}</span>
                              </div>
                              <p className="text-slate-300 font-mono">
                                <span className="text-white font-bold">{data.value}</span> {data.value === 1 ? 'registro' : 'registros'} ({data.pct}%)
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1">{data.descricao}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Pie
                      data={dadosGraficoRosca}
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={88}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="#101726"
                      strokeWidth={2}
                    >
                      {dadosGraficoRosca.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Centro da Rosca: Total de Ações */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-extrabold text-white tracking-tight font-mono">{logs.length}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ações Totais</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 text-center">
                Clique nos cartões ao lado para filtrar a tabela instantaneamente
              </span>
            </div>

            {/* Lista Interativa com Métricas e Filtros Rápidos */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {dadosDistribuicao.map((item) => {
                const Icone = item.icon;
                const estaAtivo = categoriaFiltro === item.tipoId;
                return (
                  <button
                    key={item.tipoId}
                    type="button"
                    onClick={() => {
                      if (categoriaFiltro === item.tipoId) {
                        setCategoriaFiltro('todas');
                      } else {
                        setCategoriaFiltro(item.tipoId);
                      }
                    }}
                    className={`text-left p-3.5 rounded-xl border transition-all duration-200 group relative ${
                      estaAtivo 
                        ? 'bg-white/10 border-white/30 ring-1 ring-white/20 shadow-md' 
                        : 'bg-slate-950 border-white/5 hover:border-white/15 hover:bg-slate-950/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: item.color }} 
                        />
                        <span className="font-semibold text-xs text-white group-hover:text-white transition-colors truncate">
                          {item.name}
                        </span>
                      </div>
                      <span 
                        className="text-[11px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0"
                        style={{ color: item.color, backgroundColor: `${item.color}15` }}
                      >
                        {item.pct}%
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 line-clamp-1 mb-2.5">
                      {item.descricao}
                    </p>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                      <span className="font-mono text-slate-200 font-bold">
                        {item.value} {item.value === 1 ? 'registro' : 'registros'}
                      </span>
                      <span className="text-[10px] text-slate-400 group-hover:text-blue-400 flex items-center gap-1 transition-colors">
                        {estaAtivo ? 'Filtro ativo' : 'Filtrar'}
                        <ChevronRight size={12} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="bg-slate-900 border border-white/5 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por operador, IP, ação ou detalhe..."
              className="w-full bg-slate-950 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            {/* Filtro por Módulo */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5">
              <Filter size={13} className="text-slate-400" />
              <select
                value={moduloFiltro}
                onChange={(e) => setModuloFiltro(e.target.value)}
                className="bg-transparent text-xs text-slate-300 font-medium focus:outline-none cursor-pointer"
              >
                <option value="todos" className="bg-slate-900">Todos os Módulos</option>
                <option value="Acesso" className="bg-slate-900">Acessos & Logins</option>
                <option value="SGP" className="bg-slate-900">SGP / ERP</option>
                <option value="GenieACS" className="bg-slate-900">GenieACS (TR-069)</option>
                <option value="Zabbix" className="bg-slate-900">NOC / Zabbix</option>
                <option value="WhatsApp" className="bg-slate-900">WhatsApp WABA</option>
                <option value="Campanha" className="bg-slate-900">Campanhas</option>
                <option value="Configura" className="bg-slate-900">Configurações Globais</option>
              </select>
            </div>

            {/* Filtro por Severidade */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5">
              <AlertTriangle size={13} className="text-slate-400" />
              <select
                value={severidadeFiltro}
                onChange={(e) => setSeveridadeFiltro(e.target.value)}
                className="bg-transparent text-xs text-slate-300 font-medium focus:outline-none cursor-pointer"
              >
                <option value="todas" className="bg-slate-900">Todas Severidades</option>
                <option value="info" className="bg-slate-900">Informativo</option>
                <option value="atencao" className="bg-slate-900">Atenção</option>
                <option value="critico" className="bg-slate-900">Crítico</option>
              </select>
            </div>

            {/* Filtro por Categoria */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5">
              <span className="text-xs text-slate-400">Tipo:</span>
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className="bg-transparent text-xs text-slate-300 font-medium focus:outline-none cursor-pointer"
              >
                <option value="todas" className="bg-slate-900">Todos os Tipos</option>
                <option value="acesso" className="bg-slate-900">Acessos</option>
                <option value="configuracao" className="bg-slate-900">Configurações</option>
                <option value="comando" className="bg-slate-900">Comandos</option>
                <option value="disparo" className="bg-slate-900">Disparos</option>
              </select>
            </div>

            {(busca || moduloFiltro !== 'todos' || severidadeFiltro !== 'todas' || categoriaFiltro !== 'todas') && (
              <button
                onClick={() => {
                  setBusca('');
                  setModuloFiltro('todos');
                  setSeveridadeFiltro('todas');
                  setCategoriaFiltro('todas');
                }}
                className="px-2 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                title="Limpar Filtros"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Tabela de Logs */}
        <div className="bg-slate-900 border border-white/5 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Operador</th>
                  <th className="py-3 px-4">Módulo</th>
                  <th className="py-3 px-4">Ação</th>
                  <th className="py-3 px-4">Severidade</th>
                  <th className="py-3 px-4">IP / Origem</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-400" />
                      Carregando trilha de auditoria...
                    </td>
                  </tr>
                ) : logsFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      Nenhum registro de auditoria encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  logsFiltrados.map((log) => (
                    <tr 
                      key={log.id} 
                      className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono text-slate-300 font-medium">
                          {log.data || new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {log.timestamp ? new Date(log.timestamp).toLocaleDateString('pt-BR') : 'Hoje'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {log.usuario.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white truncate max-w-[140px]">{log.usuario}</p>
                            {log.usuarioEmail && (
                              <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{log.usuarioEmail}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 text-[11px] font-medium">
                          {getModuloIcon(log.modulo)}
                          {log.modulo}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-200">{log.acao}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">{log.detalhes}</p>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {getSeveridadeBadge(log.severidade)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-white/5">
                          {log.ip}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                          title="Inspecionar Evidência Forense"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-3.5 border-t border-white/5 bg-white/[0.01] flex items-center justify-between text-xs text-slate-500">
            <span>Exibindo {logsFiltrados.length} de {logs.length} registros registrados</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px]">Integridade Criptográfica Ativa (SHA-256)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalhe Forense do Log de Auditoria */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Evidência Forense de Auditoria</h3>
                  <p className="text-xs text-slate-400 font-mono">ID: {selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Data / Hora</span>
                  <span className="text-xs font-semibold text-white mt-1 block font-mono">
                    {selectedLog.timestamp ? new Date(selectedLog.timestamp).toLocaleString('pt-BR') : selectedLog.data}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Severidade</span>
                  <div className="mt-1">{getSeveridadeBadge(selectedLog.severidade)}</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Módulo</span>
                  <span className="text-xs font-semibold text-white mt-1 block">
                    {selectedLog.modulo}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">IP de Origem</span>
                  <span className="text-xs font-mono font-semibold text-slate-300 mt-1 block">
                    {selectedLog.ip}
                  </span>
                </div>
              </div>

              {/* Informações do Operador */}
              <div className="bg-slate-950 p-4 rounded-xl border border-white/5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Identificação do Operador
                </h4>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-sm">
                    {selectedLog.usuario.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{selectedLog.usuario}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      {selectedLog.usuarioEmail && <span>Email: {selectedLog.usuarioEmail}</span>}
                      {selectedLog.usuarioRole && <span>Função: {selectedLog.usuarioRole}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ação e Descrição */}
              <div className="bg-slate-950 p-4 rounded-xl border border-white/5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Ação Executada
                </h4>
                <p className="text-sm font-semibold text-white">{selectedLog.acao}</p>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-slate-900 p-3 rounded-lg border border-white/5">
                  {selectedLog.detalhes}
                </p>
              </div>

              {/* Payloads Antes vs Depois (quando houver) */}
              {(selectedLog.payloadAntes || selectedLog.payloadDepois) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedLog.payloadAntes && (
                    <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1.5">
                        Estado Anterior (Snapshot)
                      </span>
                      <pre className="text-[11px] font-mono text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-white/5 overflow-x-auto max-h-40">
                        {JSON.stringify(selectedLog.payloadAntes, null, 2)}
                      </pre>
                    </div>
                  )}

                  {selectedLog.payloadDepois && (
                    <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1.5">
                        Estado Aplicado (Snapshot)
                      </span>
                      <pre className="text-[11px] font-mono text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-white/5 overflow-x-auto max-h-40">
                        {JSON.stringify(selectedLog.payloadDepois, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Certificado de Integridade Criptográfica */}
              <div className="bg-emerald-500/5 border border-emerald-500/20 p-3.5 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Lock size={16} className="text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-300">
                      Certificado de Não-Repúdio & Integridade
                    </p>
                    <p className="text-[10px] text-emerald-400/80 font-mono truncate max-w-md">
                      Hash SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopiar(JSON.stringify(selectedLog, null, 2), selectedLog.id)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  {copiadoId === selectedLog.id ? <Check size={13} /> : <Copy size={13} />}
                  {copiadoId === selectedLog.id ? 'Copiado!' : 'Copiar JSON'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Simulação / Registro de Evento Manual */}
      {modalSimularAberto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-blue-400" />
                <h3 className="font-bold text-white text-sm">Registrar Evento de Auditoria</h3>
              </div>
              <button 
                onClick={() => setModalSimularAberto(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSimularRegistro} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Módulo</label>
                <select
                  value={novoEvento.modulo}
                  onChange={(e) => setNovoEvento({ ...novoEvento, modulo: e.target.value as any })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="SGP / ERP">SGP / ERP (MikWeb, IXC, Hubsoft)</option>
                  <option value="GenieACS (TR-069)">GenieACS (TR-069 CWMP)</option>
                  <option value="NOC / Zabbix">NOC / Zabbix Server</option>
                  <option value="Campanhas">Campanhas & Régua de Cobrança</option>
                  <option value="WhatsApp WABA">WhatsApp WABA Cloud API</option>
                  <option value="Acessos">Acessos & Autenticação</option>
                  <option value="Configurações">Configurações Globais</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Ação Executada</label>
                <input
                  type="text"
                  value={novoEvento.acao}
                  onChange={(e) => setNovoEvento({ ...novoEvento, acao: e.target.value })}
                  placeholder="Ex: Atualização de Parâmetros de Conexão"
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Detalhes da Ação</label>
                <textarea
                  value={novoEvento.detalhes}
                  onChange={(e) => setNovoEvento({ ...novoEvento, detalhes: e.target.value })}
                  placeholder="Descreva a alteração ou comando disparado..."
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500 h-20 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Severidade</label>
                  <select
                    value={novoEvento.severidade}
                    onChange={(e) => setNovoEvento({ ...novoEvento, severidade: e.target.value as any })}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="info">Informativo</option>
                    <option value="atencao">Atenção</option>
                    <option value="critico">Crítico</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Operador</label>
                  <input
                    type="text"
                    value={novoEvento.usuario}
                    onChange={(e) => setNovoEvento({ ...novoEvento, usuario: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalSimularAberto(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors"
                >
                  Salvar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
