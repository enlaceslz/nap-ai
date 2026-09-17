import React from 'react';
import { 
  Users, CheckCircle2, AlertTriangle, XCircle, CreditCard, 
  ArrowUpRight, RefreshCw, Headphones, PhoneCall, MessageSquare, 
  Activity, Zap, ShieldCheck, Database, Layers
} from 'lucide-react';

interface DashboardMetrics {
  customers: {
    total: number;
    active: number;
    blocked: number;
    defaulters: number;
  };
  financial: {
    openChargesCount: number;
    openChargesAmount: number;
    pixReceivedCount: number;
    pixReceivedAmount: number;
    pendingErpBaixasCount: number;
    reconciledCount: number;
    divergencesCount: number;
  };
  support: {
    openTickets: number;
    delayedTickets: number;
    whatsappInteractions: number;
    asteriskCalls: number;
  };
  noc: {
    offlineCustomers: number;
    offlineOnus: number;
    criticalAlerts: number;
    averageAvailability: number;
  };
}

interface Props {
  metrics: DashboardMetrics;
  onNavigateTab: (tab: string) => void;
  onSelectCustomer: (customerId: number) => void;
  onTriggerReconciliation: () => void;
  isReconciling: boolean;
}

export default function Customer360Dashboard({
  metrics,
  onNavigateTab,
  onSelectCustomer,
  onTriggerReconciliation,
  isReconciling
}: Props) {
  return (
    <div className="space-y-6">
      {/* Banner de Boas-Vindas Operacional */}
      <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-500/20 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
              PRD Customer 360 & Enlace-Pay
            </span>
            <span className="text-xs text-muted-foreground">
              Fonte de Verdade Unificada • Espelho Operacional • Resiliência ERP
            </span>
          </div>
          <h2 className="text-xl font-bold font-outfit text-foreground mt-1">
            Centro Integrado de Operações & Customer 360
          </h2>
          <p className="text-sm text-muted-foreground">
            Convergência em tempo real entre SGP, IXC, HubSoft, Enlace-Pay (C6), GenieACS TR-069 e Zabbix 7.0 LTS.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onTriggerReconciliation}
            disabled={isReconciling}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={isReconciling ? "animate-spin" : ""} />
            {isReconciling ? "Conciliando..." : "Executar Conciliação"}
          </button>
          <button
            onClick={() => onNavigateTab('list')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition shadow-sm"
          >
            <Users size={14} />
            Buscar Assinante
          </button>
        </div>
      </div>

      {/* Grid 1: Clientes & Base */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold tracking-wider uppercase text-muted-foreground flex items-center gap-2">
            <Users size={15} className="text-blue-400" />
            1. Panorama da Base de Assinantes
          </h3>
          <button 
            onClick={() => onNavigateTab('list')} 
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            Ver todos os clientes <ArrowUpRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-muted-foreground">Total de Assinantes</span>
            <div className="text-2xl font-bold font-outfit text-foreground mt-1">
              {metrics?.customers?.total ?? 0}
            </div>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
              <Database size={11} /> Sincronizados com ERP
            </span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-muted-foreground">Clientes Ativos</span>
            <div className="text-2xl font-bold font-outfit text-emerald-400 mt-1">
              {metrics?.customers?.active ?? 0}
            </div>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
              <CheckCircle2 size={11} className="text-emerald-400" /> Acesso liberado
            </span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-muted-foreground">Bloqueados Financeiros</span>
            <div className="text-2xl font-bold font-outfit text-amber-400 mt-1">
              {metrics?.customers?.blocked ?? 0}
            </div>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
              <AlertTriangle size={11} className="text-amber-400" /> Atraso &gt; 15 dias
            </span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-muted-foreground">Inadimplência em Aberto</span>
            <div className="text-2xl font-bold font-outfit text-red-400 mt-1">
              {metrics?.customers?.defaulters ?? 0}
            </div>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
              <XCircle size={11} className="text-red-400" /> Faturas pendentes
            </span>
          </div>
        </div>
      </div>

      {/* Grid 2: Financeiro Pix Enlace-Pay & Reconciliação */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold tracking-wider uppercase text-muted-foreground flex items-center gap-2">
            <CreditCard size={15} className="text-emerald-400" />
            2. Operação Financeira Pix & Enlace-Pay (C6)
          </h3>
          <button 
            onClick={() => onNavigateTab('reconciliation')} 
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            Fila de Baixa & Divergências <ArrowUpRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-muted-foreground">Cobranças Abertas</span>
            <div className="text-2xl font-bold font-outfit text-amber-400 mt-1">
              {metrics?.financial?.openChargesCount ?? 0}
            </div>
            <div className="text-xs font-semibold text-slate-300 mt-1">
              R$ {(metrics?.financial?.openChargesAmount ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-muted-foreground">Pix Recebidos (Mês)</span>
            <div className="text-2xl font-bold font-outfit text-emerald-400 mt-1">
              {metrics?.financial?.pixReceivedCount ?? 0}
            </div>
            <div className="text-xs font-semibold text-emerald-300 mt-1">
              R$ {(metrics?.financial?.pixReceivedAmount ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-muted-foreground">Fila de Baixa no ERP</span>
            <div className="text-2xl font-bold font-outfit text-blue-400 mt-1">
              {metrics?.financial?.pendingErpBaixasCount ?? 0}
            </div>
            <span className="text-[11px] text-blue-300 flex items-center gap-1 mt-1">
              <Layers size={11} /> Resiliência ativa (Retry)
            </span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-muted-foreground">Conciliados (100%)</span>
            <div className="text-2xl font-bold font-outfit text-emerald-400 mt-1">
              {metrics?.financial?.reconciledCount ?? 0}
            </div>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
              <ShieldCheck size={11} /> Banco ↔ NAP ↔ ERP
            </span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-muted-foreground">Divergências</span>
            <div className="text-2xl font-bold font-outfit text-red-400 mt-1">
              {metrics?.financial?.divergencesCount ?? 0}
            </div>
            <span className="text-[11px] text-red-400 flex items-center gap-1 mt-1">
              <AlertTriangle size={11} /> Requer auditoria
            </span>
          </div>
        </div>
      </div>

      {/* Grid 3: Suporte, Atendimento & NOC */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Atendimento */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold tracking-wider uppercase text-muted-foreground flex items-center gap-2">
              <Headphones size={15} className="text-indigo-400" />
              3. Atendimento Omnichannel & Suporte
            </h3>
            <span className="text-xs text-muted-foreground">MaIA AI Copilot</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
              <span className="text-[11px] text-muted-foreground block">Chamados Abertos</span>
              <span className="text-xl font-bold text-foreground mt-1 block">
                {metrics?.support?.openTickets ?? 0}
              </span>
              <span className="text-[10px] text-emerald-400">Dentro do SLA</span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
              <span className="text-[11px] text-muted-foreground block">WhatsApp (WABA)</span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block flex items-center justify-center gap-1">
                <MessageSquare size={14} />
                {metrics?.support?.whatsappInteractions ?? 0}
              </span>
              <span className="text-[10px] text-muted-foreground">Mensagens hoje</span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
              <span className="text-[11px] text-muted-foreground block">Ligações Asterisk</span>
              <span className="text-xl font-bold text-indigo-400 mt-1 block flex items-center justify-center gap-1">
                <PhoneCall size={14} />
                {metrics?.support?.asteriskCalls ?? 0}
              </span>
              <span className="text-[10px] text-muted-foreground">URA & PABX</span>
            </div>
          </div>
        </div>

        {/* NOC & Qualidade de Rede */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold tracking-wider uppercase text-muted-foreground flex items-center gap-2">
              <Activity size={15} className="text-sky-400" />
              4. NOC & Telemetria Óptica (GenieACS / Zabbix)
            </h3>
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <Zap size={13} /> {metrics?.noc?.averageAvailability ?? 99.97}% Uptime
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
              <span className="text-[11px] text-muted-foreground block">Clientes Offline</span>
              <span className="text-xl font-bold text-slate-300 mt-1 block">
                {metrics?.noc?.offlineCustomers ?? 0}
              </span>
              <span className="text-[10px] text-muted-foreground">PPPoE Inativo</span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
              <span className="text-[11px] text-muted-foreground block">ONUs Offline</span>
              <span className="text-xl font-bold text-slate-300 mt-1 block">
                {metrics?.noc?.offlineOnus ?? 0}
              </span>
              <span className="text-[10px] text-muted-foreground">GenieACS TR-069</span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
              <span className="text-[11px] text-muted-foreground block">Alertas Zabbix</span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">
                {metrics?.noc?.criticalAlerts ?? 0}
              </span>
              <span className="text-[10px] text-emerald-400">Nenhum crítico</span>
            </div>
          </div>
        </div>
      </div>

      {/* Destaque: Assinantes de Demonstração Rápida */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">
          Acesso Rápido a Assinantes Homologados para o PRD:
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => onSelectCustomer(1)}
            className="flex items-center justify-between p-3 bg-slate-950/60 hover:bg-slate-800/50 border border-slate-800 rounded-lg text-left transition group"
          >
            <div>
              <div className="text-sm font-semibold text-foreground group-hover:text-blue-400 transition">
                João da Silva
              </div>
              <div className="text-xs text-muted-foreground">
                SGP #45821 • 500 Mega • R$ 100,00 (Pago)
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              SGP
            </span>
          </button>

          <button
            onClick={() => onSelectCustomer(2)}
            className="flex items-center justify-between p-3 bg-slate-950/60 hover:bg-slate-800/50 border border-slate-800 rounded-lg text-left transition group"
          >
            <div>
              <div className="text-sm font-semibold text-foreground group-hover:text-blue-400 transition">
                Maria Oliveira Santos
              </div>
              <div className="text-xs text-muted-foreground">
                IXC #9821 • 600 Mega • R$ 119,90 (Aberto)
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              IXC Soft
            </span>
          </button>

          <button
            onClick={() => onSelectCustomer(3)}
            className="flex items-center justify-between p-3 bg-slate-950/60 hover:bg-slate-800/50 border border-slate-800 rounded-lg text-left transition group"
          >
            <div>
              <div className="text-sm font-semibold text-foreground group-hover:text-blue-400 transition">
                Carlos Eduardo Mendes
              </div>
              <div className="text-xs text-muted-foreground">
                HubSoft #1029 • 400 Mega • R$ 89,90 (Pago)
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              HubSoft
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
