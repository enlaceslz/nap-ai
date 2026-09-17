import React, { useState, useEffect } from 'react';
import {
 Server,
 Cpu,
 Activity,
 AlertTriangle,
 Zap,
 Users,
 Sliders,
 RefreshCw,
 Plus,
 Search,
 CheckCircle2,
 ShieldCheck
} from 'lucide-react';
import { oltApi } from '../services/oltApi';
import {
 OltDevice,
 OnuDevice,
 UnassignedOnu,
 OltAlarm,
 OltDashboardMetrics
} from '../types/olt';

import { OltDashboardTab } from '../components/olt/OltDashboardTab';
import { OltDevicesTab } from '../components/olt/OltDevicesTab';
import { OnuManagementTab } from '../components/olt/OnuManagementTab';
import { OltAlarmsTab } from '../components/olt/OltAlarmsTab';
import { OnuProvisioningModal } from '../components/olt/OnuProvisioningModal';
import { OnuBatchActionsModal } from '../components/olt/OnuBatchActionsModal';
import { OltCreateModal } from '../components/olt/OltCreateModal';


const getVendorBadgeClasses = (vendor: string) => {
 switch (vendor) {
 case 'ZTE': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
 case 'HUAWEI': return 'text-red-400 bg-red-500/10 border-red-500/20';
 case 'VSOL': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
 case 'DATACOM': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
 default: return 'text-muted-foreground bg-slate-500/10 border-slate-500/20';
 }
};

