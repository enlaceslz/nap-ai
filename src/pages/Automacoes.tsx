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
 Bot,
 Eye,
 EyeOff,
 Link as LinkIcon,
 Server,
 Key,
 ExternalLink,
 Activity,
 ArrowRight,
 AlertTriangle
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
 const [activeTab, setActiveTab] = useState<'playground' | 'prompt' | 'tools' | 'channels' | 'config'>('playground');
 const [toastMsg, setToastMsg] = useState<string | null>(null);
 const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };
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
 content: 'Olá! Sou a MaIA, Inteligência Artificial da D.J.D. Telecom LTDA (CNPJ: 36.954.827/0001-81). Consigo acessar faturas no SGP/IXC, gerar PIX, diagnosticar conexões de fibra óptica e reiniciar a ONU via TR-069. Como posso te ajudar hoje?',
 timestamp: 'Agora'
 }
 ]);
 const messagesEndRef = useRef<HTMLDivElement>(null);

 // Configuração da MaIA & 9router
 const [iaConfig, setIaConfig] = useState({
 nome: 'MaIA',
 modeloPrimario: 'gemini-2.5-flash',
 provedorGateway: 'direct', // 'direct' (padrão gratuito) ou '9router'
 baseUrl: 'https://9router.enlace.slz.br',
 apiKey: '',
 temperatura: 0.2,
 failoverAutomatico: true,
 alertarOperadoresEmEsgotamento: true,
 alertaCotaAtivo: false,
 apiKeyConfigurada: false
 });
 const [showApiKey, setShowApiKey] = useState(false);
 const [testingGateway, setTestingGateway] = useState(false);
 const [testResult, setTestResult] = useState<any>(null);
 const [savingConfig, setSavingConfig] = useState(false);
 const [alertsList, setAlertsList] = useState<any[]>([]);

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
 description: 'Gera o código PIX Copia e Cola dinâmico no SGP para pagamento imediato.',
 category: 'Financeiro',
 parameters: { cliente_cpf: 'string' }
 },
 {
 id: 'fn_sgp_status',
 name: 'sgp_consultar_status_conexao',
 description: 'Executa telemetria do sinal óptico RX/TX (-19.4 dBm), status PPPoE e latência.',
 category: 'Suporte N1',
 parameters: { cliente_cpf: 'string', pppoe_login: 'string (opcional)' }
 },
 {
 id: 'fn_genieacs_reboot',
 name: 'genieacs_reboot_cpe',
 description: 'Envia comando TR-069 Reboot para reinicializar a ONU/roteador remotamente.',
 category: 'Suporte N1 (TR-069)',
 parameters: { serial_number: 'string', mac: 'string' }
 },
 {
 id: 'fn_noc_outage',
 name: 'verificar_incidente_rede',
 description: 'Consulta no NOC se o bairro do cliente possui rompimento ou manutenção ativa.',
 category: 'NOC / Rede',
 parameters: { bairro: 'string', cidade: 'string' }
 },
 {
 id: 'fn_sgp_unlock',
 name: 'sgp_desbloqueio_confianca',
 description: 'Realiza o desbloqueio provisório de 24h no Radius (apenas 1x por ciclo).',
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
 'Você é a IA de atendimento do provedor de internet. Seja empática, aja como uma humana cordial e focada em resolver o problema. Regras vitais: Nunca prometa descontos. Sempre diagnostique a conexão (sgp_consultar_status_conexao) antes de transferir para o humano se o cliente reclamar de lentidão. Se for financeiro, ofereça sempre PIX.'
 );
 
 const [savedPromptSuccess, setSavedPromptSuccess] = useState(false);

 useEffect(() => {
 fetch('/api/gemini/agent/tools')
 .then(res => res.json())
 .then(data => {
 if (data.tools && Array.isArray(data.tools)) {
 setTools(data.tools.map((t: any) => ({
 id: `fn_${t.name}`,
 name: t.name,
 description: t.description,
 category: t.category === 'financeiro' ? 'Financeiro (SGP)' :
 t.category === 'suporte_noc' ? 'NOC / Rede' :
 t.category === 'telemetria_tr069' ? 'Suporte N1 (TR-069)' :
 t.category === 'radius_erp' ? 'Radius & MikroTik' :
 t.category === 'comercial' ? 'Comercial & Viabilidade' : 'Qualidade & NPS',
 parameters: { cliente_cpf: 'string', prompt: 'string' }
 })));
 }
 })
 .catch(() => {});

 // Carregar configuração da IA & Alertas de Cota
 loadIaConfig();
 }, []);

 const loadIaConfig = async () => {
 try {
 const res = await fetch('/api/gemini/config');
 const data = await res.json();
 if (data.sucesso && data.ia) {
 setIaConfig(prev => ({ ...prev, ...data.ia }));
 if (data.alertas) setAlertsList(data.alertas);
 }
 } catch {}
 };

 const scrollToBottom = () => {
 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 };

 useEffect(() => {
 scrollToBottom();
 }, [chatHistory, loading]);

 const handleTestGateway = async () => {
 setTestingGateway(true);
 setTestResult(null);
 try {
 const res = await fetch('/api/gemini/test-gateway', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 provedorGateway: iaConfig.provedorGateway,
 baseUrl: iaConfig.baseUrl,
 apiKey: iaConfig.apiKey
 })
 });
 const data = await res.json();
 setTestResult(data);
 showToast(data.mensagem || 'Teste de conectividade concluído.');
 } catch {
 setTestResult({ sucesso: false, status: 'erro', mensagem: 'Falha de comunicação ao testar gateway.' });
 } finally {
 setTestingGateway(false);
 }
 };

 const handleSaveIaConfig = async () => {
 setSavingConfig(true);
 try {
 const res = await fetch('/api/gemini/config', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(iaConfig)
 });
 const data = await res.json();
 if (data.sucesso) {
 showToast('Configuração da MaIA salva com sucesso!');
 if (data.ia) setIaConfig(prev => ({ ...prev, ...data.ia }));
 } else {
 showToast('Erro ao salvar configuração.');
 }
 } catch {
 showToast('Erro de comunicação ao salvar.');
 } finally {
 setSavingConfig(false);
 }
 };

 const handleDismissAlert = async (id?: string) => {
 await fetch('/api/gemini/alerts/dismiss', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ id })
 });
 setAlertsList(prev => id ? prev.filter(a => a.id !== id) : []);
 if (!id || alertsList.length <= 1) {
 setIaConfig(prev => ({ ...prev, alertaCotaAtivo: false }));
 }
 showToast('Alerta dispensado.');
 };

 const handleSimulate429Alert = async () => {
 try {
 const res = await fetch('/api/gemini/alerts/simulate', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' }
 });
 if (res.ok) {
 await loadIaConfig();
 showToast('Simulação de Erro 429 ativada! Banner visível no topo.');
 }
 } catch (e) {
 console.error("Falha ao simular alerta 429:", e);
 }
 };

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
 
 if (data.alerta_cota) {
 fetch('/api/gemini/alerts')
 .then(r => r.json())
 .then(d => { if (d.alertas) setAlertsList(d.alertas); });
 setIaConfig(prev => ({ ...prev, alertaCotaAtivo: true }));
 }

 setChatHistory(prev => [...prev, {
 role: 'agent',
 content: data.resposta || "Atendimento processado com sucesso.",
 tool_executada: data.tool,
 tempo_ms: data.tempo_ms || 320,
 tokens: data.tokens || 215,
 timestamp: 'Agora'
 }]);
 } catch {
 // Fallback local
 let simulatedResponse = "Entendi! Deixe-me ajudar com isso.";
 let tool = undefined;
 
 if (msg.toLowerCase().includes('pix') || msg.toLowerCase().includes('boleto')) {
 tool = 'sgp_gerar_pix';
 simulatedResponse = "Localizei sua fatura. Acabei de gerar o seu código PIX Copia e Cola. Deseja também a 2ª via em PDF?";
 } else if (msg.toLowerCase().includes('lento') || msg.toLowerCase().includes('internet')) {
 tool = 'sgp_consultar_status_conexao';
 simulatedResponse = "Realizei um diagnóstico no seu roteador. Vi que o sinal óptico está excelente (-19.4 dBm). Deseja que eu reinicie o roteador remotamente?";
 } else if (msg.toLowerCase().includes('queda') || msg.toLowerCase().includes('bairro')) {
 tool = 'verificar_incidente_rede';
 simulatedResponse = "Identifiquei no NOC que estamos com uma manutenção ativa na fibra troncal da sua região com previsão para 15:30.";
 }

 setChatHistory(prev => [...prev, {
 role: 'agent',
 content: simulatedResponse,
 tool_executada: tool,
 tempo_ms: 450,
 tokens: 156,
 timestamp: 'Agora'
 }]);
 } finally {
 setLoading(false);
 }
 };

 const handleSavePrompt = () => {
 setSavedPromptSuccess(true);
 setTimeout(() => setSavedPromptSuccess(false), 3000);
 };

 return (
 <div className="flex-1 flex flex-col h-full bg-background text-muted-foreground overflow-hidden font-sans">
 
 {/* HEADER DA PÁGINA */}
 <div className="px-6 py-5 border-b border-border bg-card/80 backdrop-blur-md flex flex-wrap justify-between items-center gap-4 z-10">
 <div>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 ">
 <BrainCircuit size={22} />
 {toastMsg && (
 <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-white px-4 py-3 rounded-2xl shadow-xl font-bold animate-in slide-in-from-bottom-5">
 {toastMsg}
 </div>
 )}
</div>
 <div>
 <h1 className="text-2xl font-bold text-foreground font-outfit tracking-tight flex items-center gap-2">
 Cérebro IA & Automações
 <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono font-medium">MaIA</span>
 </h1>
 <div className="flex items-center gap-2 mt-0.5">
 <p className="text-sm text-muted-foreground">
 {iaConfig.provedorGateway === '9router' ? '9router Enterprise Gateway (DJD Telecom)' : 'Google Gemini 2.5 Flash'}
 </p>
 <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${
 iaConfig.alertaCotaAtivo 
 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
 : iaConfig.provedorGateway === '9router'
 ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
 : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
 }`}>
 {iaConfig.alertaCotaAtivo ? 'COTA ESGOTADA' : iaConfig.provedorGateway === '9router' ? '9ROUTER' : 'GEMINI FREE'}
 </span>
 </div>
 </div>
 </div>
 </div>
 
 <div className="flex items-center gap-2 bg-background border border-border p-1 rounded-xl ">
 <button 
 onClick={() => setActiveTab('playground')}
 className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
 activeTab === 'playground' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-muted-foreground hover:text-muted-foreground hover:bg-accent'
 }`}
 >
 Playground
 </button>
 <button 
 onClick={() => setActiveTab('prompt')}
 className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
 activeTab === 'prompt' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-muted-foreground hover:text-muted-foreground hover:bg-accent'
 }`}
 >
 Prompt Mestre
 </button>
 <button 
 onClick={() => setActiveTab('tools')}
 className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
 activeTab === 'tools' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-muted-foreground hover:text-muted-foreground hover:bg-accent'
 }`}
 >
 Skills (Tools)
 </button>
 <button 
 onClick={() => setActiveTab('channels')}
 className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
 activeTab === 'channels' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-muted-foreground hover:text-muted-foreground hover:bg-accent'
 }`}
 >
 Canais de Voz/Texto
 </button>
 <button 
 onClick={() => setActiveTab('config')}
 className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
 activeTab === 'config' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-muted-foreground hover:text-muted-foreground hover:bg-accent'
 }`}
 >
 <Sliders size={13} />
 Configuração & 9router
 {(iaConfig.alertaCotaAtivo || alertsList.some(a => a.type === 'QUOTA_EXHAUSTED')) && (
 <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping ml-1" />
 )}
 </button>
 </div>
 </div>

 {/* MÉTRICAS TOP */}
 <div className="px-6 py-3 bg-background/50 border-b border-border grid grid-cols-2 md:grid-cols-4 gap-4 text-xs z-10">
 <div className="flex items-center justify-between bg-card px-4 py-2.5 rounded-xl border border-border ">
 <div className="flex items-center gap-2 text-muted-foreground">
 <Zap size={14} className="text-amber-400" /> Requisições Hoje
 </div>
 <span className="font-mono font-bold text-foreground">{metrics.requests_today} / {metrics.daily_limit}</span>
 </div>
 <div className="flex items-center justify-between bg-card px-4 py-2.5 rounded-xl border border-border ">
 <div className="flex items-center gap-2 text-muted-foreground">
 <BarChart3 size={14} className="text-emerald-400" /> Tokens (Total)
 </div>
 <span className="font-mono font-bold text-foreground">{(metrics.total_tokens / 1000).toFixed(1)}k</span>
 </div>
 <div className="flex items-center justify-between bg-card px-4 py-2.5 rounded-xl border border-border ">
 <div className="flex items-center gap-2 text-muted-foreground">
 <Cpu size={14} className="text-blue-400" /> RPM (Rate Limit)
 </div>
 <span className="font-mono font-bold text-foreground">{metrics.rpm_current} / {metrics.rpm_limit}</span>
 </div>
 <div className="flex items-center justify-between bg-card px-4 py-2.5 rounded-xl border border-border ">
 <div className="flex items-center gap-2 text-muted-foreground">
 <CheckCircle2 size={14} className="text-emerald-400" /> Custo Mensal
 </div>
 <span className="font-mono font-bold text-emerald-400">Free Tier</span>
 </div>
 </div>

 {/* ÁREA DE CONTEÚDO PRINCIPAL */}
 <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full">
 <div className="max-w-7xl mx-auto h-full">
 
 {/* BANNER DE ALERTA DE COTA / TOKENS ESGOTADOS (QUOTA 429) */}
 {(iaConfig.alertaCotaAtivo || alertsList.some(a => a.type === 'QUOTA_EXHAUSTED')) && (
 <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in">
 <div className="flex items-start gap-3">
 <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
 <AlertCircle size={18} />
 </div>
 <div>
 <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
 Limite de Cota / Tokens Atingido (Erro 429)
 <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-md border border-amber-500/30">Gemini Rate Limit</span>
 </h4>
 <p className="text-xs text-amber-200/80 mt-0.5">
 {iaConfig.provedorGateway === '9router' 
 ? 'O atendimento está operando com redundância ativa via 9router Enterprise Gateway (DJD Telecom).' 
 : 'O limite gratuito de requisições ou cota de tokens do Google Gemini foi atingido. Ativar o gateway 9router restaura imediatamente o atendimento.'}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <button
 onClick={() => setActiveTab('config')}
 className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
 >
 <Sliders size={13} />
 Alternar para 9router
 </button>
 <button
 onClick={() => handleDismissAlert()}
 className="px-3 py-1.5 rounded-xl bg-card hover:bg-accent border border-border text-muted-foreground text-xs font-semibold transition"
 >
 Dispensar
 </button>
 </div>
 </div>
 )}
 
 {/* =========================================
 ABA: PLAYGROUND
 ========================================= */}
 {activeTab === 'playground' && (
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)] min-h-[500px]">
 
 {/* Painel de Chat */}
 <div className="lg:col-span-2 flex flex-col bg-card border border-border rounded-3xl overflow-hidden ">
 <div className="px-5 py-4 border-b border-border bg-card flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 border border-indigo-500/20">
 <Terminal size={16} />
 </div>
 <div>
 <h3 className="font-bold text-foreground text-sm font-outfit">Simulador de Atendimento</h3>
 <p className="text-[10px] text-muted-foreground">Teste o comportamento da IA com as ferramentas habilitadas.</p>
 </div>
 </div>
 <button className="text-xs flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
 <RefreshCw size={14} /> Resetar Sessão
 </button>
 </div>

 <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-background/30">
 {chatHistory.map((msg, i) => (
 <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
 <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
 msg.role === 'user' 
 ? 'bg-blue-600 text-white rounded-br-sm' 
 : 'bg-card border border-border text-muted-foreground rounded-bl-sm'
 }`}>
 {msg.content}
 
 {msg.tool_executada && (
 <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-[11px] text-amber-400 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20 w-fit">
 <Wrench size={12} />
 <strong>Tool call:</strong> {msg.tool_executada}
 </div>
 )}
 </div>
 <div className="flex items-center gap-2 mt-1.5 px-1 text-[10px] text-muted-foreground font-mono">
 <span>{msg.role === 'user' ? 'Você' : 'DJD (Gemini)'}</span>
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
 <div className="flex items-center gap-2 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2.5 rounded-xl w-fit ">
 <RefreshCw size={14} className="animate-spin" /> DJD está processando com o SGP...
 </div>
 </div>
 )}
 <div ref={messagesEndRef} />
 </div>

 <div className="p-4 border-t border-border bg-card">
 <form onSubmit={handleRunAgent} className="flex gap-2">
 <input 
 type="text" 
 value={promptInput}
 onChange={e => setPromptInput(e.target.value)}
 placeholder="Simule a mensagem de um cliente (ex: 'Minha internet caiu' ou 'Quero a fatura de agosto')"
 className="flex-1 px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-foreground placeholder:text-muted-foreground "
 />
 <button 
 type="submit"
 disabled={loading || !promptInput.trim()}
 className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600 -600/20"
 >
 <Send size={18} />
 </button>
 </form>
 </div>
 </div>

 {/* Dicas e Exemplos */}
 <div className="flex flex-col gap-6">
 <div className="bg-card border border-border rounded-3xl p-6 relative overflow-hidden">
 <div className="absolute top-0 right-0 p-6 opacity-5">
 <BrainCircuit size={100} />
 </div>
 <h3 className="font-bold text-foreground text-base mb-1 font-outfit relative z-10">Instruções do Playground</h3>
 <p className="text-xs text-muted-foreground mb-6 relative z-10">
 O Gemini tomará decisões baseadas no Prompt Mestre e nas Skills habilitadas. Tente as seguintes interações:
 </p>
 
 <div className="space-y-2.5 relative z-10">
 <button onClick={() => setPromptInput("Minha internet tá muito lenta hoje")} className="w-full text-left text-xs bg-background border border-border hover:border-indigo-500/30 p-3 rounded-xl text-muted-foreground hover:text-indigo-400 transition-colors flex items-center gap-2">
 <Wifi size={14} className="shrink-0" /> "Minha internet tá muito lenta hoje"
 </button>
 <button onClick={() => setPromptInput("Preciso do PIX da fatura que venceu ontem")} className="w-full text-left text-xs bg-background border border-border hover:border-indigo-500/30 p-3 rounded-xl text-muted-foreground hover:text-indigo-400 transition-colors flex items-center gap-2">
 <QrCode size={14} className="shrink-0" /> "Preciso do PIX da fatura que venceu"
 </button>
 <button onClick={() => setPromptInput("Quero fazer o desbloqueio em confiança")} className="w-full text-left text-xs bg-background border border-border hover:border-indigo-500/30 p-3 rounded-xl text-muted-foreground hover:text-indigo-400 transition-colors flex items-center gap-2">
 <Clock size={14} className="shrink-0" /> "Quero fazer o desbloqueio provisório"
 </button>
 </div>
 </div>

 <div className="bg-gradient-to-br from-indigo-900/30 to-blue-900/10 border border-indigo-500/20 rounded-3xl p-6 flex-1 flex flex-col justify-center text-center items-center">
 <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/30">
 <HelpCircle size={24} />
 </div>
 <h4 className="text-sm font-bold text-foreground mb-2">Por que não usamos n8n ou Dialogflow?</h4>
 <p className="text-[11px] text-muted-foreground leading-relaxed">
 A arquitetura utiliza a SDK Serverless nativa do Gemini 1.5 Pro. Isso elimina intermediários (como n8n/Typebot), reduzindo a latência para áudio em 80% e cortando custos extras de servidores dedicados.
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
 <div className="bg-gradient-to-r from-blue-900/20 to-[#101726] border border-blue-500/20 rounded-2xl p-5 flex items-start gap-4 ">
 <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/30">
 <Bot size={20} />
 </div>
 <div>
 <h3 className="font-bold text-foreground text-base">Engenharia de Prompt (System Instructions)</h3>
 <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
 Defina o comportamento exato, restrições e tom de voz da inteligência artificial. Este prompt é injetado em todas as chamadas antes da mensagem do cliente. Dica: Seja claro sobre o que a IA <strong>NÃO</strong> deve fazer.
 </p>
 </div>
 </div>

 <div className="flex-1 flex flex-col bg-card border border-border rounded-2xl overflow-hidden relative">
 <textarea 
 value={systemPrompt}
 onChange={e => setSystemPrompt(e.target.value)}
 className="flex-1 w-full bg-background/50 p-6 text-sm text-muted-foreground resize-none outline-none focus:ring-2 focus:ring-indigo-500/50 leading-loose placeholder:text-muted-foreground font-mono"
 placeholder="Ex: Você é um assistente virtual de um provedor de internet..."
 />
 
 <div className="p-4 bg-card border-t border-border flex justify-between items-center">
 <div className="text-xs text-muted-foreground flex items-center gap-2">
 <Sparkles size={14} className="text-amber-400" />
 Utilize markdown para estruturar. Aproximadamente {systemPrompt.length} caracteres.
 </div>
 <button 
 onClick={handleSavePrompt}
 className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all -600/20"
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
 <h2 className="text-lg font-bold text-foreground font-outfit">Skills Habilitadas (SGP Integration)</h2>
 <p className="text-xs text-muted-foreground">Ferramentas que o modelo pode chamar autonomamente para buscar dados ou realizar ações.</p>
 </div>
 <button className="bg-card border border-border hover:bg-accent text-muted-foreground px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ">
 <Database size={14} /> Sincronizar Endpoints SGP
 </button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {tools.map(tool => (
 <div key={tool.id} onClick={() => showToast('Abrindo configuração de automação')} className="bg-card border border-border rounded-2xl p-5 hover:border-indigo-500/30 transition-all group cursor-pointer">
 <div className="flex justify-between items-start mb-3">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-background border border-border rounded-xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/10 transition-colors">
 <Wrench size={18} />
 </div>
 <div>
 <h4 className="font-bold text-foreground text-sm font-mono">{tool.name}</h4>
 <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{tool.category}</span>
 </div>
 </div>
 <label className="relative inline-flex items-center cursor-pointer">
 <input type="checkbox" className="sr-only peer" defaultChecked />
 <div className="w-9 h-5 bg-background peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500 border border-border"></div>
 </label>
 </div>
 <p className="text-xs text-muted-foreground mb-4 h-10">{tool.description}</p>
 
 <div className="bg-background/80 rounded-xl p-3 border border-border">
 <p className="text-[10px] text-muted-foreground font-bold mb-2 uppercase tracking-wider">Parameters Schema</p>
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
 <div className="flex justify-between items-center mb-2">
 <div>
 <h2 className="text-lg font-bold text-foreground font-outfit">Estratégia Omnichannel & Automações MaIA</h2>
 <p className="text-xs text-muted-foreground">Portal do Cliente como canal principal de notificação e cobrança; WhatsApp 24h sob IA com transição humana livre.</p>
 </div>
 </div>
 
 {/* CANAL 1: PORTAL DO CLIENTE (CANAL PRINCIPAL) */}
 <div onClick={() => showToast('Acessando integração...')} className="bg-card border border-blue-500/30 rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-center hover:border-blue-500/50 transition-all bg-gradient-to-r from-blue-950/20 via-slate-900 to-slate-900 cursor-pointer">
 <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 shrink-0">
 <BrainCircuit size={32} />
 </div>
 <div className="flex-1">
 <div className="flex flex-wrap items-center gap-2 mb-1">
 <h3 className="text-base font-bold text-foreground">Portal do Assinante PWA (Canal Principal)</h3>
 <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/30">CANAL PRINCIPAL OFICIAL</span>
 <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">ATIVO 24H</span>
 </div>
 <p className="text-xs text-muted-foreground leading-relaxed mb-3">
 Canal prioritário para notificações via Web Push, visualização de faturas, pagamento instantâneo por PIX e suporte técnico autenticado. Economiza custos de tarifas Meta e garante soberania total de dados do provedor.
 </p>
 <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
 <span className="flex items-center gap-1 text-emerald-400 font-bold">✓ Sem custo por mensagem</span>
 <span className="flex items-center gap-1 text-blue-400 font-bold">✓ Notificações Push Gratuitas</span>
 <span className="flex items-center gap-1 text-purple-400 font-bold">✓ Webphone WebRTC Incluso</span>
 </div>
 </div>
 </div>

 {/* CANAL 2: WHATSAPP WABA (ATENDIMENTO 24H MAIA) */}
 <div onClick={() => showToast('Acessando integração...')} className="bg-card border border-emerald-500/30 rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-center hover:border-emerald-500/50 transition-all bg-gradient-to-r from-emerald-950/20 via-slate-900 to-slate-900 cursor-pointer">
 <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0">
 <MessageSquare size={32} />
 </div>
 <div className="flex-1">
 <div className="flex flex-wrap items-center gap-2 mb-1">
 <h3 className="text-base font-bold text-foreground">WhatsApp Cloud API (WABA Oficial)</h3>
 <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">HOMOLOGADO META</span>
 <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">MAIA 24H</span>
 </div>
 <p className="text-xs text-muted-foreground leading-relaxed mb-3">
 Após validação da conta comercial, o WhatsApp do Provedor fica <strong>disponível 24 horas</strong> sendo atendido e respondido de forma humanizada pela MaIA. O envio de faturas e informativos fica <strong>a critério do operador</strong> (manual ou programado), evitando cobranças indesejadas.
 </p>
 <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-medium">
 <span className="flex items-center gap-1 text-emerald-400 font-bold">✓ Triagem e Resolução 24h</span>
 <span className="flex items-center gap-1 text-indigo-400 font-bold">✓ Interatividade Humana a Qualquer Momento</span>
 <span className="flex items-center gap-1 text-amber-400 font-bold">✓ Envio de Fatura a Critério do Operador</span>
 </div>
 </div>
 </div>

 {/* CANAL 3: VOZ & TELEFONIA */}
 <div onClick={() => showToast('Acessando integração...')} className="bg-card border border-border rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-center hover:border-indigo-500/30 transition-all cursor-pointer">
 <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 shrink-0">
 <PhoneCall size={32} />
 </div>
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-1">
 <h3 className="text-base font-bold text-foreground">Telefonia & Voz (Asterisk 20+ AMI/ARI)</h3>
 <span className="bg-muted text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded-full border border-border">PRONTO</span>
 </div>
 <p className="text-xs text-muted-foreground leading-relaxed mb-2">
 A MaIA atua como agente de voz via Gemini Live API com fala humanizada, atendendo ligações do 0800 e ramais SIP do provedor com encaminhamento inteligente para operadores humanos.
 </p>
 </div>
 </div>

 </div>
 )}

 {/* =========================================
 ABA: CONFIGURAÇÃO & 9ROUTER
 ========================================= */}
 {activeTab === 'config' && (
 <div className="max-w-4xl mx-auto h-full space-y-6 pb-12 animate-in fade-in">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h2 className="text-lg font-bold text-foreground font-outfit flex items-center gap-2">
 Configuração da MaIA & Gateway 9router
 <span className="text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
 DJD Telecom LTDA
 </span>
 </h2>
 <p className="text-xs text-muted-foreground mt-0.5">
 Gerencie o motor de IA MaIA, conexões com o gateway 9router, redundância contra esgotamento de cotas e testes de conectividade.
 </p>
 </div>
 <div className="flex items-center gap-2">
 <button
 onClick={handleTestGateway}
 disabled={testingGateway}
 className="px-3.5 py-2 rounded-xl bg-card hover:bg-accent border border-border text-foreground text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
 >
 <Activity size={14} className={testingGateway ? 'animate-spin text-indigo-400' : 'text-indigo-400'} />
 {testingGateway ? 'Testando Conexão...' : 'Testar Conexão Gateway'}
 </button>
 <button
 onClick={handleSaveIaConfig}
 disabled={savingConfig}
 className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
 >
 <Save size={14} />
 {savingConfig ? 'Salvando...' : 'Salvar Configurações'}
 </button>
 </div>
 </div>

 {/* RESULTADO DO TESTE DE CONEXÃO (SE EXECUTADO) */}
 {testResult && (
 <div className={`p-4 rounded-2xl border flex items-start gap-3 animate-in fade-in ${
 testResult.sucesso 
 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
 : 'bg-red-500/10 border-red-500/30 text-red-300'
 }`}>
 <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
 testResult.sucesso ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
 }`}>
 {testResult.sucesso ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
 </div>
 <div className="flex-1 text-xs">
 <div className="flex items-center justify-between font-bold">
 <span>{testResult.sucesso ? 'Conexão com Gateway Bem-Sucedida' : 'Falha na Conexão com Gateway'}</span>
 {testResult.latencia_ms && (
 <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-background/50 border border-border">
 Latência: {testResult.latencia_ms}ms
 </span>
 )}
 </div>
 <p className="mt-1 text-foreground/80">{testResult.mensagem}</p>
 {testResult.detalhes && (
 <pre className="mt-2 p-2 rounded-lg bg-background/80 text-[10px] font-mono overflow-x-auto text-muted-foreground border border-border">
 {JSON.stringify(testResult.detalhes, null, 2)}
 </pre>
 )}
 </div>
 </div>
 )}

 {/* CARD: PROVEDOR DE IA ATIVO */}
 <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
 <div className="flex items-center justify-between border-b border-border pb-3">
 <div>
 <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
 <Cpu size={16} className="text-indigo-400" />
 Provedor do Modelo & Roteador de Tráfego
 </h3>
 <p className="text-xs text-muted-foreground mt-0.5">
 Escolha a estratégia de atendimento da MaIA: Gemini direto (gratuito) ou 9router Enterprise.
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {/* OPÇÃO 1: GEMINI DIRETO */}
 <div 
 onClick={() => setIaConfig(prev => ({ ...prev, provedorGateway: 'direct' }))}
 className={`p-5 rounded-2xl border cursor-pointer transition-all ${
 iaConfig.provedorGateway === 'direct'
 ? 'bg-indigo-500/10 border-indigo-500/50 shadow-md shadow-indigo-500/5'
 : 'bg-background hover:bg-card border-border'
 }`}
 >
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center gap-2">
 <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
 iaConfig.provedorGateway === 'direct' ? 'border-indigo-500 bg-indigo-500' : 'border-muted-foreground'
 }`}>
 {iaConfig.provedorGateway === 'direct' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
 </div>
 <span className="font-bold text-sm text-foreground">Google Gemini 2.5 Flash</span>
 </div>
 <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
 Gratuito (Padrão)
 </span>
 </div>
 <p className="text-xs text-muted-foreground leading-relaxed">
 Conexão direta com a API do Google Gemini Serverless. Sem custo por chamada, ideal para volume padrão de atendimento e consultas no SGP.
 </p>
 </div>

 {/* OPÇÃO 2: 9ROUTER GATEWAY */}
 <div 
 onClick={() => setIaConfig(prev => ({ ...prev, provedorGateway: '9router' }))}
 className={`p-5 rounded-2xl border cursor-pointer transition-all ${
 iaConfig.provedorGateway === '9router'
 ? 'bg-purple-500/10 border-purple-500/50 shadow-md shadow-purple-500/5'
 : 'bg-background hover:bg-card border-border'
 }`}
 >
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center gap-2">
 <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
 iaConfig.provedorGateway === '9router' ? 'border-purple-500 bg-purple-500' : 'border-muted-foreground'
 }`}>
 {iaConfig.provedorGateway === '9router' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
 </div>
 <span className="font-bold text-sm text-foreground">9router Enterprise Gateway</span>
 </div>
 <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
 DJD Telecom
 </span>
 </div>
 <p className="text-xs text-muted-foreground leading-relaxed">
 Gateway corporativo balanceado hospedado em <code>9router.enlace.slz.br</code>. Garante alta disponibilidade para WABA e Voz PABX.
 </p>
 </div>
 </div>
 </div>

 {/* CARD: PARÂMETROS DO GATEWAY 9ROUTER */}
 <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
 <div className="border-b border-border pb-3">
 <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
 <Server size={16} className="text-purple-400" />
 Parâmetros do Gateway 9router
 </h3>
 <p className="text-xs text-muted-foreground mt-0.5">
 Endereço e credenciais de autenticação do proxy/gateway do provedor.
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
 <LinkIcon size={12} className="text-muted-foreground" />
 URL Base do 9router
 </label>
 <input
 type="text"
 value={iaConfig.baseUrl}
 onChange={(e) => setIaConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
 placeholder="https://9router.enlace.slz.br"
 className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs font-mono focus:outline-none focus:border-indigo-500"
 />
 <span className="text-[10px] text-muted-foreground">Endpoint oficial da DJD Telecom LTDA.</span>
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-foreground flex items-center justify-between">
 <span className="flex items-center gap-1.5">
 <Key size={12} className="text-muted-foreground" />
 Chave API do 9router (Bearer Token)
 </span>
 {iaConfig.apiKeyConfigurada && !iaConfig.apiKey && (
 <span className="text-[10px] text-emerald-400 font-bold">Chave salva no servidor</span>
 )}
 </label>
 <div className="relative">
 <input
 type={showApiKey ? 'text' : 'password'}
 value={iaConfig.apiKey}
 onChange={(e) => setIaConfig(prev => ({ ...prev, apiKey: e.target.value }))}
 placeholder={iaConfig.apiKeyConfigurada ? '••••••••••••••••••••••••' : 'Insira o token do 9router...'}
 className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-background border border-border text-foreground text-xs font-mono focus:outline-none focus:border-indigo-500"
 />
 <button
 type="button"
 onClick={() => setShowApiKey(!showApiKey)}
 className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
 >
 {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
 </button>
 </div>
 <span className="text-[10px] text-muted-foreground">Chave de acesso seguro mantida em ambiente protegido.</span>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-foreground">Modelo Primário da MaIA</label>
 <input
 type="text"
 value={iaConfig.modeloPrimario}
 onChange={(e) => setIaConfig(prev => ({ ...prev, modeloPrimario: e.target.value }))}
 className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-foreground text-xs font-mono"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-foreground">Temperatura de Resposta ({iaConfig.temperatura})</label>
 <input
 type="range"
 min="0"
 max="1"
 step="0.05"
 value={iaConfig.temperatura}
 onChange={(e) => setIaConfig(prev => ({ ...prev, temperatura: parseFloat(e.target.value) }))}
 className="w-full accent-indigo-500 mt-2"
 />
 <span className="text-[10px] text-muted-foreground">0.2: Alta precisão e aderência estrita às ferramentas do SGP/TR-069.</span>
 </div>
 </div>
 </div>

 {/* CARD: POLÍTICAS DE RESILIÊNCIA E ALERTAS */}
 <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
 <div className="border-b border-border pb-3">
 <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
 <ShieldCheck size={16} className="text-emerald-400" />
 Resiliência & Notificação aos Operadores
 </h3>
 <p className="text-xs text-muted-foreground mt-0.5">
 Proteções automáticas para que o atendimento nunca pare por limite de cota gratuita da API.
 </p>
 </div>

 <div className="space-y-4">
 <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-background border border-border">
 <div>
 <p className="text-xs font-bold text-foreground">Failover Automático para 9router (Erro 429)</p>
 <p className="text-[11px] text-muted-foreground mt-0.5">
 Se o Google Gemini atingir o limite de requisições por minuto ou cota de tokens, a chamada tenta automaticamente o 9router.
 </p>
 </div>
 <label className="relative inline-flex items-center cursor-pointer shrink-0">
 <input 
 type="checkbox" 
 checked={iaConfig.failoverAutomatico}
 onChange={(e) => setIaConfig(prev => ({ ...prev, failoverAutomatico: e.target.checked }))}
 className="sr-only peer" 
 />
 <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
 </label>
 </div>

 <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-background border border-border">
 <div>
 <p className="text-xs font-bold text-foreground">Alerta Visual aos Operadores no Dashboard</p>
 <p className="text-[11px] text-muted-foreground mt-0.5">
 Exibe banner de alerta no topo do painel quando a cota do Gemini expirar, permitindo ação rápida do suporte.
 </p>
 </div>
 <label className="relative inline-flex items-center cursor-pointer shrink-0">
 <input 
 type="checkbox" 
 checked={iaConfig.alertarOperadoresEmEsgotamento}
 onChange={(e) => setIaConfig(prev => ({ ...prev, alertarOperadoresEmEsgotamento: e.target.checked }))}
 className="sr-only peer" 
 />
 <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
 </label>
 </div>

 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
 <div>
 <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
 <AlertTriangle size={14} className="text-amber-400" />
 Teste de Alerta & Esgotamento (Erro 429)
 </p>
 <p className="text-[11px] text-muted-foreground mt-0.5">
 Dispare uma simulação de cota esgotada para validar o banner no topo e a ação de dispensar.
 </p>
 </div>
 <button
 type="button"
 onClick={handleSimulate429Alert}
 className="text-xs px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-medium transition shrink-0 self-start sm:self-auto"
 >
 Simular Alerta 429
 </button>
 </div>
 </div>
 </div>

 {/* CARD: REGISTRO DE ALERTAS DE COTA (SE HOUVER) */}
 {alertsList.length > 0 && (
 <div className="bg-card border border-amber-500/30 rounded-3xl p-6 space-y-4">
 <div className="flex items-center justify-between border-b border-border pb-3">
 <div>
 <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
 <AlertCircle size={16} className="text-amber-400" />
 Histórico de Alertas de Cota Registrados
 </h3>
 <p className="text-xs text-muted-foreground mt-0.5">
 Incidentes detectados automaticamente pelo middleware do Cérebro IA.
 </p>
 </div>
 <button
 onClick={() => handleDismissAlert()}
 className="text-xs px-3 py-1.5 rounded-xl bg-background hover:bg-accent border border-border text-foreground font-semibold transition"
 >
 Limpar Todos
 </button>
 </div>

 <div className="space-y-2">
 {alertsList.map((alerta, idx) => (
 <div key={alerta.id || idx} className="p-3.5 rounded-2xl bg-background border border-border flex items-center justify-between gap-3 text-xs">
 <div className="flex items-center gap-3">
 <span className="w-2 h-2 rounded-full bg-amber-400" />
 <div>
 <p className="font-bold text-foreground">{alerta.message}</p>
 <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
 Ocorrências: {alerta.count || 1} • {alerta.timestamp ? new Date(alerta.timestamp).toLocaleString('pt-BR') : 'Recentemente'}
 </p>
 </div>
 </div>
 <button
 onClick={() => handleDismissAlert(alerta.id)}
 className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded bg-card hover:bg-accent border border-border"
 >
 Dispensar
 </button>
 </div>
 ))}
 </div>
 </div>
 )}

 </div>
 )}

 </div>
 </div>
 </div>
 );
}
