import React, { useState, useEffect } from 'react';
import { 
 Search, 
 CreditCard, 
 Send, 
 Sparkles, 
 CheckCircle2, 
 AlertCircle, 
 Clock, 
 FileText, 
 Download, 
 Copy, 
 Check, 
 ArrowUpRight, 
 ShieldCheck, 
 Wifi, 
 Loader2, 
 Zap, 
 DollarSign, 
 ChevronRight, 
 Info, 
 Radio, 
 MessageSquare,
 AlertTriangle,
 MapPin,
 Share2,
 Navigation
} from 'lucide-react';
import AddressMapModal from './AddressMapModal';
import PortalContratoModal from './PortalContratoModal';

export interface SgpFatura {
 id: number;
 fatura_id: string;
 referencia: string;
 vencimento: string;
 valor: number;
 status: 'aberto' | 'pago' | 'vencido';
 pago_em?: string;
 dias_atraso?: number;
 linha_digitavel?: string;
 pix_copia_cola?: string;
 link_pdf?: string;
}

export interface SgpPlanoAtual {
 id: string;
 nome: string;
 download: string;
 upload: string;
 valor: number;
 tecnologia: string;
 fidelidade_fim: string;
 vencimento_dia: number;
 ip_tipo: string;
}

export interface SgpPlanoOferta {
 id: string;
 nome: string;
 download: string;
 upload: string;
 valor: number;
 tipo: 'upgrade' | 'retencao' | 'combo' | 'adicional';
 destaque: boolean;
 descricao: string;
}

export interface SgpClienteCompleto {
 id: number;
 contrato_id: number;
 nome: string;
 cpf_cnpj: string;
 status_cliente: 'ativo' | 'bloqueado' | 'cancelado';
 endereco: string;
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
 contato: {
 telefone: string;
 email: string;
 };
 plano_atual: SgpPlanoAtual;
 conexao: {
 status: string;
 uptime: string;
 ip: string;
 mac: string;
 olt_pon: string;
 sinal_optico: string;
 concentrador: string;
 };
 faturas: SgpFatura[];
 planos_catalogo: SgpPlanoOferta[];
 historico_ofertas?: any[];
 envios_segunda_via?: any[];
}

interface SgpAdvancedSearchProps {
 initialClienteId?: number | string;
 onSelectCliente?: (cliente: SgpClienteCompleto) => void;
 className?: string;
}

