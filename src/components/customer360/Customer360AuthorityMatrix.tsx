import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, RefreshCw, CheckCircle2, Layers, Cpu, Server, Building2, X } from 'lucide-react';
import type { DomainAuthorityRule } from '../../types';
import C6BankIntegrationModal from './C6BankIntegrationModal';

export default function Customer360AuthorityMatrix() {
  const [matrix, setMatrix] = useState<DomainAuthorityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [showC6Modal, setShowC6Modal] = useState(false);

  useEffect(() => {
    fetch('/api/customer360/authority-matrix')
      .then(r => r.json())
      .then(res => {
        setMatrix(res.matrix || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/customer360/authority-matrix', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matrix })
      });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSyncModeChange = (idx: number, newMode: any) => {
    const updated = [...matrix];
    updated[idx].syncMode = newMode;
    setMatrix(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header Matriz */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              PRD Seção 2 • Governança de Dados
            </span>
            <span className="text-xs text-muted-foreground">
              Prevenção de Duplicação Cega & Conflitos de Estado
            </span>
          </div>
          <h2 className="text-lg font-bold font-outfit text-foreground mt-1 flex items-center gap-2">
            <Database size={18} className="text-blue-400" />
            Matriz de Autoridade e Fontes de Verdade
          </h2>
          <p className="text-xs text-muted-foreground">
            Define com clareza o sistema mestre (Primary Source of Truth) para cada domínio operacional do ISP.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowC6Modal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 rounded-lg text-xs font-semibold transition shadow-sm"
          >
            <Building2 size={14} className="text-amber-400" />
            Configurar C6 Bank (Pix)
          </button>
          {savedMsg && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <CheckCircle2 size={13} /> Matriz salva com sucesso!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition shadow-sm disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar Configuração"}
          </button>
        </div>
      </div>

      {/* Tabela da Matriz */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-xs">
            Carregando matriz de autoridade...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-muted-foreground">
                  <th className="py-3 px-4 font-semibold">Domínio de Dados</th>
                  <th className="py-3 px-4 font-semibold">Descrição do Escopo</th>
                  <th className="py-3 px-4 font-semibold">Fonte Primária (Autoridade)</th>
                  <th className="py-3 px-4 font-semibold">Espelho / Secundária</th>
                  <th className="py-3 px-4 font-semibold">Modo de Sincronia</th>
                  <th className="py-3 px-4 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {matrix.map((rule, idx) => (
                  <tr key={rule.domain} className="hover:bg-slate-800/20 transition">
                    <td className="py-3 px-4 font-semibold text-slate-100 flex items-center gap-2">
                      <Cpu size={14} className="text-blue-400" />
                      {rule.domain}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {rule.description}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-300 font-semibold border border-blue-500/20 font-mono">
                        {rule.primarySource}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      {rule.secondarySource}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={rule.syncMode}
                        onChange={(e) => handleSyncModeChange(idx, e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                      >
                        <option value="webhook">Webhook em Tempo Real</option>
                        <option value="event_driven">Event-Driven (Fila)</option>
                        <option value="scheduled">Agendado (Cron 15m)</option>
                        <option value="manual">Manual / Sob Demanda</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit">
                        <CheckCircle2 size={11} /> ATIVO
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: INTEGRAÇÃO C6 BANK & ENLACE-PAY */}
      {showC6Modal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
          <div className="max-w-4xl w-full my-8 relative">
            <button
              onClick={() => setShowC6Modal(false)}
              className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition"
              title="Fechar"
            >
              <X size={18} />
            </button>
            <C6BankIntegrationModal />
          </div>
        </div>
      )}
    </div>
  );
}
