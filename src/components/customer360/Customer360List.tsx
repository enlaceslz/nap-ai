import React, { useState, useMemo } from 'react';
import { 
  Search, Users, Filter, CheckCircle2, AlertTriangle, 
  ChevronRight, Radio, Wifi, CreditCard, ExternalLink, ArrowUpDown
} from 'lucide-react';
import type { NapCustomer360 } from '../../types';

interface Props {
  customers: NapCustomer360[];
  onSelectCustomer: (customerId: number) => void;
  isLoading: boolean;
}

export default function Customer360List({
  customers,
  onSelectCustomer,
  isLoading
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'active' | 'blocked' | 'defaulters'>('todos');

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      // Filtro de status
      if (statusFilter === 'active' && c.status !== 'active') return false;
      if (statusFilter === 'blocked' && c.status !== 'blocked') return false;
      if (statusFilter === 'defaulters' && c.financial.totalPending <= 0) return false;

      // Busca textual
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.document.includes(q) ||
        c.phone.includes(q) ||
        c.contract.contractId.toLowerCase().includes(q) ||
        c.technical.ipPppoe.includes(q) ||
        c.napCustomerId.toLowerCase().includes(q) ||
        c.externalReferences.some(r => r.externalCustomerId.toLowerCase().includes(q))
      );
    });
  }, [customers, searchTerm, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Controles de Busca e Filtros */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Barra de Busca Universal */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Buscar por Nome, CPF/CNPJ, Contrato, IP, Telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-blue-500 transition"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              × Limpar
            </button>
          )}
        </div>

        {/* Filtros Rápidos */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
            <Filter size={13} /> Filtrar:
          </span>
          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
              statusFilter === 'todos'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-muted-foreground hover:bg-slate-800'
            }`}
          >
            Todos ({customers.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-muted-foreground hover:bg-slate-800'
            }`}
          >
            Ativos ({customers.filter(c => c.status === 'active').length})
          </button>
          <button
            onClick={() => setStatusFilter('blocked')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
              statusFilter === 'blocked'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-muted-foreground hover:bg-slate-800'
            }`}
          >
            Bloqueados ({customers.filter(c => c.status === 'blocked').length})
          </button>
          <button
            onClick={() => setStatusFilter('defaulters')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
              statusFilter === 'defaulters'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-muted-foreground hover:bg-slate-800'
            }`}
          >
            Inadimplentes ({customers.filter(c => c.financial.totalPending > 0).length})
          </button>
        </div>
      </div>

      {/* Tabela de Assinantes */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-xs">
            Carregando base de clientes sincronizada...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Users size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">Nenhum cliente encontrado para os critérios informados.</p>
            <p className="text-xs text-muted-foreground mt-1">Tente pesquisar por parte do nome, CPF ou número do contrato.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-muted-foreground">
                  <th className="py-3 px-4 font-semibold">Assinante & Identificação</th>
                  <th className="py-3 px-4 font-semibold">Sistemas Externos (ERP)</th>
                  <th className="py-3 px-4 font-semibold">Contrato & Plano</th>
                  <th className="py-3 px-4 font-semibold">Conexão & Sinal Óptico</th>
                  <th className="py-3 px-4 font-semibold">Situação Financeira</th>
                  <th className="py-3 px-4 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCustomers.map(customer => {
                  const hasPending = customer.financial.totalPending > 0;
                  return (
                    <tr 
                      key={customer.id} 
                      className="hover:bg-slate-800/40 transition cursor-pointer group"
                      onClick={() => onSelectCustomer(customer.id)}
                    >
                      {/* Assinante */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground text-sm group-hover:text-blue-400 transition flex items-center gap-2">
                          {customer.name}
                          {customer.status === 'active' ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Ativo" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-amber-500" title="Bloqueado" />
                          )}
                        </div>
                        <div className="text-muted-foreground text-[11px] mt-0.5">
                          CPF: {customer.document} • <span className="font-mono text-slate-400">{customer.napCustomerId}</span>
                        </div>
                      </td>

                      {/* ERP Externo */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {customer.externalReferences.map(ref => (
                            <span
                              key={ref.externalSystem}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${
                                ref.externalSystem === 'sgp'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : ref.externalSystem === 'ixc'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                  : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              }`}
                            >
                              {ref.externalSystem}: #{ref.externalCustomerId}
                            </span>
                          ))}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Sincronizado via Webhook/API
                        </div>
                      </td>

                      {/* Contrato & Plano */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-200">
                          {customer.contract.planName}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <span>{customer.contract.speedDown}</span> • <span>Contrato {customer.contract.contractId}</span>
                        </div>
                      </td>

                      {/* Conexão & Sinal Óptico */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono">
                          <Wifi size={12} className={customer.technical.onuState === 'online' ? 'text-emerald-400' : 'text-red-400'} />
                          <span className={customer.technical.onuState === 'online' ? 'text-emerald-400' : 'text-red-400'}>
                            {customer.technical.onuState.toUpperCase()}
                          </span>
                          <span className="text-slate-500">|</span>
                          <span className="text-slate-300">{customer.technical.opticalPowerRx}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          IP: {customer.technical.ipPppoe} • PON {customer.technical.pon}
                        </div>
                      </td>

                      {/* Situação Financeira */}
                      <td className="py-3 px-4">
                        {hasPending ? (
                          <div>
                            <span className="text-xs font-semibold text-amber-400">
                              R$ {customer.financial.totalPending.toFixed(2)}
                            </span>
                            <div className="text-[10px] text-red-400 flex items-center gap-1 mt-0.5">
                              <AlertTriangle size={10} /> Fatura em Aberto
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="text-xs font-semibold text-emerald-400">
                              Em dia
                            </span>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              Total Pago: R$ {customer.financial.totalPaid.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Ação */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCustomer(customer.id);
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition flex items-center gap-1 ml-auto shadow-sm"
                        >
                          Visão 360 <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
