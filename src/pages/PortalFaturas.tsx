import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle2, Clock, Download, QrCode, Loader2, Copy, Zap, ShieldCheck, AlertCircle, Sparkles, Check } from 'lucide-react';

export default function PortalFaturas() {
 const [faturas, setFaturas] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [desbloqueioLoading, setDesbloqueioLoading] = useState(false);
 const [desbloqueioAtivo, setDesbloqueioAtivo] = useState(false);
 const [desbloqueioMsg, setDesbloqueioMsg] = useState<string | null>(null);
 const [copiedLinha, setCopiedLinha] = useState<number | null>(null);
 
 // State variables for generating transaction codes
 const [actionStates, setActionStates] = useState<Record<number, { type: 'pix' | 'boleto', status: 'loading' | 'success', data?: string }>>({});

 useEffect(() => {
 const fetchFaturasReal = async () => {
 setLoading(true);
 setError(null);
 try {
 const res = await fetch('/api/erp/faturas');
 if (!res.ok) {
 throw new Error('Falha ao consultar faturas no ERP/Banco.');
 }
 const data = await res.json();
 if (Array.isArray(data)) {
 setFaturas(data);
 } else {
 setError("Não foi possível consultar suas faturas no momento. Tente novamente mais tarde.");
 }
 } catch (err) {
 setError("Não foi possível consultar suas faturas no momento. Tente novamente mais tarde.");
 } finally {
 setLoading(false);
 }
 };

 fetchFaturasReal();

 // Checar se já há desbloqueio ativo salvo na sessão
 const salvo = localStorage.getItem('nap_desbloqueio_24h') || localStorage.getItem('nap_desbloqueio_48h');
 if (salvo) {
 const expira = new Date(salvo);
 if (expira > new Date()) {
 setDesbloqueioAtivo(true);
 } else {
 localStorage.removeItem('nap_desbloqueio_24h');
 localStorage.removeItem('nap_desbloqueio_48h');
 }
 }
 }, []);

 const faturaPendente = faturas.find(f => f.status === 'pendente');

 const handleSolicitarDesbloqueio = async () => {
 setDesbloqueioLoading(true);
 setDesbloqueioMsg(null);
 try {
 const res = await fetch('/api/erp/desbloqueio-confianca/1001', { method: 'POST' });
 const data = await res.json();
 if (data.success) {
 const dataExpiracao = new Date(Date.now() + 24 * 60 * 60 * 1000);
 localStorage.setItem('nap_desbloqueio_24h', dataExpiracao.toISOString());
 setDesbloqueioAtivo(true);
 setDesbloqueioMsg("Desbloqueio em confiança realizado! Sua conexão foi reativada no concentrador por 24 horas.");
 }
 } catch {
 setDesbloqueioMsg("Erro ao processar desbloqueio no concentrador.");
 } finally {
 setDesbloqueioLoading(false);
 }
 };

 const handleGeneratePix = async (id: number) => {
 setActionStates(prev => ({ ...prev, [id]: { type: 'pix', status: 'loading' } }));
 try {
 const response = await fetch(`/api/erp/pix/${id}`, { method: 'POST' });
 const data = await response.json();
 setActionStates(prev => ({ ...prev, [id]: { type: 'pix', status: 'success', data: data.codigo_pix } }));
 } catch {
 setActionStates(prev => ({ ...prev, [id]: { type: 'pix', status: 'success', data: 'Erro ao gerar PIX' } }));
 }
 };

 const handleGenerateBoleto = async (id: number) => {
 setActionStates(prev => ({ ...prev, [id]: { type: 'boleto', status: 'loading' } }));
 try {
 const response = await fetch(`/api/erp/boleto/${id}`, { method: 'POST' });
 const data = await response.json();
 // Open boleto
 window.open(data.url_pdf, '_blank');
 setActionStates(prev => ({ ...prev, [id]: { type: 'boleto', status: 'success', data: 'Boleto gerado' } }));
 
 // Auto clear state after a while
 setTimeout(() => setActionStates(prev => { const next = {...prev}; delete next[id]; return next; }), 3000);
 } catch {
 setActionStates(prev => ({ ...prev, [id]: { type: 'boleto', status: 'success', data: 'Erro ao baixar boleto.' } }));
 setTimeout(() => setActionStates(prev => { const next = {...prev}; delete next[id]; return next; }), 3000);
 }
 };

 const handleCopyLinhaDigitavel = (id: number) => {
 const fatura = faturas.find(f => f.id === id || String(f.id) === String(id));
 const linha = fatura?.linhaDigitavel || fatura?.pixCopiaECola || '';
 if (linha) {
 navigator.clipboard.writeText(linha);
 setCopiedLinha(id);
 setTimeout(() => setCopiedLinha(null), 2500);
 }
 };

 const [pixCopiedLocal, setPixCopiedLocal] = useState(false);

 const copyPixCode = (text: string) => {
 navigator.clipboard.writeText(text);
 setPixCopiedLocal(true);
 setTimeout(() => setPixCopiedLocal(false), 2500);
 };

 return (
 <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
 <div className="mb-6 md:mb-8">
 <h1 className="text-2xl md:text-3xl font-bold text-foreground font-outfit mb-2">Faturas</h1>
 <p className="text-muted-foreground text-sm md:text-base">Histórico financeiro e pagamentos pendentes.</p>
 </div>

 {/* BANNER DE DESBLOQUEIO EM CONFIANÇA */}
 {desbloqueioAtivo ? (
 <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 animate-in fade-in">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
 <ShieldCheck size={22} />
 </div>
 <div>
 <p className="text-xs font-bold text-emerald-950">Desbloqueio em Confiança Ativo (24 Horas)</p>
 <p className="text-[11px] text-emerald-800">Sua navegação foi liberada em alta velocidade no concentrador Radius/PPPoE.</p>
 </div>
 </div>
 <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-3 py-1 rounded-full uppercase tracking-wider shrink-0">
 Liberado
 </span>
 </div>
 ) : faturaPendente ? (
 <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
 <Zap size={22} />
 </div>
 <div>
 <p className="text-xs font-bold text-amber-950">Conexão Reduzida ou com Aviso de Débito?</p>
 <p className="text-[11px] text-amber-800">Você tem direito a 1 liberação temporária de 24 horas enquanto processa o pagamento da sua fatura.</p>
 </div>
 </div>
 <button
 onClick={handleSolicitarDesbloqueio}
 disabled={desbloqueioLoading}
 className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-sm disabled:opacity-50 active:scale-95"
 >
 {desbloqueioLoading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
 Desbloquear por 24h
 </button>
 </div>
 ) : null}

 {desbloqueioMsg && (
 <div className="mb-6 p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium rounded-xl flex items-center gap-2 animate-in fade-in">
 <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
 {desbloqueioMsg}
 </div>
 )}

 {error && (
 <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
 <AlertCircle size={20} className="shrink-0" />
 <span>{error}</span>
 </div>
 )}

 {loading ? (
 <div className="flex justify-center p-8 text-muted-foreground">Carregando faturas...</div>
 ) : error ? null : (
 <div className="bg-card rounded-3xl border border-border overflow-hidden relative">
 <div className="divide-y divide-slate-200 relative z-10">
 {faturas.map(fatura => (
 <div key={fatura.id} className="p-5 md:p-6 hover:bg-slate-100/40 transition-colors group">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-3">
 <div className="flex items-start gap-4">
 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${
 fatura.status === 'pago' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200 group-hover:bg-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-200 group-hover:bg-amber-500/20'
 }`}>
 <FileText size={22} />
 </div>
 <div>
 <h3 className="font-bold text-foreground font-outfit">Mensalidade - Fibra 500MB</h3>
 <p className="text-sm text-muted-foreground mb-2 font-medium">
 Vencimento: {new Date(fatura.vencimento).toLocaleDateString('pt-BR')}
 </p>
 <div className="flex items-center gap-2">
 {fatura.status === 'pago' ? (
 <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-200 px-2.5 py-1 rounded-md">
 <CheckCircle2 size={12} /> Pago
 </span>
 ) : (
 <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-amber-600 bg-amber-500/10 border border-amber-200 px-2.5 py-1 rounded-md">
 <Clock size={12} /> Pendente
 </span>
 )}
 {fatura.status === 'pendente' && (
 <button
 onClick={() => handleCopyLinhaDigitavel(fatura.id)}
 className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 transition-colors"
 >
 <Copy size={11} /> {copiedLinha === fatura.id ? "Linha Copiada!" : "Copiar Código de Barras"}
 </button>
 )}
 </div>
 </div>
 </div>

 <div className="flex flex-col items-end gap-4 w-full md:w-auto mt-2 md:mt-0">
 <div className="text-2xl font-bold text-foreground font-outfit">
 <span className="text-lg text-muted-foreground">R$</span> {fatura.valor.toFixed(2).replace('.', ',')}
 </div>
 
 {fatura.status === 'pendente' && (
 <div className="flex gap-2 w-full md:w-auto">
 <button 
 onClick={() => handleGeneratePix(fatura.id)}
 disabled={actionStates[fatura.id]?.status === 'loading'}
 className="flex-1 md:flex-none bg-blue-700 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100"
 >
 {actionStates[fatura.id]?.type === 'pix' && actionStates[fatura.id]?.status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
 PIX
 </button>
 <button 
 onClick={() => handleGenerateBoleto(fatura.id)}
 disabled={actionStates[fatura.id]?.status === 'loading'}
 className="flex-1 md:flex-none bg-background hover:bg-slate-100 border border-border text-muted-foreground px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100"
 >
 {actionStates[fatura.id]?.type === 'boleto' && actionStates[fatura.id]?.status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
 Boleto
 </button>
 </div>
 )}
 {fatura.status === 'pago' && (
 <button 
 onClick={() => handleGenerateBoleto(fatura.id)}
 className="w-full md:w-auto bg-background hover:bg-slate-100 border border-border text-muted-foreground px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
 >
 <Download size={16} /> Recibo
 </button>
 )}
 </div>
 </div>

 {/* Área de exibição do PIX */}
 {actionStates[fatura.id]?.type === 'pix' && actionStates[fatura.id]?.status === 'success' && actionStates[fatura.id]?.data && (
 <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-2xl animate-in fade-in zoom-in-95">
 <p className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">Código PIX Copia e Cola:</p>
 <div className="flex items-center gap-2">
 <input 
 readOnly 
 value={actionStates[fatura.id]?.data} 
 className="flex-1 bg-card border border-blue-200 rounded-xl p-3 text-xs text-blue-900 outline-none font-mono focus:ring-2 focus:ring-blue-600/50 transition-all"
 />
 <button 
 onClick={() => copyPixCode(actionStates[fatura.id]?.data!)}
 className={`${pixCopiedLocal ? 'bg-emerald-600' : 'bg-blue-700 hover:bg-blue-600'} text-white p-3 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shrink-0`}
 >
 {pixCopiedLocal ? <Check size={16} /> : <Copy size={16} />}
 </button>
 </div>
 </div>
 )}
 </div>
 ))}
 
 {faturas.length === 0 && (
 <div className="p-8 text-center text-muted-foreground">
 Nenhuma fatura encontrada.
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 );
}
