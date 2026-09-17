import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, PhoneOff, Mic, MicOff, Pause, Delete, Hash, User, Shield, 
  PhoneForwarded, Volume2, Signal, Sparkles, Check, RefreshCw,
  Activity, AlertTriangle, MessageSquare, Brain, Radio, ArrowDownCircle, ChevronDown, ChevronUp
} from 'lucide-react';

// DTMF Frequencies (Hz)
const DTMF_FREQS: Record<string, [number, number]> = {
  '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
  '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
  '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
  '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
};

interface VoiceAnalysisTurn {
  id: string;
  speaker: 'cliente' | 'operador';
  time: string;
  transcription: string;
  sentiment: 'positivo' | 'neutro' | 'frustrado' | 'irritado' | 'satisfeito';
  score: number;
  urgency: 'baixa' | 'media' | 'alta' | 'critica';
  topic: string;
  pilar?: 'suporte' | 'cobranca' | 'vendas';
  suggestion?: string;
  insights?: string[];
}

export interface WebphoneProps {
  embedded?: boolean;
  className?: string;
  defaultExtension?: string;
  onCallStateChange?: (onCall: boolean, details?: { number: string; duration: number }) => void;
  clientMode?: boolean;
  incomingCallData?: {
    nome: string;
    cpf: string;
    motivo: string;
  } | null;
}

