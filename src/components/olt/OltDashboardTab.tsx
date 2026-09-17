import React from 'react';
import {
 Server,
 Activity,
 AlertTriangle,
 CheckCircle2,
 XCircle,
 Zap,
 ArrowRight,
 RefreshCw,
 Cpu,
 Thermometer,
 ShieldCheck,
 Search
} from 'lucide-react';
import { OltDashboardMetrics, OltDevice, UnassignedOnu, OltAlarm } from '../../types/olt';

interface OltDashboardTabProps {
 metrics: OltDashboardMetrics | null;
 olts: OltDevice[];
 unassigned: UnassignedOnu[];
 alarms: OltAlarm[];
 loading: boolean;
 onRefresh: () => void;
 onSelectTab: (tabId: string) => void;
 onQuickAuthorize: (onu: UnassignedOnu) => void;
}

export const OltDashboardTab: React.FC<OltDashboardTabProps> = ({
 metrics,
 olts,
 unassigned,
 alarms,
 loading,
 onRefresh,
 onSelectTab,
 onQuickAuthorize
}) => {
 const activeAlarms = alarms.filter((a) => !a.acknowledged);

 return (
 <div className="space-y-6">
 {/* Top Bar com Ações e Status */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/60 p-4 rounded-xl border border-border">
 <div>
 <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
 <Cpu size={18} className="text-cyan-400" />
 Visão Geral das OLTs & Topologia GPON
 </h2>
 <p className="text-xs text-muted-foreground mt-0.5">
 Monitoramento em tempo real de chassis ZTE (ZXROS) e Huawei (VRP), portas PON e potência óptica de assinantes.
 </p>
 </div>

 <div className="flex items-center gap-2">
 <button
 onClick={onRefresh}
 disabled={loading}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-accent text-card-foreground text-xs font-medium border border-border transition-colors disabled:opacity-50"
 >
 <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
 Atualizar
 </button>
 <button
 onClick={() => onSelectTab('onus')}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-foreground text-xs font-medium transition-colors shadow-sm"
 >
 <Search size={13} />
 Buscar ONU / Assinante
 </button>
 </div>
 </div>

 {/* Grid de Cards de Estatísticas Principais */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {/* OLTs */}
 <div
 onClick={() => onSelectTab('olts')}
 className="cursor-pointer bg-card/80 p-4 rounded-xl border border-border hover:border-border transition-all hover:bg-slate-850 group"
 >
 <div className="flex items-center justify-between mb-2">
 <span className="text-xs font-medium text-muted-foreground">OLTs em Produção</span>
 <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
 <Server size={18} />
 </div>
 </div>
 <div className="flex items-baseline gap-2">
 <span className="text-2xl font-bold text-foreground">{metrics?.olts.total ?? olts.length}</span>
 <span className="text-xs text-emerald-400 font-medium">
 {metrics?.olts.online ?? olts.filter((o) => o.status === 'online').length} online
 </span>
 </div>
 <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
 <span>ZTE C300 / Huawei MA5800</span>
 <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform text-cyan-400" />
 </div>
 </div>

 {/* ONUs Online */}
 <div
 onClick={() => onSelectTab('onus')}
 className="cursor-pointer bg-card/80 p-4 rounded-xl border border-border hover:border-border transition-all hover:bg-slate-850 group"
 >
 <div className="flex items-center justify-between mb-2">
 <span className="text-xs font-medium text-muted-foreground">ONUs / Assinantes Conectados</span>
 <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
 <CheckCircle2 size={18} />
 </div>
 </div>
 <div className="flex items-baseline gap-2">
 <span className="text-2xl font-bold text-emerald-400">{metrics?.onus.online ?? 0}</span>
 <span className="text-xs text-muted-foreground">de {metrics?.onus.total ?? 0} totais</span>
 </div>
 <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
 <span>Taxa de Ativação: {metrics?.onus.total ? Math.round((metrics.onus.online / metrics.onus.total) * 100) : 100}%</span>
 <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform text-emerald-400" />
 </div>
 </div>

 {/* ONUs Não Provisionadas (Descoberta Automática) */}
 <div
 onClick={() => onSelectTab('unassigned')}
 className="cursor-pointer bg-card/80 p-4 rounded-xl border border-border hover:border-border transition-all hover:bg-slate-850 group"
 >
 <div className="flex items-center justify-between mb-2">
 <span className="text-xs font-medium text-muted-foreground">ONUs Descobertas (Pendentes)</span>
 <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
 <Zap size={18} />
 </div>
 </div>
 <div className="flex items-baseline gap-2">
 <span className="text-2xl font-bold text-amber-400">{unassigned.length}</span>
 <span className="text-xs text-amber-500/80 font-medium">Aguardando Autorização</span>
 </div>
 <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
 <span>Auto-detectadas na fibra</span>
 <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform text-amber-400" />
 </div>
 </div>

 {/* Alarmes Ativos */}
 <div
 onClick={() => onSelectTab('alarms')}
 className="cursor-pointer bg-card/80 p-4 rounded-xl border border-border hover:border-border transition-all hover:bg-slate-850 group"
 >
 <div className="flex items-center justify-between mb-2">
 <span className="text-xs font-medium text-muted-foreground">Alarmes Ópticos (NOC)</span>
 <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
 <AlertTriangle size={18} />
 </div>
 </div>
 <div className="flex items-baseline gap-2">
 <span className="text-2xl font-bold text-rose-400">{activeAlarms.length}</span>
 <span className="text-xs text-muted-foreground">
 {activeAlarms.filter((a) => a.severidade === 'critical').length} críticos
 </span>
 </div>
 <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
 <span>LOS, LOF ou Alta Atenuação</span>
 <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform text-rose-400" />
 </div>
 </div>
 </div>

 {/* Seção Central: Status dos Chassis e ONUs Recém Descobertas */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Chassis OLTs Cadastradas */}
 <div className="lg:col-span-2 bg-card/80 rounded-xl border border-border p-5 space-y-4">
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
 <Server size={16} className="text-cyan-400" />
 Chassis OLT em Operação
 </h3>
 <button
 onClick={() => onSelectTab('olts')}
 className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
 >
 Gerenciar OLTs
 <ArrowRight size={12} />
 </button>
 </div>

 <div className="space-y-3">
 {olts.map((olt) => (
 <div
 key={olt.id}
 className="p-4 rounded-lg bg-muted/40 border border-border hover:border-border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
 >
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <span className="font-semibold text-sm text-foreground">{olt.nome}</span>
 <span
 className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
 olt.fabricante === 'ZTE'
 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
 : 'bg-red-500/10 text-red-400 border border-red-500/20'
 }`}
 >
 {olt.fabricante} {olt.modelo}
 </span>
 <span
 className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
 olt.status === 'online'
 ? 'bg-emerald-500/10 text-emerald-400'
 : 'bg-rose-500/10 text-rose-400'
 }`}
 >
 <span className={`w-1.5 h-1.5 rounded-full ${olt.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
 {olt.status.toUpperCase()}
 </span>
 </div>
 <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3">
 <span>IP: <strong className="text-muted-foreground">{olt.ip}:{olt.porta}</strong></span>
 <span>•</span>
 <span>POP: <strong className="text-muted-foreground">{olt.pop || 'Principal'}</strong></span>
 <span>•</span>
 <span>Firmware: <strong className="text-muted-foreground">{olt.versao_firmware || 'N/A'}</strong></span>
 </div>
 </div>

 <div className="flex items-center gap-4 text-xs">
 <div className="flex items-center gap-1 text-muted-foreground" title="Uso de Processador">
 <Cpu size={14} className="text-muted-foreground" />
 <span>{olt.cpu_usage ?? 20}%</span>
 </div>
 <div className="flex items-center gap-1 text-muted-foreground" title="Temperatura Térmica">
 <Thermometer size={14} className="text-amber-400" />
 <span>{olt.temperatura ?? 40}°C</span>
 </div>
 <div className="text-right">
 <div className="text-xs font-semibold text-foreground">
 {olt.onus_online ?? 0} / {olt.total_onus ?? 0} ONUs
 </div>
 <div className="text-[10px] text-muted-foreground">{olt.total_pons ?? 0} portas PON</div>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* ONUs Não Autorizadas / Descoberta Automática */}
 <div className="bg-card/80 rounded-xl border border-border p-5 space-y-4 flex flex-col justify-between">
 <div>
 <div className="flex items-center justify-between mb-3">
 <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
 <Zap size={16} className="text-amber-400" />
 Descoberta Automática
 </h3>
 <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400">
 {unassigned.length} pendentes
 </span>
 </div>
 <p className="text-xs text-muted-foreground mb-3">
 ONUs conectadas fisicamente aos splitters que ainda não possuem cadastro e VLAN autorizada.
 </p>

 <div className="space-y-2">
 {unassigned.length === 0 ? (
 <div className="py-8 text-center text-xs text-muted-foreground">
 <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500/60" />
 Nenhuma ONU pendente de autorização no momento.
 </div>
 ) : (
 unassigned.slice(0, 3).map((u) => (
 <div
 key={u.id}
 className="p-3 rounded-lg bg-muted/50 border border-border/60 flex items-center justify-between gap-2"
 >
 <div>
 <div className="font-mono text-xs font-bold text-foreground">{u.serial}</div>
 <div className="text-[11px] text-muted-foreground">
 {u.olt_nome} • PON {u.pon_identifier}
 </div>
 <div className="text-[10px] text-muted-foreground">
 Sinal RX: <strong className="text-emerald-400">{u.sinal_rx} dBm</strong>
 </div>
 </div>
 <button
 onClick={() => onQuickAuthorize(u)}
 className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-colors shadow"
 >
 Provisionar
 </button>
 </div>
 ))
 )}
 </div>
 </div>

 {unassigned.length > 3 && (
 <button
 onClick={() => onSelectTab('unassigned')}
 className="mt-3 w-full py-2 rounded-lg bg-muted hover:bg-accent text-muted-foreground text-xs font-medium text-center transition-colors"
 >
 Ver todas as {unassigned.length} ONUs descobertas
 </button>
 )}
 </div>
 </div>

 {/* Régua de Qualidade de Atenuação Óptica & Boas Práticas */}
 <div className="bg-card/60 rounded-xl border border-border p-4">
 <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2">
 <ShieldCheck size={15} className="text-cyan-400" />
 Escala de Atenuação Óptica GPON (Padrão ITU-T G.984 & Boas Práticas)
 </h4>
 <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
 <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
 <div className="font-bold text-sm">-15 dBm a -24 dBm</div>
 <div className="text-[11px] text-emerald-300/80 mt-0.5">Excelente: Operação ideal sem perdas</div>
 </div>
 <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
 <div className="font-bold text-sm">-24.1 dBm a -26.9 dBm</div>
 <div className="text-[11px] text-blue-300/80 mt-0.5">Bom: Estável, dentro da margem de projeto</div>
 </div>
 <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
 <div className="font-bold text-sm">-27 dBm a -28.9 dBm</div>
 <div className="text-[11px] text-amber-300/80 mt-0.5">Alerta: Atenuação alta (curvatura ou emenda suja)</div>
 </div>
 <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
 <div className="font-bold text-sm">&lt; -29 dBm ou LOS</div>
 <div className="text-[11px] text-rose-300/80 mt-0.5">Crítico / Inoperante: Drop quebrado ou conector danificado</div>
 </div>
 </div>
 </div>
 </div>
 );
};
