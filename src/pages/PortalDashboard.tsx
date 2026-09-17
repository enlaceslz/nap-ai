import React, { useState, useEffect } from 'react';
import { 
 Wifi, 
 Activity, 
 AlertCircle, 
 CheckCircle2, 
 Download, 
 Copy, 
 QrCode, 
 HeadphonesIcon, 
 CreditCard, 
 Settings, 
 Loader2, 
 Bell, 
 Smartphone, 
 Lock, 
 Gauge, 
 BarChart2, 
 ShieldAlert, 
 ShieldCheck, 
 ArrowRight, 
 Wrench,
 ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { usePWAInstall } from '../hooks/usePWAInstall';
import PortalWifiModal from '../components/PortalWifiModal';
import AutoDiagnosticoModal from '../components/AutoDiagnosticoModal';
import PortalSpeedtestModal from '../components/PortalSpeedtestModal';
import PortalConsumoModal from '../components/PortalConsumoModal';
import PortalIncidenteDetalheModal from '../components/PortalIncidenteDetalheModal';
import PortalContratoModal from '../components/PortalContratoModal';

export default function PortalDashboard() {
 const navigate = useNavigate();
 const { triggerTestPush, permission, requestPermission } = usePushNotifications();
 const { isInstallable, isInstalled } = usePWAInstall();
 const [faturas, setFaturas] = useState<any[]>([]);
 const [loadingPix, setLoadingPix] = useState(false);
 const [loadingBoleto, setLoadingBoleto] = useState(false);
 const [pixCode, setPixCode] = useState<string | null>(null);
 const [pixCopiado, setPixCopiado] = useState(false);
 const [boletoGerado, setBoletoGerado] = useState<string | null>(null);
 const [isWifiModalOpen, setIsWifiModalOpen] = useState(false);
 const [isDiagnosticoOpen, setIsDiagnosticoOpen] = useState(false);
 const [isSpeedtestModalOpen, setIsSpeedtestModalOpen] = useState(false);
 const [isConsumoModalOpen, setIsConsumoModalOpen] = useState(false);
 const [isIncidenteModalOpen, setIsIncidenteModalOpen] = useState(false);
 const [isContratoModalOpen, setIsContratoModalOpen] = useState(false);
 const [incidenteAtivo, setIncidenteAtivo] = useState<any | null>(null);
 const [wifiSummary, setWifiSummary] = useState<{ ssid: string; modelo: string; dispositivos: number } | null>(null);
 const [desbloqueioAtivo, setDesbloqueioAtivo] = useState(false);

 const authData = localStorage.getItem('@nap_client_auth');
 const clientData = authData ? JSON.parse(authData) : { 
 nome: 'Rafael Medeiros de Albuquerque', 
 plano: '600 Mega Fibra Turbo + Wi-Fi 6 Mesh', 
 contrato: 'CTR-2026-8894', 
 bairro: 'Centro Histórico',
 status_cliente: 'ativo'
 };
 
 const getVelocidade = (planoString) => {
 if (!planoString) return 500;
 const match = planoString.match(/(\d+)\s*(Mega|MB|Giga|GB|M|G)\b/i);
 if (match) {
 let value = parseInt(match[1]);
 const unit = match[2].toLowerCase();
 if (unit.startsWith('g')) {
 value *= 1000;
 }
 return value;
 }
 return 500;
 };
 const planoNome = clientData.plano || "Fibra 500MB";
 const velocidadeNominal = getVelocidade(planoNome);

 const clienteBairro = clientData.bairro || "Centro Histórico";
 const firstName = clientData.nome ? clientData.nome.split(' ')[0] : 'Assinante';


 useEffect(() => {
 // Checar desbloqueio em confiança ativo (padrão 24h)
 const salvo = localStorage.getItem('nap_desbloqueio_24h') || localStorage.getItem('nap_desbloqueio_48h');
 if (salvo) {
 const expira = new Date(salvo);
 if (expira > new Date()) {
 setDesbloqueioAtivo(true);
 } else {
 localStorage.removeItem('nap_desbloqueio_24h');
 localStorage.removeItem('nap_desbloqueio_48h');
 }
 }

 if (clientData.faturas && Array.isArray(clientData.faturas) && clientData.faturas.length > 0) {
 setFaturas(clientData.faturas);
 } else {
 fetch('/api/erp/faturas')
 .then(res => res.json())
 .then(data => setFaturas(data))
 .catch(() => {});
 }

 fetch('/api/portal/wifi')
 .then(res => res.json())
 .then(data => {
 if (data.sucesso && data.config) {
 setWifiSummary({
 ssid: clientData.cpe?.ssid5 || data.config.ssid5 || data.config.ssid24,
 modelo: clientData.cpe?.modelo || data.config.modeloCpe,
 dispositivos: clientData.cpe?.dispositivos || data.config.dispositivosConectados?.length || 5
 });
 }
 })
 .catch(() => {});

 // Checagem proativa de incidentes do NOC para o bairro do assinante
 fetch(`/api/incidentes/verificar-cliente?bairro=${encodeURIComponent(clienteBairro)}`)
 .then(res => res.json())
 .then(data => {
 if (data.afetado && data.incidente) {
 setIncidenteAtivo(data.incidente);
 }
 })
 .catch(() => {});
 }, [clienteBairro]);

 const faturaPendente = faturas.find(f => f.status === 'pendente' || f.status === 'atrasado');

 const handleCopiarPix = async () => {
 if (!faturaPendente) return;
 setLoadingPix(true);
 try {
 if (faturaPendente.codigo_pix) {
 setPixCode(faturaPendente.codigo_pix);
 await navigator.clipboard.writeText(faturaPendente.codigo_pix);
 setPixCopiado(true);
 setTimeout(() => setPixCopiado(false), 3500);
 } else {
 const res = await fetch(`/api/erp/pix/${faturaPendente.id}`, { method: 'POST' });
 const data = await res.json();
 if (data.sucesso && data.codigo_pix) {
 setPixCode(data.codigo_pix);
 await navigator.clipboard.writeText(data.codigo_pix);
 setPixCopiado(true);
 setTimeout(() => setPixCopiado(false), 3500);
 }
 }
 } catch (error) {
 console.error(error);
 } finally {
 setLoadingPix(false);
 }
 };

 const handleVerBoleto = async () => {
 if (!faturaPendente) return;
 setLoadingBoleto(true);
 try {
 const res = await fetch(`/api/erp/boleto/${faturaPendente.id}`, { method: 'POST' });
 const data = await res.json();
 if (data.sucesso && data.url_pdf) {
 setBoletoGerado(data.url_pdf);
 } else {
 setBoletoGerado('#boleto_pdf');
 }
 } catch (error) {
 setBoletoGerado('#boleto_pdf');
 } finally {
 setLoadingBoleto(false);
 }
 };

 return (
 <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
 <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl md:text-3xl font-bold text-foreground font-outfit mb-1">Olá, {firstName}!</h1>
 <p className="text-muted-foreground text-sm md:text-base flex items-center flex-wrap gap-1.5">
 <span>Contrato</span>
 <button 
 onClick={() => setIsContratoModalOpen(true)}
 className="text-blue-600 hover:text-blue-800 font-mono font-bold underline decoration-blue-300 hover:decoration-blue-600 transition-colors"
 title="Visualizar Contrato SCM e Assinatura Digital"
 >
 {clientData.contrato || 'CTR-2026-8894'}
 </button>
 <span>• {clientData.plano} •</span>
 <span className="inline-flex items-center text-emerald-600 font-bold">Online</span>
 </p>
 </div>
 {(!isInstalled || permission !== 'granted') && (
 <div className="flex items-center gap-2">
 {!isInstalled && isInstallable && <PWAInstallButton />}
 {permission !== 'granted' && (
 <button
 onClick={requestPermission}
 className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-100 transition-all "
 >
 <Bell size={14} /> Ativar Alertas
 </button>
 )}
 </div>
 )}
 </div>

 {/* BANNER PROATIVO DE STATUS DA REDE / NOC SHIELD */}
 {incidenteAtivo ? (
 <div className="mb-6 p-4 md:p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-foreground relative overflow-hidden shadow-sm animate-in fade-in">
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
 <div className="flex items-start gap-3.5">
 <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
 <ShieldAlert size={24} />
 </div>
 <div>
 <div className="flex flex-wrap items-center gap-2">
 <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-900 border border-amber-500/30">
 MANUTENÇÃO NO BAIRRO ({clienteBairro.toUpperCase()})
 </span>
 <span className="text-[11px] font-mono text-muted-foreground">
 Prot. Anatel: {incidenteAtivo.protocoloAnatel}
 </span>
 </div>
 <h4 className="font-bold text-foreground text-sm md:text-base mt-1 font-outfit">
 {incidenteAtivo.titulo}
 </h4>
 <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
 Equipes de fusão óptica atuando no local. Previsão de normalização: <strong className="text-foreground font-semibold">{incidenteAtivo.previsaoRetorno}</strong>.
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
 <button
 onClick={() => setIsIncidenteModalOpen(true)}
 className="flex-1 sm:flex-none px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
 >
 <Wrench size={14} /> Detalhes do Reparo
 </button>
 </div>
 </div>
 </div>
 ) : (
 <div className="mb-6 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-medium">
 <div className="flex items-center gap-2.5">
 <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
 <span>Rede 100% Operacional na sua região ({clienteBairro}) • SLA 99.9%</span>
 </div>
 <span className="font-mono text-[11px] text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-300/50 self-start sm:self-auto">
 Latência PTT IX.br: 3.4ms
 </span>
 </div>
 )}

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
 {/* Status da Conexão */}
 <div className="bg-card p-6 rounded-3xl border border-border relative overflow-hidden flex flex-col justify-between">
 <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
 
 <div>
 <div className="flex justify-between items-start mb-6 relative z-10">
 <div className="flex items-center gap-4">
 <div className="w-14 h-14 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl flex items-center justify-center">
 <Wifi size={26} />
 </div>
 <div>
 <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status da Rede</p>
 <h3 className="text-xl font-bold text-foreground font-outfit">Conectado</h3>
 </div>
 </div>
 <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-500/10 border border-emerald-200 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
 <CheckCircle2 size={14} /> Online
 </div>
 </div>
 <div className="space-y-3.5 border-t border-border pt-5 relative z-10">
 <div className="flex justify-between items-center text-sm">
 <span className="text-muted-foreground font-medium">Plano Atual</span>
 <span className="font-bold text-foreground">Fibra 500MB Simétrico</span>
 </div>
 <div className="flex justify-between items-center text-sm">
 <span className="text-muted-foreground font-medium">Rede Wi-Fi (SSID)</span>
 <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
 {wifiSummary?.ssid || 'Carregando...'}
 </span>
 </div>
 <div className="flex justify-between items-center text-sm">
 <span className="text-muted-foreground font-medium">Dispositivos no Wi-Fi</span>
 <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
 {wifiSummary?.dispositivos || 5} aparelhos conectados
 </span>
 </div>
 <div className="flex justify-between items-center text-sm">
 <span className="text-muted-foreground font-medium">Roteador / ONU</span>
 <span className="font-bold text-muted-foreground text-xs font-mono">{wifiSummary?.modelo?.split(' ')[0] || 'ZTE'} F670L</span>
 </div>
 </div>
 </div>
 
 <div className="mt-6 space-y-2 relative z-10">
 {/* Speedtest e Consumo */}
 <div className="grid grid-cols-2 gap-2">
 <button 
 onClick={() => setIsSpeedtestModalOpen(true)}
 className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-bold py-2.5 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
 >
 <Gauge size={15} className="text-blue-600" /> Teste Velocidade
 </button>
 <button 
 onClick={() => setIsConsumoModalOpen(true)}
 className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 font-bold py-2.5 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
 >
 <BarChart2 size={15} className="text-indigo-600" /> Consumo Banda
 </button>
 </div>

 {/* Wi-Fi e Diagnóstico */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 <button 
 onClick={() => setIsWifiModalOpen(true)}
 className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
 >
 <Lock size={15} /> Alterar Wi-Fi
 </button>
 <button 
 onClick={() => setIsDiagnosticoOpen(true)}
 className="bg-background hover:bg-slate-100 border border-border text-muted-foreground font-bold py-2.5 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 active:scale-95"
 >
 <Activity size={15} /> Diagnóstico TR-069
 </button>
 </div>
 </div>
 </div>

 {/* Resumo Financeiro */}
 <div className="bg-gradient-to-br from-blue-700 to-indigo-900 p-6 rounded-3xl -900/20 border border-blue-600 relative overflow-hidden flex flex-col">
 {/* Decoração de fundo */}
 <div className="absolute top-0 right-0 p-8 opacity-10">
 <QrCode size={160} className="fill-white" />
 </div>
 
 <div className="relative z-10 flex-1 flex flex-col justify-between">
 <div>
 <div className="flex items-center gap-2 mb-3">
 <AlertCircle size={16} className="text-blue-300" />
 <p className="text-xs font-bold uppercase tracking-wider text-blue-200">Próximo Vencimento</p>
 </div>
 {faturaPendente ? (
 <>
 <h2 className="text-4xl md:text-5xl font-bold mb-2 text-foreground font-outfit tracking-tight">
 <span className="text-xl md:text-2xl text-blue-300">R$</span> {faturaPendente.valor.toFixed(2).replace('.', ',')}
 </h2>
 <p className="text-blue-200 text-sm font-medium">
 Vence em {new Date(faturaPendente.vencimento).toLocaleDateString('pt-BR')}
 </p>
 </>
 ) : (
 <div className="mt-4">
 <h2 className="text-3xl font-bold mb-2 text-foreground font-outfit">Tudo em dia!</h2>
 <p className="text-blue-200 text-sm">Você não possui faturas pendentes.</p>
 </div>
 )}
 </div>
 
 {faturaPendente && (
 <div className="mt-8">
 <div className="flex flex-col sm:flex-row gap-3">
 <button 
 onClick={handleCopiarPix}
 disabled={loadingPix}
 className="flex-1 bg-card text-blue-900 font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 hover:bg-background hover:scale-105 active:scale-95 disabled:opacity-75 disabled:hover:scale-100 "
 >
 {loadingPix ? <Loader2 size={18} className="animate-spin" /> : <QrCode size={18} />}
 {loadingPix ? 'Gerando...' : 'Copiar PIX'}
 </button>
 <button 
 onClick={handleVerBoleto}
 disabled={loadingBoleto}
 className="flex-1 bg-blue-600/30 backdrop-blur-sm text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 hover:bg-blue-600/50 border border-border hover:scale-105 active:scale-95 disabled:opacity-75 disabled:hover:scale-100 "
 >
 {loadingBoleto ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
 {loadingBoleto ? 'Gerando...' : 'Ver Boleto'}
 </button>
 </div>
 {pixCode && (
 <div className="mt-4 p-3 bg-black/20 rounded-xl border border-border backdrop-blur-sm animate-in fade-in zoom-in-95">
 <p className="text-[10px] font-bold uppercase tracking-wider text-blue-300 mb-1">Linha Digitável Copiada:</p>
 <p className="text-xs font-mono break-all text-foreground leading-relaxed">{pixCode}</p>
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Atalhos Rápidos Expandidos (6 Ações) */}
 <h3 className="font-bold text-foreground font-outfit mb-4 px-1 flex items-center gap-2">
 Atendimento & Auto-Serviço
 </h3>
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
 <QuickAction icon={<Wifi size={20} />} label="Wi-Fi & Senha" onClick={() => setIsWifiModalOpen(true)} />
 <QuickAction icon={<Gauge size={20} />} label="Speedtest" onClick={() => setIsSpeedtestModalOpen(true)} />
 <QuickAction icon={<BarChart2 size={20} />} label="Consumo" onClick={() => setIsConsumoModalOpen(true)} />
 <QuickAction icon={<CreditCard size={20} />} label="Faturas" onClick={() => navigate('/portal/faturas')} />
 <QuickAction icon={<HeadphonesIcon size={20} />} label="Suporte Técnico" onClick={() => navigate('/portal/suporte')} />
 <QuickAction icon={<Settings size={20} />} label="Minha Conta" onClick={() => navigate('/portal/conta')} />
 </div>

 {/* Modal de Gerenciamento do Wi-Fi Residencial via TR-069 */}
 <PortalWifiModal 
 isOpen={isWifiModalOpen} 
 onClose={() => setIsWifiModalOpen(false)}
 onSuccess={() => {
 fetch('/api/portal/wifi')
 .then(res => res.json())
 .then(data => {
 if (data.sucesso && data.config) {
 setWifiSummary({
 ssid: data.config.ssid5 || data.config.ssid24,
 modelo: data.config.modeloCpe,
 dispositivos: data.config.dispositivosConectados?.length || 0
 });
 }
 });
 }}
 />

 {/* Auto-Diagnóstico de Rede */}
 <AutoDiagnosticoModal
 isOpen={isDiagnosticoOpen}
 onClose={() => setIsDiagnosticoOpen(false)}
 clienteBairro={clienteBairro}
 />

 {/* Speedtest Integrado */}
 <PortalSpeedtestModal
 isOpen={isSpeedtestModalOpen}
 onClose={() => setIsSpeedtestModalOpen(false)}
 planoNome={planoNome}
 velocidadeNominal={velocidadeNominal}
 />

 {/* Extrato de Consumo de Banda */}
 <PortalConsumoModal
 isOpen={isConsumoModalOpen}
 onClose={() => setIsConsumoModalOpen(false)}
 planoNome="Fibra 500MB"
 />

 {/* Detalhes do Incidente do NOC */}
 <PortalIncidenteDetalheModal
 isOpen={isIncidenteModalOpen}
 onClose={() => setIsIncidenteModalOpen(false)}
 incidente={incidenteAtivo}
 clienteBairro={clienteBairro}
 />

 {/* Modal de Contrato SCM & Assinatura Digital */}
 <PortalContratoModal
 isOpen={isContratoModalOpen}
 onClose={() => setIsContratoModalOpen(false)}
 cliente={{
 nome: clientData.nome,
 cpf: clientData.cpf || '384.921.750-42',
 contrato: clientData.contrato || 'CTR-2026-8894',
 plano: clientData.plano || '600 Mega Fibra Turbo',
 endereco: clientData.endereco || 'Rua das Acácias, 412 - Centro'
 }}
 />
 </div>
 );
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
 return (
 <button onClick={onClick} className="bg-card p-5 rounded-2xl border border-border flex flex-col items-center justify-center gap-4 hover:border-blue-600/50 hover:bg-background hover:-translate-y-0.5 transition-all group">
 <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
 {icon}
 </div>
 <span className="text-xs md:text-sm font-bold text-muted-foreground text-center group-hover:text-blue-700 transition-colors">{label}</span>
 </button>
 );
}
