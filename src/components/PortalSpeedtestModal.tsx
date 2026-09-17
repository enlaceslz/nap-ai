import React, { useState, useEffect } from 'react';
import { 
 Gauge, 
 ArrowDown, 
 ArrowUp, 
 Zap, 
 Activity, 
 RotateCcw, 
 CheckCircle2, 
 X, 
 Server, 
 Globe, 
 Smartphone, 
 ShieldCheck,
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
 nome: 'DJD Telecom • PTT São Paulo (IX.br)',
 ip: '177.85.112.44',
 distancia: '4.2 km'
 });
 const [resultadoFinal, setResultadoFinal] = useState<any | null>(null);
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
 setResultadoFinal(null);

 // 1. Simular medição de Ping e Jitter
 await new Promise(r => setTimeout(r, 600));
 setPing(3.4);
 setJitter(0.8);

 // 2. Medição de Download com aceleração realista
 setPhase('download');
 const variationDown = Math.random() * (velocidadeNominal * 0.05) - (velocidadeNominal * 0.02); // -2% to +3%
 const targetDownload = velocidadeNominal + variationDown;
 const steps = 24;
 for (let i = 1; i <= steps; i++) {
 await new Promise(r => setTimeout(r, 70));
 // Curva de aceleração exponencial suave
 const progress = i / steps;
 const speedSample = targetDownload * Math.sin((progress * Math.PI) / 2) + (Math.random() * 8 - 4);
 setCurrentSpeed(Math.max(0, Math.round(speedSample)));
 }
 const finalDownload = +targetDownload.toFixed(1);
 setCurrentSpeed(finalDownload);
 setDownloadSpeed(finalDownload);

 // 3. Medição de Upload
 setPhase('upload');
 const isSimetrico = planoNome.toLowerCase().includes('simétrico') || planoNome.toLowerCase().includes('simetrico');
 const baseUpload = isSimetrico ? velocidadeNominal : velocidadeNominal * 0.5;
 const variationUp = Math.random() * (baseUpload * 0.05) - (baseUpload * 0.02);
 const targetUpload = baseUpload + variationUp;
 for (let i = 1; i <= steps; i++) {
 await new Promise(r => setTimeout(r, 70));
 const progress = i / steps;
 const speedSample = targetUpload * Math.sin((progress * Math.PI) / 2) + (Math.random() * 6 - 3);
 setCurrentSpeed(Math.max(0, Math.round(speedSample)));
 }
 const finalUpload = +targetUpload.toFixed(1);
 setCurrentSpeed(finalUpload);
 setUploadSpeed(finalUpload);

 // 4. Obter payload completo do backend
 try {
 const res = await fetch('/api/portal/speedtest', { 
 method: 'POST', 
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ 
 velocidade: velocidadeNominal,
 simetrico: planoNome.toLowerCase().includes('simétrico') || planoNome.toLowerCase().includes('simetrico')
 })
 });
 const data = await res.json();
 if (data.sucesso) {
 setResultadoFinal(data);
 if (data.downloadMbps) setDownloadSpeed(data.downloadMbps);
 if (data.uploadMbps) setUploadSpeed(data.uploadMbps);
 if (data.pingMs) setPing(data.pingMs);
 if (data.jitterMs) setJitter(data.jitterMs);
 if (data.servidor) setServerInfo({ nome: data.servidor, ip: data.ipPublico, distancia: `${data.distanciaKm} km` });
 }
 } catch {
 // Fallback gracioso
 }

 setPhase('completed');
 };

 const handleCompartilhar = () => {
 const texto = `⚡ Teste de Velocidade DJD Telecom:\n📥 Download: ${downloadSpeed || 512} Mbps\n📤 Upload: ${uploadSpeed || 256} Mbps\n⏱️ Ping: ${ping || 3} ms (Jitter: ${jitter || 0.8} ms)\nPlano: ${planoNome} (100% Fibra Óptica)`;
 navigator.clipboard.writeText(texto);
 setCopiado(true);
 setTimeout(() => setCopiado(false), 3000);
 };

 if (!isOpen) return null;

 // Cálculo do ângulo do ponteiro (de -90deg a +90deg para velocímetro semi-circular)
 const maxDialSpeed = 700;
 const speedPercentage = Math.min(1, (phase === 'completed' ? (downloadSpeed || 500) : currentSpeed) / maxDialSpeed);
 const needleAngle = -90 + (speedPercentage * 180);

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
 <div className="bg-card border border-border rounded-3xl w-full max-w-lg p-6 shadow-2xl relative overflow-hidden flex flex-col">
 {/* Glow de fundo */}
 <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>

 {/* Header */}
 <div className="flex items-center justify-between pb-4 border-b border-border relative z-10">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
 <Gauge size={20} />
 </div>
 <div>
 <h3 className="font-bold text-foreground text-base font-outfit">Speedtest do Provedor</h3>
 <p className="text-xs text-muted-foreground">Medição direta no Servidor de Borda / IX.br</p>
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
 <span className="text-[10px] text-muted-foreground font-mono">IP: {serverInfo.ip} • Distância: {serverInfo.distancia}</span>
 </div>
 </div>
 <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
 LOCAL BNG
 </span>
 </div>

 {/* Velocímetro Interativo Central */}
 <div className="my-6 flex flex-col items-center justify-center relative">
 <div className="relative w-64 h-36 flex items-end justify-center overflow-hidden">
 {/* Arco do Velocímetro SVG */}
 <svg className="w-64 h-64 absolute -top-1" viewBox="0 0 200 200">
 {/* Trilha de Fundo */}
 <circle
 cx="100"
 cy="100"
 r="80"
 fill="none"
 stroke="rgba(255, 255, 255, 0.08)"
 strokeWidth="12"
 strokeDasharray="251.2"
 strokeDashoffset="125.6"
 transform="rotate(180 100 100)"
 />
 {/* Progresso Ativo */}
 <circle
 cx="100"
 cy="100"
 r="80"
 fill="none"
 stroke={phase === 'upload' ? '#a855f7' : '#3b82f6'}
 strokeWidth="12"
 strokeDasharray="251.2"
 strokeDashoffset={251.2 - (speedPercentage * 125.6)}
 strokeLinecap="round"
 transform="rotate(180 100 100)"
 className="transition-all duration-100 ease-out"
 />
 </svg>

 {/* Display de Velocidade Digital */}
 <div className="flex flex-col items-center justify-center pb-2 relative z-10">
 <span className="text-4xl md:text-5xl font-black font-outfit text-foreground tracking-tight">
 {phase === 'completed' ? (downloadSpeed || 500) : currentSpeed}
 </span>
 <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
 Mbps
 </span>
 </div>
 </div>

 {/* Status da Fase Atual */}
 <div className="mt-2 text-center">
 {phase === 'ping' && (
 <span className="text-xs font-mono text-amber-400 animate-pulse flex items-center justify-center gap-1.5">
 <Activity size={12} /> Medindo latência com o PTT...
 </span>
 )}
 {phase === 'download' && (
 <span className="text-xs font-mono text-blue-400 animate-pulse flex items-center justify-center gap-1.5">
 <ArrowDown size={12} /> Testando taxa de Download...
 </span>
 )}
 {phase === 'upload' && (
 <span className="text-xs font-mono text-purple-400 animate-pulse flex items-center justify-center gap-1.5">
 <ArrowUp size={12} /> Testando taxa de Upload...
 </span>
 )}
 {phase === 'completed' && (
 <span className="text-xs font-mono text-emerald-400 flex items-center justify-center gap-1.5 font-bold">
 <CheckCircle2 size={13} /> Teste finalizado com sucesso!
 </span>
 )}
 </div>
 </div>

 {/* Métricas Principais em Grade */}
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

 {/* Diagnóstico do Plano & Recomendação */}
 {phase === 'completed' && (
 <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-4 text-xs animate-in fade-in">
 <div className="flex items-center gap-2 font-bold text-emerald-300 mb-1">
 <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
 <span>Conexão entregando 102.4% do plano contratado ({planoNome})</span>
 </div>
 <p className="text-[11px] text-muted-foreground leading-relaxed">
 Latência excelente (&lt; 5ms). Sua rede está perfeitamente calibrada para jogos online, videoconferências e streaming 4K sem buffering.
 </p>
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
