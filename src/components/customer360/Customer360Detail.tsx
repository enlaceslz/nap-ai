import React, { useState } from 'react';
import { 
  User, CreditCard, Wifi, Headphones, Activity, Clock, 
  CheckCircle2, AlertTriangle, XCircle, Copy, Check, QrCode, 
  RefreshCw, Power, MessageSquare, PhoneCall, ShieldCheck, 
  ExternalLink, Layers, Database, ArrowLeft, Send, Sparkles, Terminal
} from 'lucide-react';
import type { NapCustomer360, NapInvoice, NapCustomerEvent } from '../../types';

interface Props {
  customer: NapCustomer360;
  onBack: () => void;
  onRefresh: () => void;
  onSimulatePayment: (txid: string, amount: number) => Promise<void>;
  onRebootOnu: () => Promise<void>;
  onGeneratePix: (amount: number, dueDate: string) => Promise<void>;
}

export default function Customer360Detail({
  customer,
  onBack,
  onRefresh,
  onSimulatePayment,
  onRebootOnu,
  onGeneratePix
}: Props) {
  const [activeTab, setActiveTab] = useState<'contrato' | 'financeiro' | 'rede' | 'atendimento' | 'noc' | 'timeline'>('timeline');
  const [copiedTxid, setCopiedTxid] = useState<string | null>(null);
  const [copiedPix, setCopiedPix] = useState<string | null>(null);
  const [isRebooting, setIsRebooting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixAmount, setPixAmount] = useState('100.00');
  const [pixDueDate, setPixDueDate] = useState(new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0]);
  const [selectedInvoice, setSelectedInvoice] = useState<NapInvoice | null>(
    customer.financial.invoices[0] || null
  );

  const copyToClipboard = (text: string, type: 'txid' | 'pix' | 'id') => {
    navigator.clipboard.writeText(text);
    if (type === 'txid') {
      setCopiedTxid(text);
      setTimeout(() => setCopiedTxid(null), 2500);
    } else if (type === 'pix') {
      setCopiedPix(text);
      setTimeout(() => setCopiedPix(null), 2500);
    }
  };

  const handleReboot = async () => {
    if (confirm(`Confirmar comando seguro de reinicialização remota (TR-069) para a ONT ${customer.technical.onuSerial}?`)) {
      setIsRebooting(true);
      await onRebootOnu();
      setTimeout(() => {
        setIsRebooting(false);
        onRefresh();
      }, 1500);
    }
  };

  const handleSimulatePayment = async (inv: NapInvoice) => {
    if (!inv.txid) return;
    setIsSimulating(true);
    await onSimulatePayment(inv.txid, inv.amount);
    setIsSimulating(false);
    onRefresh();
  };

  const handleCreatePix = async (e: React.FormEvent) => {
    e.preventDefault();
    await onGeneratePix(parseFloat(pixAmount) || 100, pixDueDate);
    setShowPixModal(false);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Botão Voltar & Barra Superior */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft size={14} /> Voltar para a Base de Assinantes
        </button>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
        >
          <RefreshCw size={13} /> Sincronizar Agora
        </button>
      </div>

      {/* Cartão de Identificação Principal (Header 360) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold font-outfit text-foreground">
                {customer.name}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                customer.status === 'active' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {customer.status === 'active' ? (
                  <CheckCircle2 size={12} className="text-emerald-400" />
                ) : (
                  <AlertTriangle size={12} className="text-amber-400" />
                )}
                {customer.status === 'active' ? 'ACESSO ATIVO' : 'BLOQUEADO'}
              </span>

              {/* Badges de ERP Vinculado */}
              {customer.externalReferences.map(ref => (
                <span
                  key={ref.externalSystem}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20"
                >
                  {ref.externalSystem}: ID {ref.externalCustomerId}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 flex-wrap">
              <span>CPF/CNPJ: <strong className="text-slate-300 font-mono">{customer.document}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                ID NAP: 
                <strong className="text-blue-400 font-mono">{customer.napCustomerId}</strong>
                <button 
                  onClick={() => copyToClipboard(customer.napCustomerId, 'id')}
                  className="text-slate-400 hover:text-slate-200 ml-0.5"
                  title="Copiar ID NAP"
                >
                  <Copy size={11} />
                </button>
              </span>
              <span>•</span>
              <span>Tel: <strong className="text-slate-300">{customer.phone}</strong></span>
              <span>•</span>
              <span>Plano: <strong className="text-slate-300">{customer.contract.planName}</strong></span>
            </div>
          </div>

          {/* Ações Rápidas do Operador */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowPixModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition shadow-sm"
            >
              <CreditCard size={14} />
              Gerar Pix Enlace-Pay
            </button>
            <button
              onClick={handleReboot}
              disabled={isRebooting}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-red-600/80 text-slate-200 hover:text-white rounded-lg text-xs font-medium transition shadow-sm disabled:opacity-50"
              title="Reiniciar ONT remotamente via GenieACS TR-069"
            >
              <Power size={14} className={isRebooting ? "animate-spin text-red-400" : ""} />
              {isRebooting ? "Reiniciando..." : "Reboot ONT (TR-069)"}
            </button>
          </div>
        </div>
      </div>

      {/* Navegação por Abas do Customer 360 */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition border-b-2 whitespace-nowrap ${
            activeTab === 'timeline'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock size={14} />
          Customer Timeline Unificada ({customer.timeline.length})
        </button>

        <button
          onClick={() => setActiveTab('financeiro')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition border-b-2 whitespace-nowrap ${
            activeTab === 'financeiro'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <CreditCard size={14} />
          Financeiro & Enlace-Pay ({customer.financial.invoices.length})
        </button>

        <button
          onClick={() => setActiveTab('contrato')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition border-b-2 whitespace-nowrap ${
            activeTab === 'contrato'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <User size={14} />
          Ficha Geral & Contrato
        </button>

        <button
          onClick={() => setActiveTab('rede')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition border-b-2 whitespace-nowrap ${
            activeTab === 'rede'
              ? 'border-sky-500 text-sky-400 bg-sky-500/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Wifi size={14} />
          Rede, OLT & ONT (TR-069)
        </button>

        <button
          onClick={() => setActiveTab('atendimento')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition border-b-2 whitespace-nowrap ${
            activeTab === 'atendimento'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Headphones size={14} />
          Atendimento & WABA ({customer.support.tickets.length})
        </button>

        <button
          onClick={() => setActiveTab('noc')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition border-b-2 whitespace-nowrap ${
            activeTab === 'noc'
              ? 'border-purple-500 text-purple-400 bg-purple-500/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Activity size={14} />
          NOC & Monitoramento Zabbix
        </button>
      </div>

      {/* CONTEÚDO DAS ABAS */}

      {/* ABA 1: TIMELINE OPERACIONAL UNIFICADA (PRD SEÇÃO 15 & 16) */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock size={16} className="text-blue-400" />
                Linha do Tempo Operacional Completa
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Eventos em ordem cronológica reversa unificando Faturamento, Pix C6, TR-069, Zabbix, WABA e ERP.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono">
              Total: {customer.timeline.length} eventos
            </span>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
            <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-6">
              {customer.timeline.map((evt, idx) => {
                let badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                let icon = <Clock size={14} />;

                if (evt.eventType.includes('PAYMENT')) {
                  badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                  icon = <CreditCard size={14} />;
                } else if (evt.eventType.includes('ERP')) {
                  badgeColor = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
                  icon = <Database size={14} />;
                } else if (evt.eventType.includes('ONU')) {
                  badgeColor = evt.eventType === 'ONU_ONLINE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20';
                  icon = <Wifi size={14} />;
                } else if (evt.eventType.includes('WHATSAPP')) {
                  badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                  icon = <MessageSquare size={14} />;
                } else if (evt.eventType.includes('TICKET')) {
                  badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                  icon = <Headphones size={14} />;
                }

                return (
                  <div key={evt.id || idx} className="relative group">
                    {/* Marcador na Linha */}
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-blue-500 flex items-center justify-center group-hover:scale-125 transition" />

                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5 hover:border-slate-700 transition">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1 ${badgeColor}`}>
                            {icon}
                            {evt.eventType}
                          </span>
                          <span className="text-xs font-semibold text-slate-200">
                            Fonte: {evt.source}
                          </span>
                          {evt.referenceId && (
                            <span className="text-xs text-muted-foreground font-mono">
                              Ref: {evt.referenceId}
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-muted-foreground font-mono">
                          {new Date(evt.occurredAt).toLocaleString('pt-BR')}
                        </span>
                      </div>

                      {/* Metadados do Evento */}
                      {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-900">
                          <div className="text-[11px] font-mono text-slate-400 bg-slate-900/60 rounded px-2.5 py-1.5 overflow-x-auto">
                            {JSON.stringify(evt.metadata, null, 2)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: FINANCEIRO & ENLACE-PAY (PRD SEÇÃO 9, 10, 11, 12, 13) */}
      {activeTab === 'financeiro' && (
        <div className="space-y-6">
          {/* Resumo Financeiro */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-muted-foreground">Total Pendente</span>
              <div className="text-2xl font-bold font-outfit text-amber-400 mt-1">
                R$ {customer.financial.totalPending.toFixed(2)}
              </div>
              <span className="text-[11px] text-muted-foreground">
                {customer.financial.invoices.filter(i => i.status === 'open').length} fatura(s) em aberto
              </span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-muted-foreground">Total Quitado (Mês)</span>
              <div className="text-2xl font-bold font-outfit text-emerald-400 mt-1">
                R$ {customer.financial.totalPaid.toFixed(2)}
              </div>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={11} /> Confirmado via Enlace-Pay
              </span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-muted-foreground">Risco de Inadimplência</span>
              <div className="text-2xl font-bold font-outfit text-foreground mt-1 capitalize">
                {customer.financial.defaultRisk}
              </div>
              <span className="text-[11px] text-muted-foreground">
                Score baseado no histórico ERP
              </span>
            </div>
          </div>

          {/* Tabela de Faturas */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Faturas & Cobranças Pix (Enlace-Pay)
              </h3>
              <button
                onClick={() => setShowPixModal(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
              >
                + Nova Cobrança Pix
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-muted-foreground">
                    <th className="py-3 px-4 font-semibold">ID Fatura NAP</th>
                    <th className="py-3 px-4 font-semibold">Ref. ERP</th>
                    <th className="py-3 px-4 font-semibold">Valor</th>
                    <th className="py-3 px-4 font-semibold">Vencimento</th>
                    <th className="py-3 px-4 font-semibold">Status Pagamento</th>
                    <th className="py-3 px-4 font-semibold">Baixa no ERP</th>
                    <th className="py-3 px-4 font-semibold text-right">Ação / Pix</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {customer.financial.invoices.map(inv => (
                    <tr 
                      key={inv.id} 
                      className={`hover:bg-slate-800/30 transition cursor-pointer ${
                        selectedInvoice?.id === inv.id ? 'bg-blue-500/5' : ''
                      }`}
                      onClick={() => setSelectedInvoice(inv)}
                    >
                      <td className="py-3 px-4 font-mono font-medium text-slate-200">
                        {inv.napInvoiceId}
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        {inv.externalSystem.toUpperCase()}: #{inv.externalInvoiceId}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-100">
                        R$ {Number(inv.amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(inv.dueDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          inv.status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {inv.status === 'paid' ? 'PAGO' : 'ABERTO'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          inv.erpBaixaStatus === 'posted'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {inv.erpBaixaStatus === 'posted' ? 'BAIXADO NO ERP' : 'NA FILA (RETRY)'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {inv.status === 'open' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSimulatePayment(inv);
                            }}
                            disabled={isSimulating}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-medium transition shadow-sm"
                          >
                            Simular Baixa Webhook
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-mono">
                            {inv.erpBaixaId || 'Confirmado'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detalhes da Cobrança Pix Selecionada */}
          {selectedInvoice && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <QrCode size={16} className="text-emerald-400" />
                Dados Técnicos do Pix Enlace-Pay (Fatura {selectedInvoice.napInvoiceId})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-muted-foreground block">TXID Oficial (Banco Central):</span>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        readOnly
                        value={selectedInvoice.txid || 'N/A'}
                        className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-slate-200 w-full focus:outline-none"
                      />
                      {selectedInvoice.txid && (
                        <button
                          onClick={() => copyToClipboard(selectedInvoice.txid!, 'txid')}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded transition"
                        >
                          {copiedTxid === selectedInvoice.txid ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground block">Pix Copia e Cola (EMV):</span>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        readOnly
                        value={selectedInvoice.pixCopiaECola || 'N/A'}
                        className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-slate-200 w-full focus:outline-none"
                      />
                      {selectedInvoice.pixCopiaECola && (
                        <button
                          onClick={() => copyToClipboard(selectedInvoice.pixCopiaECola!, 'pix')}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded transition"
                        >
                          {copiedPix === selectedInvoice.pixCopiaECola ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gateway de Cobrança:</span>
                    <span className="font-semibold text-slate-200">Enlace-Pay / Cobranca-API</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Instituição Liquidante:</span>
                    <span className="font-semibold text-slate-200">C6 Bank S.A.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status no ERP:</span>
                    <span className="font-semibold text-blue-400">
                      {selectedInvoice.erpBaixaStatus === 'posted' ? 'Quitado Oficialmente' : 'Pendente de Sincronização'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chave de Idempotência:</span>
                    <span className="font-mono text-[11px] text-slate-400">{selectedInvoice.txid}_C6</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABA 3: FICHA GERAL & CONTRATO */}
      {activeTab === 'contrato' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dados Cadastrais */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <User size={15} className="text-blue-400" />
              1. Dados Cadastrais do Assinante
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-muted-foreground">Nome Completo:</span>
                <span className="font-semibold text-slate-200">{customer.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-muted-foreground">CPF/CNPJ:</span>
                <span className="font-mono text-slate-200">{customer.document}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-muted-foreground">E-mail:</span>
                <span className="text-slate-200">{customer.email}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-muted-foreground">Telefone Principal:</span>
                <span className="text-slate-200">{customer.phone}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-muted-foreground">WhatsApp:</span>
                <span className="text-emerald-400 font-mono">+{customer.whatsapp}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-muted-foreground">Endereço de Instalação:</span>
                <span className="text-slate-200 text-right max-w-xs">{customer.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data de Cadastro:</span>
                <span className="text-slate-200">{new Date(customer.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>

          {/* Dados do Contrato Operacional */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Database size={15} className="text-emerald-400" />
              2. Contrato & Plano Comercial
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-muted-foreground">Número do Contrato:</span>
                <span className="font-mono font-semibold text-blue-400">{customer.contract.contractId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-muted-foreground">Plano Contratado:</span>
                <span className="font-semibold text-slate-200">{customer.contract.planName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-muted-foreground">Velocidade Download:</span>
                <span className="font-mono text-emerald-400">{customer.contract.speedDown}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-muted-foreground">Velocidade Upload:</span>
                <span className="font-mono text-emerald-400">{customer.contract.speedUp}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-muted-foreground">Mensalidade:</span>
                <span className="font-semibold text-slate-200">R$ {customer.contract.monthlyPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-muted-foreground">Equipamento (Comodato):</span>
                <span className="text-slate-200 text-right max-w-xs">{customer.contract.equipment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data de Ativação:</span>
                <span className="text-slate-200">{new Date(customer.contract.installDate).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 4: REDE, OLT & ONT (TR-069) */}
      {activeTab === 'rede' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Topologia e OLT */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Wifi size={15} className="text-sky-400" />
              Topologia de Acesso & OLT
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-muted-foreground">OLT Designada:</span>
                <span className="font-mono font-semibold text-slate-200">{customer.technical.olt}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-muted-foreground">Porta PON:</span>
                <span className="font-mono text-sky-400">{customer.technical.pon}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-muted-foreground">VLAN de Serviço:</span>
                <span className="font-mono text-slate-200">{customer.technical.vlan}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-muted-foreground">Usuário PPPoE:</span>
                <span className="font-mono text-slate-200">{customer.technical.pppoeUser}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IP PPPoE Dinâmico:</span>
                <span className="font-mono text-emerald-400 font-semibold">{customer.technical.ipPppoe}</span>
              </div>
            </div>
          </div>

          {/* Telemetria TR-069 (GenieACS) */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Activity size={15} className="text-emerald-400" />
                Telemetria Óptica & ONT (TR-069)
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                customer.technical.onuState === 'online'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {customer.technical.onuState}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-muted-foreground">Serial da ONT (PON):</span>
                <span className="font-mono font-semibold text-slate-200">{customer.technical.onuSerial}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-muted-foreground">MAC Address:</span>
                <span className="font-mono text-slate-300">{customer.technical.onuMac}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-muted-foreground">Potência Óptica RX:</span>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  {customer.technical.opticalPowerRx} (Excelente)
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-muted-foreground">Potência Óptica TX:</span>
                <span className="font-mono text-slate-200 font-semibold">{customer.technical.opticalPowerTx}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uptime da ONT:</span>
                <span className="text-slate-200">{customer.technical.uptime}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleReboot}
                disabled={isRebooting}
                className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
              >
                <Power size={13} className={isRebooting ? "animate-spin text-red-400" : ""} />
                {isRebooting ? "Disparando Reboot via TR-069..." : "Reiniciar ONT (Comando Seguro TR-069)"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ABA 5: ATENDIMENTO & WABA */}
      {activeTab === 'atendimento' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chamados Help Desk */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Headphones size={15} className="text-indigo-400" />
              Chamados de Suporte (Zammad Engine)
            </h3>

            {customer.support.tickets.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Nenhum chamado registrado para este assinante.</p>
            ) : (
              <div className="space-y-3">
                {customer.support.tickets.map(tkt => (
                  <div key={tkt.id} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-blue-400">{tkt.id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-800 text-slate-300">
                        {tkt.status}
                      </span>
                    </div>
                    <div className="font-medium text-slate-200 mt-1">{tkt.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-1 flex justify-between">
                      <span>Prioridade: {tkt.priority}</span>
                      <span>{new Date(tkt.openedAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interações WhatsApp & MaIA */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <MessageSquare size={15} className="text-emerald-400" />
              Interações WABA & MaIA Copilot
            </h3>

            <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status do WhatsApp:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={12} /> Conectado & Verificado
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total de Interações:</span>
                <span className="text-slate-200">{customer.support.whatsappInteractionsCount} conversas</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Último Contato:</span>
                <span className="text-slate-200">{new Date(customer.support.lastInteractionDate).toLocaleString('pt-BR')}</span>
              </div>
            </div>

            <div className="p-3 bg-blue-950/20 border border-blue-500/20 rounded-lg text-xs text-blue-300">
              <span className="font-semibold block flex items-center gap-1.5 mb-1">
                <Sparkles size={13} className="text-blue-400" />
                Triagem IA MaIA (Copiloto Ativo):
              </span>
              O cliente consultou o Pix da fatura no WhatsApp. A MaIA gerou o Pix Copia e Cola via ferramenta de integração Enlace-Pay de forma segura e autônoma.
            </div>
          </div>
        </div>
      )}

      {/* ABA 6: NOC & ZABBIX */}
      {activeTab === 'noc' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <span className="text-xs text-muted-foreground">Disponibilidade Anual</span>
            <div className="text-2xl font-bold font-outfit text-emerald-400 mt-1">
              {customer.noc.availabilityPercent}%
            </div>
            <span className="text-[11px] text-muted-foreground mt-1 block">
              Zabbix 7.0 LTS SLA Monitor
            </span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <span className="text-xs text-muted-foreground">Latência ICMP Média</span>
            <div className="text-2xl font-bold font-outfit text-sky-400 mt-1">
              {customer.noc.latencyMs} ms
            </div>
            <span className="text-[11px] text-muted-foreground mt-1 block">
              Perda de pacotes: {customer.noc.packetLossPercent}%
            </span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <span className="text-xs text-muted-foreground">Alertas Ativos</span>
            <div className="text-2xl font-bold font-outfit text-emerald-400 mt-1">
              {customer.noc.activeAlerts}
            </div>
            <span className="text-[11px] text-emerald-400 mt-1 block">
              Sem incidentes na OLT/PON
            </span>
          </div>
        </div>
      )}

      {/* MODAL: GERAR COBRANÇA PIX ENLACE-PAY */}
      {showPixModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold font-outfit text-foreground flex items-center gap-2">
              <CreditCard size={18} className="text-emerald-400" />
              Gerar Cobrança Pix (Enlace-Pay)
            </h3>
            <p className="text-xs text-muted-foreground">
              Esta ação cria uma cobrança oficial integrada com C6 Bank, gerando TXID e QR Code Copia e Cola para o assinante {customer.name}.
            </p>

            <form onSubmit={handleCreatePix} className="space-y-4 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">Valor da Cobrança (R$):</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={pixAmount}
                  onChange={(e) => setPixAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-foreground focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Data de Vencimento:</label>
                <input
                  type="date"
                  required
                  value={pixDueDate}
                  onChange={(e) => setPixDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-foreground focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPixModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition shadow-sm"
                >
                  Confirmar e Gerar Pix
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
