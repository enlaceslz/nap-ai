import React, { useState } from 'react';
import {
  Server,
  Plus,
  RefreshCw,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Activity,
  Cpu,
  Thermometer,
  Layers,
  Network,
  ChevronDown,
  ChevronUp,
  Terminal,
  Clock
} from 'lucide-react';
import { OltDevice, OltSlot, OltPonPort } from '../../types/olt';
import { oltApi } from '../../services/oltApi';

interface OltDevicesTabProps {
  olts: OltDevice[];
  loading: boolean;
  onRefresh: () => void;
  onOpenCreateModal: () => void;
  onEditOlt: (olt: OltDevice) => void;
}

export const OltDevicesTab: React.FC<OltDevicesTabProps> = ({
  olts,
  loading,
  onRefresh,
  onOpenCreateModal,
  onEditOlt
}) => {
  const [selectedOltId, setSelectedOltId] = useState<string | null>(olts[0]?.id || null);
  const [slots, setSlots] = useState<OltSlot[]>([]);
  const [pons, setPons] = useState<OltPonPort[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string; latency_ms?: number } | null>(null);
  const [discoveringId, setDiscoveringId] = useState<string | null>(null);

  const loadDetails = async (oltId: string) => {
    setSelectedOltId(oltId);
    setLoadingDetails(true);
    try {
      const [slotsData, ponsData] = await Promise.all([
        oltApi.getSlots(oltId),
        oltApi.getPons(oltId)
      ]);
      setSlots(slotsData);
      setPons(ponsData);
    } catch (e) {
      console.error('Erro ao carregar detalhes da OLT:', e);
    } finally {
      setLoadingDetails(false);
    }
  };

  React.useEffect(() => {
    if (olts.length > 0 && !selectedOltId) {
      loadDetails(olts[0].id);
    } else if (selectedOltId) {
      loadDetails(selectedOltId);
    }
  }, [olts]);

  const handleTestConnection = async (oltId: string) => {
    setTestingId(oltId);
    setTestResult(null);
    try {
      const res = await oltApi.testConnection(oltId);
      setTestResult({
        id: oltId,
        success: res.success,
        message: res.message,
        latency_ms: res.latency_ms
      });
      onRefresh();
    } catch (err: any) {
      setTestResult({
        id: oltId,
        success: false,
        message: err.message || 'Falha de comunicação com a OLT'
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleDiscovery = async (oltId: string) => {
    setDiscoveringId(oltId);
    try {
      await oltApi.runDiscovery(oltId);
      await loadDetails(oltId);
      onRefresh();
    } catch (err: any) {
      alert('Erro na descoberta de hardware: ' + err.message);
    } finally {
      setDiscoveringId(null);
    }
  };

  const handleDelete = async (olt: OltDevice) => {
    if (window.confirm(`Tem certeza que deseja remover a OLT "${olt.nome}"? Todas as portas e ONUs vinculadas serão removidas.`)) {
      try {
        await oltApi.deleteOlt(olt.id);
        onRefresh();
      } catch (err: any) {
        alert('Erro ao excluir: ' + err.message);
      }
    }
  };

  const activeOlt = olts.find((o) => o.id === selectedOltId) || olts[0];

  return (
    <div className="space-y-6">
      {/* Header com Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Server size={18} className="text-cyan-400" />
            Chassis & OLTs Cadastradas
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerenciamento de chassis multivendor com drivers de comunicação nativos (ZTE ZXROS e Huawei VRP).
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
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <Plus size={14} />
            Nova OLT
          </button>
        </div>
      </div>

      {/* Grid de Cartões de OLT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {olts.map((olt) => {
          const isSelected = olt.id === selectedOltId;
          const isTesting = testingId === olt.id;
          const isDiscovering = discoveringId === olt.id;
          const result = testResult?.id === olt.id ? testResult : null;

          return (
            <div
              key={olt.id}
              onClick={() => loadDetails(olt.id)}
              className={`p-5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500/60 ring-1 ring-cyan-500/20 shadow-lg'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-sm">{olt.nome}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        olt.fabricante === 'ZTE'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {olt.fabricante}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        olt.status === 'online'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${olt.status === 'online' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      {olt.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Modelo: <strong className="text-slate-300">{olt.modelo}</strong> • Protocolo: <strong className="text-slate-300">{olt.protocolo}</strong> (Porta {olt.porta})
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditOlt(olt);
                    }}
                    title="Editar OLT"
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(olt);
                    }}
                    title="Excluir OLT"
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Informações de Rede e POP */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 mb-3">
                <div>
                  <span className="text-[10px] text-slate-500 block">Endereço IP</span>
                  <span className="font-mono text-slate-300">{olt.ip}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">POP / Localização</span>
                  <span className="text-slate-300 truncate block" title={olt.pop}>{olt.pop || 'POP Central'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">CPU / Temp</span>
                  <span className="text-slate-300">{olt.cpu_usage ?? 20}% / {olt.temperatura ?? 40}°C</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">ONUs Ativas</span>
                  <span className="font-semibold text-emerald-400">{olt.onus_online ?? 0} / {olt.total_onus ?? 0}</span>
                </div>
              </div>

              {/* Resultado de Teste se houver */}
              {result && (
                <div
                  className={`p-2.5 rounded-lg text-xs mb-3 flex items-center justify-between ${
                    result.success
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {result.success ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                    <span>{result.message}</span>
                  </div>
                  {result.latency_ms !== undefined && (
                    <span className="font-mono text-[11px] font-bold">{result.latency_ms} ms</span>
                  )}
                </div>
              )}

              {/* Ações de Hardware */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock size={12} />
                  <span>Uptime: {olt.uptime || '99.9%'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTestConnection(olt.id);
                    }}
                    disabled={isTesting}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors disabled:opacity-50"
                  >
                    <Activity size={12} className={isTesting ? 'animate-spin' : 'text-cyan-400'} />
                    {isTesting ? 'Testando...' : 'Testar Conexão'}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDiscovery(olt.id);
                    }}
                    disabled={isDiscovering}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={isDiscovering ? 'animate-spin' : 'text-amber-400'} />
                    {isDiscovering ? 'Sincronizando...' : 'Descoberta HW'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Painel Inferior: Slots, Placas e Portas PON da OLT Selecionada */}
      {activeOlt && (
        <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers size={16} className="text-cyan-400" />
                Hardware da OLT: {activeOlt.nome} ({activeOlt.fabricante} {activeOlt.modelo})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Topologia de slots, placas de controle, placas GPON/XGS-PON e portas ópticas configuradas.
              </p>
            </div>
            <span className="text-xs text-slate-400">
              Total de Portas PON: <strong className="text-white">{pons.length}</strong>
            </span>
          </div>

          {loadingDetails ? (
            <div className="py-12 text-center text-xs text-slate-500">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-cyan-500" />
              Carregando inventário de slots e portas da OLT...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Inventário de Slots */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
                  <Cpu size={14} className="text-slate-400" />
                  Placas & Slots Instalados
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-white">
                          Slot {slot.slot_number}: {slot.card_model}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Tipo: {slot.card_type} • Portas: {slot.ports_active}/{slot.total_ports}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 uppercase">
                        {slot.card_status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabela de Portas PON */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
                  <Network size={14} className="text-slate-400" />
                  Portas PON Ativas & Assinantes
                </h4>

                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4">Porta PON</th>
                        <th className="py-2.5 px-4">Tecnologia</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4">ONUs Totais</th>
                        <th className="py-2.5 px-4">Online / Offline</th>
                        <th className="py-2.5 px-4">Sinal TX Médio</th>
                        <th className="py-2.5 px-4">VLAN Padrão</th>
                        <th className="py-2.5 px-4">Descrição / Rota</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {pons.map((pon) => (
                        <tr key={pon.id} className="hover:bg-slate-850/60 transition-colors">
                          <td className="py-2.5 px-4 font-mono font-bold text-white">
                            {pon.pon_identifier}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400">
                              {pon.tecnologia}
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              {pon.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-white">
                            {pon.onus_total}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="text-emerald-400 font-medium">{pon.onus_online}</span>
                            <span className="text-slate-500"> / </span>
                            <span className={pon.onus_offline > 0 ? 'text-rose-400 font-medium' : 'text-slate-400'}>
                              {pon.onus_offline}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-300">
                            {pon.tx_power ? `+${pon.tx_power} dBm` : '+2.8 dBm'}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-300">
                            {pon.vlan_default || '100'}
                          </td>
                          <td className="py-2.5 px-4 text-slate-400 truncate max-w-xs">
                            {pon.descricao || 'Sem descrição'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
