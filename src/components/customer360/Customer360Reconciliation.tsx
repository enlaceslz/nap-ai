import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, RefreshCw, AlertTriangle, CheckCircle2, Layers, 
  CreditCard, ExternalLink, Check, ArrowUpRight, Database, Building2
} from 'lucide-react';
import type { NapPaymentTransaction } from '../../types';
import C6BankIntegrationModal from './C6BankIntegrationModal';

interface Props {
  onTriggerReconciliation: () => void;
  isReconciling: boolean;
}

export default function Customer360Reconciliation({
  onTriggerReconciliation,
  isReconciling
}: Props) {
  const [data, setData] = useState<{
    divergences: any[];
    erpSyncQueue: any[];
    transactions: NapPaymentTransaction[];
  }>({
    divergences: [],
    erpSyncQueue: [],
    transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [showC6Config, setShowC6Config] = useState(false);

  const loadData = () => {
    setLoading(true);
    fetch('/api/customer360/reconciliation')
      .then(r => r.json())
      .then(res => {
        setData(res);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolveDivergence = async (id: string) => {
    setResolvingId(id);
    try {
      await fetch(`/api/customer360/reconciliation/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolvedBy: 'Operador Admin', resolutionNote: 'Auditoria aprovada' })
      });
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setResolvingId(null);
    }
  };

  const transactions = data?.transactions || [];
  const erpSyncQueue = data?.erpSyncQueue || [];
  const divergences = data?.divergences || [];

  return (
    <div className="space-y-6">
      {/* Header Reconciliação */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold font-outfit text-foreground flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-400" />
            Central de Reconciliação Financeira & Fila de Baixa
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Garante a integridade entre o Webhook bancário (C6 / Enlace-Pay), faturas no NAP e a baixa oficial no ERP.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowC6Config(!showC6Config)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition ${
              showC6Config
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Building2 size={14} className="text-amber-400" />
            {showC6Config ? "Ocultar Painel C6 Bank" : "Configurar Conta C6 Bank"}
          </button>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Atualizar
          </button>
          <button
            onClick={async () => {
              await onTriggerReconciliation();
              loadData();
            }}
            disabled={isReconciling}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={isReconciling ? "animate-spin" : ""} />
            {isReconciling ? "Executando Reconciliação..." : "Executar Reconciliação Geral"}
          </button>
        </div>
      </div>

      {/* Painel Expansível de Vinculação do C6 Bank */}
      {showC6Config && (
        <C6BankIntegrationModal onConfigSaved={loadData} />
      )}

      {/* Grid de Métricas da Reconciliação */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-muted-foreground">Transações Pix Confirmadas</span>
          <div className="text-2xl font-bold font-outfit text-emerald-400 mt-1">
            {transactions.length}
          </div>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
            <CheckCircle2 size={11} /> Webhooks processados com sucesso
          </span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-muted-foreground">Fila de Baixa no ERP (Resiliência)</span>
          <div className="text-2xl font-bold font-outfit text-blue-400 mt-1">
            {erpSyncQueue.filter(q => q.status === 'pending').length}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Prontas para re-envio automático
          </span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-muted-foreground">Divergências Financeiras</span>
          <div className="text-2xl font-bold font-outfit text-red-400 mt-1">
            {divergences.filter(d => d.status === 'divergent').length}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Requer análise de auditoria
          </span>
        </div>
      </div>

      {/* Fila de Baixa no ERP (Resiliência - PRD Seção 25) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Fila de Baixa Resiliente no ERP (SGP / IXC / HubSoft)
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            Idempotência com chave única &amp; política de backoff
          </span>
        </div>

        {erpSyncQueue.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs">
            Nenhuma baixa pendente na fila. Todas as transações foram entregues e confirmadas no ERP.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-muted-foreground">
                  <th className="py-3 px-4 font-semibold">ID Fila</th>
                  <th className="py-3 px-4 font-semibold">ERP Destino</th>
                  <th className="py-3 px-4 font-semibold">Fatura Externa</th>
                  <th className="py-3 px-4 font-semibold">Valor</th>
                  <th className="py-3 px-4 font-semibold">TXID Pix</th>
                  <th className="py-3 px-4 font-semibold">Tentativas</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {erpSyncQueue.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/20 transition">
                    <td className="py-3 px-4 text-slate-200">{item.id}</td>
                    <td className="py-3 px-4 uppercase text-blue-400 font-semibold">{item.externalSystem}</td>
                    <td className="py-3 px-4 text-slate-300">#{item.externalInvoiceId}</td>
                    <td className="py-3 px-4 text-emerald-400">R$ {Number(item.amount).toFixed(2)}</td>
                    <td className="py-3 px-4 text-slate-400">{item.txid}</td>
                    <td className="py-3 px-4 text-slate-300">{item.attempts} / 5</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fila de Divergências Detectadas (PRD Seção 22) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Fila de Divergências & Exceções
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            Auditoria LGPD & Resolução Manual
          </span>
        </div>

        {divergences.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs">
            Nenhuma divergência registrada. O ecossistema está 100% íntegro.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-muted-foreground">
                  <th className="py-3 px-4 font-semibold">ID</th>
                  <th className="py-3 px-4 font-semibold">TXID</th>
                  <th className="py-3 px-4 font-semibold">Valor Recebido</th>
                  <th className="py-3 px-4 font-semibold">Motivo da Divergência</th>
                  <th className="py-3 px-4 font-semibold">Detectado em</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {divergences.map(div => (
                  <tr key={div.id} className="hover:bg-slate-800/20 transition">
                    <td className="py-3 px-4 font-mono text-slate-300">{div.id}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{div.txid}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-200">
                      R$ {Number(div.receivedAmount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-red-400">{div.reason}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(div.detectedAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                        div.status === 'resolved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {div.status === 'resolved' ? 'RESOLVIDO' : 'DIVERGENTE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {div.status !== 'resolved' && (
                        <button
                          onClick={() => handleResolveDivergence(div.id)}
                          disabled={resolvingId === div.id}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-medium transition"
                        >
                          {resolvingId === div.id ? "Resolvendo..." : "Resolver"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Histórico Oficial de Transações Pix */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Transações Pix Confirmadas (C6 Bank / Enlace-Pay)
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-muted-foreground">
                <th className="py-3 px-4 font-semibold">ID Transação</th>
                <th className="py-3 px-4 font-semibold">TXID Bancário</th>
                <th className="py-3 px-4 font-semibold">Valor</th>
                <th className="py-3 px-4 font-semibold">Banco Liquidante</th>
                <th className="py-3 px-4 font-semibold">Origem</th>
                <th className="py-3 px-4 font-semibold">Data / Hora</th>
                <th className="py-3 px-4 font-semibold">Conciliação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {transactions.map(txn => (
                <tr key={txn.id} className="hover:bg-slate-800/20 transition">
                  <td className="py-3 px-4 text-slate-200">{txn.id}</td>
                  <td className="py-3 px-4 text-slate-400">{txn.txid}</td>
                  <td className="py-3 px-4 font-semibold text-emerald-400">R$ {Number(txn.amount).toFixed(2)}</td>
                  <td className="py-3 px-4 text-slate-300 font-sans">{txn.bank}</td>
                  <td className="py-3 px-4 text-muted-foreground font-sans">{txn.source}</td>
                  <td className="py-3 px-4 text-slate-400">{new Date(txn.receivedAt).toLocaleString('pt-BR')}</td>
                  <td className="py-3 px-4 font-sans">
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit">
                      <CheckCircle2 size={11} /> {txn.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
