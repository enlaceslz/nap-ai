import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { 
  Users, CreditCard, ShieldCheck, Database, LayoutDashboard, 
  RefreshCw, CheckCircle2, AlertTriangle 
} from 'lucide-react';
import type { NapCustomer360 } from '../../types';
import Customer360Dashboard from '../../components/customer360/Customer360Dashboard';
import Customer360List from '../../components/customer360/Customer360List';
import Customer360Detail from '../../components/customer360/Customer360Detail';
import Customer360Reconciliation from '../../components/customer360/Customer360Reconciliation';
import Customer360AuthorityMatrix from '../../components/customer360/Customer360AuthorityMatrix';

export default function Customer360() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'detail' | 'reconciliation' | 'authority'>('dashboard');
  const [customers, setCustomers] = useState<NapCustomer360[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<NapCustomer360 | null>(null);
  
  const [metrics, setMetrics] = useState({
    customers: { total: 3, active: 3, blocked: 0, defaulters: 1 },
    financial: { openChargesCount: 1, openChargesAmount: 119.90, pixReceivedCount: 2, pixReceivedAmount: 189.90, pendingErpBaixasCount: 1, reconciledCount: 2, divergencesCount: 0 },
    support: { openTickets: 1, delayedTickets: 0, whatsappInteractions: 8, asteriskCalls: 3 },
    noc: { offlineCustomers: 0, offlineOnus: 0, criticalAlerts: 0, averageAvailability: 99.97 }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isReconciling, setIsReconciling] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Carregar lista de clientes e métricas
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [resCust, resMet] = await Promise.all([
        fetch('/api/customers').then(r => r.json()),
        fetch('/api/customer360/dashboard').then(r => r.json())
      ]);

      if (resCust?.customers) {
        setCustomers(resCust.customers);
      }
      if (resMet) {
        setMetrics(resMet);
      }
    } catch (err) {
      console.error("[Customer360] Erro ao carregar dados:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Selecionar cliente por ID (da rota, busca ou fallback)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['dashboard', 'list', 'detail', 'reconciliation', 'authority'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
    const idParam = id || searchParams.get('id');
    const cid = idParam ? parseInt(idParam) : selectedCustomerId;
    if (cid && customers.length > 0) {
      const found = customers.find(c => c.id === cid);
      if (found) {
        setSelectedCustomer(found);
        setSelectedCustomerId(cid);
        if (!tabParam) {
          setActiveTab('detail');
        }
      }
    } else if (activeTab === 'detail' && !selectedCustomer && customers.length > 0) {
      setSelectedCustomer(customers[0]);
      setSelectedCustomerId(customers[0].id);
    }
  }, [id, searchParams, selectedCustomerId, customers, activeTab, selectedCustomer]);

  const handleSelectCustomer = (cid: number) => {
    setSelectedCustomerId(cid);
    const found = customers.find(c => c.id === cid);
    if (found) {
      setSelectedCustomer(found);
      setActiveTab('detail');
    }
  };

  const handleRefreshCustomer = async () => {
    if (!selectedCustomerId) return;
    try {
      const res = await fetch(`/api/customers/${selectedCustomerId}`).then(r => r.json());
      if (res?.id) {
        setSelectedCustomer(res);
        setCustomers(prev => prev.map(c => c.id === res.id ? res : c));
        // Atualiza métricas
        fetch('/api/customer360/dashboard')
          .then(r => r.json())
          .then(m => m && setMetrics(m))
          .catch(console.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Simular Pagamento Bancário (Webhook C6)
  const handleSimulatePayment = async (txid: string, amount: number) => {
    try {
      const res = await fetch('/api/payments/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txid,
          valor: amount,
          idTransacaoBancaria: `C6_SIM_${Date.now()}`,
          banco: 'C6 Bank S.A.'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Webhook C6 processado com sucesso! Idempotência confirmada e baixa enviada ao ERP.`, 'success');
      } else {
        showToast(data.message || 'Falha no webhook bancário', 'error');
      }
      await loadInitialData();
      await handleRefreshCustomer();
    } catch (err: any) {
      showToast(`Erro na simulação: ${err.message}`, 'error');
    }
  };

  // 2. Disparar Reboot Remoto ONT via TR-069
  const handleRebootOnu = async () => {
    if (!selectedCustomer) return;
    try {
      const res = await fetch(`/api/customers/${selectedCustomer.id}/actions/reboot-onu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator: 'Operador CRM DJD' })
      });
      const data = await res.json();
      showToast(data.message || 'Comando TR-069 enviado com sucesso!', 'info');
      await handleRefreshCustomer();
    } catch (err: any) {
      showToast(`Erro ao reiniciar ONT: ${err.message}`, 'error');
    }
  };

  // 3. Gerar Cobrança Pix via Enlace-Pay
  const handleGeneratePix = async (amount: number, dueDate: string) => {
    if (!selectedCustomer) return;
    try {
      const res = await fetch('/api/payments/charges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          externalInvoiceId: `${selectedCustomer.contract.contractId}_${Date.now()}`,
          amount,
          dueDate,
          externalSystem: selectedCustomer.externalReferences[0]?.externalSystem || 'sgp'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Cobrança Pix de R$ ${amount.toFixed(2)} gerada via Enlace-Pay com TXID oficial.`, 'success');
      }
      await loadInitialData();
      await handleRefreshCustomer();
    } catch (err: any) {
      showToast(`Erro ao gerar Pix: ${err.message}`, 'error');
    }
  };

  // 4. Executar Reconciliação Geral
  const handleTriggerReconciliation = async () => {
    setIsReconciling(true);
    try {
      const res = await fetch('/api/payments/reconcile', { method: 'POST' }).then(r => r.json());
      if (res.success) {
        showToast(`Reconciliação concluída: ${res.report.reconciledCount} transações conciliadas.`, 'success');
      }
      await loadInitialData();
      if (selectedCustomer) await handleRefreshCustomer();
    } catch (err: any) {
      showToast(`Erro na reconciliação: ${err.message}`, 'error');
    } finally {
      setIsReconciling(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-xl text-xs font-medium flex items-center gap-2 border transition-all ${
          toastMsg.type === 'success' 
            ? 'bg-emerald-950 border-emerald-700 text-emerald-200'
            : toastMsg.type === 'error'
            ? 'bg-red-950 border-red-700 text-red-200'
            : 'bg-blue-950 border-blue-700 text-blue-200'
        }`}>
          <CheckCircle2 size={16} />
          {toastMsg.text}
        </div>
      )}

      {/* Barra Superior Principal de Abas da Suite Customer 360 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold font-outfit text-foreground">
              Customer 360 &amp; Enlace-Pay
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
              PRD TELECOM
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Visão 360° do cliente, gestão de pagamentos Pix resiliente e sincronização contínua SGP / IXC / HubSoft.
          </p>
        </div>

        {/* Abas Principais */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 p-1 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutDashboard size={13} />
            Dashboard 360
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users size={13} />
            Base Assinantes ({customers.length})
          </button>

          {selectedCustomer && (
            <button
              onClick={() => setActiveTab('detail')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                activeTab === 'detail'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users size={13} />
              Visão: {selectedCustomer.name.split(' ')[0]}
            </button>
          )}

          <button
            onClick={() => setActiveTab('reconciliation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
              activeTab === 'reconciliation'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShieldCheck size={13} />
            Reconciliação &amp; Baixa
          </button>

          <button
            onClick={() => setActiveTab('authority')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
              activeTab === 'authority'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Database size={13} />
            Matriz de Autoridade
          </button>
        </div>
      </div>

      {/* Renderização Condicional da Aba Ativa */}
      {activeTab === 'dashboard' && (
        <Customer360Dashboard
          metrics={metrics}
          onNavigateTab={(tab) => setActiveTab(tab as any)}
          onSelectCustomer={handleSelectCustomer}
          onTriggerReconciliation={handleTriggerReconciliation}
          isReconciling={isReconciling}
        />
      )}

      {activeTab === 'list' && (
        <Customer360List
          customers={customers}
          onSelectCustomer={handleSelectCustomer}
          isLoading={isLoading}
        />
      )}

      {activeTab === 'detail' && selectedCustomer && (
        <Customer360Detail
          customer={selectedCustomer}
          onBack={() => setActiveTab('list')}
          onRefresh={handleRefreshCustomer}
          onSimulatePayment={handleSimulatePayment}
          onRebootOnu={handleRebootOnu}
          onGeneratePix={handleGeneratePix}
        />
      )}

      {activeTab === 'detail' && !selectedCustomer && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20">
            <Users size={22} />
          </div>
          <div className="max-w-md mx-auto">
            <h4 className="text-base font-semibold text-slate-200">Nenhum assinante selecionado</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Selecione um cliente na lista ou faça uma busca por CPF, nome ou código do contrato para visualizar a ficha 360 completa.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('list')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition shadow-sm"
          >
            Abrir Base de Assinantes
          </button>
        </div>
      )}

      {activeTab === 'reconciliation' && (
        <Customer360Reconciliation
          onTriggerReconciliation={handleTriggerReconciliation}
          isReconciling={isReconciling}
        />
      )}

      {activeTab === 'authority' && (
        <Customer360AuthorityMatrix />
      )}
    </div>
  );
}
