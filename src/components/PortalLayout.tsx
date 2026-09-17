import React, { useEffect } from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { Wifi, CreditCard, HeadphonesIcon, Settings } from 'lucide-react';
import WebchatWidget from './WebchatWidget';
import { PWAInstallButton } from './PWAInstallButton';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useConfig } from '../contexts/ConfigContext';
import { useTheme } from '../contexts/ThemeContext';
import { Bell, BellOff, BellRing } from 'lucide-react';

export default function PortalLayout() {
  const { isSupported, permission, requestPermission } = usePushNotifications();
  const { setThemeMode } = useTheme();

  useEffect(() => {
    setThemeMode('light');
  }, []);

  const { config } = useConfig();
  const nomeProvedor = config.provedor?.nomeFantasia || 'NAP Telecom';

  useEffect(() => {
    const authData = localStorage.getItem('@nap_client_auth');
    if (!authData) return;
    
    const clientData = JSON.parse(authData);
    const cpf = clientData.cpf;
    if (!cpf) return;

    let sessionId = localStorage.getItem('nap_session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('nap_session_id', sessionId);
    }

    let lastActivity = Date.now();

    const updateActivity = () => {
      lastActivity = Date.now();
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('touchstart', updateActivity);
    window.addEventListener('scroll', updateActivity);

    const interval = setInterval(async () => {
      // 60 minutes inactivity
      if (Date.now() - lastActivity > 60 * 60 * 1000) {
        localStorage.removeItem('@nap_client_auth');
        localStorage.removeItem('nap_session_id');
        alert("Sessão expirada por inatividade (60 minutos).");
        window.location.href = '/portal/login';
        return;
      }

      try {
        const res = await fetch('/api/portal/session/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cpf, sessionId })
        });
        const data = await res.json();
        
        if (data.status === 'conflict') {
          localStorage.removeItem('@nap_client_auth');
          localStorage.removeItem('nap_session_id');
          alert(data.message || "Você foi desconectado porque foi feito login por outro dispositivo.");
          window.location.href = '/portal/login';
        }
      } catch (e) {
        // network error, ignore
      }
    }, 10000); // Check every 10 seconds for testing/simulating

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      clearInterval(interval);
    };
  }, []);
  const inicialProvedor = nomeProvedor.charAt(0).toUpperCase() || 'N';

  const authData = localStorage.getItem('@nap_client_auth');
  
  if (!authData) {
    return <Navigate to="/portal/login" replace />;
  }

  const clientData = JSON.parse(authData);
  const clientInitials = clientData.nome 
    ? clientData.nome.split(' ').filter(Boolean).map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() 
    : 'RM';

  const clientName = clientData.nome || 'Rafael Medeiros';
  const clientContrato = clientData.contrato || 'CTR-2026-8894';

  if (clientData.status_cliente === 'inativo') {
    return (
      <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-blue-600 to-slate-50 opacity-10"></div>
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute top-40 right-10 w-48 h-48 bg-purple-500 rounded-full blur-3xl opacity-10"></div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 z-10 text-center max-w-md mx-auto w-full">
          <div className="w-20 h-20 rounded-2xl bg-white shadow-xl flex items-center justify-center mb-6 border border-slate-100">
             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0a50ff] to-[#55b0ff] shadow-inner flex items-center justify-center">
                <span className="text-white font-black text-2xl font-sans mt-[2px]">{inicialProvedor}</span>
             </div>
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 mb-2 font-outfit">Que saudade, {clientName.split(' ')[0]}!</h1>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Notamos que o seu contrato <strong className="text-slate-700">{clientContrato}</strong> está inativo. 
            Nós do <strong>{nomeProvedor}</strong> preparamos uma oferta super especial, exclusiva para ex-clientes, para você voltar a navegar com a nossa fibra óptica.
          </p>

          <div className="bg-white rounded-3xl border border-blue-100 p-6 w-full shadow-lg shadow-blue-900/5 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider py-1 px-3 rounded-bl-xl">Exclusivo</div>
            <div className="text-blue-600 mb-2">
               <Wifi size={32} className="mx-auto" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Fibra Turbo + Dobro de Mega</h3>
            <p className="text-slate-500 text-xs mb-4">Assine hoje e ganhe instalação grátis e roteador Wi-Fi 6 incluso.</p>
            
            <button onClick={() => {
                const btn = document.querySelector('.webchat-toggle-btn');
                if (btn) (btn as HTMLElement).click();
              }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2">
              <HeadphonesIcon size={18} />
              Quero ouvir a proposta
            </button>
          </div>

          <button onClick={() => {
            localStorage.removeItem('@nap_client_auth');
            window.location.href = '/portal/login';
          }} className="text-xs font-bold text-slate-400 hover:text-slate-600">
            Sair e usar outro CPF
          </button>
        </div>
        
        {/* Renderizamos o Webchat oculto na página, para o botão funcionar */}
        <div className="fixed bottom-0 right-0 z-50">
           <WebchatWidget />
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 text-slate-700 font-sans">
      {/* Mobile Header */}
      <div className="md:hidden bg-white/90 backdrop-blur-md border-b border-slate-200 p-4 flex justify-between items-center z-10 sticky top-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0a50ff] to-[#55b0ff] shadow-[0_2px_10px_rgba(10,80,255,0.4)] flex items-center justify-center">
            <span className="text-white font-black text-lg tracking-tight font-sans mt-[1px]">N</span>
          </div>
          <span className="font-bold text-lg text-slate-900 font-outfit truncate max-w-[170px]">{nomeProvedor}</span>
        </div>
        <div className="flex items-center gap-3">
          {isSupported && permission !== 'granted' && (
            <button onClick={requestPermission} className="p-2 text-slate-500 hover:text-blue-600 transition-colors" title="Ativar Notificações">
              <Bell size={20} />
            </button>
          )}
          {permission === 'granted' && (
            <div className="p-2 text-blue-600" title="Notificações Ativas">
              <BellRing size={20} />
            </div>
          )}
          <PWAInstallButton />
          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-sm text-slate-600">
            {clientInitials}
          </div>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col z-10">
        <div className="h-20 flex items-center px-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0a50ff] to-[#55b0ff] shadow-[0_2px_10px_rgba(10,80,255,0.4)] flex items-center justify-center">
              <span className="text-white font-black text-xl tracking-tight font-sans mt-[1px]">N</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base text-slate-900 font-outfit leading-tight truncate max-w-[160px]">{nomeProvedor}</span>
              <span className="text-[10px] text-blue-600 font-bold tracking-widest uppercase">Portal do Assinante</span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 py-6 flex flex-col gap-1.5 px-4">
          <div className="mb-4 px-2 flex flex-col gap-2">
            <PWAInstallButton />
            {isSupported && permission !== 'granted' && (
              <button 
                onClick={requestPermission} 
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
              >
                <Bell size={18} />
                Ativar Notificações
              </button>
            )}
          </div>
          <NavItem to="/portal" icon={<Wifi size={20} />} label="Minha Conexão" exact />
          <NavItem to="/portal/faturas" icon={<CreditCard size={20} />} label="Faturas" />
          <NavItem to="/portal/suporte" icon={<HeadphonesIcon size={20} />} label="Suporte Técnico" />
          <NavItem to="/portal/conta" icon={<Settings size={20} />} label="Minha Conta" />
        </nav>
        
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-200 shrink-0">
              {clientInitials}
            </div>
            <div className="min-w-0">
              <p className="text-slate-900 font-bold text-xs truncate" title={clientName}>{clientName}</p>
              <p className="text-[10px] text-slate-500 font-mono truncate">{clientContrato}</p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('@nap_client_auth');
              window.location.href = '/portal/login';
            }}
            className="text-[10px] font-bold text-slate-400 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50 shrink-0"
            title="Sair / Trocar de Cliente de Teste"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200 flex justify-around p-2 pb-safe [0_-5px_15px_-5px_rgba(0,0,0,0.1)] z-10 sticky bottom-0">
        <MobileNavItem to="/portal" icon={<Wifi size={22} />} label="Início" exact />
        <MobileNavItem to="/portal/faturas" icon={<CreditCard size={22} />} label="Faturas" />
        <MobileNavItem to="/portal/suporte" icon={<HeadphonesIcon size={22} />} label="Suporte" />
        <MobileNavItem to="/portal/conta" icon={<Settings size={22} />} label="Conta" />
      </nav>

      {/* Inject Webchat Widget */}
      <WebchatWidget />
    </div>
  );
}

function NavItem({ to, icon, label, exact = false }: { to: string; icon: React.ReactNode; label: string; exact?: boolean }) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm group ${
          isActive 
            ? 'bg-blue-50 text-blue-700  border border-blue-100' 
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className={`${isActive ? 'text-blue-600' : 'text-slate-600 group-hover:text-slate-600'} transition-colors`}>
            {icon}
          </div>
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

function MobileNavItem({ to, icon, label, exact = false }: { to: string; icon: React.ReactNode; label: string; exact?: boolean }) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-xl transition-colors ${
          isActive ? 'text-blue-600' : 'text-slate-500'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-50' : ''}`}>
              {icon}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">{label}</span>
        </>
      )}
    </NavLink>
  );
}
