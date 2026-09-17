import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Headphones, RotateCcw, Sparkles, CheckCircle2 } from 'lucide-react';

export default function WebchatWidget() {
 const [isOpen, setIsOpen] = useState(false);
 const [isHandoff, setIsHandoff] = useState(false);
 
 // Obter contexto do assinante logado no Portal PWA
 const authData = localStorage.getItem('@nap_client_auth');
 const isProspect = !authData;
 const clientData = authData ? JSON.parse(authData) : { nome: "Visitante", telefone: "PROSPECT-" + Math.floor(Math.random()*10000) };
 const clientNome = isProspect ? "Visitante" : (clientData.nome || "Assinante");
 const clientTelefone = clientData.telefone || "5511999998888";

 const [messages, setMessages] = useState<{id: number, text: string, sender: 'user' | 'ia' | 'sistema'}[]>([
 { 
 id: 1, 
 text: isProspect 
 ? "Olá! Sou a MaIA, assistente virtual da DJD Telecom! Que ótimo ter você por aqui. Quer conhecer nossos planos com Wi-Fi 6 ou precisa falar com a equipe de vendas?" 
 : `Olá, ${clientNome}! Sou a MaIA, assistente virtual 24h do seu provedor. Posso ajudar com faturas, PIX, teste de conexão ou transferir para um atendente humano a qualquer momento. Como posso ajudar?`, 
 sender: 'ia' 
 }
 ]);
 const [inputValue, setInputValue] = useState('');
 const [isTyping, setIsTyping] = useState(false);
 const messagesEndRef = useRef<HTMLDivElement>(null);

 const scrollToBottom = () => {
 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 };

 useEffect(() => {
 scrollToBottom();
 }, [messages, isTyping, isOpen]);

 const sendQuery = async (texto: string) => {
 if (!texto.trim()) return;

 setMessages(prev => [...prev, { id: Date.now(), text: texto, sender: 'user' }]);
 setIsTyping(true);

 try {
 const endpoint = isProspect ? '/api/webchat/lead' : '/api/webchat/send';
 const res = await fetch(endpoint, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ 
 telefone: clientTelefone,
 nome: clientNome,
 texto,
 mensagem: texto
 })
 });
 const data = await res.json();
 
 if (data.handoff || isProspect) {
 setIsHandoff(true);
 }

 setMessages(prev => [...prev, { 
 id: Date.now() + 1, 
 text: data.resposta || (isProspect ? 'Sua solicitação foi encaminhada para a nossa equipe comercial. Em instantes um consultor humano vai assumir o chat!' : 'Recebemos sua mensagem! Nossa equipe já está acompanhando.'), 
 sender: (data.handoff || isProspect) ? 'sistema' : 'ia' 
 }]);
 } catch {
 setMessages(prev => [...prev, { id: Date.now() + 1, text: 'Serviço temporariamente indisponível. Tente novamente em instantes.', sender: 'ia' }]);
 } finally {
 setIsTyping(false);
 }
 };

 const handleSend = (e?: React.FormEvent) => {
 e?.preventDefault();
 if (!inputValue.trim()) return;
 const txt = inputValue;
 setInputValue('');
 sendQuery(txt);
 };

 const retomarMaIA = () => {
 setIsHandoff(false);
 setMessages(prev => [
 ...prev,
 {
 id: Date.now(),
 text: "✨ Atendimento devolvido à MaIA. Estou pronta para continuar seu atendimento 24h!",
 sender: 'ia'
 }
 ]);
 };

 return (
 <>
 {/* Floating Button */}
 {!isOpen && (
 <button
 onClick={() => setIsOpen(true)}
 className="webchat-widget-toggle fixed bottom-20 md:bottom-6 right-4 md:right-6 w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#128C7E] hover:scale-105 transition-all z-50 group"
 title="Atendimento 24h com MaIA ou Humano"
 >
 <MessageCircle size={28} />
 <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full animate-ping"></span>
 </button>
 )}

 {/* Chat Window */}
 {isOpen && (
 <div className="fixed bottom-0 md:bottom-6 right-0 md:right-6 w-full md:w-[390px] h-[90vh] md:h-[620px] bg-[#efeae2] md:rounded-2xl border border-border shadow-2xl flex flex-col z-50 overflow-hidden transition-all">
 {/* Header */}
 <div className={`p-4 flex justify-between items-center shrink-0 transition-colors ${
 isHandoff ? 'bg-amber-600 text-white' : 'bg-[#00a884] text-white'
 }`}>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
 {isHandoff ? <Headphones size={22} className="text-foreground" /> : <Bot size={22} className="text-foreground" />}
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h3 className="font-bold text-sm">
 {isHandoff ? 'Atendimento Humano' : 'MaIA - Suporte 24h'}
 </h3>
 <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded font-semibold">
 {isHandoff ? 'FILA HUMANA' : 'ONLINE'}
 </span>
 </div>
 <p className="text-[10px] text-foreground/80">
 {isHandoff ? 'Operador notificado no Inbox Unificado' : 'Inteligência Artificial & Transbordo Humano'}
 </p>
 </div>
 </div>
 <div className="flex gap-2">
 <button 
 onClick={() => setIsOpen(false)} 
 className="p-1.5 text-foreground hover:bg-accent rounded-full transition-colors"
 title="Fechar"
 >
 <X size={20} />
 </button>
 </div>
 </div>

 {/* Banner de Estado Handoff */}
 {isHandoff && (
 <div className="bg-amber-100 border-b border-amber-200 px-3 py-2 flex items-center justify-between gap-2 text-xs text-amber-900 shrink-0">
 <div className="flex items-center gap-1.5 font-medium truncate">
 <User size={14} className="text-amber-700 shrink-0" />
 <span className="truncate">Você solicitou atendimento humano</span>
 </div>
 <button 
 onClick={retomarMaIA}
 className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold px-2 py-0.5 rounded transition-all flex items-center gap-1 shrink-0"
 title="Voltar para a IA"
 >
 <RotateCcw size={11} /> Voltar p/ MaIA
 </button>
 </div>
 )}

 {/* Messages */}
 <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 relative z-0">
 <div 
 className="absolute inset-0 pointer-events-none -z-10"
 style={{ 
 backgroundImage: 'url("https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png")',
 backgroundRepeat: 'repeat',
 backgroundSize: '400px',
 opacity: 0.08
 }}
 />
 
 {messages.map((msg) => (
 <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
 <div className={`max-w-[85%] rounded-xl p-3 text-[13.5px] shadow-sm ${
 msg.sender === 'user' 
 ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-none' 
 : msg.sender === 'sistema'
 ? 'bg-amber-50 text-amber-900 border border-amber-200 rounded-tl-none font-medium'
 : 'bg-card text-[#111b21] rounded-tl-none'
 }`}>
 <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
 <span className="block text-right text-[10px] text-muted-foreground mt-1">
 {msg.sender === 'user' ? 'Você' : msg.sender === 'sistema' ? 'Sistema / Transbordo' : 'MaIA 24h'}
 </span>
 </div>
 </div>
 ))}
 
 {isTyping && (
 <div className="flex justify-start">
 <div className="bg-card rounded-xl rounded-tl-none p-3 shadow-sm flex gap-1.5 items-center">
 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
 <span className="text-xs text-muted-foreground ml-1 font-medium">
 {isHandoff ? 'Aguardando operador...' : 'MaIA digitando...'}
 </span>
 </div>
 </div>
 )}
 <div ref={messagesEndRef} />
 </div>

 {/* Chips de Ação Rápida */}
 <div className="px-3 py-1.5 bg-[#f0f2f5] border-t border-border/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
 {!isHandoff && (
 <button 
 onClick={() => sendQuery("Gostaria de falar com um atendente humano")}
 className="text-[11px] font-bold text-muted-foreground bg-card hover:bg-slate-100 border border-border rounded-full px-2.5 py-1 transition-all shrink-0 flex items-center gap-1 shadow-2xs"
 >
 <Headphones size={12} className="text-blue-600" /> Falar com Humano
 </button>
 )}
 {isProspect ? (
 <>
 <button 
 onClick={() => sendQuery("Quero assinar a DJD Telecom! Tenho interesse.")}
 className="text-[11px] font-bold text-muted-foreground bg-card hover:bg-slate-100 border border-border rounded-full px-2.5 py-1 transition-all shrink-0 shadow-2xs"
 >
 ✨ Quero Assinar
 </button>
 <button 
 onClick={() => sendQuery("Quais os planos de internet disponíveis?")}
 className="text-[11px] font-bold text-muted-foreground bg-card hover:bg-slate-100 border border-border rounded-full px-2.5 py-1 transition-all shrink-0 shadow-2xs"
 >
 🚀 Ver Planos
 </button>
 </>
 ) : (
 <>
 <button 
 onClick={() => sendQuery("Preciso da 2ª via da fatura e chave PIX")}
 className="text-[11px] font-bold text-muted-foreground bg-card hover:bg-slate-100 border border-border rounded-full px-2.5 py-1 transition-all shrink-0 shadow-2xs"
 >
 💳 Fatura & PIX
 </button>
 <button 
 onClick={() => sendQuery("Como está o sinal da minha fibra ótica?")}
 className="text-[11px] font-bold text-muted-foreground bg-card hover:bg-slate-100 border border-border rounded-full px-2.5 py-1 transition-all shrink-0 shadow-2xs"
 >
 📶 Sinal da Fibra
 </button>
 </>
 )}
 </div>

 {/* Input Area */}
 <form onSubmit={handleSend} className="p-3 bg-[#f0f2f5] shrink-0">
 <div className="flex items-center gap-2">
 <input
 type="text"
 value={inputValue}
 onChange={(e) => setInputValue(e.target.value)}
 placeholder={isHandoff ? "Mensagem para o atendente..." : "Pergunte à MaIA..."}
 className="flex-1 bg-card border border-border focus:border-emerald-500 outline-none rounded-full px-4 py-2.5 text-[13.5px] text-[#111b21] placeholder:text-[#8696a0] transition-all shadow-2xs"
 />
 <button 
 type="submit"
 disabled={!inputValue.trim() || isTyping}
 className={`w-10 h-10 rounded-full flex items-center justify-center text-foreground disabled:opacity-50 transition-all shrink-0 shadow-sm ${
 isHandoff ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#00a884] hover:bg-[#008f6f]'
 }`}
 >
 <Send size={16} className="ml-0.5" />
 </button>
 </div>
 <div className="text-center mt-2 pb-0.5">
 <span className="text-[10px] text-[#8696a0] font-medium flex items-center justify-center gap-1">
 <Sparkles size={11} className="text-emerald-600" /> Atendimento Inteligente 24h & Transbordo Humano
 </span>
 </div>
 </form>
 </div>
 )}
 </>
 );
}
