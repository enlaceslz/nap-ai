import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  MapPin, 
  ShieldAlert, 
  CheckCircle2, 
  X, 
  Wrench, 
  Bell, 
  Check, 
  PhoneCall,
  Activity
} from 'lucide-react';

interface PortalIncidenteDetalheModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidente: any;
  clienteBairro?: string;
}

export default function PortalIncidenteDetalheModal({
  isOpen,
  onClose,
  incidente,
  clienteBairro = 'Centro Histórico'
}: PortalIncidenteDetalheModalProps) {
  const [notificacaoAtivada, setNotificacaoAtivada] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen || !incidente) return null;

  const handleAtivarAviso = () => {
    setNotificacaoAtivada(true);
    setFeedback("Aviso ativado! Você será notificado por Push e WhatsApp assim que a conexão for reestabelecida.");
    setTimeout(() => {
      setFeedback(null);
    }, 5000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-amber-500/20 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative overflow-hidden flex flex-col">
        {/* Glow de aviso */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <ShieldAlert size={20} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 block">
                NOC Shield • Incidente de Rede
              </span>
              <h3 className="font-bold text-white text-base font-outfit">{incidente.titulo}</h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Informações Centrais */}
        <div className="mt-4 space-y-4 relative z-10 text-xs">
          {/* Status & ETA */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></div>
              <div>
                <span className="font-bold text-amber-300 block">Status: Em Reparo Emergencial</span>
                <span className="text-[11px] text-amber-200/80">Equipes de fusão óptica no local</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Previsão de Normalização:</span>
              <span className="font-bold font-mono text-white text-sm">{incidente.previsaoRetorno}</span>
            </div>
          </div>

          {/* Descrição Técnica para o Assinante */}
          <div className="bg-slate-950 border border-white/5 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="text-blue-400" />
                Regiões Afetadas:
              </span>
              <span className="font-bold text-white">
                {incidente.regioesAfetadas?.join(', ') || clienteBairro}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Activity size={13} className="text-emerald-400" />
                Concentrador / OLT:
              </span>
              <span className="font-mono text-slate-200">
                {incidente.concentradorOuOlt || "OLT Central"}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-indigo-400" />
                Início Detectado:
              </span>
              <span className="font-mono text-slate-200">
                {incidente.iniciadoEm || "Hoje"}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Protocolo Oficial Anatel:</span>
              <span className="font-mono text-amber-400 font-bold">
                {incidente.protocoloAnatel}
              </span>
            </div>

            <div className="pt-2 border-t border-white/5 text-[11px] text-slate-300 leading-relaxed">
              {incidente.descricao}
            </div>
          </div>

          {/* Linha do Tempo de Atendimento */}
          <div className="bg-slate-950 border border-white/5 rounded-2xl p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
              Linha do Tempo das Equipes de Campo
            </span>
            <div className="space-y-3 relative before:absolute before:inset-0 before:left-2 before:w-0.5 before:bg-white/10">
              <div className="flex items-start gap-3 relative">
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5 z-10">
                  ✓
                </div>
                <div>
                  <span className="text-white font-bold block text-[11px]">Ruptura Identificada por OTDR</span>
                  <span className="text-[10px] text-slate-500">Telemetria óptica apontou atenuação a 4.1km do POP</span>
                </div>
              </div>

              <div className="flex items-start gap-3 relative">
                <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5 z-10 animate-pulse">
                  •
                </div>
                <div>
                  <span className="text-amber-300 font-bold block text-[11px]">Equipe de Fusão no Local</span>
                  <span className="text-[10px] text-slate-400">Caixa de emenda aberta, cabos sendo re-fundidos</span>
                </div>
              </div>

              <div className="flex items-start gap-3 relative">
                <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0 mt-0.5 z-10">
                  ○
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[11px]">Sincronização com Concentrador BNG</span>
                  <span className="text-[10px] text-slate-500">Previsão: {incidente.previsaoRetorno}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer & Botão de Notificação */}
        <div className="pt-4 mt-4 border-t border-white/5 flex flex-col gap-3 relative z-10">
          {feedback && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl animate-in fade-in slide-in-from-bottom-2">
              {feedback}
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleAtivarAviso}
              disabled={notificacaoAtivada}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                notificacaoAtivada
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10'
              }`}
            >
              {notificacaoAtivada ? <Check size={14} /> : <Bell size={14} className="text-amber-400" />}
              {notificacaoAtivada ? 'Aviso Ativado!' : 'Avise-me quando Normalizar'}
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-600/20"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
