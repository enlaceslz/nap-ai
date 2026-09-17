import React, { useState } from 'react';
import {
  Search,
  RefreshCw,
  Power,
  Lock,
  Unlock,
  Trash2,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Cpu,
  Sliders,
  Sparkles,
  ExternalLink,
  Layers,
  ChevronRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { OnuDevice, OpticalTelemetry, OnuDiagnosticResult } from '../../types/olt';
import { oltApi } from '../../services/oltApi';

interface OnuManagementTabProps {
  onus: OnuDevice[];
  loading: boolean;
  onRefresh: () => void;
  onOpenAuthorizeModal: () => void;
  onOpenBatchModal: (selectedIds: string[]) => void;
}

export const OnuManagementTab: React.FC<OnuManagementTabProps> = ({
  onus,
  loading,
  onRefresh,
  onOpenAuthorizeModal,
  onOpenBatchModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOnuIds, setSelectedOnuIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modais de Diagnóstico e Telemetria
  const [telemetryModal, setTelemetryModal] = useState<{ onu: OnuDevice; data: OpticalTelemetry } | null>(null);
  const [diagnosticModal, setDiagnosticModal] = useState<{ onu: OnuDevice; data: OnuDiagnosticResult } | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Filtragem
  const filteredOnus = onus.filter((onu) => {
    // Filtro de Status
    if (statusFilter === 'online' && onu.status !== 'online') return false;
    if (statusFilter === 'offline' && onu.status !== 'offline') return false;
    if (statusFilter === 'blocked' && onu.status !== 'blocked') return false;
    if (statusFilter === 'alert' && onu.rx_onu > -24) return false;

    // Busca textual
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase().trim();
    return (
      onu.serial.toLowerCase().includes(q) ||
      (onu.mac && onu.mac.toLowerCase().includes(q)) ||
      onu.nome.toLowerCase().includes(q) ||
      (onu.cliente_nome && onu.cliente_nome.toLowerCase().includes(q)) ||
      (onu.cliente_cpf && onu.cliente_cpf.includes(q)) ||
      onu.pon_identifier.toLowerCase().includes(q) ||
      (onu.olt_nome && onu.olt_nome.toLowerCase().includes(q)) ||
      String(onu.onu_id) === q ||
      String(onu.vlan) === q
    );
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOnuIds(filteredOnus.map((o) => o.id));
    } else {
      setSelectedOnuIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedOnuIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleReboot = async (onu: OnuDevice) => {
    if (!window.confirm(`Deseja enviar comando de reinicialização para a ONU ${onu.serial}?`)) return;
    setActionLoading(onu.id);
    try {
      await oltApi.rebootOnu(onu.id);
      alert(`Comando de reinicialização enviado com sucesso para a ONU ${onu.serial}!`);
      onRefresh();
    } catch (err: any) {
      alert('Erro ao reiniciar: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleBlock = async (onu: OnuDevice) => {
    const isBlocked = onu.status === 'blocked';
    const action = isBlocked ? 'desbloquear' : 'bloquear';
    if (!window.confirm(`Deseja realmente ${action} a ONU ${onu.serial}?`)) return;

    setActionLoading(onu.id);
    try {
      if (isBlocked) {
        await oltApi.enableOnu(onu.id);
      } else {
        await oltApi.disableOnu(onu.id);
      }
      onRefresh();
    } catch (err: any) {
      alert(`Erro ao ${action}: ` + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (onu: OnuDevice) => {
    if (!window.confirm(`Tem certeza que deseja desprovisionar e remover a ONU ${onu.serial} da OLT?`)) return;

    setActionLoading(onu.id);
    try {
      await oltApi.deleteOnu(onu.id);
      alert(`ONU ${onu.serial} removida com sucesso.`);
      onRefresh();
    } catch (err: any) {
      alert('Erro ao remover: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewTelemetry = async (onu: OnuDevice) => {
    setModalLoading(true);
    try {
      const data = await oltApi.getOpticalInfo(onu.id);
      setTelemetryModal({ onu, data });
    } catch (err: any) {
      alert('Erro ao consultar telemetria óptica: ' + err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleRunDiagnostics = async (onu: OnuDevice) => {
    setModalLoading(true);
    try {
      const data = await oltApi.runDiagnostics(onu.id);
      setDiagnosticModal({ onu, data });
    } catch (err: any) {
      alert('Erro ao executar diagnóstico da ONU: ' + err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const getSignalBadge = (rx: number) => {
    if (rx <= -35) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          LOS (Sem Sinal)
        </span>
      );
    }
    if (rx <= -27) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          {rx} dBm (Crítico)
        </span>
      );
    }
    if (rx <= -24) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          {rx} dBm (Alerta)
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        {rx} dBm (Excelente)
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtros e Ações */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Cpu size={18} className="text-cyan-400" />
              Gestão de ONUs & Clientes Ópticos (GPON)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Busca universal por Serial, MAC, Nome do Cliente, OLT, Porta PON ou VLAN.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Atualizar
            </button>
            <button
              onClick={onOpenAuthorizeModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <UserCheck size={14} />
              Provisionar Nova ONU
            </button>
          </div>
        </div>

        {/* Inputs de Pesquisa e Filtros */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por Serial (ZTEGC..., 4857...), Nome do Cliente, CPF, PON (1/3/1), VLAN..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Filtro de Status */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                statusFilter === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas ({onus.length})
            </button>
            <button
              onClick={() => setStatusFilter('online')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                statusFilter === 'online' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Online ({onus.filter((o) => o.status === 'online').length})
            </button>
            <button
              onClick={() => setStatusFilter('offline')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                statusFilter === 'offline' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Offline ({onus.filter((o) => o.status === 'offline').length})
            </button>
            <button
              onClick={() => setStatusFilter('alert')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                statusFilter === 'alert' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sinal Alerta (&lt; -24 dBm)
            </button>
          </div>

          {/* Botão de Ação em Lote */}
          {selectedOnuIds.length > 0 && (
            <button
              onClick={() => onOpenBatchModal(selectedOnuIds)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors shadow"
            >
              <Sliders size={13} />
              Ações em Lote ({selectedOnuIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Tabela de ONUs */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedOnuIds.length > 0 && selectedOnuIds.length === filteredOnus.length}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Cliente / Assinante</th>
                <th className="py-3 px-4">Serial / Modelo</th>
                <th className="py-3 px-4">OLT & Interface PON</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Potência RX (ONU)</th>
                <th className="py-3 px-4">VLAN / IP</th>
                <th className="py-3 px-4">Distância</th>
                <th className="py-3 px-4 text-right">Ações Técnicas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredOnus.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    Nenhuma ONU encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredOnus.map((onu) => {
                  const isSelected = selectedOnuIds.includes(onu.id);
                  const isBusy = actionLoading === onu.id;

                  return (
                    <tr
                      key={onu.id}
                      className={`hover:bg-slate-850/60 transition-colors ${
                        isSelected ? 'bg-cyan-500/5' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(onu.id)}
                          className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Cliente */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">
                          {onu.cliente_nome || onu.nome}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {onu.cliente_cpf ? `CPF: ${onu.cliente_cpf}` : `ID: ${onu.id}`}
                        </div>
                      </td>

                      {/* Serial */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-white flex items-center gap-1.5">
                          {onu.serial}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {onu.modelo || 'ONU GPON'} {onu.mac ? `• ${onu.mac}` : ''}
                        </div>
                      </td>

                      {/* OLT & PON */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">
                          {onu.olt_nome}
                        </div>
                        <div className="text-[11px] text-cyan-400 font-mono">
                          PON: {onu.pon_identifier} • ID: {onu.onu_id}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {onu.status === 'online' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            ONLINE
                          </span>
                        )}
                        {onu.status === 'offline' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            OFFLINE
                          </span>
                        )}
                        {onu.status === 'blocked' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400">
                            BLOQUEADA
                          </span>
                        )}
                      </td>

                      {/* Potência RX */}
                      <td className="py-3 px-4">
                        {getSignalBadge(onu.rx_onu)}
                      </td>

                      {/* VLAN / IP */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-300">
                          VLAN {onu.vlan}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {onu.ip_address || 'DHCP/PPPoE'}
                        </div>
                      </td>

                      {/* Distância */}
                      <td className="py-3 px-4 text-slate-300 font-mono">
                        {onu.distancia_metros} m
                      </td>

                      {/* Ações Técnicas */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewTelemetry(onu)}
                            disabled={modalLoading || isBusy}
                            title="Potência Óptica ao Vivo"
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
                          >
                            <Activity size={14} />
                          </button>

                          <button
                            onClick={() => handleRunDiagnostics(onu)}
                            disabled={modalLoading || isBusy}
                            title="Diagnóstico Completo (IA & Ping)"
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-indigo-400 transition-colors"
                          >
                            <Sparkles size={14} />
                          </button>

                          <button
                            onClick={() => handleReboot(onu)}
                            disabled={isBusy}
                            title="Reiniciar ONU Remotamente"
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                          >
                            <Power size={14} />
                          </button>

                          <button
                            onClick={() => handleToggleBlock(onu)}
                            disabled={isBusy}
                            title={onu.status === 'blocked' ? 'Desbloquear ONU' : 'Bloquear ONU'}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          >
                            {onu.status === 'blocked' ? <Unlock size={14} className="text-emerald-400" /> : <Lock size={14} />}
                          </button>

                          <button
                            onClick={() => handleDelete(onu)}
                            disabled={isBusy}
                            title="Desprovisionar ONU"
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Telemetria Óptica */}
      {telemetryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Activity size={18} className="text-cyan-400" />
                  Telemetria Óptica em Tempo Real
                </h3>
                <p className="text-xs text-slate-400">
                  {telemetryModal.onu.cliente_nome} • Serial: {telemetryModal.onu.serial}
                </p>
              </div>
              <button
                onClick={() => setTelemetryModal(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Gauges e Leituras */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block mb-1">Sinal RX na ONU</span>
                <span className="text-2xl font-bold font-mono text-cyan-400">
                  {telemetryModal.data.rx_onu} dBm
                </span>
                <div className="mt-1">{getSignalBadge(telemetryModal.data.rx_onu)}</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block mb-1">Sinal TX da ONU</span>
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  +{telemetryModal.data.tx_onu} dBm
                </span>
                <div className="mt-1 text-[11px] text-slate-400">Potência do Laser</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block mb-1">Distância Óptica</span>
                <span className="text-xl font-bold font-mono text-white">
                  {telemetryModal.data.distancia_metros} metros
                </span>
                <div className="mt-1 text-[11px] text-slate-400">Comprimento da fibra</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block mb-1">Temperatura do Módulo</span>
                <span className="text-xl font-bold font-mono text-amber-400">
                  {telemetryModal.data.temperatura}°C
                </span>
                <div className="mt-1 text-[11px] text-slate-400">Voltagem: {telemetryModal.data.voltagem_v}V</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <span>OLT: <strong className="text-slate-200">{telemetryModal.onu.olt_nome}</strong></span>
              <span>Porta PON: <strong className="text-cyan-400">{telemetryModal.onu.pon_identifier}</strong></span>
              <span>ONU ID: <strong className="text-slate-200">{telemetryModal.onu.onu_id}</strong></span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setTelemetryModal(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Diagnóstico Avançado (com Sugestão IA e Histórico) */}
      {diagnosticModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Sparkles size={18} className="text-indigo-400" />
                  Diagnóstico Completo & Parecer Técnico IA
                </h3>
                <p className="text-xs text-slate-400">
                  {diagnosticModal.onu.cliente_nome} • {diagnosticModal.onu.serial}
                </p>
              </div>
              <button
                onClick={() => setDiagnosticModal(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Parecer do Agente Gemini */}
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-indigo-300">
                <Sparkles size={14} />
                <span>Análise do Cérebro Gemini NOC</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {diagnosticModal.data.sugestao_ia || 'Enlace óptico em excelente conformidade com padrões ITU-T G.984.'}
              </p>
            </div>

            {/* Métricas de Rede */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
                <span className="text-slate-400 block mb-1">Ping de Enlace</span>
                <span className={`font-bold font-mono text-sm ${diagnosticModal.data.ping_ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {diagnosticModal.data.ping_ok ? 'Respondendo' : 'Inacessível'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
                <span className="text-slate-400 block mb-1">Latência Média</span>
                <span className="font-bold font-mono text-sm text-cyan-400">
                  {diagnosticModal.data.latencia_ms} ms
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
                <span className="text-slate-400 block mb-1">Perda de Pacotes</span>
                <span className="font-bold font-mono text-sm text-slate-200">
                  {diagnosticModal.data.perda_pacotes_percent}%
                </span>
              </div>
            </div>

            {/* Histórico Recente de Potência Óptica */}
            <div>
              <h4 className="text-xs font-semibold text-slate-300 mb-2">
                Histórico Recente de Atenuação (Amostragens)
              </h4>
              <div className="space-y-1.5 text-xs">
                {diagnosticModal.data.historico_potencia.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/80"
                  >
                    <span className="text-slate-400">{item.data}</span>
                    <div className="flex items-center gap-4 font-mono">
                      <span>RX: <strong className="text-cyan-400">{item.rx} dBm</strong></span>
                      <span>TX: <strong className="text-emerald-400">+{item.tx} dBm</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDiagnosticModal(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
