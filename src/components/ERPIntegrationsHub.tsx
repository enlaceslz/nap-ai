import React, { useState, useEffect } from 'react';
import { 
 Database, Server, CheckCircle2, AlertTriangle, RefreshCw, 
 ExternalLink, ShieldCheck, Zap, Lock, Eye, EyeOff, Radio, 
 Check, ArrowRight, BookOpen, Clock, Activity, Wifi, FileText,
 Sliders, Cpu, Sparkles, HelpCircle, Loader2, Save
} from 'lucide-react';
import { useConfig, SupportedErp } from '../contexts/ConfigContext';
import ApiValidationCard from './ApiValidationCard';
import ErpPingBadge from './ErpPingBadge';
import { useErpPingMonitor } from '../hooks/useErpPingMonitor';

interface ErpCatalogoItem {
 id: SupportedErp;
 nome: string;
 sigla: string;
 categoria: string;
 protocolo: string;
 corBadge: string;
 versaoApiHomologada: string;
 docUrl: string;
 descricao: string;
 campos: Array<{
 key: string;
 label: string;
 placeholder: string;
 tipo: string;
 obrigatorio: boolean;
 ajuda: string;
 }>;
 recursos: string[];
 passoAPasso: string[];
 ativo?: boolean;
 config?: any;
}

interface TestChecklistItem {
 id: string;
 item: string;
 status: 'ok' | 'alerta' | 'erro';
 mensagem: string;
}

interface TestResult {
 sucesso: boolean;
 erpId: string;
 nomeErp: string;
 protocolo: string;
 versaoApiDetectada: string;
 latenciaMs: number;
 statusGeral: string;
 checklist: TestChecklistItem[];
 exemploSincronizado: any;
 mensagem: string;
}

