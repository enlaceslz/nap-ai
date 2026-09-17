import React, { useState } from 'react';
import {
 AlertTriangle,
 CheckCircle2,
 RefreshCw,
 ShieldAlert,
 Server,
 Zap,
 Wrench,
 Clock,
 Cpu
} from 'lucide-react';
import { OltAlarm, OltDevice } from '../../types/olt';
import { oltApi } from '../../services/oltApi';

interface OltAlarmsTabProps {
 alarms: OltAlarm[];
 olts: OltDevice[];
 loading: boolean;
 onRefresh: () => void;
}

export const OltAlarmsTab: React.FC<OltAlarmsTabProps> = ({
 alarms,
 olts,
 loading,
 onRefresh
}) => {
 const [selectedOltId, setSelectedOltId] = useState('all');
 const [severityFilter, setSeverityFilter] = useState('all');
 const [ackLoading, setAckLoading] = useState<string | null>(null);

 const handleAck = async (alarmId: string) => {
 setAckLoading(alarmId);
 try {
 await oltApi.acknowledgeAlarm(alarmId);
 onRefresh();
 } catch (err: any) {
 alert('Erro ao reconhecer alarme: ' + err.message);
 } finally {
 setAckLoading(null);
 }
 };

 const filteredAlarms = alarms.filter((a) => {
 if (selectedOltId !== 'all' && a.olt_id !== selectedOltId) return false;
 if (severityFilter !== 'all' && a.severidade !== severityFilter) return false;
 return true;
 });

 const getSeverityBadge = (severity: string) => {
 switch (severity) {
 case 'critical':
 return (
 <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase">
 Crítico
 </span>
 );
 case 'major':
 return (
 <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
 Grave
 </span>
 );
 case 'minor':
 return (
 <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 uppercase">
 Moderado
 </span>
 );
 default:
 return (
 <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
 Informativo
 </span>
 );
 }
 };

 return (
 <div className="space-y-6">
 {/* Header com Filtros */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/60 p-4 rounded-xl border border-border">
 <div>
 <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
 <AlertTriangle size={18} className="text-rose-400" />
 Central de Alarmes Ópticos (NOC)
 </h2>
 <p className="text-xs text-muted-foreground mt-0.5">
 Detecção imediata de rompimento físico (LOS), alta atenuação óptica e falhas de alimentação em ONTs.
 </p>
 </div>

 <div className="flex items-center gap-2">
 <button
 onClick={onRefresh}
 disabled={loading}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-accent text-card-foreground text-xs font-medium border border-border transition-colors"
 >
 <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
 Atualizar
 </button>
 </div>
 </div>

 {/* Barra de Filtros */}
 <div className="flex flex-wrap items-center gap-3 bg-card/40 p-3 rounded-xl border border-border text-xs">
 <div className="flex items-center gap-2">
 <span className="text-muted-foreground">Filtrar por OLT:</span>
 <select
 value={selectedOltId}
 onChange={(e) => setSelectedOltId(e.target.value)}
 className="px-2.5 py-1.5 rounded-lg bg-background border border-border text-card-foreground text-xs focus:outline-none focus:border-cyan-500"
 >
 <option value="all">Todas as OLTs</option>
 {olts.map((olt) => (
 <option key={olt.id} value={olt.id}>
 {olt.nome}
 </option>
 ))}
 </select>
 </div>

 <div className="flex items-center gap-2">
 <span className="text-muted-foreground">Severidade:</span>
 <select
 value={severityFilter}
 onChange={(e) => setSeverityFilter(e.target.value)}
 className="px-2.5 py-1.5 rounded-lg bg-background border border-border text-card-foreground text-xs focus:outline-none focus:border-cyan-500"
 >
 <option value="all">Todas</option>
 <option value="critical">Crítico (LOS)</option>
 <option value="major">Grave</option>
 <option value="minor">Moderado (Atenuação)</option>
 </select>
 </div>
 </div>

 {/* Lista de Alarmes */}
 <div className="space-y-3">
 {filteredAlarms.length === 0 ? (
 <div className="py-16 text-center text-muted-foreground bg-card/60 rounded-xl border border-border">
 <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500/60" />
 <p className="text-sm font-semibold text-muted-foreground">Nenhum alarme óptico pendente!</p>
 <p className="text-xs text-muted-foreground mt-1">Todos os enlaces e portas PON operando dentro da margem ideal.</p>
 </div>
 ) : (
 filteredAlarms.map((alarm) => {
 const isBusy = ackLoading === alarm.id;

 return (
 <div
 key={alarm.id}
 className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
 alarm.acknowledged
 ? 'bg-card/30 border-border/60 opacity-60'
 : 'bg-card/90 border-border hover:border-border shadow-md'
 }`}
 >
 <div className="space-y-2">
 <div className="flex flex-wrap items-center gap-2">
 {getSeverityBadge(alarm.severidade)}
 <span className="font-mono text-xs font-bold text-foreground">
 [{alarm.tipo}]
 </span>
 <span className="text-xs text-muted-foreground">•</span>
 <span className="text-xs font-semibold text-muted-foreground">
 {alarm.olt_nome}
 </span>
 {alarm.pon_identifier && (
 <span className="text-xs text-cyan-400 font-mono">
 (PON {alarm.pon_identifier})
 </span>
 )}
 {alarm.acknowledged && (
 <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground">
 Reconhecido
 </span>
 )}
 </div>

 <p className="text-xs text-card-foreground">
 {alarm.descricao}
 </p>

 <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
 <span className="flex items-center gap-1">
 <Clock size={11} />
 {new Date(alarm.timestamp).toLocaleString('pt-BR')}
 </span>
 {alarm.onu_serial && (
 <span className="font-mono text-muted-foreground">
 Serial ONT: <strong>{alarm.onu_serial}</strong>
 </span>
 )}
 </div>
 </div>

 {/* Ações */}
 <div className="flex items-center gap-2 self-end sm:self-center">
 {!alarm.acknowledged && (
 <button
 onClick={() => handleAck(alarm.id)}
 disabled={isBusy}
 className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted hover:bg-accent text-card-foreground text-xs font-semibold border border-border transition-colors disabled:opacity-50"
 >
 <CheckCircle2 size={13} className={isBusy ? 'animate-spin' : 'text-emerald-400'} />
 {isBusy ? 'Gravando...' : 'Reconhecer (ACK)'}
 </button>
 )}
 </div>
 </div>
 );
 })
 )}
 </div>
 </div>
 );
};
