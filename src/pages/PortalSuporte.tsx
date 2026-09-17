import React, { useState, useEffect } from 'react';
import { 
 HeadphonesIcon, Plus, MessageSquare, Clock, CheckCircle2, PhoneCall, 
 Bot, Activity, Wifi, ShieldAlert, RefreshCw, Star, Send, Sparkles, 
 HeartHandshake, Smile, Frown, Meh, X, AlertCircle, Calendar, ChevronRight, UserCheck, Check
} from 'lucide-react';
import type { Deal } from '../types';
import AutoDiagnosticoModal from '../components/AutoDiagnosticoModal';
import Webphone from '../components/Webphone';

export default function PortalSuporte() {
 const authData = localStorage.getItem('@nap_client_auth');
 const clientData = authData ? JSON.parse(authData) : { nome: 'Rafael Medeiros', telefone: '(11) 98765-4321' };

 const [chamados, setChamados] = useState<Deal[]>([]);
 const [loading, setLoading] = useState(true);
 const [activeCall, setActiveCall] = useState(false);
 const [callDuration, setCallDuration] = useState(0);
 const [isDiagnosticoOpen, setIsDiagnosticoOpen] = useState(false);

 // Modal Novo Chamado
 const [modalNovoChamado, setModalNovoChamado] = useState(false);
 const [novoCategoria, setNovoCategoria] = useState('Lentidão na Conexão');
 const [novoDescricao, setNovoDescricao] = useState('');
 const [novoPreferencia, setNovoPreferencia] = useState<'WhatsApp' | 'Telefone' | 'Portal'>('WhatsApp');
 const [enviarGps, setEnviarGps] = useState(false);
 const [criandoChamado, setCriandoChamado] = useState(false);
 const [protocoloSucesso, setProtocoloSucesso] = useState<string | null>(null);

 // Modal Ligação MaIa
 const [modalLigacaoOpen, setModalLigacaoOpen] = useState(false);
 const [ligacaoMotivo, setLigacaoMotivo] = useState('');
 const [showWebphoneModal, setShowWebphoneModal] = useState(false);

 /*
 * ARQUITETURA WEBRTC (CLIENTE -> OPERADOR via ASTERISK PJSIP):
 * 1. O Portal web inicializa uma conexão wss:// (WebSocket Secure) com o Asterisk (porta 8089).
 * 2. O Asterisk possui um endpoint PJSIP genérico configurado no pjsip.conf (ex: [webrtc_client_guest]) 
 * com 'webrtc=yes' e 'max_contacts=1000' (permitindo múltiplas chamadas simultâneas anônimas/guests).
 * 3. Na inicialização do INVITE SIP pelo frontend (via SIP.js), injetamos custom headers (X-Client-CPF, X-Call-Reason).
 * 4. O Dialplan do Asterisk (extensions.conf) intercepta o INVITE, lê os cabeçalhos, altera o CALLERID(name) para o
 * nome do cliente, e joga a chamada na Fila (Queue) solicitada (Ex: Queue(suporte_tecnico)).
 * 5. O operador logado no seu respectivo Webphone (extensão estática, ex: 2001) recebe a chamada distribuída
 * pela fila. O Webphone do operador (React) lê os custom headers que o Asterisk repassou e exibe a Ficha 360 (CRM).
 */

 useEffect(() => {
 if (modalLigacaoOpen) {
 const text = "Olá! Sou a Maia, sua assistente virtual. Para eu direcionar sua ligação gratuita ao especialista mais rápido, qual o motivo do seu contato?";
 
 const playVoice = () => {
 const msg = new SpeechSynthesisUtterance(text);
 msg.lang = 'pt-BR';
 msg.rate = 1.05; 
 msg.pitch = 1.25; 
 
 const voices = window.speechSynthesis.getVoices();
 // Nomes comuns de vozes femininas PT-BR em diversos SOs/Navegadores
 const preferred = ['Francisca', 'Luciana', 'Vitoria', 'Raquel', 'Maju', 'Google português do Brasil', 'Google pt-BR'];
 
 let voice = voices.find(v => v.lang.includes('pt-BR') && preferred.some(p => v.name.includes(p)));
 
 if (!voice) {
 voice = voices.find(v => v.lang.includes('pt-BR')); // Fallback
 }
 
 if (voice) {
 msg.voice = voice;
 }
 
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
 } else {
 window.speechSynthesis.cancel();
 }
 }, [modalLigacaoOpen]);

 // Modal Detalhes do Chamado
 const [chamadoSelecionado, setChamadoSelecionado] = useState<Deal | null>(null);

 // NPS State
 const [npsNota, setNpsNota] = useState<number | null>(null);
 const [npsComentario, setNpsComentario] = useState('');
 const [npsEnviando, setNpsEnviando] = useState(false);
 const [npsEnviado, setNpsEnviado] = useState(false);
 
 // Webchat State
 const [webchatAberto, setWebchatAberto] = useState(false);
 const [chatMessages, setChatMessages] = useState<{remetente:'cliente'|'ia', texto:string}[]>([]);
 const [chatInput, setChatInput] = useState('');
 const [chatEnviando, setChatEnviando] = useState(false);
 const chatBottomRef = React.useRef<HTMLDivElement>(null);

 useEffect(() => {
 if (chatBottomRef.current) {
 chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
 }
 }, [chatMessages]);

 const handleSendWebchat = async (e: React.FormEvent) => {
 e.preventDefault();
 if(!chatInput.trim()) return;
 
 const texto = chatInput;
 setChatInput('');
 setChatMessages(prev => [...prev, {remetente: 'cliente', texto}]);
 setChatEnviando(true);
 
 try {
 const res = await fetch('/api/webchat/send', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 telefone: clientData.telefone ? clientData.telefone.replace(/\D/g, '') : '5511987654321',
 nome: clientData.nome || 'Rafael Medeiros',
 texto: texto
 })
 });
 const data = await res.json();
 if(data.sucesso) {
 setChatMessages(prev => [...prev, {remetente: 'ia', texto: data.resposta}]);
 }
 } catch(err) {
 setChatMessages(prev => [...prev, {remetente: 'ia', texto: 'Ops, erro de conexão com a IA.'}]);
 }
 setChatEnviando(false);
 };

 useEffect(() => {
 // Busca chamados de suporte
 fetch('/api/deals')
 .then(res => res.json())
 .then((data: Deal[]) => {
 // Simular filtro do cliente logado "João Silva"
 const clienteChamados = data.filter(d => d.pipeline === 'Suporte' && d.contato === 'João Silva');
 setChamados(clienteChamados);
 setLoading(false);
 });
 }, []);

 const handleCriarChamado = async (e: React.FormEvent) => {
 e.preventDefault();
 setCriandoChamado(true);
 setProtocoloSucesso(null);

 const submitChamado = async (coordenadas: string) => {
 try {
 const res = await fetch('/api/deals', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 titulo: novoCategoria,
 pipeline: 'Suporte',
 contato: 'João Silva',
 telefone: '(11) 98765-4321',
 endereco: 'Rua das Flores, 123 - Centro Histórico',
 plano: 'Fibra 500MB',
 prioridade: novoCategoria.includes('Sem Acesso') ? 1 : 2,
 contexto_ia: `${novoDescricao} | Preferência de retorno: ${novoPreferencia}.${coordenadas}`
 })
 });

 const data = await res.json();
 if (data.deal) {
 setChamados(prev => [data.deal, ...prev]);
 setProtocoloSucesso(`PROT-${data.deal.id}`);
 setNovoDescricao('');
 setEnviarGps(false);
 setTimeout(() => {
 setModalNovoChamado(false);
 }, 2000);
 }
 } catch {
 // Fallback local caso o backend esteja indisponível
 const fakeId = Math.floor(1000 + Math.random() * 9000);
 const novoDeal: Deal = {
 id: fakeId,
 titulo: novoCategoria,
 estagio: 'Novo Chamado',
 pipeline: 'Suporte',
 contato: 'João Silva',
 telefone: '(11) 98765-4321',
 endereco: 'Rua das Flores, 123 - Centro Histórico',
 plano: 'Fibra 500MB',
 prioridade: 2,
 criado_em: 'Agora',
 contexto_ia: `${novoDescricao} | Preferência: ${novoPreferencia}.${coordenadas}`
 };
 setChamados(prev => [novoDeal, ...prev]);
 setProtocoloSucesso(`PROT-${fakeId}`);
 setNovoDescricao('');
 setEnviarGps(false);
 setTimeout(() => {
 setModalNovoChamado(false);
 }, 2000);
 } finally {
 setCriandoChamado(false);
 }
 };

 if (enviarGps && navigator.geolocation) {
 navigator.geolocation.getCurrentPosition(
 (pos) => {
 submitChamado(` | GPS Cliente: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
 },
 (err) => {
 console.error("GPS Negado:", err);
 submitChamado(' | GPS Negado pelo navegador');
 }
 );
 } else {
 submitChamado('');
 }
 };

 useEffect(() => {
 let interval: any;
 if (activeCall) {
 interval = setInterval(() => {
 setCallDuration(prev => prev + 1);
 }, 1000);
 } else {
 setCallDuration(0);
 }
 return () => clearInterval(interval);
 }, [activeCall]);

 const formatTime = (seconds: number) => {
 const m = Math.floor(seconds / 60).toString().padStart(2, '0');
 const s = (seconds % 60).toString().padStart(2, '0');
 return `${m}:${s}`;
 };

 const handleWebphone = () => {
 if (activeCall) {
 setActiveCall(false);
 } else {
 setActiveCall(true);
 }
 };

 const handleEnviarNps = async () => {
 if (npsNota === null) return;
 setNpsEnviando(true);
 try {
 await fetch('/api/nps/avaliar', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 cliente: 'João Silva (Portal)',
 telefone: '+55 (11) 98765-4321',
 canal: 'Portal PWA',
 nota: npsNota,
 comentario: npsComentario,
 atendente: 'Agente IA / Suporte N1',
 setor: 'Suporte N1'
 })
 });
 setNpsEnviado(true);
 } catch {
 setNpsEnviado(true);
 } finally {
 setNpsEnviando(false);
 }
 };

 return (
 <div className="p-4 md:p-8 max-w-4xl mx-auto w-full pb-24">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
 <div>
 <h1 className="text-2xl md:text-3xl font-bold text-foreground font-outfit mb-2">Suporte Técnico</h1>
 <p className="text-muted-foreground text-sm md:text-base">Meus chamados e contato direto.</p>
 </div>
 </div>

 {/* Banner de Auto-Diagnóstico */}
 <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-3xl text-foreground mb-8 border border-indigo-900/50 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
 <div className="flex items-start gap-4">
 <div className="w-14 h-14 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-2xl flex items-center justify-center shrink-0">
 <Activity size={28} />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
 GenieACS TR-069 Ativo
 </span>
 <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold uppercase tracking-wider">
 NOC Shield
 </span>
 </div>
 <h2 className="text-xl font-bold font-outfit text-foreground mt-1.5">Auto-Diagnóstico de Fibra & Wi-Fi</h2>
 <p className="text-muted-foreground text-xs md:text-sm mt-1 max-w-xl">
 Teste o sinal óptico da sua ONU, confira se há rompimentos no seu bairro e reinicie seu roteador remotamente sem precisar esperar na fila.
 </p>
 </div>
 </div>

 <button 
 onClick={() => setIsDiagnosticoOpen(true)}
 className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-2xl text-xs md:text-sm transition-all active:scale-95 shadow-sm shrink-0 flex items-center gap-2"
 >
 <Activity size={18} /> Iniciar Diagnóstico Agora
 </button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
 {/* Card: Ligar para Suporte (WebRTC) */}
 <div className="bg-gradient-to-br from-blue-700 to-indigo-800 p-6 rounded-3xl text-foreground relative overflow-hidden group">
 <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
 <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm mb-4">
 <PhoneCall size={24} className="text-blue-100" />
 </div>
 <h3 className="text-xl font-bold font-outfit mb-2">Ligação Gratuita</h3>
 <p className="text-blue-100 text-sm mb-6 max-w-[250px]">Fale agora mesmo com um de nossos especialistas usando a internet do seu dispositivo, sem gastar seus créditos.</p>
 <button 
 onClick={() => setModalLigacaoOpen(true)}
 className="bg-card text-blue-900 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-50 transition-all active:scale-95 flex items-center gap-2"
 >
 Iniciar Chamada de Voz
 </button>
 </div>

 {/* Card: Webchat / Fila */}
 <div className="bg-card p-6 rounded-3xl border border-border relative overflow-hidden group">
 <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100">
 <MessageSquare size={24} className="text-emerald-600" />
 </div>
 <h3 className="text-xl font-bold font-outfit text-foreground mb-2">Atendimento via Chat</h3>
 <p className="text-muted-foreground text-sm mb-6 max-w-[250px]">Inicie uma conversa por texto. Você será direcionado para o setor correto (Financeiro, Suporte ou Vendas).</p>
 <button 
 onClick={() => {
 const widget = document.querySelector('.webchat-widget-toggle') as HTMLButtonElement;
 if (widget) widget.click();
 }}
 className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2"
 >
 Entrar na Fila de Chat
 </button>
 </div>
 </div>

 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-bold text-foreground font-outfit">Histórico de Chamados</h2>
 <button 
 onClick={() => {
 setProtocoloSucesso(null);
 setModalNovoChamado(true);
 }}
 className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
 >
 <Plus size={16} /> Abrir Novo Chamado
 </button>
 </div>

 {protocoloSucesso && (
 <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between animate-in fade-in">
 <div className="flex items-center gap-3">
 <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
 <div>
 <p className="text-xs font-bold">Chamado registrado com sucesso!</p>
 <p className="text-[11px] text-emerald-700 font-mono">Protocolo de atendimento: {protocoloSucesso}</p>
 </div>
 </div>
 <button onClick={() => setProtocoloSucesso(null)} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold">
 OK
 </button>
 </div>
 )}

 {loading ? (
 <div className="flex justify-center p-8 text-muted-foreground">Carregando chamados...</div>
 ) : (
 <div className="grid gap-4">
 {chamados.map(chamado => (
 <div 
 key={chamado.id} 
 onClick={() => setChamadoSelecionado(chamado)}
 className="bg-card p-5 rounded-3xl border border-border hover:border-blue-500/50 hover:shadow-md transition-all group cursor-pointer"
 >
 <div className="flex justify-between items-start mb-2">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center text-muted-foreground border border-border group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
 <HeadphonesIcon size={18} />
 </div>
 <div>
 <h3 className="font-bold text-foreground font-outfit group-hover:text-blue-600 transition-colors">{chamado.titulo}</h3>
 <p className="text-xs text-muted-foreground font-mono mt-0.5">Protocolo #{chamado.id} • {chamado.criado_em || 'Recente'}</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 {chamado.estagio === 'Resolvido' ? (
 <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
 <CheckCircle2 size={12} /> Resolvido
 </span>
 ) : (
 <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
 <Clock size={12} /> {chamado.estagio}
 </span>
 )}
 <ChevronRight size={16} className="text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
 </div>
 </div>
 {chamado.contexto_ia && (
 <p className="text-xs text-muted-foreground line-clamp-1 pl-14">{chamado.contexto_ia}</p>
 )}
 </div>
 ))}

 {chamados.length === 0 && (
 <div className="bg-background p-8 rounded-3xl border border-dashed border-border flex flex-col items-center justify-center text-center">
 <div className="w-12 h-12 bg-card rounded-full flex items-center justify-center text-muted-foreground mb-3">
 <CheckCircle2 size={24} />
 </div>
 <h3 className="text-base font-bold text-foreground font-outfit mb-1">Nenhum chamado aberto</h3>
 <p className="text-muted-foreground text-xs max-w-[200px]">
 Sua conexão está 100% estável e operando normalmente.
 </p>
 </div>
 )}
 </div>
 )}

 {/* Widget de Avaliação NPS & Satisfação */}
 <div className="mt-8 bg-card border border-border p-6 rounded-3xl shadow-sm">
 <div className="flex items-start gap-4">
 <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center shrink-0">
 <Star size={24} className="fill-amber-400" />
 </div>
 <div className="flex-1">
 <div className="flex items-center gap-2">
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
 Pesquisa de Satisfação
 </span>
 <span className="text-[10px] font-medium text-muted-foreground">Tempo estimado: 15s</span>
 </div>
 <h3 className="text-lg font-bold text-foreground font-outfit mt-1">Como você avalia nossa conexão e suporte?</h3>
 <p className="text-xs text-muted-foreground mt-0.5">Em uma escala de 0 a 10, qual a chance de você recomendar nosso provedor para amigos ou familiares?</p>

 {npsEnviado ? (
 <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 animate-in fade-in">
 <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
 <div>
 <p className="text-sm font-bold text-emerald-900">Obrigado pela sua avaliação!</p>
 <p className="text-xs text-emerald-700">Seu feedback foi computado no nosso painel de qualidade e nos ajuda a melhorar cada vez mais sua experiência.</p>
 </div>
 </div>
 ) : (
 <div className="mt-5 space-y-4">
 {/* Régua de notas de 0 a 10 */}
 <div>
 <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5 font-medium px-1">
 <span className="flex items-center gap-1"><Frown size={12} className="text-rose-500" /> Pouco provável (0)</span>
 <span className="flex items-center gap-1 text-emerald-600 font-bold"><Smile size={12} /> Com certeza (10)</span>
 </div>
 <div className="grid grid-cols-11 gap-1 sm:gap-2">
 {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(nota => (
 <button
 key={nota}
 onClick={() => setNpsNota(nota)}
 className={`h-10 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center border ${
 npsNota === nota
 ? nota >= 9
 ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-105'
 : nota >= 7
 ? 'bg-amber-500 text-white border-amber-500 shadow-md scale-105'
 : 'bg-rose-600 text-white border-rose-600 shadow-md scale-105'
 : 'bg-background hover:bg-slate-100 text-muted-foreground border-border'
 }`}
 >
 {nota}
 </button>
 ))}
 </div>
 </div>

 {/* Comentário e botão enviar */}
 {npsNota !== null && (
 <div className="space-y-3 pt-2 animate-in fade-in">
 <textarea
 rows={2}
 value={npsComentario}
 onChange={(e) => setNpsComentario(e.target.value)}
 placeholder="Conte-nos o motivo da sua nota (opcional)..."
 className="w-full p-3 bg-background border border-border rounded-2xl text-xs text-foreground placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
 />

 <div className="flex justify-end">
 <button
 onClick={handleEnviarNps}
 disabled={npsEnviando}
 className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2 disabled:opacity-50"
 >
 <Send size={14} className={npsEnviando ? "animate-spin" : ""} />
 Enviar Avaliação
 </button>
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 </div>

 <AutoDiagnosticoModal
 isOpen={isDiagnosticoOpen}
 onClose={() => setIsDiagnosticoOpen(false)}
 clienteBairro="Centro Histórico"
 />

 {/* MODAL NOVO CHAMADO */}
 {modalNovoChamado && (
 <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
 <div className="bg-card rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-border animate-in fade-in zoom-in-95">
 <div className="flex items-center justify-between pb-4 border-b border-slate-100">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
 <HeadphonesIcon size={20} />
 </div>
 <div>
 <h3 className="font-bold text-foreground font-outfit text-lg">Novo Chamado Técnico</h3>
 <p className="text-xs text-muted-foreground">Nossa equipe responderá com prioridade.</p>
 </div>
 </div>
 <button 
 onClick={() => setModalNovoChamado(false)}
 className="p-2 text-muted-foreground hover:text-muted-foreground rounded-xl hover:bg-slate-100 transition-colors"
 >
 <X size={18} />
 </button>
 </div>

 <form onSubmit={handleCriarChamado} className="space-y-4 pt-4">
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
 Qual é o motivo do chamado?
 </label>
 <div className="grid grid-cols-2 gap-2 text-xs">
 {[
 'Lentidão na Conexão',
 'Sem Acesso (Sem Sinal)',
 'Problema no Wi-Fi',
 'Dúvida de Fatura',
 'Mudança de Endereço',
 'Outro Suporte'
 ].map(cat => (
 <button
 key={cat}
 type="button"
 onClick={() => setNovoCategoria(cat)}
 className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
 novoCategoria === cat
 ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold shadow-xs'
 : 'bg-background border-border text-muted-foreground hover:bg-slate-100'
 }`}
 >
 {cat}
 </button>
 ))}
 </div>
 </div>

 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
 Descreva o que está acontecendo
 </label>
 <textarea
 rows={3}
 required
 value={novoDescricao}
 onChange={(e) => setNovoDescricao(e.target.value)}
 placeholder="Ex: A luz PON da ONU está piscando em vermelho desde as 14h após chuva forte..."
 className="w-full p-3 bg-background border border-border rounded-2xl text-xs text-foreground placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 resize-none font-medium"
 />
 </div>

 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
 Como prefere receber o retorno?
 </label>
 <div className="grid grid-cols-3 gap-2 text-xs font-medium">
 {(['WhatsApp', 'Telefone', 'Portal'] as const).map(pref => (
 <button
 key={pref}
 type="button"
 onClick={() => setNovoPreferencia(pref)}
 className={`py-2 px-3 rounded-xl border text-center transition-all ${
 novoPreferencia === pref
 ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-bold'
 : 'bg-background border-border text-muted-foreground hover:bg-slate-100'
 }`}
 >
 {pref}
 </button>
 ))}
 </div>
 </div>

 <div className="flex items-start gap-3 p-3 bg-background border border-border rounded-xl">
 <input
 type="checkbox"
 id="enviarGps"
 checked={enviarGps}
 onChange={(e) => setEnviarGps(e.target.checked)}
 className="mt-0.5 w-4 h-4 text-blue-600 bg-card border-border rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
 />
 <label htmlFor="enviarGps" className="text-[11px] font-medium text-muted-foreground cursor-pointer flex-1 leading-tight">
 <span className="font-bold text-foreground block mb-0.5">Enviar Minha Localização Atual</span>
 Permitir captura do GPS para agilizar a chegada de um técnico ao meu endereço exato, caso necessário.
 </label>
 </div>

 <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-[11px] text-blue-800 flex items-start gap-2">
 <Sparkles size={16} className="text-blue-600 shrink-0 mt-0.5" />
 <span>Nossa IA de Triagem analisará os parâmetros da sua fibra para acelerar o diagnóstico antes do contato humano.</span>
 </div>

 <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
 <button
 type="button"
 onClick={() => setModalNovoChamado(false)}
 className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground font-bold text-xs hover:bg-background"
 >
 Cancelar
 </button>
 <button
 type="submit"
 disabled={criandoChamado}
 className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
 >
 {criandoChamado ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
 Registrar Chamado
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* MODAL DETALHES DO CHAMADO */}
 {chamadoSelecionado && (
 <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
 <div className="bg-card rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-border animate-in fade-in zoom-in-95 space-y-4">
 <div className="flex items-center justify-between pb-3 border-b border-slate-100">
 <div>
 <div className="flex items-center gap-2">
 <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
 Protocolo #{chamadoSelecionado.id}
 </span>
 <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
 chamadoSelecionado.estagio === 'Resolvido' 
 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
 : 'bg-blue-50 text-blue-700 border border-blue-200'
 }`}>
 {chamadoSelecionado.estagio}
 </span>
 </div>
 <h3 className="font-bold text-foreground font-outfit text-lg mt-1">{chamadoSelecionado.titulo}</h3>
 </div>
 <button 
 onClick={() => setChamadoSelecionado(null)}
 className="p-2 text-muted-foreground hover:text-muted-foreground rounded-xl hover:bg-slate-100 transition-colors"
 >
 <X size={18} />
 </button>
 </div>

 <div className="space-y-3 text-xs">
 <div className="bg-background p-3.5 rounded-2xl border border-border space-y-1">
 <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">Histórico / Descrição Registrada</span>
 <p className="text-muted-foreground leading-relaxed font-medium">
 {chamadoSelecionado.contexto_ia || "Solicitação de suporte técnico recebida e em análise pelo NOC e equipe N1."}
 </p>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div className="bg-background p-3 rounded-2xl border border-border">
 <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">Abertura</span>
 <p className="font-bold text-foreground mt-0.5">{chamadoSelecionado.criado_em || 'Hoje'}</p>
 </div>
 <div className="bg-background p-3 rounded-2xl border border-border">
 <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">Previsão SLA</span>
 <p className="font-bold text-emerald-600 mt-0.5">Até 4 horas úteis</p>
 </div>
 </div>

 <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-emerald-900 flex items-center gap-2.5">
 <UserCheck size={18} className="text-emerald-600 shrink-0" />
 <span className="text-[11px] font-medium">
 Um técnico responsável foi notificado e entrará em contato caso seja necessária intervenção presencial.
 </span>
 </div>
 </div>

 <div className="flex justify-between items-center pt-3 border-t border-slate-100">
 <button
 onClick={() => {
 setChamadoSelecionado(null);
 const widget = document.querySelector('.webchat-widget-toggle') as HTMLButtonElement;
 if (widget) widget.click();
 }}
 className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1.5"
 >
 <MessageSquare size={14} /> Falar no Chat com o Técnico
 </button>
 <button
 onClick={() => setChamadoSelecionado(null)}
 className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-muted-foreground font-bold text-xs"
 >
 Fechar
 </button>
 </div>
 </div>
 </div>
 )}
 {/* MODAL LIGAÇÃO GRATUITA (MaIa) */}
 {modalLigacaoOpen && (
 <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
 <div className="bg-card rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-border animate-in fade-in zoom-in-95 relative overflow-hidden">
 {/* Decoração bg */}
 <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-50 to-white -z-10"></div>
 
 <button 
 onClick={() => setModalLigacaoOpen(false)}
 className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-muted-foreground rounded-xl hover:bg-slate-100 transition-colors"
 >
 <X size={18} />
 </button>

 <div className="flex flex-col items-center text-center mt-2">
 <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 relative shadow-sm border border-blue-200">
 <Bot size={32} />
 <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
 </div>
 <h3 className="text-xl font-bold font-outfit text-foreground mb-1">Olá! Sou a MaIa</h3>
 <p className="text-sm text-muted-foreground mb-6 px-4">
 Para eu direcionar sua ligação gratuita ao especialista mais rápido, qual o motivo do seu contato?
 </p>
 </div>

 <div className="space-y-2 mb-6">
 {[
 { label: 'Suporte Técnico (Internet Lenta/Caindo)', val: 'suporte' },
 { label: 'Financeiro (Faturas, 2ª via, PIX)', val: 'financeiro' },
 { label: 'Vendas e Novos Planos', val: 'vendas' },
 { label: 'Outros Assuntos', val: 'outros' }
 ].map(opt => (
 <button
 key={opt.val}
 onClick={() => setLigacaoMotivo(opt.val)}
 className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
 ligacaoMotivo === opt.val 
 ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' 
 : 'bg-card border-border text-muted-foreground hover:bg-background'
 }`}
 >
 {opt.label}
 </button>
 ))}
 </div>

 <button
 disabled={!ligacaoMotivo}
 onClick={() => {
 setModalLigacaoOpen(false);
 setShowWebphoneModal(true);
 }}
 className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-muted-foreground text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
 >
 <PhoneCall size={18} /> Ligar Agora
 </button>
 </div>
 </div>
 )}

 {/* MODAL WEBPHONE EMBARCADO */}
 {showWebphoneModal && (
 <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
 <div className="w-full max-w-sm mb-4">
 <Webphone 
 embedded={true} 
 defaultExtension="9999" 
 clientMode={true}
 incomingCallData={{
 nome: clientData.nome || 'Cliente Portal',
 cpf: '123.456.789-00',
 motivo: ligacaoMotivo === 'suporte' ? 'Suporte Técnico' : 
 ligacaoMotivo === 'financeiro' ? 'Financeiro' : 
 ligacaoMotivo === 'vendas' ? 'Vendas' : 'Atendimento'
 }}
 />
 </div>
 <button
 onClick={() => setShowWebphoneModal(false)}
 className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-foreground font-medium text-sm transition-all"
 >
 Fechar Ligação
 </button>
 </div>
 )}
 </div>
 );
}
