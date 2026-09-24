import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, Save, Shield, Bell, BellRing, Smartphone, CheckCircle2, Wifi, QrCode, Eye, EyeOff, Copy, Check, RefreshCw, LogOut, FileText, ShieldCheck } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { PWAInstallButton } from '../components/PWAInstallButton';
import PortalWifiModal from '../components/PortalWifiModal';
import PortalContratoModal from '../components/PortalContratoModal';
import { useNavigate } from 'react-router-dom';

export default function PortalConta() {
 const navigate = useNavigate();
 const [loading, setLoading] = useState(false);
 const { permission, loading: loadingPush, requestPermission, triggerTestPush } = usePushNotifications();
 const [isWifiModalOpen, setIsWifiModalOpen] = useState(false);
 const [isContratoModalOpen, setIsContratoModalOpen] = useState(false);
 const [wifiData, setWifiData] = useState<any>(null);
 const [showWifiPassword, setShowWifiPassword] = useState(false);
 const [copiedWifi, setCopiedWifi] = useState(false);

 const fetchWifi = () => {
 fetch('/api/portal/wifi')
 .then(res => res.json())
 .then(data => {
 if (data.sucesso && data.config) {
 setWifiData(data.config);
 }
 })
 .catch(() => {});
 };

 useEffect(() => {
 fetchWifi();
 }, []);

 const handleCopyWifi = () => {
 if (!wifiData?.senhaWifi) return;
 navigator.clipboard.writeText(wifiData.senhaWifi);
 setCopiedWifi(true);
 setTimeout(() => setCopiedWifi(false), 2000);
 };

 const handleSave = () => {
 setLoading(true);
 setTimeout(() => setLoading(false), 1000);
 };

 const handleLogout = () => {
 localStorage.removeItem('@nap_client_auth');
 navigate('/portal/login');
 };

 const authData = localStorage.getItem('@nap_client_auth');
 const clientData = authData ? JSON.parse(authData) : { 
 nome: 'Rafael Medeiros de Albuquerque', 
 cpf: '384.921.750-42', 
 email: 'rafael.medeiros@napfibra.com.br', 
 telefone: '', 
 endereco: 'Rua das Acácias, 412, Apto 82 - Centro Histórico, São Paulo - SP', 
 contrato: 'CTR-2026-8894',
 plano: '600 Mega Fibra Turbo + Wi-Fi 6'
 };
 const clientInitials = clientData.nome 
 ? clientData.nome.split(' ').filter(Boolean).map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() 
 : 'RM';

 return (
 <div className="p-4 md:p-8 max-w-3xl mx-auto w-full">
 <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl md:text-3xl font-bold text-foreground font-outfit mb-2">Minha Conta</h1>
 <p className="text-muted-foreground text-sm md:text-base">Gerencie seus dados pessoais e de acesso.</p>
 </div>
 <button onClick={handleLogout} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition-all border border-red-100">
 <LogOut size={18} />
 Sair da Conta
 </button>
 </div>

 <div className="space-y-6">
 {/* Dados Pessoais */}
 <div className="bg-card rounded-3xl border border-border overflow-hidden relative">
 <div className="p-5 md:p-6 border-b border-border bg-card flex items-center gap-3 relative z-10">
 <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 border border-blue-200 flex items-center justify-center">
 <User size={20} />
 </div>
 <h2 className="font-bold text-foreground font-outfit">Dados Pessoais</h2>
 </div>
 <div className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 relative z-10">
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Nome Completo</label>
 <input 
 type="text" 
 defaultValue={clientData.nome} 
 disabled
 className="w-full px-4 py-3 bg-background border border-border rounded-xl text-muted-foreground cursor-not-allowed font-medium "
 />
 <p className="text-[10px] text-muted-foreground mt-2 font-medium">Alteração de titularidade apenas via suporte.</p>
 </div>
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">CPF / CNPJ</label>
 <input 
 type="text" 
 defaultValue={clientData.cpf} 
 disabled
 className="w-full px-4 py-3 bg-background border border-border rounded-xl text-muted-foreground cursor-not-allowed font-medium "
 />
 </div>
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">E-mail</label>
 <div className="relative group">
 <Mail className="absolute left-4 top-3.5 text-muted-foreground group-focus-within:text-blue-600 transition-colors" size={18} />
 <input 
 type="email" 
 defaultValue={clientData.email || "rafael.medeiros@napfibra.com.br"} 
 className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 outline-none text-foreground transition-all"
 />
 </div>
 </div>
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Telefone / WhatsApp</label>
 <div className="relative group">
 <Phone className="absolute left-4 top-3.5 text-muted-foreground group-focus-within:text-blue-600 transition-colors" size={18} />
 <input 
 type="tel" 
 defaultValue={clientData.telefone || ""} 
 className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 outline-none text-foreground transition-all"
 />
 </div>
 </div>
 <div className="md:col-span-2">
 <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Endereço de Instalação</label>
 <input 
 type="text" 
 defaultValue={clientData.endereco ? `${clientData.endereco} - ${clientData.bairro || 'Centro Histórico'}, ${clientData.cidade || 'São Paulo'} - ${clientData.uf || 'SP'}` : 'Rua das Acácias, 412, Apto 82 - Centro Histórico, São Paulo - SP'} 
 disabled
 className="w-full px-4 py-3 bg-background border border-border rounded-xl text-muted-foreground cursor-not-allowed font-medium text-sm"
 />
 </div>
 </div>
 <div className="p-5 bg-card border-t border-border flex justify-end relative z-10">
 <button 
 onClick={handleSave}
 className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
 >
 <Save size={18} />
 {loading ? 'Salvando...' : 'Salvar Alterações'}
 </button>
 </div>
 </div>

 {/* Gestão do Wi-Fi Residencial (TR-069) */}
 <div className="bg-card rounded-3xl border border-border overflow-hidden relative">
 <div className="p-5 md:p-6 border-b border-border bg-card flex items-center justify-between relative z-10">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
 <Wifi size={20} />
 </div>
 <div>
 <h2 className="font-bold text-foreground font-outfit">Roteador & Senha do Wi-Fi</h2>
 <p className="text-xs text-muted-foreground">Controle remoto da ONU residencial via protocolo TR-069.</p>
 </div>
 </div>
 <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Sincronizado
 </span>
 </div>

 <div className="p-5 md:p-6 space-y-6 relative z-10">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="p-4 bg-background rounded-2xl border border-border space-y-1">
 <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Rede Wi-Fi (SSID)</span>
 <span className="text-sm font-bold font-mono text-foreground block">
 {wifiData?.ssid5 || wifiData?.ssid24 || 'Carregando...'}
 </span>
 <span className="text-[11px] text-muted-foreground block">
 Modelo: {wifiData?.modeloCpe || 'ZTE Dual-Band'}
 </span>
 </div>

 <div className="p-4 bg-background rounded-2xl border border-border space-y-1">
 <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Senha da Rede</span>
 <div className="flex items-center justify-between">
 <span className="text-sm font-bold font-mono text-foreground tracking-wider">
 {showWifiPassword ? wifiData?.senhaWifi : '••••••••••••'}
 </span>
 <div className="flex items-center gap-1">
 <button
 type="button"
 onClick={() => setShowWifiPassword(!showWifiPassword)}
 className="p-1.5 text-muted-foreground hover:text-muted-foreground hover:bg-slate-200/60 rounded-lg transition-colors"
 title={showWifiPassword ? "Ocultar senha" : "Ver senha"}
 >
 {showWifiPassword ? <EyeOff size={16} /> : <Eye size={16} />}
 </button>
 <button
 type="button"
 onClick={handleCopyWifi}
 className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-slate-200/60 rounded-lg transition-colors"
 title="Copiar senha"
 >
 {copiedWifi ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
 </button>
 </div>
 </div>
 <span className="text-[11px] text-emerald-700 font-medium block">
 ● {wifiData?.dispositivosConectados?.length || 5} aparelhos conectados
 </span>
 </div>
 </div>

 <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
 <p className="text-xs text-muted-foreground">
 Você pode alterar sua senha a qualquer momento. A nova chave é aplicada imediatamente.
 </p>
 <button
 type="button"
 onClick={() => setIsWifiModalOpen(true)}
 className="w-full sm:w-auto px-5 py-2.5 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
 >
 <Lock size={15} /> Alterar Senha do Wi-Fi
 </button>
 </div>
 </div>
 </div>

 {/* Contrato de Prestação & Assinatura Digital */}
 <div className="bg-card rounded-3xl border border-border overflow-hidden relative">
 <div className="p-5 md:p-6 border-b border-border bg-card flex items-center justify-between relative z-10">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
 <FileText size={20} />
 </div>
 <div>
 <h2 className="font-bold text-foreground font-outfit">Contrato & Adesão Digital</h2>
 <p className="text-xs text-muted-foreground">Termo de adesão SCM, fidelidade e comodato de equipamentos.</p>
 </div>
 </div>
 <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
 <ShieldCheck size={12} /> Assinado Digitalmente
 </span>
 </div>

 <div className="p-5 md:p-6 space-y-4 relative z-10">
 <div className="p-4 bg-background rounded-2xl border border-border flex flex-col sm:flex-row justify-between sm:items-center gap-3">
 <div>
 <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Número do Contrato</p>
 <p className="text-base font-bold font-mono text-foreground">{clientData.contrato || 'CTR-2026-8894'}</p>
 <p className="text-xs text-muted-foreground mt-0.5">Plano: {clientData.plano} • Fidelidade: 12 meses</p>
 </div>
 <button
 type="button"
 onClick={() => setIsContratoModalOpen(true)}
 className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
 >
 <FileText size={15} /> Visualizar Contrato SCM
 </button>
 </div>
 </div>
 </div>

 {/* Segurança */}
 <div className="bg-card rounded-3xl border border-border overflow-hidden relative">
 <div className="p-5 md:p-6 border-b border-border bg-card flex items-center gap-3 relative z-10">
 <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
 <Shield size={20} />
 </div>
 <h2 className="font-bold text-foreground font-outfit">Segurança</h2>
 </div>
 <div className="p-5 md:p-6 space-y-6 relative z-10">
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Nova Senha</label>
 <div className="relative group">
 <Lock className="absolute left-4 top-3.5 text-muted-foreground group-focus-within:text-blue-600 transition-colors" size={18} />
 <input 
 type="password" 
 placeholder="Deixe em branco para não alterar" 
 className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 outline-none text-foreground transition-all placeholder:text-muted-foreground"
 />
 </div>
 </div>
 <button className="text-sm font-bold text-blue-600 hover:text-blue-600 transition-colors flex items-center gap-2">
 <Shield size={16} /> Habilitar Autenticação em 2 Fatores (2FA)
 </button>
 </div>
 </div>

 {/* Notificações Push & Instalação PWA */}
 <div className="bg-card rounded-3xl border border-border overflow-hidden relative">
 <div className="p-5 md:p-6 border-b border-border bg-card flex items-center justify-between relative z-10">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
 <Bell size={20} />
 </div>
 <div>
 <h2 className="font-bold text-foreground font-outfit">Notificações Push & PWA</h2>
 <p className="text-xs text-muted-foreground">Alertas em tempo real sobre faturas, manutenções e suporte.</p>
 </div>
 </div>
 <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
 permission === 'granted' 
 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
 : 'bg-amber-50 text-amber-700 border-amber-200'
 }`}>
 {permission === 'granted' ? 'Push Ativo' : 'Não Ativado'}
 </span>
 </div>

 <div className="p-5 md:p-6 space-y-6 relative z-10">
 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-4 bg-background rounded-2xl border border-border">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-blue-600 ">
 <BellRing size={20} />
 </div>
 <div>
 <h4 className="text-sm font-bold text-foreground">Alertas de Faturas e Rede</h4>
 <p className="text-xs text-muted-foreground">Receba a 2ª via e aviso de quedas sem precisar abrir o e-mail.</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 {permission !== 'granted' ? (
 <button
 onClick={requestPermission}
 disabled={loadingPush}
 className="px-4 py-2.5 bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
 >
 {loadingPush ? 'Ativando...' : 'Permitir Notificações'}
 </button>
 ) : (
 <button
 onClick={() => triggerTestPush({ title: 'Portal DJD', body: 'Push de teste entregue com sucesso no seu dispositivo!' })}
 className="px-4 py-2.5 bg-card border border-border hover:bg-slate-100 text-muted-foreground text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center gap-1.5"
 >
 <CheckCircle2 size={14} className="text-emerald-600" />
 Enviar Teste Push
 </button>
 )}
 </div>
 </div>

 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-4 bg-background rounded-2xl border border-border">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-indigo-600 ">
 <Smartphone size={20} />
 </div>
 <div>
 <h4 className="text-sm font-bold text-foreground">Aplicativo Instalado (PWA)</h4>
 <p className="text-xs text-muted-foreground">Acesse o portal diretamente da tela inicial do seu celular ou PC.</p>
 </div>
 </div>
 <PWAInstallButton />
 </div>
 </div>
 </div>
 
 {/* Botão de Sair (Mobile Destacado) */}
 <div className="md:hidden mt-8">
 <button 
 onClick={handleLogout} 
 className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-card text-red-600 hover:bg-red-50 rounded-2xl font-bold transition-all border border-red-200 shadow-sm active:scale-95"
 >
 <LogOut size={20} />
 Sair da Conta (Logout)
 </button>
 <p className="text-center text-muted-foreground text-xs mt-3">Versão do App: 2.4.1</p>
 </div>
 </div>

 {/* Modal de Gestão Wi-Fi */}
 <PortalWifiModal
 isOpen={isWifiModalOpen}
 onClose={() => setIsWifiModalOpen(false)}
 onSuccess={() => fetchWifi()}
 />

 {/* Modal de Contrato SCM & Assinatura Digital */}
 <PortalContratoModal
 isOpen={isContratoModalOpen}
 onClose={() => setIsContratoModalOpen(false)}
 cliente={{
 nome: clientData.nome,
 cpf: clientData.cpf,
 contrato: clientData.contrato || 'CTR-2026-8894',
 plano: clientData.plano || '600 Mega Fibra Turbo',
 endereco: clientData.endereco || 'Rua das Acácias, 412 - Centro'
 }}
 />
 </div>
 );
}
