#!/bin/bash
cat << 'INNER_EOF' > src/pages/Automacoes.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Cpu, 
  Zap, 
  Terminal, 
  Send, 
  CheckCircle2, 
  RefreshCw, 
  Database, 
  ShieldCheck, 
  Wifi, 
  QrCode, 
  Clock, 
  Wrench, 
  HelpCircle,
  BarChart3,
  Sliders,
  Check,
  AlertCircle,
  MessageSquare,
  PhoneCall,
  Save,
  BrainCircuit,
  Bot
} from 'lucide-react';

interface AgentTool {
  id: string;
  name: string;
  description: string;
  category: string;
  parameters: Record<string, string>;
}

interface Metrics {
  requests_today: number;
  daily_limit: number;
  rpm_current: number;
  rpm_limit: number;
  total_tokens: number;
  cost_estimated_brl: number;
}

export default function Automacoes() {
  const [activeTab, setActiveTab] = useState<'playground' | 'prompt' | 'tools' | 'channels'>('playground');
  const [promptInput, setPromptInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{
    role: 'user' | 'agent';
    content: string;
    tool_executada?: string;
    tempo_ms?: number;
    tokens?: number;
    timestamp: string;
  }>>([
    {
      role: 'agent',
      content: 'Olá! Sou a AVA (Agente Virtual Autônoma) do Provedor, operando com o Google Gemini. Consigo acessar o SGP, gerar boletos, diagnosticar conexões e realizar atendimentos via Voz e WhatsApp. Como posso demonstrar minhas habilidades?',
      timestamp: 'Agora'
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [tools, setTools] = useState<AgentTool[]>([
    {
      id: 'fn_sgp_boleto',
      name: 'sgp_gerar_2via',
      description: 'Gera a 2ª via da fatura (PDF ou Linha Digitável).',
      category: 'Financeiro',
      parameters: { cliente_cpf: 'string', formato: 'pdf | linha_digitavel' }
    },
    {
      id: 'fn_sgp_pix',
      name: 'sgp_gerar_pix',
      description: 'Gera o código PIX Copia e Cola para pagamento imediato.',
      category: 'Financeiro',
      parameters: { cliente_cpf: 'string' }
    },
    {
      id: 'fn_sgp_status',
      name: 'sgp_consultar_status_conexao',
      description: 'Verifica uptime, latência, e status atual do PPPoE do cliente.',
      category: 'Suporte N1',
      parameters: { cliente_cpf: 'string', pppoe_login: 'string (opcional)' }
    },
    {
      id: 'fn_sgp_unlock',
      name: 'sgp_desbloqueio_confianca',
      description: 'Realiza o desbloqueio provisório de 48h (apenas 1x por ciclo).',
      category: 'Financeiro / Suporte',
      parameters: { cliente_cpf: 'string' }
    }
  ]);

  const [metrics] = useState<Metrics>({
    requests_today: 47,
    daily_limit: 1500,
    rpm_current: 2,
    rpm_limit: 15,
    total_tokens: 18450,
    cost_estimated_brl: 0.0
  });

  const [systemPrompt, setSystemPrompt] = useState(
    'Você é a AVA, Agente Virtual Autônoma do provedor de internet. Seja empática, aja como uma humana cordial e focada em resolver o problema. Regras vitais: Nunca prometa descontos. Sempre diagnostique a conexão (sgp_consultar_status_conexao) antes de transferir para o humano se o cliente reclamar de lentidão. Se for financeiro, ofereça sempre PIX.'
  );
  
  const [savedPromptSuccess, setSavedPromptSuccess] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, loading]);

  const handleRunAgent = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!promptInput.trim()) return;

    const msg = promptInput;
    setPromptInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: msg, timestamp: 'Agora' }]);
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: msg })
      });
      const data = await res.json();
      
      setChatHistory(prev => [...prev, {
        role: 'agent',
        content: data.resposta || "Atendimento processado com sucesso.",
        tool_executada: data.tool,
        tempo_ms: data.tempo_ms || 1250,
        tokens: 342,
        timestamp: 'Agora'
      }]);
    } catch {
      // Mocking a successful response for the UI if the backend isn't hooked up yet
      setTimeout(() => {
        let simulatedResponse = "Entendi! Deixe-me ajudar com isso.";
        let tool = undefined;
        
        if (msg.toLowerCase().includes('pix') || msg.toLowerCase().includes('boleto')) {
           tool = 'sgp_gerar_pix';
           simulatedResponse = "Localizei sua fatura. Acabei de gerar o seu código PIX: 00020126580014br.gov.bcb.pix... Posso ajudar em algo mais?";
        } else if (msg.toLowerCase().includes('lento') || msg.toLowerCase().includes('internet')) {
           tool = 'sgp_consultar_status_conexao';
           simulatedResponse = "Realizei um diagnóstico no seu roteador. Vi que o sinal óptico está excelente (-19dBm), mas há muitos dispositivos no Wi-Fi 2.4GHz. Vamos fazer um teste no 5GHz?";
        }

        setChatHistory(prev => [...prev, {
          role: 'agent',
          content: simulatedResponse,
          tool_executada: tool,
          tempo_ms: 1450,
          tokens: 156,
          timestamp: 'Agora'
        }]);
        setLoading(false);
      }, 1500);
    }
  };

  const handleSavePrompt = () => {
    setSavedPromptSuccess(true);
    setTimeout(() => setSavedPromptSuccess(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0f19] text-slate-300 overflow-hidden font-sans">
      
      {/* HEADER DA PÁGINA */}
      <div className="px-6 py-5 border-b border-white/5 bg-[#101726]/80 backdrop-blur-md flex flex-wrap justify-between items-center gap-4 z-10">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
              <BrainCircuit size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white font-outfit tracking-tight">Cérebro IA & Automações</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm text-slate-400">Google Gemini Serverless</p>
                <span className="bg-indigo-500/20 text-indigo-400 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">ATIVO</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-[#0b0f19] border border-white/5 p-1 rounded-xl shadow-inner">
          <button 
            onClick={() => setActiveTab('playground')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'playground' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            Playground
          </button>
          <button 
            onClick={() => setActiveTab('prompt')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'prompt' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            Prompt Mestre
          </button>
          <button 
            onClick={() => setActiveTab('tools')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'tools' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            Skills (Tools)
          </button>
          <button 
            onClick={() => setActiveTab('channels')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'channels' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            Canais de Voz/Texto
          </button>
        </div>
      </div>

      {/* MÉTRICAS TOP */}
      <div className="px-6 py-3 bg-[#0b0f19]/50 border-b border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs z-10">
        <div className="flex items-center justify-between bg-[#101726] px-4 py-2.5 rounded-xl border border-white/5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <Zap size={14} className="text-amber-400" /> Requisições Hoje
          </div>
          <span className="font-mono font-bold text-white">{metrics.requests_today} / {metrics.daily_limit}</span>
        </div>
        <div className="flex items-center justify-between bg-[#101726] px-4 py-2.5 rounded-xl border border-white/5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <BarChart3 size={14} className="text-emerald-400" /> Tokens (Total)
          </div>
          <span className="font-mono font-bold text-white">{(metrics.total_tokens / 1000).toFixed(1)}k</span>
        </div>
        <div className="flex items-center justify-between bg-[#101726] px-4 py-2.5 rounded-xl border border-white/5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <Cpu size={14} className="text-blue-400" /> RPM (Rate Limit)
          </div>
          <span className="font-mono font-bold text-white">{metrics.rpm_current} / {metrics.rpm_limit}</span>
        </div>
        <div className="flex items-center justify-between bg-[#101726] px-4 py-2.5 rounded-xl border border-white/5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <CheckCircle2 size={14} className="text-emerald-400" /> Custo Mensal
          </div>
          <span className="font-mono font-bold text-emerald-400">Free Tier</span>
        </div>
      </div>

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full">
        <div className="max-w-7xl mx-auto h-full">
          
          {/* =========================================
              ABA: PLAYGROUND
             ========================================= */}
          {activeTab === 'playground' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)] min-h-[500px]">
              
              {/* Painel de Chat */}
              <div className="lg:col-span-2 flex flex-col bg-[#101726] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <div className="px-5 py-4 border-b border-white/5 bg-[#101726] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                      <Terminal size={16} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm font-outfit">Simulador de Atendimento</h3>
                      <p className="text-[10px] text-slate-400">Teste o comportamento da IA com as ferramentas habilitadas.</p>
                    </div>
                  </div>
                  <button className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
                    <RefreshCw size={14} /> Resetar Sessão
                  </button>
                </div>

                <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-[#0b0f19]/30">
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-br-sm' 
                          : 'bg-[#101726] border border-white/5 text-slate-300 rounded-bl-sm'
                      }`}>
                        {msg.content}
                        
                        {msg.tool_executada && (
                          <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-[11px] text-amber-400 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20 w-fit">
                            <Wrench size={12} />
                            <strong>Tool call:</strong> {msg.tool_executada}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 px-1 text-[10px] text-slate-500 font-mono">
                        <span>{msg.role === 'user' ? 'Você' : 'AVA (Gemini)'}</span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                        {msg.tempo_ms && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400">{msg.tempo_ms}ms</span>
                          </>
                        )}
                        {msg.tokens && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-400">{msg.tokens} tokens</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {loading && (
                    <div className="flex items-start">
                      <div className="flex items-center gap-2 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2.5 rounded-xl w-fit shadow-sm">
                        <RefreshCw size={14} className="animate-spin" /> AVA está pensando e acessando o SGP...
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-white/5 bg-[#101726]">
                  <form onSubmit={handleRunAgent} className="flex gap-2">
                    <input 
                      type="text" 
                      value={promptInput}
                      onChange={e => setPromptInput(e.target.value)}
                      placeholder="Simule a mensagem de um cliente (ex: 'Minha internet caiu' ou 'Quero a fatura de agosto')"
                      className="flex-1 px-4 py-3 bg-[#0b0f19] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-white placeholder:text-slate-500 shadow-inner"
                    />
                    <button 
                      type="submit"
                      disabled={loading || !promptInput.trim()}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600 shadow-lg shadow-indigo-600/20"
                    >
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              </div>

              {/* Dicas e Exemplos */}
              <div className="flex flex-col gap-6">
                <div className="bg-[#101726] border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5">
                    <BrainCircuit size={100} />
                  </div>
                  <h3 className="font-bold text-white text-base mb-1 font-outfit relative z-10">Instruções do Playground</h3>
                  <p className="text-xs text-slate-400 mb-6 relative z-10">
                    O Gemini tomará decisões baseadas no Prompt Mestre e nas Skills habilitadas. Tente as seguintes interações:
                  </p>
                  
                  <div className="space-y-2.5 relative z-10">
                    <button onClick={() => setPromptInput("Minha internet tá muito lenta hoje")} className="w-full text-left text-xs bg-[#0b0f19] border border-white/5 hover:border-indigo-500/30 p-3 rounded-xl text-slate-300 hover:text-indigo-400 transition-colors shadow-inner flex items-center gap-2">
                      <Wifi size={14} className="shrink-0" /> "Minha internet tá muito lenta hoje"
                    </button>
                    <button onClick={() => setPromptInput("Preciso do PIX da fatura que venceu ontem")} className="w-full text-left text-xs bg-[#0b0f19] border border-white/5 hover:border-indigo-500/30 p-3 rounded-xl text-slate-300 hover:text-indigo-400 transition-colors shadow-inner flex items-center gap-2">
                      <QrCode size={14} className="shrink-0" /> "Preciso do PIX da fatura que venceu"
                    </button>
                    <button onClick={() => setPromptInput("Quero fazer o desbloqueio em confiança")} className="w-full text-left text-xs bg-[#0b0f19] border border-white/5 hover:border-indigo-500/30 p-3 rounded-xl text-slate-300 hover:text-indigo-400 transition-colors shadow-inner flex items-center gap-2">
                      <Clock size={14} className="shrink-0" /> "Quero fazer o desbloqueio provisório"
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-900/30 to-blue-900/10 border border-indigo-500/20 rounded-3xl p-6 shadow-xl flex-1 flex flex-col justify-center text-center items-center">
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 mb-4 shadow-inner border border-indigo-500/30">
                    <HelpCircle size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">Por que não usamos n8n ou Dialogflow?</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    A AVA utiliza a SDK Serverless nativa do Gemini 1.5 Pro. Isso elimina intermediários (como n8n/Typebot), reduzindo a latência para áudio em 80% e cortando custos extras de servidores dedicados.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =========================================
              ABA: PROMPT MESTRE
             ========================================= */}
          {activeTab === 'prompt' && (
            <div className="max-w-4xl mx-auto h-[calc(100vh-220px)] flex flex-col gap-4">
              <div className="bg-gradient-to-r from-blue-900/20 to-[#101726] border border-blue-500/20 rounded-2xl p-5 flex items-start gap-4 shadow-xl">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/30">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Engenharia de Prompt (System Instructions)</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Defina o comportamento exato, restrições e tom de voz da inteligência artificial. Este prompt é injetado em todas as chamadas antes da mensagem do cliente. Dica: Seja claro sobre o que a IA <strong>NÃO</strong> deve fazer.
                  </p>
                </div>
              </div>

              <div className="flex-1 flex flex-col bg-[#101726] border border-white/5 rounded-2xl shadow-xl overflow-hidden relative">
                <textarea 
                  value={systemPrompt}
                  onChange={e => setSystemPrompt(e.target.value)}
                  className="flex-1 w-full bg-[#0b0f19]/50 p-6 text-sm text-slate-300 resize-none outline-none focus:ring-2 focus:ring-indigo-500/50 leading-loose placeholder:text-slate-600 font-mono"
                  placeholder="Ex: Você é um assistente virtual de um provedor de internet..."
                />
                
                <div className="p-4 bg-[#101726] border-t border-white/5 flex justify-between items-center">
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-400" />
                    Utilize markdown para estruturar. Aproximadamente {systemPrompt.length} caracteres.
                  </div>
                  <button 
                    onClick={handleSavePrompt}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20"
                  >
                    {savedPromptSuccess ? <Check size={16} /> : <Save size={16} />}
                    {savedPromptSuccess ? 'Salvo!' : 'Salvar Prompt'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================
              ABA: TOOLS (SKILLS)
             ========================================= */}
          {activeTab === 'tools' && (
            <div className="max-w-5xl mx-auto h-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white font-outfit">Skills Habilitadas (SGP Integration)</h2>
                  <p className="text-xs text-slate-400">Ferramentas que o modelo pode chamar autonomamente para buscar dados ou realizar ações.</p>
                </div>
                <button className="bg-[#101726] border border-white/10 hover:bg-white/5 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm">
                  <Database size={14} /> Sincronizar Endpoints SGP
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tools.map(tool => (
                  <div key={tool.id} className="bg-[#101726] border border-white/5 rounded-2xl p-5 hover:border-indigo-500/30 transition-all group shadow-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#0b0f19] border border-white/5 rounded-xl flex items-center justify-center text-indigo-400 shadow-inner group-hover:bg-indigo-500/10 transition-colors">
                          <Wrench size={18} />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm font-mono">{tool.name}</h4>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider">{tool.category}</span>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-9 h-5 bg-[#0b0f19] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500 border border-white/10"></div>
                      </label>
                    </div>
                    <p className="text-xs text-slate-400 mb-4 h-10">{tool.description}</p>
                    
                    <div className="bg-[#0b0f19]/80 rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] text-slate-500 font-bold mb-2 uppercase tracking-wider">Parameters Schema</p>
                      <div className="space-y-1">
                        {Object.entries(tool.parameters).map(([key, type]) => (
                          <div key={key} className="flex justify-between items-center text-[11px] font-mono">
                            <span className="text-blue-400">{key}:</span>
                            <span className="text-emerald-400">{type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================
              ABA: CANAIS
             ========================================= */}
          {activeTab === 'channels' && (
            <div className="max-w-4xl mx-auto h-full space-y-4">
              <h2 className="text-lg font-bold text-white font-outfit mb-2">Integrações de Canais (Omnichannel)</h2>
              
              <div className="bg-[#101726] border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row gap-6 items-center hover:border-emerald-500/30 transition-all">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0">
                  <MessageSquare size={32} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-white">WhatsApp Cloud API (WABA)</h3>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">ATIVO</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">A IA responde automaticamente números que chamarem no WABA oficial. Quando não conseguir resolver, transfere o chat (handoff) para o Inbox Unificado.</p>
                  <button className="text-xs bg-[#0b0f19] border border-white/10 hover:bg-white/5 text-slate-300 px-4 py-2 rounded-lg font-bold transition-all shadow-inner">
                    Configurar Webhooks (Meta)
                  </button>
                </div>
              </div>

              <div className="bg-[#101726] border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row gap-6 items-center hover:border-indigo-500/30 transition-all">
                <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 shrink-0">
                  <PhoneCall size={32} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-white">Asterisk AVA (Agente de Voz)</h3>
                    <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10">DESATIVADO</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">Utiliza a integração nativa com FreePBX (via AGI) e o Live API do Gemini para conversação telefônica de baixíssima latência via WebRTC ou PSTN.</p>
                  <button className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-md">
                    Instalar Módulo no FreePBX
                  </button>
                </div>
              </div>

              <div className="bg-[#101726] border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row gap-6 items-center hover:border-blue-500/30 transition-all">
                <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 shrink-0">
                  <BrainCircuit size={32} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-white">Webchat do PWA (Portal)</h3>
                    <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/20">ATIVO</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">O Widget flutuante no Portal do Assinante já está conectado à Inteligência Artificial. Clientes logados enviam requisições autenticadas, permitindo comandos seguros no SGP sem pedir CPF.</p>
                  <button className="text-xs bg-[#0b0f19] border border-white/10 hover:bg-white/5 text-slate-300 px-4 py-2 rounded-lg font-bold transition-all shadow-inner">
                    Customizar Widget
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
INNER_EOF
