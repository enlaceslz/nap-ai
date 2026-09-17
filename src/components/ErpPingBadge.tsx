import React from 'react';
import { Radio, Wifi, AlertTriangle, XCircle, RefreshCw, Loader2 } from 'lucide-react';

export interface PingData {
  erpId: string;
  nome: string;
  online: boolean;
  latenciaMs: number | null;
  qualidade: 'excelente' | 'estavel' | 'lento' | 'offline';
  jitterMs?: number | null;
  timestamp?: string;
}

interface ErpPingBadgeProps {
  ping?: PingData;
  loading?: boolean;
  compact?: boolean;
  onRefresh?: () => void;
  showBars?: boolean;
}

export default function ErpPingBadge({
  ping,
  loading = false,
  compact = false,
  onRefresh,
  showBars = true
}: ErpPingBadgeProps) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-[10px] font-mono">
        <Loader2 size={10} className="animate-spin text-blue-400" />
        <span>Pingando...</span>
      </span>
    );
  }

  if (!ping) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 text-slate-500 text-[10px] font-mono">
        <Radio size={10} />
        <span>-- ms</span>
      </span>
    );
  }

  const { online, latenciaMs, qualidade } = ping;

  // Cálculo das 4 barras de sinal de conexão
  const renderSignalBars = (level: number) => {
    return (
      <span className="inline-flex items-end gap-0.5 h-3 px-0.5" title={`Nível de Sinal: ${level}/4`}>
        <span className={`w-0.5 rounded-full transition-all ${level >= 1 ? (level === 1 ? 'bg-amber-400 h-1.5' : 'bg-emerald-400 h-1.5') : 'bg-slate-700 h-1.5'}`} />
        <span className={`w-0.5 rounded-full transition-all ${level >= 2 ? (level <= 2 ? 'bg-amber-400 h-2' : 'bg-emerald-400 h-2') : 'bg-slate-700 h-2'}`} />
        <span className={`w-0.5 rounded-full transition-all ${level >= 3 ? 'bg-emerald-400 h-2.5' : 'bg-slate-700 h-2.5'}`} />
        <span className={`w-0.5 rounded-full transition-all ${level >= 4 ? 'bg-emerald-400 h-3' : 'bg-slate-700 h-3'}`} />
      </span>
    );
  };

  if (!online || latenciaMs === null) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-mono font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
        <XCircle size={11} />
        <span>Offline</span>
        {onRefresh && (
          <button 
            type="button" 
            onClick={(e) => { e.stopPropagation(); onRefresh(); }}
            className="hover:text-rose-200 transition-colors ml-0.5"
            title="Re-testar ping"
          >
            <RefreshCw size={9} />
          </button>
        )}
      </div>
    );
  }

  // Estilos conforme a qualidade
  let colorClasses = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
  let dotColor = 'bg-emerald-400';
  let labelQualidade = 'Excelente';
  let barsLevel = 4;

  if (qualidade === 'estavel' || (latenciaMs >= 60 && latenciaMs < 150)) {
    colorClasses = 'bg-amber-500/10 border-amber-500/20 text-amber-300';
    dotColor = 'bg-amber-400';
    labelQualidade = 'Estável';
    barsLevel = 3;
  } else if (qualidade === 'lento' || latenciaMs >= 150) {
    colorClasses = 'bg-orange-500/10 border-orange-500/20 text-orange-400';
    dotColor = 'bg-orange-400';
    labelQualidade = 'Lento';
    barsLevel = 2;
  }

  if (compact) {
    return (
      <span 
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border font-mono text-[10px] font-bold ${colorClasses}`}
        title={`Ping ${latenciaMs}ms (${labelQualidade})`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse shrink-0`}></span>
        <span>{latenciaMs}ms</span>
      </span>
    );
  }

  return (
    <div 
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-xl border text-[11px] font-mono font-medium ${colorClasses} shadow-sm backdrop-blur-xs`}
      title={`Comunicação em Tempo Real: ${latenciaMs}ms • Jitter: ±${ping.jitterMs || 3}ms • Classificação: ${labelQualidade}`}
    >
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}></span>
        </span>
        {showBars && renderSignalBars(barsLevel)}
      </div>

      <div className="flex items-center gap-1 font-bold">
        <span>{latenciaMs} ms</span>
        <span className="text-[9px] uppercase tracking-wider opacity-80 font-sans hidden sm:inline">
          • {labelQualidade}
        </span>
      </div>

      {onRefresh && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRefresh();
          }}
          className="opacity-70 hover:opacity-100 hover:rotate-180 transition-all p-0.5 ml-0.5 text-current"
          title="Atualizar ping agora"
        >
          <RefreshCw size={10} />
        </button>
      )}
    </div>
  );
}
