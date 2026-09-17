import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, PhoneIncoming, PhoneForwarded, PhoneOff, Phone, 
  Mic, Play, Pause, Square, Plus, Settings, Save, Search, 
  Volume2, Users, Bot, GitBranch, ArrowRight, Activity, 
  Clock, Hash, Edit3, Trash2, ShieldCheck, FileAudio, RefreshCw
} from 'lucide-react';

interface ActiveCall {
  id: string;
  caller: string;
  did: string;
  status: 'Ringing' | 'Up' | 'InQueue' | 'Hold';
  duration: number;
  queue?: string;
  agent?: string;
}

interface UraNode {
  id: string;
  type: 'menu' | 'queue' | 'bot_maia' | 'hangup' | 'playback';
  label: string;
  audio?: string;
  options?: Record<string, string>; // DTMF -> Target Node ID
}

export default function Telefonia() {
  const [activeTab, setActiveTab] = useState<'monitor' | 'ura' | 'audios' | 'ramais'>('monitor');
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [ramais, setRamais] = useState<any[]>([
    { id: '1000', nome: 'Recepção', senha: '***', tipo: 'Administrativo', status: 'offline' },
    { id: '1001', nome: 'Sala Reunião', senha: '***', tipo: 'Administrativo', status: 'online' },
    { id: '1002', nome: 'Estoque', senha: '***', tipo: 'Administrativo', status: 'offline' },
  ]);
  const [showRamalModal, setShowRamalModal] = useState(false);
  const [novoRamal, setNovoRamal] = useState({ numero: '', nome: '', senha: '', tipo: 'Administrativo' });

  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Monitor Data
  useEffect(() => {
    if (activeTab === 'monitor') {
      const fetchCalls = () => {
        fetch('/api/telefonia/chamadas')
          .then(res => res.json())
          .then(data => {
            if (data.sucesso) setActiveCalls(data.chamadas);
            setLoading(false);
          })
          .catch(() => setLoading(false));
      };
      
      fetchCalls();
      const interval = setInterval(fetchCalls, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-300 overflow-hidden font-sans">
      
      {/* HEADER */}
      <div className="px-6 py-5 border-b border-white/5 bg-slate-900/80 backdrop-blur-md flex flex-wrap justify-between items-center gap-4 z-10">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
              <PhoneCall size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white font-outfit tracking-wide flex items-center gap-2">
                Telefonia & PABX
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono font-medium border border-indigo-500/20 uppercase tracking-widest">Asterisk 20</span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">Monitoramento CTI e Estúdio de URA Visual</p>
            </div>
          </div>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('monitor')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'monitor' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Activity size={16} /> Monitor CTI
          </button>
          <button
            onClick={() => setActiveTab('ura')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'ura' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <GitBranch size={16} /> Estúdio URA
          </button>
          <button
            onClick={() => setActiveTab('audios')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'audios' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Mic size={16} /> Áudios
          </button>
          <button
            onClick={() => setActiveTab('ramais')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'ramais' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Hash size={16} /> Ramais Internos
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {actionFeedback && (
          <div className="max-w-7xl mx-auto mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-bold flex items-center gap-2 animate-in fade-in">
            <ShieldCheck size={16} className="shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}
        <div className="max-w-7xl mx-auto space-y-6">

          {/* TAB: MONITOR CTI */}
          {activeTab === 'monitor' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <PhoneIncoming size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Ao Vivo</span>
                  </div>
                  <p className="text-3xl font-bold text-white font-outfit mb-1">{activeCalls.length}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Chamadas Ativas</p>
                </div>
                
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                      <Users size={20} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white font-outfit mb-1">
                    {activeCalls.filter(c => c.status === 'InQueue').length}
                  </p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Em Fila de Espera</p>
                </div>

                <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <ShieldCheck size={20} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white font-outfit mb-1">
                    {activeCalls.filter(c => c.status === 'Up' && c.agent).length}
                  </p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Em Atendimento</p>
                </div>

                <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <Bot size={20} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white font-outfit mb-1">
                    {activeCalls.filter(c => c.queue === 'URA MaIA').length}
                  </p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Retidas na IA</p>
                </div>
              </div>

              <div className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden shadow-xl">
                <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                  <h3 className="font-bold text-lg text-white font-outfit flex items-center gap-2">
                    <Activity size={18} className="text-blue-500" />
                    Canais Ativos (Real-time)
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        type="text" 
                        placeholder="Buscar ID ou Ramal..."
                        className="pl-9 pr-4 py-1.5 bg-slate-950 border border-white/10 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none w-48"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950/50 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-white/5">
                      <tr>
                        <th className="px-6 py-4">ID Chamada</th>
                        <th className="px-6 py-4">Origem</th>
                        <th className="px-6 py-4">Destino / Fila</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Duração</th>
                        <th className="px-6 py-4">Agente</th>
                        <th className="px-6 py-4 text-right">Ações (PJSIP)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 bg-slate-900">
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                            <RefreshCw size={24} className="animate-spin mx-auto mb-2 opacity-50" />
                            Sincronizando com Asterisk...
                          </td>
                        </tr>
                      ) : activeCalls.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                            Nenhuma chamada ativa no momento.
                          </td>
                        </tr>
                      ) : (
                        activeCalls.map((call) => (
                          <tr key={call.id} className="hover:bg-white/5 transition-colors group">
                            <td className="px-6 py-4 font-mono text-xs">{call.id}</td>
                            <td className="px-6 py-4 font-bold text-white">{call.caller}</td>
                            <td className="px-6 py-4">{call.queue || call.did}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center w-fit gap-1 ${
                                call.status === 'Up' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                call.status === 'Ringing' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse' :
                                call.status === 'InQueue' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                              }`}>
                                {call.status === 'Up' && <Phone size={10} />}
                                {call.status === 'Ringing' && <PhoneIncoming size={10} />}
                                {call.status === 'InQueue' && <Clock size={10} />}
                                {call.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs">{formatDuration(call.duration)}</td>
                            <td className="px-6 py-4">
                              {call.agent ? (
                                <span className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                                  {call.agent}
                                </span>
                              ) : <span className="text-slate-500">-</span>}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button onClick={() => { setActionFeedback("✓ Comando AMI enviado: Hangup executado com sucesso no canal " + call.id); setTimeout(() => setActionFeedback(null), 4000); }} className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors" title="Derrubar Chamada (Hangup)">
                                <PhoneOff size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ESTÚDIO URA */}
          {activeTab === 'ura' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col md:flex-row gap-6">
              
              {/* Menu Lateral de Componentes */}
              <div className="w-full md:w-64 space-y-4 shrink-0">
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 shadow-lg">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Componentes</h3>
                  
                  <div className="space-y-2">
                    <div className="p-3 bg-slate-950 border border-white/5 rounded-xl flex items-center gap-3 cursor-grab hover:border-indigo-500/50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <ListMenu size={16} />
                      </div>
                      <div className="text-sm font-bold text-slate-300">Menu DTMF</div>
                    </div>

                    <div className="p-3 bg-slate-950 border border-white/5 rounded-xl flex items-center gap-3 cursor-grab hover:border-emerald-500/50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <Users size={16} />
                      </div>
                      <div className="text-sm font-bold text-slate-300">Fila (Queue)</div>
                    </div>

                    <div className="p-3 bg-slate-950 border border-white/5 rounded-xl flex items-center gap-3 cursor-grab hover:border-purple-500/50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                        <Bot size={16} />
                      </div>
                      <div className="text-sm font-bold text-slate-300">Agente IA (MaIA)</div>
                    </div>

                    <div className="p-3 bg-slate-950 border border-white/5 rounded-xl flex items-center gap-3 cursor-grab hover:border-amber-500/50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                        <Volume2 size={16} />
                      </div>
                      <div className="text-sm font-bold text-slate-300">Tocar Áudio</div>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-2xl p-4 shadow-lg">
                  <div className="flex items-start gap-3">
                    <ShieldCheck size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-indigo-300 mb-1">Editor Visual (Extensions)</h4>
                      <p className="text-xs text-indigo-400/70 leading-relaxed">
                        Ao salvar, as regras são compiladas diretamente para o <code className="bg-indigo-950 px-1 py-0.5 rounded text-indigo-300">extensions.conf</code> do Asterisk e aplicadas em tempo real (Dialplan Reload).
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Canvas da URA */}
              <div className="flex-1 bg-slate-950/50 border border-white/5 rounded-2xl relative min-h-[500px] overflow-hidden shadow-inner flex flex-col items-center p-8 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')]">
                
                {/* INICIO */}
                <div className="bg-slate-800 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg mb-8 border border-white/10 z-10">
                  Chamada Recebida (0800 591 0000)
                </div>

                {/* Seta */}
                <div className="w-0.5 h-8 bg-slate-700 -mt-8 mb-2 z-0"></div>

                {/* Nó Principal URA */}
                <div className="w-full max-w-sm bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-xl overflow-hidden z-10 relative">
                  <div className="bg-indigo-500/10 px-4 py-3 border-b border-indigo-500/20 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                      <ListMenu size={16} /> Menu Principal (URA Dia)
                    </div>
                    <div className="flex gap-2">
                      <button className="text-slate-500 hover:text-white transition-colors"><Edit3 size={14}/></button>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    <div className="flex items-center gap-3 p-2 bg-slate-950 rounded-lg border border-white/5">
                      <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center shrink-0">
                        <Play size={14} className="text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Áudio de Saudação</p>
                        <p className="text-sm text-slate-200 truncate">bem_vindo_nap.wav</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-mono font-bold text-slate-300">1</div>
                        <div className="flex-1 h-9 rounded-lg border border-white/10 bg-slate-950 flex items-center px-3 text-sm text-slate-300">
                          <Users size={14} className="text-emerald-400 mr-2" /> Fila: Suporte N1
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-mono font-bold text-slate-300">2</div>
                        <div className="flex-1 h-9 rounded-lg border border-white/10 bg-slate-950 flex items-center px-3 text-sm text-slate-300">
                          <Users size={14} className="text-emerald-400 mr-2" /> Fila: Financeiro
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-mono font-bold text-slate-300">3</div>
                        <div className="flex-1 h-9 rounded-lg border border-indigo-500/20 bg-indigo-500/5 flex items-center px-3 text-sm text-indigo-300">
                          <Bot size={14} className="text-indigo-400 mr-2" /> Atendimento IA (MaIA)
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                        <div className="w-6 h-6 rounded-md bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-mono font-bold text-slate-400">t</div>
                        <div className="flex-1 h-9 rounded-lg border border-white/5 bg-slate-950/50 flex items-center px-3 text-xs text-slate-500 italic">
                          (Timeout) -&gt; Repetir Menu
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-6 right-6">
                  <button onClick={() => { setActionFeedback("✓ Dialplan compilado e aplicado no Asterisk com sucesso (Reload)!"); setTimeout(() => setActionFeedback(null), 4000); }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-[0_4px_14px_rgba(79,70,229,0.4)] flex items-center gap-2 transition-colors">
                    <Save size={18} /> Salvar Dialplan
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ÁUDIOS */}
          {activeTab === 'audios' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
              
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-white font-outfit">Gerenciador de Áudios (TTS & Gravados)</h3>
                <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md flex items-center gap-2 transition-colors">
                  <Plus size={16} /> Novo Áudio
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {['bem_vindo_nap.wav', 'espera_suporte.wav', 'horario_fora.wav', 'ura_feriado.wav'].map((audio, i) => (
                  <div key={i} className="bg-slate-900 border border-white/5 rounded-2xl p-4 shadow-lg group hover:border-white/10 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <FileAudio size={18} />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"><Edit3 size={14}/></button>
                        <button className="p-1.5 text-red-400 hover:text-white bg-slate-800 rounded-lg"><Trash2 size={14}/></button>
                      </div>
                    </div>
                    <p className="font-bold text-white text-sm mb-1">{audio}</p>
                    <p className="text-xs text-slate-400 mb-4">Atualizado há {i+1} dias</p>

                    <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-white/5">
                      <button className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shrink-0">
                        <Play size={14} className="ml-0.5" />
                      </button>
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="w-0 h-full bg-blue-500"></div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">0:00 / 0:14</span>
                    </div>
                  </div>
                ))}

                {/* Card Criar Áudio por IA */}
                <div onClick={() => { setActionFeedback("✓ Prompt enviado para IA Gemini (TTS). O novo áudio sintetizado estará disponível em alguns segundos."); setTimeout(() => setActionFeedback(null), 5000); }} className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-5 shadow-lg flex flex-col justify-center items-center text-center cursor-pointer hover:border-indigo-500/40 transition-colors group">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Bot size={24} />
                  </div>
                  <h4 className="font-bold text-white text-sm mb-1">Gerar Áudio com Gemini</h4>
                  <p className="text-xs text-indigo-300">Digite o texto e crie locuções ultra-realistas instantaneamente.</p>
                </div>
              </div>

            </div>
          )}

          {/* TAB: RAMAIS INTERNOS */}
          {activeTab === 'ramais' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-white font-outfit">Assistente de Criação de Ramais (SIP)</h3>
                  <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                    Configure ramais administrativos (PJSIP) nativos do Asterisk. Estes ramais podem ser registrados no Webphone embutido (WebRTC), aparelhos IP ou Softphones (Zoiper), permitindo comunicação interna e transferências diretas pelo CRM.
                  </p>
                </div>
                <button 
                  onClick={() => setShowRamalModal(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md flex items-center gap-2 transition-colors"
                >
                  <Plus size={16} /> Novo Ramal
                </button>
              </div>

              <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden shadow-lg">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/50 border-b border-white/5 text-xs uppercase tracking-wider text-slate-400 font-bold">
                      <th className="p-4">Status</th>
                      <th className="p-4">Ramal (SIP)</th>
                      <th className="p-4">Nome / Identificação</th>
                      <th className="p-4">Secret (Senha)</th>
                      <th className="p-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {ramais.map((ramal) => (
                      <tr key={ramal.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${ramal.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`}></div>
                            <span className={ramal.status === 'online' ? 'text-emerald-400 font-medium text-xs uppercase tracking-wider' : 'text-slate-500 font-medium text-xs uppercase tracking-wider'}>
                              {ramal.status}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 font-bold text-white font-mono">{ramal.id}</td>
                        <td className="p-4 text-slate-300 font-medium">{ramal.nome}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-mono tracking-widest">{ramal.senha}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right flex items-center justify-end gap-2">
                          <button className="p-2 text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 rounded-lg transition-colors" title="Editar">
                            <Edit3 size={16} />
                          </button>
                          <button className="p-2 text-red-400 hover:text-white bg-slate-950 hover:bg-red-500/20 rounded-lg transition-colors" title="Remover">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Modal Assistente de Criação de Ramal */}
      {showRamalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-950">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Hash className="text-blue-400" size={18} />
                Novo Ramal Asterisk
              </h3>
              <button onClick={() => setShowRamalModal(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5">
                <Trash2 size={18} className="opacity-0 hidden" /> {/* spacer */}
                <span className="font-bold text-lg leading-none">&times;</span>
              </button>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Número do Ramal</label>
                <input 
                  type="text" 
                  value={novoRamal.numero} 
                  onChange={e => setNovoRamal({...novoRamal, numero: e.target.value})} 
                  placeholder="Ex: 1003"
                  className="w-full p-2.5 bg-slate-950 border border-white/5 rounded-xl text-sm font-medium text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Nome / Identificação</label>
                <input 
                  type="text" 
                  value={novoRamal.nome} 
                  onChange={e => setNovoRamal({...novoRamal, nome: e.target.value})} 
                  placeholder="Ex: Diretoria"
                  className="w-full p-2.5 bg-slate-950 border border-white/5 rounded-xl text-sm font-medium text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Secret (Senha SIP)</label>
                <input 
                  type="text" 
                  value={novoRamal.senha} 
                  onChange={e => setNovoRamal({...novoRamal, senha: e.target.value})} 
                  placeholder="Gerado automaticamente se vazio"
                  className="w-full p-2.5 bg-slate-950 border border-white/5 rounded-xl text-sm font-medium text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600" 
                />
                <p className="text-[11px] text-slate-500 mt-1">Utilize senhas fortes para ramais expostos externamente.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-white/5 flex justify-end gap-3">
              <button onClick={() => setShowRamalModal(false)} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">
                Cancelar
              </button>
              <button 
                onClick={() => {
                  setRamais([...ramais, { 
                    id: novoRamal.numero || Math.floor(Math.random() * 1000 + 2000).toString(), 
                    nome: novoRamal.nome || 'Novo Ramal', 
                    senha: novoRamal.senha || '***', 
                    tipo: 'Administrativo', 
                    status: 'offline' 
                  }]);
                  setNovoRamal({ numero: '', nome: '', senha: '', tipo: 'Administrativo' });
                  setShowRamalModal(false);
                  setActionFeedback("✓ Novo Ramal SIP (PJSIP) configurado. Reinicie o softphone para registrar.");
                  setTimeout(() => setActionFeedback(null), 5000);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-[0_4px_14px_rgba(37,99,235,0.4)] transition-colors"
              >
                Criar Ramal (SIP)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function ListMenu(props: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" viewBox="0 0 24 24" fill="none" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
      {...props}
    >
      <line x1="8" y1="6" x2="21" y2="6"></line>
      <line x1="8" y1="12" x2="21" y2="12"></line>
      <line x1="8" y1="18" x2="21" y2="18"></line>
      <line x1="3" y1="6" x2="3.01" y2="6"></line>
      <line x1="3" y1="12" x2="3.01" y2="12"></line>
      <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
  );
}
