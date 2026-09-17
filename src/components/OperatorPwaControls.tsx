import React, { useState } from 'react';
import { 
  Bell, BellRing, BellOff, Download, Smartphone, Check, 
  MessageSquare, Headphones, ShieldAlert, PhoneCall, X, 
  Sparkles, CheckCircle2, Volume2, Radio, Laptop
} from 'lucide-react';
import { useOperatorPushNotifications, OperatorNotificationCategory } from '../hooks/useOperatorPushNotifications';
import { usePWAInstall } from '../hooks/usePWAInstall';

export default function OperatorPwaControls() {
  const { 
    permission, 
    isSupported, 
    isSubscribed, 
    loading, 
    categories, 
    requestPermission, 
    triggerTestPush, 
    toggleCategory 
  } = useOperatorPushNotifications();

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isOpen, setIsOpen] = useState(false);
  const [testSent, setTestSent] = useState<string | null>(null);

  const handleTest = async (tipo: OperatorNotificationCategory) => {
    setTestSent(tipo);
    await triggerTestPush(tipo);
    setTimeout(() => setTestSent(null), 3000);
  };

  return (
    <>
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Botão de Instalar PWA do Operador (se aplicável e ainda não instalado) */}
        {!isInstalled && (isInstallable || isIOS) && (
          <button
            onClick={() => {
              if (isInstallable) {
                install();
              } else {
                setIsOpen(true);
              }
            }}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-bold transition-all active:scale-95"
            title="Instalar Console do Operador como Aplicativo PWA"
          >
            <Download size={14} />
            <span className="hidden xl:inline">Instalar App</span>
            <span className="text-[10px] bg-blue-500/20 px-1 py-0.2 rounded font-mono">PWA</span>
          </button>
        )}

        {/* Botão de Notificações Push do Operador */}
        <button
          onClick={() => setIsOpen(true)}
          className={`relative p-2 rounded-xl border transition-all ${
            permission === 'granted'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
          title={permission === 'granted' ? "Notificações Push do Operador: Ativas" : "Ativar Notificações Push no Dispositivo"}
        >
          {permission === 'granted' ? (
            <BellRing size={17} className="animate-pulse" />
          ) : (
            <Bell size={17} />
          )}

          {/* Dot indicador de status */}
          <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
            permission === 'granted' ? 'bg-emerald-400 ring-2 ring-[#0b0f19]' : 'bg-amber-400'
          }`} />
        </button>
      </div>

      {/* Modal / Slideover de Configuração de PWA & Push do Operador */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-3xl p-6 shadow-2xl text-slate-200 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <BellRing size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base font-outfit">Notificações Push & PWA do Operador</h3>
                  <p className="text-xs text-slate-400">Alertas em tempo real no desktop e mobile, mesmo com a aba minimizada.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5">
              {/* Status da Permissão Web Push */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${
                    permission === 'granted' ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : 'bg-amber-500 ring-4 ring-amber-500/20'
                  }`} />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {permission === 'granted' ? 'Push Ativo neste Navegador' : 'Push Inativo ou Bloqueado'}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {permission === 'granted' 
                        ? 'Você receberá avisos sonoros e pop-ups do sistema operacional.' 
                        : 'Permita as notificações para receber filas e chamadas.'}
                    </span>
                  </div>
                </div>

                {permission !== 'granted' ? (
                  <button
                    onClick={requestPermission}
                    disabled={loading || !isSupported}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <BellRing size={14} />
                    {loading ? 'Ativando...' : 'Ativar Push'}
                  </button>
                ) : (
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[11px] font-bold text-center">
                    Sincronizado
                  </span>
                )}
              </div>

              {/* Categorias de Alerta do Operador */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                  Categorias de Alerta Ativas
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <CategoryToggle
                    icon={<MessageSquare size={16} className="text-emerald-400" />}
                    title="WhatsApp / Inbox"
                    description="Novos clientes em espera"
                    active={categories.includes('whatsapp')}
                    onToggle={() => toggleCategory('whatsapp')}
                  />
                  <CategoryToggle
                    icon={<Headphones size={16} className="text-blue-400" />}
                    title="Chamados de Suporte"
                    description="Aberturas pelo portal"
                    active={categories.includes('suporte')}
                    onToggle={() => toggleCategory('suporte')}
                  />
                  <CategoryToggle
                    icon={<ShieldAlert size={16} className="text-amber-400" />}
                    title="Alertas NOC / Fibra"
                    description="Rompimentos e OLTs offline"
                    active={categories.includes('noc')}
                    onToggle={() => toggleCategory('noc')}
                  />
                  <CategoryToggle
                    icon={<PhoneCall size={16} className="text-indigo-400" />}
                    title="Ramal Asterisk"
                    description="Chamadas telefônicas"
                    active={categories.includes('ramal')}
                    onToggle={() => toggleCategory('ramal')}
                  />
                </div>
              </div>

              {/* Simulação de Teste de Push */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <Volume2 size={15} className="text-blue-400" />
                    <span>Testar Som & Notificação Push</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Áudio sintetizado + Vibração</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleTest('whatsapp')}
                    className="p-2 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-white/5 rounded-xl text-[11px] font-medium text-slate-300 transition-all flex flex-col items-center gap-1 text-center"
                  >
                    <MessageSquare size={14} className="text-emerald-400" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => handleTest('suporte')}
                    className="p-2 bg-white/5 hover:bg-blue-500/10 hover:border-blue-500/30 border border-white/5 rounded-xl text-[11px] font-medium text-slate-300 transition-all flex flex-col items-center gap-1 text-center"
                  >
                    <Headphones size={14} className="text-blue-400" />
                    <span>Suporte</span>
                  </button>

                  <button
                    onClick={() => handleTest('noc')}
                    className="p-2 bg-white/5 hover:bg-amber-500/10 hover:border-amber-500/30 border border-white/5 rounded-xl text-[11px] font-medium text-slate-300 transition-all flex flex-col items-center gap-1 text-center"
                  >
                    <ShieldAlert size={14} className="text-amber-400" />
                    <span>NOC / Fibra</span>
                  </button>

                  <button
                    onClick={() => handleTest('ramal')}
                    className="p-2 bg-white/5 hover:bg-indigo-500/10 hover:border-indigo-500/30 border border-white/5 rounded-xl text-[11px] font-medium text-slate-300 transition-all flex flex-col items-center gap-1 text-center"
                  >
                    <PhoneCall size={14} className="text-indigo-400" />
                    <span>Ramal 2001</span>
                  </button>
                </div>

                {testSent && (
                  <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5 pt-1 animate-in fade-in">
                    <CheckCircle2 size={13} />
                    Disparo de teste "{typeof testSent === 'string' ? testSent.toUpperCase() : ''}" emitido com sucesso!
                  </p>
                )}
              </div>

              {/* Seção PWA: Instalar Aplicativo */}
              <div className="p-4 bg-gradient-to-r from-blue-900/20 to-indigo-900/20 rounded-2xl border border-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                    <Laptop size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Console do Operador PWA</span>
                    <span className="text-[11px] text-slate-400 block">
                      Instale no Windows, Mac, Linux ou Android para usar como aplicativo nativo.
                    </span>
                  </div>
                </div>

                {isInstalled ? (
                  <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0">
                    <Check size={14} /> Instalado
                  </span>
                ) : isInstallable ? (
                  <button
                    onClick={install}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5 shrink-0"
                  >
                    <Download size={14} /> Instalar PWA
                  </button>
                ) : isIOS ? (
                  <span className="text-[11px] text-slate-400">
                    No Safari: Toque em <strong>Compartilhar</strong> &gt; <strong>Adicionar à Tela de Início</strong>.
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    Disponível no menu de instalação do navegador.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface CategoryToggleProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  active: boolean;
  onToggle: () => void;
}

function CategoryToggle({ icon, title, description, active, onToggle }: CategoryToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
        active 
          ? 'bg-blue-600/10 border-blue-500/30 text-white' 
          : 'bg-slate-950 border-white/5 text-slate-400 hover:border-white/10'
      }`}
    >
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="truncate">
          <span className="text-xs font-bold block truncate">{title}</span>
          <span className="text-[10px] text-slate-500 block truncate">{description}</span>
        </div>
      </div>
      <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ml-2 ${
        active ? 'bg-blue-600 border-blue-500 text-white' : 'border-white/10 bg-white/5 text-transparent'
      }`}>
        <Check size={12} />
      </div>
    </button>
  );
}
