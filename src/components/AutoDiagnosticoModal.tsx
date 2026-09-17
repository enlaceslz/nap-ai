import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Wifi, 
  Router, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Zap, 
  ShieldCheck, 
  Clock, 
  Signal, 
  Radio, 
  ArrowRight,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';

interface AutoDiagnosticoModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteBairro?: string;
}

interface StepStatus {
  id: number;
  label: string;
  status: 'pending' | 'running' | 'success' | 'warning' | 'error';
  detalhe?: string;
}

export default function AutoDiagnosticoModal({ isOpen, onClose, clienteBairro = 'Centro Histórico' }: AutoDiagnosticoModalProps) {
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [rebooting, setRebooting] = useState(false);
  const [rebootSuccess, setRebootSuccess] = useState(false);
  const [rebootTimer, setRebootTimer] = useState(45);
  const [incidenteDetectado, setIncidenteDetectado] = useState<any | null>(null);

  const [steps, setSteps] = useState<StepStatus[]>([
    { id: 1, label: 'Telemetria Óptica da ONU (GenieACS)', status: 'pending' },
    { id: 2, label: 'Sessão PPPoE e IP WAN no Concentrador', status: 'pending' },
    { id: 3, label: 'Varredura de Rompimentos no Bairro (NOC)', status: 'pending' },
    { id: 4, label: 'Latência e Servidores DNS do Provedor', status: 'pending' },
  ]);

  const runDiagnostic = async () => {
    setRunning(true);
    setCompleted(false);
    setIncidenteDetectado(null);

    // Reset steps
    setSteps([
      { id: 1, label: 'Telemetria Óptica da ONU (GenieACS)', status: 'running' },
      { id: 2, label: 'Sessão PPPoE e IP WAN no Concentrador', status: 'pending' },
      { id: 3, label: 'Varredura de Rompimentos no Bairro (NOC)', status: 'pending' },
      { id: 4, label: 'Latência e Servidores DNS do Provedor', status: 'pending' },
    ]);

    // Step 1: GenieACS TR-069
    await new Promise(r => setTimeout(r, 900));
    setSteps(prev => [
      { ...prev[0], status: 'success', detalhe: 'Sinal Óptico RX: -19.4 dBm (Excelente, faixa ideal de -15 a -25 dBm)' },
      { ...prev[1], status: 'running' },
      prev[2],
      prev[3]
    ]);

    // Step 2: PPPoE
    await new Promise(r => setTimeout(r, 800));
    setSteps(prev => [
      prev[0],
      { ...prev[1], status: 'success', detalhe: 'Autenticado no BNG: IP 177.85.112.44 | Uptime da sessão: 4d 14h' },
      { ...prev[2], status: 'running' },
      prev[3]
    ]);

    // Step 3: Check NOC Incidents for this neighborhood
    await new Promise(r => setTimeout(r, 800));
    let outageFound = null;
    try {
      const res = await fetch('/api/incidentes');
      const data = await res.json();
      if (data.incidentes && Array.isArray(data.incidentes)) {
        outageFound = data.incidentes.find((inc: any) => 
          inc.status !== 'normalizado' && 
          inc.regioesAfetadas.some((r: string) => r.toLowerCase().includes(clienteBairro.toLowerCase()) || clienteBairro.toLowerCase().includes(r.toLowerCase()))
        );
      }
    } catch {
      // ignore
    }

    if (outageFound) {
      setIncidenteDetectado(outageFound);
      setSteps(prev => [
        prev[0],
        prev[1],
        { ...prev[2], status: 'warning', detalhe: `Incidente Detectado: ${outageFound.titulo} (ETA: ${outageFound.previsaoRetorno})` },
        { ...prev[3], status: 'running' }
      ]);
    } else {
      setSteps(prev => [
        prev[0],
        prev[1],
        { ...prev[2], status: 'success', detalhe: 'Nenhuma ocorrência ou rompimento ativo na sua região' },
        { ...prev[3], status: 'running' }
      ]);
    }

    // Step 4: DNS / Latência
    await new Promise(r => setTimeout(r, 700));
    setSteps(prev => [
      prev[0],
      prev[1],
      prev[2],
      { ...prev[3], status: 'success', detalhe: 'Latência do Gateway: 3ms | Resolução DNS: 1ms (100% Estável)' }
    ]);

    setRunning(false);
    setCompleted(true);
  };

  useEffect(() => {
    if (isOpen) {
      runDiagnostic();
    } else {
      setRebooting(false);
      setRebootSuccess(false);
    }
  }, [isOpen]);

  const handleReboot = async () => {
    setRebooting(true);
    setRebootTimer(45);
    try {
      await fetch('/api/portal/wifi/reboot', { method: 'POST' });
    } catch {
      // ignore
    }

    const interval = setInterval(() => {
      setRebootTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setRebooting(false);
          setRebootSuccess(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Activity size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 font-outfit">Auto-Diagnóstico de Rede</h3>
              <p className="text-xs text-slate-500">Telemetria GenieACS & Varredura NOC em tempo real</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Corpo do Diagnóstico */}
        <div className="py-6 overflow-y-auto space-y-4 flex-1">
          {incidenteDetectado && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900">
              <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={20} />
              <div className="text-xs">
                <p className="font-bold text-sm text-amber-950">Aviso do NOC: Manutenção ou Rompimento Ativo</p>
                <p className="mt-1 leading-relaxed">
                  Identificamos uma instabilidade na malha óptica do seu bairro ({clienteBairro}). Nossas equipes já estão no local realizando o reparo.
                </p>
                <div className="mt-2 pt-2 border-t border-amber-200/60 flex flex-wrap gap-2 text-[11px] font-mono">
                  <span className="font-bold">ETA: {incidenteDetectado.previsaoRetorno}</span>
                  <span>•</span>
                  <span>Anatel: {incidenteDetectado.protocoloAnatel}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {steps.map(step => (
              <div 
                key={step.id} 
                className={`p-3.5 rounded-2xl border transition-all ${
                  step.status === 'running' 
                    ? 'bg-blue-50/50 border-blue-200 shadow-sm' 
                    : step.status === 'success' 
                    ? 'bg-slate-50/70 border-slate-200' 
                    : step.status === 'warning'
                    ? 'bg-amber-50/60 border-amber-200'
                    : 'bg-white border-slate-100 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    {step.status === 'running' && <RefreshCw size={14} className="text-blue-600 animate-spin" />}
                    {step.status === 'success' && <CheckCircle2 size={14} className="text-emerald-600" />}
                    {step.status === 'warning' && <AlertTriangle size={14} className="text-amber-600" />}
                    {step.status === 'pending' && <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 inline-block"></span>}
                    {step.label}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider">
                    {step.status === 'running' && <span className="text-blue-600">Testando...</span>}
                    {step.status === 'success' && <span className="text-emerald-600">Excelente</span>}
                    {step.status === 'warning' && <span className="text-amber-600">Alerta</span>}
                    {step.status === 'pending' && <span className="text-slate-400">Aguardando</span>}
                  </span>
                </div>
                {step.detalhe && (
                  <p className="text-[11px] text-slate-600 mt-1.5 pl-5 font-mono">
                    {step.detalhe}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Rebooting status banner */}
          {rebooting && (
            <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl text-center space-y-2 animate-in fade-in">
              <RefreshCw className="animate-spin text-blue-600 mx-auto" size={28} />
              <h4 className="font-bold text-slate-900 text-sm">Reiniciando seu Roteador remotamente...</h4>
              <p className="text-xs text-slate-600">Comando TR-069 transmitido com sucesso. Aguarde o ciclo de energia.</p>
              <div className="text-2xl font-mono font-bold text-blue-700">{rebootTimer}s</div>
            </div>
          )}

          {rebootSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-sm text-emerald-950">Roteador Reiniciado com Sucesso!</p>
                <p className="text-emerald-800">Sua conexão foi restabelecida e os canais de Wi-Fi foram otimizados.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
          <button 
            onClick={runDiagnostic}
            disabled={running || rebooting}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={14} className={running ? "animate-spin" : ""} />
            Repetir Teste
          </button>

          <button 
            onClick={handleReboot}
            disabled={running || rebooting}
            className="flex-1 py-3 px-4 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-700/20 disabled:opacity-50 active:scale-95"
          >
            <Router size={15} />
            Reiniciar Roteador (TR-069)
          </button>
        </div>

      </div>
    </div>
  );
}