export default function OltManagement() {
 const [activeTab, setActiveTab] = useState<'dashboard' | 'olts' | 'onus' | 'unassigned' | 'alarms'>('dashboard');

 // Estados de dados
 const [metrics, setMetrics] = useState<OltDashboardMetrics | null>(null);
 const [olts, setOlts] = useState<OltDevice[]>([]);
 const [onus, setOnus] = useState<OnuDevice[]>([]);
 const [unassigned, setUnassigned] = useState<UnassignedOnu[]>([]);
 const [alarms, setAlarms] = useState<OltAlarm[]>([]);
 const [loading, setLoading] = useState(true);

 // Estados de Modais
 const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
 const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
 const [isOltCreateModalOpen, setIsOltCreateModalOpen] = useState(false);
 const [oltToEdit, setOltToEdit] = useState<OltDevice | null>(null);
 const [initialUnassignedOnu, setInitialUnassignedOnu] = useState<UnassignedOnu | null>(null);
 const [batchSelectedIds, setBatchSelectedIds] = useState<string[]>([]);

 const loadAllData = async () => {
 setLoading(true);
 try {
 const [metricsData, oltsData, onusData, unassignedData, alarmsData] = await Promise.all([
 oltApi.getDashboardMetrics(),
 oltApi.getOlts(),
 oltApi.getOnus(),
 oltApi.getUnassignedOnus(),
 oltApi.getAlarms()
 ]);

 setMetrics(metricsData);
 setOlts(oltsData);
 setOnus(onusData);
 setUnassigned(unassignedData);
 setAlarms(alarmsData);
 } catch (err) {
 console.error('Erro ao carregar dados de OLT:', err);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 loadAllData();
 }, []);

 const handleQuickAuthorize = (u: UnassignedOnu) => {
 setInitialUnassignedOnu(u);
 setIsProvisionModalOpen(true);
 };

 const handleOpenEditOlt = (olt: OltDevice) => {
 setOltToEdit(olt);
 setIsOltCreateModalOpen(true);
 };

 const handleOpenBatchModal = (selectedIds: string[]) => {
 setBatchSelectedIds(selectedIds);
 setIsBatchModalOpen(true);
 };

 const unassignedCount = unassigned.length;
 const criticalAlarmsCount = alarms.filter((a) => a.severidade === 'critical' && !a.acknowledged).length;

 return (
 <div className="p-6 max-w-7xl mx-auto space-y-6">
 {/* Header da Página */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <div className="flex items-center gap-2">
 <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
 <Cpu size={22} className="text-cyan-400" />
 Gestão de OLTs & Redes Ópticas (GPON)
 </h1>
 <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase">
 Multivendor ZTE & Huawei
 </span>
 </div>
 <p className="text-xs text-muted-foreground mt-1">
 Provisionamento direto via CLI, monitoramento de potência óptica (RX/TX dBm), detecção de LOS e descoberta automática de ONTs.
 </p>
 </div>

 <div className="flex items-center gap-2">
 <button
 onClick={() => {
 setOltToEdit(null);
 setIsOltCreateModalOpen(true);
 }}
 className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted hover:bg-accent text-card-foreground text-xs font-semibold border border-border transition-colors"
 >
 <Plus size={14} />
 Cadastrar OLT
 </button>
 <button
 onClick={() => {
 setInitialUnassignedOnu(null);
 setIsProvisionModalOpen(true);
 }}
 className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-foreground text-xs font-semibold transition-colors shadow-sm"
 >
 <Zap size={14} />
 Provisionar ONU
 </button>
 </div>
 </div>

 {/* Navegação por Abas */}
 <div className="flex items-center gap-1 bg-card/60 p-1 rounded-xl border border-border overflow-x-auto">
 <button
 onClick={() => setActiveTab('dashboard')}
 className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
 activeTab === 'dashboard'
 ? 'bg-cyan-600 text-foreground shadow-sm'
 : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
 }`}
 >
 <Activity size={15} />
 Visão Geral
 </button>

 <button
 onClick={() => setActiveTab('olts')}
 className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
 activeTab === 'olts'
 ? 'bg-cyan-600 text-foreground shadow-sm'
 : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
 }`}
 >
 <Server size={15} />
 OLTs Cadastradas ({olts.length})
 </button>

 <button
 onClick={() => setActiveTab('onus')}
 className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
 activeTab === 'onus'
 ? 'bg-cyan-600 text-foreground shadow-sm'
 : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
 }`}
 >
 <Users size={15} />
 Clientes Ópticos ({onus.length})
 </button>

 <button
 onClick={() => setActiveTab('unassigned')}
 className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
 activeTab === 'unassigned'
 ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
 : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
 }`}
 >
 <Zap size={15} />
 Descobertas Pendentes
 {unassignedCount > 0 && (
 <span
 className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
 activeTab === 'unassigned' ? 'bg-background text-amber-400' : 'bg-amber-500 text-slate-950'
 }`}
 >
 {unassignedCount}
 </span>
 )}
 </button>

 <button
 onClick={() => setActiveTab('alarms')}
 className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
 activeTab === 'alarms'
 ? 'bg-rose-600 text-white shadow-sm'
 : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
 }`}
 >
 <AlertTriangle size={15} />
 Alarmes Ópticos (NOC)
 {criticalAlarmsCount > 0 && (
 <span
 className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
 activeTab === 'alarms' ? 'bg-card text-rose-600' : 'bg-rose-500 text-white'
 }`}
 >
 {criticalAlarmsCount}
 </span>
 )}
 </button>
 </div>

 {/* Conteúdo da Aba Ativa */}
 <div>
 {activeTab === 'dashboard' && (
 <OltDashboardTab
 metrics={metrics}
 olts={olts}
 unassigned={unassigned}
 alarms={alarms}
 loading={loading}
 onRefresh={loadAllData}
 onSelectTab={(tabId) => setActiveTab(tabId as any)}
 onQuickAuthorize={handleQuickAuthorize}
 />
 )}

 {activeTab === 'olts' && (
 <OltDevicesTab
 olts={olts}
 loading={loading}
 onRefresh={loadAllData}
 onOpenCreateModal={() => {
 setOltToEdit(null);
 setIsOltCreateModalOpen(true);
 }}
 onEditOlt={handleOpenEditOlt}
 />
 )}

 {activeTab === 'onus' && (
 <OnuManagementTab
 onus={onus}
 loading={loading}
 onRefresh={loadAllData}
 onOpenAuthorizeModal={() => {
 setInitialUnassignedOnu(null);
 setIsProvisionModalOpen(true);
 }}
 onOpenBatchModal={handleOpenBatchModal}
 />
 )}

 {activeTab === 'unassigned' && (
 <div className="space-y-6">
 <div className="bg-card/60 p-4 rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
 <Zap size={18} className="text-amber-400" />
 ONUs Descobertas Automaticamente (Auto-Find)
 </h2>
 <p className="text-xs text-muted-foreground mt-0.5">
 Equipamentos conectados nas portas PON da OLT emitindo sinal óptico mas ainda não vinculados a clientes.
 </p>
 </div>
 <button
 onClick={loadAllData}
 disabled={loading}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-accent text-card-foreground text-xs font-medium border border-border transition-colors"
 >
 <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
 Buscar Novas ONUs
 </button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {unassigned.length === 0 ? (
 <div className="col-span-full py-16 text-center text-muted-foreground bg-card/60 rounded-xl border border-border">
 <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500/60" />
 <p className="text-sm font-semibold text-muted-foreground">Todas as ONUs da rede estão devidamente autorizadas!</p>
 <p className="text-xs text-muted-foreground mt-1">Nenhum equipamento não provisionado detectado nos splitters.</p>
 </div>
 ) : (
 unassigned.map((u) => (
 <div
 key={u.id}
 className="p-4 rounded-xl bg-card/90 border border-border hover:border-border transition-all space-y-3 shadow-md"
 >
 <div className="flex items-center justify-between">
 <span className="font-mono text-sm font-bold text-foreground">{u.serial}</span>
 <span
 className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
 getVendorBadgeClasses(u.fabricante_olt || '')
 }`}
 >
 {u.fabricante_olt}
 </span>
 </div>

 <div className="space-y-1 text-xs text-muted-foreground">
 <div>OLT: <strong className="text-card-foreground">{u.olt_nome}</strong></div>
 <div>Interface PON: <strong className="text-cyan-400 font-mono">{u.pon_identifier}</strong></div>
 <div>Sinal RX: <strong className="text-emerald-400 font-mono">{u.sinal_rx} dBm</strong></div>
 {u.modelo_estimado && <div>Modelo: <strong className="text-muted-foreground">{u.modelo_estimado}</strong></div>}
 <div className="text-[10px] text-muted-foreground">
 Detectada em: {new Date(u.descoberto_em).toLocaleString('pt-BR')}
 </div>
 </div>

 <div className="pt-2 border-t border-border/80 flex justify-end">
 <button
 onClick={() => handleQuickAuthorize(u)}
 className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow"
 >
 Autorizar / Provisionar Cliente
 </button>
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 )}

 {activeTab === 'alarms' && (
 <OltAlarmsTab
 alarms={alarms}
 olts={olts}
 loading={loading}
 onRefresh={loadAllData}
 />
 )}
 </div>

 {/* Modais */}
 <OnuProvisioningModal
 isOpen={isProvisionModalOpen}
 onClose={() => {
 setIsProvisionModalOpen(false);
 setInitialUnassignedOnu(null);
 }}
 olts={olts}
 unassigned={unassigned}
 initialUnassigned={initialUnassignedOnu}
 onSuccess={loadAllData}
 />

 <OnuBatchActionsModal
 isOpen={isBatchModalOpen}
 onClose={() => setIsBatchModalOpen(false)}
 selectedIds={batchSelectedIds}
 onSuccess={loadAllData}
 />

 <OltCreateModal
 isOpen={isOltCreateModalOpen}
 onClose={() => {
 setIsOltCreateModalOpen(false);
 setOltToEdit(null);
 }}
 oltToEdit={oltToEdit}
 onSuccess={loadAllData}
 />
 </div>
 );
}
