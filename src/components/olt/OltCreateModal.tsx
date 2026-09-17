import React, { useState } from 'react';
import {
  Server,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Cpu,
  Key,
  Shield,
  MapPin
} from 'lucide-react';
import { OltDevice, OltFabricante, OltProtocolo } from '../../types/olt';
import { oltApi } from '../../services/oltApi';

interface OltCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  oltToEdit?: OltDevice | null;
  onSuccess: () => void;
}

export const OltCreateModal: React.FC<OltCreateModalProps> = ({
  isOpen,
  onClose,
  oltToEdit,
  onSuccess
}) => {
  const [nome, setNome] = useState(oltToEdit?.nome || '');
  const [fabricante, setFabricante] = useState<OltFabricante>(oltToEdit?.fabricante || 'ZTE');
  const [modelo, setModelo] = useState(oltToEdit?.modelo || 'C300');
  const [ip, setIp] = useState(oltToEdit?.ip || '10.200.1.10');
  const [porta, setPorta] = useState(oltToEdit?.porta || 22);
  const [protocolo, setProtocolo] = useState<OltProtocolo>(oltToEdit?.protocolo || 'SSH');
  const [usuario, setUsuario] = useState(oltToEdit?.usuario || 'admin');
  const [senha, setSenha] = useState('');
  const [snmpCommunity, setSnmpCommunity] = useState(oltToEdit?.snmp_community || 'public_nap');
  const [pop, setPop] = useState(oltToEdit?.pop || 'POP Central');
  const [localizacao, setLocalizacao] = useState(oltToEdit?.localizacao || 'Rack 01 - POP Central');
  const [descricao, setDescricao] = useState(oltToEdit?.descricao || '');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFabricanteChange = (fab: OltFabricante) => {
    setFabricante(fab);
    if (fab === 'ZTE') {
      setModelo('C300');
    } else if (fab === 'HUAWEI') {
      setModelo('MA5800-X7');
    } else if (fab === 'DATACOM') {
      setModelo('DM4610');
    } else if (fab === 'FIBERHOME') {
      setModelo('AN5516-04');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nome.trim() || !ip.trim()) {
      setErrorMsg('Nome da OLT e endereço IP são obrigatórios.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<OltDevice> = {
        nome: nome.trim(),
        fabricante,
        modelo: modelo.trim(),
        ip: ip.trim(),
        porta: Number(porta) || 22,
        protocolo,
        usuario: usuario.trim(),
        senha: senha || undefined,
        snmp_community: snmpCommunity.trim(),
        pop: pop.trim(),
        localizacao: localizacao.trim(),
        descricao: descricao.trim()
      };

      if (oltToEdit) {
        await oltApi.updateOlt(oltToEdit.id, payload);
      } else {
        await oltApi.createOlt(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Erro ao salvar configurações da OLT.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Server size={18} className="text-cyan-400" />
              {oltToEdit ? 'Editar OLT' : 'Cadastrar Nova OLT (Chassi GPON)'}
            </h3>
            <p className="text-xs text-slate-400">
              Configurações de rede e credenciais de acesso nativo (CLI / SSH).
            </p>
          </div>
          <button onClick={onClose} disabled={submitting} className="text-slate-400 hover:text-white text-lg font-bold">
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identificação Básica */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome de Identificação *
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: OLT-ZTE-CENTRAL"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Fabricante (Driver Nativo) *
              </label>
              <select
                value={fabricante}
                onChange={(e) => handleFabricanteChange(e.target.value as OltFabricante)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="ZTE">ZTE (Driver ZXROS)</option>
                <option value="HUAWEI">Huawei (Driver VRP)</option>
                <option value="VSOL">VSOL (Driver V1600)</option>
                <option value="DATACOM">Datacom (DmOS)</option>
                <option value="FIBERHOME">Fiberhome (FitOS)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Modelo do Chassi
              </label>
              <input
                type="text"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="C300, MA5800-X7"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Endereço IP de Gerência *
              </label>
              <input
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="10.200.1.10"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Porta & Protocolo
              </label>
              <div className="flex gap-2">
                <select
                  value={protocolo}
                  onChange={(e) => {
                    const p = e.target.value as OltProtocolo;
                    setProtocolo(p);
                    setPorta(p === 'SSH' ? 22 : 23);
                  }}
                  className="px-2 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="SSH">SSH</option>
                  <option value="TELNET">Telnet</option>
                </select>
                <input
                  type="number"
                  value={porta}
                  onChange={(e) => setPorta(Number(e.target.value))}
                  className="w-20 px-2 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Credenciais de Acesso */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Key size={13} className="text-cyan-400" />
              Credenciais de Acesso Administrativo (CLI)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Usuário
                </label>
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="admin"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Senha {oltToEdit ? '(Deixe em branco para manter)' : ''}
                </label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Comunidade SNMP (Leitura de Potência e Telemetria)
              </label>
              <input
                type="text"
                value={snmpCommunity}
                onChange={(e) => setSnmpCommunity(e.target.value)}
                placeholder="public_nap"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Localização e POP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                POP / Datacenter
              </label>
              <input
                type="text"
                value={pop}
                onChange={(e) => setPop(e.target.value)}
                placeholder="Ex: POP Centro, POP Zona Sul"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Posicionamento / Rack
              </label>
              <input
                type="text"
                value={localizacao}
                onChange={(e) => setLocalizacao(e.target.value)}
                placeholder="Rack 02, Unidade 24-30U"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors shadow disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Salvando OLT...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  Salvar OLT
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
