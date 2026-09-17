import React, { useState, useEffect } from 'react';
import { Clock, ChevronDown, CheckCircle2, Coffee, BookOpen, AlertCircle, PhoneCall } from 'lucide-react';

export type OperatorState = 'disponivel' | 'pausa_nr17' | 'pausa_refeicao' | 'treinamento' | 'pos_atendimento';

interface PauseOption {
 id: OperatorState;
 label: string;
 category: 'operacional' | 'regulamentar' | 'administrativo';
 dotColor: string;
 badgeBg: string;
 textColor: string;
 icon: React.ReactNode;
}

const PAUSE_OPTIONS: PauseOption[] = [
 {
 id: 'disponivel',
 label: 'Disponível (Pronto)',
 category: 'operacional',
 dotColor: 'bg-emerald-400',
 badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
 textColor: 'text-emerald-400',
 icon: <CheckCircle2 size={14} className="text-emerald-400" />
 },
 {
 id: 'pausa_nr17',
 label: 'Pausa NR-17 (Descanso)',
 category: 'regulamentar',
 dotColor: 'bg-amber-400',
 badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
 textColor: 'text-amber-400',
 icon: <Coffee size={14} className="text-amber-400" />
 },
 {
 id: 'pausa_refeicao',
 label: 'Intervalo / Almoço',
 category: 'regulamentar',
 dotColor: 'bg-amber-400',
 badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
 textColor: 'text-amber-400',
 icon: <Coffee size={14} className="text-amber-400" />
 },
 {
 id: 'treinamento',
 label: 'Feedback / Treinamento',
 category: 'administrativo',
 dotColor: 'bg-blue-400',
 badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
 textColor: 'text-blue-400',
 icon: <BookOpen size={14} className="text-blue-400" />
 },
 {
 id: 'pos_atendimento',
 label: 'Tabulação (ACW)',
 category: 'operacional',
 dotColor: 'bg-orange-400',
 badgeBg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
 textColor: 'text-orange-400',
 icon: <AlertCircle size={14} className="text-orange-400" />
 }
];

export default function OperatorStatusControl() {
 const [isOpen, setIsOpen] = useState(false);
 const [currentState, setCurrentState] = useState<OperatorState>('disponivel');
 const [secondsInState, setSecondsInState] = useState(0);

 // Timer em tempo real de permanência no estado atual (Compliance Call Center)
 useEffect(() => {
 setSecondsInState(0);
 const interval = setInterval(() => {
 setSecondsInState(prev => prev + 1);
 }, 1000);
 return () => clearInterval(interval);
 }, [currentState]);

 const formatTimer = (totalSeconds: number) => {
 const minutes = Math.floor(totalSeconds / 60);
 const seconds = totalSeconds % 60;
 return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
 };

 const activeOption = PAUSE_OPTIONS.find(opt => opt.id === currentState) || PAUSE_OPTIONS[0];

 const handleSelectState = (state: OperatorState) => {
 setCurrentState(state);
 setIsOpen(false);
 };

 return (
 <div className="relative">
 {/* Botão de Controle de Estado do Operador */}
 <button
 onClick={() => setIsOpen(!isOpen)}
 className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
 activeOption.badgeBg
 } hover:opacity-95`}
 title="Alternar estado do operador (NR-17 / Pausas)"
 >
 <div className="relative flex items-center justify-center">
 <span className={`w-2 h-2 rounded-full ${activeOption.dotColor} ${currentState === 'disponivel' ? 'animate-pulse' : ''}`} />
 </div>
 
 <span className="hidden sm:inline font-medium">{activeOption.label.split(' ')[0]}</span>
 
 <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-white/10 text-current border border-border font-bold">
 {formatTimer(secondsInState)}
 </span>

 <ChevronDown size={14} className="opacity-60 ml-0.5" />
 </button>

 {/* Dropdown de Seleção de Pausas & Estados */}
 {isOpen && (
 <>
 <div 
 onClick={() => setIsOpen(false)}
 className="fixed inset-0 z-40" 
 aria-hidden="true" 
 />
 <div className="absolute right-0 top-11 w-64 bg-card border border-border rounded-2xl shadow-xl z-50 p-2 animate-in fade-in-50 zoom-in-95">
 <div className="px-3 py-2 border-b border-border flex items-center justify-between">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status do Operador</span>
 <span className="text-[10px] text-muted-foreground font-mono">NR-17 Compliance</span>
 </div>

 <div className="py-1 space-y-0.5">
 {PAUSE_OPTIONS.map((option) => (
 <button
 key={option.id}
 onClick={() => handleSelectState(option.id)}
 className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors ${
 currentState === option.id 
 ? 'bg-muted font-bold text-foreground shadow-xs' 
 : 'hover:bg-accent text-muted-foreground'
 }`}
 >
 <div className="flex items-center gap-2.5">
 <span className={`w-2 h-2 rounded-full ${option.dotColor}`} />
 <span>{option.label}</span>
 </div>
 {currentState === option.id && (
 <span className="text-[10px] font-bold text-blue-400 uppercase">Ativo</span>
 )}
 </button>
 ))}
 </div>

 <div className="mt-1 pt-2 border-t border-border px-3 py-1 bg-white/5 rounded-xl flex items-center justify-between text-[11px] text-muted-foreground">
 <span>Fila Omnichannel:</span>
 <span className="font-semibold text-card-foreground">
 {currentState === 'disponivel' ? 'Recebendo Chamados' : 'Pausado na Fila'}
 </span>
 </div>
 </div>
 </>
 )}
 </div>
 );
}