export default function SgpAdvancedSearch({
 initialClienteId = 1001,
 onSelectCliente,
 className = ''
}: SgpAdvancedSearchProps) {
 const [searchTerm, setSearchTerm] = useState(String(initialClienteId));
 const [loading, setLoading] = useState(false);
 const [cliente, setCliente] = useState<SgpClienteCompleto | null>(null);
 const [errorMsg, setErrorMsg] = useState<string | null>(null);

 // Tab interna: 'financeiro' | 'planos_ofertas' | 'conexao' | 'contrato'
 const [activeTab, setActiveTab] = useState<'financeiro' | 'planos_ofertas' | 'conexao' | 'contrato'>('financeiro');
 const [contratoModalOpen, setContratoModalOpen] = useState(false);
 const [disparandoContratoWhatsApp, setDisparandoContratoWhatsApp] = useState(false);
 const [contratoDisparadoSucesso, setContratoDisparadoSucesso] = useState(false);

 // Estados para ação de "Enviar 2ª Via"
 const [enviandoFaturaId, setEnviandoFaturaId] = useState<number | string | null>(null);
 const [segundaViaSucesso, setSegundaViaSucesso] = useState<{
 faturaId: string;
 protocolo: string;
 mensagem: string;
 canal: string;
 } | null>(null);

 // Estados para ação de "Registrar Oferta de Plano"
 const [ofertandoPlanoId, setOfertandoPlanoId] = useState<string | null>(null);
 const [ofertaModalOpen, setOfertaModalOpen] = useState(false);
 const [selectedPlanoParaOferta, setSelectedPlanoParaOferta] = useState<SgpPlanoOferta | null>(null);
 const [ofertaObservacao, setOfertaObservacao] = useState('');
 const [ofertaSucesso, setOfertaSucesso] = useState<{
 protocolo: string;
 planoNome: string;
 mensagem: string;
 } | null>(null);

 // Copiar PIX
 const [copiedPixId, setCopiedPixId] = useState<string | null>(null);

 // Modal de Mapa / Busca CEP / Compartilhar WhatsApp com Técnico
 const [mapModalOpen, setMapModalOpen] = useState(false);

 // Busca inicial
 useEffect(() => {
 if (initialClienteId) {
 buscarClienteNoSgp(String(initialClienteId));
 }
 }, [initialClienteId]);

 const buscarClienteNoSgp = async (identificador: string) => {
 if (!identificador.trim()) return;
 setLoading(true);
 setErrorMsg(null);
 setSegundaViaSucesso(null);
 setOfertaSucesso(null);

 try {
 const res = await fetch(`/api/sgp/cliente/${encodeURIComponent(identificador.trim())}`);
 const data = await res.json();

 if (res.ok && data.cliente) {
 setCliente(data.cliente);
 if (onSelectCliente) {
 onSelectCliente(data.cliente);
 }
 } else {
 setErrorMsg(data.mensagem || 'Cliente não encontrado no SGP.');
 if (data.sugestao) {
 setCliente(data.sugestao);
 }
 }
 } catch (err: any) {
 console.error('Erro na consulta SGP:', err);
 setErrorMsg('Falha de conexão com a API do SGP.');
 } finally {
 setLoading(false);
 }
 };

 const handleSearchSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 buscarClienteNoSgp(searchTerm);
 };

 // Enviar 2ª via oficial SGP
 const handleEnviarSegundaVia = async (fatura: SgpFatura, canal: 'whatsapp' | 'email' = 'whatsapp') => {
 if (!cliente) return;
 setEnviandoFaturaId(fatura.id);
 setSegundaViaSucesso(null);

 try {
 const res = await fetch('/api/sgp/fatura/enviar-segunda-via', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 cliente_id: cliente.id,
 fatura_id: fatura.fatura_id || fatura.id,
 canal,
 destino: canal === 'whatsapp' ? cliente.contato.telefone : cliente.contato.email,
 operador: 'Operador CRM DJD'
 })
 });

 const data = await res.json();
 if (res.ok && data.sucesso) {
 setSegundaViaSucesso({
 faturaId: fatura.fatura_id,
 protocolo: data.protocolo_sgp,
 mensagem: data.mensagem,
 canal: canal === 'whatsapp' ? 'WhatsApp' : 'E-mail'
 });
 } else {
 setErrorMsg(data.erro || 'Não foi possível enviar a 2ª via.');
 }
 } catch (err) {
 console.error('Erro ao enviar 2ª via:', err);
 setErrorMsg('Erro de comunicação com o servidor SGP.');
 } finally {
 setEnviandoFaturaId(null);
 }
 };

 // Abrir modal de oferta
 const handleOpenOfertaModal = (plano: SgpPlanoOferta) => {
 setSelectedPlanoParaOferta(plano);
 setOfertaObservacao(`Assinante elegível a upgrade durante atendimento no CRM. Manter roteador atual.`);
 setOfertaModalOpen(true);
 };

 // Registrar oferta de plano oficial SGP
 const handleConfirmarRegistroOferta = async () => {
 if (!cliente || !selectedPlanoParaOferta) return;
 setOfertandoPlanoId(selectedPlanoParaOferta.id);

 try {
 const res = await fetch('/api/sgp/planos/registrar-oferta', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 cliente_id: cliente.id,
 plano_id: selectedPlanoParaOferta.id,
 plano_nome: selectedPlanoParaOferta.nome,
 valor_ofertado: selectedPlanoParaOferta.valor,
 desconto_promocional: 'Isenção de taxa de migração + Prioridade de tráfego',
 canal: 'crm_atendimento',
 observacoes: ofertaObservacao,
 operador: 'Operador CRM DJD'
 })
 });

 const data = await res.json();
 if (res.ok && data.sucesso) {
 setOfertaSucesso({
 protocolo: data.protocolo_sgp,
 planoNome: selectedPlanoParaOferta.nome,
 mensagem: data.mensagem
 });
 setOfertaModalOpen(false);
 // Atualiza a lista interna
 buscarClienteNoSgp(String(cliente.id));
 } else {
 setErrorMsg(data.erro || 'Falha ao registrar oferta no SGP.');
 }
 } catch (err) {
 console.error('Erro ao registrar oferta:', err);
 setErrorMsg('Erro de comunicação ao registrar oferta no SGP.');
 } finally {
 setOfertandoPlanoId(null);
 }
 };

 const handleCopyPix = (pixCode?: string, faturaId?: string) => {
 if (!pixCode) return;
 navigator.clipboard.writeText(pixCode);
 setCopiedPixId(faturaId || 'pix');
 setTimeout(() => setCopiedPixId(null), 2500);
 };

 return (
 <div className={`bg-card rounded-2xl border border-border overflow-hidden flex flex-col ${className}`}>
 
 {/* Header com Barra de Consulta Rápida SGP */}
 <div className="p-4 sm:p-5 border-b border-border bg-background/80">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-600 font-bold">
 <Zap size={16} />
 </div>
 <div>
 <h3 className="text-sm font-bold text-foreground font-outfit flex items-center gap-1.5">
 Consulta Avançada SGP (ERP)
 <span className="text-[10px] font-mono font-semibold bg-emerald-500/100/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
 API Oficial Conectada
 </span>
 </h3>
 <p className="text-xs text-muted-foreground">
 Financeiro em tempo real, plano contratado e ações operacionais no SGP
 </p>
 </div>
 </div>
 
 {cliente && (
 <div className="flex items-center gap-2 text-xs">
 <span className="text-muted-foreground">Contrato:</span>
 <span className="font-mono font-bold text-card-foreground bg-card px-2 py-0.5 rounded border border-border">
 #{cliente.contrato_id}
 </span>
 </div>
 )}
 </div>

 {/* Input de Busca */}
 <form onSubmit={handleSearchSubmit} className="flex gap-2">
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
 <input 
 type="text" 
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 placeholder="Buscar por ID SGP (#1001), CPF/CNPJ, Telefone ou Nome..."
 className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-xl text-xs sm:text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600 font-medium"
 />
 </div>
 <button
 type="submit"
 disabled={loading || !searchTerm.trim()}
 className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 "
 >
 {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
 <span>Consultar</span>
 </button>
 </form>

 {errorMsg && (
 <div className="mt-2.5 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2 text-xs text-amber-400">
 <AlertCircle size={14} className="text-amber-500 shrink-0" />
 <span>{errorMsg}</span>
 </div>
 )}
 </div>

 {/* Notificação de Sucesso de Envio de 2ª Via */}
 {segundaViaSucesso && (
 <div className="mx-4 sm:mx-5 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start justify-between gap-3 text-xs text-emerald-300 animate-in fade-in">
 <div className="flex items-start gap-2">
 <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
 <div>
 <p className="font-bold">{segundaViaSucesso.mensagem}</p>
 <p className="text-[11px] text-emerald-400 font-mono mt-0.5">
 Protocolo SGP: <span className="font-bold">{segundaViaSucesso.protocolo}</span> • Canal: {segundaViaSucesso.canal}
 </p>
 </div>
 </div>
 <button 
 onClick={() => setSegundaViaSucesso(null)}
 className="text-emerald-400 hover:text-emerald-300 text-xs font-bold p-1"
 >
 ✕
 </button>
 </div>
 )}

 {/* Notificação de Sucesso de Registro de Oferta */}
 {ofertaSucesso && (
 <div className="mx-4 sm:mx-5 mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-start justify-between gap-3 text-xs text-indigo-900 animate-in fade-in">
 <div className="flex items-start gap-2">
 <Sparkles size={16} className="text-indigo-600 shrink-0 mt-0.5" />
 <div>
 <p className="font-bold">{ofertaSucesso.mensagem}</p>
 <p className="text-[11px] text-indigo-700 font-mono mt-0.5">
 Protocolo SGP: <span className="font-bold">{ofertaSucesso.protocolo}</span> • Registrado no Pipeline de Vendas
 </p>
 </div>
 </div>
 <button 
 onClick={() => setOfertaSucesso(null)}
 className="text-indigo-700 hover:text-indigo-900 text-xs font-bold p-1"
 >
 ✕
 </button>
 </div>
 )}

 {/* Dados do Cliente Carregado */}
 {cliente ? (
 <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
 
 {/* Card Resumo do Cliente e Plano Contratado */}
 <div className="bg-background border border-border rounded-xl p-4">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
 <div className="flex items-center gap-3">
 <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 font-bold flex items-center justify-center text-sm border border-blue-500/30">
 {cliente.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h4 className="font-bold text-foreground text-sm">{cliente.nome}</h4>
 <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
 cliente.status_cliente === 'ativo' 
 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
 : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
 }`}>
 {cliente.status_cliente}
 </span>
 </div>
 <p className="text-xs text-muted-foreground font-mono mt-0.5">
 CPF/CNPJ: {cliente.cpf_cnpj} • Tel: {cliente.contato.telefone}
 </p>
 </div>
 </div>

 {/* Informações do Plano Contratado Atual */}
 <div className="bg-card px-3.5 py-2.5 rounded-xl border border-border flex items-center gap-4 text-xs ">
 <div>
 <span className="text-[10px] uppercase font-bold text-muted-foreground block leading-tight">
 Plano Contratado
 </span>
 <span className="font-bold text-card-foreground">
 {cliente.plano_atual?.nome || 'Fibra 500MB'}
 </span>
 </div>
 <div className="border-l border-border pl-3">
 <span className="text-[10px] uppercase font-bold text-muted-foreground block leading-tight">
 Mensalidade
 </span>
 <span className="font-bold text-emerald-400">
 R$ {cliente.plano_atual?.valor?.toFixed(2) || '99.90'}/mês
 </span>
 </div>
 <div className="border-l border-border pl-3 hidden sm:block">
 <span className="text-[10px] uppercase font-bold text-muted-foreground block leading-tight">
 Fidelidade
 </span>
 <span className="font-mono text-muted-foreground font-semibold">
 Até {cliente.plano_atual?.fidelidade_fim || '2026-11'}
 </span>
 </div>
 </div>
 </div>

 {/* Barra de Endereço do Cliente, Busca CEP, Mapa e Rota do Técnico */}
 <div className="mt-3 pt-3 border-t border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
 <div className="flex items-center gap-2 min-w-0">
 <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/30 flex items-center justify-center shrink-0">
 <MapPin size={15} />
 </div>
 <div className="truncate">
 <p className="text-card-foreground font-semibold truncate">
 {cliente.endereco || 'Endereço cadastrado no SGP'}
 </p>
 {cliente.ponto_referencia && (
 <p className="text-[11px] text-amber-400 truncate font-medium">
 Ref: {cliente.ponto_referencia}
 </p>
 )}
 </div>
 </div>

 <div className="flex items-center gap-2 shrink-0">
 <button
 type="button"
 onClick={() => setMapModalOpen(true)}
 className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
 title="Ver mapa, consultar CEP ou obter rota do técnico"
 >
 <MapPin size={13} />
 <span>Ver no Mapa / CEP</span>
 </button>

 <button
 type="button"
 onClick={() => setMapModalOpen(true)}
 className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors "
 title="Enviar rota e localização via WhatsApp para o técnico em rota"
 >
 <Share2 size={13} />
 <span>Compartilhar WhatsApp</span>
 </button>
 </div>
 </div>
 </div>

 {/* Navegação de Abas: Financeiro / Ofertas SGP / Conexão */}
 <div className="flex border-b border-border gap-1 text-xs">
 <button
 onClick={() => setActiveTab('financeiro')}
 className={`px-3 py-2 font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
 activeTab === 'financeiro' 
 ? 'border-blue-600 text-blue-600' 
 : 'border-transparent text-muted-foreground hover:text-card-foreground'
 }`}
 >
 <CreditCard size={14} />
 <span>Financeiro do Cliente ({cliente.faturas?.length || 0})</span>
 </button>

 <button
 onClick={() => setActiveTab('planos_ofertas')}
 className={`px-3 py-2 font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
 activeTab === 'planos_ofertas' 
 ? 'border-blue-600 text-blue-600' 
 : 'border-transparent text-muted-foreground hover:text-card-foreground'
 }`}
 >
 <Sparkles size={14} className="text-amber-500" />
 <span>Planos e Ofertas SGP ({cliente.planos_catalogo?.length || 0})</span>
 </button>

 <button
 onClick={() => setActiveTab('conexao')}
 className={`px-3 py-2 font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
 activeTab === 'conexao' 
 ? 'border-blue-600 text-blue-600' 
 : 'border-transparent text-muted-foreground hover:text-card-foreground'
 }`}
 >
 <Wifi size={14} />
 <span>Conexão & Telemetria</span>
 </button>

 <button
 onClick={() => setActiveTab('contrato')}
 className={`px-3 py-2 font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
 activeTab === 'contrato' 
 ? 'border-blue-600 text-blue-600' 
 : 'border-transparent text-muted-foreground hover:text-card-foreground'
 }`}
 >
 <FileText size={14} className="text-purple-600" />
 <span>Contrato & Assinatura Digital</span>
 </button>
 </div>

 {/* Conteúdo Aba 1: Financeiro do Cliente & Enviar 2ª Via */}
 {activeTab === 'financeiro' && (
 <div className="space-y-3">
 <div className="flex items-center justify-between text-xs text-muted-foreground">
 <span className="font-semibold">Histórico de Faturas no SGP</span>
 <span>Vencimento padrão: Dia {cliente.plano_atual?.vencimento_dia || 10}</span>
 </div>

 {cliente.faturas && cliente.faturas.length > 0 ? (
 <div className="divide-y divide-white/5 border border-border rounded-xl overflow-hidden bg-card">
 {cliente.faturas.map((fatura) => (
 <div key={fatura.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-background/70 transition-colors">
 <div className="flex items-start gap-3">
 <div className={`p-2 rounded-lg mt-0.5 ${
 fatura.status === 'pago' 
 ? 'bg-emerald-500/10 text-emerald-400' 
 : fatura.status === 'vencido' 
 ? 'bg-rose-500/10 text-rose-400' 
 : 'bg-amber-500/10 text-amber-400'
 }`}>
 <FileText size={16} />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <span className="font-bold text-foreground text-xs">
 {fatura.fatura_id || `FAT #${fatura.id}`}
 </span>
 <span className="text-muted-foreground">•</span>
 <span className="font-mono text-xs text-muted-foreground font-semibold">
 Ref {fatura.referencia}
 </span>
 <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
 fatura.status === 'pago' 
 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
 : fatura.status === 'vencido' 
 ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
 : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
 }`}>
 {fatura.status === 'pago' ? 'Pago' : fatura.status === 'vencido' ? `Vencido (${fatura.dias_atraso}d)` : 'Em Aberto'}
 </span>
 </div>

 <p className="text-xs text-muted-foreground mt-1">
 Vencimento: <span className="font-semibold text-muted-foreground">{fatura.vencimento}</span> • Valor: <span className="font-bold text-foreground">R$ {fatura.valor.toFixed(2)}</span>
 {fatura.pago_em && (
 <span className="text-emerald-400 font-medium ml-1">({fatura.pago_em})</span>
 )}
 </p>

 {/* Linha Digitável e PIX */}
 {fatura.status !== 'pago' && fatura.pix_copia_cola && (
 <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
 <button
 onClick={() => handleCopyPix(fatura.pix_copia_cola, String(fatura.id))}
 className="flex items-center gap-1 text-muted-foreground hover:text-blue-600 bg-muted hover:bg-blue-500/10 px-2 py-1 rounded border border-border transition-colors"
 title="Copiar PIX Copia e Cola"
 >
 {copiedPixId === String(fatura.id) ? (
 <>
 <Check size={12} className="text-emerald-500" />
 <span className="text-emerald-400 font-bold">PIX Copiado!</span>
 </>
 ) : (
 <>
 <Copy size={12} />
 <span>Copiar Chave PIX</span>
 </>
 )}
 </button>

 {fatura.link_pdf && (
 <a 
 href={fatura.link_pdf} 
 target="_blank" 
 rel="noreferrer"
 className="flex items-center gap-1 text-muted-foreground hover:text-foreground bg-muted px-2 py-1 rounded border border-border"
 >
 <Download size={12} />
 <span>PDF Boleto</span>
 </a>
 )}
 </div>
 )}
 </div>
 </div>

 {/* Botão de Ação Rápida: Enviar 2ª Via */}
 <div className="flex items-center gap-2 self-end sm:self-center">
 <button
 onClick={() => handleEnviarSegundaVia(fatura, 'whatsapp')}
 disabled={enviandoFaturaId === fatura.id}
 className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-102 active:scale-98 disabled:opacity-50"
 title="Enviar 2ª via da fatura diretamente para o WhatsApp do cliente"
 >
 {enviandoFaturaId === fatura.id ? (
 <Loader2 size={13} className="animate-spin" />
 ) : (
 <Send size={13} />
 )}
 <span>Enviar 2ª via</span>
 </button>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="p-8 text-center text-muted-foreground text-xs bg-background rounded-xl border border-border">
 Nenhuma fatura registrada no SGP para este cliente.
 </div>
 )}
 </div>
 )}

 {/* Conteúdo Aba 2: Planos & Registrar Oferta */}
 {activeTab === 'planos_ofertas' && (
 <div className="space-y-3">
 <div className="flex items-center justify-between text-xs text-muted-foreground">
 <span className="font-semibold">Catálogo de Ofertas Disponíveis no SGP</span>
 <span>Upgrade com ativação automática de velocidade</span>
 </div>

 {cliente.planos_catalogo && cliente.planos_catalogo.length > 0 ? (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 {cliente.planos_catalogo.map((plano) => (
 <div 
 key={plano.id} 
 className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
 plano.destaque 
 ? 'bg-blue-500/100/10 border-blue-500/30 ' 
 : 'bg-card border-border hover:border-border'
 }`}
 >
 <div>
 <div className="flex items-start justify-between gap-2 mb-1">
 <h5 className="font-bold text-foreground text-xs sm:text-sm">
 {plano.nome}
 </h5>
 {plano.destaque && (
 <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-full">
 Recomendado
 </span>
 )}
 </div>

 <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
 {plano.descricao}
 </p>

 <div className="flex items-baseline gap-2 mb-3">
 <span className="text-lg font-bold text-foreground">
 R$ {plano.valor.toFixed(2)}
 </span>
 <span className="text-xs text-muted-foreground">/mês</span>
 <span className="text-[11px] text-emerald-400 font-semibold ml-auto font-mono">
 ↓ {plano.download} • ↑ {plano.upload}
 </span>
 </div>
 </div>

 {/* Botão de Ação Rápida: Registrar Oferta de Plano */}
 <button
 onClick={() => handleOpenOfertaModal(plano)}
 disabled={ofertandoPlanoId === plano.id}
 className="w-full py-2 px-3 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:scale-101 active:scale-99 disabled:opacity-50"
 >
 {ofertandoPlanoId === plano.id ? (
 <Loader2 size={13} className="animate-spin" />
 ) : (
 <Sparkles size={13} />
 )}
 <span>Registrar oferta de plano</span>
 </button>
 </div>
 ))}
 </div>
 ) : (
 <div className="p-8 text-center text-muted-foreground text-xs bg-background rounded-xl border border-border">
 Nenhum plano promocional disponível no momento.
 </div>
 )}
 </div>
 )}

 {/* Conteúdo Aba 3: Conexão e Telemetria */}
 {activeTab === 'conexao' && cliente.conexao && (
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
 <div className="p-3 bg-background rounded-xl border border-border">
 <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Status Radius/PPPoE</span>
 <span className="font-bold text-emerald-400 flex items-center gap-1">
 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
 {cliente.conexao.status}
 </span>
 </div>
 <div className="p-3 bg-background rounded-xl border border-border">
 <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Sinal Óptico (ONU)</span>
 <span className="font-bold text-card-foreground font-mono">
 {cliente.conexao.sinal_optico}
 </span>
 </div>
 <div className="p-3 bg-background rounded-xl border border-border">
 <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Uptime de Conexão</span>
 <span className="font-bold text-card-foreground font-mono">
 {cliente.conexao.uptime}
 </span>
 </div>
 <div className="p-3 bg-background rounded-xl border border-border col-span-2 sm:col-span-2">
 <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">OLT / PON / Porta CTO</span>
 <span className="font-bold text-card-foreground font-mono text-[11px]">
 {cliente.conexao.olt_pon}
 </span>
 </div>
 <div className="p-3 bg-background rounded-xl border border-border">
 <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Concentrador BNG</span>
 <span className="font-bold text-card-foreground font-mono">
 {cliente.conexao.concentrador}
 </span>
 </div>
 </div>
 )}

 {/* Conteúdo Aba 4: Contrato & Assinatura Digital */}
 {activeTab === 'contrato' && (
 <div className="space-y-4 text-xs">
 <div className="p-4 bg-card rounded-2xl border border-border space-y-3">
 <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
 <div>
 <span className="text-[10px] uppercase font-bold text-muted-foreground block">Instrumento Contratual SCM</span>
 <span className="text-base font-bold text-foreground font-mono">CTR-2026-8894</span>
 </div>
 <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold">
 <ShieldCheck size={14} className="text-emerald-500" /> Assinado Digitalmente
 </span>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <div className="p-2.5 bg-background rounded-xl border border-border">
 <span className="text-[10px] text-muted-foreground font-bold block">EQUIPAMENTO COMODATO</span>
 <span className="font-bold text-card-foreground">ONT Wi-Fi 6 Gigabit (ZTE)</span>
 <span className="text-[10px] text-muted-foreground block font-mono">MAC: 48:D2:24:F8:91:A0</span>
 </div>
 <div className="p-2.5 bg-background rounded-xl border border-border">
 <span className="text-[10px] text-muted-foreground font-bold block">DATA DE ADESÃO</span>
 <span className="font-bold text-card-foreground">12/09/2026 10:14</span>
 <span className="text-[10px] text-muted-foreground block">IP: 177.67.240.12</span>
 </div>
 <div className="p-2.5 bg-background rounded-xl border border-border">
 <span className="text-[10px] text-muted-foreground font-bold block">CLÁUSULA FIDELIDADE</span>
 <span className="font-bold text-card-foreground">12 Meses (Isenção)</span>
 <span className="text-[10px] text-emerald-500 font-semibold block">Válido até 12/09/2027</span>
 </div>
 </div>

 {contratoDisparadoSucesso && (
 <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center justify-between">
 <span className="flex items-center gap-2">
 <CheckCircle2 size={16} className="text-emerald-500" />
 Link de assinatura e via em PDF enviados com sucesso para o WhatsApp do cliente!
 </span>
 <button 
 onClick={() => setContratoDisparadoSucesso(false)}
 className="text-emerald-300 font-bold hover:underline"
 >
 Fechar
 </button>
 </div>
 )}

 <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
 <button
 type="button"
 onClick={() => setContratoModalOpen(true)}
 className="px-4 py-2 bg-card hover:bg-muted text-foreground rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
 >
 <FileText size={14} /> Visualizar Minuta SCM & Termo Comodato
 </button>

 <button
 type="button"
 disabled={disparandoContratoWhatsApp}
 onClick={() => {
 setDisparandoContratoWhatsApp(true);
 setTimeout(() => {
 setDisparandoContratoWhatsApp(false);
 setContratoDisparadoSucesso(true);
 }, 1200);
 }}
 className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
 >
 {disparandoContratoWhatsApp ? (
 <>
 <Loader2 size={14} className="animate-spin" />
 <span>Disparando WhatsApp...</span>
 </>
 ) : (
 <>
 <Share2 size={14} />
 <span>Reenviar Contrato via WhatsApp</span>
 </>
 )}
 </button>
 </div>
 </div>
 </div>
 )}

 </div>
 ) : (
 <div className="p-12 text-center text-muted-foreground text-xs">
 <Loader2 size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
 <span>Consultando base de assinantes SGP...</span>
 </div>
 )}

 {/* Modal para Confirmar Registro de Oferta no SGP */}
 {ofertaModalOpen && selectedPlanoParaOferta && cliente && (
 <div className="fixed inset-0 bg-card/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
 <div className="bg-card rounded-2xl border border-border max-w-md w-full p-5 sm:p-6 space-y-4">
 
 <div className="flex items-start justify-between">
 <div className="flex items-center gap-2">
 <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
 <Sparkles size={18} />
 </div>
 <div>
 <h4 className="text-base font-bold text-foreground font-outfit">
 Registrar Oferta Oficial no SGP
 </h4>
 <p className="text-xs text-muted-foreground">
 Gera protocolo no ERP e adiciona card no Kanban de Vendas
 </p>
 </div>
 </div>
 <button
 onClick={() => setOfertaModalOpen(false)}
 className="text-muted-foreground hover:text-muted-foreground p-1"
 >
 ✕
 </button>
 </div>

 {/* Detalhes do Plano Ofertado */}
 <div className="p-3.5 bg-background border border-border rounded-xl space-y-2 text-xs">
 <div className="flex justify-between items-center">
 <span className="text-muted-foreground font-semibold">Cliente:</span>
 <span className="font-bold text-card-foreground">{cliente.nome}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-muted-foreground font-semibold">Plano Atual:</span>
 <span className="text-muted-foreground font-mono">{cliente.plano_atual?.nome} (R$ {cliente.plano_atual?.valor?.toFixed(2)})</span>
 </div>
 <div className="flex justify-between items-center border-t border-border pt-2">
 <span className="text-blue-400 font-bold">Novo Plano Ofertado:</span>
 <span className="font-bold text-blue-400">{selectedPlanoParaOferta.nome}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-muted-foreground font-semibold">Novo Valor Mensal:</span>
 <span className="font-bold text-emerald-400 text-sm">R$ {selectedPlanoParaOferta.valor.toFixed(2)}/mês</span>
 </div>
 </div>

 {/* Observação para o Histórico */}
 <div>
 <label className="block text-xs font-bold text-muted-foreground mb-1">
 Observações do Atendente para o SGP
 </label>
 <textarea
 value={ofertaObservacao}
 onChange={(e) => setOfertaObservacao(e.target.value)}
 rows={3}
 className="w-full p-2.5 bg-card border border-border rounded-xl text-xs text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600"
 placeholder="Ex: Cliente aceitou proposta verbal, aguardando envio do aditivo..."
 />
 </div>

 {/* Botões de Ação */}
 <div className="flex gap-2 pt-2">
 <button
 type="button"
 onClick={() => setOfertaModalOpen(false)}
 className="flex-1 py-2.5 bg-muted hover:bg-slate-200 text-muted-foreground rounded-xl text-xs font-bold transition-colors"
 >
 Cancelar
 </button>
 <button
 type="button"
 onClick={handleConfirmarRegistroOferta}
 disabled={ofertandoPlanoId === selectedPlanoParaOferta.id}
 className="flex-1 py-2.5 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 -700/20"
 >
 {ofertandoPlanoId === selectedPlanoParaOferta.id ? (
 <Loader2 size={14} className="animate-spin" />
 ) : (
 <Check size={14} />
 )}
 <span>Confirmar no SGP</span>
 </button>
 </div>

 </div>
 </div>
 )}

 {/* Modal de Mapa, Busca de CEP e Compartilhamento com Técnicos */}
 {cliente && (
 <AddressMapModal
 isOpen={mapModalOpen}
 onClose={() => setMapModalOpen(false)}
 cliente={{
 id: cliente.id,
 nome: cliente.nome,
 telefone: cliente.contato?.telefone,
 endereco: cliente.endereco,
 logradouro: cliente.logradouro,
 numero: cliente.numero,
 complemento: cliente.complemento,
 bairro: cliente.bairro,
 cidade: cliente.cidade,
 uf: cliente.uf,
 cep: cliente.cep,
 ponto_referencia: cliente.ponto_referencia,
 coordenadas: cliente.coordenadas
 }}
 onAddressUpdated={(novo) => {
 setCliente({
 ...cliente,
 ...novo,
 id: cliente.id,
 endereco: novo.endereco || cliente.endereco,
 ponto_referencia: novo.ponto_referencia || cliente.ponto_referencia,
 coordenadas: novo.coordenadas || cliente.coordenadas
 } as SgpClienteCompleto);
 }}
 />
 )}

 {/* Modal de Contrato SCM & Assinatura Digital */}
 {cliente && (
 <PortalContratoModal
 isOpen={contratoModalOpen}
 onClose={() => setContratoModalOpen(false)}
 cliente={{
 nome: cliente.nome,
 cpf: cliente.cpf_cnpj,
 contrato: 'CTR-2026-8894',
 plano: cliente.plano_atual?.nome || 'Fibra 500MB',
 endereco: cliente.endereco
 }}
 />
 )}

 </div>
 );
}
