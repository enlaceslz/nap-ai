import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  ArrowDown, 
  ArrowUp, 
  HardDrive, 
  Tv, 
  Laptop, 
  Smartphone, 
  Radio, 
  Clock, 
  ShieldCheck, 
  X, 
  Calendar, 
  RefreshCw,
  Zap
} from 'lucide-react';

interface PortalConsumoModalProps {
  isOpen: boolean;
  onClose: () => void;
  planoNome?: string;
}

export default function PortalConsumoModal({
  isOpen,
  onClose,
  planoNome = 'Fibra 500MB'
}: PortalConsumoModalProps) {
  const [loading, setLoading] = useState(true);
  const [dadosConsumo, setDadosConsumo] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/portal/consumo')
        .then(res => res.json())
        .then(data => {
          if (data.sucesso) {
            setDadosConsumo(data);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getDeviceIcon = (tipo: string) => {
    switch (tipo) {
      case 'tv': return <Tv size={15} className="text-purple-400" />;
      case 'pc': return <Laptop size={15} className="text-blue-400" />;
      case 'laptop': return <Laptop size={15} className="text-emerald-400" />;
      case 'smartphone': return <Smartphone size={15} className="text-amber-400" />;
      default: return <Radio size={15} className="text-slate-400" />;
    }
  };

  const maxDaily = dadosConsumo?.historicoSemanal 
    ? Math.max(...dadosConsumo.historicoSemanal.map((d: any) => d.totalGB)) 
    : 130;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <BarChart2 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base font-outfit">Extrato de Consumo de Banda</h3>
              <p className="text-xs text-slate-400 font-mono">
                {dadosConsumo?.periodo || 'Mês Vigente'} • {planoNome}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <RefreshCw size={24} className="animate-spin text-indigo-400" />
            <span className="text-xs text-slate-400 font-mono">Consultando telemetria do concentrador BNG...</span>
          </div>
        ) : (
          <div className="mt-4 space-y-5 overflow-y-auto pr-1">
            {/* Cards de Resumo Geral */}
            <div className="grid grid-cols-3 gap-3">
              {/* Total Geral */}
              <div className="bg-slate-950 border border-white/5 rounded-2xl p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Tráfego Total
                </span>
                <div className="text-lg md:text-xl font-black font-outfit text-white">
                  {dadosConsumo?.totalGeralGB?.toFixed(1) || '572.0'} <span className="text-xs font-mono text-indigo-400 font-bold">GB</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                  Média: {dadosConsumo?.mediaDiariaGB || '19'} GB/dia
                </span>
              </div>

              {/* Download */}
              <div className="bg-slate-950 border border-white/5 rounded-2xl p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1 mb-1">
                  <ArrowDown size={11} /> Download
                </span>
                <div className="text-lg md:text-xl font-black font-outfit text-white">
                  {dadosConsumo?.totalDownloadGB?.toFixed(1) || '482.6'} <span className="text-xs font-mono text-blue-400 font-bold">GB</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">84% do tráfego</span>
              </div>

              {/* Upload */}
              <div className="bg-slate-950 border border-white/5 rounded-2xl p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1 mb-1">
                  <ArrowUp size={11} /> Upload
                </span>
                <div className="text-lg md:text-xl font-black font-outfit text-white">
                  {dadosConsumo?.totalUploadGB?.toFixed(1) || '89.4'} <span className="text-xs font-mono text-purple-400 font-bold">GB</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">16% do tráfego</span>
              </div>
            </div>

            {/* Gráfico Semanal dos Últimos 7 Dias */}
            <div className="bg-slate-950 border border-white/5 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Calendar size={13} className="text-indigo-400" />
                  Consumo Diário (Últimos 7 Dias)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Em Gigabytes (GB)</span>
              </div>

              {/* Barras de Consumo */}
              <div className="grid grid-cols-7 gap-2 items-end pt-4 h-36">
                {(dadosConsumo?.historicoSemanal || []).map((item: any, idx: number) => {
                  const barHeight = Math.max(15, Math.round((item.totalGB / maxDaily) * 100));
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                      <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.totalGB}G
                      </span>
                      <div className="w-full bg-white/5 rounded-lg overflow-hidden flex flex-col justify-end h-24 relative">
                        {/* Barra Total com gradiente */}
                        <div 
                          style={{ height: `${barHeight}%` }}
                          className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-lg group-hover:from-blue-500 group-hover:to-indigo-400 transition-all"
                        ></div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 text-center truncate w-full">
                        {item.dia.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dispositivos com Maior Consumo */}
            <div className="bg-slate-950 border border-white/5 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Consumo por Aparelho na Residência
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Telemetria TR-069</span>
              </div>

              <div className="space-y-2.5">
                {(dadosConsumo?.consumoPorDispositivo || []).map((dev: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        {getDeviceIcon(dev.tipo)}
                      </div>
                      <span className="text-slate-300 font-medium truncate">{dev.nome}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-20 bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-full rounded-full" 
                          style={{ width: `${dev.percentual}%` }}
                        ></div>
                      </div>
                      <span className="font-mono text-white font-bold text-right w-16">
                        {dev.consumoGB} GB
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aviso Anatel Franquia Ilimitada */}
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-2.5 text-xs">
              <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-300 block">Franquia Ilimitada (100% Fibra Óptica)</span>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  Conforme regulamentação da Anatel, seu plano possui dados ilimitados sem redução de velocidade, sem bloqueios e sem cobrança por excedente.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 mt-2 border-t border-white/5 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20"
          >
            Fechar Extrato
          </button>
        </div>
      </div>
    </div>
  );
}