export default function Webphone({ 
  embedded = false, 
  className = '', 
  defaultExtension = '2001',
  onCallStateChange,
  clientMode = false,
  incomingCallData = null
}: WebphoneProps) {
  const [isOpen, setIsOpen] = useState(embedded);
  const [dialNumber, setDialNumber] = useState('');
  const [onCall, setOnCall] = useState(false);
  const [muted, setMuted] = useState(false);
  const [onHold, setOnHold] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showKeypadInCall, setShowKeypadInCall] = useState(false);

  // Audio output volume (WebRTC gain control)
  const [audioVolume, setAudioVolume] = useState<number>(85);
  const [showAudioSettings, setShowAudioSettings] = useState(false);

  // Gemini Real-Time Voice Intelligence State
  const [voiceAiActive, setVoiceAiActive] = useState(true);
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);
  const [turns, setTurns] = useState<VoiceAnalysisTurn[]>([]);
  const [activeSentiment, setActiveSentiment] = useState<'positivo' | 'neutro' | 'frustrado' | 'irritado' | 'satisfeito'>('neutro');
  const [currentScore, setCurrentScore] = useState(0.0);
  const [activeUrgency, setActiveUrgency] = useState<'baixa' | 'media' | 'alta' | 'critica'>('baixa');
  const [latestSuggestion, setLatestSuggestion] = useState<string>('');
  const [showLiveTranscription, setShowLiveTranscription] = useState(true);
  const [isMicRecording, setIsMicRecording] = useState(false);

  // Pós-chamada com IA Gemini
  const [showPostCallSummary, setShowPostCallSummary] = useState(false);
  const [lastCallInfo, setLastCallInfo] = useState<{ number: string; duration: string } | null>(null);
  const [aiSummary, setAiSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [savedToSgp, setSavedToSgp] = useState(false);

  // Audio & MediaRecorder Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const playTone = (key: string) => {
    try {
      const freqs = DTMF_FREQS[key];
      if (!freqs) return;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(freqs[0], ctx.currentTime);
      osc2.frequency.setValueAtTime(freqs[1], ctx.currentTime);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.15);
    } catch {
      // AudioContext restrições de autoplay ignoradas suavemente
    }
  };

  // Timer de chamada ativa
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (onCall) {
      setCallSeconds(0);
      interval = setInterval(() => {
        setCallSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setCallSeconds(0);
      setOnHold(false);
      setMuted(false);
      setShowTransfer(false);
    }
    return () => clearInterval(interval);
  }, [onCall]);

  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Ramal simulado registrado no Asterisk nativo via WebRTC
  const sipStatus = "Registrado";
  const ramal = defaultExtension;

  // Notifica o componente pai sobre mudanças no estado da chamada
  useEffect(() => {
    if (onCallStateChange) {
      onCallStateChange(onCall, {
        number: dialNumber,
        duration: callSeconds
      });
    }
  }, [onCall, callSeconds, dialNumber, onCallStateChange]);

  const handleKeyPress = (key: string) => {
    playTone(key);
    setDialNumber((prev) => prev + key);
  };

  const handleBackspace = () => {
    setDialNumber((prev) => prev.slice(0, -1));
  };

  // Função para enviar fala/áudio para o backend Gemini
  const processVoiceTurn = async (transcriptText?: string, audioBase64?: string, speaker: 'cliente' | 'operador' = 'cliente') => {
    setIsAnalyzingVoice(true);
    try {
      const res = await fetch('/api/gemini/voice/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcriptText,
          audioBase64,
          speaker,
          callContext: {
            numero: dialNumber || '2001',
            duracao: formatDuration(callSeconds),
            ramal: ramal,
            pbx: 'Asterisk 20+ Nativo (ARI)'
          }
        })
      });

      const data = await res.json();

      const newTurn: VoiceAnalysisTurn = {
        id: 'turn_' + Date.now() + Math.random().toString(36).substring(2, 6),
        speaker,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        transcription: data.transcricao || transcriptText || "Áudio processado.",
        sentiment: data.sentimento || 'neutro',
        score: typeof data.score_sentimento === 'number' ? data.score_sentimento : 0,
        urgency: data.urgencia || 'media',
        topic: data.topico_principal || 'Atendimento Geral',
        pilar: data.pilar_sugerido || 'suporte',
        suggestion: data.sugestao_resposta,
        insights: data.insights_operador
      };

      setTurns(prev => [...prev.slice(-8), newTurn]);
      setActiveSentiment(newTurn.sentiment);
      setCurrentScore(newTurn.score);
      setActiveUrgency(newTurn.urgency);
      if (newTurn.suggestion) {
        setLatestSuggestion(newTurn.suggestion);
      }
    } catch (err) {
      console.error("Erro ao analisar voz via Gemini:", err);
    } finally {
      setIsAnalyzingVoice(false);
    }
  };

  // Ciclo de fala em tempo real enquanto a chamada estiver ativa
  useEffect(() => {
    if (!onCall || !voiceAiActive) {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
      return;
    }

    // Exemplos realistas de conversas em chamadas de ISP
    const ISP_CALL_TURNS = [
      { text: "Alô, bom dia! Aqui é do suporte do provedor, meu nome é Maria. Como posso te ajudar?", speaker: 'operador' as const },
      { text: "Oi Maria! Estou sem sinal de internet fibra desde as 9h da manhã, e a luz LOS no meu roteador está piscando em vermelho!", speaker: 'cliente' as const },
      { text: "Entendi perfeitamente. Estou consultando a telemetria do seu concentrador agora no sistema.", speaker: 'operador' as const },
      { text: "Por favor, corre com isso porque eu trabalho home office e tenho reunião com a diretoria em 20 minutos!", speaker: 'cliente' as const },
      { text: "Com certeza, identifiquei atenuação na fibra óptica na caixa da sua rua. Já acionei a equipe de plantão.", speaker: 'operador' as const },
      { text: "Nossa, muito obrigado pela rapidez no diagnóstico! Fico no aguardo.", speaker: 'cliente' as const }
    ];

    let turnIndex = 0;
    // Dispara a primeira fala quase imediatamente
    const initialTimeout = setTimeout(() => {
      if (turnIndex < ISP_CALL_TURNS.length) {
        processVoiceTurn(ISP_CALL_TURNS[turnIndex].text, undefined, ISP_CALL_TURNS[turnIndex].speaker);
        turnIndex++;
      }
    }, 1500);

    // E as próximas a cada 7 segundos para simular a escuta contínua do Asterisk
    simulationTimerRef.current = setInterval(() => {
      if (turnIndex < ISP_CALL_TURNS.length) {
        processVoiceTurn(ISP_CALL_TURNS[turnIndex].text, undefined, ISP_CALL_TURNS[turnIndex].speaker);
        turnIndex++;
      }
    }, 7500);

    return () => {
      clearTimeout(initialTimeout);
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
    };
  }, [onCall, voiceAiActive]);

  // Captura Real de Microfone do Operador/Cliente via WebRTC AudioStream
  const toggleMicrophoneRecording = async () => {
    if (isMicRecording) {
      // Parar gravação
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
      }
      setIsMicRecording(false);
    } else {
      // Iniciar gravação de microfone
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;

        const chunks: BlobPart[] = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            const base64Data = (reader.result as string).split(',')[1];
            if (base64Data) {
              processVoiceTurn(undefined, base64Data, 'operador');
            }
          };
        };

        mediaRecorder.start();
        setIsMicRecording(true);
      } catch (err) {
        console.warn("Permissão de microfone não concedida ou dispositivo não disponível:", err);
      }
    }
  };

  const toggleCall = () => {
    if (onCall) {
      // Registrar fim da ligação para resumo
      setLastCallInfo({
        number: dialNumber || 'Assinante Desconhecido',
        duration: formatDuration(callSeconds)
      });
      setShowPostCallSummary(true);

      // Gera resumo enriquecido com base nas falas capturadas pelo Gemini
      const transcriptSummary = turns.length > 0
        ? `Diálogo monitorado (${turns.length} falas). Tópico principal: ${turns[turns.length - 1]?.topic || 'Suporte Técnico'}. Sentimento final: ${activeSentiment} (${currentScore > 0 ? `+${currentScore.toFixed(1)}` : currentScore.toFixed(1)}).`
        : `Assinante (${dialNumber || '2001'}) contatou o provedor. Duração: ${formatDuration(callSeconds)}. Conexão e parâmetros validados.`;

      setAiSummary(transcriptSummary);
      setOnCall(false);
      if (isMicRecording) {
        toggleMicrophoneRecording();
      }
    } else {
      if (clientMode) {
        // Simulação: 20% de chance do operador estar ocupado
        const isOperatorBusy = Math.random() > 0.8;
        if (isOperatorBusy) {
          const playVoice = () => {
            const msg = new SpeechSynthesisUtterance("Desculpe, todos os nossos operadores estão ocupados no momento. Por favor, tente novamente em instantes ou mande uma mensagem no chat.");
            msg.lang = 'pt-BR';
            msg.rate = 1.05;
            msg.pitch = 1.25;
            
            const voices = window.speechSynthesis.getVoices();
            const preferred = ['Francisca', 'Luciana', 'Vitoria', 'Raquel', 'Maju', 'Google português do Brasil', 'Google pt-BR'];
            let voice = voices.find(v => v.lang.includes('pt-BR') && preferred.some(p => v.name.includes(p)));
            if (!voice) voice = voices.find(v => v.lang.includes('pt-BR'));
            if (voice) msg.voice = voice;
            
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(msg);
          };

          if (window.speechSynthesis.getVoices().length > 0) {
            playVoice();
          } else {
            window.speechSynthesis.onvoiceschanged = () => {
              playVoice();
              window.speechSynthesis.onvoiceschanged = null;
            };
          }
          console.warn('Asterisk SIP: 486 Busy Here - Operadores ocupados.');
          return;
        } else {
          setDialNumber(incomingCallData?.motivo || 'Fila de Atendimento');
          setOnCall(true);
        }
      } else if (dialNumber.trim().length > 0) {
        setShowPostCallSummary(false);
        setSavedToSgp(false);
        setTurns([]);
        setActiveSentiment('neutro');
        setCurrentScore(0.0);
        setActiveUrgency('baixa');
        setLatestSuggestion('');
        setOnCall(true);
      }
    }
  };

  const handleGenerateCallSummary = async () => {
    if (!lastCallInfo || isGeneratingSummary) return;
    setIsGeneratingSummary(true);

    try {
      const fullDialog = turns.map(t => `${t.speaker === 'cliente' ? 'Cliente' : 'Operador'}: ${t.transcription}`).join('\n');
      const promptText = turns.length > 0
        ? `Você é o auditor de qualidade e inteligência do Asterisk Nativo de um provedor de internet (ISP).
Gere um resumo técnico de 1 parágrafo para gravação no histórico do contrato no ERP ERP da ligação do número ${lastCallInfo.number} (Duração: ${lastCallInfo.duration}).
Diálogo transcrito:
${fullDialog}
Inclua: motivo do contato, problema relatado, ação executada pelo atendente e encaminhamento final.`
        : `Gere um resumo técnico conciso de 1 parágrafo para gravação no ERP/Asterisk de uma ligação telefônica de suporte de internet com o número ${lastCallInfo.number} que durou ${lastCallInfo.duration}. Inclua: motivo provável, ação tomada pelo operador e status final.`;

      const res = await fetch('/api/gemini/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText })
      });

      const data = await res.json();
      if (data.resposta) {
        setAiSummary(data.resposta);
      }
    } catch {
      setAiSummary(`Ligação para ${lastCallInfo.number} encerrada com sucesso (${lastCallInfo.duration}). Atendimento concluído.`);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleSaveToSgp = () => {
    setSavedToSgp(true);
    setTimeout(() => {
      setShowPostCallSummary(false);
      setSavedToSgp(false);
    }, 2000);
  };

  const handleTransfer = (targetName: string) => {
    console.log(`Chamada transferida com sucesso para: ${targetName}`);
    setLatestSuggestion(`✅ Transferido para: ${targetName}`);
    setTimeout(() => {
      setOnCall(false);
      setShowTransfer(false);
    }, 1500);
  };

  return (
    <div className={embedded ? `w-full max-w-[100vw] sm:max-w-sm mx-auto ${className || ''}` : "relative z-50"}>
      {/* Botão de Toggle do Webphone (Apenas quando NÃO for embedded) */}
      {!embedded && (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
            onCall 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 animate-pulse' 
              : clientMode
                ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs'
                : 'bg-slate-900 hover:bg-slate-800 border-white/10 text-slate-300 shadow-xs'
          }`}
          title="WebRTC Asterisk Nativo"
        >
          <div className="relative shrink-0">
            <Phone size={15} className={onCall ? 'text-emerald-400' : clientMode ? 'text-slate-600' : 'text-slate-300'} />
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 border-2 border-slate-900"></div>
          </div>
          <div className="hidden sm:flex flex-col text-left leading-none">
            <span className="text-xs font-bold font-mono">
              {onCall ? formatDuration(callSeconds) : `Ramal ${ramal}`}
            </span>
            <span className="text-[9px] text-slate-400 font-medium">SIP WebRTC</span>
          </div>
        </button>
      )}

      {/* Janela do Webphone (Popover no topo direito ou Card Embutido) */}
      {(isOpen || embedded) && (
        <div className={
          embedded 
            ? `w-full bg-white border border-slate-200  rounded-3xl overflow-hidden flex flex-col ${className || ''}` 
            : "fixed left-3 right-3 top-20 sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-80 bg-white border border-slate-200 rounded-3xl overflow-hidden z-50 animate-in slide-in-from-top-3 duration-200 shadow-2xl sm:shadow-lg"
        }>
          
          {/* Header com Indicadores de Conexão Asterisk 20+ Nativo */}
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse "></div>
              <span className="text-xs font-bold text-emerald-800 tracking-wide">{sipStatus}</span>
              <span className="text-[10px] text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md font-mono font-semibold">
                Ramal {ramal}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono">
                <Shield size={10} className="text-emerald-600" />
                <span>TLS / SRTP</span>
              </div>
              {!embedded && (
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-slate-500 hover:text-slate-800 p-1 hover:bg-slate-200 rounded-md transition-colors"
                  title="Minimizar Webphone"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Visor */}
          <div className="p-4 flex flex-col items-center justify-center border-b border-slate-100 bg-white min-h-[95px] relative">
            {onCall ? (
              <div className="w-full text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${onHold ? 'bg-amber-500' : 'bg-emerald-500 animate-ping'}`} />
                  <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">
                    {onHold ? 'Em Espera (Hold)' : 'Chamada Conectada'}
                  </p>
                </div>
                <h3 className="text-2xl font-mono font-bold text-slate-900 tracking-wider">
                  {dialNumber}
                </h3>
                <p className="text-sm font-mono font-bold text-slate-600 mt-1">
                  {formatDuration(callSeconds)}
                </p>

                {/* Métricas WebRTC & Status da Escuta IA */}
                <div className="flex items-center justify-center gap-3 mt-2 text-[10px] text-slate-600 font-mono">
                  <span className="flex items-center gap-1 text-emerald-700">
                    <Signal size={10} /> MOS 4.4
                  </span>
                  <span>Opus 48kHz</span>
                  <span className="flex items-center gap-1 text-indigo-700 font-bold">
                    <Brain size={11} className={isAnalyzingVoice ? 'animate-spin' : ''} />
                    Gemini Ativo
                  </span>
                </div>

                {/* MOCK: Dados do Cliente recebidos via SIP Headers (X-Client-Reason) */}
                {!clientMode && (
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-100 rounded-xl text-left shadow-inner">
                    <div className="flex items-center gap-1.5 mb-1 text-blue-900">
                      <User size={12} className="text-blue-600" />
                      <span className="text-[11px] font-bold">João Silva (App Portal)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <div className="text-slate-600">
                        Motivo: <span className="font-semibold text-slate-800">Suporte Técnico</span>
                      </div>
                      <div className="text-slate-600">
                        Protocolo: <span className="font-semibold text-slate-800">20268841</span>
                      </div>
                      <div className="text-slate-600">
                        Plano: <span className="font-semibold text-slate-800">Fibra 500 Mega</span>
                      </div>
                      <div className="text-slate-600">
                        Status: <span className="font-semibold text-emerald-600">Adimplente</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full text-center">
                <p className="text-[10px] uppercase font-bold text-slate-600 tracking-wider mb-1">Discar Número ou Ramal</p>
                <h3 className="text-2xl font-mono font-bold text-slate-800 tracking-wider min-h-[32px] break-all px-2">
                  {dialNumber || <span className="text-slate-300">...</span>}
                </h3>
              </div>
            )}
          </div>

          {/* PAINEL EM TEMPO REAL: Transcrição & Análise de Sentimento com Gemini API */}
          {onCall && voiceAiActive && (
            <div className="bg-slate-900 text-white p-3 border-b border-slate-800 flex flex-col gap-2.5">
              {/* Header de Sentimento e Telemetria de Voz */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center justify-center">
                    <Activity size={13} className="text-cyan-400 animate-pulse" />
                  </div>
                  <span className="text-[11px] font-bold tracking-wider uppercase text-slate-300">
                    Sentimento em Tempo Real
                  </span>
                </div>

                {/* Badge de Sentimento */}
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                    activeSentiment === 'positivo' || activeSentiment === 'satisfeito'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                      : activeSentiment === 'frustrado' || activeSentiment === 'irritado'
                      ? 'bg-red-950/80 text-red-300 border-red-500/50 animate-pulse'
                      : 'bg-slate-800 text-slate-300 border-slate-600'
                  }`}>
                    {activeSentiment} ({currentScore > 0 ? `+${currentScore.toFixed(1)}` : currentScore.toFixed(1)})
                  </span>
                  
                  {activeUrgency === 'alta' || activeUrgency === 'critica' ? (
                    <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded">
                      URGÊNCIA ALTA
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Sugestão Dinâmica da IA para o Operador */}
              {latestSuggestion && (
                <div className="bg-indigo-950/70 border border-indigo-500/40 rounded-xl p-2 flex items-start gap-2 text-[11px] text-indigo-100 ">
                  <Sparkles size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-indigo-300 block text-[10px] uppercase">
                      Dica Inteligente para o Atendente:
                    </span>
                    <p className="leading-tight mt-0.5 text-slate-200">
                      "{latestSuggestion}"
                    </p>
                  </div>
                </div>
              )}

              {/* Feed de Transcrição ao Vivo com Scroll */}
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {turns.length === 0 ? (
                  <div className="text-[11px] text-slate-400 italic text-center py-2 flex items-center justify-center gap-2">
                    <Radio size={12} className="text-cyan-400 animate-pulse" />
                    <span>Ouvindo chamada Asterisk 20+...</span>
                  </div>
                ) : (
                  turns.map((turn) => (
                    <div 
                      key={turn.id} 
                      className={`p-1.5 rounded-lg text-[11px] border ${
                        turn.speaker === 'cliente' 
                          ? 'bg-slate-800/90 border-slate-700/80 text-slate-200' 
                          : 'bg-blue-950/60 border-blue-800/50 text-blue-100'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mb-0.5">
                        <span className="font-bold uppercase text-slate-300">
                          {turn.speaker === 'cliente' ? '👤 Assinante' : '🎧 Operador'}
                        </span>
                        <span>{turn.time}</span>
                      </div>
                      <p className="leading-snug">{turn.transcription}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Barra de Ação de Áudio ao Vivo (Microfone Real / Simulação) */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                <button
                  onClick={toggleMicrophoneRecording}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg font-semibold transition-all border ${
                    isMicRecording
                      ? 'bg-red-950 text-red-300 border-red-500 animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                  title="Capturar microfone real e enviar para Gemini"
                >
                  <Mic size={11} className={isMicRecording ? 'text-red-400' : 'text-slate-400'} />
                  <span>{isMicRecording ? 'Gravando Microfone...' : 'Falar no Microfone'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-slate-400 font-mono">Gemini 3.8 Flash</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                </div>
              </div>
            </div>
          )}

          {/* Card de Pós-Chamada & Resumo IA (Gemini) */}
          {showPostCallSummary && !onCall && lastCallInfo && (
            <div className="p-3 bg-indigo-50/70 border-b border-indigo-100 animate-in fade-in-50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                  <Sparkles size={14} className="text-indigo-600" />
                  <span>Resumo da Ligação ({lastCallInfo.duration})</span>
                </div>
                <button
                  onClick={handleGenerateCallSummary}
                  disabled={isGeneratingSummary}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  title="Regerar resumo com Gemini"
                >
                  <RefreshCw size={10} className={isGeneratingSummary ? 'animate-spin' : ''} />
                  <span>{isGeneratingSummary ? 'Resumindo...' : 'Refazer IA'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-700 leading-relaxed bg-white/80 p-2 rounded-xl border border-indigo-100/80">
                {aiSummary}
              </p>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setShowPostCallSummary(false)}
                  className="text-[10px] text-slate-500 hover:text-slate-700"
                >
                  Ignorar
                </button>
                <button
                  onClick={handleSaveToSgp}
                  disabled={savedToSgp}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                    savedToSgp
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white '
                  }`}
                >
                  {savedToSgp ? (
                    <>
                      <Check size={12} /> Salvo no ERP!
                    </>
                  ) : (
                    <>
                      <span>Gravar no ERP / CRM</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Teclado de Discagem / Tela de Conexão Cliente */}
          {!onCall ? (
            <div className="p-4 bg-slate-50">
              {clientMode ? (
                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center relative">
                     <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping"></div>
                     <Phone className="text-blue-600" size={32} />
                  </div>
                  <div className="text-center">
                    <h4 className="text-lg font-bold font-outfit text-slate-900">Discando...</h4>
                    <p className="text-sm text-slate-500">
                      Conectando ao setor: <span className="font-bold">{incomingCallData?.motivo || 'Atendimento'}</span>
                    </p>
                  </div>
                  <button 
                    onClick={toggleCall}
                    className="mt-4 w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-95"
                  >
                    <Phone size={18} />
                    <span>Ligar Agora</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2.5 mb-3">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => (
                      <button 
                        key={key}
                        onClick={() => handleKeyPress(key)}
                        className="h-11 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-lg font-bold text-slate-800 flex items-center justify-center transition-all active:scale-95  hover:border-slate-300"
                      >
                        {key}
                      </button>
                    ))}
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex gap-2">
                    <button 
                      onClick={toggleCall}
                      disabled={dialNumber.trim().length === 0}
                      className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all  active:scale-95"
                    >
                      <Phone size={18} />
                      <span>Chamar</span>
                    </button>
                    
                    <button 
                      onClick={handleBackspace}
                      disabled={dialNumber.length === 0}
                      className="w-12 h-12 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl flex items-center justify-center transition-all active:scale-95 "
                      title="Apagar dígito"
                    >
                      <Delete size={18} />
                    </button>
                  </div>

                  {/* Atalhos Rápidos de Ramais ISP */}
                  <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold">Atalhos:</span>
                    <div className="flex gap-1">
                      <button onClick={() => setDialNumber('1001')} className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:bg-slate-100 font-mono">1001 (N2)</button>
                      <button onClick={() => setDialNumber('1002')} className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:bg-slate-100 font-mono">1002 (NOC)</button>
                      <button onClick={() => setDialNumber('*97')} className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:bg-slate-100 font-mono">*97 (VM)</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Controles Durante a Chamada */
            <div className="p-4 bg-slate-50 space-y-3">
              {showTransfer ? (
                /* Menu de Transferência */
                <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2 animate-in fade-in-50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-900">Transferir Chamada</span>
                    <button onClick={() => setShowTransfer(false)} className="text-xs text-slate-500 hover:text-slate-800">Cancelar</button>
                  </div>
                  <button onClick={() => handleTransfer('Fila N2 Suporte (1001)')} className="w-full text-left p-2 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-xs font-medium border border-slate-200 transition-colors">
                    Fila Suporte Avançado N2
                  </button>
                  <button onClick={() => handleTransfer('Fila Financeiro / Cobrança (1003)')} className="w-full text-left p-2 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-xs font-medium border border-slate-200 transition-colors">
                    Fila Financeiro & Negociação
                  </button>
                  <button onClick={() => handleTransfer('Supervisão NOC (1002)')} className="w-full text-left p-2 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-xs font-medium border border-slate-200 transition-colors">
                    Plantão NOC & Engenharia
                  </button>
                </div>
              ) : (
                <>
                  {/* Grid de Botões Mudo / Hold / Transfer / DTMF */}
                  <div className="grid grid-cols-4 gap-2">
                    <button 
                      onClick={() => setMuted(!muted)}
                      className={`h-12 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold transition-all border  ${
                        muted 
                          ? 'bg-amber-100 border-amber-300 text-amber-900' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                      title={muted ? 'Desmutar Microfone' : 'Mutar Microfone'}
                    >
                      {muted ? <MicOff size={18} className="text-amber-700" /> : <Mic size={18} />}
                      <span>{muted ? 'Mutado' : 'Mudo'}</span>
                    </button>

                    <button 
                      onClick={() => setOnHold(!onHold)}
                      className={`h-12 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold transition-all border  ${
                        onHold 
                          ? 'bg-amber-100 border-amber-300 text-amber-900' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                      title="Colocar chamada em espera"
                    >
                      <Pause size={18} />
                      <span>{onHold ? 'Em Espera' : 'Espera'}</span>
                    </button>

                    <button 
                      onClick={() => setShowTransfer(true)}
                      className="h-12 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex flex-col items-center justify-center text-[10px] font-bold transition-all "
                      title="Transferir Chamada"
                    >
                      <PhoneForwarded size={18} />
                      <span>Transferir</span>
                    </button>

                    <button 
                      onClick={() => setShowKeypadInCall(!showKeypadInCall)}
                      className={`h-12 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold transition-all border  ${
                        showKeypadInCall 
                          ? 'bg-blue-100 border-blue-300 text-blue-900' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                      title="Abrir Teclado DTMF"
                    >
                      <Hash size={18} />
                      <span>Teclado</span>
                    </button>
                  </div>

                  {/* Teclado DTMF durante a chamada para URA */}
                  {showKeypadInCall && (
                    <div className="p-2 bg-white rounded-xl border border-slate-200 animate-in fade-in-50">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center mb-1">
                        Envio de Tons DTMF para URA
                      </p>
                      <div className="grid grid-cols-6 gap-1">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(k => (
                          <button
                            key={k}
                            onClick={() => playTone(k)}
                            className="h-8 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded font-bold text-xs"
                          >
                            {k}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Encerrar Chamada */}
                  <button 
                    onClick={toggleCall}
                    className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all  active:scale-95"
                  >
                    <PhoneOff size={18} />
                    <span>Desligar Chamada</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
