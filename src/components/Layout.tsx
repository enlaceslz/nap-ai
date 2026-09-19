import React, { useState, useEffect } from 'react';
import { Tooltip } from './Tooltip';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
 MessageSquare, Settings, BookOpen, Users, Trello, PieChart, 
 ShieldUser, Megaphone, Workflow, Server, LogOut, 
 ChevronLeft, ChevronRight, Menu, X, ExternalLink,
 PhoneCall, Activity, Sparkles, PanelLeftClose, PanelLeftOpen,
 CreditCard, Headphones, ShoppingCart, Router, Wrench, MapPin, Navigation, Compass,
 ShieldCheck, Package, Globe, Cpu, Network, Ticket, FileText, UserCheck
} from 'lucide-react';
import CTIReverso from './CTIReverso';
import Webphone from './Webphone';
import OperatorStatusControl from './OperatorStatusControl';
import OperatorPwaControls from './OperatorPwaControls';
import SyncStatusMonitor from './SyncStatusMonitor';
import ThemeToggle from './ThemeToggle';
import ErrorBoundary from './ErrorBoundary';
import { useGeolocationTracker } from '../hooks/useGeolocationTracker';
import { useConfig } from '../contexts/ConfigContext';

export default function Layout() {
 const { logout, user } = useAuth();
 const { config } = useConfig();
 const location = useLocation();
 const { geoData } = useGeolocationTracker();

 const erpAtivo = config.erpAtivo || 'ixc';

 // Estado de recolhimento no Desktop com persistência local
 const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
 try {
 return localStorage.getItem('nap_sidebar_collapsed') === 'true';
 } catch {
 return false;
 }
 });

 // Estado da barra móvel (Drawer em telas menores)
 const [isMobileOpen, setIsMobileOpen] = useState(false);

 // Persiste a preferência do usuário
 useEffect(() => {
 try {
 localStorage.setItem('nap_sidebar_collapsed', String(isCollapsed));
 } catch (e) {
 console.warn(e);
 }
 }, [isCollapsed]);

 // Fecha o drawer mobile ao trocar de rota
 useEffect(() => {
 setIsMobileOpen(false);
 }, [location.pathname]);

 // Atalho de teclado Ctrl+B / Cmd+B para alternar menu
 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
 e.preventDefault();
 setIsCollapsed(prev => !prev);
 }
 };
 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, []);

 // Mapeamento dinâmico de títulos para o Topbar
 const getPageInfo = (path: string) => {
 if (path === '/admin' || path === '/admin/' || path === '/admin/inbox' || path.startsWith('/admin/inbox')) return { title: 'Inbox Unificado', category: 'Atendimento Omnichannel (WhatsApp WABA & WebChat)', icon: <MessageSquare size={18} className="text-blue-400" /> };
 if (path.startsWith('/admin/dashboard')) return { title: 'NOC & Analytics', category: 'Centro de Controle Operacional', icon: <PieChart size={18} className="text-blue-400" /> };
 if (path.startsWith('/admin/cobranca')) return { title: 'Régua de Cobrança', category: 'Inadimplência, PIX & Desbloqueio 24h', icon: <CreditCard size={18} className="text-amber-600" /> };
 if (path.startsWith('/admin/suporte')) return { title: 'Kanban de Suporte', category: 'N1 & N2 Técnico', icon: <Headphones size={18} className="text-blue-400" /> };
 if (path.startsWith('/admin/campo')) return { title: 'Técnico de Campo (PWA)', category: 'Ordens de Serviço & GPS', icon: <Wrench size={18} className="text-emerald-400" /> };
 if (path.startsWith('/admin/usuarios')) return { title: 'Usuários & Hierarquia', category: 'Gestão, Equipe & Campo', icon: <Users size={18} className="text-purple-400" /> };
 if (path.startsWith('/admin/vendas')) return { title: 'Kanban de Vendas', category: 'Novos Assinantes & Upgrades', icon: <ShoppingCart size={18} className="text-emerald-600" /> };
 if (path.startsWith('/admin/campanhas')) return { title: 'Operação Ativa', category: 'Campanhas HSM & URA Reversa', icon: <Megaphone size={18} className="text-indigo-600" /> };
 if (path.startsWith('/admin/customer360')) return { title: 'Customer 360 & Pagamentos', category: 'Sincronização & Enlace-Pay', icon: <UserCheck size={18} className="text-emerald-400" /> };
  if (path.startsWith('/admin/crm')) return { title: 'Base CRM 360', category: 'Histórico & Sincronização SGP', icon: <Users size={18} className="text-blue-400" /> };
 if (path.startsWith('/admin/erp-integracoes')) return { title: 'Multi-ERP Hub', category: 'API Gateways & Adaptadores', icon: <Network size={18} className="text-indigo-400" /> };
 if (path.startsWith('/admin/sgp')) return { title: `Workspace ERP (${erpAtivo.toUpperCase()})`, category: 'Diagnóstico & Ações de Rede', icon: <Server size={18} className="text-blue-400" /> };
 if (path.startsWith('/admin/genieacs')) return { title: 'GenieACS Dashboard', category: 'Monitoramento TR-069', icon: <Router size={18} className="text-blue-400" /> };
 if (path.startsWith('/admin/olts')) return { title: 'Gestão de OLTs & Redes Ópticas', category: 'Provisionamento & Telemetria GPON', icon: <Cpu size={18} className="text-cyan-400" /> };
 if (path.startsWith('/admin/mapa-rede')) return { title: 'Mapa de Rede (GIS)', category: 'Geolocalização ONTs', icon: <MapPin size={18} className="text-emerald-400" /> };
 if (path.startsWith('/admin/gis')) return { title: 'DJD GIS', category: 'Fundação GIS - Parte 01', icon: <MapPin size={18} className="text-emerald-400" /> };
 if (path.startsWith('/admin/automacoes')) return { title: 'Agente IA & Automações', category: 'Google Gemini Serverless (Sem n8n)', icon: <Sparkles size={18} className="text-indigo-600" /> };
 if (path.startsWith('/admin/operadores')) return { title: 'Gestão de Operadores', category: 'Escalas & Filas Asterisk', icon: <ShieldUser size={18} className="text-blue-400" /> };
 if (path.startsWith('/admin/auditoria')) return { title: 'Logs de Auditoria & Conformidade', category: 'LGPD Art. 37, ANATEL & Segurança', icon: <ShieldCheck size={18} className="text-emerald-400" /> };
 if (path.startsWith('/admin/ajuda')) return { title: 'Ajuda & Documentação', category: 'Homologação, Manuais & Guias Operacionais', icon: <BookOpen size={18} className="text-blue-400" /> };
 if (path.startsWith('/admin/configuracoes')) return { title: 'Super Admin', category: 'Multi-Tenant & Telecom', icon: <Settings size={18} className="text-muted-foreground" /> };
 return { title: 'DJD Omni', category: 'Telecom Suite', icon: <Activity size={18} className="text-blue-400" /> };
 };

 const pageInfo = getPageInfo(location.pathname);

 const role = user?.role || 'superadmin';
 const hasAccess = (allowedRoles: string[]) => {
 if (!role || role === 'admin' || role === 'superadmin') return true;
 if (allowedRoles.length === 0) return true;
 return allowedRoles.includes(role);
 };

 return (
 <div className="flex h-screen bg-background text-muted-foreground font-sans overflow-hidden">
 {/* Backdrop para Mobile */}
 {isMobileOpen && (
 <div 
 onClick={() => setIsMobileOpen(false)}
 className="fixed inset-0 bg-background/80 backdrop-blur-xs z-40 sm:hidden transition-opacity"
 aria-hidden="true"
 />
 )}

 {/* Sidebar Modernizada (Desktop Collapsible + Mobile Drawer) */}
 <aside 
 className={`
 fixed inset-y-0 left-0 z-50 bg-background border-r border-border flex flex-col transition-all duration-300 ease-in-out
 sm:static sm:translate-x-0
 ${isMobileOpen ? 'translate-x-0 w-72 shadow-2xl' : '-translate-x-full sm:translate-x-0'}
 ${isCollapsed ? 'sm:w-[72px]' : 'sm:w-64'}
 `}
 >
 {/* Header da Sidebar com Logo e Botão de Recolhimento */}
 <div className="h-16 flex items-center justify-between px-5 border-b border-border shrink-0">
 <div className="flex items-center gap-3 overflow-hidden">
 <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0a50ff] to-[#55b0ff] flex items-center justify-center shrink-0 shadow-[0_2px_10px_rgba(10,80,255,0.4)]">
 <span className="text-foreground font-black text-xl tracking-tight font-sans mt-[1px]">N</span>
 </div>
 
 {/* Texto do logo esconde ao recolher */}
 <div className={`transition-opacity duration-200 flex flex-col justify-center ${isCollapsed ? 'sm:opacity-0 sm:w-0 sm:hidden' : 'opacity-100'}`}>
 <div className="flex items-center gap-1.5">
 <span className="font-extrabold text-base text-foreground tracking-tight font-sans leading-none">DJD</span>
 <span className="text-[#55b0ff] font-bold text-[10px] uppercase tracking-wider bg-[#0a50ff]/15 border border-[#0a50ff]/30 px-1.5 py-0.5 rounded leading-none">Omni</span>
 </div>
 </div>
 </div>

 {/* Botão de Fechar no Mobile */}
 <button 
 onClick={() => setIsMobileOpen(false)}
 className="sm:hidden p-1.5 text-muted-foreground hover:text-card-foreground hover:bg-card/5 rounded-lg transition-colors"
 title="Fechar menu"
 >
 <X size={20} />
 </button>

 {/* Botão de Recolher no Desktop */}
 <button 
 onClick={() => setIsCollapsed(!isCollapsed)}
 className={`hidden sm:flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card/5 border border-border transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
 title={isCollapsed ? "Expandir menu (Ctrl+B)" : "Recolher menu (Ctrl+B)"}
 >
 {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
 </button>
 </div>
 
 {/* Navegação Principal com Scroll */}
 <div className="flex-1 overflow-y-auto py-5 space-y-7" style={{ scrollbarWidth: 'thin' }}>
 
 {/* Seção: Operação */}
 <div>
 {!isCollapsed && (
 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-5 flex items-center justify-between">
 <span>Operação</span>
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
 </p>
 )}
 
 <nav className="flex flex-col gap-0.5 px-3">
 <NavItem to="/admin/inbox" icon={<MessageSquare size={18} />} label="Inbox Unificado" badge="4" isCollapsed={isCollapsed} />
 {hasAccess(['tecnico_noc']) && <NavItem to="/admin/dashboard" icon={<PieChart size={18} />} label="NOC & Analytics" isCollapsed={isCollapsed} />}
 {hasAccess(['tecnico_campo']) && <NavItem to="/admin/campo" icon={<Wrench size={18} />} label="Técnico de Campo" badge="GPS" isCollapsed={isCollapsed} />}
 {hasAccess(['operador', 'tecnico_noc', 'tecnico_campo']) && <NavItem to="/admin/estoque" icon={<Package size={18} />} label="Estoque & Frota" isCollapsed={isCollapsed} />}
 {hasAccess(['operador']) && <NavItem to="/admin/cobranca" icon={<CreditCard size={18} />} label="Cobrança & PIX" isCollapsed={isCollapsed} />}
 {hasAccess(['operador', 'tecnico_noc', 'tecnico_campo']) && <NavItem to="/admin/suporte" icon={<Headphones size={18} />} label="Suporte N1/N2" isCollapsed={isCollapsed} />}
 {hasAccess(['operador']) && <NavItem to="/admin/vendas" icon={<ShoppingCart size={18} />} label="Vendas & Leads" isCollapsed={isCollapsed} />}
 {hasAccess(['operador']) && <NavItem to="/admin/campanhas" icon={<Megaphone size={18} />} label="Ativo (Campanhas)" isCollapsed={isCollapsed} />}
 {hasAccess(['operador', 'tecnico_noc', 'tecnico_campo']) && <NavItem to="/admin/customer360" icon={<UserCheck size={18} />} label="Customer 360" badge="PRD" isCollapsed={isCollapsed} />}
        {hasAccess(['operador', 'tecnico_noc']) && <NavItem to="/admin/crm" icon={<Users size={18} />} label="CRM Clientes" isCollapsed={isCollapsed} />}
 {hasAccess(['operador', 'tecnico_noc']) && <NavItem to="/admin/historico" icon={<FileText size={18} />} label="Histórico WABA" isCollapsed={isCollapsed} />}
 {hasAccess([]) && <NavItem to="/admin/erp-integracoes" icon={<Network size={18} />} label="Multi-ERP Hub" isCollapsed={isCollapsed} />}
 {hasAccess(['operador', 'tecnico_noc', 'tecnico_campo']) && <NavItem to="/admin/sgp" icon={<Server size={18} />} label="Workspace ERP" badge={erpAtivo.toUpperCase()} isCollapsed={isCollapsed} />}
 {hasAccess(['tecnico_noc', 'operador']) && <NavItem to="/admin/telefonia" icon={<PhoneCall size={18} />} label="Telefonia & URA" badge="PABX" isCollapsed={isCollapsed} />}
 {hasAccess(['tecnico_noc']) && <NavItem to="/admin/genieacs" icon={<Router size={18} />} label="GenieACS" isCollapsed={isCollapsed} />}
 {hasAccess(['tecnico_noc', 'tecnico_campo', 'operador']) && <NavItem to="/admin/olts" icon={<Cpu size={18} />} label="OLTs & Fibra" badge="GPON" isCollapsed={isCollapsed} />}
 {hasAccess(['tecnico_noc']) && <NavItem to="/admin/infra" icon={<Activity size={18} />} label="Infraestrutura (Zabbix)" badge="NOC" isCollapsed={isCollapsed} />}
 {hasAccess(['tecnico_noc', 'tecnico_campo']) && <NavItem to="/admin/mapa-rede" icon={<MapPin size={18} />} label="Mapa de Rede (ONTs)" badge="GIS" isCollapsed={isCollapsed} />}
 {hasAccess(['tecnico_noc', 'tecnico_campo']) && <NavItem to="/admin/gis" icon={<MapPin size={18} />} label="DJD GIS" badge="BETA" isCollapsed={isCollapsed} />}
 <NavItem to="/admin/ajuda" icon={<BookOpen size={18} />} label="Ajuda & Documentação" isCollapsed={isCollapsed} />
 </nav>
 </div>

 {/* Seção: Automação & IA */}
 {hasAccess([]) && (
 <div>
 {!isCollapsed && (
 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-5 flex items-center justify-between">
 <span>Automação & IA</span>
 <Sparkles size={11} className="text-indigo-500" />
 </p>
 )}

 <nav className="flex flex-col gap-0.5 px-3">
 <NavItem to="/admin/automacoes" icon={<Sparkles size={18} />} label="Agente Gemini" badge="Free" isCollapsed={isCollapsed} />
 </nav>
 </div>
 )}

 {/* Seção: Administração */}
 {hasAccess([]) && (
 <div>
 {!isCollapsed && (
 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-5">
 Administração
 </p>
 )}

 <nav className="flex flex-col gap-0.5 px-3">
 <NavItem to="/admin/configuracoes?tab=landingpage" icon={<Globe size={18} />} label="Landing Page (Vitrine)" badge="Site" isCollapsed={isCollapsed} />
 <NavItem to="/admin/usuarios" icon={<Users size={18} />} label="Usuários & Hierarquia" badge="4" isCollapsed={isCollapsed} />
 <NavItem to="/admin/operadores" icon={<ShieldUser size={18} />} label="Operadores" isCollapsed={isCollapsed} />
 <NavItem to="/admin/auditoria" icon={<ShieldCheck size={18} />} label="Logs de Auditoria" isCollapsed={isCollapsed} />
 <NavItem to="/admin/helpdesk" icon={<Ticket size={18} />} label="Help Desk & OS" isCollapsed={isCollapsed} />
 <NavItem to="/admin/ipam" icon={<Globe size={18} />} label="Rede (IPAM & NSoT)" isCollapsed={isCollapsed} />
 <NavItem to="/admin/configuracoes" icon={<Settings size={18} />} label="Super Admin" isCollapsed={isCollapsed} />
 </nav>
 </div>
 )}
 </div>

 {/* Atalho para o Portal do Cliente (PWA) e Vitrine no rodapé */}
 {!isCollapsed ? (
 <div className="px-3 pb-3 space-y-1.5">
 <a 
 href="/" 
 target="_blank" 
 rel="noreferrer"
 className="flex items-center justify-between p-2 rounded-xl bg-muted/60 border border-border hover:border-border text-muted-foreground hover:text-foreground text-xs font-semibold transition-all group"
 >
 <div className="flex items-center gap-2">
 <Globe size={14} className="text-emerald-400" />
 <span>Ver Vitrine (Site)</span>
 </div>
 <ExternalLink size={13} className="text-muted-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
 </a>

 <a 
 href="/portal" 
 target="_blank" 
 rel="noreferrer"
 className="flex items-center justify-between p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/40 text-blue-500 text-xs font-semibold transition-all group"
 >
 <div className="flex items-center gap-2">
 <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-[9px]">
 APP
 </div>
 <span>Portal do Assinante</span>
 </div>
 <ExternalLink size={13} className="text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
 </a>
 </div>
 ) : (
 <div className="px-3 pb-3 flex flex-col items-center gap-1.5">
 <a 
 href="/" 
 target="_blank" 
 rel="noreferrer"
 title="Ver Vitrine / Site"
 className="w-10 h-10 rounded-xl bg-muted/60 border border-border text-emerald-400 flex items-center justify-center hover:bg-accent transition-colors"
 >
 <Globe size={16} />
 </a>
 <a 
 href="/portal" 
 target="_blank" 
 rel="noreferrer"
 title="Abrir Portal do Assinante (PWA)"
 className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center hover:bg-blue-100 transition-colors"
 >
 <ExternalLink size={16} />
 </a>
 </div>
 )}
 
 {/* Perfil do Usuário e Ramal Conectado */}
 <div className={`p-3 border-t border-border bg-background/80 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between gap-3'}`}>
 <div className="flex items-center gap-2.5 overflow-hidden">
 <div className="relative shrink-0">
 <div className="w-9 h-9 rounded-xl bg-card flex items-center justify-center text-muted-foreground font-bold border border-border text-sm">
 {user?.name ? user.name.slice(0, 2).toUpperCase() : 'JD'}
 </div>
 <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950" title="Disponível no Asterisk"></div>
 </div>

 {!isCollapsed && (
 <div className="overflow-hidden">
 <p className="text-foreground font-semibold text-xs truncate">{user?.name || 'João Silva'}</p>
 <div className="flex items-center gap-1.5 mt-0.5">
 <span className="text-[10px] text-muted-foreground font-mono">Ramal 2001</span>
 </div>
 </div>
 )}
 </div>

 {!isCollapsed && (
 <div className="flex items-center gap-1">
 <ThemeToggle className="p-1.5" direction="up" align="left" />
 <button
 onClick={logout}
 className="p-1.5 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
 title="Encerrar Sessão"
 >
 <LogOut size={16} />
 </button>
 </div>
 )}
 </div>
 </aside>

 {/* Área Principal de Conteúdo */}
 <div className="flex-1 flex flex-col h-full overflow-hidden relative">
 
 {/* Topbar Moderno e Responsivo */}
 <header className="h-16 border-b border-border bg-background/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 z-30">
 
 {/* Esquerda: Botão Mobile + Título da Página / Breadcrumb */}
 <div className="flex items-center gap-3">
 {/* Botão Hamburger (Mobile) */}
 <button 
 onClick={() => {
 setIsMobileOpen(true);
 setIsCollapsed(false);
 }}
 className="sm:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent border border-border transition-colors flex items-center gap-1.5"
 title="Abrir Menu Lateral"
 >
 <Menu size={18} />
 </button>

 {/* Alternar Recolher no Desktop */}
 <button 
 onClick={() => setIsCollapsed(!isCollapsed)}
 className="hidden sm:flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent transition-colors"
 title={isCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
 >
 {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
 </button>

 {/* Título dinâmico da página atual */}
 <div className="flex items-center gap-3 ml-2">
 <div className="hidden sm:flex w-8 h-8 rounded-lg bg-muted border border-border items-center justify-center">
 {pageInfo.icon}
 </div>
 <div className="flex flex-col justify-center">
 <h2 className="text-sm font-bold text-foreground font-outfit tracking-tight leading-none mb-1">
 {pageInfo.title}
 </h2>
 <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold leading-none hidden sm:block">
 {pageInfo.category}
 </p>
 </div>
 </div>
 </div>

 {/* Direita: Status da Conexão, Controle de Pausas NR-17, Webphone, PWA e Ações */}
 <div className="flex items-center gap-2 sm:gap-3">
  {/* Acesso Direto ao Inbox Unificado */}
  <NavLink
   to="/admin/inbox"
   className={({ isActive }) => {
    const isCurrent = isActive || location.pathname === '/admin' || location.pathname === '/admin/' || location.pathname === '/admin/inbox' || location.pathname === '/inbox';
    return `flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
     isCurrent
      ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
      : 'bg-muted hover:bg-accent text-foreground border-border'
    }`;
   }}
   title="Abrir Inbox Unificado de Atendimentos Omnichannel"
  >
   <MessageSquare size={14} />
   <span className="hidden sm:inline">Inbox</span>
   <span className="bg-blue-500/30 text-blue-500 dark:text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">4</span>
  </NavLink>

  {/* Acesso Rápido ao Dashboard / Visão Geral da Operação */}
  <NavLink
   to="/admin/dashboard"
   className={({ isActive }) => `flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
    isActive
     ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
     : 'bg-muted hover:bg-accent text-muted-foreground hover:text-foreground border-border'
   }`}
   title="Visão Geral da Operação (NOC & Analytics)"
  >
   <PieChart size={14} />
   <span className="hidden sm:inline">Dashboard</span>
  </NavLink>
 {/* Indicador de Geolocalização em Tempo Real (Técnicos & Operadores por Padrão) */}
 <div 
 className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-[11px] font-medium text-emerald-300"
 title={`GPS ${geoData.statusRastreamento.toUpperCase()} • Precisão: ${geoData.precisao}m • ${geoData.endereco}`}
 >
 <span className="relative flex h-2 w-2">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
 <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
 </span>
 <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
 {user?.role === 'tecnico_campo' || user?.role === 'tecnico_noc' ? 'GPS Campo' : 'GPS Ativo'}
 </span>
 {geoData.velocidade > 0 && (
 <span className="text-[10px] font-mono bg-emerald-500/20 px-1 rounded">
 {geoData.velocidade}km/h
 </span>
 )}
 </div>

 {/* Controle de Pausas & Presença NR-17 */}
 <OperatorStatusControl />

 {/* Notificações Push & PWA do Operador */}
 <OperatorPwaControls />

 {/* Monitor de Sincronização SGP & GenieACS em Tempo Real */}
 <SyncStatusMonitor variant="topbar" className="hidden lg:flex" />

 {/* Alternador de Tema Claro / Escuro */}
 <ThemeToggle />

 {/* Webphone / Ramal SIP */}
 <div className="relative">
 <Webphone />
 </div>
 </div>
 </header>

 {/* Notificação CTI Reversa (Asterisk 20+) */}
 <CTIReverso />

 {/* Conteúdo Dinâmico das Rotas */}
 <main className="flex-1 overflow-hidden relative flex flex-col bg-background">
  <ErrorBoundary fallbackTitle="Falha na visualização do módulo">
   <Outlet />
  </ErrorBoundary>
 </main>
 </div>
 </div>
 );
}

// Componente de Item de Navegação com Suporte a Tooltip Flutuante no modo Recolhido
interface NavItemProps {
 to: string;
 icon: React.ReactNode;
 label: string;
 badge?: string;
 isCollapsed: boolean;
}

function NavItem({ to, icon, label, badge, isCollapsed }: NavItemProps) {
 const location = useLocation();
 const isInboxActive = to === '/admin/inbox' && (
  location.pathname === '/' ||
  location.pathname === '/admin' || 
  location.pathname === '/admin/' || 
  location.pathname === '/admin/inbox' ||
  location.pathname.startsWith('/admin/inbox/') ||
  location.pathname === '/inbox'
 );

 const content = (
 <NavLink
 to={to}
 className={({ isActive }) => {
  const active = isInboxActive || isActive;
  return `relative flex items-center rounded-xl transition-all duration-200 group text-sm font-medium ${
  isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2'
  } ${
  active 
  ? 'bg-blue-500/15 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold border border-blue-500/20 dark:border-blue-500/30 shadow-xs' 
  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  }`;
 }}
 >
 {({ isActive }) => {
  const active = isInboxActive || isActive;
  return (
  <>
  {/* Indicador ativo na lateral esquerda */}
  {active && (
  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3.5px] h-[65%] bg-blue-600 dark:bg-blue-400 rounded-r-full shadow-xs" />
  )}

  {/* Ícone */}
  <div className={`${active ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground group-hover:text-foreground'} transition-colors shrink-0`}>
  {icon}
  </div>

 {/* Label de texto (esconde no modo recolhido) */}
 {!isCollapsed && (
 <span className="truncate flex-1">{label}</span>
 )}

 {/* Badge quando expandido */}
 {!isCollapsed && badge && (
 <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
  active
   ? 'bg-blue-600/15 dark:bg-blue-500/30 border border-blue-500/30 text-blue-700 dark:text-blue-300'
   : 'bg-muted border border-border text-muted-foreground group-hover:text-foreground'
 }`}>
 {badge}
 </span>
 )}

 {/* Tooltip Flutuante elegante quando recolhido (Modo Desktop) */}
 {isCollapsed && (
 <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-card border border-border text-foreground text-[11px] font-bold tracking-wider rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap shadow-xl z-50 pointer-events-none flex items-center gap-2">
 <span>{label}</span>
 {badge && (
 <span className="bg-blue-600/15 dark:bg-blue-500/30 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-[9px] px-1.5 py-0.5 rounded font-bold">
 {badge}
 </span>
 )}
 </div>
 )}
  </>
  );
 }}
 </NavLink>
 );
 
 if (isCollapsed) {
 return (
 <Tooltip content={label} position="right" className="w-full">
 {content}
 </Tooltip>
 );
 }
 
 return content;
}
