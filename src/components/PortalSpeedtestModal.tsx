import React, { useState, useEffect } from 'react';
import { 
  Gauge, 
  ArrowDown, 
  ArrowUp, 
  Activity, 
  RotateCcw, 
  CheckCircle2, 
  X, 
  Server, 
  ShieldCheck,
  AlertCircle,
  Share2
} from 'lucide-react';

interface PortalSpeedtestModalProps {
  isOpen: boolean;
  onClose: () => void;
  planoNome?: string;
  velocidadeNominal?: number; // em Mbps (ex: 500)
}

type TestPhase = 'idle' | 'ping' | 'download' | 'upload' | 'completed';

export default function PortalSpeedtestModal({
  isOpen,
  onClose,
  planoNome = 'Fibra 500MB',
  velocidadeNominal = 500
}: PortalSpeedtestModalProps) {
  const [phase, setPhase] = useState<TestPhase>('idle');
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [ping, setPing] = useState<number | null>(null);
  const [jitter, setJitter] = useState<number | null>(null);
  const [downloadSpeed, setDownloadSpeed] = useState<number | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState<number | null>(null);
  const [serverInfo, setServerInfo] = useState({
    nome: 'Servidor Local NAP • BNG / Gateway',
    ip: '127.0.0.1',
    distancia: 'Rede Local'
  });
  const [speedtestConfigured, setSpeedtestConfigured] = useState<boolean | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (isOpen && phase === 'idle') {
      startSpeedtest();
    }
  }, [isOpen]);

  const startSpeedtest = async () => {
    setPhase('ping');
    setCurrentSpeed(0);
    setPing(null);
    setJitter(null);
    setDownloadSpeed(null);
    setUploadSpeed(null);
    setSpeedtestConfigured(null);

    // 1. Medição Real de Latência HTTP (Round-Trip Time) contra o backend
    const samples: number[] = [];
    for (let i = 0; i < 4; i++) {
      const t0 = performance.now();
      try {
        await fetch(`/api/health?_t=${Date.now()}`, { cache: 'no-store' });
        const rtt = performance.now() - t0;
        samples.push(rtt);
      } catch {
        // Falha no ping
      }
      await new Promise(r => setTimeout(r, 120));
    }

    if (samples.length > 0) {
      const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
      const measuredPing = Math.round(avg * 10) / 10;
      const diffs = samples.map(s => Math.abs(s - avg));
      const measuredJitter = Math.round((diffs.reduce((a, b) => a + b, 0) / diffs.length) * 10) / 10;
      setPing(measuredPing);
      setJitter(measuredJitter);
    }

    // 2. Consulta de servidor dedicado de aferição de banda (NBI / LibreSpeed)
    setPhase('download');
    try {
      const res = await fetch('/api/portal/speedtest', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          velocidade: velocidadeNominal,
          simetrico: planoNome.toLowerCase().includes('simétrico') || planoNome.toLowerCase().includes('simetrico')
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.sucesso && data.downloadMbps) {
          setSpeedtestConfigured(true);
          setDownloadSpeed(data.downloadMbps);
          setUploadSpeed(data.uploadMbps || null);
          if (data.pingMs) setPing(data.pingMs);
          if (data.jitterMs) setJitter(data.jitterMs);
          if (data.servidor) setServerInfo({ nome: data.servidor, ip: data.ipPublico || '127.0.0.1', distancia: `${data.distanciaKm || 0} km` });
        } else {
          setSpeedtestConfigured(false);
        }
      } else {
        setSpeedtestConfigured(false);
      }
    } catch {
      setSpeedtestConfigured(false);
    }

    setPhase('completed');
  };

  const handleCompartilhar = () => {
    const texto = `Teste de Conexão NAP: Latência ${ping ?? '--'}ms, Jitter ${jitter ?? '--'}ms no plano ${planoNome}.`;
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-card border border-border rounded-3xl w-full max-w-lg p-6 shadow-2xl relative overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <Gauge size={20} />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base font-outfit">Speedtest do Provedor</h3>
              <p className="text-xs text-muted-foreground">Medição real de latência e estabilidade da rede</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-accent transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Informações do Servidor */}
        <div className="mt-4 p-3 bg-white/[0.02] border border-border rounded-2xl flex items-center justify-between text-xs relative z-10">
          <div className="flex items-center gap-2">
            <Server size={14} className="text-blue-400" />
            <div>
              <span className="text-foreground font-medium block">{serverInfo.nome}</span>
              <span className="text-[10px] text-muted-foreground font-mono">IP: {serverInfo.ip} • {serverInfo.distancia}</span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            LOCAL
          </span>
        </div>

        {/* Velocímetro Central / Indicador de Latência */}
        <div className="my-6 flex flex-col items-center justify-center relative">
          <div className="relative w-64 h-32 flex items-end justify-center overflow-hidden">
            <div className="flex flex-col items-center justify-center pb-2 relative z-10">
              <span className="text-4xl md:text-5xl font-black font-outfit text-foreground tracking-tight">
                {ping !== null ? `${ping}` : '--'}
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
                ms Latência
              </span>
            </div>
          </div>

          {/* Status da Fase Atual */}
          <div className="mt-2 text-center">
            {phase === 'ping' && (
              <span className="text-xs font-mono text-amber-400 animate-pulse flex items-center justify-center gap-1.5">
                <Activity size={12} /> Medindo latência HTTP com o servidor local...
              </span>
            )}
            {phase === 'download' && (
              <span className="text-xs font-mono text-blue-400 animate-pulse flex items-center justify-center gap-1.5">
                <ArrowDown size={12} /> Verificando agente de vazão...
              </span>
            )}
            {phase === 'completed' && (
              <span className="text-xs font-mono text-emerald-400 flex items-center justify-center gap-1.5 font-bold">
                <CheckCircle2 size={13} /> Aferição concluída!
              </span>
            )}
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-4 gap-2 mb-4 relative z-10">
          {/* Download */}
          <div className="bg-background border border-border rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">
              <ArrowDown size={11} /> Down
            </div>
            <div className="text-base md:text-lg font-black font-outfit text-foreground">
              {downloadSpeed !== null ? `${downloadSpeed}` : '--'}
            </div>
            <span className="text-[9px] text-muted-foreground font-mono">Mbps</span>
          </div>

          {/* Upload */}
          <div className="bg-background border border-border rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1">
              <ArrowUp size={11} /> Up
            </div>
            <div className="text-base md:text-lg font-black font-outfit text-foreground">
              {uploadSpeed !== null ? `${uploadSpeed}` : '--'}
            </div>
            <span className="text-[9px] text-muted-foreground font-mono">Mbps</span>
          </div>

          {/* Ping */}
          <div className="bg-background border border-border rounded-2xl p-3 text-center">
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
              Ping
            </div>
            <div className="text-base md:text-lg font-black font-outfit text-foreground">
              {ping !== null ? `${ping}` : '--'}
            </div>
            <span className="text-[9px] text-muted-foreground font-mono">ms</span>
          </div>

          {/* Jitter */}
          <div className="bg-background border border-border rounded-2xl p-3 text-center">
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
              Jitter
            </div>
            <div className="text-base md:text-lg font-black font-outfit text-foreground">
              {jitter !== null ? `${jitter}` : '--'}
            </div>
            <span className="text-[9px] text-muted-foreground font-mono">ms</span>
          </div>
        </div>

        {/* Diagnóstico Real */}
        {phase === 'completed' && (
          <div className="p-3.5 bg-slate-900/50 border border-border rounded-2xl mb-4 text-xs animate-in fade-in">
            {speedtestConfigured ? (
              <div className="flex items-center gap-2 font-bold text-emerald-300 mb-1">
                <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                <span>Medição realizada pelo servidor de teste de banda ({planoNome})</span>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-muted-foreground leading-relaxed">
                <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-foreground block mb-0.5">Latência real aferida com sucesso</span>
                  <span>Servidor dedicado de teste de vazão (Speedtest NBI/LibreSpeed) não configurado na infraestrutura local. Latência: <strong>{ping}ms</strong>, variação: <strong>{jitter}ms</strong>.</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botões de Ação */}
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-border relative z-10">
          <button
            onClick={startSpeedtest}
            disabled={phase !== 'completed' && phase !== 'idle'}
            className="px-4 py-2.5 bg-white/5 hover:bg-accent text-foreground rounded-xl text-xs font-bold transition-all border border-border flex items-center gap-2 disabled:opacity-50"
          >
            <RotateCcw size={14} /> Testar Novamente
          </button>

          <div className="flex items-center gap-2">
            {phase === 'completed' && (
              <button
                onClick={handleCompartilhar}
                className="px-3.5 py-2.5 bg-white/5 hover:bg-accent text-muted-foreground hover:text-foreground rounded-xl text-xs font-bold transition-all border border-border flex items-center gap-1.5"
              >
                {copiado ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Share2 size={14} />}
                {copiado ? 'Copiado!' : 'Compartilhar'}
              </button>
            )}

            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
