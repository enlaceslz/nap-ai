import React, { useState, useEffect, useRef } from 'react';
import { Tooltip } from '../components/Tooltip';
import { 
 Search, Send, User, Phone, Zap, MessageCircle, MonitorSmartphone, 
 ArrowLeft, CheckCheck, Clock, ShieldCheck, Lock, Sparkles, 
 ChevronRight, Copy, Check, RefreshCw, AlertTriangle, 
 Wifi, CreditCard, Layers, CheckCircle, FileText, CornerDownLeft,
 Paperclip, Mic, Play, Pause, X, UserCheck, Inbox as InboxIcon,
 MapPin, Share2, Navigation, Bot, Smartphone, TrendingUp, ExternalLink
} from 'lucide-react';
import type { Conversa, Mensagem } from '../types';
import AddressMapModal from '../components/AddressMapModal';

interface ExtendedConversa extends Conversa {
 nome_cliente: string;
 telefone: string;
 cpf: string;
 plano: string;
 protocolo: string;
 tempo_espera: string;
 fila: string;
 pilar_negocio: 'suporte' | 'cobranca' | 'vendas';
 endereco?: string;
 logradouro?: string;
 numero?: string;
 complemento?: string;
 bairro?: string;
 cidade?: string;
 uf?: string;
 cep?: string;
 ponto_referencia?: string;
 coordenadas?: {
 lat: number;
 lng: number;
 };
 status_conexao: {
 status: 'online' | 'offline' | 'alerta';
 sinal_onu: string;
 ip: string;
 concentrador: string;
 uptime: string;
 };
 financeiro: {
 valor: number;
 vencimento: string;
 status: 'pendente' | 'pago' | 'atrasado';
 pix_copia_cola: string;
 };
}

const INITIAL_CHATS: ExtendedConversa[] = [
 {
 id: 1,
 canal: 'whatsapp',
 contato_id: 9982,
 nome_cliente: 'Maria Oliveira',
 telefone: '(11) 98765-4321',
 cpf: '123.456.789-00',
 plano: 'Fibra 500MB Simétrico',
 protocolo: 'DJD-2026-0909-481',
 tempo_espera: '1m 20s',
 fila: 'Suporte Técnico N1',
 pilar_negocio: 'suporte',
 status: 'aberta',
 prioridade: 1,
 endereco: 'Rua das Flores, 123 - Centro Histórico, São Paulo/SP',
 logradouro: 'Rua das Flores',
 numero: '123',
 complemento: 'Apto 34B',
 bairro: 'Centro Histórico',
 cidade: 'São Paulo',
 uf: 'SP',
 cep: '01001-000',
 ponto_referencia: 'Ao lado da Estação Sé / Prédio Azul',
 coordenadas: {
 lat: -23.5489,
 lng: -46.6388
 },
 status_conexao: {
 status: 'online',
 sinal_onu: '-19.4 dBm (Ótimo)',
 ip: '177.45.2.19',
 concentrador: 'MikroTik-Core-01',
 uptime: '15d 2h 45m'
 },
 financeiro: {
 valor: 99.90,
 vencimento: '2026-09-10',
 status: 'pendente',
 pix_copia_cola: '00020126580014br.gov.bcb.pix0136nap-provedor-fibra-9982-fatura520400005303986540599.905802BR5913DJD PROVEDOR6009SAO PAULO62070503***6304E8A1'
 },
 mensagens: [
 { id: 1, conversa_id: 1, autor_tipo: 'cliente', conteudo: 'Olá, bom dia! Notei uma pequena oscilação na velocidade da internet aqui em casa.', enviada_em: '10:00', status: 'lido' },
 { id: 2, conversa_id: 1, autor_tipo: 'ia', conteudo: 'Olá, Maria! Verifiquei sua ONU no sistema SGP: o sinal óptico está em -19.4 dBm (excelente) e a sessão PPPoE está ativa há 15 dias. Como posso te auxiliar no diagnóstico?', enviada_em: '10:01', status: 'lido' },
 { id: 3, conversa_id: 1, autor_tipo: 'operador', tipo: 'nota_interna', conteudo: 'Cliente ligou ontem com o mesmo sintoma. Roteador dela é Wi-Fi 5 dual-band no canal 36.', enviada_em: '10:02' },
 { id: 4, conversa_id: 1, autor_tipo: 'cliente', conteudo: 'Estou usando o Wi-Fi no quarto do fundo. Poderia verificar se o roteador precisa ser reiniciado?', enviada_em: '10:03', status: 'entregue' }
 ]
 },
 {
 id: 2,
 canal: 'whatsapp',
 contato_id: 9985,
 nome_cliente: 'Carlos Eduardo Silva',
 telefone: '(11) 97654-3210',
 cpf: '234.567.890-11',
 plano: 'Fibra 300MB Residencial',
 protocolo: 'DJD-2026-0909-512',
 tempo_espera: '4m 50s',
 fila: 'Financeiro & Cobrança',
 pilar_negocio: 'cobranca',
 status: 'aberta',
 prioridade: 2,
 endereco: 'Rua das Acácias, 412 - Jardim Primavera, São Paulo/SP',
 logradouro: 'Rua das Acácias',
 numero: '412',
 complemento: 'Casa',
 bairro: 'Jardim Primavera',
 cidade: 'São Paulo',
 uf: 'SP',
 cep: '04856-200',
 ponto_referencia: 'Próximo à Padaria Flor da Primavera / Em frente à CTO-12',
 coordenadas: {
 lat: -23.7083,
 lng: -46.6852
 },
 status_conexao: {
 status: 'alerta',
 sinal_onu: '-27.8 dBm (Atenuação Alta)',
 ip: '177.45.18.90',
 concentrador: 'MikroTik-Sul-02',
 uptime: '2d 11h'
 },
 financeiro: {
 valor: 89.90,
 vencimento: '2026-09-05',
 status: 'atrasado',
 pix_copia_cola: '00020126580014br.gov.bcb.pix0136nap-provedor-fibra-9985-fatura520400005303986540589.905802BR5913DJD PROVEDOR6009SAO PAULO62070503***6304C7B2'
 },
 mensagens: [
 { id: 5, conversa_id: 2, autor_tipo: 'cliente', conteudo: 'Bom dia! Gostaria de pagar minha mensalidade via PIX, pode me mandar a chave copia e cola?', enviada_em: '09:45', status: 'lido' },
 { id: 6, conversa_id: 2, autor_tipo: 'ia', conteudo: 'Com certeza, Carlos! Estou localizando sua fatura com vencimento em 05/09.', enviada_em: '09:46', status: 'lido' }
 ]
 },
 {
 id: 3,
 canal: 'webchat',
 contato_id: 9990,
 nome_cliente: 'Fernanda Costa',
 telefone: '(11) 96543-2109',
 cpf: '345.678.901-22',
 plano: 'Fibra 1GB Gamer / Pro',
 protocolo: 'DJD-2026-0909-530',
 tempo_espera: '0m 45s',
 fila: 'Vendas & Upgrades',
 pilar_negocio: 'vendas',
 status: 'aberta',
 prioridade: 3,
 endereco: 'Av. Paulista, 1800, Conj 41 - Bela Vista, São Paulo/SP',
 logradouro: 'Avenida Paulista',
 numero: '1800',
 complemento: 'Conjunto 41',
 bairro: 'Bela Vista',
 cidade: 'São Paulo',
 uf: 'SP',
 cep: '01310-200',
 ponto_referencia: 'Próximo ao MASP / Torre Sul',
 coordenadas: {
 lat: -23.5614,
 lng: -46.6559
 },
 status_conexao: {
 status: 'online',
 sinal_onu: '-18.1 dBm (Excelente)',
 ip: '177.45.100.4',
 concentrador: 'MikroTik-Core-01',
 uptime: '42d 8h'
 },
 financeiro: {
 valor: 149.90,
 vencimento: '2026-09-20',
 status: 'pago',
 pix_copia_cola: '00020126580014br.gov.bcb.pix0136nap-provedor-fibra-9990'
 },
 mensagens: [
 { id: 7, conversa_id: 3, autor_tipo: 'cliente', conteudo: 'Olá, gostaria de saber se é possível fazer o upgrade para o roteador Wi-Fi 6 Mesh.', enviada_em: '10:04', status: 'lido' },
 { id: 8, conversa_id: 3, autor_tipo: 'ia', conteudo: 'Olá Fernanda! Claro que sim. Como você já é assinante do plano 1GB Gamer, a troca para o roteador Wi-Fi 6 Mesh tem custo de apenas R$ 49,90 na próxima fatura. Deseja confirmar o upgrade e o agendamento da visita técnica?', enviada_em: '10:05', status: 'entregue' }
 ]
 },
 {
 id: 4,
 canal: 'whatsapp',
 contato_id: 9999,
 nome_cliente: 'João Cliente (Teste IA)',
 telefone: '(11) 91111-2222',
 cpf: '111.222.333-44',
 plano: 'Fibra 500MB',
 protocolo: 'DJD-2026-0910-999',
 tempo_espera: 'Ao vivo',
 fila: 'Triagem IA',
 pilar_negocio: 'suporte',
 status: 'triagem_ia',
 prioridade: 1,
 endereco: 'Rua de Teste, 100',
 status_conexao: {
 status: 'online',
 sinal_onu: '-20.1 dBm (Bom)',
 ip: '177.45.1.10',
 concentrador: 'MikroTik-Teste',
 uptime: '2d 4h'
 },
 financeiro: {
 valor: 99.90,
 vencimento: '2026-09-10',
 status: 'pendente',
 pix_copia_cola: '000201...'
 },
 mensagens: [
 { id: 10, conversa_id: 4, autor_tipo: 'ia', conteudo: 'Olá João! Sou o MaIA do DJD Telecom. Identifiquei seu contrato, como posso ajudar hoje?', enviada_em: '10:15', status: 'entregue' }
 ]
 }
];