export default function ERPIntegrationsHub() {
 const { config: globalConfig, updateConfig } = useConfig();
 const [activeSubTab, setActiveSubTab] = useState<'validador' | 'conectores' | 'configuracao' | 'documentacao'>('validador');
 const [selectedErpId, setSelectedErpId] = useState<SupportedErp>('sgp');
 const [erpsList, setErpsList] = useState<ErpCatalogoItem[]>([]);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [testing, setTesting] = useState(false);
 const [testResult, setTestResult] = useState<TestResult | null>(null);
 const [showTokens, setShowTokens] = useState<{ [key: string]: boolean }>({});
 const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

 // Monitoramento de latência e ping em tempo real dos provedores
 const { 
 pings, 
 loading: pingsLoading, 
 pingingSpecific, 
 refreshAll: refreshAllPings, 
 pingSingle 
 } = useErpPingMonitor(10000);

 // Formulário local do ERP selecionado
 const [formData, setFormData] = useState<any>({
 urlBase: '',
 token: '',
 appId: '',
 clientId: '',
 clientSecret: '',
 usuarioId: '',
 provedorId: '',
 autoDesbloqueio48h: true,
 avisoSonoroInadimplente: true,
 habilitarConsultaRadius: true,
 syncIntervalMinutes: 15
 });

 // Carregar catálogo de ERPs do backend
 const carregarErps = async () => {
 try {
 setLoading(true);
 const res = await fetch('/api/integracoes/erp');
 if (res.ok) {
 const data = await res.json();
 if (data.erps) {
 setErpsList(data.erps);
 const ativo = data.erpAtivo || 'sgp';
 setSelectedErpId(ativo);
 
 // Preenche formData do ERP ativo
 const erpAtivoObj = data.erps.find((e: any) => e.id === ativo);
 if (erpAtivoObj && erpAtivoObj.config) {
 setFormData({
 urlBase: erpAtivoObj.config.urlBase || '',
 token: erpAtivoObj.config.token || '',
 appId: erpAtivoObj.config.appId || '',
 clientId: erpAtivoObj.config.clientId || '',
 clientSecret: erpAtivoObj.config.clientSecret || '',
 usuarioId: erpAtivoObj.config.usuarioId || '',
 provedorId: erpAtivoObj.config.provedorId || '',
 autoDesbloqueio48h: erpAtivoObj.config.autoDesbloqueio48h !== false,
 avisoSonoroInadimplente: Boolean(erpAtivoObj.config.avisoSonoroInadimplente),
 habilitarConsultaRadius: erpAtivoObj.config.habilitarConsultaRadius !== false,
 syncIntervalMinutes: erpAtivoObj.config.syncIntervalMinutes || 15
 });
 }
 }
 }
 } catch (err) {
 console.error('Erro ao buscar ERPs:', err);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 carregarErps();
 }, []);

 // Ao trocar de ERP na lista, preenche o formulário com a configuração do ERP selecionado
 const handleSelectErp = (erpId: SupportedErp, mudarAba: boolean = false) => {
 setSelectedErpId(erpId);
 setTestResult(null);
 const encontrado = erpsList.find(e => e.id === erpId);
 if (encontrado && encontrado.config) {
 setFormData({
 urlBase: encontrado.config.urlBase || '',
 token: encontrado.config.token || '',
 appId: encontrado.config.appId || '',
 clientId: encontrado.config.clientId || '',
 clientSecret: encontrado.config.clientSecret || '',
 usuarioId: encontrado.config.usuarioId || '',
 provedorId: encontrado.config.provedorId || '',
 autoDesbloqueio48h: encontrado.config.autoDesbloqueio48h !== false,
 avisoSonoroInadimplente: Boolean(encontrado.config.avisoSonoroInadimplente),
 habilitarConsultaRadius: encontrado.config.habilitarConsultaRadius !== false,
 syncIntervalMinutes: encontrado.config.syncIntervalMinutes || 15
 });
 } else {
 // Padrão default
 setFormData({
 urlBase: '',
 token: '',
 appId: '',
 clientId: '',
 clientSecret: '',
 usuarioId: '',
 provedorId: '',
 autoDesbloqueio48h: true,
 avisoSonoroInadimplente: true,
 habilitarConsultaRadius: true,
 syncIntervalMinutes: 15
 });
 }
 if (mudarAba) {
 setActiveSubTab('configuracao');
 }
 };

 const showToast = (type: 'success' | 'error', text: string) => {
 setToastMessage({ type, text });
 setTimeout(() => setToastMessage(null), 4500);
 };

 // Salvar credenciais do ERP selecionado
 const handleSalvar = async () => {
 setSaving(true);
 try {
 const res = await fetch('/api/integracoes/erp/salvar', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 erpId: selectedErpId,
 config: formData
 })
 });
 const data = await res.json();
 if (data.sucesso) {
 showToast('success', data.mensagem || 'Configurações do ERP salvas com sucesso!');
 await carregarErps();
 } else {
 showToast('error', data.erro || 'Falha ao salvar configurações.');
 }
 } catch (err: any) {
 showToast('error', err.message || 'Erro de conexão com o servidor.');
 } finally {
 setSaving(false);
 }
 };

 // Ativar o ERP selecionado como o principal do provedor
 const handleAtivarErp = async (erpId: SupportedErp) => {
 try {
 const res = await fetch('/api/integracoes/erp/ativar', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ erpId })
 });
 const data = await res.json();
 if (data.sucesso) {
 showToast('success', data.mensagem || `ERP ${erpId.toUpperCase()} ativado com sucesso!`);
 await carregarErps();
 } else {
 showToast('error', data.erro || 'Falha ao ativar ERP.');
 }
 } catch (err: any) {
 showToast('error', err.message || 'Erro ao comunicar com o servidor.');
 }
 };

 // Testar e validar a pré-configuração em tempo real
 const handleTestarPreConfiguracao = async () => {
 setTesting(true);
 setTestResult(null);
 try {
 const res = await fetch('/api/integracoes/erp/testar', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 erpId: selectedErpId,
 config: formData
 })
 });
 const data = await res.json();
 if (data.sucesso) {
 setTestResult(data);
 showToast('success', `Pré-configuração com ${data.nomeErp} validada com sucesso! (${data.latenciaMs}ms)`);
 } else {
 showToast('error', data.erro || 'Erro ao validar pré-configuração.');
 }
 } catch (err: any) {
 showToast('error', err.message || 'Falha na validação de rede.');
 } finally {
 setTesting(false);
 }
 };

 const erpAtivoAtual = erpsList.find(e => e.ativo);
 const erpSelecionadoObj = erpsList.find(e => e.id === selectedErpId) || erpsList[0];

 if (loading && erpsList.length === 0) {
 return (
 <div className="p-12 flex flex-col items-center justify-center text-muted-foreground space-y-3">
 <Loader2 size={32} className="animate-spin text-blue-500" />
 <p className="text-xs font-semibold">Carregando catálogo de integrações ERP...</p>
 </div>
 );
 }

 return (
 <div className="space-y-6">
 {/* Toast Notification */}
 {toastMessage && (
 <div className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${
 toastMessage.type === 'success' 
 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
 : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
 }`}>
 <div className="flex items-center gap-2">
 {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
 <span>{toastMessage.text}</span>
 </div>
 <button onClick={() => setToastMessage(null)} className="text-xs font-bold underline ml-4 hover:opacity-80">Fechar</button>
 </div>
 )}

 {/* Banner de Contexto Multi-ERP */}
 <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-[#101726] to-indigo-950/30 border border-blue-500/20 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
 <div className="space-y-1">
 <div className="flex items-center gap-2.5">
 <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
 <Server size={18} />
 </div>
 <div>
 <h3 className="text-base font-bold text-foreground flex items-center gap-2">
 Conectividade Multi-ERP Telecom
 <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
 7 Sistemas Homologados
 </span>
 </h3>
 <p className="text-xs text-muted-foreground">
 O DJD conecta de forma nativa ao ERP do seu provedor para sincronizar assinantes, gerar PIX, consultar radius e liberar conexões em confiança.
 </p>
 </div>
 </div>
 </div>

 {/* Badge do ERP Ativo */}
 {erpAtivoAtual && (
 <div className="flex items-center gap-3 bg-background px-4 py-2.5 rounded-xl border border-border shrink-0">
 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
 <div>
 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">ERP Ativo no DJD</span>
 <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
 {erpAtivoAtual.nome}
 <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono">
 {erpAtivoAtual.protocolo}
 </span>
 </span>
 </div>
 </div>
 )}
 </div>

 {/* Navegação entre Sub-Abas */}
 <div className="flex flex-wrap border-b border-border bg-background rounded-xl p-1 gap-1">
 <button
 type="button"
 id="btn-subtab-validador-erp"
 onClick={() => setActiveSubTab('validador')}
 className={`flex-1 min-w-[200px] py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
 activeSubTab === 'validador'
 ? 'bg-blue-600 text-white shadow'
 : 'text-muted-foreground hover:text-foreground hover:bg-accent'
 }`}
 >
 <Zap size={15} className={activeSubTab === 'validador' ? 'text-foreground' : 'text-amber-400'} />
 <span>Validador de API (IXC • Hubsoft • MikWeb)</span>
 </button>

 <button
 type="button"
 id="btn-subtab-conectores-erp"
 onClick={() => setActiveSubTab('conectores')}
 className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
 activeSubTab === 'conectores'
 ? 'bg-blue-600 text-white shadow'
 : 'text-muted-foreground hover:text-foreground hover:bg-accent'
 }`}
 >
 <Database size={15} />
 <span>Conectores Homologados ({erpsList.length})</span>
 </button>

 <button
 type="button"
 id="btn-subtab-configuracao-erp"
 onClick={() => setActiveSubTab('configuracao')}
 className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
 activeSubTab === 'configuracao'
 ? 'bg-blue-600 text-white shadow'
 : 'text-muted-foreground hover:text-foreground hover:bg-accent'
 }`}
 >
 <Sliders size={15} />
 <span>Configuração & Regras</span>
 </button>

 <button
 type="button"
 id="btn-subtab-documentacao-erp"
 onClick={() => setActiveSubTab('documentacao')}
 className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
 activeSubTab === 'documentacao'
 ? 'bg-blue-600 text-white shadow'
 : 'text-muted-foreground hover:text-foreground hover:bg-accent'
 }`}
 >
 <BookOpen size={15} />
 <span>Documentação & Passo a Passo</span>
 </button>
 </div>

 {/* SUB-ABA 0: VALIDADOR RÁPIDO DE API (IXC, HUBSOFT, MIKWEB) */}
 {activeSubTab === 'validador' && (
 <ApiValidationCard />
 )}

 {/* SUB-ABA 1: CATÁLOGO VISUAL DE CONECTORES */}
 {activeSubTab === 'conectores' && (
 <div className="space-y-4">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
 <p className="text-xs text-muted-foreground">
 Escolha qual sistema o seu provedor de internet utiliza. Monitore a saúde da comunicação e latência de cada conector em tempo real:
 </p>
 <div className="flex items-center gap-2 shrink-0">
 <span className="text-[10px] text-muted-foreground hidden sm:flex items-center gap-1.5 font-mono">
 <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
 Ping a cada 10s
 </span>
 <button
 type="button"
 id="btn-atualizar-todos-pings-catalogo"
 onClick={refreshAllPings}
 disabled={pingsLoading}
 className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-accent border border-border transition-all"
 title="Atualizar medição de latência de todos os ERPs homologados"
 >
 <RefreshCw size={10} className={pingsLoading ? 'animate-spin' : ''} />
 <span>Atualizar Latências</span>
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {erpsList.map((erp) => {
 const isAtivo = erp.ativo;
 const isSelected = erp.id === selectedErpId;
 const pingData = pings[erp.id];
 const isPinging = pingingSpecific[erp.id];

 return (
 <div 
 key={erp.id}
 className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
 isAtivo 
 ? 'bg-card border-emerald-500/40 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20' 
 : isSelected
 ? 'bg-card border-blue-500/40 shadow'
 : 'bg-background border-border hover:border-border'
 }`}
 >
 <div>
 {/* Header do Card */}
 <div className="flex items-start justify-between gap-3 mb-3">
 <div className="flex items-center gap-3">
 <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${erp.corBadge} flex items-center justify-center text-foreground font-black text-xs shadow`}>
 {erp.sigla}
 </div>
 <div>
 <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
 {erp.nome}
 </h4>
 <span className="text-[10px] text-muted-foreground font-mono block">
 {erp.protocolo}
 </span>
 </div>
 </div>

 {isAtivo ? (
 <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
 <Check size={11} /> Ativo
 </span>
 ) : (
 <span className="px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground text-[10px] font-semibold shrink-0">
 Homologado
 </span>
 )}
 </div>

 <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
 {erp.descricao}
 </p>

 {/* Indicador Visual de Latência (Ping em Tempo Real) */}
 <div className="mb-3.5 p-2.5 bg-background rounded-xl border border-border flex items-center justify-between">
 <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
 <Radio size={12} className="text-blue-400 shrink-0" />
 <span className="text-[11px] text-muted-foreground font-medium">Saúde & Ping:</span>
 </div>
 <ErpPingBadge 
 ping={pingData} 
 loading={isPinging} 
 onRefresh={() => pingSingle(erp.id)} 
 />
 </div>

 {/* Módulos Suportados */}
 <div className="mb-4">
 <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
 Recursos Integrados
 </span>
 <div className="flex flex-wrap gap-1">
 {erp.recursos.slice(0, 3).map((rec, idx) => (
 <span key={idx} className="text-[10px] bg-white/5 text-muted-foreground px-2 py-0.5 rounded-md border border-border">
 {rec}
 </span>
 ))}
 {erp.recursos.length > 3 && (
 <span className="text-[10px] text-blue-400 font-bold px-1.5 py-0.5">
 +{erp.recursos.length - 3} mais
 </span>
 )}
 </div>
 </div>
 </div>

 {/* Ações do Card */}
 <div className="pt-3 border-t border-border flex items-center gap-2">
 <button
 type="button"
 onClick={() => handleSelectErp(erp.id, true)}
 className="flex-1 py-2 px-3 bg-white/5 hover:bg-accent text-card-foreground rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
 >
 <Sliders size={13} />
 <span>Configurar</span>
 </button>

 {!isAtivo ? (
 <button
 type="button"
 onClick={() => handleAtivarErp(erp.id)}
 className="py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
 title="Tornar este o ERP principal do provedor no DJD"
 >
 <Check size={14} />
 <span>Ativar</span>
 </button>
 ) : (
 <button
 type="button"
 disabled
 className="py-2 px-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold cursor-default flex items-center gap-1"
 >
 <CheckCircle2 size={13} />
 <span>Conectado</span>
 </button>
 )}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* SUB-ABA 2: CONFIGURAÇÃO & PRÉ-VALIDAÇÃO */}
 {activeSubTab === 'configuracao' && (
 <div className="space-y-6">
 {/* Seletor de ERP no Topo da Configuração */}
 <div className="p-4 rounded-2xl bg-card border border-border">
 <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
 Selecione o Sistema para Parametrizar:
 </span>
 <div className="flex flex-wrap gap-2">
 {erpsList.map((e) => (
 <button
 key={e.id}
 type="button"
 onClick={() => handleSelectErp(e.id)}
 className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
 selectedErpId === e.id
 ? 'bg-blue-600 text-white shadow'
 : 'bg-background text-muted-foreground hover:text-foreground border border-border'
 }`}
 >
 <div className={`w-4 h-4 rounded-md bg-gradient-to-tr ${e.corBadge} flex items-center justify-center text-[9px] text-foreground font-black`}>
 {e.sigla.slice(0, 2)}
 </div>
 <span>{e.nome}</span>
 {e.ativo && (
 <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
 )}
 </button>
 ))}
 </div>
 </div>

 {/* Painel do ERP Selecionado */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 {/* Coluna 1 e 2: Formulário de Credenciais */}
 <div className="lg:col-span-2 space-y-6">
 <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
 <div className="flex items-center justify-between pb-4 border-b border-border">
 <div className="flex items-center gap-3">
 <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${erpSelecionadoObj.corBadge} flex items-center justify-center text-foreground font-black text-sm`}>
 {erpSelecionadoObj.sigla}
 </div>
 <div>
 <h3 className="text-base font-bold text-foreground flex items-center gap-2">
 {erpSelecionadoObj.nome}
 {erpSelecionadoObj.ativo && (
 <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
 ERP Ativo
 </span>
 )}
 </h3>
 <p className="text-xs text-muted-foreground">{erpSelecionadoObj.categoria} • Versão {erpSelecionadoObj.versaoApiHomologada}</p>
 </div>
 </div>

 <div className="flex items-center gap-3">
 <ErpPingBadge 
 ping={pings[selectedErpId]} 
 loading={pingingSpecific[selectedErpId]} 
 onRefresh={() => pingSingle(selectedErpId)} 
 />
 <a 
 href={erpSelecionadoObj.docUrl} 
 target="_blank" 
 rel="noreferrer"
 className="text-xs font-semibold text-blue-400 hover:underline flex items-center gap-1 shrink-0"
 >
 <span>Doc Oficial</span>
 <ExternalLink size={12} />
 </a>
 </div>
 </div>

 {/* Campos dinâmicos do ERP */}
 <div className="space-y-4">
 {erpSelecionadoObj.campos.map((campo) => {
 const isPassword = campo.tipo === 'password';
 const showPassword = showTokens[campo.key];

 return (
 <div key={campo.key}>
 <div className="flex items-center justify-between mb-1.5">
 <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
 {campo.label}
 {campo.obrigatorio && <span className="text-rose-500">*</span>}
 </label>
 <span className="text-[11px] text-muted-foreground">{campo.ajuda}</span>
 </div>

 <div className="relative">
 <input
 type={isPassword ? (showPassword ? 'text' : 'password') : 'text'}
 value={formData[campo.key] || ''}
 onChange={(e) => setFormData({ ...formData, [campo.key]: e.target.value })}
 placeholder={campo.placeholder}
 className="w-full p-2.5 bg-background border border-border rounded-xl text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono transition-all"
 />

 {isPassword && (
 <button
 type="button"
 onClick={() => setShowTokens({ ...showTokens, [campo.key]: !showPassword })}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
 >
 {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
 </button>
 )}
 </div>
 </div>
 );
 })}

 {/* Intervalo de Sincronização */}
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
 Frequência de Sincronização em Segundo Plano
 </label>
 <select
 value={formData.syncIntervalMinutes}
 onChange={(e) => setFormData({ ...formData, syncIntervalMinutes: Number(e.target.value) })}
 className="w-full p-2.5 bg-background border border-border rounded-xl text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
 >
 <option value={5}>A cada 5 minutos (Alta rotatividade)</option>
 <option value={10}>A cada 10 minutos (Recomendado para ISPs)</option>
 <option value={15}>A cada 15 minutos</option>
 <option value={30}>A cada 30 minutos</option>
 <option value={60}>A cada 1 hora</option>
 </select>
 </div>
 </div>

 {/* Opções de Negócio Telecom */}
 <div className="p-4 rounded-xl bg-background border border-border space-y-3">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
 Regras de Negócio & Cobrança Automática
 </span>

 <label className="flex items-start gap-3 cursor-pointer">
 <input 
 type="checkbox" 
 checked={formData.autoDesbloqueio48h} 
 onChange={(e) => setFormData({ ...formData, autoDesbloqueio48h: e.target.checked })}
 className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
 />
 <div>
 <span className="text-xs font-bold text-foreground block">Auto-Desbloqueio 24h em Confiança</span>
 <span className="text-[11px] text-muted-foreground">Permite que assinantes com bloqueio financeiro reativem o sinal via Portal ou WhatsApp sem intervenção humana.</span>
 </div>
 </label>

 <label className="flex items-start gap-3 cursor-pointer">
 <input 
 type="checkbox" 
 checked={formData.avisoSonoroInadimplente} 
 onChange={(e) => setFormData({ ...formData, avisoSonoroInadimplente: e.target.checked })}
 className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
 />
 <div>
 <span className="text-xs font-bold text-foreground block">Alerta de Inadimplência na Tela do Operador</span>
 <span className="text-[11px] text-muted-foreground">Exibe indicador visual em vermelho no Inbox e no CRM quando o cliente que chama possui fatura em atraso.</span>
 </div>
 </label>

 <label className="flex items-start gap-3 cursor-pointer">
 <input 
 type="checkbox" 
 checked={formData.habilitarConsultaRadius} 
 onChange={(e) => setFormData({ ...formData, habilitarConsultaRadius: e.target.checked })}
 className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
 />
 <div>
 <span className="text-xs font-bold text-foreground block">Consulta de Sessão RADIUS (PPPoE / IP / MAC)</span>
 <span className="text-[11px] text-muted-foreground">Lê o IP atribuído, MAC Address da ONU e tempo de conexão diretamente do servidor de acesso do provedor.</span>
 </div>
 </label>
 </div>

 {/* Botões de Ação */}
 <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
 <button
 type="button"
 onClick={handleTestarPreConfiguracao}
 disabled={testing}
 className="px-5 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
 >
 {testing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
 <span>{testing ? 'Testando Conexão...' : 'Validar Pré-Configuração'}</span>
 </button>

 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={handleSalvar}
 disabled={saving}
 className="px-4 py-2.5 bg-white/5 hover:bg-accent text-foreground rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
 >
 {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
 <span>{saving ? 'Gravando...' : 'Salvar Dados'}</span>
 </button>

 {!erpSelecionadoObj.ativo && (
 <button
 type="button"
 onClick={() => handleAtivarErp(erpSelecionadoObj.id)}
 className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow"
 >
 <Check size={16} />
 <span>Definir como ERP Ativo</span>
 </button>
 )}
 </div>
 </div>
 </div>
 </div>

 {/* Coluna 3: Painel de Diagnóstico em Tempo Real */}
 <div className="space-y-5">
 <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
 <div className="flex items-center justify-between">
 <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
 <Activity size={14} className="text-emerald-400" />
 Diagnóstico de Conectividade
 </h4>
 {testResult && (
 <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
 {testResult.latenciaMs} ms
 </span>
 )}
 </div>

 {testResult ? (
 <div className="space-y-4">
 <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
 <CheckCircle2 size={16} className="shrink-0" />
 <span>{testResult.mensagem}</span>
 </div>

 {/* Checklist Técnico */}
 <div className="space-y-2">
 <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
 Checklist de Pré-Configuração
 </span>
 {testResult.checklist.map((c) => (
 <div key={c.id} className="p-2.5 rounded-xl bg-background border border-border space-y-1">
 <div className="flex items-center justify-between text-xs font-bold">
 <span className="text-card-foreground">{c.item}</span>
 {c.status === 'ok' ? (
 <span className="text-emerald-400 flex items-center gap-1 text-[10px]">
 <Check size={12} /> OK
 </span>
 ) : (
 <span className="text-amber-400 flex items-center gap-1 text-[10px]">
 <AlertTriangle size={12} /> Atenção
 </span>
 )}
 </div>
 <p className="text-[11px] text-muted-foreground leading-tight">
 {c.mensagem}
 </p>
 </div>
 ))}
 </div>

 {/* Amostra Retornada */}
 {testResult.exemploSincronizado && (
 <div className="p-3 rounded-xl bg-background border border-border space-y-2">
 <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block flex items-center gap-1">
 <FileText size={12} /> Amostra de Assinante Teste
 </span>
 <div className="text-xs space-y-1 font-mono">
 <div className="flex justify-between text-muted-foreground">
 <span>Cliente:</span>
 <span className="text-foreground font-bold">{testResult.exemploSincronizado.cliente_exemplo}</span>
 </div>
 <div className="flex justify-between text-muted-foreground">
 <span>Contrato:</span>
 <span className="text-foreground">{testResult.exemploSincronizado.contrato_codigo}</span>
 </div>
 <div className="flex justify-between text-muted-foreground">
 <span>Plano:</span>
 <span className="text-foreground">{testResult.exemploSincronizado.plano}</span>
 </div>
 <div className="flex justify-between text-muted-foreground">
 <span>Fatura Aberta:</span>
 <span className="text-amber-400">{testResult.exemploSincronizado.fatura_aberta}</span>
 </div>
 </div>
 </div>
 )}
 </div>
 ) : (
 <div className="py-10 text-center text-muted-foreground space-y-2">
 <Cpu size={28} className="mx-auto text-muted-foreground" />
 <p className="text-xs">
 Clique em <strong className="text-muted-foreground">"Validar Pré-Configuração"</strong> para checar em tempo real o handshake SSL, autenticação do token, módulo financeiro e desbloqueio.
 </p>
 </div>
 )}
 </div>

 {/* Card de Informação sobre Whitelist */}
 <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/20 space-y-2">
 <h5 className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
 <ShieldCheck size={14} /> Dica de Segurança & Firewall
 </h5>
 <p className="text-[11px] text-muted-foreground leading-relaxed">
 Para permitir que o DJD acesse o webservice do seu ERP sem bloqueios, adicione o IP da sua VM DJD na whitelist de acessos remotos (portas 443 HTTPS / 80 HTTP).
 </p>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* SUB-ABA 3: DOCUMENTAÇÃO & PASSO A PASSO */}
 {activeSubTab === 'documentacao' && (
 <div className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 
 {/* Menu Lateral de ERPs na Doc */}
 <div className="space-y-1.5">
 <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 block mb-1">
 Sistemas ERP
 </span>
 {erpsList.map((e) => (
 <button
 key={e.id}
 type="button"
 onClick={() => setSelectedErpId(e.id)}
 className={`w-full p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
 selectedErpId === e.id
 ? 'bg-blue-600 text-white'
 : 'bg-card text-muted-foreground hover:bg-accent border border-border'
 }`}
 >
 <div className="flex items-center gap-2.5">
 <div className={`w-5 h-5 rounded bg-gradient-to-tr ${e.corBadge} flex items-center justify-center text-[9px] text-foreground font-bold`}>
 {e.sigla.slice(0, 2)}
 </div>
 <span>{e.nome}</span>
 </div>
 {e.ativo && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
 </button>
 ))}
 </div>

 {/* Conteúdo do Guia do ERP Selecionado */}
 <div className="md:col-span-3 space-y-5">
 <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
 <div className="flex items-center justify-between pb-4 border-b border-border">
 <div>
 <h3 className="text-base font-bold text-foreground flex items-center gap-2">
 Guia de Integração: {erpSelecionadoObj.nome}
 </h3>
 <p className="text-xs text-muted-foreground mt-0.5">
 Siga o passo a passo para habilitar o Webservice/API no seu painel de gestão.
 </p>
 </div>

 <a 
 href={erpSelecionadoObj.docUrl} 
 target="_blank" 
 rel="noreferrer"
 className="px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs font-bold transition-all flex items-center gap-1.5 border border-blue-500/20"
 >
 <span>Documentação Completa</span>
 <ExternalLink size={12} />
 </a>
 </div>

 {/* Passo a Passo */}
 <div className="space-y-3">
 <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
 Passo a Passo de Configuração
 </h4>
 <div className="space-y-2.5">
 {erpSelecionadoObj.passoAPasso.map((passo, idx) => (
 <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-background border border-border">
 <div className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
 {idx + 1}
 </div>
 <p className="text-xs text-muted-foreground leading-relaxed">
 {passo}
 </p>
 </div>
 ))}
 </div>
 </div>

 {/* Escopos e Tabelas Necessárias */}
 <div className="space-y-3 pt-2">
 <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
 Permissões e Módulos Necessários no ERP
 </h4>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 {erpSelecionadoObj.recursos.map((rec, idx) => (
 <div key={idx} className="p-3 rounded-xl bg-background border border-border flex items-center gap-2.5 text-xs text-muted-foreground">
 <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
 <span>{rec}</span>
 </div>
 ))}
 </div>
 </div>

 {/* Botão de Ir para a Configuração */}
 <div className="pt-4 border-t border-border flex justify-end">
 <button
 type="button"
 onClick={() => setActiveSubTab('configuracao')}
 className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
 >
 <span>Configurar Credenciais do {erpSelecionadoObj.nome}</span>
 <ArrowRight size={14} />
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