export default function Inbox() {
 const [chats, setChats] = useState<ExtendedConversa[]>(INITIAL_CHATS);
 const [activeChatId, setActiveChatId] = useState<number | null>(() => {
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
   return null;
  }
  return 1;
 });
 const [filterQueue, setFilterQueue] = useState<'todos' | 'meus' | 'fila_geral' | 'triagem_ia' | 'finalizados'>('todos');
 const [searchQuery, setSearchQuery] = useState('');

 useEffect(() => {
 const fetchChats = async () => {
 try {
 const res = await fetch('/api/waba/chats-full');
 if (res.ok) {
 const data = await res.json();
 if (data && data.length > 0) {
 const merged = data.map((bChat: any) => {
 const base = INITIAL_CHATS.find(c => c.telefone === bChat.telefone || c.id === bChat.id);
 return {
 ...base,
 ...bChat,
 id: bChat.id,
 canal: bChat.canal || (base ? base.canal : 'whatsapp'),
 contato_id: bChat.contato_id || bChat.contatoId || bChat.id,
 nome_cliente: bChat.nome_cliente || bChat.nomeCliente || (base ? base.nome_cliente : 'Novo Cliente'),
 telefone: bChat.telefone || (base ? base.telefone : ''),
 cpf: base ? base.cpf : '000.000.000-00',
 plano: base ? base.plano : 'Fibra 500MB',
 protocolo: base ? base.protocolo : `DJD-${new Date().getFullYear()}-${bChat.id}`,
 tempo_espera: base ? base.tempo_espera : 'Recente',
 fila: bChat.fila || (base ? base.fila : 'triagem_ia'),
 pilar_negocio: base ? base.pilar_negocio : 'suporte',
 status: bChat.status || 'aberta',
 prioridade: base ? base.prioridade : 2,
 endereco: base ? base.endereco : 'Rua das Flores, 123 - Centro',
 coordenadas: base ? base.coordenadas : undefined,
 status_conexao: base ? base.status_conexao : {
 status: 'online',
 sinal_onu: '-19.4 dBm (Ótimo)',
 ip: '177.45.2.19',
 concentrador: 'MikroTik-Core-01',
 uptime: '15d 2h'
 },
 financeiro: base ? base.financeiro : {
 valor: 99.90,
 vencimento: '2026-09-10',
 status: 'pendente',
 pix_copia_cola: '00020126580014BR.GOV.BCB.PIX...'
 },
 mensagens: bChat.mensagens && bChat.mensagens.length > 0 ? bChat.mensagens : (base ? base.mensagens : [])
 };
 });
 
 // Add remaining INITIAL_CHATS that aren't in backend
 INITIAL_CHATS.forEach(ic => {
 if (!merged.find((m:any) => m.telefone === ic.telefone || m.id === ic.id)) {
 merged.push(ic);
 }
 });
 
 setChats(merged);
 }
 }
 } catch (e) {
 console.warn('[Fallback] Utilizando dados em memória para conversas WABA');
 }
 };
 
 fetchChats();
 const interval = setInterval(fetchChats, 4000);
 return () => clearInterval(interval);
 }, []);

 
 // Painel Lateral 360 / SGP no chat
 const [isSgpDrawerOpen, setIsSgpDrawerOpen] = useState(window.innerWidth >= 1024);
 const [mapModalOpen, setMapModalOpen] = useState(false);

 // Composer
 const [messageText, setMessageText] = useState('');
 const [isInternalNote, setIsInternalNote] = useState(false);
 const [copiedPix, setCopiedPix] = useState(false);
 const [toastMessage, setToastMessage] = useState<string | null>(null);
 
 // Gemini Copilot
 const [isGeneratingCopilot, setIsGeneratingCopilot] = useState(false);
 const [copilotSuccess, setCopilotSuccess] = useState(false);

 // Modal de Tabulação / Finalizar
 const [isTabulating, setIsTabulating] = useState(false);
 const [isAutoTabulating, setIsAutoTabulating] = useState(false);
 const [tabulationData, setTabulationData] = useState({
 categoria: 'Suporte Técnico',
 motivo: 'Lentidão / Wi-Fi',
 resolucao: 'Orientações de posicionamento do roteador e teste no canal 5GHz.',
 enviarPesquisaNps: true
 });

 const chatEndRef = useRef<HTMLDivElement | null>(null);

 // Macros dinâmicas sincronizadas com o SuperAdmin
 const [macros, setMacros] = useState<any[]>([
 { id: '1', atalho: '/pix', conteudo: 'Aqui está sua chave PIX para pagamento: {chave_pix}. A baixa no sistema é imediata!' },
 { id: '2', atalho: '/reset_onu', conteudo: 'Por favor, desligue o roteador e a ONU da tomada por 30 segundos e ligue novamente. Aguarde os leds PON e Internet estabilizarem.' },
 { id: '3', atalho: '/desbloqueio', conteudo: 'Seu sinal de internet foi liberado provisoriamente por 24 horas em confiança! O comprovante pode ser enviado por aqui.' },
 { id: '4', atalho: '/visita_tecnica', conteudo: 'Ordem de serviço aberta com sucesso. Nossa equipe técnica entrará em contato para alinhar o turno de visita.' }
 ]);

 useEffect(() => {
 async function loadMacros() {
 try {
 const res = await fetch('/api/configuracoes');
 if (res.ok) {
 const data = await res.json();
 if (data.config?.respostasRapidas && Array.isArray(data.config.respostasRapidas) && data.config.respostasRapidas.length > 0) {
 setMacros(data.config.respostasRapidas);
 }
 }
 } catch (e) {
 // fallback to defaults
 }
 }
 loadMacros();
 }, []);

 const applyMacro = (macro: any) => {
 if (!activeChat) return;
 let text = macro.conteudo || '';
 text = text.replace(/\{chave_pix\}/g, activeChat.financeiro?.pix_copia_cola || '00020126580014br.gov.bcb.pix...');
 text = text.replace(/\{nome_cliente\}/g, activeChat.nome_cliente || '');
 text = text.replace(/\{protocolo\}/g, activeChat.protocolo || '');
 text = text.replace(/\{valor\}/g, activeChat.financeiro?.valor ? `R$ ${activeChat.financeiro.valor.toFixed(2)}` : '');
 text = text.replace(/\{sinal_optico\}/g, activeChat.status_conexao?.sinal_onu || '-19 dBm');
 text = text.replace(/\{nome_provedor\}/g, 'DJD Telecom Fibra');
 setMessageText(text);
 };

 // Conversa ativa
 const activeChat = chats.find(c => c.id === activeChatId) || null;

 // Auto-selecionar conversa válida se a atual não existir (apenas quando activeChatId !== null)
 useEffect(() => {
  if (activeChatId !== null && chats.length > 0) {
   const exists = chats.some(c => c.id === activeChatId);
   if (!exists) {
    setActiveChatId(chats[0].id);
   }
  }
 }, [chats, activeChatId]);

 // Rolar para o final ao mudar ou enviar mensagens
 useEffect(() => {
 chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 }, [activeChat?.mensagens?.length, activeChatId]);

 // Exibir toast temporário
 const showToast = (msg: string) => {
 setToastMessage(msg);
 setTimeout(() => setToastMessage(null), 3000);
 };

 // Filtragem de fila segura
 const filteredChats = chats.filter(chat => {
 const term = searchQuery.toLowerCase().trim();
 const nome = (chat.nome_cliente || '').toLowerCase();
 const prot = (chat.protocolo || '').toLowerCase();
 const cpf = (chat.cpf || '');
 const tel = (chat.telefone || '');
 const matchesSearch = !term || nome.includes(term) || prot.includes(term) || cpf.includes(term) || tel.includes(term);

 if (!matchesSearch) return false;

 if (filterQueue === 'todos') {
 return true;
 }
 if (filterQueue === 'meus') {
 return chat.status === 'aberta' && chat.id !== 3;
 }
 if (filterQueue === 'fila_geral') {
 return chat.status === 'aberta' && chat.id === 3;
 }
 if (filterQueue === 'triagem_ia') {
 return chat.status === 'triagem_ia';
 }
 if (filterQueue === 'finalizados') {
 return chat.status === 'fechada';
 }
 return true;
 });

 // Enviar Mensagem Real (ou simular resposta do Gemini em triagem)
 const handleSendMessage = async () => {
 if (!messageText.trim() || !activeChat) return;

 const now = new Date();
 const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

 // Se estiver em modo Triagem IA, o texto digitado finge ser do Cliente
 const isModoTriagem = activeChat.status === 'triagem_ia';
 const textMsg = messageText.trim();
 setMessageText('');

 const newMsg: Mensagem = {
 id: Date.now(),
 conversa_id: activeChat.id,
 autor_tipo: isModoTriagem ? 'cliente' : 'operador',
 tipo: isModoTriagem ? 'texto' : (isInternalNote ? 'nota_interna' : 'texto'),
 conteudo: textMsg,
 enviada_em: timeStr,
 status: 'enviado'
 };

 setChats(prev => prev.map(c => {
 if (c.id === activeChat.id) {
 return { ...c, mensagens: [...c.mensagens, newMsg] };
 }
 return c;
 }));

 if (isModoTriagem) {
 // Simula a Engine Gemini respondendo
 try {
 const res = await fetch('/api/gemini/agent/run', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ prompt: textMsg, cliente_cpf: activeChat.cpf })
 });
 const data = await res.json();
 
 const aiReply: Mensagem = {
 id: Date.now() + 1,
 conversa_id: activeChat.id,
 autor_tipo: 'ia',
 conteudo: data.resposta || 'Atendimento processado com sucesso.',
 enviada_em: timeStr,
 status: 'entregue'
 };

 setChats(prev => prev.map(c => {
 if (c.id === activeChat.id) {
 return { ...c, mensagens: [...c.mensagens, aiReply] };
 }
 return c;
 }));
 } catch (e) {
 // Fallback local se API falhar
 const fallbackMsg: Mensagem = {
 id: Date.now() + 1,
 conversa_id: activeChat.id,
 autor_tipo: 'ia',
 conteudo: 'Desculpe, houve um erro ao consultar o Cérebro IA.',
 enviada_em: timeStr,
 status: 'entregue'
 };
 setChats(prev => prev.map(c => {
 if (c.id === activeChat.id) {
 return { ...c, mensagens: [...c.mensagens, fallbackMsg] };
 }
 return c;
 }));
 }
 return;
 }

 // Se for mensagem pública de Operador, simula resposta do cliente após 2 segundos
 if (!isInternalNote) {
 setTimeout(() => {
 const clientReply: Mensagem = {
 id: Date.now() + 1,
 conversa_id: activeChat.id,
 autor_tipo: 'cliente',
 conteudo: 'Perfeito! Fiz o procedimento e a velocidade já normalizou aqui. Muito obrigada!',
 enviada_em: timeStr,
 status: 'entregue'
 };

 setChats(prev => prev.map(c => {
 if (c.id === activeChat.id) {
 return {
 ...c,
 mensagens: [...c.mensagens, clientReply]
 };
 }
 return c;
 }));
 }, 2000);
 }
 };

 // Puxar da Fila Geral para o Operador
 const handleAssignToMe = (chatId: number) => {
 setChats(prev => prev.map(c => {
 if (c.id === chatId) {
 return { ...c, fila: 'Meu Atendimento' };
 }
 return c;
 }));
 setActiveChatId(chatId);
 setFilterQueue('meus');
 showToast('Chamado atribuído com sucesso para o seu operador!');
 };

 // Assumir Atendimento (Handoff Humano Instantâneo - Pausa a MaIA)
 const handleAssumeChat = async (chatId: number) => {
 const now = new Date();
 const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
 const auditMsg: Mensagem = {
 id: Date.now(),
 conversa_id: chatId,
 autor_tipo: 'operador',
 tipo: 'nota_interna',
 conteudo: '👤 Operador assumiu o atendimento diretamente. MaIA pausada nesta conversa para intervenção humana imediata.',
 enviada_em: timeStr,
 status: 'entregue'
 };

 setChats(prev => prev.map(c => {
 if (c.id === chatId) {
 return {
 ...c,
 status: 'aberta',
 fila: 'Meu Atendimento',
 mensagens: [...c.mensagens, auditMsg]
 };
 }
 return c;
 }));
 setActiveChatId(chatId);
 setFilterQueue('meus');
 setIsSgpDrawerOpen(true);
 
 try {
 const chatAlvo = chats.find(c => c.id === chatId);
 const resp = await fetch('/api/waba/handoff', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ protocolo: chatAlvo?.protocolo || 'N/A', nome: chatAlvo?.nome_cliente || 'Desconhecido', numero: chatAlvo?.telefone, resumo_ia: 'Transferido manualmente' })
 });
 const data = await resp.json();
 if (data.success || data.sucesso) {
 showToast(`Handoff Concluído: Sincronizado com Kanban (${data.dealGerado?.pipeline || 'Suporte'}). MaIA pausada.`);
 } else {
 showToast('👤 Intervenção humana ativada! MaIA pausada nesta conversa.');
 }
 } catch (err) {
 showToast('👤 Intervenção humana ativada! MaIA pausada nesta conversa.');
 }
 };

 // Devolver Atendimento para a MaIA (Automação 24h Reativada)
 const handleDevolverParaMaia = (chatId: number) => {
 const now = new Date();
 const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
 const auditMsg: Mensagem = {
 id: Date.now(),
 conversa_id: chatId,
 autor_tipo: 'ia',
 tipo: 'nota_interna',
 conteudo: '🤖 Atendimento transferido de volta para a automação inteligente da MaIA (24h ativa).',
 enviada_em: timeStr,
 status: 'entregue'
 };

 setChats(prev => prev.map(c => {
 if (c.id === chatId) {
 return {
 ...c,
 status: 'triagem_ia',
 fila: 'Triagem IA (MaIA 24h)',
 mensagens: [...c.mensagens, auditMsg]
 };
 }
 return c;
 }));
 setActiveChatId(chatId);
 setFilterQueue('triagem_ia');
 showToast('🤖 Conversa devolvida com sucesso para a MaIA 24h!');
 };

 // Copiloto Gemini: Sugere resposta inteligente para o operador
 const handleGeminiCopilot = async () => {
 if (!activeChat || isGeneratingCopilot) return;
 setIsGeneratingCopilot(true);

 const lastClientMsg = [...activeChat.mensagens].reverse().find(m => m.autor_tipo === 'cliente')?.conteudo || 'Solicito suporte técnico na minha fibra.';

 try {
 const res = await fetch('/api/gemini/agent/run', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 prompt: `Aja como a MaIA, uma operadora incrivelmente empática, humana e carinhosa. Gere uma resposta acolhedora, natural e não-robótica de ISP para o cliente ${activeChat.nome_cliente} que perguntou: "${lastClientMsg}". Se for sobre sinal, use a informação real de que a ONU dele está em ${activeChat.status_conexao?.sinal_onu || '-19.4 dBm (Ótimo)'} e a conexão dura ${activeChat.status_conexao?.uptime || '15d 2h'}. Seja conciso.`,
 clientContext: {
 nome: activeChat.nome_cliente,
 plano: activeChat.plano,
 sinal_onu: activeChat.status_conexao?.sinal_onu || '-19.4 dBm',
 uptime: activeChat.status_conexao?.uptime || '15d 2h'
 }
 })
 });

 const data = await res.json();
 if (data.resposta) {
 setMessageText(data.resposta);
 setIsInternalNote(false);
 setCopilotSuccess(true);
 setTimeout(() => setCopilotSuccess(false), 2000);
 showToast('Sugestão do Gemini inserida no campo!');
 }
 } catch {
 showToast('Erro ao consultar sugestão da IA.');
 } finally {
 setIsGeneratingCopilot(false);
 }
 };

 // Enviar PIX instantâneo no Chat
 const handleSendPixToChat = () => {
 if (!activeChat) return;
 const pixText = `Olá ${(activeChat.nome_cliente || 'Cliente').split(' ')[0]}! Segue sua chave PIX Copia e Cola para pagamento da mensalidade de R$ ${activeChat.financeiro?.valor ? activeChat.financeiro.valor.toFixed(2) : '99.90'}:\n\n${activeChat.financeiro?.pix_copia_cola || '00020126580014br.gov.bcb.pix...'}\n\nApós o pagamento, a baixa no SGP ocorre automaticamente em até 2 minutos.`;
 setMessageText(pixText);
 setIsInternalNote(false);
 showToast('Chave PIX inserida no campo de resposta!');
 };

 // Desbloqueio em Confiança (Padrão 24h)
 const handleDesbloqueio24h = async () => {
 if (!activeChat) return;
 try {
 const res = await fetch(`/api/erp/desbloqueio-confianca/${activeChat.id}`, { method: 'POST' });
 if (res.ok) {
 const desbloqueioText = `Olá ${activeChat.nome_cliente.split(' ')[0]}! Registramos no SGP o seu Desbloqueio em Confiança válido por 24 horas. Sua conexão já foi liberada no MikroTik.`;
 setMessageText(desbloqueioText);
 setIsInternalNote(false);
 showToast('🔓 Desbloqueio em Confiança (24h) liberado no SGP e Radius!');
 }
 } catch {
 showToast('Erro ao comunicar com o servidor.');
 }
 };

 // Reiniciar ONU / Kick Radius
 const handleKickRadius = async () => {
 if (!activeChat) return;
 try {
 const ip = activeChat.status_conexao?.ip || '177.45.2.19';
			const res = await fetch(`/api/network/kick-radius/${ip}`, { method: 'POST' });
 if (res.ok) {
 showToast(`⚡ Comando Kick Radius (PoD) enviado para ${activeChat.status_conexao?.concentrador || 'MikroTik-Core-01'}. Sessão PPPoE derrubada com sucesso.`);
 }
 } catch {
 showToast('Erro ao tentar derrubar a sessão PPPoE.');
 }
 };

 // Auto-Tabulação Inteligente com Gemini
 const handleAutoTabulateGemini = async () => {
 if (!activeChat || isAutoTabulating) return;
 setIsAutoTabulating(true);

 const historySummary = activeChat.mensagens.map(m => `${m.autor_tipo}: ${m.conteudo}`).join(' | ');

 try {
 const res = await fetch('/api/gemini/agent/run', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 prompt: `Com base no diálogo a seguir de um provedor de internet, resuma a tabulação em formato direto:
Histórico: ${historySummary}
Retorne exatamente no formato:
CATEGORIA: [Suporte Técnico OU Financeiro OU Suporte Avançado N2 OU Vendas & Upgrades OU Retenção / Cancelamento]
MOTIVO: [descrição curta em até 5 palavras]
RESOLUCAO: [resumo da solução dada em 1 ou 2 frases]`
 })
 });

 const data = await res.json();
 const text = data.resposta || '';

 let cat = 'Suporte Técnico';
 if (text.includes('Financeiro')) cat = 'Financeiro';
 else if (text.includes('Avançado N2')) cat = 'Suporte Avançado N2';
 else if (text.includes('Vendas')) cat = 'Vendas & Upgrades';
 else if (text.includes('Retenção')) cat = 'Retenção / Cancelamento';

 // Extrair motivo e resolução
 const motivoMatch = text.match(/MOTIVO:\s*([^\n\r]+)/i);
 const resolucaoMatch = text.match(/RESOLUCAO:\s*([^\n\r]+)/i);

 setTabulationData(prev => ({
 ...prev,
 categoria: cat,
 motivo: motivoMatch ? motivoMatch[1].trim() : (activeChat.plano.includes('500MB') ? 'Diagnóstico de Banda e Sinal Óptico' : 'Atendimento ao Assinante'),
 resolucao: resolucaoMatch ? resolucaoMatch[1].trim() : (data.resposta ? data.resposta.substring(0, 160) : 'Atendimento concluído conforme solicitação do cliente.')
 }));

 showToast('Tabulação gerada automaticamente pelo Gemini!');
 } catch {
 showToast('Não foi possível gerar tabulação automática.');
 } finally {
 setIsAutoTabulating(false);
 }
 };

 // Concluir Tabulação
 const handleFinishTicket = () => {
 if (!activeChat) return;

 if (tabulationData.enviarPesquisaNps) {
 fetch('/api/nps/disparar', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 cliente: activeChat.nome_cliente,
 telefone: activeChat.telefone,
 canal: activeChat.canal === 'whatsapp' ? 'WhatsApp WABA' : activeChat.canal === 'webchat' ? 'Webchat Portal' : 'Telefonia Asterisk',
 ticketId: activeChat.protocolo
 })
 }).catch(() => {});
 }

 setChats(prev => prev.map(c => {
 if (c.id === activeChat.id) {
 return { ...c, status: 'fechada' };
 }
 return c;
 }));
 setIsTabulating(false);
 showToast(`Atendimento #${activeChat.protocolo} tabulado! ${tabulationData.enviarPesquisaNps ? 'Pesquisa NPS enviada.' : ''}`);
 };

 const getPilarBadge = (pilar?: 'suporte' | 'cobranca' | 'vendas') => {
 switch (pilar) {
 case 'cobranca':
 return (
 <span className="flex items-center gap-1 text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded">
 <CreditCard size={10} className="text-amber-600" />
 <span>COBRANÇA</span>
 </span>
 );
 case 'vendas':
 return (
 <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded">
 <Zap size={10} className="text-emerald-600" />
 <span>VENDAS</span>
 </span>
 );
 case 'suporte':
 default:
 return (
 <span className="flex items-center gap-1 text-[9px] font-bold text-blue-800 bg-blue-500/10 border border-blue-300 px-1.5 py-0.5 rounded">
 <Wifi size={10} className="text-blue-400" />
 <span>SUPORTE</span>
 </span>
 );
 }
 };

 const getChannelBadge = (canal: string) => {
 switch (canal) {
 case 'whatsapp':
 return (
 <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
 <MessageCircle size={11} className="text-emerald-600" />
 <span>WABA Oficial</span>
 </span>
 );
 case 'webchat':
 return (
 <span className="flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
 <MonitorSmartphone size={11} className="text-blue-400" />
 <span>Portal PWA</span>
 </span>
 );
 default:
 return (
 <span className="flex items-center gap-1 text-[10px] font-bold text-card-foreground bg-muted/60 border border-border px-2 py-0.5 rounded-full">
 <Phone size={11} className="text-muted-foreground" />
 <span>Voz / Asterisk</span>
 </span>
 );
 }
 };

 return (
 <div className="flex-1 flex h-full bg-background overflow-hidden relative font-sans">
 
 {/* Toast Notifier */}
 {toastMessage && (
 <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-card text-foreground text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 animate-in fade-in-50 zoom-in-95">
 <CheckCircle size={14} className="text-emerald-400" />
 <span>{toastMessage}</span>
 </div>
 )}

 {/* COLUNA 1: Fila & Lista de Conversas Omnichannel */}
 <aside className={`w-full md:w-80 lg:w-96 border-r border-border bg-card flex flex-col z-10 shrink-0 ${
 activeChatId ? 'hidden md:flex' : 'flex'
 }`}>
 
 {/* Header de Filas com Filtros */}
 <div className="p-4 border-b border-border bg-card">
 <div className="flex items-center justify-between mb-3">
 <div>
 <h1 className="font-extrabold text-lg text-foreground font-outfit tracking-tight">
 Inbox Omnichannel
 </h1>
 <p className="text-[11px] text-muted-foreground">Filas WhatsApp WABA & WebChat</p>
 </div>
 <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-1 rounded-lg text-xs font-bold font-mono">
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
 <span>{chats.filter(c => c.status === 'aberta').length} Abertos</span>
 </div>
 </div>

 {/* Abas de Fila */}
 <div className="flex rounded-xl bg-muted/60 p-1 mb-3 text-xs font-semibold text-muted-foreground overflow-x-auto whitespace-nowrap hide-scrollbar gap-1">
 <button
 onClick={() => setFilterQueue('todos')}
 className={`flex-1 min-w-[65px] py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
 filterQueue === 'todos' ? 'bg-card text-foreground font-bold border border-border shadow-xs' : 'hover:text-foreground'
 }`}
 >
 <span>Todos</span>
 <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full font-bold">{chats.length}</span>
 </button>
 <button
 onClick={() => setFilterQueue('meus')}
 className={`flex-1 min-w-[65px] py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
 filterQueue === 'meus' ? 'bg-card text-foreground font-bold border border-border shadow-xs' : 'hover:text-foreground'
 }`}
 >
 <span>Meus</span>
 <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">
 {chats.filter(c => c.status === 'aberta' && c.id !== 3).length}
 </span>
 </button>
 <button
 onClick={() => setFilterQueue('fila_geral')}
 className={`flex-1 min-w-[65px] py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
 filterQueue === 'fila_geral' ? 'bg-card text-foreground font-bold border border-border shadow-xs' : 'hover:text-foreground'
 }`}
 >
 <span>Espera</span>
 <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-bold">
 {chats.filter(c => c.status === 'aberta' && c.id === 3).length}
 </span>
 </button>
 <button
 onClick={() => setFilterQueue('triagem_ia')}
 className={`flex-1 min-w-[70px] py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
 filterQueue === 'triagem_ia' ? 'bg-card text-foreground font-bold border border-border shadow-xs' : 'hover:text-foreground'
 }`}
 >
 <Sparkles size={11} className={filterQueue === 'triagem_ia' ? 'text-indigo-400' : 'text-muted-foreground'} />
 <span>IA</span>
 <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full font-bold">
 {chats.filter(c => c.status === 'triagem_ia').length}
 </span>
 </button>
 <button
 onClick={() => setFilterQueue('finalizados')}
 className={`flex-1 min-w-[65px] py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
 filterQueue === 'finalizados' ? 'bg-card text-foreground font-bold border border-border shadow-xs' : 'hover:text-foreground'
 }`}
 >
 <span>Fechados</span>
 </button>
 </div>

 {/* Campo de Busca Rápida */}
 <div className="relative">
 <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
 <input 
 type="text" 
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Buscar por cliente, CPF ou protocolo..." 
 className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-xs text-foreground outline-none focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600 transition-all placeholder:text-muted-foreground"
 />
 </div>
 </div>

 {/* Lista de Atendimentos */}
 <div className="flex-1 overflow-y-auto divide-y divide-white/5" style={{ scrollbarWidth: 'thin' }}>
 {filteredChats.length === 0 ? (
 <div className="p-8 text-center text-muted-foreground space-y-3">
 <InboxIcon size={32} className="mx-auto text-muted-foreground" />
 <p className="text-xs font-semibold">Nenhum chamado nesta fila</p>
 <button
 onClick={() => {
 setFilterQueue('todos');
 setSearchQuery('');
 }}
 className="px-3 py-1.5 bg-muted hover:bg-accent text-foreground text-xs font-semibold rounded-lg border border-border transition-colors cursor-pointer"
 >
 Ver Todos os Chamados ({chats.length})
 </button>
 </div>
 ) : (
 filteredChats.map(chat => {
 const msgs = chat.mensagens || [];
 const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
 const isSelected = activeChatId === chat.id;

 return (
 <div 
 key={chat.id} 
 onClick={() => setActiveChatId(chat.id)}
 className={`p-4 cursor-pointer transition-colors border-l-[3px] ${
 isSelected 
 ? 'bg-muted border-l-blue-500 shadow-sm' 
 : 'hover:bg-muted/50 border-l-transparent'
 }`}
 >
 <div className="flex justify-between items-start mb-1.5">
 <div className="flex items-center gap-2">
 <span className="font-bold text-xs text-foreground truncate max-w-[130px]">
 {chat.nome_cliente}
 </span>
 {getPilarBadge(chat.pilar_negocio)}
 {getChannelBadge(chat.canal)}
 </div>
 <span className="text-[11px] font-mono text-muted-foreground shrink-0">
 {lastMsg?.enviada_em || '--:--'}
 </span>
 </div>

 <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
 {lastMsg?.tipo === 'nota_interna' ? `🔒 [Nota] ${lastMsg.conteudo}` : (lastMsg?.conteudo || 'Nenhuma mensagem')}
 </p>

 <div className="flex items-center justify-between text-[10px]">
 <div className="flex items-center gap-1.5 text-muted-foreground">
 <span className="font-mono">{(chat.plano || 'Fibra 500MB').split(' ')[0]} {(chat.plano || 'Fibra 500MB').split(' ')[1] || ''}</span>
 <span>•</span>
 <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
 <Clock size={10} /> {chat.tempo_espera}
 </span>
 </div>

 {filterQueue === 'fila_geral' ? (
 <button 
 onClick={(e) => {
 e.stopPropagation();
 handleAssignToMe(chat.id);
 }}
 className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 py-0.5 rounded text-[10px] transition-colors"
 >
 Puxar Chamado
 </button>
 ) : (
 <span className="text-muted-foreground font-mono text-[10px]">
 #{(chat.protocolo || '0000').slice(-4)}
 </span>
 )}
 </div>
 </div>
 );
 })
 )}
 </div>
 </aside>

 {/* COLUNA 2: Janela Central de Conversa e Composer */}
 {activeChat ? (
 <div className={`flex-1 flex-col bg-background relative ${activeChatId ? 'flex' : 'hidden md:flex'} overflow-hidden`}>
 
 {/* Header Superior do Atendimento */}
 <header className="h-16 border-b border-border bg-card px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
 <div className="flex items-center gap-3">
 <button 
 onClick={() => setActiveChatId(null)}
 className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 -ml-1 text-xs font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl transition-all cursor-pointer shadow-xs"
 title="Voltar à lista de conversas do Inbox"
 >
 <ArrowLeft size={16} />
 <span>Fila Inbox</span>
 </button>

 <div className="w-10 h-10 bg-slate-600 text-foreground rounded-full flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
 <User size={20} className="text-foreground/80 mt-1" />
 </div>

 <div>
 <div className="flex items-center gap-2">
 <h2 className="font-bold text-foreground font-outfit text-sm sm:text-base leading-tight">
 {activeChat.nome_cliente}
 </h2>
 {getPilarBadge(activeChat.pilar_negocio)}
 {getChannelBadge(activeChat.canal)}
 </div>
 
 <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
 <span className="font-mono text-muted-foreground">{activeChat.protocolo}</span>
 <span>•</span>
 <span>{activeChat.plano}</span>
 <span>•</span>
 <span className="text-emerald-400 font-semibold flex items-center gap-1">
 <ShieldCheck size={12} /> Autenticado SGP
 </span>
 </div>
 </div>
 </div>

 {/* Ações Rápidas do Header e Controle MaIA/Humano */}
 <div className="flex items-center gap-2">
 {activeChat.status === 'triagem_ia' ? (
 <div className="flex items-center gap-1.5">
 <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold animate-pulse">
 <Bot size={12} className="text-indigo-400" />
 MaIA 24h Ativa
 </span>
 
 {/* Assumir atendimento diretamente no lugar da MaIA */}
 <button
 onClick={() => handleAssumeChat(activeChat.id)}
 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-sm active:scale-95"
 title="Intervir e assumir esta conversa agora (pausa a MaIA)"
 >
 <UserCheck size={13} />
 <span>Assumir Atendimento</span>
 </button>

 {/* Mandar para a fila geral humana */}
 <button
 onClick={() => {
 setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, status: 'aberta', fila: 'Fila Geral' } : c));
 setActiveChatId(null);
 setFilterQueue('fila_geral');
 showToast('Handoff realizado! Conversa enviada para a Fila Geral humana.');
 }}
 className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground bg-muted hover:bg-accent border border-border rounded-xl transition-all"
 title="Enviar para Fila Geral de Operadores"
 >
 <span>Fila Geral</span>
 </button>
 </div>
 ) : (
 <>
 {/* Botão de Devolver para a MaIA 24h */}
 <button
 onClick={() => handleDevolverParaMaia(activeChat.id)}
 className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl transition-all"
 title="Devolver o controle da conversa para a inteligência artificial MaIA (atendimento 24h)"
 >
 <Bot size={13} className="text-indigo-400" />
 <span className="hidden sm:inline">Devolver para MaIA</span>
 </button>

 <a 
 href={`tel:${activeChat.telefone}`}
 className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-muted-foreground bg-muted/60 hover:bg-accent border border-border rounded-xl transition-all"
 title="Ligar via Ramal SIP"
 >
 <Phone size={13} className="text-muted-foreground" />
 <span>{activeChat.telefone}</span>
 </a>

 {/* Alternar Drawer Contextual SGP */}
 <button
 onClick={() => setIsSgpDrawerOpen(!isSgpDrawerOpen)}
 className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
 isSgpDrawerOpen 
 ? 'bg-blue-500/10 border-blue-300 text-blue-400' 
 : 'bg-card hover:bg-muted/60 border-border text-muted-foreground'
 }`}
 title="Painel 360 do Assinante no ERP SGP"
 >
 <Layers size={13} />
 <span className="hidden sm:inline">CRM & SGP</span>
 </button>

 {/* Escalonar N2 / NOC */}
 <button
 onClick={() => {
 setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, status: 'aberta', fila: 'NOC N2' } : c));
 setActiveChatId(null);
 setFilterQueue('fila_geral');
 showToast('Atendimento escalonado para o Suporte N2 (NOC) com sucesso!');
 }}
 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-xl transition-all"
 title="Escalonar chamado para equipe de Nível 2 / NOC (TR-069 Avançado)"
 >
 <ShieldCheck size={13} className="text-orange-400" />
 <span className="hidden sm:inline">Escalonar N2</span>
 </button>

 {/* Finalizar / Tabular Atendimento */}
 <button
 onClick={() => setIsTabulating(true)}
 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all"
 >
 <CheckCircle size={13} className="text-emerald-400" />
 <span className="hidden sm:inline">Finalizar</span>
 </button>
 </>
 )}
 </div>
 </header>

 {/* Área com Stream de Mensagens e Drawer Contextual */}
 <div className="flex-1 flex overflow-hidden relative">
 
 {/* Thread de Mensagens */}
 <div 
 className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-background" 
 style={{ 
 scrollbarWidth: 'thin'
 }}
 >
 
 {/* Alerta de Início do Chamado & Protocolo */}
 <div className="flex justify-center my-2">
 <div className="bg-muted/60 border border-border rounded-full px-3 py-1 text-[11px] text-muted-foreground flex items-center gap-1.5 font-mono">
 <Clock size={11} />
 <span>Atendimento iniciado às {(activeChat.mensagens && activeChat.mensagens[0]?.enviada_em) || '--:--'} • Protocolo {activeChat.protocolo}</span>
 </div>
 </div>

 {/* Mensagens */}
 {(activeChat.mensagens || []).map((msg) => {
 const isMe = msg.autor_tipo === 'operador';
 const isClient = msg.autor_tipo === 'cliente';
 const isAi = msg.autor_tipo === 'ia';
 const isNote = msg.tipo === 'nota_interna';

 return (
 <div 
 key={msg.id} 
 className={`flex ${isMe || isAi ? 'justify-end' : 'justify-start'} animate-in fade-in-50 duration-150`}
 >
 <div 
 className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed border ${
 isNote 
 ? 'bg-amber-500/10 border-amber-500/20 text-amber-50 w-full max-w-[90%]' 
 : isClient
 ? 'bg-card border-border text-card-foreground rounded-tl-sm shadow-sm'
 : isAi
 ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-100 rounded-tr-sm'
 : 'bg-blue-600 text-white border-blue-500 rounded-tr-sm shadow-sm'
 }`}
 >
 {/* Header da Mensagem */}
 <div className="flex items-center justify-between gap-3 mb-1.5 pb-1.5 border-b border-border">
 <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
 isNote 
 ? 'text-amber-400' 
 : isClient 
 ? 'text-muted-foreground' 
 : isAi 
 ? 'text-indigo-300' 
 : 'text-blue-100'
 }`}>
 {isNote && <Lock size={10} />}
 {isAi && <Sparkles size={10} />}
 {isNote ? 'Sussurro (Nota Interna Privada)' : isClient ? activeChat.nome_cliente : isAi ? 'Assistente IA (9router)' : 'Você (Operador)'}
 </span>

 <div className={`flex items-center gap-1 text-[10px] font-mono ${isClient || isNote || isAi ? 'text-muted-foreground' : 'text-blue-200'}`}>
 <span>{msg.enviada_em}</span>
 {isMe && !isNote && (
 <CheckCheck size={14} className={msg.status === 'lido' ? 'text-blue-200' : 'text-blue-200/50'} />
 )}
 </div>
 </div>

 {/* Conteúdo com quebra de linha ou Áudio */}
 {msg.tipo === 'audio' || msg.conteudo?.includes('(Áudio/Mídia Recebida)') ? (
 <div className="flex flex-col gap-2">
 <div className="flex items-center gap-3 bg-white/10 p-2 rounded-lg">
 <button className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 hover:bg-blue-600">
 <Play size={14} className="ml-1" />
 </button>
 <div className="flex-1">
 <div className="h-1 bg-white/20 rounded-full w-full relative">
 <div className="absolute top-0 left-0 h-full bg-blue-500 rounded-full w-1/3" />
 </div>
 </div>
 <span className="text-[10px] font-mono font-medium opacity-70">0:15</span>
 </div>
 <p className="whitespace-pre-wrap text-sm italic opacity-90 border-l-2 border-border pl-2">
 <Bot size={12} className="inline mr-1" />
 {msg.conteudo.replace('(Áudio/Mídia Recebida) ', '')}
 </p>
 </div>
 ) : (
 <p className="whitespace-pre-wrap">{msg.conteudo}</p>
 )}
 </div>
 </div>
 );
 })}

 <div ref={chatEndRef} />
 </div>

 {/* COLUNA 3: Contexto 360 do Assinante & Ações SGP (Drawer Direito) */}
 {isSgpDrawerOpen && (
 <aside className="absolute right-0 top-0 bottom-0 z-40 lg:relative lg:top-0 lg:z-auto w-80 lg:w-96 border-l border-border bg-card overflow-y-auto p-4 space-y-4 shrink-0 animate-in slide-in-from-right-3 duration-200 shadow-2xl lg:shadow-none">
 
 {/* Header do Drawer */}
 <div className="flex items-center justify-between pb-2 border-b border-border">
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
 <h3 className="font-bold text-xs text-foreground uppercase tracking-wider font-outfit">
 Raio-X do Assinante (SGP)
 </h3>
 </div>
 <button 
 onClick={() => setIsSgpDrawerOpen(false)}
 className="p-1 text-muted-foreground hover:text-muted-foreground rounded-md"
 title="Ocultar Painel"
 >
 <X size={16} />
 </button>
 </div>

 {/* Bloco 1: Conexão & ONU ao Vivo */}
 <div className="p-3.5 rounded-2xl bg-background border border-border space-y-2.5">
 <div className="flex justify-between items-center">
 <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
 <Wifi size={13} className="text-blue-400" /> Rede & Sinal Óptico
 </span>
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
 PPPoE Online
 </span>
 </div>

 <div className="grid grid-cols-2 gap-2 text-xs">
 <div className="p-2 bg-card rounded-xl border border-border">
 <span className="text-[10px] text-muted-foreground block">Sinal ONU</span>
 <span className="font-bold text-emerald-400 font-mono text-xs">{activeChat.status_conexao?.sinal_onu || '-19.4 dBm'}</span>
 </div>
 <div className="p-2 bg-card rounded-xl border border-border">
 <span className="text-[10px] text-muted-foreground block">Uptime</span>
 <span className="font-bold text-card-foreground font-mono text-xs">{activeChat.status_conexao?.uptime || '15d 2h'}</span>
 </div>
 </div>

 <div className="text-[11px] text-muted-foreground font-mono space-y-1 pt-1 border-t border-border/60">
 <div className="flex justify-between">
 <span>IP Público:</span>
 <span className="text-foreground font-bold">{activeChat.status_conexao?.ip || '177.45.2.19'}</span>
 </div>
 <div className="flex justify-between">
 <span>Concentrador:</span>
 <span className="text-foreground font-bold">{activeChat.status_conexao?.concentrador || 'MikroTik-Core-01'}</span>
 </div>
 </div>

 <button 
 onClick={handleKickRadius}
 className="w-full py-1.5 bg-card hover:bg-muted/60 border border-border text-muted-foreground text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 "
 >
 <RefreshCw size={12} className="text-muted-foreground" />
 <span>Reautenticar Sessão (Kick)</span>
 </button>
 </div>

 {/* Bloco Upgrades & Vendas */}
 {activeChat.pilar_negocio === 'vendas' && (
 <div className="p-3.5 rounded-2xl bg-fuchsia-950/20 border border-fuchsia-500/20 space-y-2.5">
 <div className="flex justify-between items-center">
 <span className="text-[11px] font-bold text-fuchsia-300 uppercase tracking-wide flex items-center gap-1">
 <TrendingUp size={13} className="text-fuchsia-400" /> Oportunidade de Upgrade
 </span>
 </div>
 
 <div className="p-2.5 bg-card/50 rounded-xl border border-border space-y-2 text-xs">
 <p className="text-muted-foreground">
 Lead demonstrou interesse em <strong className="text-fuchsia-400">Wi-Fi 6 Mesh</strong>.
 O plano atual é {activeChat.plano} (R$ {activeChat.financeiro?.valor ? activeChat.financeiro.valor.toFixed(2) : '99.90'}).
 </p>
 <button 
 onClick={() => {
 setMessageText(`Perfeito, Fernanda! O upgrade para o Wi-Fi 6 Mesh vai adicionar R$ 49,90 na sua fatura, ficando um total de R$ ${((activeChat.financeiro?.valor || 99.90) + 49.90).toFixed(2)}/mês. Posso gerar o aceite digital no seu aplicativo?`);
 setIsInternalNote(false);
 showToast('Oferta de Upgrade enviada para o chat!');
 }}
 className="w-full py-1.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-foreground font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
 >
 <Sparkles size={12} />
 Enviar Proposta de Upgrade
 </button>
 </div>
 </div>
 )}

 {/* Bloco 2: Financeiro & PIX Instantâneo */}
 <div className="p-3.5 rounded-2xl bg-background border border-border space-y-2.5">
 <div className="flex justify-between items-center">
 <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
 <CreditCard size={13} className="text-indigo-400" /> Financeiro / Mensalidade
 </span>
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
 activeChat.financeiro?.status === 'pendente' ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
 }`}>
 {activeChat.financeiro?.status === 'pendente' ? 'A Vencer' : 'Pago'}
 </span>
 </div>

 <div className="p-2.5 bg-card rounded-xl border border-border flex justify-between items-center">
 <div>
 <span className="text-[10px] text-muted-foreground block">Vencimento {activeChat.financeiro?.vencimento || '2026-09-10'}</span>
 <span className="text-base font-extrabold text-foreground font-mono">
 R$ {activeChat.financeiro?.valor ? activeChat.financeiro.valor.toFixed(2) : '99.90'}
 </span>
 </div>
 <Tooltip content="Gera o código PIX e anexa na conversa a critério do operador" position="top">
 <button 
 onClick={handleSendPixToChat}
 className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
 >
 <Copy size={12} />
 <span>Enviar PIX</span>
 </button>
 </Tooltip>
 </div>

 {/* Orientação de Canal Principal & Critério do Operador */}
 <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] space-y-1">
 <div className="flex items-center gap-1.5 font-bold text-blue-300">
 <Smartphone size={12} />
 <span>Canal Principal: Portal do Assinante</span>
 </div>
 <p className="text-muted-foreground text-[10px] leading-relaxed">
 Esta fatura já está disponível para o cliente no Portal Web/PWA. O envio de 2ª via pelo WhatsApp é opcional e fica a critério do operador.
 </p>
 </div>

 {/* Ação de Desbloqueio 24h */}
 <Tooltip content="Libera 24h de conexão no NAS/MikroTik" position="top" className="w-full">
 <button 
 onClick={handleDesbloqueio24h}
 className="w-full py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 "
 >
 <ShieldCheck size={13} className="text-amber-400" />
 <span>Desbloqueio em Confiança (24h)</span>
 </button>
 </Tooltip>
 </div>

 {/* Bloco 3: Dados Cadastrais */}
 <div className="p-3 bg-card rounded-2xl border border-border text-xs space-y-1.5">
 <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wide block mb-1">
 Dados do Contrato
 </span>
 <div className="flex justify-between text-muted-foreground">
 <span>CPF:</span>
 <span className="font-mono text-foreground font-semibold">{activeChat.cpf}</span>
 </div>
 <div className="flex justify-between text-muted-foreground">
 <span>Telefone WABA:</span>
 <span className="font-mono text-foreground font-semibold">{activeChat.telefone}</span>
 </div>
 <div className="flex justify-between text-muted-foreground">
 <span>Protocolo Atual:</span>
 <span className="font-mono text-blue-400 font-bold">{activeChat.protocolo}</span>
 </div>
 </div>

 {/* Bloco 4: Endereço de Instalação & Rota Técnica */}
 <div className="p-3 bg-card rounded-2xl border border-border text-xs space-y-2.5">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wide flex items-center gap-1">
 <MapPin size={12} className="text-blue-400" /> Endereço & Rota
 </span>
 {activeChat.cep && (
 <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
 {activeChat.cep}
 </span>
 )}
 </div>

 <div>
 <p className="font-semibold text-card-foreground text-[11px] leading-snug">
 {activeChat.endereco || 'Endereço a confirmar no cadastro'}
 </p>
 {activeChat.ponto_referencia && (
 <p className="text-[10px] text-amber-400 font-medium mt-1">
 Ref: {activeChat.ponto_referencia}
 </p>
 )}
 </div>

 <div className="grid grid-cols-2 gap-1.5 pt-1">
 <button
 type="button"
 onClick={() => setMapModalOpen(true)}
 className="py-1.5 px-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
 title="Ver mapa, consultar CEP ou abrir rotas no GPS"
 >
 <MapPin size={11} />
 <span>Mapa / CEP</span>
 </button>
 <button
 type="button"
 onClick={() => setMapModalOpen(true)}
 className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-colors "
 title="Disparar rota e dados para técnico via WhatsApp"
 >
 <Share2 size={11} />
 <span>WhatsApp OS</span>
 </button>
 </div>
 </div>

 {/* Bloco 5: Handoff / CRM Kanban */}
 <div className="p-3 bg-card rounded-2xl border border-border text-xs space-y-2.5">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wide flex items-center gap-1">
 <Layers size={12} className="text-orange-400" /> Histórico Kanban
 </span>
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
 Sincronizado
 </span>
 </div>
 
 <div className="bg-background p-2.5 rounded-xl border border-border space-y-1.5">
 <p className="text-[10px] text-muted-foreground leading-relaxed">
 Ao assumir o atendimento da MaIA (Handoff), o SGP Kanban automaticamente posiciona um Deal em 
 <strong className="text-orange-400 ml-1 font-semibold uppercase">Em Atendimento</strong>.
 </p>
 <div className="pt-1 flex gap-2">
 <button
 onClick={() => window.open('/admin/crm', '_blank')}
 className="flex-1 py-1.5 bg-muted/60 hover:bg-accent border border-border rounded-lg font-semibold text-muted-foreground flex items-center justify-center gap-1 transition-all"
 >
 <ExternalLink size={12} />
 <span>Abrir Kanban SGP</span>
 </button>
 </div>
 </div>
 </div>

 </aside>
 )}
 </div>

 {/* COMPOSER OMNICHANNEL MODERNO */}
 <footer className="border-t border-border bg-card p-3 sm:p-4 z-20 space-y-2 shrink-0">
 
 {/* Banner Informativo quando em Atendimento 24h MaIA */}
 {activeChat.status === 'triagem_ia' && (
 <div className="flex flex-wrap items-center justify-between gap-2 p-2 px-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
 <div className="flex items-center gap-2">
 <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
 <span className="font-bold text-indigo-300 flex items-center gap-1.5">
 <Bot size={13} className="text-indigo-400" />
 MaIA Ativa no WhatsApp (Atendimento 24h Inteligente)
 </span>
 <span className="text-[11px] text-muted-foreground hidden sm:inline">• Você pode intervir a qualquer instante</span>
 </div>
 <button
 type="button"
 onClick={() => handleAssumeChat(activeChat.id)}
 className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 shadow-sm"
 >
 <UserCheck size={12} />
 <span>Assumir Atendimento Humano</span>
 </button>
 </div>
 )}

 {/* Barra de Modos & Macros Rápidas */}
 <div className="flex flex-wrap items-center justify-between gap-2">
 
 {/* Alternar Mensagem Pública vs Nota Interna */}
 <div className="flex rounded-xl bg-muted/60 p-0.5 text-xs font-semibold">
 <button
 onClick={() => setIsInternalNote(false)}
 className={`px-3 py-1.5 text-[11px] rounded-lg transition-all flex items-center gap-1.5 ${
 !isInternalNote ? 'bg-muted text-blue-400 font-bold border border-blue-500/30 shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent'
 }`}
 >
 <MessageCircle size={12} />
 <span>Mensagem {activeChat.canal === 'whatsapp' ? 'WhatsApp' : 'Cliente'}</span>
 </button>
 <button
 onClick={() => setIsInternalNote(true)}
 className={`px-3 py-1.5 text-[11px] rounded-lg transition-all flex items-center gap-1.5 ${
 isInternalNote ? 'bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30 shadow-sm' : 'text-muted-foreground hover:text-white hover:bg-muted border border-transparent'
 }`}
 >
 <Lock size={12} className="text-amber-400" />
 <span>Nota Interna (Sussurro)</span>
 </button>
 </div>

 {/* Botões Rápidos de HSM / Macros do Provedor e Copiloto Gemini */}
 {activeChat.status !== 'triagem_ia' && (
 <div className="flex items-center gap-1.5 overflow-x-auto text-xs" style={{ scrollbarWidth: 'none' }}>
 <button
 onClick={handleGeminiCopilot}
 disabled={isGeneratingCopilot}
 className={`px-3 py-1.5 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1.5 border ${
 copilotSuccess
 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-sm'
 : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/30 shadow-sm'
 }`}
 title="O Gemini analisa a dúvida do cliente e o sinal da fibra no SGP e gera uma resposta pronta"
 >
 <Sparkles size={12} className={isGeneratingCopilot ? 'animate-spin text-indigo-400' : 'text-indigo-400'} />
 <span>{isGeneratingCopilot ? 'Gemini gerando...' : copilotSuccess ? 'Sugestão Aplicada!' : 'Copiloto Gemini'}</span>
 </button>

 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider hidden sm:inline ml-1">
 Macros:
 </span>
 {macros.slice(0, 5).map((macro) => (
 <button 
 key={macro.id || macro.atalho}
 onClick={() => applyMacro(macro)}
 className="px-2.5 py-1 bg-muted/60 hover:bg-blue-500/10 hover:text-blue-400 text-muted-foreground rounded-lg font-mono font-bold text-[11px] whitespace-nowrap transition-colors"
 title={macro.titulo || macro.atalho}
 >
 {macro.atalho}
 </button>
 ))}
 </div>
 )}
 </div>

 {/* Caixa de Entrada e Envio */}
 <div className={`flex items-end gap-2 p-1.5 rounded-2xl border transition-all ${
 activeChat.status === 'triagem_ia'
 ? 'bg-card border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
 : isInternalNote 
 ? 'bg-amber-950/20 border-amber-500/30' 
 : 'bg-background border-border focus-within:border-blue-500/50'
 }`}>
 
 <textarea
 value={messageText}
 onChange={(e) => setMessageText(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === 'Enter' && !e.shiftKey) {
 e.preventDefault();
 handleSendMessage();
 }
 }}
 rows={1}
 placeholder={
 activeChat.status === 'triagem_ia'
 ? 'Modo IA Ativo: Simule a mensagem do cliente (IA responderá)...'
 : isInternalNote 
 ? 'Escreva uma anotação interna visível apenas para os operadores...' 
 : 'Digite sua mensagem (use Enter para enviar)...'
 }
 className={`flex-1 bg-transparent border-0 outline-none text-xs sm:text-sm text-foreground placeholder:text-muted-foreground resize-none max-h-32 px-2 py-1.5 leading-relaxed ${activeChat.status === 'triagem_ia' ? 'placeholder:text-indigo-300' : ''}`}
 />

 <button
 onClick={handleSendMessage}
 disabled={!messageText.trim()}
 className={`w-10 h-10 flex items-center justify-center rounded-full text-foreground font-bold transition-all active:scale-95 disabled:opacity-40 shrink-0 shadow-sm ${
 activeChat.status === 'triagem_ia'
 ? 'bg-indigo-600 hover:bg-indigo-500'
 : isInternalNote 
 ? 'bg-amber-600 hover:bg-amber-500' 
 : 'bg-blue-600 hover:bg-blue-500'
 }`}
 title="Enviar Mensagem (Enter)"
 >
 {activeChat.status === 'triagem_ia' ? <Sparkles size={18} className="text-foreground" /> : <Send size={18} className="ml-0.5" />}
 </button>
 </div>
 </footer>

 </div>
 ) : (
 /* Estado Vazio */
 <div className={`flex-1 flex flex-col items-center justify-center bg-background text-muted-foreground p-8 text-center ${activeChatId ? "flex" : "hidden md:flex"}`}>
 <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center mb-4 border border-border ">
 <MessageCircle size={28} className="text-muted-foreground" />
 </div>
 <h3 className="font-outfit text-lg text-card-foreground font-bold mb-1">
 Nenhum Atendimento Selecionado
 </h3>
 <p className="text-xs text-muted-foreground max-w-sm mb-4">
 Escolha uma conversa na fila ao lado para iniciar o atendimento integrado ao SGP e Asterisk.
 </p>
 {chats.length > 0 && (
 <button
 onClick={() => setActiveChatId(chats[0].id)}
 className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
 >
 Abrir Chamado #{chats[0].id} ({chats[0].nome_cliente})
 </button>
 )}
 </div>
 )}

 {/* MODAL DE TABULAÇÃO / FINALIZAR CHAMADO */}
 {isTabulating && activeChat && (
 <>
 <div 
 onClick={() => setIsTabulating(false)} 
 className="fixed inset-0 bg-background/60 backdrop-blur-2xs z-50 animate-in fade-in-50"
 aria-hidden="true"
 />
 <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card rounded-3xl p-6 border border-border z-50 animate-in zoom-in-95 duration-150">
 <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
 <div>
 <h3 className="font-bold text-base text-foreground font-outfit">
 Tabulação de Atendimento
 </h3>
 <p className="text-xs text-muted-foreground">Protocolo {activeChat.protocolo}</p>
 </div>
 <button 
 onClick={() => setIsTabulating(false)}
 className="text-muted-foreground hover:text-muted-foreground p-1 rounded-md"
 >
 <X size={18} />
 </button>
 </div>

 {/* Banner de Auto-Tabulação com Gemini */}
 <div className="mb-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center ">
 <Sparkles size={16} />
 </div>
 <div>
 <span className="font-bold text-indigo-300 text-xs block">Preenchimento IA</span>
 <span className="text-[10px] text-indigo-400/80">Analisa o diálogo e preenche tudo em 1 segundo</span>
 </div>
 </div>
 <button
 onClick={handleAutoTabulateGemini}
 disabled={isAutoTabulating}
 className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[11px] font-bold rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
 >
 {isAutoTabulating ? (
 <>
 <RefreshCw size={12} className="animate-spin" />
 <span>Lendo conversa...</span>
 </>
 ) : (
 <>
 <Sparkles size={12} />
 <span>Auto-Preencher</span>
 </>
 )}
 </button>
 </div>

 <div className="space-y-4 text-xs">
 <div>
 <label className="block font-bold text-muted-foreground mb-1">Fila / Categoria</label>
 <select 
 value={tabulationData.categoria}
 onChange={(e) => setTabulationData(prev => ({ ...prev, categoria: e.target.value }))}
 className="w-full p-2.5 bg-background border border-border rounded-xl font-medium text-foreground outline-none focus:ring-2 focus:ring-blue-500/30"
 >
 <option value="Suporte Técnico">Suporte Técnico N1</option>
 <option value="Suporte Avançado N2">Suporte Avançado N2 (Fibra/NOC)</option>
 <option value="Financeiro">Financeiro / 2ª Via</option>
 <option value="Vendas & Upgrades">Vendas & Upgrades</option>
 <option value="Retenção / Cancelamento">Retenção de Clientes</option>
 </select>
 </div>

 <div>
 <label className="block font-bold text-muted-foreground mb-1">Motivo do Contato</label>
 <input 
 type="text"
 value={tabulationData.motivo}
 onChange={(e) => setTabulationData(prev => ({ ...prev, motivo: e.target.value }))}
 className="w-full p-2.5 bg-background border border-border rounded-xl font-medium text-foreground outline-none focus:ring-2 focus:ring-blue-500/30"
 />
 </div>

 <div>
 <label className="block font-bold text-muted-foreground mb-1">Resumo da Resolução</label>
 <textarea 
 rows={3}
 value={tabulationData.resolucao}
 onChange={(e) => setTabulationData(prev => ({ ...prev, resolucao: e.target.value }))}
 className="w-full p-2.5 bg-background border border-border rounded-xl font-medium text-foreground outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
 />
 </div>

 <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Sparkles size={16} className="text-blue-400" />
 <div>
 <span className="font-bold text-blue-300 block">Pesquisa CSAT / NPS</span>
 <span className="text-[10px] text-blue-400">Disparar avaliação automática via WhatsApp</span>
 </div>
 </div>
 <input 
 type="checkbox"
 checked={tabulationData.enviarPesquisaNps}
 onChange={(e) => setTabulationData(prev => ({ ...prev, enviarPesquisaNps: e.target.checked }))}
 className="w-4 h-4 rounded text-blue-400 focus:ring-blue-500"
 />
 </div>
 </div>

 <div className="mt-6 flex gap-3">
 <button 
 onClick={() => setIsTabulating(false)}
 className="flex-1 py-2.5 bg-muted/60 hover:bg-accent text-muted-foreground font-bold rounded-xl transition-colors"
 >
 Voltar ao Chat
 </button>
 <button 
 onClick={handleFinishTicket}
 className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all active:scale-95"
 >
 Concluir & Tabular
 </button>
 </div>
 </div>
 </>
 )}

 {/* Modal de Mapa, Busca de CEP e Rota para Técnico em Campo */}
 {activeChat && (
 <AddressMapModal
 isOpen={mapModalOpen}
 onClose={() => setMapModalOpen(false)}
 cliente={{
 id: activeChat.contato_id,
 nome: activeChat.nome_cliente,
 telefone: activeChat.telefone,
 endereco: activeChat.endereco,
 logradouro: activeChat.logradouro,
 numero: activeChat.numero,
 complemento: activeChat.complemento,
 bairro: activeChat.bairro,
 cidade: activeChat.cidade,
 uf: activeChat.uf,
 cep: activeChat.cep,
 ponto_referencia: activeChat.ponto_referencia,
 coordenadas: activeChat.coordenadas
 }}
 onAddressUpdated={(novo) => {
 setChats(prev => prev.map(c => c.id === activeChat.id ? ({
 ...c,
 ...novo,
 id: c.id,
 endereco: novo.endereco || c.endereco
 } as ExtendedConversa) : c));
 }}
 />
 )}

 </div>
 );
}
